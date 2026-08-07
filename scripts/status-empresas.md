# Status de coleta — empresas_prioridade.csv

Acompanhamento do progresso empresa a empresa, cruzando a lista priorizada
(`empresas_prioridade.csv`, na raiz do projeto) com o que já foi pesquisado e
está em `sources.json`. Atualizar esta tabela conforme cada empresa é
investigada — é o "board" de progresso combinado com o usuário.

## Legenda de status

- ✅ **confirmado** — fonte automatizável já ativa em `sources.json` (greenhouse/gupy)
- ⚙️ **candidato_fase_2** — tem ATS, mas exige mais engenharia (Workday, Lever, auth, etc.) — já documentado em `sources.json`
- 🚫 **sem_ats_publico** — pesquisado e confirmado sem ATS público (e-mail/indicação)
- ⛔ **bloqueado_ia** — robots.txt bloqueia bots de IA, nunca coletar
- 🔎 **a_pesquisar** — ainda não investigado nesta lista

## Correção importante (2026-08-04)

O regex de classificação (`scripts/collect-vagas.js`) tinha um bug: `/estagi/i` não
batia com a palavra "**Está**gio" sozinha (só com "Estagi**á**rio", onde o acento
vem depois do trecho "estagi"). Corrigido pra `/est[aá]gi/i`. Isso destravou vagas
que já estavam disponíveis em fontes **já confirmadas** — o BTG Pactual, por
exemplo, foi de 0 pra 16 vagas coletadas sem nenhuma mudança de fonte, só a
correção do filtro. Todas as fontes "confirmado" acima já se beneficiam disso
automaticamente, sem precisar de revisão individual.

## Prioridade 1

| Empresa | Status | Nota |
|---|---|---|
| Goldman Sachs Brasil | ⚙️ candidato_fase_2 | Plataforma própria `higher.gs.com` (Contentful + client-side rendering). robots.txt permite indexar `/roles/`, mas nenhuma API JSON pública encontrada ainda |
| JPMorgan Brasil | ✅ confirmado | Oracle Cloud HCM (`jpmc.fa.oraclecloud.com`) — 6 vagas reais do "Programa de Estágio Brasil (Drive The Future)" achadas no teste |
| BTG Pactual | ✅ confirmado | Greenhouse `btgpactual` |
| Itaú BBA | ✅ confirmado | Confirmado: `carreiras.itau.com.br` roda sobre Gupy (marca "gupy" no HTML) — mesmo board do Itaú Unibanco (`vemproitau`), só com domínio próprio |
| Bradesco BBI | ⚙️ candidato_fase_2 (+ manual) | Cornerstone OnDemand confirmado (`bradesco.csod.com`), API exige auth (401). Programa de estágio via Eureca já capturado manualmente em `data/manual.json` |
| Morgan Stanley Brasil | ⚙️ candidato_fase_2 | Plataforma TalentLink (`morganstanley.tal.net`) — sem JSON-LD nem API pública encontrada no fetch inicial |
| XP Investimentos | ✅ confirmado | Greenhouse `xpinc` |
| Genial Investimentos | ✅ confirmado | Gupy `genial` |
| Verde Asset Management | 🚫 sem_ats_publico | |
| SPX Capital | ✅ confirmado | Zoho Recruit — lista de vagas embutida no HTML (`<input id="moduleMeta">`), sem API separada. 5 vagas reais de estágio achadas (ESG, Global Equities, Legal & Compliance, Private Equity) |
| Kinea Investimentos | ✅ confirmado | Gupy `kinea` |
| Adam Capital | 🚫 sem_ats_publico | |
| Vinland Capital | 🚫 sem_ats_publico | Nenhuma página de carreiras/ATS encontrada |
| Kapitalo Investimentos | 🚫 sem_ats_publico | |
| Legacy Capital | 🚫 sem_ats_publico | |
| Itaú Asset Management | ✅ confirmado | Mesmo board do Itaú (Gupy `vemproitau`) |
| BTG Asset Management | ✅ confirmado | Mesmo board do BTG (Greenhouse `btgpactual`) |
| XP Asset Management | ✅ confirmado | Mesmo board da XP (Greenhouse `xpinc`) |
| Pátria Investimentos | ⚙️ candidato_fase_2 (+ manual) | Teamtailor geral; programa de estágio via Across capturado manualmente em `data/manual.json` (2026-08-04) |
| Vinci Partners | ✅ confirmado | Gupy `vincipartners` |
| Softbank Latin America Fund | 🚫 sem_ats_publico | Portal `careers.latinamericafund.com` lista vagas das empresas do portfólio, não do próprio fundo (mesmo padrão do Kaszek/Valor Capital) |
| Monashees | ⛔ bloqueado_ia | robots.txt bloqueia ClaudeBot/GPTBot |
| Kaszek Ventures | 🚫 sem_ats_publico | Board é do portfólio, não da gestora |
| Canary | 🚫 sem_ats_publico | |
| Kinea Real Estate | ✅ confirmado | Mesmo board do Kinea (Gupy `kinea`) |
| Vinci Real Estate | ✅ confirmado | Mesmo board da Vinci Partners (Gupy `vincipartners`) |
| BTG Pactual Real Estate | ✅ confirmado | Mesmo board do BTG (Greenhouse `btgpactual`) |
| XP Properties | ✅ confirmado | Mesmo board da XP (Greenhouse `xpinc`) |
| BTG Pactual Research | ✅ confirmado | Vagas de research (ex: Empiricus) aparecem no board do BTG |
| XP Research | ✅ confirmado | Mesmo board da XP (Greenhouse `xpinc`) |
| Itaú BBA Research | ✅ confirmado | Mesmo board Gupy do Itaú (ver Itaú BBA acima) |
| Bradesco BBI Research | ⚙️ candidato_fase_2 (+ manual) | Mesmo Cornerstone/Eureca do Bradesco |
| Goldman Sachs Research | ⚙️ candidato_fase_2 | Mesma plataforma `higher.gs.com` do Goldman Sachs Brasil |
| Nubank | ✅ confirmado | Greenhouse `nubank` (programa sazonal, costuma zerar) |
| Banco Inter | ✅ confirmado | Greenhouse `inter` |
| Stone | ✅ confirmado | Greenhouse `stone` |
| McKinsey & Company Brasil | ⚙️ candidato_fase_2 | Plataforma própria, client-side rendered — nenhum indício de ATS de mercado (Workday/Avature/etc.) no HTML inicial |
| Bain & Company Brasil | ⚙️ candidato_fase_2 | Mesmo caso do McKinsey — plataforma própria, sem indício de ATS de mercado |
| Boston Consulting Group Brasil | ⚙️ candidato_fase_2 | Phenom People, brand code `BCG1US` — é SPA, chamada de API não visível no fetch estático; tentativas de `/api/apply/v2/jobs` deram 404 |

## Prioridade 2

| Empresa | Status | Nota |
|---|---|---|
| Bank of America Brasil | ⚙️ candidato_fase_2 | `careers.bankofamerica.com` — plataforma não totalmente confirmada |
| Citi Brasil | ✅ confirmado | `jobs.citi.com` tem página de categoria já filtrada por estágio em São Paulo, com a lista renderizada direto no HTML (sem precisar da API do Workday) — 5 vagas reais achadas (Markets, Banking Commercial, PCD Markets, Investment Banking) |
| UBS BB | ⚙️ candidato_fase_2 | "Cia de Talentos" (`vagas.ciadetalentos.com.br/hotsite/UBSestagio`) — app Angular, sem dados no HTML estático; parece ser hotsite único de um ciclo, não board pesquisável — candidato a curadoria manual como o Across |
| Santander Brasil | ✅ confirmado | Workday (`santander.wd3.myworkdayjobs.com/SantanderCareers`) — filtro por faceta locationCountry, 1 vaga real achada no teste |
| BR Partners | ⚙️ candidato_fase_2 | Portal próprio (`brpartners.com.br/careers`), fetch automatizado bloqueado (403) |
| Safra | ✅ confirmado | Gupy `venhasersafra` |
| Inter Invest | ✅ confirmado | Mesmo board do Banco Inter (Greenhouse `inter`) |
| Ágora Investimentos | ⚙️ candidato_fase_2 | Mesmo Cornerstone/Eureca do Bradesco — não tem board próprio |
| Warren | ⛔ bloqueado_ia | `warren.inhire.app` bloqueia bots de IA |
| Avenue Securities | ⛔ bloqueado_ia | Confirmado: `avenue.inhire.app` bloqueia ClaudeBot/GPTBot (política padrão de toda a plataforma INHIRE) |
| Absolute Investimentos | 🚫 sem_ats_publico | |
| Genoa Capital | 🚫 sem_ats_publico | Só e-mail/contato |
| Ibiuna Investimentos | 🚫 sem_ats_publico | |
| Navi Capital | 🚫 sem_ats_publico | Só "trabalhe conosco" institucional |
| AZ Quest | 🚫 sem_ats_publico | |
| Bradesco Asset Management (BRAM) | ⚙️ candidato_fase_2 | Mesmo Cornerstone/Eureca do Bradesco |
| Santander Asset Management | ✅ confirmado | Mesmo board Workday do Santander |
| Safra Asset Management | ✅ confirmado | Mesmo board do Safra (Gupy `venhasersafra`) — a confirmar se realmente é o mesmo funil |
| BlackRock Brasil | ✅ confirmado | Workday (`blackrock.wd1.myworkdayjobs.com/BlackRock_Professional`) — sem vaga no Brasil agora |
| Advent International Brasil | ✅ confirmado | Workday (`adventinternational.wd12.myworkdayjobs.com/AdventCareers`) — sem vaga no Brasil agora |
| Astella Investimentos | 🚫 sem_ats_publico | Só portfólio |
| Maya Capital | 🚫 sem_ats_publico | Nenhuma página de carreiras encontrada |
| Valor Capital Group | 🚫 sem_ats_publico | Board é do portfólio |
| Carlyle Brasil | ⚙️ candidato_fase_2 | `careers.carlyle.com` bloqueado (403), ATS não confirmado |
| RBR Asset Management | ⚙️ candidato_fase_2 | Quickin — API existe (`api.quickin.io`) mas endpoint exato não mapeado, app Nuxt.js client-side |
| Hedge Investments | 🚫 sem_ats_publico | |
| Pátria Real Estate | ⚙️ candidato_fase_2 | Mesmo board da Pátria |
| Brookfield Asset Management Brasil | ✅ confirmado | Workday (`brookfield.wd5.myworkdayjobs.com/brookfield`) — sem vaga no Brasil agora |
| JS Real Estate | 🚫 sem_ats_publico | Não foi possível identificar com confiança qual entidade é (nome ambíguo) |
| CSHG Real Estate | ⚙️ candidato_fase_2 | Confirmado: fundo HGRE transferido para gestão da Pátria + administração da Genial em 2024 — sem board próprio, cai no candidato_fase_2 da Pátria |
| JPMorgan Research | ✅ confirmado | Mesmo board Oracle Cloud do JPMorgan Brasil |
| Genial Research | ✅ confirmado | Mesmo board da Genial (Gupy `genial`) |
| Inter Research | ✅ confirmado | Mesmo board do Banco Inter (Greenhouse `inter`) |
| UBS BB Research | ⚙️ candidato_fase_2 | Mesmo hotsite Cia de Talentos do UBS BB |
| Safra Research | ✅ confirmado | Mesmo board do Safra (Gupy `venhasersafra`) |
| C6 Bank | ✅ confirmado | Greenhouse `c6bank` |
| Creditas | ✅ confirmado | Gupy `creditas` — feed fresco (lastBuildDate de hoje), 0 estágio/trainee no momento |
| PagSeguro / PagBank | ✅ confirmado | Gupy `pagseguro` |
| PwC Brasil (Deals) | ⚙️ candidato_fase_2 | Portal próprio, ATS não confirmado |
| Deloitte Brasil (Financial Advisory) | ⚙️ candidato_fase_2 | Usa Avature como plataforma global |
| KPMG Brasil (Deal Advisory) | ⛔ bloqueado_ia | Confirmado: `kpmg.inhire.app` bloqueia ClaudeBot/GPTBot (política padrão da plataforma INHIRE) |
| EY Brasil (Strategy and Transactions) | ⚙️ candidato_fase_2 | Portal próprio, ATS não confirmado |
| Oliver Wyman Brasil | ⚙️ candidato_fase_2 | Phenom People hospedado em `mmc.phenompeople.com` (página real: `oliverwyman.com/careers.html`) — mesmo problema do BCG, endpoint não encontrado |
| TRX Real Estate | 🚫 sem_ats_publico | Site `trx.com.br` existe mas sem link de carreiras na home — verificado só por fetch direto, sem WebSearch disponível (baixa confiança) |

## Prioridade 3

| Empresa | Status | Nota |
|---|---|---|
| Banco Modal | ✅ confirmado (com ressalva) | Mesma empresa da Modalmais (Gupy `modalmais`) — feed com ALERTA de defasagem (lastBuildDate 2023) |
| Banco ABC Brasil | ⚙️ candidato_fase_2 | Página de carreiras retorna 403 |
| Votorantim (BV) | ⚙️ candidato_fase_2 | Programa ativo, ATS não confirmado |
| Barclays Brasil | ✅ confirmado | Workday (`barclays.wd3.myworkdayjobs.com/External_Career_Site_Barclays`) — sem vaga no Brasil agora |
| Deutsche Bank Brasil | ⚙️ candidato_fase_2 | `careers.db.com`, plataforma não confirmada |
| Rico | ✅ confirmado | Mesmo board da XP (Greenhouse `xpinc`) |
| Clear | ✅ confirmado | Mesmo board da XP (Greenhouse `xpinc`) |
| Órama | ⚙️ candidato_fase_2 | Board Gupy existe mas feed google_for_jobs parado desde 2023 |
| Toro Investimentos | ⛔ bloqueado_ia | `toroinvestimentos.inhire.app` bloqueia bots de IA |
| Vitreo / Empiricus Investimentos | 🔎 a_pesquisar (parcial) | Vagas de research da Empiricus já aparecem no board do BTG; a plataforma Vitreo em si não confirmada |
| CM Capital | 🚫 sem_ats_publico | Não foi possível identificar um ATS/portal próprio com confiança |
| Necton | ✅ confirmado | Corretora subsidiária do BTG — vagas aparecem no próprio board Greenhouse do BTG |
| ARX Investimentos | 🚫 sem_ats_publico | Nenhum ATS próprio encontrado |
| Claritas Investimentos | 🚫 sem_ats_publico | Nenhum ATS próprio encontrado |
| Quest Investimentos | 🚫 sem_ats_publico | Não foi possível identificar um ATS próprio com confiança |
| Tarpon Investimentos | 🚫 sem_ats_publico | |
| BB Asset Management | ⚙️ candidato_fase_2 | Mesmo funil do Banco do Brasil (CIEE/concurso) |
| Caixa Asset Management | ⚙️ candidato_fase_2 | Estágio via portal Super Estágios; efetivo via concurso público (mesmo padrão do BB) |
| Western Asset Brasil | ✅ confirmado | Workday (`franklintempleton.wd5.myworkdayjobs.com/Primary-External-1`) — sem vaga no Brasil agora |
| Franklin Templeton Brasil | ✅ confirmado | Mesmo board Workday do Western Asset |
| Schroders Brasil | ⚙️ candidato_fase_2 | SelectMinds (`schroders.referrals.selectminds.com`), sem vagas do Brasil localizadas |
| Igah Ventures | 🚫 sem_ats_publico | |
| DOMO Invest | ✅ confirmado | SmartRecruiters (`api.smartrecruiters.com/v1/companies/DOMOInvest/postings`) — sem vaga de estágio/trainee agora |
| KKR Brasil | ⚙️ candidato_fase_2 | Portal próprio (`kkr.com/careers`), sem vagas do Brasil localizadas |
| Warburg Pincus Brasil | ⚙️ candidato_fase_2 | Portal próprio (`warburgpincus.com/careers`), sem vagas do Brasil localizadas |
| Actis Brasil | ✅ confirmado (via General Atlantic) | Adquirida pela General Atlantic em out/2024; board Lever antigo (`jobs.lever.co/act`) foi desativado — vaga futura sairia no board Greenhouse `generalatlantic` já coberto |
| Bozano Investimentos | 🚫 sem_ats_publico | Nenhum ATS próprio encontrado |
| GP Investimentos | 🚫 sem_ats_publico | Recrutamento só por e-mail |
| Aqua Capital | 🚫 sem_ats_publico | Nenhum ATS próprio além de agregadores |
| Upload Ventures | 🚫 sem_ats_publico | Nenhuma informação de carreiras encontrada |
| Alexia Ventures | 🚫 sem_ats_publico | Só e-mail de contato |
| Bamboo Capital | 🚫 sem_ats_publico | Nenhuma informação de carreiras encontrada |
| Performa Investimentos | 🚫 sem_ats_publico | Não foi possível identificar um ATS próprio com confiança |
| PCP Capital Partners | 🚫 sem_ats_publico | Nenhum ATS próprio encontrado |
| GLP Capital Partners Brasil | 🚫 sem_ats_publico | Rebatizada Marq Logistics no Brasil; só banco de talentos/e-mail |
| Bresco Investimentos | 🚫 sem_ats_publico | Nenhum ATS próprio encontrado |
| Mauá Capital | ⚙️ candidato_fase_2 | Board Gupy (`jive`, pós-fusão JiveMauá) existe mas parece abandonado |
| Cyrela | ✅ confirmado | Gupy `cyrela` — filtroArea ativo (incorporadora grande, board geral) |
| JHSF | ✅ confirmado | Gupy `jhsf` — filtroArea ativo (conglomerado imóveis/malls/fashion/aeroporto) |
| Multiplan | ⚙️ candidato_fase_2 (+ manual) | Programa de estágio via Across capturado manualmente em `data/manual.json` (2026-08-04) |
| Iguatemi | ⚙️ candidato_fase_2 | Portal próprio (`vemseriguatemi.com.br`), não é Gupy, ATS não confirmado |
| Eztec | ✅ confirmado | Gupy `eztec` — filtroArea ativo (incorporadora, board geral) |
| Tegra | ✅ confirmado | Gupy `tegraincorporadora` — filtroArea ativo (subsidiária da Brookfield) |
| Empiricus Research | ✅ confirmado | Aparece dentro do board do BTG (depto "BTG Investimentos") |
| Nord Research | 🚫 sem_ats_publico | |
| Levante Investimentos | 🚫 sem_ats_publico | |
| Suno Research | ✅ confirmado (com ressalva) | Gupy `sunojobs` — ALERTA feed defasado (lastBuildDate 2024) |
| Eleven Financial | 🚫 sem_ats_publico | |
| Guide Investimentos Research | 🚫 sem_ats_publico | Adquirida pelo Safra em 2024, sem board próprio confirmado |
| Nubank (dup) | — | já contabilizada em P1 |
| Banco Inter (dup) | — | já contabilizada em P1 |
| Stone (dup) | — | já contabilizada em P1 |
| McKinsey & Company Brasil (dup) | — | já contabilizada em P1 |
| Bain & Company Brasil (dup) | — | já contabilizada em P1 |
| Boston Consulting Group Brasil (dup) | — | já contabilizada em P1 |
| C6 Bank (dup) | — | já contabilizada em P2 |
| Creditas (dup) | — | já contabilizada em P2 |
| PagSeguro / PagBank (dup) | — | já contabilizada em P2 |
| PwC Brasil (dup) | — | já contabilizada em P2 |
| Deloitte Brasil (dup) | — | já contabilizada em P2 |
| KPMG Brasil (dup) | — | já contabilizada em P2 |
| EY Brasil (dup) | — | já contabilizada em P2 |
| Oliver Wyman Brasil (dup) | — | já contabilizada em P2 |
| Neon | ✅ confirmado | Lever `neon` — sem vaga de estágio/trainee agora |
| Méliuz | ✅ confirmado | Gupy `meliuz` |
| Conta Simples | ✅ confirmado | Gupy `contasimples` |
| Stark Bank | ✅ confirmado (com ressalva) | Gupy `stark` — ALERTA feed com lastBuildDate de 2026-04-08, moderadamente defasado |
| Dock | ✅ confirmado (com ressalva) | Gupy `dock` — ALERTA feed com lastBuildDate de 2025-09-09, defasado |
| Conductor | ⚙️ candidato_fase_2 | Gupy `conductor` com feed abandonado desde 2021 — empresa se fundiu com Dock/Muxi, vagas provavelmente no board `dock` |
| Klavi | ⛔ bloqueado_ia | Confirmado: `klavi.inhire.app` bloqueia ClaudeBot/GPTBot (política padrão da plataforma INHIRE) |
| Hash (Plataforma) | ⚙️ candidato_fase_2 | README do GitHub aponta pra `jobs.lever.co/hash`, mas esse board Lever foi desativado (404) — README parece desatualizado desde set/2025 |
| Roland Berger Brasil | ⚙️ candidato_fase_2 | Portal próprio, ATS não confirmado |
| FTI Consulting Brasil | ✅ confirmado | Workday (`fticonsulting.wd108.myworkdayjobs.com/FTIConsultingCareers`) — sem vaga no Brasil agora |
| Alvarez & Marsal Brasil | ⚙️ candidato_fase_2 | Portal global + microsite específico do estágio Brasil (`intern-platform.amlatam.digital`), ATS não confirmado |

## Observação sobre duplicatas no CSV

Várias linhas do CSV são a mesma empresa em "chapéus" diferentes (ex: "BTG
Pactual" / "BTG Asset Management" / "BTG Pactual Real Estate" / "BTG Pactual
Research" são todas o mesmo board Greenhouse `btgpactual`; mesma lógica pra XP,
Kinea, Vinci Partners, Safra, Bradesco, Santander, Pátria). Nesses casos,
resolver uma resolve todas as variantes automaticamente.
