import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

const navigation = [
  { name: 'Cartelera', href: '/gallery' },
  { name: 'Mi Lista', href: '/playlist' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function AuthNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markAllAsRead } = useNotification();
  const unreadCount = notifications.filter(n => !n.read).length;

  const [user, setUser] = useState({
    nombre_completo: 'Usuario',
    foto_perfil: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  });

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    };

    loadUser();
    window.addEventListener('userUpdated', loadUser);
    
    return () => window.removeEventListener('userUpdated', loadUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Disclosure
      as="nav"
      className="relative bg-cinema-panel/80 backdrop-blur-md border-b border-gray-700 shadow-lg sticky top-0 z-50"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          
          {/* Mobile menu button*/}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-red-600">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Abrir menú principal</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>
          
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            {/* Logo */}
            <div className="flex shrink-0 items-center">
              <Link to="/gallery" className="text-cinema-primary font-bold text-2xl tracking-wider drop-shadow-md">
                CLOUDCINEMA
              </Link>
            </div>
            
            {/* Links principales Desktop */}
            <div className="hidden sm:ml-8 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => {
                  const isCurrent = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={classNames(
                        isCurrent ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">

            {/* Notifications dropdown */}
            <Menu as="div" className="relative ml-4">
              <MenuButton 
                onClick={markAllAsRead}
                className="relative rounded-full p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-cinema-primary focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Ver notificaciones</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-cinema-primary ring-2 ring-gray-900" />
                )}
              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-[#1e293b] py-2 shadow-xl ring-1 ring-white/10 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in"
              >
                <div className="px-4 py-2 border-b border-gray-700">
                  <h3 className="text-sm font-bold text-white">Notificaciones</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      No tienes notificaciones
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <MenuItem key={notif.id}>
                        {({ active }) => (
                          <div className={classNames(active ? 'bg-gray-800' : '', 'px-4 py-3 border-b border-gray-700/50 flex flex-col')}>
                            <span className="text-sm font-medium text-white">{notif.title}</span>
                            {notif.message && <span className="text-xs text-gray-400 mt-1">{notif.message}</span>}
                            <span className="text-[10px] text-gray-500 mt-2">{notif.time.toLocaleTimeString()}</span>
                          </div>
                        )}
                      </MenuItem>
                    ))
                  )}
                </div>
              </MenuItems>
            </Menu>

            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-4">
              <MenuButton className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Abrir menú de usuario</span>
                <img
                  alt={user.nombre_completo}
                  src={user.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}
                  className="size-8 rounded-full bg-gray-800 object-cover outline -outline-offset-1 outline-gray-600"
                />
              </MenuButton>

              <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 shadow-xl ring-1 ring-black ring-opacity-5 transition data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[enter]:ease-out data-[leave]:duration-75 data-[leave]:ease-in"
              >
                <MenuItem>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 data-[focus]:bg-gray-700 data-[focus]:text-white"
                  >
                    Mi Perfil
                  </Link>
                </MenuItem>
                <MenuItem>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 data-[focus]:bg-gray-700 data-[focus]:text-white"
                  >
                    Cerrar Sesión
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>

      {/* Menú Móvil */}
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pt-2 pb-3 border-t border-gray-700 mt-2">
          {navigation.map((item) => {
            const isCurrent = location.pathname === item.href;
            return (
              <DisclosureButton
                key={item.name}
                as={Link}
                to={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={classNames(
                  isCurrent ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                  'block rounded-md px-3 py-2 text-base font-medium',
                )}
              >
                {item.name}
              </DisclosureButton>
            );
          })}
        </div>
      </DisclosurePanel>
    </Disclosure>
  )
}
