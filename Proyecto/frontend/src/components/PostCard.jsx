import { useState } from 'react';
import { api } from '../api/apiClient';
import {
  LanguageIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function PostCard({ post, onCommentAdded }) {
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [descLang, setDescLang] = useState('original');
  const [isTranslatingDesc, setIsTranslatingDesc] = useState(false);

  // Comentarios
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentTranslations, setCommentTranslations] = useState({});

  const translateText = async (text, targetLang) => {
    try {
      const res = await api.post('/api/translate', { text, targetLang });
      if (res.status === 'success' && res.data?.translatedText) {
        return res.data.translatedText;
      }
    } catch (err) {
      console.error('Error traduciendo:', err);
    }
    return null;
  };

  const handleTranslateDescription = async (targetLang) => {
    if (targetLang === 'original') {
      setTranslatedDesc(null);
      setDescLang('original');
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

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('es-GT', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <article className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Header del autor */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.author?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={post.author?.fullName}
            className="w-10 h-10 rounded-full object-cover border border-zinc-700"
          />
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm leading-tight">
              {post.author?.fullName}
            </h3>
            <span className="text-xs text-zinc-400">
              @{post.author?.username} · {formatDate(post.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Imagen de la publicación */}
      {post.imageUrl && (
        <div className="w-full max-h-[500px] bg-black flex items-center justify-center overflow-hidden">
          <img
            src={post.imageUrl}
            alt={post.description || 'Publicación'}
            className="w-full h-auto object-cover max-h-[500px]"
          />
        </div>
      )}

      {/* Etiquetas generadas por Rekognition */}
      {post.labels && post.labels.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-1.5">
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
            <div className="mt-2.5 flex items-center gap-2 text-xs">
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
            </div>
          </div>
        )}

        {/* Acciones: Comentarios */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <button
            onClick={loadComments}
            className="flex items-center gap-1.5 hover:text-indigo-400 transition cursor-pointer font-medium"
          >
            <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
            <span>{post.commentCount || comments.length || 0} Comentarios</span>
          </button>
        </div>

        {/* Sección desplegable de comentarios */}
        {showComments && (
          <div className="mt-4 pt-3 border-t border-zinc-800/60">
            {loadingComments ? (
              <p className="text-xs text-zinc-500 py-2">Cargando comentarios...</p>
            ) : (
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No hay comentarios aún en esta publicación.</p>
                ) : (
                  comments.map((c) => {
                    const trans = commentTranslations[c.id];
                    return (
                      <div key={c.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-zinc-200">
                            {c.author?.fullName || c.author?.username}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {formatDate(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {trans ? trans.text : c.text}
                        </p>

                        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <span className="text-zinc-500">Traducir:</span>
                          {['en', 'fr', 'pt', 'es'].map((lang) => (
                            <button
                              key={lang}
                              onClick={() => handleTranslateComment(c.id, c.text, lang)}
                              className="uppercase hover:text-indigo-400 px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 cursor-pointer"
                            >
                              {lang}
                            </button>
                          ))}
                          {trans && (
                            <button
                              onClick={() => handleTranslateComment(c.id, c.text, 'original')}
                              className="text-indigo-400 hover:underline ml-1 cursor-pointer"
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
            )}

            {/* Formulario para agregar comentario */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe un comentario para tu amigo..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
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
