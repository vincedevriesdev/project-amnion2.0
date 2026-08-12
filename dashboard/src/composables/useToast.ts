// Project Amnion 2.0 - Toast Composables

import { ref, onMounted, onUnmounted } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

export function useToast() {
  const toasts = ref<ToastMessage[]>([]);
  let toastId = 0;

  function addToast(message: string, type: ToastType = 'info', duration = 5000) {
    const id = ++toastId;
    toasts.value.push({ id, type, message });
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
    
    return id;
  }

  function removeToast(id: number) {
    toasts.value = toasts.value.filter(toast => toast.id !== id);
  }

  function clearToasts() {
    toasts.value = [];
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
  };
}
