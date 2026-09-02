import { Link } from "react-router-dom";
import { ServerStackIcon, ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="bg-cinema-base">
      
      {/* HERO SECTION */}
      <div className="relative flex flex-col min-h-[calc(100vh-80px)] justify-center items-center pb-24">
        {/* Fondo de Imagen Real (Cine) */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80')" }}
        >
          {/* Filtro oscuro ligero para que la imagen resalte pero el texto se lea */}
          {/* Eliminamos el gradiente inferior para no ocultar las sillas del cine */}
          <div className="absolute inset-0 bg-black/40 sm:bg-black/50"></div>
        </div>

        {/* Contenido Principal Informativo */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          
          <span className="text-cinema-primary font-bold tracking-wider uppercase text-sm mb-4 block drop-shadow-md">
            Proyecto Universitario
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-2xl mb-6 leading-tight">
            CloudCinema: Práctica 1
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-100 mb-8 font-medium drop-shadow-lg">
            Seminario de Sistemas 1 - Segundo Semestre 2026
          </p>
          
          <p className="text-lg text-gray-300 mb-10 drop-shadow-md max-w-2xl mx-auto leading-relaxed">
            Explora una arquitectura web moderna desplegada en AWS. Esta plataforma implementa un catálogo interactivo, 
            sistema de autenticación seguro, y alta disponibilidad.
          </p>

          <Link 
            to="/register"
            className="inline-flex h-14 px-8 bg-cinema-primary hover:bg-cinema-primary-hover text-white text-xl font-bold rounded-md items-center justify-center transition-colors shadow-lg shadow-cinema-primary/30"
          >
            Probar la aplicación
          </Link>
        </div>
      </div>

      {/* UNDER BAR (MOCKUPS LIMPIOS) - Integrado naturalmente */}
      <div className="bg-cinema-base py-16 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-12">
            
            {/* Feature 1 */}
            <div className="flex items-center justify-center sm:justify-start gap-4">
              <ShieldCheckIcon className="h-10 w-10 text-cinema-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-400">Autenticación Segura</p>
                <p className="font-bold text-white text-lg">Validación y Cifrado MD5</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center justify-center sm:justify-start gap-4 border-t border-white/10 pt-8 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-12">
              <UserGroupIcon className="h-10 w-10 text-cinema-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-400">Gestión de Perfiles</p>
                <p className="font-bold text-white text-lg">Almacenamiento en S3</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center justify-center sm:justify-start gap-4 border-t border-white/10 pt-8 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-12">
              <ServerStackIcon className="h-10 w-10 text-cinema-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-400">Alta Disponibilidad</p>
                <p className="font-bold text-white text-lg">ALB, EC2 y Contenedores</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
