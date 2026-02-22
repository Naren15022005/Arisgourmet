#!/bin/sh
# Simple wait-for-db script
HOST=${1:-mysql}
PORT=${2:-3306}
RETRIES=30
COUNT=0

echo "Waiting for database $HOST:$PORT..."
until nc -z $HOST $PORT; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $RETRIES ]; then
    echo "Timed out waiting for $HOST:$PORT"
    exit 1
  fi
  sleep 2
done
echo "Database is available: $HOST:$PORT"
