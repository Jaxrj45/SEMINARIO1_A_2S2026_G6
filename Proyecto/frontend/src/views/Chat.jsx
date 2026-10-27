import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { chatSocket } from '../services/chatSocket';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

export default function Chat() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const friendIdParam = searchParams.get('friendId');

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    const unsubscribe = chatSocket.subscribe((incomingMsg) => {
      if (
        selectedFriend &&
        (incomingMsg.fromUserId === selectedFriend.id || incomingMsg.toUserId === selectedFriend.id)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
      }
    });

    return () => unsubscribe();
  }, [selectedFriend]);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages(selectedFriend.id);
    }
  }, [selectedFriend]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await api.get('/api/friends');
      if (res.status === 'success') {
        const list = res.data || [];
        setFriends(list);
        if (friendIdParam) {
          const match = list.find((f) => f.id === Number(friendIdParam));
          if (match) setSelectedFriend(match);
          else if (list.length > 0) setSelectedFriend(list[0]);
        } else if (list.length > 0) {
          setSelectedFriend(list[0]);
        }
      }
    } catch (err) {
      console.error('Error cargando amigos para el chat:', err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadMessages = async (friendId) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/api/chat/${friendId}/messages`);
      if (res.status === 'success') {
        setMessages(res.data || []);
      }
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedFriend) return;

    const text = inputText.trim();
    setInputText('');

    chatSocket.sendMessage(selectedFriend.id, text, user?.id);
  };

  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString('es-GT', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 h-[calc(100vh-5rem)]">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl h-full shadow-2xl flex overflow-hidden">
        {/* Barra lateral de Amigos */}
        <aside className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/60">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-sm font-bold text-white">Mensajería en Vivo</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              WebSocket EC2 Load Balancer
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
            {loadingFriends ? (
              <p className="text-xs text-zinc-500 p-4">Cargando contactos...</p>
            ) : friends.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                Aún no tienes amigos agregados. Agrega contactos en la sección de Comunidad para conversar.
              </div>
            ) : (
              friends.map((f) => {
                const isSelected = selectedFriend?.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFriend(f)}
                    className={`w-full p-4 flex items-center gap-3 text-left transition cursor-pointer ${
                      isSelected ? 'bg-zinc-800/80 border-l-4 border-indigo-500' : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    <img
                      src={f.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={f.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 truncate">
                        {f.fullName}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">@{f.username}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Área Principal de Conversación */}
        <main className="flex-1 flex flex-col bg-zinc-950/30">
          {selectedFriend ? (
            <>
              {/* Header de conversación */}
              <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900/40">
                <img
                  src={selectedFriend.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={selectedFriend.fullName}
                  className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                />
                <div>
                  <h3 className="text-xs font-bold text-white">{selectedFriend.fullName}</h3>
                  <span className="text-[10px] text-emerald-400 font-medium">Conectado</span>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 p-6 overflow-y-auto space-y-3">
                {loadingMessages ? (
                  <p className="text-xs text-zinc-500 text-center py-4">Cargando historial...</p>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs italic">
                    Inicia la conversación enviando un mensaje.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.fromUserId === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                              : 'bg-zinc-800 border border-zinc-700/60 text-zinc-200 rounded-bl-none'
                          }`}
                        >
                          <p className="leading-relaxed">{m.text}</p>
                          <span
                            className={`block text-[9px] mt-1 text-right ${
                              isMe ? 'text-indigo-200' : 'text-zinc-400'
                            }`}
                          >
                            {formatTime(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulario de envío */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex gap-3"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Escribe un mensaje para ${selectedFriend.fullName.split(' ')[0]}...`}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-500 text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500 mb-3">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-semibold text-zinc-300">Selecciona un contacto</h3>
              <p className="text-[11px] text-zinc-500 max-w-xs mt-1">
                Elige un compañero en la lista lateral para cargar el historial de mensajes.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
