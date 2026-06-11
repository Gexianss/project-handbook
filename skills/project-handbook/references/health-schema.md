# health.json schema

`data/health.json` drives the Health Report dashboard in the viewer. Produce it in
Phase 1 (scan) and refresh it on every audit run.

## Top level

```json
{
  "meta": { ... },
  "facets": [ ... ]
}
```

## meta

| Field | Type | Required | Notes |
|---|---|---|---|
| `generatedAt` | string | yes | ISO date of the scan |
| `commit` | string | no | short hash at scan time |
| `branch` | string | no | branch at scan time |
| `toolsUsed` | string[] | no | which tools produced the data (honesty: list only what actually ran) |

## facets[] — one per scan dimension

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | kebab-case, stable across runs (`code-health`, `dependencies`, `git-hotspots`, `testing`) |
| `title` | string | yes | card heading |
| `status` | `"ok" \| "warn" \| "critical" \| "unknown"` | yes | `unknown` when the tool could not run — never guess |
| `summary` | string | yes | one sentence, human-readable |
| `metrics` | `{label, value}[]` | no | the big numbers on the card |
| `items` | `{label, detail?, severity?}[]` | no | individual findings; `severity` is `"info" \| "warn" \| "critical"` (default `info`) |

## Rules

- A facet whose tool failed or is unavailable gets `status: "unknown"` and a `summary`
  explaining why (e.g. "knip could not run — no findings collected"). Do not invent data.
- Keep `items` to findings worth a human's attention (≤ 15 per facet); totals belong in `metrics`.
- The standard four facets above are expected; add extra facets only when the project
  has a meaningful extra dimension (e.g. `bundle-size`).
