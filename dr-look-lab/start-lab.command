#!/bin/bash
# Double-click to preview the Dr. Look site locally (same address as the live site). Close this window to stop it.
cd "$(dirname "$0")/.."
PORT=8123
(sleep 1; open "http://localhost:$PORT/en/drlook_usa/") &
echo "Dr. Look site running at http://localhost:$PORT/en/drlook_usa/  (lab: /en/drlook_usa/lab/)  — close this window to stop"
python3 -m http.server $PORT --bind 127.0.0.1
