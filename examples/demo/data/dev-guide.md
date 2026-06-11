# Dev Guide

## First run

```bash
npm install
npm run dev        # Vite on :5173, proxies /api to :3000
npm run server     # Express on :3000 (separate terminal)
```

## Conventions

- **Branches:** `feat/*`, `fix/*` off `main`; squash-merge via PR
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`)
- **State:** new domain → new Zustand slice in `src/store/`, never grow an existing slice past ~150 lines
- **API calls:** always through `src/api/client.ts` — never raw `fetch` in components

## Testing

```bash
npm test           # vitest, co-located *.test.ts files
```
