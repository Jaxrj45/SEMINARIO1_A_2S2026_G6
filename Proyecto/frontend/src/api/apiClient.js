import { CONFIG } from '../config/env';
import { handleMockRequest } from './mocks';

/**
 * Cliente HTTP unificado según las especificaciones del contrato de API de Semi-Social
 */
export async function apiRequest(endpoint, options = {}) {
  const isUpload = endpoint.startsWith('/upload') || endpoint.startsWith('/face');
  const baseUrl = isUpload ? CONFIG.UPLOAD_API : CONFIG.API_BASE;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  if (CONFIG.IS_MOCK) {
    return handleMockRequest(url, options);
  }

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    let result = null;

    if (contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = {
        status: response.ok ? 'success' : 'error',
        message: text || `HTTP ${response.status}`,
        data: { code: response.ok ? 'OK' : 'SERVER_ERROR' }
      };
    }

    // Normalizar respuestas de Lambdas que devuelven { ok: true/false, data: ... }
    if (result.ok !== undefined) {
      if (result.ok) {
        result = {
          status: 'success',
          message: result.message || 'Operación exitosa',
          data: result.data || {}
        };
      } else {
        result = {
          status: 'error',
          message: result.error?.message || result.message || 'Error en la petición',
          data: result.error || { code: 'LAMBDA_ERROR' }
        };
      }
    } else if (!result.status) {
      if (response.ok) {
        result = {
          status: 'success',
          message: result.message || 'Operación exitosa',
          data: result
        };
      } else {
        result = {
          status: 'error',
          message: result.message || 'Error en la petición',
          data: { code: 'HTTP_' + response.status, raw: result }
        };
      }
    }

    if (!response.ok && result.status === 'success') {
      result.status = 'error';
    }

    return result;
  } catch (error) {
    console.error(`[API ERROR] ${options.method || 'GET'} ${url}:`, error);
    return {
      status: 'error',
      message: 'No se pudo conectar con el servidor',
      data: { code: 'NETWORK_ERROR', details: error.message }
    };
  }
}

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { method: 'DELETE', ...options }),

  // Subida de imagen en base64 según el contrato de API Gateway y Lambda
  uploadProfilePhoto: async (fileName, contentType, imageBase64) => {
    return apiRequest('/upload/profile', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType, imageBase64 })
    });
  },

  uploadPostPhoto: async (fileName, contentType, imageBase64) => {
    return apiRequest('/upload/post', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType, imageBase64 })
    });
  }
};
