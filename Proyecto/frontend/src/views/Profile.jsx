import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import WebcamModal from '../components/WebcamModal';
import {
  CameraIcon,
  ArrowUpTrayIcon,
  LockClosedIcon,
  UserIcon,
  IdentificationIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [dpi, setDpi] = useState(user?.dpi || '');
  const [password, setPassword] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar los 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password) {
      setError('Debes ingresar tu contraseña actual para confirmar los cambios.');
      return;
    }

    if (dpi.trim().length !== 13 || !/^\d+$/.test(dpi.trim())) {
      setError('El DPI debe contener exactamente 13 dígitos numéricos.');
      return;
    }

    setLoading(true);

    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        dpi: dpi.trim(),
        password,
        photoBase64,
        photoFileName: `profile-${user?.username}.jpg`
      });

      if (res.success) {
        setSuccess('Perfil actualizado correctamente en RDS y Cognito.');
        setPassword('');
        setPhotoBase64(null);
      } else {
        setError(res.message || 'Error al actualizar el perfil.');
      }
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError(err.message || 'Ocurrió un error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-zinc-800">
          <div className="relative group">
            <img
              src={photoBase64 || user?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt={user?.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-xl"
            />
          </div>

          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-white">{user?.fullName}</h1>
            <p className="text-xs text-indigo-400 font-medium">@{user?.username}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 text-[11px] px-2.5 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-400">
              DPI: {user?.dpi || 'Sin asignar'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-3.5 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
            <ExclamationCircleIcon className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-6 p-3.5 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs rounded-xl flex items-start gap-2.5">
            <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <h2 className="text-sm font-bold text-zinc-200">Datos Personales</h2>

          {/* Actualizar foto */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Actualizar Fotografía de Perfil (Opcional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsWebcamOpen(true)}
                className="py-2.5 px-3 border border-zinc-800 hover:border-indigo-500 bg-zinc-950/60 rounded-xl text-xs font-medium text-zinc-300 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <CameraIcon className="w-4 h-4 text-zinc-400" />
                <span>Usar Cámara Web</span>
              </button>

              <label className="py-2.5 px-3 border border-zinc-800 hover:border-indigo-500 bg-zinc-950/60 rounded-xl text-xs font-medium text-zinc-300 flex items-center justify-center gap-2 cursor-pointer transition text-center">
                <ArrowUpTrayIcon className="w-4 h-4 text-zinc-400" />
                <span>Subir Archivo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                DPI (13 dígitos)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <IdentificationIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={13}
                  value={dpi}
                  onChange={(e) => setDpi(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Confirmación obligatoria de contraseña */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
              <LockClosedIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contraseña Actual (Requerida para guardar cambios)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña para autorizar la actualización"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Requisito del sistema: la contraseña valida el hash MD5 en MySQL antes de actualizar los atributos en Cognito.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(dataUrl) => {
          setPhotoBase64(dataUrl);
          setError(null);
        }}
        title="Actualizar Fotografía de Perfil"
      />
    </div>
  );
}
