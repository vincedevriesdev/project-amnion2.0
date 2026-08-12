import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';
import type { VpnUser, CreateUserPayload, UpdateUserPayload } from '../types';

export const useUserStore = defineStore('users', () => {
  const users = ref<VpnUser[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchUsers() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/users');
      users.value = res.data.users;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch users';
      console.error('Failed to fetch users:', err);
    } finally {
      loading.value = false;
    }
  }

  async function createUser(payload: CreateUserPayload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/users', payload);
      await fetchUsers();
      return res.data.user as VpnUser;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create user';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateUser(id: string, payload: UpdateUserPayload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.put(`/users/${id}`, payload);
      await fetchUsers();
      return res.data.user as VpnUser;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update user';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function resetToken(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post(`/users/${id}/reset-token`);
      await fetchUsers();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to reset token';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteUser(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/users/${id}`);
      await fetchUsers();
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete user';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function exportUsers() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/users/export');
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to export users';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function importUsers(usersList: any[]) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/users/import', { users: usersList });
      await fetchUsers();
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to import users';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function bulkUpdateUsers(ids: string[], payload: UpdateUserPayload) {
    loading.value = true;
    error.value = null;
    try {
      await Promise.all(
        ids.map(id => api.put(`/users/${id}`, payload))
      );
      await fetchUsers();
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to bulk update users';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function bulkDeleteUsers(ids: string[]) {
    loading.value = true;
    error.value = null;
    try {
      await Promise.all(
        ids.map(id => api.delete(`/users/${id}`))
      );
      await fetchUsers();
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to bulk delete users';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    resetToken,
    deleteUser,
    exportUsers,
    importUsers,
    bulkUpdateUsers,
    bulkDeleteUsers,
  };
});
