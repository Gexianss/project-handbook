---
name: project-handbook
description: >-
  Generate a dual-audience project handbook for JS/TS projects: scan code health,
  dependencies, git hotspots and test gaps; interview the user for knowledge that lives
  outside the code (deployment, backend integration, team workflow, infrastructure);
  output a browsable HTML handbook for humans backed by markdown/JSON data files that AI
  agents read directly. Use when the user says "project handbook", "onboarding doc",
  "project health report", "document this project for humans", "幫專案做手冊", "新人文件",
  "專案體檢", "產專案手冊", or wants documentation that covers how the project is deployed
  and developed — not just what the code contains.
---

# Project Handbook

Generate a complete project handbook with two audiences served by ONE set of files:

- **Humans** open `docs-site/index.html` (via the launch script) — a navigable site with
  architecture diagrams (Mermaid) and a health dashboard.
- **AI agents** read `docs-site/data/*.md` and `*.json` directly — they ARE the site's
  content. There is no separate "AI version" to keep in sync.

The viewer template (`index.html`, `assets/`, `serve.cjs`, launch scripts) is copied once
and **never modified afterwards**. All maintenance happens in `data/` only.

## Scope

Designed for **JS/TS projects** (npm / pnpm / yarn). For other ecosystems, tell the user
the scan phase is JS/TS-specific and offer to proceed with AI-only analysis (no tool
data) — health facets that depend on missing tools get `status: "unknown"`.

## Output language

The handbook **content** language follows the user's convention: check the user's
CLAUDE.md language, the language of their messages, and existing project docs. A
Traditional-Chinese-speaking user gets a 繁體中文 handbook; an English speaker gets
English. Viewer UI strings and file names stay English. When unsure, ask.

## Workflow

Track phases with the task tools. Phases run in order.

### Phase 0 — Existing handbook check

If `docs-site/` already exists in the target project, do NOT silently overwrite. Ask the
user (AskUserQuestion) with these options, recommending the first:

1. **Audit & refresh** (default) — diff-driven, token-efficient. Procedure:
   1. Read the baseline `commit` from `data/manifest.js`. Run
      `git diff --name-status <baseline>..HEAD` and `git log --oneline <baseline>..HEAD`.
      If the baseline is unreachable (rebase, squash, shallow clone) or there is no git
      history, fall back to a full audit of every section.
   2. Map changed files to affected sections (e.g. route/state/API files →
      `architecture`; package.json scripts, configs, lockfile → `dev-guide`; API-layer
      files → `integration`; setup files → `onboarding`). **Deep-read and fix only the
      affected sections.**
   3. Sections with no related changes are proven current by the diff itself — keep
      their content and `updatedAt` untouched; do not re-read them.
   4. Always re-run the full Phase 1 scan to refresh `health.json` (tool-driven, cheap).
   5. Interview-sourced content (`deployment`, `collaboration`) is not derivable from a
      code diff — just re-ask previously unanswered "⚠️ To confirm" items.
   6. Preserve hand-written content; never touch template files. Update manifest
      `generatedAt`/`commit` to the new baseline; bump a section's `updatedAt` only if
      its content actually changed (see freshness contract, Phase 4).
   7. In the final report, state which sections were re-checked and which were skipped
      because the diff proved them unchanged.
2. **Skip** — existing handbook is fine; stop.
3. **Regenerate** — full rewrite; only when the user confirms nothing is worth keeping.

If `docs-site/` does not exist, continue to Phase 1.

### Phase 1 — Automated scan (tools first, AI fallback)

Principle: prefer real tool output; fall back to AI code-reading only when a tool cannot
run, and record which sources were actually used in `health.json` `meta.toolsUsed`.
A facet with no reliable data gets `status: "unknown"` — never invent numbers.

| Facet | Primary commands | AI fallback |
|---|---|---|
| `code-health` | line counts of tracked source files (`git ls-files` + count); `npx -y knip --no-progress --reporter compact` for unused exports/files | read the largest files; note dead/commented-out code seen while reading |
| `dependencies` | `npm outdated --json`; `npm audit --json` (or pnpm/yarn equivalents — detect via lockfile) | compare package.json ranges against lockfile |
| `git-hotspots` | `git log --since="12 months ago" --pretty=format: --name-only` aggregated per file (top ~20); `git shortlog -sn`; files untouched ≥ 12 months in active dirs | skip facet with `unknown` if no git history |
| `testing` | count test files (`*.test.*`, `*.spec.*`, `__tests__/`); run coverage only if a coverage script already exists; `npx tsc --noEmit` if tsconfig present; eslint error count if config present | map test files against key logic areas (payment, auth, data writes) and name untested ones |

Write results into `data/health.json` following `references/health-schema.md`.
Cross-link insights between facets (e.g. a file that is both oversized AND a git hotspot
deserves a `warn` item saying so).

### Phase 2 — Architecture read

Read the project deeply enough to produce CORRECT diagrams and a navigable guide:
entry points, routing, state management, API layer, module boundaries, build setup.
Draft (as Mermaid `flowchart`) at minimum: a system map (frontend ↔ backend ↔ external
services) and a frontend data-flow diagram. Verify every path/name you write actually
exists — diagrams with wrong names are worse than no diagrams.

### Phase 3 — Interview (knowledge that is NOT in the code)

**Enumerate once, then batch-ask. Never drip-feed questions one at a time.**

1. From Phases 1–2 findings, build ONE complete question list, customized to the project
   (e.g. found an axios baseURL pointing to a domain → ask who owns that backend and
   where its docs live; found a Dockerfile → ask where images are deployed).
2. Standard categories (adapt, drop irrelevant ones):
   - **Deployment** — where does it run (VPS/cloud/on-prem)? how does a release happen?
     who has access? rollback procedure?
   - **Backend & integrations** — who owns each upstream API? staging environments?
     API docs location? auth model?
   - **Team workflow** — how do designs arrive (Figma? specs?)? code review rules?
     who decides priorities? release cadence?
   - **Infrastructure** — machine specs, memory/capacity limits, monitoring/alerting,
     logs location?
   - **Operations** — who are the users? peak hours? known recurring incidents?
3. Ask via AskUserQuestion, grouped by category, a few questions per round.
4. The user may not know answers. Mark those **⚠️ To confirm** and add a concrete
   pointer: *who to ask / where to look* (e.g. "ask whoever owns the CI config",
   "check the cloud console billing page"). Collect all of these into a "To-confirm
   list" in the relevant data file. **Never present a guess as fact.**

### Phase 4 — Generate the handbook

1. Copy the template: everything in this skill's `template/` directory →
   `<project>/docs-site/` (creating it). On macOS/Linux also `chmod +x docs-site/open-handbook.sh`.
2. Write `data/manifest.js`:

```js
window.HANDBOOK_MANIFEST = {
  project: "<Project Name>",
  generatedAt: "<YYYY-MM-DD>",          // date of this generation or audit run
  commit: "<short hash>",               // code baseline this handbook was verified against
  language: "<content language code>",
  sections: [
    { id: "overview",      title: "...", file: "overview.md",      type: "markdown", updatedAt: "<YYYY-MM-DD>" },
    { id: "architecture",  title: "...", file: "architecture.md",  type: "markdown", updatedAt: "<YYYY-MM-DD>" },
    { id: "dev-guide",     title: "...", file: "dev-guide.md",     type: "markdown", updatedAt: "<YYYY-MM-DD>" },
    { id: "deployment",    title: "...", file: "deployment.md",    type: "markdown", updatedAt: "<YYYY-MM-DD>" },
    { id: "integration",   title: "...", file: "integration.md",   type: "markdown", updatedAt: "<YYYY-MM-DD>" },
    { id: "collaboration", title: "...", file: "collaboration.md", type: "markdown", updatedAt: "<YYYY-MM-DD>" },
    { id: "onboarding",    title: "...", file: "onboarding.md",    type: "markdown", updatedAt: "<YYYY-MM-DD>" },
    { id: "health",        title: "...", file: "health.json",      type: "health",   updatedAt: "<YYYY-MM-DD>" }
  ]
};
```

   Section titles are written in the content language. The list above is the default
   skeleton — **scale to the project**: a frontend-only demo with no backend merges
   `integration` into `architecture`; drop `collaboration` for a solo project. Every
   section in the manifest must have a corresponding file.

   **Freshness contract:** `generatedAt` and `commit` describe the latest run (initial
   generation OR audit). Each section's `updatedAt` is the date its CONTENT last
   changed. On an audit run, update `generatedAt`/`commit` always, but bump a section's
   `updatedAt` only if you actually edited that file — sections verified-but-unchanged
   keep their old `updatedAt`. The viewer shows "Updated <updatedAt> · verified at
   <commit>" under each page title.

3. Write the `data/*.md` files. Content guide:
   - `overview.md` — what the project is, who uses it, what problem it solves. Mostly
     interview-sourced.
   - `architecture.md` — the Phase 2 diagrams + module map table with real paths.
   - `dev-guide.md` — how to run it locally (verified commands), conventions, branch
     strategy.
   - `deployment.md` — where it runs, how releases happen, capacity. Interview-sourced;
     this is where most ⚠️ To confirm items usually live.
   - `integration.md` — upstream APIs, external services, who owns them. Scan + interview.
   - `collaboration.md` — design handoff, review rules, team workflow. Interview-sourced.
   - `onboarding.md` — a new developer's day one: environment → run it → make a first
     small change (point at a real, easy file).
   - Markdown rules: GitHub-flavored; Mermaid in fenced ```mermaid blocks; use
     `file:line` references for code pointers; do not paste long code excerpts.
4. Write `data/health.json` from Phase 1 results (schema: `references/health-schema.md`).
5. Add a pointer to the project's CLAUDE.md (create if missing, append if present):

```markdown
## Project handbook

`docs-site/data/` holds this project's handbook as markdown/JSON — read it for
architecture, deployment, and team context. Humans: run `docs-site/open-handbook.bat`
(Windows) or `docs-site/open-handbook.sh` (macOS/Linux) to browse it.
```

### Phase 5 — Verify & report

1. Start the server (`node docs-site/serve.cjs 8787`, background) and verify:
   `/`, `/data/manifest.js`, and every file referenced in the manifest return 200.
2. If a browser tool (e.g. Playwright) is available, screenshot the architecture and
   health pages and confirm Mermaid diagrams rendered as SVG (not raw text). Otherwise,
   tell the user to open the handbook and check the diagrams.
3. Spot-check `file:line` and path references in the data files against the real code.
4. Report to the user: deliverables list, one-line health summary per facet, and the
   complete ⚠️ To-confirm list with its "who to ask / where to look" pointers.

## Honesty rules

- Tool didn't run → facet is `unknown`, and `meta.toolsUsed` reflects reality.
- User couldn't answer → ⚠️ To confirm, never a guess dressed as fact.
- Bugs or risks noticed while reading code → report them; don't silently fix anything.
- This skill reports health; it does not refactor, upgrade, or fix.
