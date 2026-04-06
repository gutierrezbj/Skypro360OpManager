#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
export NODE_PATH="/usr/local/bin/node"
cd "/Users/juanguti/Library/CloudStorage/OneDrive-Personal/02.SR docs/Skypro_360/OpsManager/app"
exec /usr/local/bin/npm run dev -- --port "${PORT:-3100}"
