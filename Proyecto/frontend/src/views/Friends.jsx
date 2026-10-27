import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/apiClient';
import {
  UserGroupIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Friends() {
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'requests' | 'friends'
  const [discoverUsers, setDiscoverUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (activeTab === 'discover') {
      loadDiscoverUsers();
    } else if (activeTab === 'requests') {
      loadRequests();
    } else if (activeTab === 'friends') {
      loadFriends();
    }
  }, [activeTab, searchQuery]);

  const loadDiscoverUsers = async () => {
    setLoading(true);
    try {
      const endpoint = searchQuery.trim()
        ? `/api/users/discover?q=${encodeURIComponent(searchQuery.trim())}`
        : '/api/users/discover';
      const res = await api.get(endpoint);
      if (res.status === 'success') {
        setDiscoverUsers(res.data || []);
      }
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/friends/requests');
      if (res.status === 'success') {
        setRequests(res.data || { received: [], sent: [] });
      }
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/friends');
      if (res.status === 'success') {
        setFriends(res.data || []);
      }
    } catch (err) {
      console.error('Error al cargar amigos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (toUserId) => {
    try {
      const res = await api.post('/api/friends/requests', { toUserId });
      if (res.status === 'success') {
        setActionMessage('Solicitud de amistad enviada con éxito.');
        setTimeout(() => setActionMessage(null), 3000);
        loadDiscoverUsers();
      } else {
        alert(res.message || 'No se pudo enviar la solicitud');
      }
    } catch (err) {
      console.error('Error enviando solicitud:', err);
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      const res = await api.put(`/api/friends/requests/${requestId}`, { action });
      if (res.status === 'success') {
        setActionMessage(action === 'accept' ? 'Solicitud aceptada.' : 'Solicitud rechazada.');
        setTimeout(() => setActionMessage(null), 3000);
        loadRequests();
      }
    } catch (err) {
      console.error('Error respondiendo solicitud:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header y Pestañas */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl mb-6">
        <h1 className="text-xl font-bold text-white">Comunidad Académica</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Gestiona tus contactos, solicitudes de amistad y descubre nuevos compañeros de la facultad.
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-b border-zinc-800 pb-1">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Descubrir Usuarios
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <span>Solicitudes</span>
            {requests.received?.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {requests.received.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            Amigos Confirmados ({friends.length})
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs rounded-xl text-center">
          {actionMessage}
        </div>
      )}

      {/* Tab 1: Descubrir Usuarios */}
      {activeTab === 'discover' && (
        <div>
          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <MagnifyingGlassIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o usuario..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {loading ? (
            <p className="text-xs text-zinc-500 text-center py-8">Cargando usuarios...</p>
          ) : discoverUsers.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              <p className="text-xs text-zinc-400">No se encontraron usuarios para agregar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {discoverUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=4f46e5&color=fff`}
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || 'User')}&background=4f46e5&color=fff`; }}
                      alt={u.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                    />
                    <div>
                      <h4 className="font-semibold text-zinc-200 text-xs sm:text-sm">{u.fullName}</h4>
                      <p className="text-[11px] text-zinc-400">@{u.username}</p>
                    </div>
                  </div>

                  {u.requestStatus === 'sent' ? (
                    <span className="text-xs text-amber-400 font-medium px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      Enviada
                    </span>
                  ) : u.requestStatus === 'received' ? (
                    <button
                      onClick={() => setActiveTab('requests')}
                      className="text-xs text-indigo-400 font-semibold px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer"
                    >
                      Responder
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(u.id)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <UserPlusIcon className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Solicitudes de Amistad */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Solicitudes Recibidas</h3>
            {requests.received?.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No tienes solicitudes pendientes por responder.</p>
            ) : (
              <div className="space-y-3">
                {requests.received.map((req) => (
                  <div
                    key={req.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.fromUser?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.fromUser?.fullName || 'User')}&background=4f46e5&color=fff`}
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.fromUser?.fullName || 'User')}&background=4f46e5&color=fff`; }}
                        alt={req.fromUser?.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-zinc-700"
                      />
                      <div>
                        <h4 className="font-semibold text-zinc-200 text-xs sm:text-sm">
                          {req.fromUser?.fullName}
                        </h4>
                        <p className="text-[11px] text-zinc-400">@{req.fromUser?.username}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondRequest(req.id, 'accept')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Aceptar</span>
                      </button>
                      <button
                        onClick={() => handleRespondRequest(req.id, 'reject')}
                        className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Solicitudes Enviadas</h3>
            {requests.sent?.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No has enviado solicitudes pendientes.</p>
            ) : (
              <div className="space-y-3">
                {requests.sent.map((req) => (
                  <div
                    key={req.id}
                    className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.toUser?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.toUser?.fullName || 'User')}&background=4f46e5&color=fff`}
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.toUser?.fullName || 'User')}&background=4f46e5&color=fff`; }}
                        alt={req.toUser?.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                      />
                      <div>
                        <h4 className="font-semibold text-zinc-200 text-xs sm:text-sm">{req.toUser?.fullName}</h4>
                        <p className="text-[11px] text-zinc-400">@{req.toUser?.username}</p>
                      </div>
                    </div>
                    <span className="text-xs text-amber-400 font-medium">Pendiente</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Mis Amigos */}
      {activeTab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800">
              <p className="text-xs text-zinc-400">Aún no tienes amigos agregados.</p>
              <button
                onClick={() => setActiveTab('discover')}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Buscar Compañeros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={f.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.fullName || 'User')}&background=4f46e5&color=fff`}
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(f.fullName || 'User')}&background=4f46e5&color=fff`; }}
                      alt={f.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                    />
                    <div>
                      <h4 className="font-semibold text-zinc-200 text-xs sm:text-sm">{f.fullName}</h4>
                      <p className="text-[11px] text-zinc-400">@{f.username}</p>
                    </div>
                  </div>

                  <Link
                    to={`/chat?friendId=${f.id}`}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span>Chat</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
