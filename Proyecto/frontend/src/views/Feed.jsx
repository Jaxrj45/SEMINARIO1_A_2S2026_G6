import { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import {
  PhotoIcon,
  TagIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  InboxIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('Todos');
  const [tagSearch, setTagSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadTags();
  }, [tagSearch]);

  useEffect(() => {
    loadPosts();
  }, [selectedTag]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const endpoint = selectedTag && selectedTag !== 'Todos'
        ? `/api/posts?tag=${encodeURIComponent(selectedTag)}`
        : '/api/posts';
      const res = await api.get(endpoint);
      if (res.status === 'success') {
        setPosts(res.data || []);
      }
    } catch (err) {
      console.error('Error cargando posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const endpoint = tagSearch.trim()
        ? `/api/tags?q=${encodeURIComponent(tagSearch.trim())}`
        : '/api/tags';
      const res = await api.get(endpoint);
      if (res.status === 'success') {
        setTags(res.data || []);
      }
    } catch (err) {
      console.error('Error cargando etiquetas:', err);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    loadTags();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Barra superior de creación */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Muro de Publicaciones</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Feed de publicaciones académicas y actividades de la Facultad de Ingeniería.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Crear Publicación</span>
        </button>
      </div>

      {/* Sección de Filtros por Etiquetas (Rekognition) y Buscador */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <TagIcon className="w-4 h-4 text-indigo-400" />
            <span>Filtro por Etiquetas (Amazon Rekognition)</span>
          </div>

          {/* Buscador de etiquetas */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500">
              <MagnifyingGlassIcon className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Buscar etiqueta..."
              className="bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 w-full sm:w-48"
            />
            {tagSearch && (
              <button
                onClick={() => setTagSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de tags en pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro "Todos" obligatorio */}
          <button
            onClick={() => setSelectedTag('Todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              selectedTag === 'Todos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            Todos
          </button>

          {tags.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelectedTag(t.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedTag === t.name
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span>#{t.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 rounded-md text-zinc-400">
                {t.count}
              </span>
            </button>
          ))}

          {tags.length === 0 && tagSearch && (
            <span className="text-xs text-zinc-500 italic">No se encontraron etiquetas que coincidan.</span>
          )}
        </div>
      </div>

      {/* Lista de Publicaciones */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-zinc-900 border border-zinc-800 rounded-2xl h-80 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400 mb-3">
            <InboxIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">No hay publicaciones disponibles</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {selectedTag !== 'Todos'
              ? `No se encontraron publicaciones con la etiqueta #${selectedTag}.`
              : 'Agrega amigos o crea tu primera publicación para comenzar a interactuar.'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Crear Publicación Ahora
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Modal para Crear Publicación */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
