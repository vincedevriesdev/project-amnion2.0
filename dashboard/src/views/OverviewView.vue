<template>
  <div class="max-w-7xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-extrabold text-white">Server Overzicht</h1>
        <p class="text-sm text-slate-400">Real-time status en netwerk monitoring van je Amnion node</p>
      </div>

      <button @click="handleReloadSingbox" :disabled="reloading" class="btn-primary text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        {{ reloading ? 'Herladen...' : 'Herlaad Sing-box Config' }}
      </button>
    </div>

    <!-- Alert Toast -->
    <div v-if="toastMessage" class="mb-6 p-4 rounded-xl text-sm font-medium border" :class="toastSuccess ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border-red-500/30 text-red-400'">
      {{ toastMessage }}
    </div>

    <!-- Metric Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" v-if="systemStore.stats">
      <!-- CPU Usage -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">CPU Belasting</span>
          <span class="text-emerald-400 font-mono text-sm font-bold">{{ systemStore.stats.cpu.loadAvg1m }} Load</span>
        </div>
        <div class="text-2xl font-bold text-white mb-2">{{ systemStore.stats.cpu.cores }} Cores</div>
        <div class="text-xs text-slate-400 truncate">{{ systemStore.stats.cpu.model }}</div>
      </div>

      <!-- RAM Usage -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">RAM Gebruik</span>
          <span class="text-cyan-400 font-mono text-sm font-bold">{{ systemStore.stats.memory.usagePercentage }}%</span>
        </div>
        <div class="text-2xl font-bold text-white mb-2">{{ formatBytes(systemStore.stats.memory.usedBytes) }}</div>
        <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div class="bg-cyan-400 h-full rounded-full transition-all duration-500" :style="{ width: systemStore.stats.memory.usagePercentage + '%' }"></div>
        </div>
      </div>

      <!-- Active Users -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actieve VPN Gebruikers</span>
          <span class="badge badge-active">Online</span>
        </div>
        <div class="text-2xl font-bold text-white mb-2">{{ systemStore.stats.users.active }} / {{ systemStore.stats.users.total }}</div>
        <div class="text-xs text-slate-400">Gebruikers toegewezen</div>
      </div>

      <!-- System Uptime -->
      <div class="glass-card p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Uptime</span>
          <span class="text-purple-400 font-mono text-sm font-bold">Ubuntu</span>
        </div>
        <div class="text-2xl font-bold text-white mb-2">{{ formatUptime(systemStore.stats.system.uptimeSeconds) }}</div>
        <div class="text-xs text-slate-400">Kernel: {{ systemStore.stats.system.release }}</div>
      </div>
    </div>

    <!-- Protocol Distribution -->
    <div class="glass-card p-6" v-if="systemStore.stats">
      <h3 class="text-lg font-heading font-bold text-white mb-4">Protocol Verdeling</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
          <div>
            <span class="badge badge-hy2 mb-2">Hysteria 2</span>
            <div class="text-xs text-slate-400">UDP Port 8443 (QUIC / BBR)</div>
          </div>
          <div class="text-2xl font-bold text-white font-mono">{{ systemStore.stats.protocolDistribution.hysteria2 || 0 }}</div>
        </div>

        <div class="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
          <div>
            <span class="badge badge-tuic mb-2">TUIC v5</span>
            <div class="text-xs text-slate-400">UDP Port 8444 (0-RTT)</div>
          </div>
          <div class="text-2xl font-bold text-white font-mono">{{ systemStore.stats.protocolDistribution.tuic || 0 }}</div>
        </div>

        <div class="p-4 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
          <div>
            <span class="badge badge-vless mb-2">VLESS + REALITY</span>
            <div class="text-xs text-slate-400">TCP Port 443 (TLS Mimicry)</div>
          </div>
          <div class="text-2xl font-bold text-white font-mono">{{ systemStore.stats.protocolDistribution.vless_reality || 0 }}</div>
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
