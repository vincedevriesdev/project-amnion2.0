import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';

export interface UserProtocol {
  protocol_type: string;
  is_enabled: number;
}

export interface VpnUser {
  id: string;
  username: string;
  uuid: string;
  status: string;
  data_limit_bytes: number;
  used_bytes: number;
  expire_at: string | null;
  created_at: string;
  protocols: UserProtocol[];
  subscriptionToken: string;
}

export const useUserStore = defineStore('users', () => {
  const users = ref<VpnUser[]>([]);
  const loading = ref<boolean>(false);

  async function fetchUsers() {
    loading.value = true;
    try {
      const res = await api.get('/users');
      users.value = res.data.users;
    } finally {
      loading.value = false;
    }
  }

  async function createUser(payload: { username: string; dataLimitBytes?: number; expireAt?: string | null; protocols?: string[] }) {
    const res = await api.post('/users', payload);
    await fetchUsers();
    return res.data.user;
  }

  async function updateUser(id: string, payload: any) {
    const res = await api.put(`/users/${id}`, payload);
    await fetchUsers();
    return res.data.user;
  }

  async function resetToken(id: string) {
    const res = await api.post(`/users/${id}/reset-token`);
    await fetchUsers();
    return res.data;
  }

  async function deleteUser(id: string) {
    await api.delete(`/users/${id}`);
    await fetchUsers();
  }

  return { users, loading, fetchUsers, createUser, updateUser, resetToken, deleteUser };
});
