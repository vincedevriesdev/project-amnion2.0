<template>
  <div class="max-w-7xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-extrabold text-white">Systeem Logboeken</h1>
        <p class="text-sm text-slate-400">Live journalctl output van Sing-box en Amnion Daemon</p>
      </div>

      <button @click="refreshLogs" class="btn-secondary text-sm flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Vernieuwen
      </button>
    </div>

    <!-- Terminal Viewer -->
    <div class="glass-card p-6 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto rounded-xl border border-white/10 shadow-2xl h-[600px] flex flex-col">
      <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-4 text-slate-500">
        <span class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          journalctl -u sing-box -u amnion-backend
        </span>
        <span>Laatste 100 regels</span>
      </div>

      <pre class="flex-1 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-300 selection:bg-emerald-500/30 font-mono">{{ systemStore.logs || 'Laden van logboeken...' }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSystemStore } from '../stores/system';

const systemStore = useSystemStore();

onMounted(() => {
  systemStore.fetchLogs();
});

function refreshLogs() {
  systemStore.fetchLogs();
}
</script>
