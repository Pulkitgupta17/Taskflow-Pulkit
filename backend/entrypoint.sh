#!/bin/sh
set -e

echo "Starting TaskFlow backend..."

# The server binary handles migrations on startup via embedded migrations.
# Optionally run the seed command if SEED_DB is set.
if [ "${SEED_DB}" = "true" ]; then
    echo "Seeding database..."
    /app/seed
    echo "Seeding complete."
fi

echo "Starting server on port ${PORT:-8080}..."
exec /app/server
