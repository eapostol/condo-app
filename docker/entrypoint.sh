#!/bin/sh
set -e

# Optional: run demo seed once on container startup.
#
# Enable with: SEED_ON_START=true
#
# The seed-once script only runs when MongoDB has ZERO users.
# If users exist, it prints a skip message and continues.

wait_for_mongo() {
  if [ -z "$MONGO_URI" ]; then
    echo "[entrypoint] MONGO_URI is not set; skipping Mongo wait."
    return 0
  fi

  echo "[entrypoint] Waiting for MongoDB..."
  attempts=60
  i=1
  while [ $i -le $attempts ]; do
    if node --input-type=module -e "import mongoose from 'mongoose'; const uri=process.env.MONGO_URI; await mongoose.connect(uri,{serverSelectionTimeoutMS:1000,dbName:'condo_app'}); await mongoose.disconnect();" >/dev/null 2>&1; then
      echo "[entrypoint] MongoDB is ready."
      return 0
    fi
    echo "[entrypoint] MongoDB not ready yet ($i/$attempts)..."
    i=$((i+1))
    sleep 1
  done

  echo "[entrypoint] Timed out waiting for MongoDB."
  return 1
}

if [ "${SEED_ON_START}" = "true" ]; then
  wait_for_mongo
  echo "[entrypoint] SEED_ON_START=true; running seed-once..."
  node /app/server/src/scripts/seed-once.js || true
else
  echo "[entrypoint] SEED_ON_START is not true; skipping seed-once."
fi

echo "[entrypoint] Starting backend..."
exec "$@"
