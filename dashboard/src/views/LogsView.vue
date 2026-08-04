<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Systeem Logboeken</h1>
        <p class="page-subtitle">Live journalctl output van Sing-box en Amnion Daemon</p>
      </div>

      <button @click="refreshLogs" class="btn btn-secondary flex-center gap-2">
        <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Vernieuwen
      </button>
    </div>

    <!-- Terminal Viewer -->
    <div class="glass-card" style="background: #030712; padding: 24px; font-family: monospace; font-size: 13px; height: 600px; display: flex; flex-direction: column; border-radius: 20px;">
      <div class="flex-between" style="padding-bottom: 16px; border-bottom: 1px solid var(--border-glass); margin-bottom: 16px; color: var(--text-dim);">
        <span style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--emerald-primary); display: inline-block;"></span>
          journalctl -u sing-box -u amnion-backend
        </span>
        <span>Laatste 100 regels</span>
      </div>

      <pre style="flex: 1; overflow-y: auto; white-space: pre-wrap; line-height: 1.6; color: #cbd5e1; font-family: 'JetBrains Mono', monospace;">{{ systemStore.logs || 'Laden van logboeken...' }}</pre>
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
