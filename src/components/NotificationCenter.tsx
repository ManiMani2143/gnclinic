import React from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle, X, RefreshCw } from 'lucide-react';
import { Notification } from '../types';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onRefresh: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onRefresh,
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getSeverityColor = (severity: string, isRead: boolean) => {
    const baseColors = {
      high: isRead ? 'border-red-200 bg-red-50' : 'border-red-400 bg-red-100',
      medium: isRead ? 'border-orange-200 bg-orange-50' : 'border-orange-400 bg-orange-100',
      low: isRead ? 'border-blue-200 bg-blue-50' : 'border-blue-400 bg-blue-100',
    };
    return baseColors[severity as keyof typeof baseColors] || baseColors.low;
  };

  const getSeverityIcon = (type: string, severity: string) => {
    if (type === 'expiry') {
      return severity === 'high' ? AlertTriangle : Clock;
    }
    return AlertTriangle;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center space-x-2 px-4 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => {
          const SeverityIcon = getSeverityIcon(notification.type, notification.severity);
          
          return (
            <div
              key={notification.id}
              className={`border-l-4 rounded-lg p-4 ${getSeverityColor(notification.severity, notification.isRead)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <SeverityIcon className={`h-5 w-5 mt-0.5 ${
                    notification.severity === 'high' ? 'text-red-600' :
                    notification.severity === 'medium' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-sm font-medium ${
                        notification.isRead ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      notification.isRead ? 'text-gray-600' : 'text-gray-800'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.isRead && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            You're all caught up! Notifications about stock levels and expiry dates will appear here.
          </p>
        </div>
      )}
    </div>
  );
};