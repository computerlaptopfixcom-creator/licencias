#!/bin/sh
# Stateless deployment: reset DB on every start unless PERSIST_DB=true
if [ "$PERSIST_DB" = "true" ] && [ -f "src/data/database.json" ]; then
  echo "♻️ PERSIST_DB=true — keeping existing database."
else
  echo "🔧 Resetting database to factory defaults..."
  cp src/data/database.template.json src/data/database.json
  echo "✅ Database initialized. Login: admin / admin123"
fi

exec "$@"
