import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((title, message, type = 'success') => {
    const id = Date.now();
    const newNotif = { id, title, message, type, read: false, time: new Date() };
    
    setNotifications(prev => [newNotif, ...prev]);

    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, showToast: false } : n)
      );
    }, 4000);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeToast = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, showToast: false } : n)
    );
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllAsRead }}>
      {children}
      {/* Contenedor de Toasts (Estilo Tailwind UI del screenshot) */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        {notifications.filter(n => n.showToast !== false).map(notif => (
          <div key={notif.id} className="pointer-events-auto w-80 sm:w-96 overflow-hidden rounded-lg bg-[#1e293b] shadow-lg ring-1 ring-white/10 animate-fade-in-down border border-gray-700">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-white">{notif.title}</p>
                  {notif.message && <p className="mt-1 text-sm text-gray-400">{notif.message}</p>}
                </div>
                <div className="ml-4 flex flex-shrink-0">
                  <button
                    type="button"
                    className="inline-flex rounded-md bg-[#1e293b] text-gray-400 hover:text-white focus:outline-none"
                    onClick={() => removeToast(notif.id)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
