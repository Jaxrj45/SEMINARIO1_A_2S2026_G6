import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AcademicCapIcon,
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const navItems = [
    { label: 'Feed', path: '/', icon: HomeIcon },
    { label: 'Amigos', path: '/friends', icon: UserGroupIcon },
    { label: 'Chat', path: '/chat', icon: ChatBubbleLeftRightIcon },
    { label: 'Mi Perfil', path: '/profile', icon: UserCircleIcon }
  ];

  return (
    <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            <AcademicCapIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-zinc-100 tracking-tight">Semi-Social</span>
            <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Facultad de Ingeniería</span>
          </div>
        </Link>

        {/* Links de Navegación */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Perfil & Logout */}
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition"
          >
            <img
              src={user?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.fullName || 'Usuario'}
              className="w-7 h-7 rounded-full object-cover border border-zinc-700"
            />
            <span className="hidden sm:inline text-xs font-medium text-zinc-200">
              {user?.fullName?.split(' ')[0] || user?.username}
            </span>
          </Link>

          <button
            onClick={logout}
            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
            title="Cerrar sesión"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
