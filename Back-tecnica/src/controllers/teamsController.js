const { pool, intervaloParaTipo } = require('./db');

/**
 * Calcula si un equipo requiere mantenimiento.
 * Requiere mantenimiento si: horometro - horometro_ultimo_mantenimiento >= intervalo del tipo
 */
function calcularEstado(horometro, horometroUltimoMantenimiento, tipo) {
  const intervalo = intervaloParaTipo(tipo);
  const horasDesdeMantenimiento = horometro - horometroUltimoMantenimiento;
  return {
    requiereMantenimiento: horasDesdeMantenimiento >= intervalo,
    horasDesdeMantenimiento,
    intervalo,
    horasRestantes: Math.max(0, intervalo - horasDesdeMantenimiento),
  };
}

// Listar todos los equipos
async function listarEquipos(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM equipos ORDER BY id DESC'
    );
    const equiposConEstado = result.rows.map((e) => ({
      ...e,
      estado: calcularEstado(e.horometro, e.horometro_ultimo_mantenimiento, e.tipo),
    }));
    res.json(equiposConEstado);
  } catch (err) {
    console.error('Error listando equipos:', err);
    res.status(500).json({ error: 'Error interno al listar equipos' });
  }
}

// Crear un equipo
async function crearEquipo(req, res) {
  try {
    const { codigo, tipo, horometro } = req.body;

    if (!codigo || !tipo) {
      return res.status(400).json({ error: 'codigo y tipo son obligatorios' });
    }

    if (!['camion', 'excavadora', 'perforadora'].includes(tipo)) {
      return res.status(400).json({ error: 'tipo invalido' });
    }

    const h = parseInt(horometro) || 0;

    const result = await pool.query(
      `INSERT INTO equipos (codigo, tipo, horometro, horometro_ultimo_mantenimiento)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [codigo.trim(), tipo, h, h]
    );

    const equipo = result.rows[0];
    res.status(201).json({
      ...equipo,
      estado: calcularEstado(equipo.horometro, equipo.horometro_ultimo_mantenimiento, equipo.tipo),
    });
  } catch (err) {
    console.error('Error creando equipo:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un equipo con ese codigo' });
    }
    res.status(500).json({ error: 'Error interno al crear equipo' });
  }
}

// Editar un equipo
async function editarEquipo(req, res) {
  try {
    const { id } = req.params;
    const { codigo, tipo, horometro } = req.body;

    const equipoExistente = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
    if (equipoExistente.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const updates = [];
    const values = [];
    let paramIdx = 1;

    if (codigo !== undefined) {
      updates.push(`codigo = $${paramIdx++}`);
      values.push(codigo.trim());
    }
    if (tipo !== undefined) {
      if (!['camion', 'excavadora', 'perforadora'].includes(tipo)) {
        return res.status(400).json({ error: 'tipo invalido' });
      }
      updates.push(`tipo = $${paramIdx++}`);
      values.push(tipo);
    }
    if (horometro !== undefined) {
      updates.push(`horometro = $${paramIdx++}`);
      values.push(parseInt(horometro));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    updates.push(`actualizado_en = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE equipos SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
    const result = await pool.query(query, values);

    const equipo = result.rows[0];
    res.json({
      ...equipo,
      estado: calcularEstado(equipo.horometro, equipo.horometro_ultimo_mantenimiento, equipo.tipo),
    });
  } catch (err) {
    console.error('Error editando equipo:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un equipo con ese codigo' });
    }
    res.status(500).json({ error: 'Error interno al editar equipo' });
  }
}

// Eliminar un equipo
async function eliminarEquipo(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM equipos WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    res.json({ mensaje: 'Equipo eliminado correctamente' });
  } catch (err) {
    console.error('Error eliminando equipo:', err);
    res.status(500).json({ error: 'Error interno al eliminar equipo' });
  }
}

// Registrar mantenimiento de un equipo
async function registrarMantenimiento(req, res) {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const equipo = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
    if (equipo.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const e = equipo.rows[0];
    const horometroActual = e.horometro;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Guardar historial
      await client.query(
        `INSERT INTO historial_mantenimiento (equipo_id, observaciones, horometro_al_momento)
         VALUES ($1, $2, $3)`,
        [id, observaciones || null, horometroActual]
      );

      // Reiniciar ciclo: el ultimo mantenimiento queda en el horometro actual
      await client.query(
        `UPDATE equipos
         SET horometro_ultimo_mantenimiento = $1, actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [horometroActual, id]
      );

      await client.query('COMMIT');

      const equipoActualizado = await pool.query('SELECT * FROM equipos WHERE id = $1', [id]);
      const eq = equipoActualizado.rows[0];
      res.json({
        mensaje: 'Mantenimiento registrado correctamente',
        equipo: {
          ...eq,
          estado: calcularEstado(eq.horometro, eq.horometro_ultimo_mantenimiento, eq.tipo),
        },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error registrando mantenimiento:', err);
    res.status(500).json({ error: 'Error interno al registrar mantenimiento' });
  }
}

// Historial de mantenimiento de un equipo
async function obtenerHistorial(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM historial_mantenimiento WHERE equipo_id = $1 ORDER BY fecha DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo historial:', err);
    res.status(500).json({ error: 'Error interno al obtener historial' });
  }
}

module.exports = {
  listarEquipos,
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
  registrarMantenimiento,
  obtenerHistorial,
  calcularEstado,
};
