<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Systeem Logboeken</h1>
        <p class="page-subtitle">Live journalctl output van Sing-box en Amnion Daemon</p>
      </div>
      
      <div class="flex items-center gap-3">
        <button
          @click="refreshLogs"
          :disabled="loading"
          class="glass-btn glass-btn-secondary"
        >
          <RefreshIcon class="w-4 h-4" />
          <span>Vernieuwen</span>
        </button>
        
        <button
          @click="clearLogs"
          class="glass-btn glass-btn-secondary"
          data-tooltip="Logboeken leegmaken"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
        
        <button
          @click="downloadLogs"
          class="glass-btn glass-btn-secondary"
          data-tooltip="Logboeken downloaden"
        >
          <DownloadIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Terminal Viewer -->
    <div class="terminal-viewer">
      <div class="terminal-header">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span class="text-sm text-slate-400">journalctl -u sing-box -u amnion-backend</span>
        </div>
        <span class="text-sm text-slate-500">Laatste 100 regels</span>
      </div>
      
      <div class="terminal-body">
        <pre class="terminal-content">{{ logs || 'Laden van logboeken...' }}</pre>
      </div>
      
      <!-- Auto-refresh Toggle -->
      <div class="terminal-footer">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            v-model="autoRefresh"
            class="w-4 h-4 accent-emerald-500"
          />
          <span class="text-sm text-slate-400">Auto-refresh (5s)</span>
        </label>
        
        <div class="flex-1"></div>
        
        <div class="flex items-center gap-4 text-sm text-slate-500">
          <span>Regels: {{ lineCount }}</span>
          <span>Laatste update: {{ lastUpdated }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useSystemStore } from '../stores/system';
import { useToastStore } from '../stores/toast';
import {
  RefreshIcon,
  TrashIcon,
  DownloadIcon,
} from '../components/Icons';

const systemStore = useSystemStore();
const toastStore = useToastStore();

const logs = ref(systemStore.logs);
const loading = ref(false);
const autoRefresh = ref(true);
const lastRefreshTime = ref<Date | null>(null);

let refreshInterval: any = null;

const lineCount = computed(() => {
  return logs.value ? logs.value.split('\n').length : 0;
});

const lastUpdated = computed(() => {
  if (!lastRefreshTime.value) return 'Nooit';
  return lastRefreshTime.value.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

onMounted(() => {
  fetchLogs();
  
  if (autoRefresh.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});

function startAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(() => {
    fetchLogs();
  }, 5000);
}

async function fetchLogs() {
  loading.value = true;
  try {
    await systemStore.fetchLogs(100);
    logs.value = systemStore.logs;
    lastRefreshTime.value = new Date();
  } catch (err: any) {
    toastStore.addToast(err.response?.data?.error || 'Fout bij het ophalen van logboeken.', 'error');
  } finally {
    loading.value = false;
  }
}

function refreshLogs() {
  fetchLogs();
}

function clearLogs() {
  if (confirm('Weet je zeker dat je de logboeken wilt leegmaken?')) {
    logs.value = '';
    toastStore.addToast('Logboeken leeggemaakt.', 'success');
  }
}

function downloadLogs() {
  const blob = new Blob([logs.value || 'Geen logboeken beschikbaar.'], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `amnion-logs-${new Date().toISOString().slice(0, 10)}.log`;
  a.click();
  URL.revokeObjectURL(url);
  toastStore.addToast('Logboeken gedownload!', 'success');
}

// Watch auto-refresh toggle
import { watch } from 'vue';
watch(autoRefresh, (val) => {
  if (val) {
    startAutoRefresh();
  } else {
    if (refreshInterval) clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
/* Terminal Viewer */
.terminal-viewer {
  @apply glass-card;
  @apply bg-slate-900;
  @apply flex flex-col;
  @apply min-h-[600px];
}

.terminal-header {
  @apply flex items-center justify-between p-4;
  @apply border-b border-slate-800;
}

.terminal-body {
  @apply flex-1;
  @apply p-4;
  @apply overflow-hidden;
}

.terminal-content {
  @apply w-full h-full;
  @apply overflow-y-auto;
  @apply text-sm;
  @apply font-mono;
  @apply text-slate-300;
  @apply whitespace-pre-wrap;
  @apply leading-relaxed;
  @apply scrollbar-hide;
}

.terminal-footer {
  @apply flex items-center p-3;
  @apply border-t border-slate-800;
  @apply bg-slate-900/50;
}

/* Light Mode Adjustments */
.light .terminal-viewer {
  @apply bg-white/10;
  @apply border-slate-200;
}

.light .terminal-header {
  @apply border-slate-200;
}

.light .terminal-content {
  @apply text-slate-700;
}

.light .terminal-footer {
  @apply border-slate-200;
  @apply bg-slate-50/50;
}
</style>
