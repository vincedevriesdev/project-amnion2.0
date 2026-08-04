<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Analyses & Netwerkstatistieken</h1>
        <p class="page-subtitle">Diepgaand inzicht in dataverbruik, top gebruikers en protocol prestaties</p>
      </div>

      <span class="badge badge-emerald" style="font-size: 13px; padding: 8px 16px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #34d399; display: inline-block;"></span>
        Live Monitoring Actief
      </span>
    </div>

    <!-- Analytics Top Cards -->
    <div class="grid-3" style="margin-bottom: 32px;" v-if="systemStore.stats">
      <!-- Most Used Protocol Card -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">Populairste Protocol</span>
          <span class="badge badge-purple">Meest Gebruikt</span>
        </div>
        <div style="font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 4px;">
          {{ systemStore.stats.mostUsedProtocol }}
        </div>
        <div style="font-size: 13px; color: var(--text-muted);">
          Geselecteerd door het grootste aantal VPN-clients
        </div>
      </div>

      <!-- Live Network RX Speed -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">Live Inkomend (Download)</span>
          <span class="font-mono text-cyan" style="font-weight: 700;">RX Speed</span>
        </div>
        <div style="font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 4px;">
          {{ formatSpeed(systemStore.stats.network?.rxSpeedBytesPerSec || 0) }}
        </div>
        <div style="font-size: 13px; color: var(--text-muted);">
          Actuele netwerksnelheid op de VPS
        </div>
      </div>

      <!-- Live Network TX Speed -->
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 12px;">
          <span class="form-label" style="margin-bottom: 0;">Live Uitgaand (Upload)</span>
          <span class="font-mono text-emerald" style="font-weight: 700;">TX Speed</span>
        </div>
        <div style="font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 4px;">
          {{ formatSpeed(systemStore.stats.network?.txSpeedBytesPerSec || 0) }}
        </div>
        <div style="font-size: 13px; color: var(--text-muted);">
          Actuele uitgaande doorvoersnelheid
        </div>
      </div>
    </div>

    <!-- Leaderboard: Top Active Users -->
    <div class="glass-card" style="margin-bottom: 32px;" v-if="systemStore.stats">
      <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 20px;">🏆 Meest Actieve VPN Gebruikers</h3>
      
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

    <!-- Traffic Breakdown Visualizer -->
    <div class="glass-card" v-if="systemStore.stats">
      <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 20px;">📊 Protocol Geheugen & Netwerk Efficiëntie</h3>
      <div class="grid-3">
        <div style="background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 16px; border: 1px solid var(--border-glass);">
          <div style="font-weight: 700; color: #fff; margin-bottom: 6px;">Hysteria 2 (UDP)</div>
          <div style="font-size: 13px; color: var(--text-muted);">Hoge pakketverlies tolerantie met Quic / BBR congestion control. Optimaliseert mobiele 4G/5G data.</div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 16px; border: 1px solid var(--border-glass);">
          <div style="font-weight: 700; color: #fff; margin-bottom: 6px;">TUIC v5 (UDP 0-RTT)</div>
          <div style="font-size: 13px; color: var(--text-muted);">Multiplexing over QUIC met zero-RTT handshakes voor minimale latency en snelle browsing.</div>
        </div>

        <div style="background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 16px; border: 1px solid var(--border-glass);">
          <div style="font-weight: 700; color: #fff; margin-bottom: 6px;">VLESS + REALITY (TCP)</div>
          <div style="font-size: 13px; color: var(--text-muted);">Directe TLS mimicry naar externe legitieme HTTPS servers om DPI firewalls geruisloos te omzeilen.</div>
        </div>
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
