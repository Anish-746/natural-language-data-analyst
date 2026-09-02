#!/bin/bash
# start_postgres.sh - Helper script to start a local Postgres database using Podman

echo "Starting PostgreSQL container..."
podman run --name nlda-postgres --replace \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres:15

echo "------------------------------------------------------"
echo "✅ PostgreSQL is now running in Podman on localhost:5432"
echo "Credentials: user=postgres, password=postgres, db=postgres"
echo ""
echo "Next step: Run 'npm run db:init' to create the schema, read-only user, and seed data."
echo "------------------------------------------------------"
