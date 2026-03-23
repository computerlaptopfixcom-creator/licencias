#!/bin/sh
# Entrypoint for Docker
# SQLite is initialized automatically by the application on startup via src/lib/db.ts
exec "$@"
