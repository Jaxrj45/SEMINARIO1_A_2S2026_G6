import { useState } from 'react';
import { api } from '../api/apiClient';
import WebcamModal from './WebcamModal';
import {
  CameraIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  SparklesIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [description, setDescription] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

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

  const handleWebcamCapture = (dataUrl) => {
    setPhotoBase64(dataUrl);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoBase64) {
      setError('La fotografía es obligatoria para publicar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setStatusMessage('Subiendo imagen y extrayendo etiquetas con Rekognition...');
      const cleanBase64 = photoBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const uploadRes = await api.uploadPostPhoto(
        `post-${Date.now()}.jpg`,
        'image/jpeg',
        cleanBase64
      );

      if (uploadRes.status !== 'success' || !uploadRes.data?.key) {
        throw new Error(uploadRes.message || 'Error al procesar la imagen');
      }

      const { key, labels } = uploadRes.data;

      setStatusMessage('Guardando publicación en la base de datos...');
      const postRes = await api.post('/api/posts', {
        description: description.trim() || null,
        imageKey: key,
        labels: labels || []
      });

      if (postRes.status !== 'success') {
        throw new Error(postRes.message || 'Error al crear la publicación');
      }

      const createdPost = {
        ...(postRes.data || {}),
        localPreview: photoBase64
      };

      setDescription('');
      setPhotoBase64(null);
      if (onPostCreated) onPostCreated(createdPost);
      onClose();
    } catch (err) {
      console.error('Error al publicar:', err);
      setError(err.message || 'Ocurrió un error al crear la publicación');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <PhotoIcon className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-sm text-zinc-100">Nueva Publicación</h3>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Selección de imagen */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Fotografía (Obligatoria)
              </label>

              {photoBase64 ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 aspect-16/10 bg-black flex items-center justify-center">
                  <img
                    src={photoBase64}
                    alt="Previsualización"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoBase64(null)}
                    disabled={loading}
                    className="absolute top-3 right-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs px-3 py-1.5 rounded-lg shadow-lg cursor-pointer transition"
                  >
                    Cambiar Foto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsWebcamOpen(true)}
                    className="p-6 border border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/50 hover:bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group"
                  >
                    <CameraIcon className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-xs font-medium text-zinc-300">Cámara Web</span>
                    <span className="text-[10px] text-zinc-500">Capturar en vivo</span>
                  </button>

                  <label className="p-6 border border-zinc-800 hover:border-indigo-500/50 bg-zinc-950/50 hover:bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group text-center">
                    <ArrowUpTrayIcon className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-xs font-medium text-zinc-300">Subir Archivo</span>
                    <span className="text-[10px] text-zinc-500">JPG o PNG (máx 2MB)</span>
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

            {/* Descripción */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Descripción (Opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Escribe una descripción sobre la publicación..."
                rows={3}
                disabled={loading}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {statusMessage && (
              <div className="flex items-center justify-center gap-2 text-xs text-indigo-400">
                <SparklesIcon className="w-4 h-4 animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !photoBase64}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                {loading ? 'Publicando...' : 'Publicar Ahora'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={handleWebcamCapture}
        title="Fotografía para Publicación"
      />
    </>
  );
}
