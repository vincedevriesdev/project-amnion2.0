<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Analyses & Netwerkstatistieken</h1>
        <p class="page-subtitle">Live monitoring van dataverbruik, bandbreedte en protocolverdeling</p>
      </div>
      
      <span class="badge badge-emerald">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        Live (3s)
      </span>
    </div>

    <!-- Top Cards Grid -->
    <div class="grid-4">
      <!-- Live RX Speed -->
      <div class="glass-card">
        <div class="flex-between mb-3">
          <span class="form-label mb-0">Inkomende Snelheid</span>
          <span class="font-mono text-cyan-500 font-bold">RX Bandwidth</span>
        </div>
        <div class="text-3xl font-extrabold text-white mb-1">
          {{ formatSpeed(stats?.network?.rxSpeedBytesPerSec || 0) }}
        </div>
        <div class="text-xs text-slate-400">Real-time inkomende data</div>
      </div>

      <!-- Live TX Speed -->
      <div class="glass-card">
        <div class="flex-between mb-3">
          <span class="form-label mb-0">Uitgaande Snelheid</span>
          <span class="font-mono text-emerald-500 font-bold">TX Bandwidth</span>
        </div>
        <div class="text-3xl font-extrabold text-white mb-1">
          {{ formatSpeed(stats?.network?.txSpeedBytesPerSec || 0) }}
        </div>
        <div class="text-xs text-slate-400">Real-time uitgaande doorvoer</div>
      </div>

      <!-- Most Popular Protocol -->
      <div class="glass-card">
        <div class="flex-between mb-3">
          <span class="form-label mb-0">Meest Gebruikt Protocol</span>
          <span class="badge badge-purple">Dominant</span>
        </div>
        <div class="text-3xl font-extrabold text-white mb-1">
          {{ stats?.mostUsedProtocol || 'Geen' }}
        </div>
        <div class="text-xs text-slate-400">Hoogste aantal verbindingen</div>
      </div>

      <!-- CPU Load Average -->
      <div class="glass-card">
        <div class="flex-between mb-3">
          <span class="form-label mb-0">CPU Belasting</span>
          <span class="font-mono text-amber-500 font-bold">Load Avg</span>
        </div>
        <div class="text-3xl font-extrabold text-white mb-1">
          {{ stats?.cpu?.loadAvg1m?.toFixed(2) || '0.00' }}
        </div>
        <div class="text-xs text-slate-400">1m / {{ stats?.cpu?.cores }} Cores</div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid-2">
      <!-- Protocol Distribution Chart -->
      <div class="glass-card">
        <h3 class="text-xl font-extrabold text-white mb-4">
          📊 Protocol Verdeling
        </h3>
        
        <DataUsageChart
          :data="protocolChartData"
          type="doughnut"
        />
        
        <div class="mt-4 space-y-2 text-sm">
          <div
            v-for="(proto, key) in stats?.protocolDistribution"
            :key="key"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-cyan-500': key === 'hysteria2',
                  'bg-purple-500': key === 'tuic',
                  'bg-amber-500': key === 'vless_reality',
                }"
              ></span>
              <span class="text-white font-medium">
                {{ key === 'hysteria2' ? 'Hysteria 2' : key === 'tuic' ? 'TUIC v5' : 'VLESS REALITY' }}
              </span>
            </div>
            <span class="font-mono text-slate-300">{{ proto }} Clients</span>
          </div>
        </div>
      </div>

      <!-- Data Usage Chart -->
      <div class="glass-card">
        <h3 class="text-xl font-extrabold text-white mb-4">
          📈 Top Dataverbruikers
        </h3>
        
        <DataUsageChart
          :data="usageChartData"
          type="bar"
        />
      </div>
    </div>

    <!-- Resource Efficiency -->
    <div class="grid-2">
      <!-- Server Resources -->
      <div class="glass-card">
        <h3 class="text-xl font-extrabold text-white mb-4">
          ⚙️ Server Resources
        </h3>
        
        <div class="space-y-3">
          <div class="resource-item">
            <div class="flex items-center gap-3">
              <MemoryIcon class="w-5 h-5 text-cyan-500" />
              <span class="text-white font-medium">RAM Gebruik</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="font-mono text-white">
                {{ formatBytes(stats?.memory?.usedBytes || 0) }} / {{ formatBytes(stats?.memory?.totalBytes || 0) }}
              </span>
              <span class="font-bold text-cyan-500">{{ stats?.memory?.usagePercentage }}%</span>
            </div>
          </div>
          
          <div class="resource-item">
            <div class="flex items-center gap-3">
              <HardDriveIcon class="w-5 h-5 text-purple-500" />
              <span class="text-white font-medium">SSD Gebruik</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="font-mono text-white">
                {{ formatBytes(stats?.disk?.usedBytes || 0) }} / {{ formatBytes(stats?.disk?.totalBytes || 0) }}
              </span>
              <span class="font-bold text-purple-500">{{ stats?.disk?.usagePercentage }}%</span>
            </div>
          </div>
          
          <div class="resource-item">
            <div class="flex items-center gap-3">
              <CpuChipIcon class="w-5 h-5 text-amber-500" />
              <span class="text-white font-medium">CPU Load</span>
            </div>
            <div class="flex items-center gap-4">
              <span class="font-mono text-white">
                {{ stats?.cpu?.loadAvg1m?.toFixed(2) }} / {{ stats?.cpu?.loadAvg5m?.toFixed(2) }} / {{ stats?.cpu?.loadAvg15m?.toFixed(2) }}
              </span>
              <span class="font-bold text-amber-500">{{ stats?.cpu?.cores }} Cores</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Network Stats -->
      <div class="glass-card">
        <h3 class="text-xl font-extrabold text-white mb-4">
          🌐 Netwerk Statistieken
        </h3>
        
        <div class="space-y-3">
          <div class="stat-item">
            <div class="flex items-center gap-3">
              <NetworkIcon class="w-5 h-5 text-emerald-500" />
              <span class="text-white font-medium">Actieve Verbindingen</span>
            </div>
            <span class="font-mono text-emerald-500 font-bold text-xl">
              {{ stats?.users?.active || 0 }}
            </span>
          </div>
          
          <div class="stat-item">
            <div class="flex items-center gap-3">
              <ClockIcon class="w-5 h-5 text-cyan-500" />
              <span class="text-white font-medium">System Uptime</span>
            </div>
            <span class="font-mono text-cyan-500 font-bold">
              {{ formatUptime(stats?.system?.uptimeSeconds || 0) }}
            </span>
          </div>
          
          <div class="stat-item">
            <div class="flex items-center gap-3">
              <ShieldCheckIcon class="w-5 h-5 text-purple-500" />
              <span class="text-white font-medium">Database</span>
            </div>
            <span class="font-mono text-purple-500 font-bold">
              SQLite3 (WAL)
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Users Table -->
    <div class="glass-card" v-if="stats?.topUsers?.length > 0">
      <h3 class="text-xl font-extrabold text-white mb-4">
        🏆 Top VPN Dataverbruikers
      </h3>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th class="w-16">Rang</th>
              <th>Gebruiker</th>
              <th>Status</th>
              <th>Dataverbruik</th>
              <th>Datalimiet</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, idx) in stats.topUsers" :key="user.uuid">
              <td class="font-bold text-emerald-500">#{{ idx + 1 }}</td>
              <td>
                <div class="font-bold text-white">{{ user.username }}</div>
                <div class="font-mono text-xs text-slate-400 truncate max-w-xs">{{ user.uuid }}</div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="user.status === 'active' ? 'badge-emerald' : 'badge-red'"
                >
                  {{ user.status }}
                </span>
              </td>
              <td class="font-mono font-bold text-white">
                {{ formatBytes(user.used_bytes || 0) }}
              </td>
              <td class="font-mono text-slate-400">
                {{ user.data_limit_bytes > 0 ? formatBytes(user.data_limit_bytes) : 'Onbeperkt' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useSystemStore } from '../stores/system';
import { useFormat } from '../composables/useFormat';
import DataUsageChart from '../components/DataUsageChart.vue';
import {
  MemoryIcon,
  HardDriveIcon,
  CpuChipIcon,
  NetworkIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '../components/Icons';

const systemStore = useSystemStore();
const { formatBytes, formatSpeed, formatUptime } = useFormat();

const stats = ref(systemStore.stats);
let timer: any = null;

// Chart Data
const protocolChartData = computed(() => {
  if (!stats.value?.protocolDistribution) return [];
  return [
    { label: 'Hysteria 2', value: stats.value.protocolDistribution.hysteria2 || 0 },
    { label: 'TUIC v5', value: stats.value.protocolDistribution.tuic || 0 },
    { label: 'VLESS REALITY', value: stats.value.protocolDistribution.vless_reality || 0 },
  ];
});

const usageChartData = computed(() => {
  if (!stats.value?.topUsers) return [];
  return stats.value.topUsers.slice(0, 5).map(user => ({
    label: user.username,
    value: user.used_bytes || 0
  }));
});

onMounted(() => {
  systemStore.fetchStats();
  timer = setInterval(() => {
    systemStore.fetchStats();
    stats.value = systemStore.stats;
  }, 3000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
/* Resource Item */
.resource-item {
  @apply flex items-center justify-between p-3;
  @apply bg-slate-800/50 rounded-xl;
}

/* Stat Item */
.stat-item {
  @apply flex items-center justify-between p-3;
  @apply bg-slate-800/50 rounded-xl;
}

/* Table Wrapper */
.table-wrapper {
  @apply overflow-x-auto;
}

/* Light Mode Adjustments */
.light .resource-item,
.light .stat-item {
  @apply bg-slate-100/80;
}
</style>
