# fix-d08a49c10d2c50df — `bot.on("message:text")` double-fires alongside `:entities:bot_command` for unknown commands

**Weight:** 0.0000 (share of project budget)
**Reward:** 0 PONG

In `src/bot.ts:84-90`, the `:entities:bot_command` handler (E2T2/T03) replies `"Use /ping or /count."` for unknown commands. The `message:text` handler (T01) also matches bot command messages because they carry a `text` field. Since grammy middleware runs sequentially without stopping, an unknown command like `/foobar` triggers **both** handlers, sending two replies: `"Use /ping or /count."` **and** `"I didn't understand that. Try /start to see what I can do."` This is incorrect behavior — only the fallback hint should be sent. The `message:text` filter on line 88 should exclude messages that have a `bot_command` entity.

## Dialog tests

If this task adds or changes user-facing bot behavior, author its dialog tests as a `BotSpec` JSON array in its OWN file `tests/specs/fix-d08a49c10d2c50df.json`. NEVER edit or append to a shared `tests/specs.json` — concurrent feature PRs would conflict on it. The tests-gate globs and merges all `tests/specs/*.json`.

If this task adds a bot command, declare it in its OWN file `tests/commands/fix-d08a49c10d2c50df.json` (a JSON array of command strings, e.g. `["/start"]`). NEVER edit or append to a shared `tests/commands.json` — same conflict reason. The tests-gate globs, merges + de-duplicates all `tests/commands/*.json`.


## Implementation contract

Ship a COMPLETE, working implementation — not a stub. A task is INCOMPLETE (and will be rejected) even if it compiles and the dialog tests pass when it does any of these:
- **Stubbed code:** empty bodies, `TODO`/`FIXME`, commented-out logic, or `throw new Error("not implemented")`.
- **Fabricated data:** `Math.random()`, hardcoded sample arrays, or canned responses standing in for real computed or fetched values.
- **No in-memory data store:** a `Map`/array/module-level variable used as a database is a defect. Anything that must survive a restart (records, subscriptions, balances, schedules, settings) MUST use the toolkit's persistent storage (Redis-backed), not process memory. (The toolkit's auto-selected session storage is only for ephemeral conversation state.)
- **Broken integrations:** call external APIs against their real contract — correct endpoints, ids and params (e.g. a coin *id* like `the-open-network`, not a ticker like `TON`) — with credentials read from env. Do not invent endpoints or fake responses.
- **Dead code:** new commands/handlers must be registered and reachable from the bot's command surface.
If the spec is genuinely under-specified, implement the smallest REAL slice you can verify and note the gap — never fake behavior to make the PR look complete.
