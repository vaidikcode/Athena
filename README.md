# Phuko AI — Life Operating System

An AI agent that runs hourly and daily to analyse your life patterns, consult your personal rules, and suggest (or execute) calendar optimisations. Built with Next.js 15, LangGraph.js, and Drizzle + libSQL (`@libsql/client`). Runs locally against a `file:./phuko.db` SQLite file by default; swap to a hosted Turso DB with a single env-var change.

---

## Architecture

```
instrumentation.ts
  └─ runMigrations()          # libSQL schema on boot (creates tables if absent)
  └─ cron/scheduler.ts        # interval scheduler: hourly at :00, daily at 00:05
        └─ agent/runner.ts    # runHourly() / runDaily()
              └─ graph.ts     # LangGraph StateGraph
                    ├─ loadContext   (rules + prior memories)
                    ├─ collect       (mock collectors → real MCPs later)
                    ├─ reason ⟷ ToolNode  (LLM loop)
                    ├─ propose       (extract Suggestion rows)
                    └─ summarize → writeMemory + writeRun
```

### Tool Registry (3 layers)
| Layer | Tools | Swap path |
|---|---|---|
| Mock collectors | `fetch_window_events`, `fetch_emails_last_hour`, `fetch_slack_last_hour`, `fetch_health_stats` | Replace body in `src/lib/tools/collectors.ts` |
| Rule CRUD | `list_rules`, `create_rule`, `update_rule`, `delete_rule` | `src/lib/rules/tools.ts` |
| Custom calendar | `list_events`, `create_event`, … | `src/lib/calendar/` + libSQL |

### LLM Switching
Set `LLM_PROVIDER=gemini` (default) or `LLM_PROVIDER=ollama` in `.env.local`. The agent graph is fully provider-agnostic — both providers expose the same `BaseChatModel` interface.

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo>
cd Phuko_AI
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your keys
```

Minimum required for first run:
- `GEMINI_API_KEY` (or set `LLM_PROVIDER=ollama` + have Ollama running)

### 3. Run

```bash
npm run dev
# App at http://localhost:3000
```

DB migrations run automatically on first boot via `instrumentation.ts`.

---

## UI Screens

| Route | Description |
|---|---|
| `/` | Dashboard — today's hourly timeline, run triggers, cron ETA, pending suggestions count |
| `/rules` | Rules manager — agent-proposed inbox, CRUD list with enable/disable toggle |
| `/memory` | Memory viewer — Hourly / Daily / Yesterday tabs with raw event explorer |
| `/runs` | Run history — expandable transcripts, tool calls, timing |

---

## Manual Triggers (no cron needed for dev)

```bash
# Trigger hourly agent
curl -X POST http://localhost:3000/api/runs/hourly

# Trigger daily agent
curl -X POST http://localhost:3000/api/runs/daily
```

Or use the "Run Hourly Now" / "Run Daily Now" buttons on the Dashboard.

---

## Adding Real Data Sources

Each mock collector in `src/lib/tools/collectors.ts` is a LangChain `StructuredTool` with a stable name and schema. To add a real source:

1. Replace the `async` body of the relevant tool with your actual MCP/API call
2. Keep the return shape (JSON array of events) identical
3. No agent code changes needed

---

## Env Reference

| Variable | Default | Description |
|---|---|---|
| `LLM_PROVIDER` | `gemini` | `gemini` or `ollama` |
| `GEMINI_API_KEY` | — | Google AI Studio API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Model name |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `qwen2.5:7b-instruct` | Ollama model (must support tools) |
| `DATABASE_URL` | `file:./phuko.db` | libSQL URL — local file or `libsql://…` for Turso cloud |
| `DATABASE_AUTH_TOKEN` | — | Turso auth token (only needed for cloud URL) |
| `CRON_ENABLED` | `true` | Enable/disable automatic cron |
| `NEXT_PUBLIC_LLM_PROVIDER` | — | Shows provider in sidebar UI |
