#!/usr/bin/env bash
# init.sh — Environment + Feedback subsystem.
# Installs and runs the full verification chain from a clean checkout.
# Stays green WITHOUT a connected Shopify store (stops at build).
# The live "Apply prices to store" path is verified manually in the demo.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

step "1/6 Check Node 22 (see .nvmrc)"
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node not found. Install Node 22 (see .nvmrc) and retry." >&2
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" != "22" ]; then
  echo "Error: need Node 22 (see .nvmrc); got $(node -v). Run: nvm use" >&2
  exit 1
fi
echo "Node $(node -v) OK"

step "2/6 npm install"
npm install

step "3/6 Prisma generate (SQLite session client)"
npx prisma generate

step "4/6 Typecheck (tsc --noEmit)"
npm run typecheck

step "5/6 Lint + Test (eslint + vitest)"
npm run lint
npm run test

step "6/6 Build (remix vite:build)"
npm run build

echo ""
printf '\033[1m================ HARNESS GREEN ================\033[0m\n'
cat <<'EOF'

Environment ready and verified (typecheck + lint + test + build all pass).

To run against a Shopify dev store (manual demo step):
  1. npm run config:link     # link this app to your Partner org/app
  2. npm run dev             # opens the embedded app in your dev store

Next: open feature_list.json, pick the highest-priority unfinished feature,
implement it, then re-run `bash init.sh` and paste the output into evidence.
EOF
