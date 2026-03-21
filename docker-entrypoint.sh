#!/bin/sh
# Copy template database if no database exists yet
if [ ! -f "src/data/database.json" ]; then
  echo "🔧 First run detected — initializing database from template..."
  cp src/data/database.template.json src/data/database.json
  echo "✅ Database initialized successfully."
fi

exec "$@"
