import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import { cognitoService } from '../services/cognito';
import { chatSocket } from '../services/chatSocket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserProfile() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/api/users/me');
        if (res.status === 'success' && res.data) {
          setUser(res.data);
          chatSocket.connect(token);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error al cargar perfil inicial:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserProfile();
  }, [token]);

  const login = async (username, password) => {
    // 1. Autenticar en Cognito para obtener idToken
    const cognitoRes = await cognitoService.signIn(username, password);
    const idToken = cognitoRes.idToken;

    // 2. Canjear idToken por appJwt en el backend
    let res = await api.post('/api/auth/session', { idToken });

    // Si el usuario existe en Cognito pero aún no fue registrado en la base de datos MySQL (RDS):
    if (res.status !== 'success' && res.message?.includes('no está registrado en Semi-Social')) {
      try {
        const payloadBase64 = idToken.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));

        await api.post('/api/auth/register', {
          username: payload['cognito:username'] || username,
          fullName: payload['name'] || username,
          email: payload['email'] || `${username}@usac.edu.gt`,
          dpi: payload['custom:dpi'] || '1234567890101',
          password: password,
          cognitoSub: payload['sub'],
          photoKey: `Fotos_Perfil/${username}.jpg`
        });

        // Reintentar iniciar sesión tras sincronizar con MySQL
        res = await api.post('/api/auth/session', { idToken });
      } catch (syncErr) {
        console.warn('Aviso al auto-sincronizar con base de datos:', syncErr);
      }
    }

    if (res.status === 'success' && res.data?.token) {
      const appToken = res.data.token;
      localStorage.setItem('token', appToken);
      setToken(appToken);
      setUser(res.data.user);
      chatSocket.connect(appToken);
      return { success: true, user: res.data.user };
    }
    return { success: false, message: res.message || 'Error de inicio de sesión' };
  };

  const loginFacial = async (username, imageBase64) => {
    // Enviar al backend para comparar contra la foto de perfil en S3 con Rekognition
    const res = await api.post('/api/auth/face-session', { username, imageBase64 });
    if (res.status === 'success' && res.data?.token) {
      const appToken = res.data.token;
      localStorage.setItem('token', appToken);
      setToken(appToken);
      setUser(res.data.user);
      chatSocket.connect(appToken);
      return { success: true, user: res.data.user };
    }
    return { 
      success: false, 
      message: res.message || 'El rostro no coincide con la foto de perfil registrada',
      code: res.data?.code 
    };
  };

  const register = async ({ username, password, email, fullName, dpi, photoBase64, photoFileName }) => {
    // 1. Subir la foto de perfil a S3 vía API Gateway / Lambda
    let photoKey = `Fotos_Perfil/${username}.jpg`;
    try {
      const cleanBase64 = photoBase64 ? photoBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '') : '';
      if (cleanBase64) {
        const uploadRes = await api.uploadProfilePhoto(
          photoFileName || `${username}.jpg`,
          'image/jpeg',
          cleanBase64
        );
        const resolvedKey = uploadRes.data?.key || uploadRes.data?.data?.key;
        if (resolvedKey) {
          photoKey = resolvedKey;
        }
      }
    } catch (upErr) {
      console.warn('Aviso al subir foto a S3:', upErr);
    }

    // 2. Registrar en Cognito User Pool
    let cognitoSub = `sub-${Date.now()}`;
    let isAlreadyRegistered = false;

    try {
      const cognitoResult = await cognitoService.signUp(username, password, email, fullName, dpi);
      cognitoSub = cognitoResult.userSub || cognitoSub;
    } catch (cogErr) {
      // Si el usuario ya fue creado en Cognito (p. ej. en un intento previo), permitimos avanzar a verificación
      if (cogErr.name === 'UsernameExistsException' || cogErr.message?.includes('already exists')) {
        isAlreadyRegistered = true;
      } else {
        throw cogErr;
      }
    }

    // 3. Registrar en base de datos relacional MySQL a través de EC2
    try {
      const regRes = await api.post('/api/auth/register', {
        username,
        fullName,
        email,
        dpi,
        password,
        cognitoSub,
        photoKey
      });
      if (regRes.status !== 'success') {
        console.warn('Aviso de backend al guardar en MySQL:', regRes.message);
      }
    } catch (dbErr) {
      console.warn('Aviso de comunicación con el balanceador:', dbErr);
    }

    return { success: true, alreadyExists: isAlreadyRegistered, username };
  };

  const confirmVerification = async (username, code) => {
    return cognitoService.confirmSignUp(username, code);
  };

  const resendVerificationCode = async (username) => {
    return cognitoService.resendConfirmationCode(username);
  };

  const updateProfile = async ({ fullName, dpi, photoBase64, photoFileName, password }) => {
    let photoKey = undefined;

    if (photoBase64) {
      const cleanBase64 = photoBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const uploadRes = await api.uploadProfilePhoto(
        photoFileName || `profile-${Date.now()}.jpg`,
        'image/jpeg',
        cleanBase64
      );
      if (uploadRes.status === 'success') {
        photoKey = uploadRes.data?.key || uploadRes.data?.data?.key;
      }
    }

    const payload = {
      fullName,
      dpi,
      password,
      ...(photoKey ? { photoKey } : {})
    };

    const res = await api.put('/api/users/me', payload);
    if (res.status === 'success' && res.data) {
      setUser(res.data);
      return { success: true, data: res.data };
    }
    return { success: false, message: res.message || 'Error al actualizar perfil' };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    chatSocket.disconnect();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        loginFacial,
        register,
        confirmVerification,
        resendVerificationCode,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
