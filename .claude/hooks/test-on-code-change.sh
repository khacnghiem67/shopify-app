#!/usr/bin/env bash
# PostToolUse(Edit|Write) hook — part of the harness "Phản hồi (Feedback)" subsystem.
# When a TypeScript source file under app/ is edited, auto-run the Vitest unit
# suite so the pure logic stays verified after every change. Never blocks
# (exits 0) — it is a convenience verifier, not a gate.
input="$(cat)"

# Parse + match entirely in node (robust JSON + path handling; node is always
# present in this project, unlike jq). Prints "yes" if a TS file under app/ changed.
should_run="$(printf '%s' "$input" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);const f=((j.tool_input&&j.tool_input.file_path)||'').replace(/\\\\/g,'/');process.stdout.write(/\\/app\\/.*\\.(ts|tsx)\$/.test(f)?'yes':'no');}catch(e){process.stdout.write('no');}});")"

if [ "$should_run" = "yes" ]; then
  echo "[harness hook] code changed → running unit tests…"
  npm run test --silent 2>&1 || true
fi
exit 0
