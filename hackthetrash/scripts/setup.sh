#!/usr/bin/env bash
set -e
echo "📦 Installing backend deps..."
cd backend && npm install && cd ..
echo "📦 Installing frontend deps..."
cd frontend && npm install && cd ..
echo "✅ Done. Run 'bash scripts/dev.sh' to start."
