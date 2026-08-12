import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Notification, NotificationType } from '../types';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  let nextId = 1;

  function addNotification(type: NotificationType, title: string, message: string) {
    notifications.value.unshift({
      id: nextId++,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    });
  }

  function markAsRead(id: number) {
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(n => n.read = true);
  }

  function clearNotifications() {
    notifications.value = [];
  }

  function clearReadNotifications() {
    notifications.value = notifications.value.filter(n => !n.read);
  }

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    clearReadNotifications,
  };
});
