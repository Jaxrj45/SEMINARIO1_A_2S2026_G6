// Configuración central del frontend
// Responsable: Integrante D
//
// IMPORTANTE: apuntar SIEMPRE al DNS del Application Load Balancer,
// nunca a la IP de una instancia EC2 individual (eso rompería el
// propósito del balanceo de carga y del failover).

const API_BASE_URL = "http://REEMPLAZAR-CON-DNS-DEL-ALB.us-east-1.elb.amazonaws.com";

// Endpoints (deben coincidir exactamente con el contrato del README raíz)
const ENDPOINTS = {
  register: `${API_BASE_URL}/register`,
  login: `${API_BASE_URL}/login`,
  movies: `${API_BASE_URL}/movies`,
  playlist: `${API_BASE_URL}/playlist`,
  profile: `${API_BASE_URL}/profile`,
};
