# Front-tecnica

Frontend del reto fullstack **Registro de Equipos Mineros** (HeadHunting4Miners).

## Qué hace

Interfaz web para gestionar equipos mineros (camión, excavadora, perforadora):

- Ver lista de equipos con código, tipo, horómetro y estado (operativo / requiere mantenimiento).
- Crear, editar y eliminar equipos.
- Registrar mantenimientos: guarda historial y reinicia el ciclo del equipo.
- Ver el historial de mantenimientos de cada equipo.
- Indicador visual de salud del backend (`/health`).

## Stack

- React 18 + Vite
- Axios para consumo de la API
- CSS puro (sin frameworks)

## Cómo levantar en local

1. Copia las variables de entorno:
   ```bash
   cp .env.example .env
   # Edita .env con VITE_API_URL apuntando al backend
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Levanta en modo desarrollo:
   ```bash
   npm run dev
   # http://localhost:5173
   ```

4. Para construir para producción:
   ```bash
   npm run build
   # Resultado en la carpeta dist/
   ```

## Cómo desplegar

Publica la carpeta `dist/` en Vercel, Netlify o cualquier hosting estático gratuito.

Configura la variable de entorno `VITE_API_URL` con la URL pública del backend.

El despliegue completo (frontend + backend + base de datos) se automatiza con el script en la raíz del proyecto:

```bash
cd ..                      # raiz del repositorio
./deploy.sh                # o make deploy
```

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API del backend | `http://localhost:3001/api` |

## Uso de IA

Se usó IA como apoyo para estructurar el proyecto y escribir componentes. El autor puede explicar cada parte del código entregado.

## Rutas principales

- `/` — lista de equipos y acciones (crear, editar, eliminar, mantenimiento, historial)
