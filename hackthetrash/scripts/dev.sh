#!/usr/bin/env bash
# Start both frontend and backend in dev mode (requires `concurrently` globally OR tmux).
echo "Starting backend on :4000 and frontend on :3000"
(cd backend && npm run dev) &
(cd frontend && npm run dev) &
wait
