const express = require('express');
const cors = require('cors');
require('dotenv').config();

const {
  listarEquipos,
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
  registrarMantenimiento,
  obtenerHistorial,
} = require('./controllers/teamsController');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Ruta de salud (requerida por el reto)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'back-tecnica', timestamp: new Date().toISOString() });
});

// Rutas de equipos (API REST)
app.get('/api/equipos', listarEquipos);
app.post('/api/equipos', crearEquipo);
app.put('/api/equipos/:id', editarEquipo);
app.delete('/api/equipos/:id', eliminarEquipo);
app.post('/api/equipos/:id/mantenimiento', registrarMantenimiento);
app.get('/api/equipos/:id/historial', obtenerHistorial);

// Ruta base
app.get('/', (req, res) => {
  res.json({ mensaje: 'API Registro de Equipos Mineros - Backend', salud: '/health' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
  console.log(`🔎 Health check: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
});

module.exports = app;
