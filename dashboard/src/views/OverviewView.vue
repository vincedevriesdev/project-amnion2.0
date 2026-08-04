<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Server Overzicht</h1>
        <p class="page-subtitle">Real-time status en netwerk monitoring van je Amnion node</p>
      </div>

      <button @click="handleReloadSingbox" :disabled="reloading" class="btn btn-primary">
        <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        {{ reloading ? 'Herladen...' : 'Herlaad Sing-box Config' }}
      </button>
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
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 8px;">{{ formatBytes(systemStore.stats.memory.usedBytes) }}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="background: var(--accent-cyan);" :style="{ width: systemStore.stats.memory.usagePercentage + '%' }"></div>
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

      <!-- System Uptime -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">System Uptime</span>
          <span class="font-mono text-purple" style="font-weight: 700;">Ubuntu</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px;">{{ formatUptime(systemStore.stats.system.uptimeSeconds) }}</div>
        <div style="font-size: 12px; color: var(--text-muted);">Kernel: {{ systemStore.stats.system.release }}</div>
      </div>
    </div>

    <!-- Protocol Distribution -->
    <div class="glass-card" v-if="systemStore.stats">
      <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 20px;">Protocol Verdeling</h3>
      <div class="grid-3">
        <div style="background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 16px; border: 1px solid var(--border-glass);" class="flex-between">
          <div>
            <span class="badge badge-cyan" style="margin-bottom: 8px;">Hysteria 2</span>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">UDP Port 8443 (QUIC / BBR)</div>
          </div>
          <div class="font-mono" style="font-size: 26px; font-weight: 800; color: #fff;">{{ systemStore.stats.protocolDistribution.hysteria2 || 0 }}</div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 16px; border: 1px solid var(--border-glass);" class="flex-between">
          <div>
            <span class="badge badge-purple" style="margin-bottom: 8px;">TUIC v5</span>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">UDP Port 8444 (0-RTT)</div>
          </div>
          <div class="font-mono" style="font-size: 26px; font-weight: 800; color: #fff;">{{ systemStore.stats.protocolDistribution.tuic || 0 }}</div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 16px; border: 1px solid var(--border-glass);" class="flex-between">
          <div>
            <span class="badge badge-amber" style="margin-bottom: 8px;">VLESS + REALITY</span>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">TCP Port 443 (TLS Mimicry)</div>
          </div>
          <div class="font-mono" style="font-size: 26px; font-weight: 800; color: #fff;">{{ systemStore.stats.protocolDistribution.vless_reality || 0 }}</div>
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
  }, 5000);
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
