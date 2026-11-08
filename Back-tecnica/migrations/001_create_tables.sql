CREATE TABLE IF NOT EXISTS equipos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('camion', 'excavadora', 'perforadora')),
  horometro INTEGER NOT NULL DEFAULT 0,
  horometro_ultimo_mantenimiento INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_mantenimiento (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER REFERENCES equipos(id) ON DELETE CASCADE,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observaciones TEXT,
  horometro_al_momento INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_equipos_codigo ON equipos(codigo);
CREATE INDEX IF NOT EXISTS idx_historial_equipo_id ON historial_mantenimiento(equipo_id);
