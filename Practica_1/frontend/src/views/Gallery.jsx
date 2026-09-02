import { useState, useEffect, useRef } from "react";
import MovieCard from "../components/MovieCard";
import MiniMovieCard from "../components/MiniMovieCard";
import { getMovies, getPlaylist } from "../api";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function Gallery() {
  const [movies, setMovies] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const rowRef = useRef(null);

  const scrollLeft = () => {
    if (rowRef.current) rowRef.current.scrollBy({ left: -400, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (rowRef.current) rowRef.current.scrollBy({ left: 400, behavior: "smooth" });
  };

  const refreshPlaylist = async () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const playlistData = await getPlaylist(user.id_usuario);
      setPlaylist(playlistData);
    }
  };

  // Cargar catálogo y playlist
  useEffect(() => {
    async function fetchData() {
      const catalogData = await getMovies();
      setMovies(catalogData);
      await refreshPlaylist();
      setIsLoading(false);
    }
    fetchData();
  }, []);

  // Las primeras 5 películas para el hero banner
  const heroMovies = movies.slice(0, 5);
  const featuredMovie = heroMovies[currentHeroIndex];

  // Efecto para cambiar el Flyer automáticamente cada 5 segundos
  useEffect(() => {
    if (heroMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prevIndex) => (prevIndex + 1) % heroMovies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroMovies.length]);

  return (
    <div className="pb-20">
      {/* 1. HERO SECTION (Los Flyers Carrusel) */}
      {featuredMovie && (
        <div className="relative w-full h-[60vh] lg:h-[70vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 transition-opacity duration-1000">
            <img 
              key={featuredMovie.id_pelicula} 
              src={featuredMovie.poster} 
              alt="Banner Destacado" 
              className="w-full h-full object-cover animate-fade-in"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-base via-cinema-base/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-base via-transparent to-transparent"></div>
          </div>
          
          <div className="relative z-10 px-4 sm:px-6 lg:px-12 max-w-2xl">
            <span className="px-2 py-1 bg-cinema-primary text-white text-xs font-bold rounded mb-4 inline-block shadow-lg">DESTACADO</span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg transition-all">
              {featuredMovie.titulo}
            </h1>
            <p className="text-gray-300 text-lg mb-6 line-clamp-3 drop-shadow-md">
              Descubre las tendencias más impactantes de la semana. No te pierdas esta increíble recomendación de nuestro catálogo.
            </p>
          </div>

          {/* Indicadores del Carrusel (Puntitos) */}
          {heroMovies.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
              {heroMovies.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 shadow-md ${idx === currentHeroIndex ? 'w-8 bg-cinema-primary' : 'w-2 bg-gray-400/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 space-y-12">
        
        {/* 2. FILA HORIZONTAL (Mi Lista) - SOLO SI HAY ELEMENTOS */}
        {playlist.length > 0 && (
          <div className="group relative">
            <h2 className="text-2xl font-bold text-white mb-4 pl-2 border-l-4 border-cinema-primary shadow-sm">Mi Lista</h2>
            
            <button 
              onClick={scrollLeft}
              className="absolute left-0 top-[50%] z-30 h-[80%] w-12 -translate-y-[20%] bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r-md cursor-pointer backdrop-blur-sm"
            >
              <ChevronLeftIcon className="w-8 h-8" />
            </button>

            <div ref={rowRef} className="flex overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {playlist.map((movie) => (
                <div key={`list-${movie.id_pelicula}`} className="min-w-[240px] sm:min-w-[300px] snap-start">
                  <MiniMovieCard movie={movie} onRemoveSuccess={refreshPlaylist} />
                </div>
              ))}
            </div>

            <button 
              onClick={scrollRight}
              className="absolute right-0 top-[50%] z-30 h-[80%] w-12 -translate-y-[20%] bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-md cursor-pointer backdrop-blur-sm"
            >
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* 3. CATÁLOGO COMPLETO (Grid) */}
        <div className={!featuredMovie ? "pt-10" : ""}>
          <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-cinema-primary shadow-sm">Catálogo Completo</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cinema-primary"></div>
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {movies.map((movie) => (
                <MovieCard 
                  key={movie.id_pelicula} 
                  movie={movie} 
                  onAddSuccess={refreshPlaylist} 
                  isInPlaylist={playlist.some(p => p.id_pelicula === movie.id_pelicula)} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 bg-cinema-panel rounded-xl border border-gray-700">
              No hay películas disponibles en el catálogo en este momento.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
