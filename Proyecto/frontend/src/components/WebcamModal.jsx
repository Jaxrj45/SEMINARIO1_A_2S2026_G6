import { useState, useRef, useEffect } from 'react';
import { CameraIcon, XMarkIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function WebcamModal({ isOpen, onClose, onCapture, title = "Captura de Fotografía" }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPhotoPreview(null);
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error al acceder a la cámara web:', err);
      setCameraError('No se pudo acceder a la cámara web. Asegúrate de otorgar los permisos necesarios en el navegador.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoPreview(dataUrl);
  };

  const confirmPhoto = () => {
    if (photoPreview) {
      onCapture(photoPreview);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CameraIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-sm text-zinc-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {cameraError ? (
            <div className="p-4 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs rounded-xl text-center w-full">
              {cameraError}
            </div>
          ) : (
            <div className="relative w-full aspect-4/3 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-zinc-800 shadow-inner">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Captura previa"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6 w-full justify-center">
            {photoPreview ? (
              <>
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-medium transition cursor-pointer flex items-center gap-2"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Repetir Foto</span>
                </button>
                <button
                  type="button"
                  onClick={confirmPhoto}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Usar Esta Foto</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!!cameraError}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                <CameraIcon className="w-4 h-4" />
                <span>Capturar Fotografía</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
