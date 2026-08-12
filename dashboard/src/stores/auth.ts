import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { AdminUser, LoginCredentials, ChangePasswordPayload } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const admin = ref<AdminUser | null>(null);
  const isAuthenticated = ref<boolean>(false);
  const loading = ref<boolean>(true);
  const checked = ref<boolean>(false);

  async function checkAuth() {
    loading.value = true;
    try {
      const res = await api.get('/auth/me');
      admin.value = res.data.admin as AdminUser;
      isAuthenticated.value = true;
    } catch {
      admin.value = null;
      isAuthenticated.value = false;
    } finally {
      loading.value = false;
      checked.value = true;
    }
  }

  async function login(username: string, password: string) {
    const res = await api.post('/auth/login', { username, password });
    admin.value = res.data.admin as AdminUser;
    isAuthenticated.value = true;
    checked.value = true;
    return res.data;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      admin.value = null;
      isAuthenticated.value = false;
      checked.value = false;
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    const res = await api.post('/auth/change-password', { oldPassword, newPassword });
    return res.data;
  }

  return { admin, isAuthenticated, loading, checked, checkAuth, login, logout, changePassword };
});
