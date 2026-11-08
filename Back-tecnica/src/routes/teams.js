const express = require('express');
const router = express.Router();
const {
  listarEquipos,
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
  registrarMantenimiento,
  obtenerHistorial,
} = require('./controllers/teamsController');

// Rutas de equipos
router.get('/equipos', listarEquipos);
router.post('/equipos', crearEquipo);
router.put('/equipos/:id', editarEquipo);
router.delete('/equipos/:id', eliminarEquipo);
router.post('/equipos/:id/mantenimiento', registrarMantenimiento);
router.get('/equipos/:id/historial', obtenerHistorial);

module.exports = router;
