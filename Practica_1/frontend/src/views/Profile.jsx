import { useState, useEffect, useRef } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { updateProfile } from "../api";
import { useNotification } from "../context/NotificationContext";

export default function Profile() {
  const [user, setUser] = useState({
    id_usuario: null,
    nombre_completo: "",
    correo: "",
    foto_perfil: ""
  });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setFotoPreview(parsedUser.foto_perfil);
    }
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      addNotification("Error de validación", "La contraseña actual es obligatoria", "error");
      return;
    }

    const formData = new FormData();
    formData.append("id_usuario", user.id_usuario);
    formData.append("nombre_completo", user.nombre_completo);
    formData.append("password", password);
    if (foto) {
      formData.append("foto_perfil", foto);
    }

    setIsLoading(true);
    const result = await updateProfile(formData);
    setIsLoading(false);

    if (result.ok) {
      addNotification("Perfil guardado", "Tu perfil se ha actualizado correctamente", "success");
      localStorage.setItem("user", JSON.stringify(result.data));
      setUser(result.data);
      setFoto(null);
      setPassword("");
      window.dispatchEvent(new Event('userUpdated'));
    } else {
      addNotification("Error", result.error?.error || "Error al actualizar el perfil", "error");
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-20 max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-extrabold text-white">Configuración de Cuenta</h1>
      </div>

      <div className="bg-cinema-panel rounded-xl border border-gray-700 shadow-xl p-6 sm:p-8">
        
        <form className="animate-fade-in space-y-10" onSubmit={handleSubmit}>
          
          <div>
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700/50 pb-2">Información Personal</h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              <div className="relative group" onClick={() => fileInputRef.current.click()}>
                <img 
                  src={fotoPreview || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                  alt="Foto de perfil" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-700 group-hover:border-cinema-primary transition-colors"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                  <ArrowUpTrayIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Foto de Perfil</h3>
                <p className="text-sm text-gray-400 mb-4">Sube una imagen en formato JPG o PNG.</p>
                <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors inline-block shadow-sm">
                  Elegir Archivo
                  <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input 
                  type="text" 
                  name="nombre_completo"
                  value={user.nombre_completo}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-cinema-primary focus:ring-1 focus:ring-cinema-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  disabled 
                  value={user.correo} 
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-md px-4 py-2 text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Para cambiar tu correo debes contactar a soporte.</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-700/50 pb-2">Seguridad y Validación</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-lg">
              Para guardar cualquier cambio en tu perfil (nombre o foto), debes ingresar tu contraseña actual para verificar tu identidad.
            </p>

            <div className="space-y-6 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-cinema-primary mb-1">Contraseña Actual (Obligatoria)</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900/50 border border-cinema-primary/50 rounded-md px-4 py-2 text-white focus:outline-none focus:border-cinema-primary focus:ring-1 focus:ring-cinema-primary transition-colors"
                  placeholder="Tu contraseña actual"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end max-w-lg">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-cinema-primary hover:bg-cinema-primary-hover text-white font-bold py-3 px-8 rounded-md shadow-lg shadow-cinema-primary/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
