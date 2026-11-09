const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const isSupabase = process.env.DB_HOST && process.env.DB_HOST.includes('supabase.co');

const pool = new Pool(
  isSupabase
    ? {
        connectionString: `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'equipos_mineros',
      }
);

// Intervalos de mantenimiento por tipo de equipo (en horas)
const INTERVALOS_MANTENIMIENTO = {
  camion: 500,
  excavadora: 400,
  perforadora: 300,
};

function intervaloParaTipo(tipo) {
  return INTERVALOS_MANTENIMIENTO[tipo] || 0;
}

/**
 * Ejecuta el archivo SQL de migración si se pasa --migrate como argumento.
 */
async function runMigration() {
  const args = process.argv.slice(2);
  if (!args.includes('--migrate')) return;

  const sqlPath = path.join(__dirname, '..', 'migrations', '001_create_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ Migraciones aplicadas correctamente.');
  } catch (err) {
    console.error('❌ Error aplicando migraciones:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { pool, intervaloParaTipo, runMigration };

runMigration();
