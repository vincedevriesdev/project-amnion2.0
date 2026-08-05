<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Analyses & Netwerkstatistieken</h1>
        <p class="page-subtitle">Diepgaand inzicht in dataverbruik, live bandbreedte, protocolverdeling en serverbelasting</p>
      </div>

      <span class="badge badge-emerald" style="font-size: 13px; padding: 8px 16px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #34d399; display: inline-block;"></span>
        Live Monitoring (3s)
      </span>
    </div>

    <!-- Analytics Top Cards Grid -->
    <div class="grid-4" style="margin-bottom: 32px;" v-if="systemStore.stats">
      <!-- Live RX Speed -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">Inkomende Snelheid</span>
          <span class="font-mono text-cyan" style="font-weight: 700;">RX Bandwidth</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px;">
          {{ formatSpeed(systemStore.stats.network?.rxSpeedBytesPerSec || 0) }}
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">Real-time inkomende VPS data</div>
      </div>

      <!-- Live TX Speed -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">Uitgaande Snelheid</span>
          <span class="font-mono text-emerald" style="font-weight: 700;">TX Bandwidth</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px;">
          {{ formatSpeed(systemStore.stats.network?.txSpeedBytesPerSec || 0) }}
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">Real-time uitgaande VPN doorvoer</div>
      </div>

      <!-- Most Popular Protocol -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">Meest Gebruikt Protocol</span>
          <span class="badge badge-purple">Dominant</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px;">
          {{ systemStore.stats.mostUsedProtocol }}
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">Hoogste aantal client verbindingen</div>
      </div>

      <!-- System Load Average -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">CPU Belasting (1m/5m/15m)</span>
          <span class="font-mono text-amber" style="font-weight: 700;">Load</span>
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px;">
          {{ systemStore.stats.cpu.loadAvg1m }} / {{ systemStore.stats.cpu.loadAvg5m }}
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">{{ systemStore.stats.cpu.cores }} CPU Cores actief</div>
      </div>
    </div>

    <!-- Protocol Distribution & Performance Grid -->
    <div class="grid-2" style="margin-bottom: 32px;" v-if="systemStore.stats">
      <!-- Protocol Distribution Visualizer -->
      <div class="glass-card">
        <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 20px;">📊 Actieve Protocol Verdeling</h3>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Hysteria 2 -->
          <div>
            <div class="flex-between" style="font-size: 14px; margin-bottom: 6px;">
              <span style="font-weight: 700; color: #fff;">🚀 Hysteria 2 (UDP QUIC)</span>
              <span class="font-mono text-cyan" style="font-weight: 700;">{{ systemStore.stats.protocolDistribution?.hysteria2 || 0 }} Clients</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="background: var(--accent-cyan);" :style="{ width: getProtocolPercent('hysteria2') + '%' }"></div>
            </div>
          </div>

          <!-- TUIC v5 -->
          <div>
            <div class="flex-between" style="font-size: 14px; margin-bottom: 6px;">
              <span style="font-weight: 700; color: #fff;">⚡ TUIC v5 (UDP 0-RTT)</span>
              <span class="font-mono text-purple" style="font-weight: 700;">{{ systemStore.stats.protocolDistribution?.tuic || 0 }} Clients</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="background: var(--accent-purple);" :style="{ width: getProtocolPercent('tuic') + '%' }"></div>
            </div>
          </div>

          <!-- VLESS REALITY -->
          <div>
            <div class="flex-between" style="font-size: 14px; margin-bottom: 6px;">
              <span style="font-weight: 700; color: #fff;">🛡️ VLESS REALITY (TCP Camouflage)</span>
              <span class="font-mono text-amber" style="font-weight: 700;">{{ systemStore.stats.protocolDistribution?.vless_reality || 0 }} Clients</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="background: #f59e0b;" :style="{ width: getProtocolPercent('vless_reality') + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Server Resource Efficiency & Protection -->
      <div class="glass-card">
        <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 16px;">🛡️ Server Efficiëntie & Opslag (10 GB Cap)</h3>
        
        <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
          <div style="background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid var(--border-glass);" class="flex-between">
            <span class="text-muted">RAM Geheugenverbruik:</span>
            <span class="font-mono text-emerald" style="font-weight: 700;">{{ formatBytes(systemStore.stats.memory.usedBytes) }} / {{ formatBytes(systemStore.stats.memory.totalBytes) }} ({{ systemStore.stats.memory.usagePercentage }}%)</span>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid var(--border-glass);" class="flex-between">
            <span class="text-muted">SSD Schijfgebruik:</span>
            <span class="font-mono text-purple" style="font-weight: 700;">{{ formatBytes(systemStore.stats.disk.usedBytes) }} / {{ formatBytes(systemStore.stats.disk.totalBytes) }} ({{ systemStore.stats.disk.usagePercentage }}%)</span>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid var(--border-glass);" class="flex-between">
            <span class="text-muted">Database Modus:</span>
            <span class="font-mono text-cyan" style="font-weight: 700;">SQLite3 (WAL Modus)</span>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); padding: 14px; border-radius: 12px; border: 1px solid var(--border-glass);" class="flex-between">
            <span class="text-muted">Journald Log Limit:</span>
            <span class="font-mono text-emerald" style="font-weight: 700;">Max 100 MB Cap</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard: Top Active Users -->
    <div class="glass-card" style="margin-bottom: 32px;" v-if="systemStore.stats">
      <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 20px;">🏆 Top VPN Dataverbruikers (Leaderboard)</h3>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Rang</th>
              <th>Gebruiker</th>
              <th>Status</th>
              <th>Totaal Dataverbruik</th>
              <th>Datalimiet</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, idx) in systemStore.stats.topUsers" :key="user.uuid">
              <td style="font-weight: 800; color: var(--emerald-primary);">#{{ idx + 1 }}</td>
              <td>
                <div style="font-weight: 700; color: #fff;">{{ user.username }}</div>
                <div class="font-mono" style="font-size: 11px; color: var(--text-dim);">{{ user.uuid }}</div>
              </td>
              <td>
                <span class="badge" :class="user.status === 'active' ? 'badge-emerald' : 'badge-red'">
                  {{ user.status }}
                </span>
              </td>
              <td class="font-mono" style="font-weight: 700; color: #fff;">
                {{ formatBytes(user.used_bytes) }}
              </td>
              <td class="font-mono" style="color: var(--text-muted);">
                {{ user.data_limit_bytes > 0 ? formatBytes(user.data_limit_bytes) : 'Onbeperkt' }}
              </td>
            </tr>

            <tr v-if="!systemStore.stats.topUsers || systemStore.stats.topUsers.length === 0">
              <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-dim);">
                Nog geen dataverbruik geregistreerd.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useSystemStore } from '../stores/system';

const systemStore = useSystemStore();
let timer: any = null;

onMounted(() => {
  systemStore.fetchStats();
  timer = setInterval(() => {
    systemStore.fetchStats();
  }, 3000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

function getProtocolPercent(protoType: string) {
  if (!systemStore.stats || !systemStore.stats.protocolDistribution) return 0;
  const dist = systemStore.stats.protocolDistribution;
  const total = (dist.hysteria2 || 0) + (dist.tuic || 0) + (dist.vless_reality || 0);
  if (total === 0) return 33;
  return Math.round(((dist[protoType] || 0) / total) * 100);
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSec: number) {
  if (bytesPerSec === 0) return '0 KB/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
</script>
