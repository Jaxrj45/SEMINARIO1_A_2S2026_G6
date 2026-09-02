// Leemos la URL del ALB directamente del archivo .env
export const API_BASE_URL = import.meta.env.VITE_API_URL;

// Aquí centralizamos las rutas para no escribirlas a mano cada vez
export const ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  movies: `${API_BASE_URL}/movies`,
  playlist: `${API_BASE_URL}/playlist`,
  profile: `${API_BASE_URL}/profile`,
};
