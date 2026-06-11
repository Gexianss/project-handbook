# Architecture

## System map

```mermaid
flowchart LR
  Browser["React SPA<br/>(Vite build)"] -->|REST /api/*| API["Express server"]
  API --> DB[("SQLite")]
  API --> Mail["SMTP relay<br/>(daily digest)"]
```

## Frontend data flow

```mermaid
flowchart TD
  UI[Component] -->|dispatch| Store[Zustand store]
  Store -->|fetch| Api[api/client.ts]
  Api -->|JSON| Store
  Store -->|subscribe| UI
```

## Module map

| Area | Path | Notes |
|---|---|---|
| Routes | `src/pages/` | One folder per route |
| Shared UI | `src/components/` | 23 components |
| State | `src/store/` | Zustand, one slice per domain |
| API client | `src/api/client.ts` | All requests go through here |
| Server | `server/` | Express app, REST only |
