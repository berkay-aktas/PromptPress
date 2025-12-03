"use client";

import { useEffect, useState } from "react";

export type NotificationType = "success" | "error" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  technicalDetails?: string;
  duration?: number;
}

interface NotificationProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export function NotificationToast({ notification, onDismiss }: NotificationProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (notification.duration !== 0) {
      const timer = setTimeout(
        () => onDismiss(notification.id),
        notification.duration || 5000
      );
      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.duration, onDismiss]);

  const typeStyles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const iconStyles = {
    success: "text-green-600",
    error: "text-red-600",
    info: "text-blue-600",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <div
      className={`${typeStyles[notification.type]} border rounded-lg shadow-lg p-4 mb-3 max-w-md animate-in slide-in-from-top-5 fade-in`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className={`${iconStyles[notification.type]} text-lg font-bold flex-shrink-0 mt-0.5`}>
          {icons[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug">{notification.message}</p>
          {notification.technicalDetails && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current rounded"
                aria-expanded={showDetails}
              >
                {showDetails ? "Hide" : "Show"} technical details
              </button>
              {showDetails && (
                <pre className="mt-2 text-xs bg-white/50 p-2 rounded border overflow-x-auto">
                  {notification.technicalDetails}
                </pre>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="flex-shrink-0 text-current opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current rounded p-1"
          aria-label="Dismiss notification"
        >
          <span className="sr-only">Close</span>
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({
  notifications,
  onDismiss,
}: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    type: NotificationType,
    message: string,
    technicalDetails?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [
      ...prev,
      { id, type, message, technicalDetails, duration },
    ]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const showSuccess = (message: string, duration?: number) => {
    return addNotification("success", message, undefined, duration);
  };

  const showError = (message: string, technicalDetails?: string, duration?: number) => {
    return addNotification("error", message, technicalDetails, duration);
  };

  const showInfo = (message: string, duration?: number) => {
    return addNotification("info", message, undefined, duration);
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    showSuccess,
    showError,
    showInfo,
  };
}

