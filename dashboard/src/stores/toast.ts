import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Toast, ToastType } from '../types';

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);
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
});
