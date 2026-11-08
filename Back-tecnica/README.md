# Back-tecnica

Backend del reto fullstack **Registro de Equipos Mineros** (HeadHunting4Miners).

API REST con Node.js + Express + PostgreSQL.

## Qué hace

Expone los endpoints para gestionar equipos mineros:

- `GET /health` — health check (requerido por el reto).
- `GET /api/equipos` — listar equipos con estado de mantenimiento calculado.
- `POST /api/equipos` — crear equipo.
- `PUT /api/equipos/:id` — editar equipo.
- `DELETE /api/equipos/:id` — eliminar equipo.
- `POST /api/equipos/:id/mantenimiento` — registrar mantenimiento (historial + reinicio de ciclo).
- `GET /api/equipos/:id/historial` — historial de mantenimientos.

## Stack

- Node.js >= 18
- Express
- pg (cliente de PostgreSQL)
- dotenv

## Cómo levantar en local

1. Copia las variables de entorno:
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales de PostgreSQL y puerto
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Aplica las migraciones (crea las tablas):
   ```bash
   npm run migrate
   ```

4. Levanta el servidor:
   ```bash
   npm start
   # http://localhost:3001
   # Health: http://localhost:3001/health
   ```

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3001` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `DB_NAME` | Nombre de la base de datos | `equipos_mineros` |
| `FRONTEND_URL` | URL del frontend (CORS) | `http://localhost:5173` |
| `NODE_ENV` | Entorno | `development` |

> **Importante:** nunca subas el archivo `.env` con claves reales al repositorio. Usa `.env.example` como plantilla.

## Intervalos de mantenimiento (horas)

| Tipo | Intervalo |
|------|-----------|
| Camión | 500 h |
| Excavadora | 400 h |
| Perforadora | 300 h |

Un equipo requiere mantenimiento cuando: `horómetro - horómetro_último_mantenimiento >= intervalo`.

## Despliegue

El despliegue automatizado (backend + frontend + migraciones + health check) está en la raíz del repositorio:

```bash
cd ..                      # raiz del repositorio
./deploy.sh                # o make deploy
```

## Uso de IA

Se usó IA como apoyo para generar el esqueleto del servidor, controladores y migraciones. El autor puede explicar cada parte del código entregado.
