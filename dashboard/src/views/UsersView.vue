<template>
  <div class="max-w-7xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-extrabold text-white">Gebruikersbeheer</h1>
        <p class="text-sm text-slate-400">Beheer VPN-gebruikers, Hiddify-configuraties en actieve protocollen</p>
      </div>

      <button @click="openAddModal" class="btn-primary text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nieuwe Gebruiker
      </button>
    </div>

    <!-- Users Data Table -->
    <div class="glass-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="bg-slate-900/80 text-xs text-slate-400 uppercase font-semibold border-b border-white/10">
            <tr>
              <th class="px-6 py-4">Gebruiker</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Actieve Protocollen</th>
              <th class="px-6 py-4">Hiddify Subscriptie</th>
              <th class="px-6 py-4 text-right">Acties</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="user in userStore.users" :key="user.id" class="hover:bg-white/[0.02] transition">
              <!-- Username & UUID -->
              <td class="px-6 py-4">
                <div class="font-bold text-white">{{ user.username }}</div>
                <div class="text-xs text-slate-500 font-mono mt-0.5">{{ user.uuid }}</div>
              </td>

              <!-- Status -->
              <td class="px-6 py-4">
                <span class="badge" :class="user.status === 'active' ? 'badge-active' : 'bg-red-500/15 text-red-400 border border-red-500/30'">
                  {{ user.status }}
                </span>
              </td>

              <!-- Enabled Protocols -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span v-for="p in user.protocols" :key="p.protocol_type" v-show="p.is_enabled" class="badge" :class="getProtocolBadgeClass(p.protocol_type)">
                    {{ getProtocolLabel(p.protocol_type) }}
                  </span>
                </div>
              </td>

              <!-- Hiddify Subscription QR & Link -->
              <td class="px-6 py-4">
                <button @click="openQrModal(user)" class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                  QR & Sub Link
                </button>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openEditModal(user)" class="btn-secondary text-xs px-2.5 py-1">Bewerken</button>
                  <button @click="handleDelete(user.id)" class="btn-danger text-xs px-2.5 py-1">Verwijderen</button>
                </div>
              </td>
            </tr>

            <tr v-if="userStore.users.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-slate-500">
                Nog geen gebruikers aangemaakt. Klik op "Nieuwe Gebruiker" om te beginnen.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit User Modal -->
    <div class="modal-backdrop" v-if="showModal" @click.self="closeModal">
      <div class="glass-card p-6 w-full max-w-lg">
        <h3 class="text-lg font-heading font-bold text-white mb-4">{{ isEditing ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker Toevoegen' }}</h3>

        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Gebruikersnaam</label>
            <input type="text" v-model="form.username" required :disabled="isEditing" class="input-field" placeholder="bijv. vince-phone" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Toegewezen Protocollen</label>
            <div class="space-y-2">
              <label class="flex items-center gap-3 bg-slate-900/60 p-3 rounded-lg border border-white/5 cursor-pointer">
                <input type="checkbox" value="hysteria2" v-model="form.protocols" class="rounded border-slate-700 text-emerald-500 focus:ring-0" />
                <span class="text-sm font-semibold text-white">Hysteria 2 (UDP QUIC)</span>
              </label>

              <label class="flex items-center gap-3 bg-slate-900/60 p-3 rounded-lg border border-white/5 cursor-pointer">
                <input type="checkbox" value="tuic" v-model="form.protocols" class="rounded border-slate-700 text-emerald-500 focus:ring-0" />
                <span class="text-sm font-semibold text-white">TUIC v5 (UDP 0-RTT)</span>
              </label>

              <label class="flex items-center gap-3 bg-slate-900/60 p-3 rounded-lg border border-white/5 cursor-pointer">
                <input type="checkbox" value="vless_reality" v-model="form.protocols" class="rounded border-slate-700 text-emerald-500 focus:ring-0" />
                <span class="text-sm font-semibold text-white">VLESS + REALITY (TCP TLS Camouflage)</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" @click="closeModal" class="btn-secondary text-sm">Annuleren</button>
            <button type="submit" class="btn-primary text-sm">{{ isEditing ? 'Opslaan' : 'Aanmaken & Genereer Config' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- QR Modal Component -->
    <QrCodeModal :isOpen="showQrModal" :username="selectedUsername" :subToken="selectedSubToken" @close="showQrModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore, VpnUser } from '../stores/users';
import QrCodeModal from '../components/QrCodeModal.vue';

const userStore = useUserStore();

const showModal = ref(false);
const isEditing = ref(false);
const selectedUserId = ref('');

const showQrModal = ref(false);
const selectedUsername = ref('');
const selectedSubToken = ref('');

const form = ref({
  username: '',
  protocols: ['hysteria2', 'tuic', 'vless_reality']
});

onMounted(() => {
  userStore.fetchUsers();
});

function openAddModal() {
  isEditing.value = false;
  selectedUserId.value = '';
  form.value = {
    username: '',
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
    protocols: enabledProtos
  };
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function saveUser() {
  if (isEditing.value) {
    await userStore.updateUser(selectedUserId.value, {
      protocols: form.value.protocols
    });
  } else {
    await userStore.createUser({
      username: form.value.username,
      protocols: form.value.protocols
    });
  }
  closeModal();
}

async function handleDelete(id: string) {
  if (confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) {
    await userStore.deleteUser(id);
  }
}

function openQrModal(user: VpnUser) {
  selectedUsername.value = user.username;
  selectedSubToken.value = user.subscriptionToken;
  showQrModal.value = true;
}

function getProtocolBadgeClass(type: string) {
  if (type === 'hysteria2') return 'badge-hy2';
  if (type === 'tuic') return 'badge-tuic';
  return 'badge-vless';
}

function getProtocolLabel(type: string) {
  if (type === 'hysteria2') return 'HY2';
  if (type === 'tuic') return 'TUIC';
  return 'VLESS';
}
</script>
