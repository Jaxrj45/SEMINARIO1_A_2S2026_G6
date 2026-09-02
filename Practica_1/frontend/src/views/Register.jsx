import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpTrayIcon, CameraIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { registerUser } from "../api";

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmPassword: ""
  });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      setError("No se pudo acceder a la cámara. Asegúrate de dar los permisos.");
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], "webcam-photo.jpg", { type: "image/jpeg" });
        setFoto(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setFotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
        
        closeCamera();
      }, 'image/jpeg');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!foto) {
      setError("La foto de perfil es obligatoria.");
      return;
    }

    const data = new FormData();
    data.append("nombre_completo", formData.nombre);
    data.append("correo", formData.correo);
    data.append("password", formData.password);
    data.append("password_confirm", formData.confirmPassword);
    data.append("foto_perfil", foto);

    setIsLoading(true);
    const result = await registerUser(data);
    setIsLoading(false);

    if (result.ok) {
      navigate("/login");
    } else {
      setError(result.error?.error || "Error al registrar usuario");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col justify-center px-6 py-12 lg:px-8 relative">
      
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2000&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-black/60 sm:bg-black/70 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-base via-transparent to-transparent"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-white drop-shadow-lg">
          Crea tu Cuenta
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md mb-6 text-sm text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form className="bg-black/70 p-8 sm:p-10 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md" onSubmit={handleSubmit}>
          
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            
            <div className="flex-shrink-0 flex flex-col items-center sm:pt-4 w-full sm:w-auto">
              <div 
                className="relative group cursor-pointer w-32 h-32 rounded-full overflow-hidden border-2 border-gray-600 hover:border-cinema-primary transition-colors shadow-lg"
                onClick={() => fileInputRef.current.click()}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    <ArrowUpTrayIcon className="w-8 h-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-xs font-bold tracking-wider">
                  <ArrowUpTrayIcon className="w-5 h-5 mb-1" />
                  SUBIR
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              
              <button 
                type="button" 
                onClick={openCamera}
                className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-cinema-primary hover:text-white bg-gray-900/50 hover:bg-cinema-primary px-3 py-2 rounded-md transition-all shadow-md border border-cinema-primary/30"
              >
                <CameraIcon className="w-4 h-4" />
                TOMAR FOTO
              </button>
            </div>

            <div className="flex-grow space-y-5 w-full">
              
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-200">Nombre Completo</label>
                <div className="mt-2">
                  <input type="text" id="nombre" name="nombre" required onChange={handleChange}
                    className="block w-full rounded-md bg-gray-900/50 px-4 py-3 text-base text-white outline outline-1 -outline-offset-1 outline-white/20 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cinema-primary sm:text-sm transition-colors"
                    placeholder="Juan Pérez" />
                </div>
              </div>

              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-gray-200">Correo Electrónico</label>
                <div className="mt-2">
                  <input type="email" id="correo" name="correo" required onChange={handleChange}
                    className="block w-full rounded-md bg-gray-900/50 px-4 py-3 text-base text-white outline outline-1 -outline-offset-1 outline-white/20 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cinema-primary sm:text-sm transition-colors"
                    placeholder="ejemplo@correo.com" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200">Contraseña</label>
                  <div className="mt-2">
                    <input type="password" id="password" name="password" required minLength="6" onChange={handleChange}
                      className="block w-full rounded-md bg-gray-900/50 px-4 py-3 text-base text-white outline outline-1 -outline-offset-1 outline-white/20 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cinema-primary sm:text-sm transition-colors"
                      placeholder="********" />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">Confirmar</label>
                  <div className="mt-2">
                    <input type="password" id="confirmPassword" name="confirmPassword" required onChange={handleChange}
                      className="block w-full rounded-md bg-gray-900/50 px-4 py-3 text-base text-white outline outline-1 -outline-offset-1 outline-white/20 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cinema-primary sm:text-sm transition-colors"
                      placeholder="********" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-8 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-cinema-primary px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-cinema-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cinema-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Enviando..." : "Completar Registro"}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400 drop-shadow-md">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-cinema-primary hover:text-white transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">Tomar Foto de Perfil</h3>
              <button onClick={closeCamera} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 border border-gray-800">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover transform -scale-x-100"
              ></video>
            </div>
            
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={closeCamera}
                className="px-4 py-2 rounded-md font-bold text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={capturePhoto}
                className="px-6 py-2 rounded-md font-bold text-sm bg-cinema-primary text-white hover:bg-cinema-primary-hover shadow-lg transition-colors flex items-center gap-2"
              >
                <CameraIcon className="w-5 h-5" />
                Capturar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
