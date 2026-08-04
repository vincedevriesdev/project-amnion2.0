<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Gebruikersbeheer</h1>
        <p class="page-subtitle">Beheer VPN-gebruikers, Hiddify-configuraties en actieve protocollen</p>
      </div>

      <button @click="openAddModal" class="btn btn-primary">
        <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nieuwe Gebruiker
      </button>
    </div>

    <!-- Alert Toast -->
    <div v-if="toastMessage" style="margin-bottom: 24px; padding: 16px; border-radius: 14px; font-size: 14px; font-weight: 500;" :style="toastSuccess ? 'background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399;' : 'background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5;'">
      {{ toastMessage }}
    </div>

    <!-- User Statistics Summary Cards -->
    <div class="grid-3" style="margin-bottom: 32px;">
      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 8px;">
          <span class="form-label" style="margin-bottom: 0;">Totaal Gebruikers</span>
          <span class="badge badge-emerald">Actief</span>
        </div>
        <div style="font-size: 28px; font-weight: 800; color: #fff;">{{ userStore.users.length }}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Geregistreerde VPN accounts</div>
      </div>

      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 8px;">
          <span class="form-label" style="margin-bottom: 0;">Totaal Dataverbruik</span>
          <span class="font-mono text-cyan" style="font-weight: 700;">Cumulatief</span>
        </div>
        <div style="font-size: 28px; font-weight: 800; color: #fff;">{{ formatBytes(totalUsedBytes) }}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Verbruikt door alle VPN clients</div>
      </div>

      <div class="glass-card">
        <div class="flex-between" style="margin-bottom: 8px;">
          <span class="form-label" style="margin-bottom: 0;">Actieve Protocollen</span>
          <span class="badge badge-purple">Multi-Engine</span>
        </div>
        <div style="font-size: 28px; font-weight: 800; color: #fff;">3 Protocollen</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Hysteria2, TUIC v5, VLESS REALITY</div>
      </div>
    </div>

    <!-- Users Data Table -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Gebruiker</th>
            <th>Status</th>
            <th>Dataverbruik</th>
            <th>Actieve Protocollen</th>
            <th>Hiddify Subscriptie</th>
            <th style="text-align: right;">Acties</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in userStore.users" :key="user.id">
            <!-- Username & UUID -->
            <td>
              <div style="font-weight: 700; color: #fff; font-size: 15px;">{{ user.username }}</div>
              <div class="font-mono" style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">{{ user.uuid }}</div>
            </td>

            <!-- Status -->
            <td>
              <span class="badge" :class="user.status === 'active' ? 'badge-emerald' : 'badge-red'">
                {{ user.status }}
              </span>
            </td>

            <!-- Data Limit / Usage -->
            <td>
              <div class="font-mono" style="font-size: 13px; font-weight: 700; color: #fff;">
                {{ formatBytes(user.used_bytes) }}
              </div>
              <div style="font-size: 11px; color: var(--text-muted);">
                {{ user.data_limit_bytes > 0 ? `Limiet: ${formatBytes(user.data_limit_bytes)}` : 'Onbeperkt' }}
              </div>
            </td>

            <!-- Enabled Protocols -->
            <td>
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span v-for="p in user.protocols" :key="p.protocol_type" v-show="p.is_enabled" class="badge" :class="getProtocolBadgeClass(p.protocol_type)">
                  {{ getProtocolLabel(p.protocol_type) }}
                </span>
              </div>
            </td>

            <!-- Hiddify Subscription QR & Link -->
            <td>
              <button @click="openQrModal(user)" class="btn btn-secondary btn-sm" style="gap: 6px;">
                <svg style="width: 16px; height: 16px; color: var(--emerald-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                QR & Sub Link
              </button>
            </td>

            <!-- Actions -->
            <td style="text-align: right;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                <button @click="handleResetToken(user.id)" class="btn btn-secondary btn-sm" title="Reset Subscriptie Token">Reset Token</button>
                <button @click="openEditModal(user)" class="btn btn-secondary btn-sm">Bewerken</button>
                <button @click="handleDelete(user.id)" class="btn btn-danger btn-sm">Verwijderen</button>
              </div>
            </td>
          </tr>

          <tr v-if="userStore.users.length === 0">
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-dim);">
              Nog geen gebruikers aangemaakt. Klik op "Nieuwe Gebruiker" om te beginnen.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit User Modal -->
    <div class="modal-backdrop" v-if="showModal" @click.self="closeModal">
      <div class="modal-box">
        <h3 style="font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 20px;">
          {{ isEditing ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker Toevoegen' }}
        </h3>

        <form @submit.prevent="saveUser">
          <div class="form-group">
            <label class="form-label">Gebruikersnaam</label>
            <input type="text" v-model="form.username" required :disabled="isEditing" class="input-field" placeholder="bijv. vince-phone" />
          </div>

          <div class="form-group">
            <label class="form-label">Datalimiet in GB (0 = Onbeperkt)</label>
            <input type="number" v-model.number="form.dataLimitGb" min="0" class="input-field" placeholder="0" />
          </div>

          <div class="form-group">
            <label class="form-label">Toegewezen Protocollen</label>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <label style="background: rgba(30, 41, 59, 0.6); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-glass); display: flex; align-items: center; gap: 12px; cursor: pointer;">
                <input type="checkbox" value="hysteria2" v-model="form.protocols" style="width: 18px; height: 18px; accent-color: var(--emerald-primary);" />
                <span style="font-size: 14px; font-weight: 600; color: #fff;">Hysteria 2 (UDP QUIC)</span>
              </label>

              <label style="background: rgba(30, 41, 59, 0.6); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-glass); display: flex; align-items: center; gap: 12px; cursor: pointer;">
                <input type="checkbox" value="tuic" v-model="form.protocols" style="width: 18px; height: 18px; accent-color: var(--emerald-primary);" />
                <span style="font-size: 14px; font-weight: 600; color: #fff;">TUIC v5 (UDP 0-RTT)</span>
              </label>

              <label style="background: rgba(30, 41, 59, 0.6); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-glass); display: flex; align-items: center; gap: 12px; cursor: pointer;">
                <input type="checkbox" value="vless_reality" v-model="form.protocols" style="width: 18px; height: 18px; accent-color: var(--emerald-primary);" />
                <span style="font-size: 14px; font-weight: 600; color: #fff;">VLESS + REALITY (TCP TLS Camouflage)</span>
              </label>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px;">
            <button type="button" @click="closeModal" class="btn btn-secondary">Annuleren</button>
            <button type="submit" :disabled="saving" class="btn btn-primary">
              {{ saving ? 'Bezig met opslaan...' : (isEditing ? 'Opslaan' : 'Aanmaken & Genereer Config') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- QR Modal Component -->
    <QrCodeModal :isOpen="showQrModal" :username="selectedUsername" :subToken="selectedSubToken" @close="showQrModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore, VpnUser } from '../stores/users';
import QrCodeModal from '../components/QrCodeModal.vue';

const userStore = useUserStore();

const showModal = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const selectedUserId = ref('');

const showQrModal = ref(false);
const selectedUsername = ref('');
const selectedSubToken = ref('');

const toastMessage = ref('');
const toastSuccess = ref(true);

const form = ref({
  username: '',
  dataLimitGb: 0,
  protocols: ['hysteria2', 'tuic', 'vless_reality']
});

const totalUsedBytes = computed(() => {
  return userStore.users.reduce((acc, u) => acc + (u.used_bytes || 0), 0);
});

onMounted(() => {
  userStore.fetchUsers();
});

function openAddModal() {
  isEditing.value = false;
  selectedUserId.value = '';
  form.value = {
    username: '',
    dataLimitGb: 0,
    protocols: ['hysteria2', 'tuic', 'vless_reality']
  };
  showModal.value = true;
}

function openEditModal(user: VpnUser) {
  isEditing.value = true;
  selectedUserId.value = user.id;
  const enabledProtos = user.protocols.filter(p => p.is_enabled).map(p => p.protocol_type);
  form.value = {
    username: user.username,
    dataLimitGb: user.data_limit_bytes ? Math.round(user.data_limit_bytes / (1024 * 1024 * 1024)) : 0,
    protocols: enabledProtos
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function saveUser() {
  saving.value = true;
  toastMessage.value = '';
  try {
    const dataLimitBytes = (form.value.dataLimitGb || 0) * 1024 * 1024 * 1024;
    
    if (isEditing.value) {
      await userStore.updateUser(selectedUserId.value, {
        dataLimitBytes,
        protocols: form.value.protocols
      });
      toastSuccess.value = true;
      toastMessage.value = 'Gebruiker en VPN configuratie succesvol bijgewerkt!';
      closeModal();
    } else {
      const newUser = await userStore.createUser({
        username: form.value.username.trim(),
        dataLimitBytes,
        protocols: form.value.protocols
      });
      toastSuccess.value = true;
      toastMessage.value = `Gebruiker "${newUser.username}" succesvol aangemaakt!`;
      closeModal();
      
      // Auto-open QR modal for newly created user
      openQrModal(newUser);
    }
  } catch (err: any) {
    toastSuccess.value = false;
    toastMessage.value = err.response?.data?.error || err.message || 'Fout bij opslaan gebruiker.';
  } finally {
    saving.value = false;
  }
}

async function handleResetToken(id: string) {
  if (confirm('Weet je zeker dat je het subscriptie token wilt resetten? De oude QR-code van de gebruiker zal vervallen.')) {
    try {
      await userStore.resetToken(id);
      toastSuccess.value = true;
      toastMessage.value = 'Subscriptie token succesvol vernieuwd!';
    } catch (err: any) {
      toastSuccess.value = false;
      toastMessage.value = err.response?.data?.error || 'Token resetten mislukt.';
    }
  }
}

async function handleDelete(id: string) {
  if (confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) {
    try {
      await userStore.deleteUser(id);
      toastSuccess.value = true;
      toastMessage.value = 'Gebruiker succesvol verwijderd.';
    } catch (err: any) {
      toastSuccess.value = false;
      toastMessage.value = err.response?.data?.error || 'Verwijderen mislukt.';
    }
  }
}

function openQrModal(user: VpnUser) {
  selectedUsername.value = user.username;
  selectedSubToken.value = user.subscriptionToken;
  showQrModal.value = true;
}

function getProtocolBadgeClass(type: string) {
  if (type === 'hysteria2') return 'badge-cyan';
  if (type === 'tuic') return 'badge-purple';
  return 'badge-amber';
}

function getProtocolLabel(type: string) {
  if (type === 'hysteria2') return 'HY2';
  if (type === 'tuic') return 'TUIC';
  return 'VLESS';
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
</script>
