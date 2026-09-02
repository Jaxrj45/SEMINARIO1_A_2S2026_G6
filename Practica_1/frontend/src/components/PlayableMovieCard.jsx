import { PlayCircleIcon } from '@heroicons/react/24/solid';

export default function PlayableMovieCard({ movie }) {
  return (
    <div className="group relative flex flex-col bg-cinema-panel rounded-xl overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-cinema-primary/20 hover:shadow-2xl border border-white/5 cursor-pointer">
      {/* Póster de la película */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-900">
        <img 
          src={movie.poster} 
          alt={`Póster de ${movie.titulo}`} 
          className="object-cover w-full h-full transition-all duration-300 group-hover:scale-105 group-hover:opacity-40 group-hover:blur-[2px]"
        />
        
        {/* Play Icon on Hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
           <PlayCircleIcon className="w-16 h-16 text-white drop-shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300" />
        </div>

        {/* Etiqueta de Estado (Solo por si acaso guardaron una que es Próximo Estreno) */}
        {movie.estado && movie.estado !== "DISPONIBLE" && (
          <div className="absolute top-3 right-3 z-30">
            <span className="px-2 py-1 text-xs font-bold rounded-md shadow-sm backdrop-blur-md bg-gray-800/90 text-gray-300">
              {movie.estado.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Información */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-white leading-tight mb-1 truncate" title={movie.titulo}>
          {movie.titulo}
        </h3>
        <p className="text-sm text-gray-400 mb-1">
          {movie.director}
        </p>
        <p className="text-xs text-gray-500 font-medium">
          {movie.anio_estreno}
        </p>
      </div>
    </div>
  );
}
