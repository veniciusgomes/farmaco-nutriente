# Rotina automática de lotes (4x por semana)

Objetivo: adicionar até 5 fármacos novos à base, a partir de bulas profissionais da ANVISA, atualizar README e tela com a data do dia da execução, commitar e dar push no `main`.

Repositório local fixo: `C:\Users\cyber\farmaco-nutriente`. Rode tudo a partir dele.

## Passo a passo

1. **Preparar.** `git pull --rebase origin main`. Se houver alterações locais não commitadas, rode `git status`, restaure com `git checkout -- .` apenas se forem resíduos de uma execução anterior, e prossiga. Crie a pasta `.lote-tmp` (ignorada pelo git).
2. **Listar o que já existe.** `node tools/merge-lote.js --listar` mostra os fármacos já na base e os já descartados. Não repita nenhum deles. Também não repetir: dabigatrana (só havia bula desatualizada) e melatonina (no Brasil é suplemento, não medicamento).
3. **Escolher 5 candidatos novos.** Priorize classes terapêuticas pouco representadas ou com interação alimentar/álcool conhecida (CYP3A4 e grapefruit, quelação por minerais, efeito de refeição na absorção, potássio, álcool com depressores do SNC, tiramina, cafeína/CYP1A2, vitamina K). Use só medicamentos com bula registrada na ANVISA. Se a lista de ideias novas estiver acabando, amplie para classes ainda não tocadas.
4. **Pesquisar com um subagente** (Agent, `general-purpose`, em segundo plano) usando o prompt da seção abaixo, trocando a lista de 5 fármacos e o caminho de saída `C:\Users\cyber\farmaco-nutriente\.lote-tmp\grupo.json`.
5. **Revisar o resultado do subagente** antes de mesclar:
   - Remova registros que são **achados negativos** (a bula só diz que alimento/álcool NÃO altera nada). Esses fármacos vão para a lista de descartados.
   - Remova registros que o agente inferiu sem texto literal da bula.
   - Padronize `farmaco` (primeira letra maiúscula, nome do princípio ativo) e `fonte` (formato "Bula profissional — Marca (Fabricante)").
   - Álcool e cafeína usam `categoria: "outro"`.
6. **Mesclar.** `node tools/merge-lote.js .lote-tmp/grupo.json --descartados "nome1,nome2"` (omita `--descartados` se não houver). O script valida o schema, bloqueia duplicatas, insere os registros no `index.html`, regenera `data/interacoes.json` e atualiza **a data de hoje e as contagens** no README e na tela. Se o script falhar, **não commite**: rode `git checkout -- .`, reporte o erro e encerre.
7. **Se nenhum registro válido sobrou**, não faça commit nem mesclagem. Apenas informe o resultado.
8. **Commitar e publicar.** `git add README.md data index.html`, depois commit com o título sugerido pelo script e corpo em bullets (fármacos adicionados, descartados e por quê, fontes antigas ou espelhos de bula que mereçam conferência manual), terminando com a linha de atribuição exigida pela sessão. Em seguida `git push origin main`; se rejeitar, `git pull --rebase origin main` e tente uma vez mais.
9. **Relatar** em poucas linhas: fármacos adicionados, descartados, totais e hash do commit.

## Prompt-modelo para o subagente

Você está contribuindo para um projeto de referência chamado "Interações Fármaco-Nutriente" (base pública em português, para nutricionistas/farmacêuticos). O método é ESTRITO: cada registro de interação droga-nutriente precisa vir literalmente do texto da bula PROFISSIONAL (não a de paciente, quando as duas existirem) registrada na ANVISA, de um fabricante confiável, e só pode conter o que está EXPLICITAMENTE escrito na seção "Interações medicamentosas" ou "Interação medicamento-alimento" (ou, se o efeito do alimento/nutriente estiver descrito explicitamente em Farmacocinética/Absorção ou em Advertências/Precauções, isso também vale, desde que seja afirmação literal e explícita). Nunca infira nem complete com conhecimento farmacológico geral. Se a bula não mencionar nenhuma interação com alimento/mineral/vitamina/fibra/amina biogênica/álcool/cafeína, o fármaco não entra — relate a ausência (resultado válido). Se a bula só afirmar que alimento/álcool NÃO tem efeito, também não gere registro.

Pesquise a bula profissional (PDF do Bulário ANVISA ou do fabricante) destes 5 fármacos, um de cada vez: {LISTA}. Use WebSearch/WebFetch. Extraia SOMENTE menções a alimentos, minerais, vitaminas, fibras, aminas biogênicas (tiramina), álcool, cafeína; ignore interações fármaco-fármaco.

Cada registro tem EXATAMENTE estes campos:
- farmaco (princípio ativo), comerciais (array), nutriente
- categoria: "mineral" | "vitamina" | "fibra" | "alimento" | "amina biogênica" | "outro" (álcool e cafeína = "outro")
- efeito (frase curta em português), mecanismo (ou exatamente "Não detalhado na bula."), manejo: "separar" | "monitorar" | "evitar" | "atencao", recomendacao
- fonte: "Bula profissional — Marca (Fabricante)" (use "Bula (paciente) — ..." só se não achar a profissional)

Exemplo de formato:
{"farmaco":"Lovastatina","comerciais":["Lovastatina Sandoz"],"nutriente":"Suco de toranja (grapefruit)","categoria":"alimento","efeito":"Aumento da atividade inibitória da HMG-CoA redutase com risco de miopatia quando consumido em grandes quantidades.","mecanismo":"Componentes do suco inibem a CYP3A4, reduzindo a eliminação do fármaco.","manejo":"evitar","recomendacao":"Evitar quantidades muito grandes de suco de grapefruit.","fonte":"Bula profissional — Lovastatina Sandoz (Sandoz)"}

Ao terminar, escreva um array JSON válido (UTF-8) em {CAMINHO}. Na resposta final, informe: (a) quantos registros por fármaco; (b) quais ficaram de fora e por quê; (c) qualquer fonte que seja versão antiga, espelho de bula ou marca diferente da pedida. Seja honesto e preciso.
