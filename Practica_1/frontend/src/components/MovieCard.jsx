import { useState } from "react";
import { addToPlaylist, removeFromPlaylist } from "../api";
import { useNotification } from "../context/NotificationContext";
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { EllipsisVerticalIcon, PlayCircleIcon } from '@heroicons/react/24/solid';

export default function MovieCard({ movie, onAddSuccess, isPlaylistView, onRemoveSuccess, isInPlaylist }) {
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotification();
  const isAvailable = movie.estado === "DISPONIBLE" || isPlaylistView;

  const handleAdd = async () => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      addNotification("Error", "Debes iniciar sesión para agregar a tu lista", "error");
      return;
    }
    const user = JSON.parse(savedUser);
    
    setLoading(true);
    const result = await addToPlaylist(user.id_usuario, movie.id_pelicula);
    setLoading(false);

    if (result.ok) {
      addNotification("Guardado exitosamente", result.data.mensaje || `Agregaste "${movie.titulo}" a tu lista.`, "success");
      if (onAddSuccess) onAddSuccess();
    } else {
      addNotification("Error", result.error?.error || "Error al agregar a la lista", "error");
    }
  };

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
    if (isPlaylistView && movie.url_contenido) {
      window.open(movie.url_contenido, "_blank");
    }
  };

  return (
    <div className="group relative flex flex-col bg-cinema-panel rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-cinema-primary/20 hover:shadow-2xl border border-white/5">
      {/* Póster de la película */}
      <div 
        className={`relative aspect-[2/3] overflow-hidden ${isPlaylistView ? 'cursor-pointer' : ''}`}
        onClick={handlePlay}
      >
        <img 
          src={movie.poster} 
          alt={`Póster de ${movie.titulo}`} 
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay de Play en PlaylistView */}
        {isPlaylistView && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <PlayCircleIcon className="w-16 h-16 text-white drop-shadow-lg" />
          </div>
        )}

        {/* Etiqueta de Estado flotante (Solo mostrar si NO está disponible y NO es playlistView) */}
        {!isAvailable && !isPlaylistView && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-bold rounded-md shadow-sm backdrop-blur-md bg-gray-800/90 text-gray-300">
              {movie.estado.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Menú de 3 puntitos para eliminar */}
      {isPlaylistView && (
        <div className="absolute top-2 right-2 z-10">
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton className="flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80 focus:outline-none transition-colors">
              <EllipsisVerticalIcon className="w-5 h-5" />
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
      )}

      {/* Información */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-white leading-tight mb-1 truncate" title={movie.titulo}>
          {movie.titulo}
        </h3>
        <p className="text-sm text-gray-400 mb-1">
          {movie.director}
        </p>
        <p className="text-xs text-gray-500 font-medium mb-4">
          {movie.anio_estreno}
        </p>

        {/* Botón de acción */}
        {!isPlaylistView && (
          <div className="mt-auto">
            {isInPlaylist ? (
              <button 
                disabled={true}
                className="w-full py-2 px-4 rounded-md font-bold bg-gray-800 text-green-500 cursor-not-allowed border border-gray-700 opacity-90 shadow-inner"
              >
                ✓ En tu lista
              </button>
            ) : (
              <button 
                disabled={!isAvailable || loading}
                onClick={handleAdd}
                className={`w-full py-2 px-4 rounded-md font-bold transition-all duration-200 shadow-md ${
                  isAvailable 
                    ? 'bg-cinema-primary text-white hover:bg-cinema-primary-hover hover:shadow-cinema-primary/50 cursor-pointer' 
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600'
                } disabled:opacity-50`}
              >
                {!isAvailable ? "Próximamente" : loading ? "Agregando..." : "+ Mi Lista"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
