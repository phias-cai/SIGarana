// src/components/layout/NotificationBell.jsx
import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationBell({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Manejar click en notificación
  const handleNotificationClick = async (notification) => {
    // Marcar como leída
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navegar al módulo de gestión documental
    if (onNavigate) {
      onNavigate('gestionDocumental');
    }

    // Cerrar dropdown
    setIsOpen(false);
  };

  // Manejar "marcar todas como leídas"
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  // Manejar eliminar notificación
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation(); // Evitar que se dispare el click de la notificación
    await deleteNotification(notificationId);
  };

  // Formatear fecha relativa
  const getTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true,
        locale: es 
      });
    } catch {
      return 'Hace un momento';
    }
  };

  // Obtener icono según tipo de notificación
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'approval_request':
      case 'document_pending':
        return '📋';
      case 'new_document':
        return '📄';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="h-6 w-6" style={{ color: '#2e5244' }} />
        
        {/* Badge con contador */}
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white rounded-full"
            style={{ backgroundColor: '#d97706' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border-2 z-50"
          style={{ borderColor: '#6dbd96' }}
        >
          {/* Header del dropdown */}
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: '#dedecc' }}
          >
            <h3 className="font-semibold text-lg" style={{ color: '#2e5244' }}>
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({unreadCount} sin leer)
                </span>
              )}
            </h3>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1 text-xs rounded hover:bg-gray-100 transition-colors"
                style={{ color: '#6dbd96' }}
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              // Loading state
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#6dbd96' }} />
              </div>
            ) : notifications.length === 0 ? (
              // Empty state
              <div className="text-center p-8">
                <Bell className="h-12 w-12 mx-auto mb-3" style={{ color: '#dedecc' }} />
                <p className="text-gray-600">No tienes notificaciones</p>
              </div>
            ) : (
              // Notificaciones
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="flex items-start gap-3 p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors relative group"
                  style={{ 
                    borderColor: '#dedecc',
                    backgroundColor: notification.is_read ? 'transparent' : '#f0f4e8'
                  }}
                >
                  {/* Icono */}
                  <div className="text-2xl flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 
                        className="font-medium text-sm line-clamp-1"
                        style={{ color: '#2e5244' }}
                      >
                        {notification.title}
                      </h4>
                      
                      {!notification.is_read && (
                        <span 
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: '#d97706' }}
                          title="No leída"
                        />
                      )}
                    </div>
                    
                    {notification.message && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    )}

                    {/* Info del documento si existe */}
                    {notification.document && (
                      <div className="flex items-center gap-2 mt-2">
                        <span 
                          className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: '#dedecc',
                            color: '#2e5244'
                          }}
                        >
                          {notification.document.code}
                        </span>
                        <span className="text-xs text-gray-500 line-clamp-1">
                          {notification.document.name}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      {getTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  {/* Botón eliminar (visible en hover) */}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-200 transition-all"
                    title="Eliminar notificación"
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div 
              className="p-3 border-t text-center"
              style={{ borderColor: '#dedecc' }}
            >
              <button
                onClick={() => {
                  refresh();
                  setIsOpen(false);
                }}
                className="text-sm hover:underline"
                style={{ color: '#6dbd96' }}
              >
                Actualizar notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}