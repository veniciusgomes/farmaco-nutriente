# Interações Fármaco-Nutriente

Base de referência para consulta de interações droga–nutriente (alimentos, minerais, vitaminas, fibras) extraídas de bulas profissionais registradas na ANVISA. Pensada para uso por nutricionistas, farmacêuticos e outros profissionais de saúde como ponto de partida de pesquisa — **não é uma recomendação clínica pronta**.

## O que tem aqui

- `index.html` — página de busca autocontida (HTML/CSS/JS, sem dependências externas além de fontes do Google Fonts). Digite um ou mais fármacos e veja as interações mapeadas.
- `data/interacoes.json` — os mesmos dados em JSON estruturado, para reuso em outras ferramentas/scripts.

Abra `index.html` diretamente no navegador para usar a busca.

## Estado atual

71 fármacos, 167 interações mapeadas (última atualização: 24/08/2026).

Levotiroxina sódica · Varfarina sódica · Sinvastatina · Cloridrato de ciprofloxacino · Tranilcipromina · Fenitoína · Cloridrato de metformina · Alendronato de sódio · Furosemida · Carbamazepina · Ácido valproico · Digoxina · Ciclosporina · Isoniazida · Carbonato de lítio · Omeprazol · Orlistat · Levodopa + benserazida · Levodopa + carbidopa · Metotrexato · Espironolactona · Captopril · Sulfametoxazol + Trimetoprima · Colchicina · Doxiciclina · Prednisona · Rifampicina · Colestiramina · Amiodarona · Hidroclorotiazida · Tetraciclina · Maleato de enalapril · Losartana potássica · Nifedipina · Verapamil · Atorvastatina cálcica · Cloridrato de fluoxetina · Cloridrato de amitriptilina · Ácido acetilsalicílico · Teofilina · Sulfassalazina · Fenobarbital · Insulina NPH · Glibenclamida · Dexametasona · Nitrofurantoína · Claritromicina · Alopurinol · Quetiapina · Rivaroxabana · Tacrolimo · Itraconazol · Cloridrato de propranolol · Metronidazol · Efavirenz · Metildopa · Cloridrato de fexofenadina · Mesilato de imatinibe · Micofenolato de mofetila · Capecitabina · Cloridrato de buspirona · Cloridrato de ziprasidona · Cetoconazol · Isotretinoína · Citrato de sildenafila · Fenofibrato · Calcitriol · Besilato de anlodipino · Genfibrozila · Alprazolam · Diazepam

Os lotes de 20+ fármacos mais recentes foram pesquisados em paralelo por subagentes (cada um buscando e lendo a bula profissional de um fármaco), seguindo o mesmo critério de fidelidade ao texto da bula do lote inicial. No lote mais recente, 8 fármacos pesquisados (sucralfato, cimetidina, linezolida, tamoxifeno, albendazol, clopidogrel, azitromicina e dipiridamol) não tiveram interação nutriente/alimento explícita encontrada na bula profissional consultada e por isso não entraram na base — assim como o diltiazem do lote anterior, ausência de registro não significa ausência de interação real, só que não foi documentada na fonte consultada.

## Fonte e metodologia

Cada registro vem do texto da seção "Interações medicamentosas" / "Interação medicamento-alimento" da bula profissional de cada fármaco, conforme publicada pelos próprios fabricantes (conteúdo exigido e aprovado pela ANVISA sob a RDC 47/2009). As bulas foram lidas e as menções a alimentos, minerais, vitaminas e fibras foram extraídas para os campos abaixo — nada foi inferido ou complementado com informação fora da bula consultada.

Não existe hoje uma forma de download em massa das bulas da ANVISA (o Bulário Eletrônico é só consulta, item por item — ver histórico de decisões abaixo). Por isso a base é construída manualmente, fármaco por fármaco, priorizando classes terapêuticas classicamente associadas a interação nutricional relevante (anticoagulantes, antibióticos quelantes, hormônios tireoidianos, IMAOs, anticonvulsivantes, bifosfonatos, diuréticos, entre outras).

## ⚠️ Limitações importantes

- **Protótipo/base de teste, sem revisão farmacêutica ou nutricional formal.** Trate cada registro como ponto de partida para checagem na bula original antes de qualquer uso clínico.
- Cobertura parcial: só fármacos já pesquisados manualmente estão na base. Um fármaco não encontrado não significa ausência de interação — significa apenas que ainda não foi mapeado.
- Extração feita por leitura de PDF via IA, o que pode conter erros de transcrição. Cada registro carrega o campo `fonte` para checagem contra a bula original.
- Combina texto de bulas de diferentes fabricantes/marcas para o mesmo princípio ativo quando necessário; pequenas diferenças de redação entre bulas do mesmo fármaco podem existir.

## Estrutura dos dados (`data/interacoes.json`)

Cada item do array é um objeto com:

| Campo | Descrição |
|---|---|
| `farmaco` | Nome do princípio ativo |
| `comerciais` | Lista de nomes comerciais de exemplo |
| `nutriente` | Nutriente, alimento ou classe envolvida |
| `categoria` | `mineral` \| `vitamina` \| `fibra` \| `alimento` \| `amina biogênica` \| `outro` |
| `efeito` | O que a bula descreve como efeito da interação |
| `mecanismo` | Mecanismo descrito na bula (quando disponível) |
| `manejo` | `separar` (horário) \| `monitorar` \| `evitar` \| `atencao` |
| `recomendacao` | Recomendação prática conforme a bula |
| `fonte` | Bula e fabricante de onde o dado foi extraído |

## Como contribuir / expandir

Para adicionar um novo fármaco: pesquisar a bula profissional (não a de paciente, quando disponível) do fabricante, localizar a seção de interações, extrair apenas o que está explicitamente escrito sobre alimentos/nutrientes/minerais/vitaminas, e adicionar um novo objeto ao array `DATA` em `index.html` (e regenerar `data/interacoes.json`). Manter sempre o campo `fonte` preenchido com a bula exata usada.

## Roadmap

- Ampliar cobertura por classe terapêutica (anticonvulsivantes, imunossupressores, quimioterápicos, IBPs, etc.)
- Avaliar integração com a base aberta [DDID](https://bddg.hznu.edu.cn/ddid/) (diet-drug interactions, curadoria manual, literatura internacional) como camada complementar à ANVISA, com origem sempre identificada por registro.
- Revisão por farmacêutico/nutricionista antes de qualquer uso além de prototipagem.
