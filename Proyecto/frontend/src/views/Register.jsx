import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WebcamModal from '../components/WebcamModal';
import {
  UserIcon,
  EnvelopeIcon,
  IdentificationIcon,
  LockClosedIcon,
  CameraIcon,
  ArrowUpTrayIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function Register() {
  const navigate = useNavigate();
  const { register, confirmVerification } = useAuth();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    dpi: '',
    password: '',
    confirmPassword: ''
  });

  const [photoBase64, setPhotoBase64] = useState(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('La fotografía de perfil no debe superar los 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.username.trim() || !formData.fullName.trim() || !formData.email.trim() || !formData.dpi.trim() || !formData.password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (formData.dpi.trim().length !== 13 || !/^\d+$/.test(formData.dpi.trim())) {
      setError('El DPI debe contener exactamente 13 dígitos numéricos.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres según las directivas de seguridad de Cognito.');
      return;
    }

    if (!photoBase64) {
      setError('La fotografía de perfil es obligatoria para el registro y reconocimiento facial.');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username.trim().toLowerCase(),
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        dpi: formData.dpi.trim(),
        password: formData.password,
        photoBase64,
        photoFileName: `${formData.username.trim().toLowerCase()}-profile.jpg`
      });

      setSuccessMsg('Se ha enviado un código de verificación a tu correo electrónico.');
      setStep(2);
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      setError(err.message || 'Error en el proceso de registro.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Ingresa el código de 6 dígitos recibido por correo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmVerification(formData.username.trim().toLowerCase(), verificationCode.trim());
      navigate('/login');
    } catch (err) {
      console.error('Error al verificar código:', err);
      setError(err.message || 'Código de verificación inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans py-12 px-4 sm:px-6 lg:px-8 items-center justify-center">
      <div className="max-w-xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
              <AcademicCapIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {step === 1 ? 'Crear Cuenta Académica' : 'Verificación de Correo'}
              </h1>
              <p className="text-xs text-zinc-400">
                {step === 1 ? 'Plataforma oficial Semi-Social · Facultad de Ingeniería' : `Código enviado a ${formData.email}`}
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-500 font-medium">
            Paso {step} de 2
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
            <ExclamationCircleIcon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && step === 2 && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs rounded-xl flex items-start gap-2.5">
            <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Paso 1: Formulario */}
        {step === 1 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Foto de perfil con Webcam o Archivo */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Fotografía de Perfil (Requerida para Reconocimiento Facial)
              </label>

              {photoBase64 ? (
                <div className="flex items-center justify-between p-3.5 bg-zinc-800/40 rounded-xl border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={photoBase64}
                      alt="Foto seleccionada"
                      className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">Fotografía cargada</p>
                      <p className="text-[11px] text-zinc-400">Lista para almacenamiento en S3 y Rekognition</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhotoBase64(null)}
                    className="text-xs font-medium text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 cursor-pointer transition"
                  >
                    Cambiar
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ana María López"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="ana"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <EnvelopeIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ana@correo.com"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  DPI (13 dígitos)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <IdentificationIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="dpi"
                    maxLength={13}
                    value={formData.dpi}
                    onChange={handleChange}
                    placeholder="1234567890101"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <LockClosedIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <LockClosedIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registrando en Cognito y S3...</span>
                </>
              ) : (
                <span>Crear Cuenta</span>
              )}
            </button>
          </form>
        )}

        {/* Paso 2: Código de Confirmación de Cognito */}
        {step === 2 && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Código de Confirmación de Cognito
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                required
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-center text-xl tracking-widest text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Confirmando en Cognito...</span>
                </>
              ) : (
                <span>Confirmar Cuenta</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Volver al formulario de registro</span>
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800">
          ¿Ya tienes cuenta activa?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Inicia sesión aquí
          </Link>
        </div>
      </div>

      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(dataUrl) => {
          setPhotoBase64(dataUrl);
          setError(null);
        }}
        title="Capturar Foto de Perfil con Webcam"
      />
    </div>
  );
}
