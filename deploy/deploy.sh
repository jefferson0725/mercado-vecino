#!/usr/bin/env bash
# Actualiza la app en el VPS: trae el código nuevo, reconstruye la imagen,
# aplica migraciones pendientes y reinicia los servicios.
#
# Uso (en el VPS, desde cualquier ruta):
#   /ruta/al/repo/deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."   # → raíz del repo (donde está docker-compose.yml)

echo "==> git pull"
git pull --ff-only

echo "==> build de la imagen"
docker compose build app

echo "==> migraciones"
docker compose --profile tools run --rm tools npx prisma migrate deploy

echo "==> reinicio de servicios"
docker compose up -d

echo "==> limpieza de imágenes viejas"
docker image prune -f

echo "Deploy completo."
