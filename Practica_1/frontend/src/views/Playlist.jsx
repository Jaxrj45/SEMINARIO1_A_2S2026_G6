import { useState, useEffect } from "react";
import MovieCard from "../components/MovieCard";
import { getPlaylist } from "../api";
import { Link } from "react-router-dom";

export default function Playlist() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlaylist = async () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const data = await getPlaylist(user.id_usuario);
      setMovies(data);
    }
  };

  useEffect(() => {
    async function init() {
      await loadPlaylist();
      setIsLoading(false);
    }
    init();
  }, []);

  return (
    <div className="min-h-screen pt-12 pb-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-3xl font-extrabold text-white mb-2">Mi Lista</h1>
        <p className="text-gray-400">Las películas y series que has guardado para ver después.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cinema-primary"></div>
        </div>
      ) : movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <MovieCard 
              key={movie.id_lista || movie.id_pelicula} 
              movie={movie} 
              isPlaylistView={true} 
              onRemoveSuccess={loadPlaylist} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-xl text-gray-300 mb-4">Aún no has agregado nada a tu lista.</h2>
          <Link to="/gallery" className="text-cinema-primary hover:text-cinema-primary-hover font-bold text-lg border border-cinema-primary rounded px-6 py-2">
            Explorar Catálogo
          </Link>
        </div>
      )}
    </div>
  );
}
