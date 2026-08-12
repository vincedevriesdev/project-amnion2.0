<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Server Overzicht</h1>
        <p class="page-subtitle">Real-time status, netwerkmonitoring en service gezondheid</p>
      </div>
      
      <div class="flex items-center gap-3">
        <span
          class="badge"
          :class="{
            'badge-emerald': stats?.serverStatus === 'online',
            'badge-amber': stats?.serverStatus === 'degraded',
            'badge-red': stats?.serverStatus === 'offline',
          }"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="{
              'bg-emerald-500': stats?.serverStatus === 'online',
              'bg-amber-500': stats?.serverStatus === 'degraded',
              'bg-red-500': stats?.serverStatus === 'offline',
            }"
          ></span>
          Server {{ stats?.serverStatus === 'online' ? 'Online' : stats?.serverStatus === 'degraded' ? 'Beperkt' : 'Offline' }}
        </span>

        <button
          @click="handleReloadSingbox"
          :disabled="reloading"
          class="glass-btn glass-btn-primary"
        >
          <RefreshIcon class="w-4 h-4" />
          <span>{{ reloading ? 'Herladen...' : 'Herlaad Config' }}</span>
        </button>
      </div>
    </div>

    <!-- Alerts Banner -->
    <transition name="fade">
      <div v-if="stats?.alerts?.length > 0" class="space-y-2">
        <div
          v-for="(alert, idx) in stats.alerts"
          :key="idx"
          class="alert"
          :class="alert.level === 'danger' ? 'alert-danger' : 'alert-warning'"
        >
          {{ alert.message }}
        </div>
      </div>
    </transition>

    <!-- Metric Cards Grid -->
    <div class="grid-4">
      <!-- CPU Usage -->
      <div class="glass-card">
        <div class="flex-between mb-3">
          <span class="form-label mb-0">CPU Belasting</span>
          <span class="font-mono text-emerald-500 font-bold">{{ stats?.cpu?.loadAvg1m }} Load</span>
        </div>
        <div class="text-3xl font-extrabold text-white mb-1">
          {{ stats?.cpu?.cores }} Cores
        </div>
        <div class="text-xs text-slate-400 truncate">
          {{ stats?.cpu?.model || 'Onbekend' }}
        </div>
      </div>

      <!-- RAM Usage -->
      <div class="glass-card">
        <div class="flex-between mb-3">
          <span class="form-label mb-0">RAM Gebruik</span>
          <span class="font-mono text-cyan-500 font-bold">{{ stats?.memory?.usagePercentage }}%</span>
        </div>
        <div class="text-3xl font-extrabold text-white mb-2">
          {{ formatBytes(stats?.memory?.usedBytes || 0) }} / {{ formatBytes(stats?.memory?.totalBytes || 0) }}
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill bg-cyan-500"
            :style="{ width: stats?.memory?.usagePercentage + '%' }"
          ></div>
        </div>
      </div>

      <!-- Disk Usage -->
      <div class="glass-card">
        <div class="flex-between mb-3">
          <span class="form-label mb-0">Schijfgebruik (SSD)</span>
          <span class="font-mono text-purple-500 font-bold">{{ stats?.disk?.usagePercentage }}%</span>
        </div>
        <div class="text-3xl font-extrabold text-white mb-2">
          {{ formatBytes(stats?.disk?.usedBytes || 0) }} / {{ formatBytes(stats?.disk?.totalBytes || 0) }}
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill bg-purple-500"
            :style="{ width: stats?.disk?.usagePercentage + '%' }"
          ></div>
        </div>
      </div>

      <!-- Active Users -->
      <div class="glass-card">
        <div class="flex-between mb-3">
          <span class="form-label mb-0">VPN Gebruikers</span>
          <span class="badge badge-emerald">Online</span>
        </div>
        <div class="text-3xl font-extrabold text-white mb-1">
          {{ stats?.users?.active }} / {{ stats?.users?.total }}
        </div>
        <div class="text-xs text-slate-400">Actief toegewezen</div>
      </div>
    </div>

    <!-- Service Health & System Info -->
    <div class="grid-2">
      <!-- Service Health -->
      <div class="glass-card">
        <h3 class="text-xl font-extrabold text-white mb-4">
          🚦 Service Gezondheid
        </h3>
        
        <div class="space-y-3">
          <div
            v-for="(service, name) in stats?.services"
            :key="name"
            class="service-item"
          >
            <div>
              <div class="font-bold text-white">
                {{ name === 'singBox' ? 'sing-box.service' : 'amnion-backend.service' }}
              </div>
              <div class="text-xs text-slate-400">
                {{ name === 'singBox' ? 'VPN Engine Daemon' : 'Control Daemon' }}
              </div>
            </div>
            <span
              class="badge"
              :class="service === 'active' ? 'badge-emerald' : service === 'inactive' ? 'badge-amber' : 'badge-red'"
            >
              {{ service }}
            </span>
          </div>
        </div>
      </div>

      <!-- System Info -->
      <div class="glass-card">
        <h3 class="text-xl font-extrabold text-white mb-4">
          ⚙️ Systeem Informatie
        </h3>
        
        <div class="space-y-3 text-sm">
          <div class="info-row">
            <span class="text-slate-400">Amnion Versie:</span>
            <span class="font-mono text-emerald-500 font-bold">{{ stats?.version || 'Onbekend' }}</span>
          </div>
          <div class="info-row">
            <span class="text-slate-400">System Uptime:</span>
            <span class="font-mono text-white">{{ formatUptime(stats?.system?.uptimeSeconds || 0) }}</span>
          </div>
          <div class="info-row">
            <span class="text-slate-400">Linux Kernel:</span>
            <span class="font-mono text-white">{{ stats?.system?.release || 'Onbekend' }}</span>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <router-link to="/analytics" class="glass-btn glass-btn-secondary flex-1 text-center">
            Bekijk Analyses
          </router-link>
          <router-link to="/settings" class="glass-btn glass-btn-secondary flex-1 text-center">
            Instellingen
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSystemStore } from '../stores/system';
import { useToastStore } from '../stores/toast';
import { useFormat } from '../composables/useFormat';
import { RefreshIcon } from '../components/Icons';

const systemStore = useSystemStore();
const toastStore = useToastStore();
const { formatBytes, formatUptime } = useFormat();

const stats = ref(systemStore.stats);
const reloading = ref(false);
let timer: any = null;

onMounted(() => {
  systemStore.fetchStats();
  timer = setInterval(() => {
    systemStore.fetchStats();
    stats.value = systemStore.stats;
  }, 4000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

async function handleReloadSingbox() {
  if (!confirm('Weet je zeker dat je de Sing-box configuratie wilt herladen? Dit kan tijdelijk de VPN-verbindingen onderbreken.')) {
    return;
  }
  
  reloading.value = true;
  try {
    const res = await systemStore.reloadSingbox();
    toastStore.addToast(res.message || 'Sing-box configuratie succesvol herladen!', 'success');
  } catch (err: any) {
    toastStore.addToast(err.response?.data?.error || 'Herladen mislukt.', 'error');
  } finally {
    reloading.value = false;
  }
}
</script>

<style scoped>
/* Service Item */
.service-item {
  @apply flex items-center justify-between p-3;
  @apply bg-slate-800/50 rounded-xl border border-slate-700/50;
}

/* Info Row */
.info-row {
  @apply flex justify-between;
}

/* Alert Styles */
.alert {
  @apply p-4 rounded-xl text-sm font-semibold;
}

.alert-danger {
  @apply bg-red-500/15 border border-red-500/30 text-red-400;
}

.alert-warning {
  @apply bg-amber-500/15 border border-amber-500/30 text-amber-400;
}

/* Light Mode Adjustments */
.light .service-item {
  @apply bg-slate-100/80 border-slate-200;
}

.light .info-row {
  @apply text-slate-600;
}

.light .alert-danger {
  @apply bg-red-100 border-red-200 text-red-600;
}

.light .alert-warning {
  @apply bg-amber-100 border-amber-200 text-amber-600;
}
</style>
