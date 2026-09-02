#!/bin/bash
# stop_postgres.sh - Helper script to stop and remove the local Postgres container

echo "Stopping PostgreSQL container..."
podman stop nlda-postgres

echo "Removing PostgreSQL container..."
podman rm nlda-postgres

echo "✅ Container stopped and removed."
