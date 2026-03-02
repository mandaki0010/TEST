#!/bin/sh
set -e

echo "Running database migration..."
node src/migrations/migrate.js

echo "Running database seed..."
node src/migrations/seed.js

echo "Starting server..."
exec node src/index.js
