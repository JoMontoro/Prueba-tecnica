import React, { useState, useEffect } from 'react';
import {
  listarEquipos,
  crearEquipo,
  editarEquipo,
  eliminarEquipo,
  registrarMantenimiento,
  obtenerHistorial,
  checkHealth,
} from './services/api';

const TIPOS = [
  { value: 'camion', label: 'Camión', intervalo: 500 },
  { value: 'excavadora', label: 'Excavadora', intervalo: 400 },
  { value: 'perforadora', label: 'Perforadora', intervalo: 300 },
];

export default function App() {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [health, setHealth] = useState(null);
  const [formMode, setFormMode] = useState(null); // 'crear' | 'editar' | null
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ codigo: '', tipo: 'camion', horometro: 0 });
  const [maintTeamId, setMaintTeamId] = useState(null);
  const [maintObs, setMaintObs] = useState('');

  const INTERVALOS = {
    camion: 500,
    excavadora: 400,
    perforadora: 300,
  };

  useEffect(() => {
    cargarEquipos();
    verificarSalud();
  }, []);

  const cargarEquipos = async () => {
    try {
      setLoading(true);
      const res = await listarEquipos();
      setEquipos(res.data);
      setError(null);
    } catch (err) {
      setError('No se pudo conectar con el backend. Verifica que el servidor esté corriendo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const verificarSalud = async () => {
    try {
      const res = await checkHealth();
      setHealth(res.data);
    } catch (err) {
      setHealth(null);
    }
  };

  const estadoEquipo = (e) => {
    const intervalo = INTERVALOS[e.tipo] || 0;
    const horasDesde = e.horometro - e.horometro_ultimo_mantenimiento;
    const requiere = horasDesde >= intervalo;
    return { requiere, horasDesde, intervalo, restantes: Math.max(0, intervalo - horasDesde) };
  };

  const mostrarAlerta = (tipo, mensaje) => {
    setAlert({ tipo, mensaje });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'crear') {
        await crearEquipo(formData);
        mostrarAlerta('success', 'Equipo creado correctamente.');
      } else if (formMode === 'editar' && editingId) {
        await editarEquipo(editingId, formData);
        mostrarAlerta('success', 'Equipo actualizado correctamente.');
      }
      cerrarForm();
      await cargarEquipos();
    } catch (err) {
      mostrarAlerta('error', err.response?.data?.error || 'Error al guardar el equipo.');
    }
  };

  const cerrarForm = () => {
    setFormMode(null);
    setEditingId(null);
    setFormData({ codigo: '', tipo: 'camion', horometro: 0 });
  };

  const handleCrear = () => {
    setFormMode('crear');
    setFormData({ codigo: '', tipo: 'camion', horometro: 0 });
  };

  const handleEditar = (e) => {
    setFormMode('editar');
    setEditingId(e.id);
    setFormData({
      codigo: e.codigo,
      tipo: e.tipo,
      horometro: e.horometro,
    });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este equipo?')) return;
    try {
      await eliminarEquipo(id);
      mostrarAlerta('success', 'Equipo eliminado.');
      await cargarEquipos();
    } catch (err) {
      mostrarAlerta('error', 'No se pudo eliminar el equipo.');
    }
  };

  const handleMantenimiento = (id) => {
    setMaintTeamId(id);
    setMaintObs('');
  };

  const handleRegistrarMantenimiento = async (e) => {
    e.preventDefault();
    if (!maintTeamId) return;
    try {
      await registrarMantenimiento(maintTeamId, { observaciones: maintObs });
      mostrarAlerta('success', 'Mantenimiento registrado y ciclo reiniciado.');
      setMaintTeamId(null);
      setMaintObs('');
      await cargarEquipos();
    } catch (err) {
      mostrarAlerta('error', err.response?.data?.error || 'Error al registrar mantenimiento.');
    }
  };

  const handleHistorial = async (id) => {
    try {
      const res = await obtenerHistorial(id);
      const filas = res.data
        .map(
          (h) =>
            `- ${new Date(h.fecha).toLocaleDateString('es-ES')}: Horómetro ${h.horometro_al_momento} h${
              h.observaciones ? ` (${h.observaciones})` : ''
            }`
        )
        .join('\n');
      window.alert(`Historial de mantenimiento:\n\n${filas || 'Sin registros'}`);
    } catch (err) {
      mostrarAlerta('error', 'No se pudo obtener el historial.');
    }
  };

  if (loading) {
    return (
      <div className="app">
        <header>
          <span className="header-icon">⛏️</span>
          <div>
            <h1>Registro de Equipos Mineros</h1>
            <div className="subtitle">Cargando equipos...</div>
          </div>
        </header>
        <div className="grid">
          <div className="card">
            <p className="small">Cargando, por favor espera...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <span className="header-icon">⛏️</span>
        <div>
          <h1>Registro de Equipos Mineros</h1>
          <div className="subtitle">
            CRUD de equipos, tipos, horómetro y control de mantenimientos
          </div>
        </div>
        {health && (
          <div className="health-status">
            <span className={`health-dot ${health.status === 'ok' ? 'online' : 'offline'}`}></span>
            <span>Backend: {health.status === 'ok' ? 'Online ✅' : 'Fuera de servicio ❌'}</span>
          </div>
        )}
      </header>

      {alert && (
        <div className={`alert alert-${alert.tipo}`}>{alert.mensaje}</div>
      )}

      <div className="grid">
        {/* Panel: lista de equipos */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2>Equipos ({equipos.length})</h2>
            <button className="btn btn-primary" onClick={handleCrear}>
              + Nuevo equipo
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {equipos.length === 0 ? (
            <div className="empty">
              <p>No hay equipos registrados.</p>
              <p className="small">Crea tu primer equipo con el botón de arriba.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Horómetro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((e) => {
                  const est = estadoEquipo(e);
                  return (
                    <tr key={e.id}>
                      <td>
                        <strong>{e.codigo}</strong>
                      </td>
                      <td>{e.tipo}</td>
                      <td>{e.horometro} h</td>
                      <td>
                        <span className={`badge ${est.requiere ? 'badge-danger' : 'badge-ok'}`}>
                          {est.requiere ? 'Requiere mantenimiento' : 'Operativo'}
                        </span>
                        <br />
                        <span className="small">
                          {est.horasDesde} h desde último mantenimiento
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => handleEditar(e)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                          Editar
                        </button>
                        <button className="btn btn-success" onClick={() => handleMantenimiento(e.id)}>
                          Mantenimiento
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleEliminar(e.id)}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Eliminar
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleHistorial(e.id)}
                          style={{ padding: '4px 8px', fontSize: '12px', marginLeft: '4px' }}
                        >
                          Historial
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Panel: formulario de equipo */}
        {formMode && (
          <div className="card">
            <h2>{formMode === 'crear' ? 'Crear Equipo' : 'Editar Equipo'}</h2>
            <form onSubmit={handleSubmitForm}>
              <div className="form-group">
                <label>Código del equipo</label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ej: EXC-001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo de equipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} ({t.intervalo} h mantenimiento)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Horómetro (horas de uso)</label>
                <input
                  type="number"
                  value={formData.horometro}
                  onChange={(e) => setFormData({ ...formData, horometro: parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {formMode === 'crear' ? 'Crear' : 'Guardar cambios'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={cerrarForm}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Panel: mantenimiento */}
        {maintTeamId && (
          <div className="card">
            <h2>Registrar Mantenimiento</h2>
            <p className="small">Seleccionaste el equipo #{maintTeamId}. Esto reiniciará su ciclo de mantenimiento.</p>
            <form onSubmit={handleRegistrarMantenimiento}>
              <div className="form-group">
                <label>Observaciones (opcional)</label>
                <textarea
                  value={maintObs}
                  onChange={(e) => setMaintObs(e.target.value)}
                  rows="3"
                  placeholder="Ej: Cambio de aceite y filtros"
                />
              </div>
              <div className="form-actions" style={{ marginTop: "8px" }}>
                <button type="submit" className="btn btn-success">
                  Confirmar mantenimiento
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setMaintTeamId(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <footer style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', color: '#6b7280', fontSize: '12px', textAlign: 'center' }}>
        Registro de Equipos Mineros · Prueba Técnica Fullstack
      </footer>
    </div>
  );
}
