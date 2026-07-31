#!/usr/bin/env node
// Coletor do Radar de Vagas (Estágio Zero).
// Lê scripts/sources.json (fontes verificadas manualmente — ver README) e
// data/manual.json (curadoria manual), gera data/vagas.json no formato que
// index_10.html consome via fetch().
//
// Fontes suportadas hoje:
//   - Greenhouse: API JSON pública e oficial (boards-api.greenhouse.io)
//   - Gupy: feed de sitemap (Google for Jobs) + JSON-LD JobPosting nas páginas
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
const TIPO_PATTERNS = [
  { tipo: 'trainee', re: /trainee/i },
  { tipo: 'estagio', re: /estagi/i }
];

function classifyTipo(title) {
  for (const p of TIPO_PATTERNS) if (p.re.test(title)) return p.tipo;
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.text();
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
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
    if (!tipo) continue;
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
    if (!tipo) continue;
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
