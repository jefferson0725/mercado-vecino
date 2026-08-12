#!/bin/sh
# Respaldo diario de la base de datos con rotación (conserva los últimos 14).
# Cron sugerido (crontab -e en el VPS):
#   0 3 * * * /ruta/al/proyecto/deploy/backup.sh >> /var/log/ecommerce-backup.log 2>&1
set -e
cd "$(dirname "$0")/.."

mkdir -p backups
FILE="backups/db-$(date +%Y-%m-%d_%H%M).sql.gz"

docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$FILE"

# Rotación: elimina los respaldos más viejos, deja 14
ls -1t backups/db-*.sql.gz | tail -n +15 | xargs -r rm --

echo "Backup creado: $FILE ($(du -h "$FILE" | cut -f1))"
