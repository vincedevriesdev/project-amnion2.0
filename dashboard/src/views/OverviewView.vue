<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Server Overzicht</h1>
        <p class="page-subtitle">Real-time status, netwerkmonitoring en service gezondheid van je Amnion node</p>
      </div>

      <div style="display: flex; gap: 12px; align-items: center;">
        <span class="badge badge-emerald" style="font-size: 13px; padding: 8px 16px;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #34d399; display: inline-block;"></span>
          Server {{ systemStore.stats?.serverStatus || 'Online' }}
        </span>

        <button @click="handleReloadSingbox" :disabled="reloading" class="btn btn-primary">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          {{ reloading ? 'Herladen...' : 'Herlaad Sing-box Config' }}
        </button>
      </div>
    </div>

    <!-- Warning Alerts Banner -->
    <div v-if="systemStore.stats?.alerts && systemStore.stats.alerts.length > 0" style="margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px;">
      <div v-for="(alert, idx) in systemStore.stats.alerts" :key="idx" style="padding: 16px 20px; border-radius: 14px; font-size: 14px; font-weight: 600;" :style="alert.level === 'danger' ? 'background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5;' : 'background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fcd34d;'">
        {{ alert.message }}
      </div>
    </div>

    <!-- Alert Toast -->
    <div v-if="toastMessage" style="margin-bottom: 24px; padding: 16px; border-radius: 14px; font-size: 14px; font-weight: 500;" :style="toastSuccess ? 'background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399;' : 'background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5;'">
      {{ toastMessage }}
    </div>

    <!-- Metric Cards Grid -->
    <div class="grid-4" style="margin-bottom: 32px;" v-if="systemStore.stats">
      <!-- CPU Usage -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">CPU Belasting</span>
          <span class="font-mono text-emerald" style="font-weight: 700;">{{ systemStore.stats.cpu.loadAvg1m }} Load</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px;">{{ systemStore.stats.cpu.cores }} Cores</div>
        <div style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          {{ systemStore.stats.cpu.model }}
        </div>
      </div>

      <!-- RAM Usage -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">RAM Gebruik</span>
          <span class="font-mono text-cyan" style="font-weight: 700;">{{ systemStore.stats.memory.usagePercentage }}%</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px;">{{ formatBytes(systemStore.stats.memory.usedBytes) }} / {{ formatBytes(systemStore.stats.memory.totalBytes) }}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="background: var(--accent-cyan);" :style="{ width: systemStore.stats.memory.usagePercentage + '%' }"></div>
        </div>
      </div>

      <!-- Disk Usage (10 GB VPS Cap) -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">Schijfgebruik (SSD)</span>
          <span class="font-mono text-purple" style="font-weight: 700;">{{ systemStore.stats.disk.usagePercentage }}%</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px;">{{ formatBytes(systemStore.stats.disk.usedBytes) }} / {{ formatBytes(systemStore.stats.disk.totalBytes) }}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="background: var(--accent-purple);" :style="{ width: systemStore.stats.disk.usagePercentage + '%' }"></div>
        </div>
      </div>

      <!-- Active Users -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">VPN Gebruikers</span>
          <span class="badge badge-emerald">Online</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px;">{{ systemStore.stats.users.active }} / {{ systemStore.stats.users.total }}</div>
        <div style="font-size: 12px; color: var(--text-muted);">Actief toegewezen</div>
      </div>
    </div>

    <!-- Service Health & Protocol Distribution -->
    <div class="grid-2" style="margin-bottom: 32px;" v-if="systemStore.stats">
      <!-- Service Health -->
      <div class="glass-card">
        <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 16px;">🚦 Service Gezondheid & Daemons</h3>
        
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 14px; border: 1px solid var(--border-glass);" class="flex-between">
            <div>
              <div style="font-weight: 700; color: #fff;">sing-box.service (VPN Engine)</div>
              <div style="font-size: 12px; color: var(--text-muted);">Multi-protocol kernel routing daemon</div>
            </div>
            <span class="badge" :class="systemStore.stats.services.singBox === 'active' ? 'badge-emerald' : 'badge-red'">
              {{ systemStore.stats.services.singBox }}
            </span>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 14px; border: 1px solid var(--border-glass);" class="flex-between">
            <div>
              <div style="font-weight: 700; color: #fff;">amnion-backend.service (Control Daemon)</div>
              <div style="font-size: 12px; color: var(--text-muted);">Fastify TypeScript REST & Session API</div>
            </div>
            <span class="badge badge-emerald">active</span>
          </div>
        </div>
      </div>

      <!-- Quick System Info -->
      <div class="glass-card flex-col justify-between">
        <div>
          <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 16px;">⚡ Systeem Informatie</h3>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
            <div class="flex-between">
              <span class="text-muted">Amnion Versie:</span>
              <span class="font-mono text-emerald" style="font-weight: 700;">{{ systemStore.stats.version }}</span>
            </div>
            <div class="flex-between">
              <span class="text-muted">System Uptime:</span>
              <span class="font-mono" style="color: #fff;">{{ formatUptime(systemStore.stats.system.uptimeSeconds) }}</span>
            </div>
            <div class="flex-between">
              <span class="text-muted">Linux Kernel:</span>
              <span class="font-mono" style="color: #fff;">{{ systemStore.stats.system.release }}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px;">
          <router-link to="/analytics" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center;">Bekijk Analyses</router-link>
          <router-link to="/settings" class="btn btn-secondary btn-sm" style="flex: 1; text-align: center;">Instellingen & Updates</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSystemStore } from '../stores/system';

const systemStore = useSystemStore();
const reloading = ref(false);
const toastMessage = ref('');
const toastSuccess = ref(true);

let timer: any = null;

onMounted(() => {
  systemStore.fetchStats();
  timer = setInterval(() => {
    systemStore.fetchStats();
  }, 4000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

async function handleReloadSingbox() {
  reloading.value = true;
  toastMessage.value = '';
  try {
    const res = await systemStore.reloadSingBox();
    toastSuccess.value = true;
    toastMessage.value = res.message;
  } catch (err: any) {
    toastSuccess.value = false;
    toastMessage.value = err.response?.data?.error || 'Herladen van Sing-box mislukt.';
  } finally {
    reloading.value = false;
    setTimeout(() => (toastMessage.value = ''), 4000);
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}u ${mins}m`;
}
</script>
