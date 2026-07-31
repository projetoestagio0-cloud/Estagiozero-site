# data/vagas.json — Radar de Vagas (Estágio Zero)

Fonte de dados da seção **Vagas** do site (`#processos` em `index_10.html`). O
front-end faz `fetch('data/vagas.json')` e renderiza a lista `vagas` com os
filtros de tipo/área/busca. Este arquivo pode ser editado manualmente
(curadoria) e, no futuro, sobrescrito por um pipeline automatizado
(scraper + merge com curadoria manual) — nesse caso, o pipeline deve preservar
exatamente este formato.

## Formato

```json
{
  "generated_at": "2026-08-01T09:00:00-03:00",
  "vagas": [
    {
      "id": "itau-trainee-2027",
      "empresa": "Itaú Unibanco",
      "programa": "Programa de Trainee 2027",
      "tipo": "trainee",
      "area": "banco",
      "cidade": "São Paulo, SP",
      "link": "https://...",
      "fonte": "manual",
      "coletado_em": "2026-08-01"
    }
  ]
}
```

## Campos por vaga

| Campo | Obrigatório | Valores/descrição |
|---|---|---|
| `id` | sim | string única e estável (usada para deduplicar entre coletas) |
| `empresa` | sim | nome da empresa |
| `programa` | sim | nome do programa/cargo (ex: "Programa de Trainee 2027") |
| `tipo` | sim | `estagio` \| `trainee` \| `junior` |
| `area` | sim | `banco` \| `corretora-fintech` \| `asset` \| `vc-pe` \| `real-estate-infra` \| `research` |
| `cidade` | não | cidade/UF ou "Remoto" |
| `link` | sim | URL da vaga/programa na página oficial da empresa — nunca reproduzir o conteúdo da vaga em si, só linkar (mesmo princípio de agregadores como Google for Jobs) |
| `fonte` | sim | `manual` ou identificador da fonte automatizada (ex: `scraper:gupy`) |
| `coletado_em` | sim | data ISO (`YYYY-MM-DD`) da última verificação/coleta desta vaga |

## Status atual

Vazio (`vagas: []`) até que as empresas-alvo tenham suas páginas de carreira e
plataformas de ATS verificadas (em andamento) — para não publicar vagas de
empresas reais com links não confirmados.
