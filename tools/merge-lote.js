#!/usr/bin/env node
// Uso:
//   node tools/merge-lote.js <grupo.json> [--descartados "a,b"] [--data DD/MM/AAAA] [--dry-run]
//   node tools/merge-lote.js --listar
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const JSON_OUT = path.join(ROOT, 'data', 'interacoes.json');
const README = path.join(ROOT, 'README.md');
const DESC = path.join(ROOT, 'data', 'descartados.json');

const CATS = new Set(['mineral', 'vitamina', 'fibra', 'alimento', 'amina biogênica', 'outro']);
const MANEJOS = new Set(['separar', 'monitorar', 'evitar', 'atencao']);
const CAMPOS = ['farmaco', 'comerciais', 'nutriente', 'categoria', 'efeito', 'mecanismo', 'manejo', 'recomendacao', 'fonte'];

function falhar(msg) { console.error('ERRO: ' + msg); process.exit(1); }

function lerArgs() {
  const a = process.argv.slice(2);
  const o = { arquivo: null, descartados: '', data: null, dry: false, listar: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--descartados') o.descartados = a[++i] || '';
    else if (a[i] === '--data') o.data = a[++i];
    else if (a[i] === '--dry-run') o.dry = true;
    else if (a[i] === '--listar') o.listar = true;
    else if (!o.arquivo) o.arquivo = a[i];
  }
  return o;
}

function hoje() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
}

function lerDATA(html) {
  const ini = html.indexOf('var DATA = [');
  if (ini < 0) falhar('"var DATA = [" não encontrado em index.html');
  const abre = html.indexOf('[', ini);
  let prof = 0, fim = -1, str = false;
  for (let i = abre; i < html.length; i++) {
    const c = html[i];
    if (str) { if (c === '\\') i++; else if (c === '"') str = false; continue; }
    if (c === '"') { str = true; continue; }
    if (c === '/' && html[i + 1] === '/') { const nl = html.indexOf('\n', i); i = nl < 0 ? html.length : nl; continue; }
    if (c === '[') prof++;
    else if (c === ']') { prof--; if (prof === 0) { fim = i; break; } }
  }
  if (fim < 0) falhar('fim do array DATA não encontrado');
  return { dados: new Function('return ' + html.slice(abre, fim + 1))(), fim };
}

function validar(regs, existentes) {
  const nomes = new Set(existentes.map(x => x.farmaco.toLowerCase()));
  const vistos = new Set();
  regs.forEach((r, i) => {
    for (const k of CAMPOS) {
      if (r[k] === undefined || r[k] === null || r[k] === '') falhar(`registro ${i} (${r.farmaco}): campo "${k}" ausente`);
    }
    if (!Array.isArray(r.comerciais) || !r.comerciais.length) falhar(`registro ${i} (${r.farmaco}): "comerciais" deve ser array não vazio`);
    if (!CATS.has(r.categoria)) falhar(`registro ${i} (${r.farmaco}): categoria inválida "${r.categoria}"`);
    if (!MANEJOS.has(r.manejo)) falhar(`registro ${i} (${r.farmaco}): manejo inválido "${r.manejo}"`);
    if (!/^Bula/.test(r.fonte)) falhar(`registro ${i} (${r.farmaco}): "fonte" deve começar com "Bula profissional" ou "Bula (paciente)"`);
    vistos.add(r.farmaco);
  });
  for (const f of vistos) if (nomes.has(f.toLowerCase())) falhar(`fármaco já existe na base: ${f}`);
}

const esc = s => String(s).replace(/®/g, '').replace(/\r?\n/g, ' ').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const arr = a => '[' + a.map(x => '"' + esc(x) + '"').join(',') + ']';

function gerarBloco(regs) {
  const ordem = [], por = {};
  for (const r of regs) { if (!por[r.farmaco]) { por[r.farmaco] = []; ordem.push(r.farmaco); } por[r.farmaco].push(r); }
  let out = '';
  for (const f of ordem) {
    out += '    // ' + esc(f) + '\n';
    for (const r of por[f]) {
      out += '    {farmaco:"' + esc(r.farmaco) + '", comerciais:' + arr(r.comerciais) + ', nutriente:"' + esc(r.nutriente) + '", categoria:"' + esc(r.categoria) + '",\n';
      out += '     efeito:"' + esc(r.efeito) + '", mecanismo:"' + esc(r.mecanismo) + '",\n';
      out += '     manejo:"' + esc(r.manejo) + '", recomendacao:"' + esc(r.recomendacao) + '",\n';
      out += '     fonte:"' + esc(r.fonte) + '"},\n';
    }
  }
  return out;
}

const listaE = nomes => nomes.length < 2 ? nomes.join('') : nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1];
const unicos = dados => [...new Set(dados.map(x => x.farmaco))];

function proximoLote() {
  try {
    const m = execSync('git log --format=%s', { cwd: ROOT, encoding: 'utf8' }).match(/^Lote (\d+)/m);
    return m ? Number(m[1]) + 1 : null;
  } catch (e) { return null; }
}

const o = lerArgs();
const html0 = fs.readFileSync(HTML, 'utf8');
const { dados: atuais } = lerDATA(html0);
const descartados = fs.existsSync(DESC) ? JSON.parse(fs.readFileSync(DESC, 'utf8')) : [];

if (o.listar) {
  console.log('EXISTENTES (' + unicos(atuais).length + '): ' + unicos(atuais).join(' · '));
  console.log('DESCARTADOS (' + descartados.length + '): ' + descartados.join(' · '));
  process.exit(0);
}

if (!o.arquivo) falhar('informe o caminho do grupo.json (ou use --listar)');
const novos = JSON.parse(fs.readFileSync(o.arquivo, 'utf8'));
if (!Array.isArray(novos) || !novos.length) falhar('grupo.json vazio — nada a mesclar');
validar(novos, atuais);

const eol = html0.includes('\r\n') ? '\r\n' : '\n';
const { fim } = lerDATA(html0);
const linhaFim = html0.lastIndexOf('\n', fim) + 1;
const bloco = ('\n' + gerarBloco(novos)).replace(/\n/g, eol);
let html = html0.slice(0, linhaFim) + bloco + html0.slice(linhaFim);

const { dados: todos } = lerDATA(html);
const nFarm = unicos(todos).length;
const data = o.data || hoje();

const antes = html;
html = html.replace(/Base atual cobre \d+ fármacos/, 'Base atual cobre ' + nFarm + ' fármacos')
  .replace(/atualizado em <b>\d{2}\/\d{2}\/\d{4}<\/b>/, 'atualizado em <b>' + data + '</b>')
  .replace(/bulas ANVISA em \d{2}\/\d{2}\/\d{4}/, 'bulas ANVISA em ' + data);
if (html === antes && !/Base atual cobre/.test(html)) falhar('textos fixos de contagem/data não encontrados em index.html');

new Function(html.slice(html.indexOf('<script>') + 8, html.indexOf('</script>')).replace(/document\./g, '({}).').replace(/window\./g, '({}).'));

const novosDesc = o.descartados.split(',').map(s => s.trim()).filter(Boolean);
for (const n of novosDesc) if (!descartados.some(d => d.toLowerCase() === n.toLowerCase())) descartados.push(n);

let readme = fs.readFileSync(README, 'utf8');
const reol = readme.includes('\r\n') ? '\r\n' : '\n';
const linhas = readme.split(/\r?\n/);
const idx = linhas.findIndex(l => /^\d+ fármacos, \d+ interações mapeadas \(última atualização: [\d\/]+\)\.\s*$/.test(l));
if (idx < 0) falhar('linha de contagem não encontrada no README');
linhas[idx] = nFarm + ' fármacos, ' + todos.length + ' interações mapeadas (última atualização: ' + data + ').';
let j = idx + 1;
while (j < linhas.length && !linhas[j].trim()) j++;
linhas[j] = unicos(todos).join(' · ');
readme = linhas.join(reol);
if (novosDesc.length) {
  const re = /(não entraram na base: )([\s\S]*?)( — ausência de registro)/;
  if (!re.test(readme)) falhar('frase de descartados não encontrada no README');
  readme = readme.replace(re, (_, a, __, c) => a + listaE(descartados) + c);
}

const lote = proximoLote();
console.log(`OK: +${unicos(novos).length} fármacos, +${novos.length} interações → total ${nFarm} fármacos, ${todos.length} interações (data ${data}).`);
console.log('Sugestão de título: ' + (lote ? 'Lote ' + lote + ': ' : '') + `+${unicos(novos).length} fármacos, +${novos.length} interações (rotina automática)`);
if (o.dry) { console.log('(dry-run: nada foi gravado)'); process.exit(0); }

fs.writeFileSync(HTML, html);
fs.writeFileSync(JSON_OUT, JSON.stringify(todos, null, 2) + '\n');
fs.writeFileSync(README, readme);
fs.writeFileSync(DESC, JSON.stringify(descartados, null, 2) + '\n');
