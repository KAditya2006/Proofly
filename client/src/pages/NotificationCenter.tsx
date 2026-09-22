import React, { useEffect, useState } from 'react';
import { getMyNotifications, markAsRead, markAllAsRead } from '../services/notificationService';
import { Bell, Check, Info, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-serif font-bold text-brand-navy flex items-center">
          <Bell className="w-6 h-6 mr-2 text-gray-400" />
          Notifications
        </h1>
        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-brand-navy hover:text-brand-navy font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">You have no notifications.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notif) => (
              <li 
                key={notif._id} 
                className={`p-4 transition-colors ${notif.read ? 'bg-white' : 'bg-brand-blush'}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {notif.type === 'ALERT' ? (
                      <AlertTriangle className={`w-5 h-5 ${notif.read ? 'text-gray-400' : 'text-red-500'}`} />
                    ) : (
                      <Info className={`w-5 h-5 ${notif.read ? 'text-gray-400' : 'text-brand-coral'}`} />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${notif.read ? 'text-gray-900' : 'text-brand-navy'}`}>
                      {notif.title}
                    </p>
                    <p className={`text-sm mt-1 ${notif.read ? 'text-gray-500' : 'text-brand-charcoal'}`}>
                      {notif.message}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="text-xs text-gray-400">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                      {notif.link && (
                        <Link to={notif.link} className="text-xs text-brand-navy hover:underline">
                          View details
                        </Link>
                      )}
                    </div>
                  </div>
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="ml-4 text-gray-400 hover:text-green-500 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
