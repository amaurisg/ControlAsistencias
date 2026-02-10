import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { db } from '../db/database';
import { startAlertMonitoring, type NotificationInput } from '../utils/alertSystem';
import type { AppNotification, NotificationMetadata, NotificationType } from '../types';

type NotificationContextValue = {
  notifications: AppNotification[];
  addNotification: (type: NotificationType, message: string, metadata?: NotificationMetadata, title?: string) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getUnreadCount: () => number;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const DEFAULT_TITLE: Record<NotificationType, string> = {
  asistencia: 'Alerta de asistencia',
  docente: 'Alerta de docentes',
  excusa: 'Alerta de excusas',
  sistema: 'Notificación del sistema'
};

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    const rows = await db.notificaciones.orderBy('timestamp').reverse().toArray();
    setNotifications(rows);
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const addNotification = useCallback(
    async (type: NotificationType, message: string, metadata?: NotificationMetadata, title?: string) => {
      const now = Date.now();
      const metadataKey = metadata?.key;

      if (metadataKey) {
        const recentDuplicate = await db.notificaciones
          .where('timestamp')
          .above(now - 30 * 60 * 1000)
          .filter((item) => item.metadata?.key === metadataKey)
          .first();
        if (recentDuplicate) {
          return;
        }
      }

      const payload: AppNotification = {
        type,
        title: title ?? DEFAULT_TITLE[type],
        message,
        metadata,
        read: false,
        timestamp: now
      };

      const id = await db.notificaciones.add(payload);
      setNotifications((prev) => [{ ...payload, id }, ...prev]);
    },
    []
  );

  const markAsRead = useCallback(async (id: number) => {
    await db.notificaciones.update(id, { read: true });
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((item) => !item.read).map((item) => item.id).filter(Boolean) as number[];
    await Promise.all(unreadIds.map((id) => db.notificaciones.update(id, { read: true })));
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, [notifications]);

  const getUnreadCount = useCallback(() => notifications.filter((item) => !item.read).length, [notifications]);

  useEffect(() => {
    const callback = async (notification: NotificationInput) => {
      await addNotification(notification.type, notification.message, notification.metadata, notification.title);
    };

    const stop = startAlertMonitoring(callback);
    return () => {
      stop();
    };
  }, [addNotification]);

  const value = useMemo(
    () => ({
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      getUnreadCount
    }),
    [notifications, addNotification, markAsRead, markAllAsRead, getUnreadCount]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
