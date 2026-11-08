# Registro de Equipos Mineros — Reto Fullstack

**HeadHunting4Miners** · Prueba técnica fullstack: aplicación publicada con despliegue automatizado por terminal.

Aplicación para registrar, listar, editar y eliminar equipos mineros (camión, excavadora, perforadora), con control de horómetro y alerta automática de "Requiere mantenimiento" cuando se alcanza el intervalo de horas. Incluye historial de mantenimientos y reinicio de ciclo.

## Tabla de contenidos

1. [Qué hace la aplicación](#qué-hace-la-aplicación)
2. [Modelo de datos y reglas de negocio](#modelo-de-datos-y-reglas-de-negocio)
3. [Estructura del repositorio](#estructura-del-repositorio)
4. [Requisitos previos](#requisitos-previos)
5. [Cómo levantar en local](#cómo-levantar-en-local)
6. [Cómo desplegar (producción)](#cómo-desplegar-producción)
7. [Script de despliegue automatizado](#script-de-despliegue-automatizado)
8. [Endpoints de la API](#endpoints-de-la-api)
9. [Uso de IA](#uso-de-ia)
10. [Criterios de evaluación del reto](#criterios-de-evaluación-del-reto)

---

## Qué hace la aplicación

Es un **CRUD completo de equipos mineros** con dos partes separadas (cada una con su propia URL pública):

- **Frontend (React + Vite):** interfaz para crear, editar y eliminar equipos, ver su estado (operativo / requiere mantenimiento) y registrar mantenimientos con historial.
- **Backend (Node.js + Express + PostgreSQL):** API REST con ruta `/health`, operaciones CRUD sobre equipos y registro de mantenimientos.

Cada equipo tiene:
- **Código** (único)
- **Tipo** (camión, excavadora, perforadora)
- **Horómetro** (horas de uso)

Cada tipo tiene un intervalo de mantenimiento. Cuando las horas transcurridas desde el último mantenimiento alcanzan ese intervalo, el equipo se muestra como **"Requiere mantenimiento"**. Al registrar un mantenimiento se guarda el historial y se reinicia el ciclo del equipo.

## Modelo de datos y reglas de negocio

### Tablas

**`equipos`**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| código | varchar(50) único | Código del equipo |
| tipo | varchar(20) | camion / excavadora / perforadora |
| horometro | integer | Horas totales de uso |
| horometro_ultimo_mantenimiento | integer | Horómetro en el último mantenimiento |
| creado_en | timestamp | Fecha de creación |
| actualizado_en | timestamp | Fecha de última actualización |

**`historial_mantenimiento`**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | serial PK | Identificador |
| equipo_id | integer FK | Referencia al equipo |
| fecha | timestamp | Fecha del mantenimiento |
| observaciones | text | Notas del mantenimiento |
| horometro_al_momento | integer | Horómetro al momento del mantenimiento |

### Reglas

| Tipo | Intervalo de mantenimiento |
|------|---------------------------|
| Camión | 500 horas |
| Excavadora | 400 horas |
| Perforadora | 300 horas |

- Un equipo **requiere mantenimiento** cuando: `horometro - horometro_ultimo_mantenimiento >= intervalo_del_tipo`.
- Al registrar mantenimiento, `horometro_ultimo_mantenimiento` se actualiza al horómetro actual (reinicia el ciclo).
- El código de equipo debe ser único.

## Estructura del repositorio

```
Prueba-Tecnica/
├── deploy.sh                  # Script único de despliegue automatizado (obligatorio)
├── Makefile                   # Alternativa con make deploy
├── Back-tecnica/              # Backend (Node.js + Express + PostgreSQL)
│   ├── package.json
│   ├── .env.example           # Copiar a .env y rellenar (nunca subir claves al repo)
│   ├── .gitignore
│   ├── src/
│   │   ├── server.js          # Servidor Express, ruta /health y rutas API
│   │   ├── db.js              # Conexión PostgreSQL y ejecución de migraciones
│   │   ├── controllers/teamsController.js
│   │   └── routes/teams.js
│   └── migrations/
│       └── 001_create_tables.sql
├── Front-tecnica/             # Frontend (React + Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example           # Copiar a .env y rellenar
│   ├── .gitignore
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       └── services/api.js
└── README.md                  # Este archivo
```

## Requisitos previos

- **Node.js >= 18** y **npm**
- **PostgreSQL** (local o remoto)
- **git**
- Cuenta en plataformas de hosting gratuitas (ej. Vercel/Netlify para el frontend y Railway/Render/VPS para el backend)

## Cómo levantar en local

1. Clona el repositorio:
   ```bash
   git clone <tu-repositorio>
   cd Prueba-Tecnica
   ```

2. Configura el entorno del backend:
   ```bash
   cp Back-tecnica/.env.example Back-tecnica/.env
   # Edita Back-tecnica/.env con tus datos de PostgreSQL y puerto
   ```

3. Configura el entorno del frontend:
   ```bash
   cp Front-tecnica/.env.example Front-tecnica/.env
   # Edita Front-tecnica/.env con la URL del backend
   ```

4. Instala dependencias y levanta el backend:
   ```bash
   cd Back-tecnica
   npm install
   npm run migrate      # crea las tablas en PostgreSQL
   npm start            # backend en http://localhost:3001
   ```

5. En otra terminal, levanta el frontend:
   ```bash
   cd Front-tecnica
   npm install
   npm run dev          # frontend en http://localhost:5173
   ```

6. Abre http://localhost:5173 en el navegador.

## Cómo desplegar (producción)

El reto exige que **frontend y backend tengan URL pública separada** y que el despliegue se haga con **un solo comando de terminal**.

### Opción A: Despliegue local de prueba

```bash
chmod +x deploy.sh
./deploy.sh
```

Esto instala dependencias, construye el frontend, aplica migraciones, levanta el backend localmente y ejecuta el health check final.

### Opción B: Despliegue en la nube (recomendado para entregar)

1. **Backend** (Node.js + PostgreSQL):
   - Sube el código a una plataforma como Railway, Render o una VPS.
   - Configura las variables de entorno (ver `.env.example`).
   - Conecta la base de datos PostgreSQL.
   - Ejecuta las migraciones (`npm run migrate`).

2. **Frontend** (React + Vite):
   - Sube el código a Vercel o Netlify.
   - Configura la variable `VITE_API_URL` apuntando a la URL pública del backend.
   - Haz el build (`npm run build`) y publica la carpeta `dist/`.

3. Verifica que ambos servicios respondan:
   - `GET https://tu-backend.com/health` → debe devolver `{ status: "ok" }`
   - `https://tu-frontend.com` → debe cargar la aplicación.

## Script de despliegue automatizado

El archivo `deploy.sh` (o `make deploy`) es el núcleo del reto. Ejecuta, en orden:

1. ✅ Verifica herramientas (node, npm, git) y versión de Node.
2. ✅ Valida que existan los archivos `.env` y sus variables críticas.
3. ✅ Instala dependencias de backend y frontend.
4. ✅ Construye el frontend (`npm run build`).
5. ✅ Aplica migraciones de base de datos (`npm run migrate`).
6. ✅ Publica / levanta los servicios.
7. ✅ Comprueba al final que ambos servicios responden usando `/health`.
8. ❌ Si algún paso falla, termina con mensaje de error claro y código de salida distinto de 0.
9. ✅ Es **idempotente**: se puede ejecutar varias veces sin romper nada.

Uso:
```bash
./deploy.sh
# o
make deploy
```

## Endpoints de la API

Base: `GET /health` — estado del servicio.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/equipos` | Listar todos los equipos (con estado calculado) |
| POST | `/api/equipos` | Crear un equipo |
| PUT | `/api/equipos/:id` | Editar un equipo |
| DELETE | `/api/equipos/:id` | Eliminar un equipo |
| POST | `/api/equipos/:id/mantenimiento` | Registrar mantenimiento (reinicia ciclo + historial) |
| GET | `/api/equipos/:id/historial` | Historial de mantenimientos de un equipo |

## Uso de IA

Se utilizó IA como apoyo para generar código base, estructura del proyecto y redacción de documentación. Todas las herramientas se indican aquí y el autor del proyecto puede explicar cada pieza entregada.

## Criterios de evaluación del reto (según el enunciado)

1. Que el comando de despliegue funcione y falle bien.
2. Que frontend y backend estén publicados y funcionen.
3. Modelo de datos y reglas de la aplicación.
4. Calidad del repositorio: estructura, historial de commits y README.
5. Esfuerzo y avance logrado en el plazo.

## Entrega

- Repositorio GitHub público.
- URL pública del frontend.
- URL pública del backend.
- Video de máximo 3 minutos: cambio visible → subir a GitHub → ejecutar `./deploy.sh` → mostrar el cambio publicado.
- Archivo de entrega en la plataforma HeadHunting4Miners (.mp4 o .mov, máximo 500 MB).

---

**Autor:** José  
**Fecha:** 7 de noviembre de 2026
