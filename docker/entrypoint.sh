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

wait_for_mysql() {
  if [ -z "$MYSQL_HOST" ]; then
    echo "[entrypoint] MYSQL_HOST is not set; skipping MySQL wait."
    return 0
  fi

  echo "[entrypoint] Waiting for MySQL..."
  attempts=60
  i=1
  while [ $i -le $attempts ]; do
    if node --input-type=module -e "import mysql from 'mysql2/promise'; const conn = await mysql.createConnection({host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306), user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE}); await conn.query('SELECT 1'); await conn.end();" >/dev/null 2>&1; then
      echo "[entrypoint] MySQL is ready."
      return 0
    fi
    echo "[entrypoint] MySQL not ready yet ($i/$attempts)..."
    i=$((i+1))
    sleep 1
  done

  echo "[entrypoint] Timed out waiting for MySQL."
  return 1
}

wait_for_mongo
wait_for_mysql

if [ "${SEED_ON_START}" = "true" ]; then
  echo "[entrypoint] SEED_ON_START=true; running seed-once..."
  node /app/server/src/scripts/seed-once.js || true
else
  echo "[entrypoint] SEED_ON_START is not true; skipping seed-once."
fi

echo "[entrypoint] Starting backend..."
exec "$@"
