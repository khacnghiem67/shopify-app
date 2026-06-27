# Claude Code hooks

Project hooks for this repo, wired in `.claude/settings.json`.

## `test-on-code-change.sh` — PostToolUse(Edit|Write)

After Claude edits/writes a TypeScript source file under `app/`, this hook
auto-runs the Vitest unit suite (`npm run test`). It keeps the pure logic
(`app/lib/pricing.ts`, `app/lib/filter.ts`) verified after every change — an
automated piece of the harness **Feedback** subsystem.

- Parses the hook's stdin JSON with `node` (no `jq` dependency).
- Only fires for `*/app/*.ts(x)` paths; skips docs/config edits.
- Never blocks (always `exit 0`) — it is a convenience verifier, not a gate.

Manage/disable via the `/hooks` menu.
