import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';

export const useSystemStore = defineStore('system', () => {
  const stats = ref<any>(null);
  const logs = ref<string>('');
  const realityDetails = ref<{ publicKey: string; shortId: string } | null>(null);
  const loading = ref<boolean>(false);

  async function fetchStats() {
    try {
      const res = await api.get('/stats/overview');
      stats.value = res.data;
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  async function fetchLogs(lines: number = 100) {
    loading.value = true;
    try {
      const res = await api.get(`/system/logs?lines=${lines}`);
      logs.value = res.data.logs;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRealityInfo() {
    try {
      const res = await api.get('/system/reality-info');
      realityDetails.value = res.data;
    } catch (err) {
      console.error('Failed to fetch reality info:', err);
    }
  }

  async function reloadSingBox() {
    const res = await api.post('/system/reload-singbox');
    return res.data;
  }

  async function triggerUpdate() {
    const res = await api.post('/system/update');
    return res.data;
  }

  async function triggerRollback() {
    const res = await api.post('/system/rollback');
    return res.data;
  }

  return { stats, logs, realityDetails, loading, fetchStats, fetchLogs, fetchRealityInfo, reloadSingBox, triggerUpdate, triggerRollback };
});
