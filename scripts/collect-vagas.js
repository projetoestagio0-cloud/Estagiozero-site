#!/usr/bin/env node
// Coletor do Radar de Vagas (Estágio Zero).
// Lê scripts/sources.json (fontes verificadas manualmente — ver README) e
// data/manual.json (curadoria manual), gera data/vagas.json no formato que
// index_10.html consome via fetch().
//
// Fontes suportadas hoje:
//   - Greenhouse: API JSON pública e oficial (boards-api.greenhouse.io)
//   - Gupy: feed de sitemap (Google for Jobs) + JSON-LD JobPosting nas páginas
//   - Workday: API "CxS" pública (myworkdayjobs.com/wday/cxs/...), paginada e filtrada por Brasil
//   - Lever: API JSON pública e oficial (api.lever.co/v0/postings/{slug})
//   - Oracle Cloud HCM: API REST pública (hcmRestApi/resources/.../recruitingCEJobRequisitions)
//   - Zoho Recruit: lista de vagas embutida no HTML da página de carreiras
//   - SmartRecruiters: API JSON pública e oficial (api.smartrecruiters.com)
//   - Citi: página de categoria (jobs.citi.com) já vem com a lista de vagas no HTML
//
// Uso: node scripts/collect-vagas.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCES = require('./sources.json');
const MANUAL_PATH = path.join(ROOT, 'data', 'manual.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'vagas.json');

const USER_AGENT = 'EstagioZeroBot/1.0 (+https://estagiozero.com.br; contato@estagiozero.com.br) radar-de-vagas';
const REQUEST_DELAY_MS = 400;
const MAX_JOBS_PER_GUPY_COMPANY = 60; // limite de páginas individuais a buscar por empresa, por educação com o servidor

// "júnior" foi testado e removido: nas fontes reais (Greenhouse de BTG/C6/Inter),
// o termo aparece em vagas de todas as áreas da empresa (dev backend, marketing,
// RH...), não só finanças — não dá pra filtrar de forma confiável só pelo título.
// Só classificamos automaticamente o que é inequivocamente um programa de
// estágio/trainee, que por definição é feito para estudantes/recém-formados.
//
// Fontes globais (Workday, Greenhouse de empresas multinacionais) costumam postar
// a vaga do Brasil em inglês, não em português — "Intern"/"Internship" e "Graduate
// Program/Scheme" são os termos equivalentes a estágio/trainee nesses casos.
const TIPO_PATTERNS = [
  { tipo: 'trainee', re: /trainee|graduate\s*(program(me)?|scheme)/i },
  // "est[aá]gi" (não só "estagi"): "Estágio" tem o acento na 3ª letra ("está-"),
  // diferente de "Estagiário" onde o acento vem depois do trecho "estagi" — um
  // regex só com "a" sem acento perde qualquer título que use "Estágio" puro
  // (ex: "Programa de Estágio Brasil"), sem cair no caso mais comum "Estagiário(a)".
  { tipo: 'estagio', re: /est[aá]gi|\bintern(ship)?\b/i }
];

function classifyTipo(title) {
  for (const p of TIPO_PATTERNS) if (p.re.test(title)) return p.tipo;
  return null;
}

// Operadoras de infraestrutura (concessões, saneamento) têm board Gupy único pra
// empresa inteira — sem isso, entra vaga de segurança, atendimento, operação etc.
// junto com as de finanças/corporativo. Fontes marcadas com "filtroArea": true no
// sources.json só entram se o título também bater com uma função corporativa/financeira.
const AREA_FINANCEIRA_RE = /financ|tesourar|controladoria|or[çc]ament|contáb|contabil|fus(õ|o)es\s*e\s*aquisi|\bm&a\b|societ[aá]rio|jur[ií]dic|rela(ç|c)(õ|o)es\s*com\s*investidor|\bri\b|compliance|cr[eé]dito|auditoria|planejamento\s*(estrat|financ)/i;

function passaFiltroArea(src, title) {
  if (!src.filtroArea) return true;
  return AREA_FINANCEIRA_RE.test(title);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.text();
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------- Greenhouse ----------------

async function collectGreenhouse(src) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${src.token}/jobs?content=false`;
  const text = await fetchText(url);
  const data = JSON.parse(text);
  const out = [];
  for (const job of data.jobs || []) {
    const title = (job.title || '').trim();
    const tipo = classifyTipo(title);
    if (!tipo || !passaFiltroArea(src, title)) continue;
    out.push({
      id: `gh-${src.token}-${job.id}`,
      empresa: src.empresa,
      programa: title,
      tipo,
      area: src.area,
      cidade: (job.location && job.location.name) || '',
      link: job.absolute_url,
      fonte: `scraper:greenhouse:${src.token}`,
      coletado_em: todayIso()
    });
  }
  return out;
}

// ---------------- Lever ----------------

async function collectLever(src) {
  const url = `https://api.lever.co/v0/postings/${src.slug}?mode=json`;
  const text = await fetchText(url);
  const data = JSON.parse(text);
  const out = [];
  for (const job of data || []) {
    const title = (job.text || '').trim();
    const tipo = classifyTipo(title);
    if (!tipo || !passaFiltroArea(src, title)) continue;
    out.push({
      id: `lever-${src.slug}-${job.id}`,
      empresa: src.empresa,
      programa: title,
      tipo,
      area: src.area,
      cidade: (job.categories && job.categories.location) || '',
      link: job.hostedUrl,
      fonte: `scraper:lever:${src.slug}`,
      coletado_em: todayIso()
    });
  }
  return out;
}

// ---------------- Citi (jobs.citi.com) ----------------
// jobs.citi.com renderiza as páginas de categoria (por cidade/tipo de vaga) já
// com a lista de vagas no HTML — sem precisar da API do Workday por trás (cujo
// Job_Posting_Site_ID nunca conseguimos mapear). Uma fonte dedicada só pra essa
// empresa, apontando direto pra URL de categoria já filtrada (ex: estágio em
// São Paulo), em vez de um "tipo de plataforma" genérico.
async function collectCitiBrasil(src) {
  const html = await fetchText(src.categoriaUrl);
  const re = /<a[^>]*href="(\/job\/[^"]+)"[^>]*>([\s\S]{0,300}?)<\/a>/g;
  const out = [];
  const seen = new Set();
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (seen.has(href)) continue;
    seen.add(href);
    const title = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    const tipo = classifyTipo(title);
    if (!tipo || !passaFiltroArea(src, title)) continue;
    const idMatch = /\/(\d+)$/.exec(href);
    out.push({
      id: `citi-${idMatch ? idMatch[1] : Buffer.from(href).toString('base64').slice(0, 16)}`,
      empresa: src.empresa,
      programa: title,
      tipo,
      area: src.area,
      cidade: src.cidade || '',
      link: `https://jobs.citi.com${href}`,
      fonte: 'scraper:citi',
      coletado_em: todayIso()
    });
  }
  return out;
}

// ---------------- SmartRecruiters ----------------
// API JSON pública e oficial, mesmo padrão fácil do Greenhouse — sem login.
async function collectSmartRecruiters(src) {
  const url = `https://api.smartrecruiters.com/v1/companies/${src.company}/postings`;
  const text = await fetchText(url);
  const data = JSON.parse(text);
  const out = [];
  for (const job of data.content || []) {
    const title = (job.name || '').trim();
    const tipo = classifyTipo(title);
    if (!tipo || !passaFiltroArea(src, title)) continue;
    out.push({
      id: `smartrecruiters-${src.company}-${job.id}`,
      empresa: src.empresa,
      programa: title,
      tipo,
      area: src.area,
      cidade: (job.location && job.location.fullLocation) || '',
      link: `https://jobs.smartrecruiters.com/${src.company}/${job.id}`,
      fonte: `scraper:smartrecruiters:${src.company}`,
      coletado_em: todayIso()
    });
  }
  return out;
}

// ---------------- Zoho Recruit ----------------
// Zoho Recruit não tem API JSON pública separada, mas a própria página de
// carreiras já renderiza a lista inteira de vagas no HTML, dentro de um
// <input type="hidden"> com um array JSON (HTML-entity-encoded) logo depois
// do elemento "moduleMeta". Extraído de forma confiável, sem precisar de JS.
async function collectZohoRecruit(src) {
  const url = `https://${src.subdomain}.zohorecruit.com/jobs/Careers`;
  const html = await fetchText(url);
  const marker = 'id="moduleMeta">';
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return [];
  const valueMarker = 'value="';
  const startVal = html.indexOf(valueMarker, markerIdx + marker.length) + valueMarker.length;
  const endVal = html.indexOf('" id="jobs', startVal);
  if (startVal === -1 || endVal === -1) return [];

  let jobs;
  try {
    jobs = JSON.parse(decodeHtmlEntities(html.slice(startVal, endVal)));
  } catch (e) {
    return [];
  }

  const out = [];
  for (const job of jobs) {
    const title = (job.Posting_Title || job.Job_Opening_Name || '').trim();
    const tipo = classifyTipo(title);
    if (!tipo || !passaFiltroArea(src, title)) continue;
    const cidade = [job.City, job.State].filter(Boolean).join(', ') || job.Country || '';
    out.push({
      id: `zoho-${src.subdomain}-${job.id}`,
      empresa: src.empresa,
      programa: title,
      tipo,
      area: src.area,
      cidade,
      link: `${url}/${job.id}`,
      fonte: `scraper:zoho:${src.subdomain}`,
      coletado_em: todayIso()
    });
  }
  return out;
}

// ---------------- Oracle Cloud HCM (Recruiting) ----------------
// API REST pública que a própria página de carreiras (Oracle Fusion Recruiting
// Cloud) usa pra buscar vaga — sem login. Boards podem ser enormes (o da JPMorgan
// tem +7000 vagas no mundo todo), então usamos "keyword=Brazil" no finder pra
// reduzir a paginação, e ainda confirmamos por PrimaryLocation — o keyword é
// busca textual ampla e pode trazer vaga de outro país da América Latina que
// só cita "Brazil" na descrição.
const ORACLE_PAGE_SIZE = 25;
const ORACLE_BRASIL_RE = /brazil|brasil/i;

async function collectOracleCloud(src) {
  const base = `https://${src.host}`;
  const apiPath = `${base}/hcmRestApi/resources/latest/recruitingCEJobRequisitions`;
  const out = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const finder = `findReqs;siteNumber=${src.siteNumber},limit=${ORACLE_PAGE_SIZE},offset=${offset},sortBy=POSTING_DATES_DESC,keyword=Brazil`;
    const url = `${apiPath}?onlyData=true&expand=requisitionList.secondaryLocations&finder=${finder}`;
    const text = await fetchText(url);
    const data = JSON.parse(text);
    const item = data.items[0];
    total = item.TotalJobsCount || 0;

    for (const job of item.requisitionList || []) {
      if (!ORACLE_BRASIL_RE.test(job.PrimaryLocation || '')) continue;
      const title = (job.Title || '').trim();
      const tipo = classifyTipo(title);
      if (!tipo || !passaFiltroArea(src, title)) continue;
      out.push({
        id: `oracle-${src.slug}-${job.Id}`,
        empresa: src.empresa,
        programa: title,
        tipo,
        area: src.area,
        cidade: job.PrimaryLocation || '',
        link: `${base}/hcmUI/CandidateExperience/${src.locale}/sites/${src.site}/job/${job.Id}`,
        fonte: `scraper:oraclecloud:${src.slug}`,
        coletado_em: todayIso()
      });
    }

    offset += ORACLE_PAGE_SIZE;
    await sleep(REQUEST_DELAY_MS);
  }
  return out;
}

// ---------------- Gupy ----------------

function parseSitemap(xml) {
  const entries = [];
  const re = /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g;
  let m;
  while ((m = re.exec(xml))) {
    entries.push({ loc: m[1].trim(), lastmod: m[2].trim() });
  }
  return entries;
}

async function fetchGupyJobPosting(url) {
  const html = await fetchText(url);
  const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  let data;
  try {
    data = JSON.parse(decodeHtmlEntities(m[1]));
  } catch (e) {
    return null;
  }
  if (!data || data['@type'] !== 'JobPosting') return null;
  return data;
}

async function collectGupy(src) {
  const feedUrl = `https://job-boards.api.gupy.io/production/job-board-content?jobBoardName=google&subdomain=${src.subdomain}`;
  const xml = await fetchText(feedUrl);
  let entries = parseSitemap(xml);
  entries.sort((a, b) => (b.lastmod || '').localeCompare(a.lastmod || ''));
  entries = entries.slice(0, MAX_JOBS_PER_GUPY_COMPANY);

  const out = [];
  for (const entry of entries) {
    let posting;
    try {
      posting = await fetchGupyJobPosting(entry.loc);
    } catch (e) {
      console.warn(`  aviso: falha ao buscar ${entry.loc}: ${e.message}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }
    await sleep(REQUEST_DELAY_MS);
    if (!posting) continue;
    const title = (posting.title || '').trim();
    const tipo = classifyTipo(title);
    if (!tipo || !passaFiltroArea(src, title)) continue;
    const cidade = posting.jobLocation && posting.jobLocation.address
      ? [posting.jobLocation.address.addressLocality, posting.jobLocation.address.addressRegion].filter(Boolean).join(', ')
      : '';
    const idMatch = /job\/([A-Za-z0-9+/=]+)/.exec(entry.loc);
    const jobIdSlug = idMatch ? idMatch[1].slice(0, 24) : Buffer.from(entry.loc).toString('base64').slice(0, 16);
    out.push({
      id: `gupy-${src.subdomain}-${jobIdSlug}`,
      empresa: (posting.hiringOrganization && posting.hiringOrganization.name) || src.empresa,
      programa: title,
      tipo,
      area: src.area,
      cidade,
      link: entry.loc.split('?')[0],
      fonte: `scraper:gupy:${src.subdomain}`,
      coletado_em: todayIso()
    });
  }
  return out;
}

// ---------------- Workday ----------------
// API "CxS" pública que o próprio site de carreiras usa pra buscar vagas — sem
// login, POST simples. Padrão: https://{tenant}.{pod}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs
//
// Como é um board global por empresa (de dezenas a milhares de vagas), filtramos
// por país usando a faceta "locationCountry" do próprio Workday em vez de procurar
// "Brazil" no texto do local — o texto varia demais entre empresas (ex: Santander
// não escreve "Brazil" em nenhuma vaga, só a cidade em caixa alta, tipo "SAO PAULO").
// Filtrar pela faceta é o único jeito confiável, e também reduz muito a paginação
// (só pagina os resultados já filtrados pro Brasil, não o board inteiro).
const WORKDAY_PAGE_SIZE = 20;

async function findWorkdayBrasilFacetId(apiUrl) {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/json' },
    body: JSON.stringify({ appliedFacets: {}, limit: 1, offset: 0, searchText: '' })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${apiUrl}`);
  const data = JSON.parse(await res.text());
  const locationGroup = (data.facets || []).find(f => f.facetParameter === 'locationMainGroup');
  const countryFacet = locationGroup && (locationGroup.values || []).find(f => f.facetParameter === 'locationCountry');
  const brasil = countryFacet && (countryFacet.values || []).find(v => /^(brazil|brasil)$/i.test(v.descriptor || ''));
  return brasil ? brasil.id : null;
}

async function collectWorkday(src) {
  const base = `https://${src.tenant}.${src.pod}.myworkdayjobs.com`;
  const apiUrl = `${base}/wday/cxs/${src.tenant}/${src.site}/jobs`;
  const out = [];

  const brasilFacetId = await findWorkdayBrasilFacetId(apiUrl);
  if (!brasilFacetId) return out; // nenhuma vaga no Brasil no momento neste board

  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/json' },
      body: JSON.stringify({ appliedFacets: { locationCountry: [brasilFacetId] }, limit: WORKDAY_PAGE_SIZE, offset, searchText: '' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${apiUrl}`);
    const data = JSON.parse(await res.text());
    total = data.total || 0;

    for (const job of data.jobPostings || []) {
      const title = (job.title || '').trim();
      const tipo = classifyTipo(title);
      if (!tipo || !passaFiltroArea(src, title)) continue;
      const reqMatch = /_([A-Za-z0-9-]+)$/.exec(job.externalPath || '');
      const idSlug = reqMatch ? reqMatch[1] : Buffer.from(job.externalPath || '').toString('base64').slice(0, 16);
      out.push({
        id: `wd-${src.tenant}-${idSlug}`,
        empresa: src.empresa,
        programa: title,
        tipo,
        area: src.area,
        cidade: job.locationsText || '',
        link: `${base}/${src.site}${job.externalPath || ''}`,
        fonte: `scraper:workday:${src.tenant}`,
        coletado_em: todayIso()
      });
    }

    offset += WORKDAY_PAGE_SIZE;
    await sleep(REQUEST_DELAY_MS);
  }
  return out;
}

// ---------------- Main ----------------

async function main() {
  const collected = [];
  const errors = [];

  for (const src of SOURCES.greenhouse || []) {
    process.stdout.write(`Greenhouse: ${src.empresa} (${src.token})... `);
    try {
      const jobs = await collectGreenhouse(src);
      collected.push(...jobs);
      console.log(`${jobs.length} vaga(s) de estágio/trainee/júnior`);
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
      errors.push({ source: `greenhouse:${src.token}`, error: e.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  for (const src of SOURCES.gupy || []) {
    process.stdout.write(`Gupy: ${src.empresa} (${src.subdomain})... `);
    try {
      const jobs = await collectGupy(src);
      collected.push(...jobs);
      console.log(`${jobs.length} vaga(s) de estágio/trainee/júnior`);
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
      errors.push({ source: `gupy:${src.subdomain}`, error: e.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  for (const src of SOURCES.workday || []) {
    process.stdout.write(`Workday: ${src.empresa} (${src.tenant})... `);
    try {
      const jobs = await collectWorkday(src);
      collected.push(...jobs);
      console.log(`${jobs.length} vaga(s) de estágio/trainee/júnior`);
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
      errors.push({ source: `workday:${src.tenant}`, error: e.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  for (const src of SOURCES.lever || []) {
    process.stdout.write(`Lever: ${src.empresa} (${src.slug})... `);
    try {
      const jobs = await collectLever(src);
      collected.push(...jobs);
      console.log(`${jobs.length} vaga(s) de estágio/trainee/júnior`);
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
      errors.push({ source: `lever:${src.slug}`, error: e.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  for (const src of SOURCES.oraclecloud || []) {
    process.stdout.write(`Oracle Cloud: ${src.empresa} (${src.slug})... `);
    try {
      const jobs = await collectOracleCloud(src);
      collected.push(...jobs);
      console.log(`${jobs.length} vaga(s) de estágio/trainee/júnior`);
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
      errors.push({ source: `oraclecloud:${src.slug}`, error: e.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  for (const src of SOURCES.citi || []) {
    process.stdout.write(`Citi: ${src.empresa}... `);
    try {
      const jobs = await collectCitiBrasil(src);
      collected.push(...jobs);
      console.log(`${jobs.length} vaga(s) de estágio/trainee/júnior`);
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
      errors.push({ source: 'citi', error: e.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  for (const src of SOURCES.smartrecruiters || []) {
    process.stdout.write(`SmartRecruiters: ${src.empresa} (${src.company})... `);
    try {
      const jobs = await collectSmartRecruiters(src);
      collected.push(...jobs);
      console.log(`${jobs.length} vaga(s) de estágio/trainee/júnior`);
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
      errors.push({ source: `smartrecruiters:${src.company}`, error: e.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  for (const src of SOURCES.zoho || []) {
    process.stdout.write(`Zoho Recruit: ${src.empresa} (${src.subdomain})... `);
    try {
      const jobs = await collectZohoRecruit(src);
      collected.push(...jobs);
      console.log(`${jobs.length} vaga(s) de estágio/trainee/júnior`);
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
      errors.push({ source: `zoho:${src.subdomain}`, error: e.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  let manual = [];
  if (fs.existsSync(MANUAL_PATH)) {
    manual = JSON.parse(fs.readFileSync(MANUAL_PATH, 'utf8')).vagas || [];
  }

  const byId = new Map();
  for (const v of collected) byId.set(v.id, v);
  for (const v of manual) byId.set(v.id, v); // curadoria manual tem prioridade em caso de conflito de id

  const vagas = Array.from(byId.values()).sort((a, b) => a.empresa.localeCompare(b.empresa));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify({
    generated_at: new Date().toISOString(),
    vagas
  }, null, 2) + '\n');

  console.log(`\nTotal: ${vagas.length} vaga(s) escritas em ${path.relative(ROOT, OUTPUT_PATH)}`);
  if (errors.length) {
    console.log(`\n${errors.length} fonte(s) com erro (não interromperam a coleta):`);
    errors.forEach(e => console.log(`  - ${e.source}: ${e.error}`));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
