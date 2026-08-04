import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';

export const useAuthStore = defineStore('auth', () => {
  const admin = ref<{ id: string; username: string; role: string } | null>(null);
  const isAuthenticated = ref<boolean>(false);
  const loading = ref<boolean>(true);

  async function checkAuth() {
    loading.value = true;
    try {
      const res = await api.get('/auth/me');
      admin.value = res.data.admin;
      isAuthenticated.value = true;
    } catch {
      admin.value = null;
      isAuthenticated.value = false;
    } finally {
      loading.value = false;
    }
  }

  async function login(username: string, password: string) {
    const res = await api.post('/auth/login', { username, password });
    admin.value = res.data.admin;
    isAuthenticated.value = true;
    return res.data;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      admin.value = null;
      isAuthenticated.value = false;
    }
  }

  return { admin, isAuthenticated, loading, checkAuth, login, logout };
});
