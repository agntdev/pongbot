## PongBot — refined brief

Summary

PongBot is a minimal Telegram bot that greets users and implements a global, persisted ping counter. It supports exactly three commands: /start (warm greeting), /ping (replies "pong 🏓" and increments a global counter), and /count (returns the persisted global total of pings served). No per-user state, no external APIs, and no additional features.

Audience

- Bot owner and maintainers who want a tiny, reliable Telegram utility to count pings.
- Developers who will build, deploy, and maintain the service.

Core entities

- GlobalCounter: single persisted integer representing total pings served.
- Commands: /start, /ping, /count (each a stateless interaction except that /ping mutates GlobalCounter).

Integrations & notification targets

- Telegram Bot API only (via bot token). Use long polling by default (simple local deployment). 
- Logging: stdout/stderr (suitable for container logs). No external monitoring, analytics, or notification services.

Interaction flows

- /start
  - User sends: /start
  - Bot replies: a warm greeting (e.g. "Hi — I'm PongBot! Send /ping to get a pong 🏓 and increment the global counter.").

- /ping
  - User sends: /ping
  - Bot atomically increments the GlobalCounter and replies exactly: "pong 🏓" (no per-user messaging or data stored).

- /count
  - User sends: /count
  - Bot reads the persisted GlobalCounter and replies: "Total pings served: <N>" where <N> is the current global total.

- Unknown commands
  - Minimal fallback: reply with a single-line hint: "Use /ping or /count." (keeps scope minimal while remaining user-friendly).

Persistence

- SQLite database persisted to disk (default path ./data/pings.sqlite).
- Schema: single table `counter` with columns (name TEXT PRIMARY KEY, value INTEGER NOT NULL).
- Implementation notes: increment performed in a single SQL transaction (e.g. UPDATE ...; SELECT value) to avoid race conditions. On startup, create DB and ensure row ('pings', 0) exists.

Payments

- None.

Non-goals

- No per-user state, authentication, or profiles.
- No external APIs, analytics, or third-party integrations.
- No admin UI, webhooks, or dashboards beyond logs.
- No payments or monetization features.

## Assumptions & defaults

- Language & framework: Python 3.11 with python-telegram-bot (v20+) using asyncio and long polling — chosen for simplicity, maturity, and ease of deployment.
  Rationale: minimal dependencies and common developer familiarity.

- Persistence: SQLite at ./data/pings.sqlite, table `counter` with key 'pings' — chosen for zero-ops persistence and atomic updates.
  Rationale: meets requirement to persist a global total with no external DB.

- Bot token delivery: required via environment variable TELEGRAM_TOKEN at runtime.
  Rationale: standard 12-factor practice and safe for containerized deployment.

- Concurrency & safety: use SQL transaction (BEGIN; UPDATE; SELECT; COMMIT) to atomically increment and read the counter.
  Rationale: prevents lost updates under concurrent /ping requests.

- Deployment & runtime: default run mode is long polling (python script or container); repository includes a simple Dockerfile and README for running with TELEGRAM_TOKEN set.
  Rationale: polling is simplest for small bots and avoids webhook configuration.

- Logging & errors: log to stdout; on DB failure the bot returns a short error message to the user and logs the stack trace.
  Rationale: keeps behavior predictable while surfacing issues to operators.

