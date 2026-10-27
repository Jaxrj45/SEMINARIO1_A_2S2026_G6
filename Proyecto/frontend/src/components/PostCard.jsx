import { useState, useEffect } from 'react';
import { api } from '../api/apiClient';
import {
  LanguageIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  PhotoIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const getImageUrl = (p) => {
  if (p?.localPreview) return p.localPreview;
  const raw = p?.imageUrl || p?.imageKey || p?.imagen_key;
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw;
  }
  return `https://semi1proyecto--g6.s3.amazonaws.com/${raw.replace(/^\/+/, '')}`;
};

export default function PostCard({ post, onCommentAdded }) {
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [descLang, setDescLang] = useState('original');
  const [isTranslatingDesc, setIsTranslatingDesc] = useState(false);
  const [translateError, setTranslateError] = useState(null);

  // Manejo de imagen de la publicación con auto-reintento para propagación de S3
  const [currentImgUrl, setCurrentImgUrl] = useState(() => getImageUrl(post));
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  useEffect(() => {
    const nextUrl = getImageUrl(post);
    setCurrentImgUrl(nextUrl);
    setIsImageLoading(true);
    setImageError(false);
    setRetryAttempts(0);
  }, [post.imageUrl, post.imageKey, post.localPreview]);

  const handleImageError = () => {
    const rawUrl = getImageUrl(post);
    if (retryAttempts < 4 && rawUrl && !rawUrl.startsWith('data:')) {
      const nextAttempt = retryAttempts + 1;
      setRetryAttempts(nextAttempt);
      setIsImageLoading(true);
      setTimeout(() => {
        const separator = rawUrl.includes('?') ? '&' : '?';
        setCurrentImgUrl(`${rawUrl}${separator}_t=${Date.now()}`);
      }, nextAttempt * 1000);
    } else {
      setIsImageLoading(false);
      setImageError(true);
    }
  };

  const handleManualRetry = () => {
    setImageError(false);
    setIsImageLoading(true);
    setRetryAttempts(0);
    const rawUrl = getImageUrl(post);
    if (rawUrl) {
      const separator = rawUrl.includes('?') ? '&' : '?';
      setCurrentImgUrl(`${rawUrl}${separator}_t=${Date.now()}`);
    }
  };

  // Comentarios
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentTranslations, setCommentTranslations] = useState({});

  const translateText = async (text, targetLang) => {
    try {
      setTranslateError(null);
      const res = await api.post('/api/translate', { text, targetLang });
      if (res.status === 'success' && res.data?.translatedText) {
        return res.data.translatedText;
      }
      setTranslateError(res.message || 'No se pudo traducir el texto');
    } catch (err) {
      console.error('Error traduciendo:', err);
      setTranslateError('Error al contactar el servicio de traducción');
    }
    return null;
  };

  const handleTranslateDescription = async (targetLang) => {
    if (targetLang === 'original') {
      setTranslatedDesc(null);
      setDescLang('original');
      setTranslateError(null);
      return;
    }
    setIsTranslatingDesc(true);
    const result = await translateText(post.description, targetLang);
    if (result) {
      setTranslatedDesc(result);
      setDescLang(targetLang);
    }
    setIsTranslatingDesc(false);
  };

  const loadComments = async () => {
    if (comments.length > 0 && showComments) {
      setShowComments(false);
      return;
    }
    setLoadingComments(true);
    setShowComments(true);
    try {
      const res = await api.get(`/api/posts/${post.id}/comments`);
      if (res.status === 'success') {
        setComments(res.data || []);
      }
    } catch (err) {
      console.error('Error cargando comentarios:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await api.post(`/api/posts/${post.id}/comments`, { text: commentText });
      if (res.status === 'success' && res.data) {
        setComments(prev => [...prev, res.data]);
        setCommentText('');
        if (onCommentAdded) onCommentAdded(post.id);
      } else {
        alert(res.message || 'No se pudo publicar el comentario');
      }
    } catch (err) {
      console.error('Error publicando comentario:', err);
    }
  };

  const handleTranslateComment = async (commentId, text, targetLang) => {
    if (targetLang === 'original') {
      setCommentTranslations(prev => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      return;
    }

    const translated = await translateText(text, targetLang);
    if (translated) {
      setCommentTranslations(prev => ({
        ...prev,
        [commentId]: { text: translated, lang: targetLang }
      }));
    }
  };

  return (
    <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl transition hover:border-zinc-700/80">
      {/* Cabecera del autor */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.author?.photoUrl || `https://ui-avatars.com/api/?name=${post.author?.fullName || 'User'}&background=4f46e5&color=fff`}
            alt={post.author?.fullName}
            className="w-10 h-10 rounded-full object-cover border border-zinc-700"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${post.author?.fullName || 'User'}&background=4f46e5&color=fff`;
            }}
          />
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 leading-tight">
              {post.author?.fullName}
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              @{post.author?.username}
            </p>
          </div>
        </div>

        <span className="text-[11px] text-zinc-400">
          {new Date(post.createdAt).toLocaleDateString('es-GT', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>

      {/* Imagen de la publicación */}
      <div className="relative bg-zinc-950 aspect-[4/3] sm:aspect-video flex items-center justify-center overflow-hidden border-y border-zinc-800/80">
        {/* Skeleton shimmer mientras carga o reintenta con S3 */}
        {isImageLoading && !imageError && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-2 z-10 animate-pulse">
            <PhotoIcon className="w-8 h-8 text-zinc-600 animate-bounce" />
            <span className="text-[11px] text-zinc-400 font-medium">
              {retryAttempts > 0 ? `Sincronizando con S3 (intento ${retryAttempts}/4)...` : 'Cargando imagen...'}
            </span>
          </div>
        )}

        {/* Fallback limpio si no se pudo cargar tras los reintentos */}
        {imageError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400 gap-2">
            <PhotoIcon className="w-10 h-10 text-zinc-600" />
            <p className="text-xs text-zinc-400">No se pudo cargar la imagen de S3</p>
            <button
              type="button"
              onClick={handleManualRetry}
              className="mt-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-zinc-700"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>Reintentar carga</span>
            </button>
          </div>
        ) : (
          currentImgUrl && (
            <img
              src={currentImgUrl}
              alt={post.description || 'Publicación'}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                isImageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => {
                setIsImageLoading(false);
                setImageError(false);
              }}
              onError={handleImageError}
            />
          )
        )}
      </div>

      {/* Etiquetas detectadas por Rekognition */}
      {post.labels && post.labels.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-1.5 items-center">
          <SparklesIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          {post.labels.map((lbl, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60"
            >
              #{lbl}
            </span>
          ))}
        </div>
      )}

      {/* Contenido / Descripción */}
      <div className="p-4">
        {post.description && (
          <div className="mb-3">
            <p className="text-sm text-zinc-200 leading-relaxed">
              {translatedDesc || post.description}
            </p>

            {/* Opciones de traducción */}
            <div className="mt-2.5 flex items-center flex-wrap gap-2 text-xs">
              <span className="text-zinc-500 flex items-center gap-1 font-medium">
                <LanguageIcon className="w-3.5 h-3.5 text-zinc-400" />
                Amazon Translate:
              </span>
              {['en', 'fr', 'pt', 'es'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleTranslateDescription(lang)}
                  disabled={isTranslatingDesc}
                  className={`px-2 py-0.5 rounded-md uppercase font-semibold text-[10px] transition cursor-pointer ${
                    descLang === lang
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
              {descLang !== 'original' && (
                <button
                  type="button"
                  onClick={() => handleTranslateDescription('original')}
                  className="text-[11px] text-indigo-400 hover:underline ml-1 cursor-pointer"
                >
                  Original
                </button>
              )}
              {isTranslatingDesc && (
                <span className="text-[10px] text-indigo-400 animate-pulse font-medium">
                  Traduciendo...
                </span>
              )}
            </div>

            {translateError && (
              <p className="text-[11px] text-rose-400 mt-1.5">
                {translateError}
              </p>
            )}
          </div>
        )}

        {/* Barra de interacción */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <button
            type="button"
            onClick={loadComments}
            className="flex items-center gap-1.5 hover:text-zinc-200 transition cursor-pointer font-medium"
          >
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
            <span>
              {post.commentsCount !== undefined ? post.commentsCount : comments.length} Comentarios
            </span>
          </button>
        </div>

        {/* Sección de Comentarios */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
            {/* Lista de comentarios */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {loadingComments ? (
                <p className="text-xs text-zinc-500 text-center py-2">Cargando comentarios...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-2">No hay comentarios aún. ¡Sé el primero!</p>
              ) : (
                comments.map((c) => {
                  const translation = commentTranslations[c.id];
                  return (
                    <div key={c.id} className="text-xs p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-zinc-200">
                          {c.author?.fullName || c.author?.username}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(c.createdAt).toLocaleDateString('es-GT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-zinc-300">
                        {translation ? translation.text : c.text}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <span>Traducir:</span>
                        {['en', 'fr', 'pt', 'es'].map((l) => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => handleTranslateComment(c.id, c.text, l)}
                            className={`uppercase px-1.5 py-0.2 rounded hover:bg-zinc-800 ${
                              translation?.lang === l ? 'text-indigo-400 font-bold' : ''
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                        {translation && (
                          <button
                            type="button"
                            onClick={() => handleTranslateComment(c.id, c.text, 'original')}
                            className="text-indigo-400 hover:underline"
                          >
                            Original
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input para agregar comentario */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Comentar
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
