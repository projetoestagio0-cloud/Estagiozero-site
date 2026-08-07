/* Radar de vagas — Estágio Zero (dono: Pedro). Editar aqui, não no index.html.
   Lê data/vagas.json e injeta os cards em #vagasList. */
(function(){
  function initVagas(){
  // ---- Radar de vagas ----
  var VAGAS_DATA = [];
  var TIPO_LABEL = {estagio:'Estágio', trainee:'Trainee', junior:'Júnior/Analista'};
  var AREA_LABEL = {'banco':'Banco','corretora-fintech':'Corretora/Fintech','asset':'Gestora/Hedge Fund','vc-pe':'VC/PE','real-estate-infra':'Real Estate/Infra','research':'Research'};
  function escapeHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  // Classificação por palavra-chave no título/programa — pensada pra ser restritiva:
  // só marca como "área financeira" o que claramente bate com mercado financeiro,
  // consultoria ou função financeira corporativa. Título genérico ou de outra área
  // (design, RH, jurídico, TI, marketing, suporte) fica de fora por padrão — é melhor
  // perder algum caso ambíguo do que misturar vaga fora do perfil do site.
  var AREA_FINANCEIRA_RE = /m&a|\bdcm\b|\becm\b|investment banking|corporate finance|fus(õ|o)es e aquisi[çc][õo]es|societ[áa]rio|trading|sales and trading|\bmarkets?\b|mercado(s)? financeiro|renda fixa|c[âa]mbio|derivativos|commodities|\bequit(y|ies)\b|execu[çc][ãa]o onshore|\bresearch\b|cr[ée]dito|risco de (mercado|cr[ée]dito)|gest[ãa]o de (fundos|recursos|ativos|patrim[ôo]nio)|fundos e previd[êe]ncia|asset management|private equity|real estate (investment|advisory)|contabilidade|controladoria|tesouraria|planejamento (financeiro|or[çc]ament[áa]rio)|\bfp\s?&\s?a\b|auditoria|\baudit\b|consultoria|strategy consulting|\beconomia\b|econ[ôo]mic[oa]|corporate desk|daily banker|wealth management|structured products|\besg\b|\bbanker\b|financ|front office|corretora institucional/i;
  // Termos de outras áreas — têm prioridade sobre a regra abaixo: mesmo numa
  // gestora/fundo boutique, um estágio explicitamente de Jurídico, Design etc.
  // continua fora.
  var AREA_NAO_FINANCEIRA_RE = /jur[íi]dic|\blegal\b|\bdesign\b|\bcrm\b|marketing|comunica[çc][ãa]o|reda[çc][ãa]o|\bconte[úu]do\b|social media|recursos humanos|\brh\b|recrutamento|talent acquisition|customer (success|experience|experince)|suporte (comercial|ao cliente)|atendimento|desenvolvedor|\bengineering\b|\bgrowth\b|\bproduto\b|product ops|\bdados\b|data analytics|inteligência artificial/i;
  // Gestoras, fundos de VC/PE e casas de research são, por natureza, empresas
  // de mercado financeiro — não existe "departamento de design" numa boutique
  // dessas, então um programa de estágio genérico ali já conta como relevante,
  // mesmo sem palavra-chave específica no título (ex: "Estágio Patria Academy").
  var AREAS_MERCADO_FINANCEIRO_PURO = {asset:1, 'vc-pe':1, research:1};
  function isAreaFinanceira(v){
    var titulo = v.programa || '';
    if(AREA_NAO_FINANCEIRA_RE.test(titulo)) return false;
    if(AREA_FINANCEIRA_RE.test(titulo)) return true;
    return !!AREAS_MERCADO_FINANCEIRO_PURO[v.area];
  }
  function renderVagas(){
    var list = document.getElementById('vagasList');
    var status = document.getElementById('vagasStatus');
    if(!list || !status) return;
    var searchEl = document.getElementById('vagasSearch'), tipoEl = document.getElementById('vagasTipo'), areaEl = document.getElementById('vagasArea'), empresaEl = document.getElementById('vagasEmpresa'), todasAreasEl = document.getElementById('vagasTodasAreas');
    var q = (searchEl.value || '').trim().toLowerCase();
    var tipo = tipoEl.value, area = areaEl.value, empresa = empresaEl.value;
    var filtered = VAGAS_DATA.filter(function(v){
      if(!todasAreasEl.checked && !isAreaFinanceira(v)) return false;
      if(tipo && v.tipo !== tipo) return false;
      if(area && v.area !== area) return false;
      if(empresa && v.empresa !== empresa) return false;
      if(q && ((v.empresa || '') + ' ' + (v.programa || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if(!VAGAS_DATA.length){
      status.textContent = '';
      list.innerHTML = '<div class="vagas-empty">O radar de vagas está sendo montado. Em breve, vagas reais de bancos, corretoras, gestoras, fundos e casas de research vão aparecer aqui automaticamente.<br>Quer indicar uma vaga ou uma empresa? <a href="#contato" data-nav style="color:var(--accent);font-weight:600">fala com a gente</a>.</div>';
      return;
    }
    status.textContent = filtered.length + (filtered.length === 1 ? ' vaga encontrada' : ' vagas encontradas');
    if(!filtered.length){
      list.innerHTML = '<div class="vagas-empty">Nenhuma vaga com esse filtro agora. Tente limpar a busca ou volte em breve — o radar é atualizado periodicamente.</div>';
      return;
    }
    list.innerHTML = filtered.map(function(v){
      var tipoCls = 'tipo-' + (v.tipo || '');
      return '<div class="card vaga-card">' +
        '<div class="vc-top"><span class="vc-empresa">' + escapeHtml(v.empresa) + '</span><span class="tag ' + tipoCls + '">' + escapeHtml(TIPO_LABEL[v.tipo] || v.tipo) + '</span></div>' +
        '<h4>' + escapeHtml(v.programa) + '</h4>' +
        '<div class="vc-meta"><span>' + escapeHtml(AREA_LABEL[v.area] || v.area) + '</span>' + (v.cidade ? '<span>' + escapeHtml(v.cidade) + '</span>' : '') + '</div>' +
        '<div class="vc-foot"><span class="vc-fonte">' + (v.coletado_em ? 'Coletado em ' + escapeHtml(v.coletado_em) : '') + '</span><a href="' + encodeURI(v.link || '#') + '" target="_blank" rel="noopener" class="btn btn-ghost">Ver vaga →</a></div>' +
      '</div>';
    }).join('');
  }
  function populaVagasEmpresa(){
    var empresaEl = document.getElementById('vagasEmpresa');
    if(!empresaEl) return;
    var nomes = [];
    VAGAS_DATA.forEach(function(v){ if(v.empresa && nomes.indexOf(v.empresa) < 0) nomes.push(v.empresa); });
    nomes.sort(function(a,b){ return a.localeCompare(b, 'pt-BR'); });
    empresaEl.innerHTML = '<option value="">Todas as empresas</option>' + nomes.map(function(n){
      return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + '</option>';
    }).join('');
  }
  fetch('data/vagas.json').then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function(data){ VAGAS_DATA = (data && data.vagas) || []; populaVagasEmpresa(); renderVagas(); })
    .catch(function(){
      var status = document.getElementById('vagasStatus');
      var list = document.getElementById('vagasList');
      if(status) status.textContent = '';
      if(list) list.innerHTML = '<div class="vagas-empty">Não consegui carregar as vagas agora. Se você abriu este arquivo direto no navegador (file://), rode um servidor local — o fetch de data/vagas.json não funciona por file://.</div>';
    });
  ['vagasSearch','vagasTipo','vagasArea','vagasEmpresa','vagasTodasAreas'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('input', renderVagas);
  });
  }
  if (document.readyState !== 'loading') initVagas();
  else document.addEventListener('DOMContentLoaded', initVagas);
})();
