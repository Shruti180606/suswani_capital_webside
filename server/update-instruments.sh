#!/bin/bash
set -e

TARGET="/var/www/suswani_capital_webside/server/instruments.json"
TMP="/var/www/suswani_capital_webside/server/instruments.json.tmp"
LOG="/var/www/suswani_capital_webside/server/update-instruments.log"

echo "[$(date)] Starting instrument master update" >> "$LOG"

curl -s -o "$TMP" "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"

# Sanity check: file must exist, be non-trivial in size, and be valid JSON
if [ ! -s "$TMP" ]; then
  echo "[$(date)] FAILED: downloaded file is empty" >> "$LOG"
  rm -f "$TMP"
  exit 1
fi

SIZE=$(stat -c%s "$TMP")
if [ "$SIZE" -lt 1000000 ]; then
  echo "[$(date)] FAILED: downloaded file too small ($SIZE bytes), aborting swap" >> "$LOG"
  rm -f "$TMP"
  exit 1
fi

python3 -c "import json; json.load(open('$TMP'))" 2>> "$LOG"
if [ $? -ne 0 ]; then
  echo "[$(date)] FAILED: downloaded file is not valid JSON, aborting swap" >> "$LOG"
  rm -f "$TMP"
  exit 1
fi

mv "$TMP" "$TARGET"
echo "[$(date)] SUCCESS: instruments.json updated ($SIZE bytes)" >> "$LOG"

pm2 restart suswani-backend >> "$LOG" 2>&1
echo "[$(date)] Backend restarted" >> "$LOG"
