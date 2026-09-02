import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setIsLoading(true);
    const result = await loginUser(correo, password);
    setIsLoading(false);

    if (result.ok) {
      localStorage.setItem("user", JSON.stringify(result.data));
      navigate("/gallery");
    } else {
      setError(result.error?.error || "Error al iniciar sesión");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col justify-center px-6 py-12 lg:px-8 relative">
      
      {/* Fondo tipo Netflix */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2000&auto=format&fit=crop')" }}
      >
        {/* Capa oscura difuminada */}
        <div className="absolute inset-0 bg-black/60 sm:bg-black/70 backdrop-blur-[2px]"></div>
        {/* Gradiente extra en la parte inferior para fundirse si la página crece */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-base via-transparent to-transparent"></div>
      </div>

      {/* Contenido (debe tener z-10 para estar por encima del fondo) */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-white drop-shadow-lg">
          Iniciar Sesión
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md mb-6 text-sm text-center backdrop-blur-md">
            {error}
          </div>
        )}

        <form className="bg-black/70 p-8 sm:p-10 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-200">
              Correo Electrónico
            </label>
            <div className="mt-2">
              <input
                id="correo"
                name="correo"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="block w-full rounded-md bg-gray-900/50 px-4 py-3 text-base text-white outline outline-1 -outline-offset-1 outline-white/20 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cinema-primary sm:text-sm transition-colors"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                Contraseña
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-gray-900/50 px-4 py-3 text-base text-white outline outline-1 -outline-offset-1 outline-white/20 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cinema-primary sm:text-sm transition-colors"
                placeholder="********"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md bg-cinema-primary px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-cinema-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cinema-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Cargando..." : "Entrar a CloudCinema"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-400 drop-shadow-md">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-cinema-primary hover:text-white transition-colors">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
