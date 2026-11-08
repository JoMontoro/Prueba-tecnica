import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Equipos
export const listarEquipos = () => api.get('/equipos');
export const crearEquipo = (data) => api.post('/equipos', data);
export const editarEquipo = (id, data) => api.put(`/equipos/${id}`, data);
export const eliminarEquipo = (id) => api.delete(`/equipos/${id}`);
export const registrarMantenimiento = (id, data) => api.post(`/equipos/${id}/mantenimiento`, data);
export const obtenerHistorial = (id) => api.get(`/equipos/${id}/historial`);

// Health
export const checkHealth = () => api.get('/health', { baseURL: '' });

export default api;
