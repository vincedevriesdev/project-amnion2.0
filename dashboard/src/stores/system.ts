import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api/client';

export interface UpdateProgress {
  active: boolean;
  step: number;
  progressPercent: number;
  message: string;
  error: string | null;
  startTime: string | null;
  completedAt: string | null;
}

export const useSystemStore = defineStore('system', () => {
  const stats = ref<any>({
    version: 'v2.0.43',
    serverStatus: 'online',
    services: { singBox: 'active', backend: 'active' },
    memory: { totalBytes: 0, usedBytes: 0, freeBytes: 0, usagePercentage: 0 },
    disk: { totalBytes: 0, usedBytes: 0, freeBytes: 0, usagePercentage: 0 },
    cpu: { cores: 1, model: 'Generic CPU', loadAvg1m: 0.05 },
    network: { rxSpeedBytesPerSec: 0, txSpeedBytesPerSec: 0 },
    system: { uptimeSeconds: 0, release: 'Linux' },
    users: { active: 0, total: 0 },
    topUsers: [],
    protocolDistribution: { hysteria2: 0, tuic: 0, vless_reality: 0 },
    mostUsedProtocol: 'Geen',
    alerts: []
  });

  const logs = ref<string>('');
  const realityDetails = ref<{ publicKey: string; shortId: string } | null>(null);
  const updateProgress = ref<UpdateProgress>({
    active: false,
    step: 0,
    progressPercent: 0,
    message: '',
    error: null,
    startTime: null,
    completedAt: null
  });

  const loading = ref<boolean>(false);

  async function fetchStats() {
    try {
      const res = await api.get('/stats/overview');
      if (res.data) {
        stats.value = res.data;
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  async function fetchLogs(lines: number = 100) {
    loading.value = true;
    try {
      const res = await api.get(`/system/logs?lines=${lines}`);
      logs.value = res.data.logs || 'Geen logboeken beschikbaar.';
    } catch (err: any) {
      logs.value = `Fout bij het ophalen van logboeken: ${err.response?.data?.error || err.message}`;
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

  async function checkUpdates() {
    const res = await api.get('/system/check-updates');
    return res.data;
  }

  async function fetchUpdateStatus() {
    try {
      const res = await api.get('/system/update-status');
      updateProgress.value = res.data;
      return res.data;
    } catch (err) {
      console.error('Failed to fetch update status:', err);
      return null;
    }
  }

  async function reloadSingBox() {
    const res = await api.post('/system/reload-singbox');
    return res.data;
  }

  async function triggerUpdate() {
    const res = await api.post('/system/update');
    await fetchUpdateStatus();
    return res.data;
  }

  async function triggerRollback() {
    const res = await api.post('/system/rollback');
    return res.data;
  }

  return {
    stats,
    logs,
    realityDetails,
    updateProgress,
    loading,
    fetchStats,
    fetchLogs,
    fetchRealityInfo,
    checkUpdates,
    fetchUpdateStatus,
    reloadSingBox,
    triggerUpdate,
    triggerRollback
  };
});
