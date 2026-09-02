import { Link } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  return (
    <nav className="bg-cinema-panel/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="flex flex-wrap items-center justify-between max-w-screen-xl mx-auto p-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <span className="self-center text-2xl font-bold whitespace-nowrap text-cinema-primary tracking-wider drop-shadow-md">
            CloudCinema
          </span>
        </Link>
        
        {/* Botones Login / Sign Up */}
        <div className="flex items-center md:order-2 space-x-2">
          <Link 
            to="/login" 
            className="text-white hover:bg-gray-800 border border-transparent font-medium rounded-lg text-sm px-4 py-2 transition-colors"
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="text-white bg-cinema-primary hover:bg-cinema-primary-hover font-medium rounded-lg text-sm px-4 py-2 transition-colors shadow-md shadow-cinema-primary/20"
          >
            Sign Up
          </Link>
          
          {/* Botón menú móvil */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button" 
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-400 rounded-lg md:hidden hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600"
          >
            <span className="sr-only">Abrir menú</span>
            <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14"/>
            </svg>
          </button>
        </div>

        {/* Links principales y Mega Menu */}
        <div className={`${isMenuOpen ? "block" : "hidden"} items-center justify-between w-full md:flex md:w-auto md:order-1`}>
          <ul className="flex flex-col mt-4 font-medium md:flex-row md:mt-0 md:space-x-8">
            <li>
              <Link to="/" className="block py-2 px-3 text-white border-b border-gray-700 hover:bg-gray-800 md:hover:bg-transparent md:border-0 md:hover:text-cinema-primary md:p-0">
                Inicio
              </Link>
            </li>
            

            <li>
              <Link to="/soporte" className="block py-2 px-3 text-gray-300 border-b border-gray-700 hover:bg-gray-800 md:hover:bg-transparent md:border-0 md:hover:text-cinema-primary md:p-0">
                Soporte
              </Link>
            </li>
          </ul>
        </div>

      </div>
    </nav>
  );
}
