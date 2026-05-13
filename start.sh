#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[medcalc] Manual development mode"
echo ""
echo "Open two terminals and run:"
echo ""
echo "  Terminal 1:"
echo "    cd \"$ROOT_DIR/backend\""
echo "    npm run start:dev"
echo ""
echo "  Terminal 2:"
echo "    cd \"$ROOT_DIR/frontend\""
echo "    npm run dev"
echo ""
echo "URLs:"
echo "  Frontend:  http://localhost:5001"
echo "  API:       http://localhost:5000/api/v1"
echo "  API Docs:  http://localhost:5000/api/docs"
