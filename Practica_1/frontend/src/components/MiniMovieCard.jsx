import { useState } from "react";
import { PlayCircleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { removeFromPlaylist } from "../api";
import { useNotification } from "../context/NotificationContext";

export default function MiniMovieCard({ movie, onRemoveSuccess }) {
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();

  const handleRemove = async (e) => {
    e.stopPropagation();
    const savedUser = localStorage.getItem("user");
    if (!savedUser) return;
    const user = JSON.parse(savedUser);
    
    setLoading(true);
    const result = await removeFromPlaylist(movie.id_lista, user.id_usuario);
    setLoading(false);

    if (result.ok) {
      addNotification("Eliminada", `"${movie.titulo}" fue eliminada de tu lista.`, "success");
      if (onRemoveSuccess) onRemoveSuccess();
    } else {
      addNotification("Error", result.error?.error || "Error al eliminar de la lista", "error");
    }
  };

  const handlePlay = () => {
    if (movie.url_contenido) {
      window.open(movie.url_contenido, "_blank");
    }
  };

  return (
    <div 
      className="group relative bg-cinema-panel rounded-md overflow-hidden shadow-lg transition-all duration-300 hover:scale-110 hover:z-10 hover:shadow-cinema-primary/40 hover:shadow-2xl cursor-pointer"
      onClick={handlePlay}
    >
      <div className="aspect-video w-full">
        <img 
          src={movie.poster} 
          alt={`Póster de ${movie.titulo}`} 
          className="object-cover w-full h-full"
        />
      </div>
      
      {/* Overlay oscuro al hacer hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
        {/* Icono de Play */}
        <PlayCircleIcon className="w-12 h-12 text-white/90 drop-shadow-lg mb-2 transform scale-75 group-hover:scale-100 transition-transform duration-300" />
        
        {/* Título */}
        <p className="text-white text-xs font-bold px-2 truncate w-full text-center">
          {movie.titulo}
        </p>
      </div>

      {/* Menú de 3 puntitos para eliminar */}
      <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Menu as="div" className="relative inline-block text-left">
          <MenuButton 
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-white hover:bg-black/80 focus:outline-none transition-colors"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </MenuButton>
          <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 overflow-hidden">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={handleRemove}
                  disabled={loading}
                  className={`${active ? 'bg-gray-700 text-white' : 'text-gray-300'} w-full text-left px-4 py-2 text-sm transition-colors`}
                >
                  {loading ? 'Eliminando...' : 'Eliminar de mi lista'}
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </div>
  );
}
