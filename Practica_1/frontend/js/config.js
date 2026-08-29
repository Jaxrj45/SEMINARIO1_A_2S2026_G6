// Configuración central del frontend
// Responsable: Integrante D
//
// IMPORTANTE: apuntar SIEMPRE al DNS del Application Load Balancer,
// nunca a la IP de una instancia EC2 individual (eso rompería el
// propósito del balanceo de carga y del failover).

const API_BASE_URL = "http://REEMPLAZAR-CON-DNS-DEL-ALB.us-east-1.elb.amazonaws.com";

// Endpoints (deben coincidir exactamente con el contrato del README raíz)
const ENDPOINTS = {
  health: `${API_BASE_URL}/health`,

  checkEmail: `${API_BASE_URL}/auth/check-email`,
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  obtenerUsuarios: `${API_BASE_URL}/auth/obtenerUsuarios`,

  movies: `${API_BASE_URL}/movies`,
  movie: (id) => `${API_BASE_URL}/movies/${id}`,

  playlist: `${API_BASE_URL}/playlist`,
  playlistItem: (idLista) => `${API_BASE_URL}/playlist/${idLista}`,

  profile: `${API_BASE_URL}/profile`,
  profileById: (idUsuario) => `${API_BASE_URL}/profile/${idUsuario}`,

  uploadProfilePhoto: `${API_BASE_URL}/uploads/profile-photo`,
};
