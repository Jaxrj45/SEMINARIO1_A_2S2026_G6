import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WebcamModal from '../components/WebcamModal';
import {
  UserIcon,
  LockClosedIcon,
  CameraIcon,
  ArrowUpTrayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CloudIcon,
  AcademicCapIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginFacial } = useAuth();

  const [activeTab, setActiveTab] = useState('password'); // 'password' | 'facial'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [facialPhoto, setFacialPhoto] = useState(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await login(username.trim().toLowerCase(), password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Usuario o contraseña incorrectos.');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al autenticar contra Amazon Cognito.');
    } finally {
      setLoading(false);
    }
  };

  const handleFacialLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor ingresa tu nombre de usuario.');
      return;
    }
    if (!facialPhoto) {
      setError('Es necesario capturar o subir una fotografía para la comparación facial.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanBase64 = facialPhoto.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const res = await loginFacial(username.trim().toLowerCase(), cleanBase64);
      if (res.success) {
        navigate('/');
      } else {
        if (res.code === 'EMAIL_NOT_VERIFIED') {
          setError('Tu cuenta aún no ha sido verificada por correo en Cognito.');
        } else if (res.code === 'NO_FACE_DETECTED') {
          setError('No se detectó un rostro nítido en la captura. Intenta nuevamente con mejor iluminación.');
        } else {
          setError(res.message || 'El rostro no coincide con la foto registrada en el perfil.');
        }
      }
    } catch (err) {
      console.error('Error en login facial:', err);
      setError(err.message || 'Fallo en el servicio de Rekognition.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFacialPhoto(reader.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Panel Izquierdo: Branding Visual y Servicios Cloud (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-zinc-900 border-r border-zinc-800/80 overflow-hidden">
        {/* Fondo con textura sutil y gradiente profesional */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-25 filter grayscale contrast-125"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-0" />
        <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent z-0 pointer-events-none" />

        {/* Cabecera de la marca */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
            <AcademicCapIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white leading-tight">Semi-Social</h2>
            <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Facultad de Ingeniería · USAC</p>
          </div>
        </div>

        {/* Contenido central de bienvenida */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-xs">
            <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Infraestructura Cloud Native en AWS</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            La red social académica de la Facultad de Ingeniería.
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Plataforma distribuida de alta disponibilidad con balanceo de carga, autenticación biométrica por visión computacional, traducción dinámica y asistencia inteligente.
          </p>

          {/* Tarjetas de servicios AWS integrados */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Amazon Cognito</span>
              </div>
              <p className="text-[11px] text-zinc-400">Control de identidad y verificación de correo.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                <CameraIcon className="w-4 h-4" />
                <span>Amazon Rekognition</span>
              </div>
              <p className="text-[11px] text-zinc-400">Inicio de sesión por biometría facial.</p>
            </div>
          </div>
        </div>

        {/* Pie del panel izquierdo */}
        <div className="relative z-10 text-xs text-zinc-500 flex items-center justify-between border-t border-zinc-800/60 pt-6">
          <span>Seminario de Sistemas 1 · Segundo Semestre 2026</span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <CloudIcon className="w-4 h-4 text-emerald-400" />
            Arquitectura Serverless y EC2
          </span>
        </div>
      </div>

      {/* Panel Derecho: Formulario de Autenticación */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo en Mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white">
              <AcademicCapIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Semi-Social</h2>
              <p className="text-[11px] text-zinc-400">Facultad de Ingeniería USAC</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Acceso a la plataforma</h2>
            <p className="text-xs text-zinc-400 mt-1.5">
              Ingresa mediante tus credenciales de usuario o reconocimiento facial.
            </p>
          </div>

          {/* Segmented Control / Selector de pestaña sin emojis */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTab('password'); setError(null); }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'password'
                  ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LockClosedIcon className="w-4 h-4" />
              <span>Contraseña</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('facial'); setError(null); }}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'facial'
                  ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700/60'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CameraIcon className="w-4 h-4" />
              <span>Biometría Facial</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
              <ExclamationCircleIcon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Formulario 1: Contraseña Tradicional */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. ana"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <LockClosedIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando con Cognito...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>
          )}

          {/* Formulario 2: Biometría Facial con Rekognition */}
          {activeTab === 'facial' && (
            <form onSubmit={handleFacialLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. ana"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Rostro para Verificación
                </label>

                {facialPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800 aspect-4/3 bg-black flex items-center justify-center group">
                    <img
                      src={facialPhoto}
                      alt="Rostro capturado"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFacialPhoto(null)}
                      className="absolute bottom-3 right-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-lg shadow-lg transition cursor-pointer"
                    >
                      Tomar otra foto
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsWebcamOpen(true)}
                      className="p-4 border border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/60 hover:bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group"
                    >
                      <CameraIcon className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-xs font-medium text-zinc-300">Cámara Web</span>
                    </button>

                    <label className="p-4 border border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/60 hover:bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group text-center">
                      <ArrowUpTrayIcon className="w-5 h-5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-xs font-medium text-zinc-300">Subir Archivo</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !facialPhoto}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Comparando rostro con Rekognition...</span>
                  </>
                ) : (
                  <span>Verificar Rostro y Acceder</span>
                )}
              </button>
            </form>
          )}

          {/* Enlace al registro */}
          <div className="pt-2 text-center text-xs text-zinc-400">
            ¿No tienes una cuenta aún?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Cámara */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(dataUrl) => {
          setFacialPhoto(dataUrl);
          setError(null);
        }}
        title="Capturar Rostro para Login Facial"
      />
    </div>
  );
}
