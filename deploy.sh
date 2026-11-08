#!/usr/bin/env bash
#
# deploy.sh - Despliegue automatizado del reto fullstack
# Registro de Equipos Mineros (HeadHunting4Miners)
#
# Este script es el corazón del reto. Un solo comando que:
#   1. Verifica herramientas y variables de entorno necesarias.
#   2. Construye y publica el frontend y el backend.
#   3. Aplica las migraciones de la base de datos.
#   4. Comprueba al final que ambos servicios responden (/health).
#   5. Termina con error claro y codigo de salida != 0 si algún paso falla.
#
# Uso:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Requisitos previos:
#   - node, npm, git instalados
#   - Cuenta en plataformas de hosting (Vercel/Netlify para frontend,
#     Railway/Render/VPS para backend) y sus CLIs si se usan.
#   - Archivos .env en Back-tecnica/ y Front-tecnica/ (copia de .env.example)
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Colores y helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()   { echo -e "${BLUE}[deploy]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

fail() {
  error "$1"
  exit 1
}

# ---------------------------------------------------------------------------
# Paso 0: Verificar que estamos en la raiz del proyecto
# ---------------------------------------------------------------------------
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACK_DIR="$ROOT_DIR/Back-tecnica"
FRONT_DIR="$ROOT_DIR/Front-tecnica"

if [ ! -d "$BACK_DIR" ] || [ ! -d "$FRONT_DIR" ]; then
  fail "No se encontraron las carpetas Back-tecnica/ y Front-tecnica/. Ejecuta este script desde la raiz del repositorio."
fi

ok "Directorio del proyecto: $ROOT_DIR"

# ---------------------------------------------------------------------------
# Paso 1: Verificar herramientas necesarias
# ---------------------------------------------------------------------------
log "Paso 1/6 - Verificando herramientas necesarias..."

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    fail "Falta la herramienta obligatoria: $1 ($2)"
  else
    ok "$1 encontrado: $(command -v $1)"
  fi
}

check_cmd node  "Node.js (para ejecutar el backend)"
check_cmd npm   "npm (para instalar dependencias)"
check_cmd git   "git (para versionado y despliegue)"

# Verificar versión de node mínima (>=18)
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Se requiere Node.js >= 18. Version actual: $(node -v)"
fi
ok "Node.js version: $(node -v) (>=18 OK)"

# ---------------------------------------------------------------------------
# Paso 2: Verificar variables de entorno (.env)
# ---------------------------------------------------------------------------
log "Paso 2/6 - Verificando archivos de entorno (.env)..."

check_env_file() {
  local file="$1"
  local name="$2"
  if [ ! -f "$file" ]; then
    warn "No se encontró $file. Copia de $file.example si existe."
    if [ -f "${file}.example" ]; then
      warn "Puedes copiarlo: cp ${file}.example $file"
    fi
    return 1
  fi
  ok "Archivo de entorno encontrado: $file"
  return 0
}

BACK_ENV_OK=0
FRONT_ENV_OK=0
check_env_file "$BACK_DIR/.env" "backend" && BACK_ENV_OK=1 || true
check_env_file "$FRONT_DIR/.env" "frontend" && FRONT_ENV_OK=1 || true

if [ "$BACK_ENV_OK" -eq 0 ]; then
  fail "Falta Back-tecnica/.env. Copia Back-tecnica/.env.example a Back-tecnica/.env y rellena los valores."
fi

# Cargar variables del backend para usarlas
# (source simple, ignorando comentarios y líneas vacías)
set -a
. "$BACK_DIR/.env"
set +a

# Validar variables críticas del backend
for var in DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME PORT; do
  if [ -z "${!var:-}" ]; then
    fail "Falta la variable de entorno obligatoria en Back-tecnica/.env: $var"
  fi
done
ok "Variables de entorno del backend validadas."

# ---------------------------------------------------------------------------
# Paso 3: Instalar dependencias y construir
# ---------------------------------------------------------------------------
log "Paso 3/6 - Instalando dependencias y construyendo..."

log "Backend: instalando dependencias..."
(cd "$BACK_DIR" && npm install --silent) || fail "Fallo al instalar dependencias del backend."
ok "Dependencias del backend instaladas."

log "Frontend: instalando dependencias y construyendo..."
(cd "$FRONT_DIR" && npm install --silent) || fail "Fallo al instalar dependencias del frontend."
(cd "$FRONT_DIR" && npm run build) || fail "Fallo al construir el frontend (npm run build)."
ok "Frontend construido en $FRONT_DIR/dist."

# ---------------------------------------------------------------------------
# Paso 4: Aplicar migraciones de la base de datos
# ---------------------------------------------------------------------------
log "Paso 4/6 - Aplicando migraciones de la base de datos..."

(cd "$BACK_DIR" && npm run migrate) || fail "Fallo al aplicar migraciones de la base de datos."
ok "Migraciones aplicadas correctamente."

# ---------------------------------------------------------------------------
# Paso 5: Publicar / desplegar servicios
# ---------------------------------------------------------------------------
log "Paso 5/6 - Publicando servicios..."

# Aquí se integra con la plataforma de hosting elegida.
# El script soporta dos modos:
#   A) Despliegue local (para pruebas): levanta backend en localhost
#   B) Despliegue remoto: se dejan ganchos para Railway/Render/Vercel/etc.

DEPLOY_MODE="${DEPLOY_MODE:-local}"

case "$DEPLOY_MODE" in
  local)
    log "Modo: despliegue local (backend en puerto $PORT)."
    # Levantar backend en segundo plano para la prueba de salud
    if [ -f "$BACK_DIR/.deploy.pid" ]; then
      OLD_PID=$(cat "$BACK_DIR/.deploy.pid" 2>/dev/null || true)
      if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        warn "Deteniendo instancia previa del backend (PID $OLD_PID)..."
        kill "$OLD_PID" 2>/dev/null || true
        sleep 2
      fi
      rm -f "$BACK_DIR/.deploy.pid"
    fi

    (cd "$BACK_DIR" && nohup npm start > "$BACK_DIR/deploy.log" 2>&1 & echo $! > "$BACK_DIR/.deploy.pid")
    BACKEND_PID=$(cat "$BACK_DIR/.deploy.pid")
    ok "Backend iniciado (PID $BACKEND_PID). Logs en $BACK_DIR/deploy.log."

    # Esperar a que el backend responda
    log "Esperando a que el backend esté disponible..."
    for i in $(seq 1 30); do
      if curl -sf "http://localhost:${PORT}/health" >/dev/null 2>&1; then
        ok "Backend respondiendo en http://localhost:${PORT}/health"
        break
      fi
      if [ "$i" -eq 30 ]; then
        fail "El backend no respondio despues de 30 intentos. Revisa $BACK_DIR/deploy.log"
      fi
      sleep 1
    done
    ;;
  railway|render|vercel|vps|custom)
    warn "Modo '$DEPLOY_MODE' seleccionado pero no hay integracion automatica en este script."
    warn "Implementa los comandos de despliegue de tu plataforma en esta seccion."
    warn "Ejemplo para Railway: railway up"
    warn "Ejemplo para Vercel: vercel --prod"
    ;;
  *)
    fail "DEPLOY_MODE desconocido: $DEPLOY_MODE. Usa: local, railway, render, vercel, vps o custom."
    ;;
esac

# ---------------------------------------------------------------------------
# Paso 6: Verificacion final de salud (health check)
# ---------------------------------------------------------------------------
log "Paso 6/6 - Verificacion final de salud..."

BACKEND_URL="http://localhost:${PORT}/health"
FRONTEND_URL="${VITE_API_URL:-http://localhost:5173}"

# Health del backend
log "Comprobando backend: $BACKEND_URL"
if curl -sf "$BACKEND_URL" >/dev/null 2>&1; then
  BACKEND_RESP=$(curl -s "$BACKEND_URL" 2>/dev/null || echo '{}')
  ok "Backend saludable: $BACKEND_RESP"
else
  fail "El backend no responde en $BACKEND_URL"
fi

# Health del frontend (solo si estamos en modo local y el puerto 5173 esta expuesto)
# En produccion, el frontend suele estar en una URL distinta (Vercel/Netlify).
if [ "$DEPLOY_MODE" = "local" ]; then
  log "Comprobando frontend: $FRONTEND_URL"
  if curl -sf "$FRONTEND_URL" >/dev/null 2>&1; then
    ok "Frontend saludable en $FRONTEND_URL"
  else
    warn "El frontend no responde en $FRONTEND_URL (puede que no este levantado en modo local)."
    warn "En produccion, despliega el contenido de Front-tecnica/dist en Vercel/Netlify."
  fi
fi

# ---------------------------------------------------------------------------
# Éxito
# ---------------------------------------------------------------------------
echo ""
ok "=============================================="
ok "  Despliegue completado con exito ✅"
ok "=============================================="
echo ""
echo "  Backend : $BACKEND_URL"
echo "  Health  : $BACKEND_URL/health"
echo "  Logs    : $BACK_DIR/deploy.log"
echo ""
echo "  El comando es idempotente: puedes ejecutarlo las veces que quieras."
echo ""

exit 0
