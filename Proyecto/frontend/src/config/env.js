export const CONFIG = {
  IS_MOCK: import.meta.env.VITE_MOCK === 'true' || import.meta.env.VITE_MOCK === true,
  API_BASE: import.meta.env.VITE_API_BASE || 'http://localhost:5000',
  UPLOAD_API: import.meta.env.VITE_UPLOAD_API || 'http://localhost:5000/upload',
  AWS_REGION: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  IDENTITY_POOL_ID: import.meta.env.VITE_IDENTITY_POOL_ID || '',
  LEX_BOT_ID: import.meta.env.VITE_LEX_BOT_ID || '',
  LEX_BOT_ALIAS_ID: import.meta.env.VITE_LEX_BOT_ALIAS_ID || '',
  LEX_LOCALE_ID: import.meta.env.VITE_LEX_LOCALE_ID || 'es_419',
};
