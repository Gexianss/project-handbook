#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
( sleep 1; open "http://localhost:8787" 2>/dev/null || xdg-open "http://localhost:8787" 2>/dev/null ) &
node serve.cjs 8787
