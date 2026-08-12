<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Gebruikersbeheer</h1>
        <p class="page-subtitle">Beheer VPN-gebruikers, protocollen en abonnementen</p>
      </div>
      
      <div class="flex items-center gap-3 flex-wrap">
        <!-- Search -->
        <div class="relative">
          <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            v-model="searchQuery"
            placeholder="Zoek gebruikers..."
            class="glass-input pl-10 w-48 md:w-64"
          />
        </div>
        
        <!-- Status Filter -->
        <select v-model="statusFilter" class="glass-input w-32">
          <option value="">Alle status</option>
          <option value="active">Actief</option>
          <option value="disabled">Gepauzeerd</option>
        </select>
        
        <!-- Bulk Actions (Desktop) -->
        <div v-if="selectedUsers.length > 0" class="hidden md:flex items-center gap-2">
          <span class="text-sm text-slate-400">
            {{ selectedUsers.length }} geselecteerd
          </span>
          <button
            @click="bulkToggleStatus"
            class="glass-btn glass-btn-secondary text-sm"
          >
            {{ selectedUsers.every(id => users.find(u => u.id === id)?.status === 'active') ? 'Bulk Pauzeren' : 'Bulk Hervatten' }}
          </button>
          <button
            @click="bulkDelete"
            class="glass-btn glass-btn-danger text-sm"
          >
            Bulk Verwijderen
          </button>
        </div>
        
        <!-- Export/Import -->
        <button @click="handleExportCSV" class="glass-btn glass-btn-secondary" data-tooltip="Exporteer CSV">
          <DownloadIcon class="w-4 h-4" />
          <span class="hidden md:inline">CSV</span>
        </button>
        
        <button @click="triggerFileInput" class="glass-btn glass-btn-secondary" data-tooltip="Importeer JSON">
          <UploadIcon class="w-4 h-4" />
          <span class="hidden md:inline">JSON</span>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none;"
          @change="handleFileImport"
        />
        
        <!-- Add User Button -->
        <button @click="openAddModal" class="glass-btn glass-btn-primary">
          <PlusIcon class="w-4 h-4" />
          <span>Nieuwe Gebruiker</span>
        </button>
      </div>
    </div>

    <!-- Bulk Actions (Mobile) -->
    <div v-if="selectedUsers.length > 0" class="md:hidden flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl">
      <span class="text-sm text-slate-400">
        {{ selectedUsers.length }} geselecteerd
      </span>
      <button @click="clearSelection" class="text-sm text-slate-400 hover:text-white">
        Deselecteren
      </button>
      <div class="flex-1"></div>
      <button @click="bulkToggleStatus" class="glass-btn glass-btn-secondary text-xs">
        {{ selectedUsers.every(id => users.find(u => u.id === id)?.status === 'active') ? 'Pauzeren' : 'Hervatten' }}
      </button>
      <button @click="bulkDelete" class="glass-btn glass-btn-danger text-xs">
        Verwijderen
      </button>
    </div>

    <!-- User Statistics Cards -->
    <div class="grid-3">
      <div class="glass-card">
        <div class="flex-between mb-2">
          <span class="form-label mb-0">Totaal Gebruikers</span>
          <span class="badge badge-emerald">Actief</span>
        </div>
        <div class="text-3xl font-extrabold text-white">{{ users.length }}</div>
        <div class="text-xs text-slate-400 mt-1">Geregistreerde VPN accounts</div>
      </div>

      <div class="glass-card">
        <div class="flex-between mb-2">
          <span class="form-label mb-0">Totaal Dataverbruik</span>
          <span class="font-mono text-cyan-500 font-bold">Cumulatief</span>
        </div>
        <div class="text-3xl font-extrabold text-white">{{ formatBytes(totalUsedBytes) }}</div>
        <div class="text-xs text-slate-400 mt-1">Verbruikt door alle clients</div>
      </div>

      <div class="glass-card">
        <div class="flex-between mb-2">
          <span class="form-label mb-0">Gebruikers Status</span>
          <span class="badge badge-emerald">Live</span>
        </div>
        <div class="text-3xl font-extrabold text-white">{{ users.filter(u => u.status === 'active').length }} Actief</div>
        <div class="text-xs text-slate-400 mt-1">{{ users.filter(u => u.status === 'disabled').length }} Gepauzeerd</div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th class="w-12">
              <input
                type="checkbox"
                @change="toggleSelectAll"
                :checked="selectedUsers.length === filteredUsers.length && filteredUsers.length > 0"
              />
            </th>
            <th @click="sortBy('username')" class="cursor-pointer select-none">
              Gebruiker
              <span v-if="sortKey === 'username'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('status')" class="cursor-pointer select-none">
              Status
              <span v-if="sortKey === 'status'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('used_bytes')" class="cursor-pointer select-none">
              Dataverbruik
              <span v-if="sortKey === 'used_bytes'" class="sort-indicator">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Protocollen</th>
            <th>Hiddify Config</th>
            <th class="text-right">Acties</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="user.id">
            <td>
              <input
                type="checkbox"
                v-model="selectedUsers"
                :value="user.id"
              />
            </td>
            <td>
              <div class="font-bold text-white">{{ user.username }}</div>
              <div class="font-mono text-xs text-slate-400 truncate max-w-xs">{{ user.uuid }}</div>
            </td>
            <td>
              <span
                class="badge"
                :class="user.status === 'active' ? 'badge-emerald' : user.status === 'disabled' ? 'badge-amber' : 'badge-red'"
              >
                {{ user.status === 'active' ? 'Actief' : user.status === 'disabled' ? 'Gepauzeerd' : user.status }}
              </span>
            </td>
            <td>
              <div class="font-mono font-bold text-white">
                {{ formatBytes(user.used_bytes || 0) }}
              </div>
              <div class="text-xs text-slate-400">
                {{ user.data_limit_bytes > 0 ? `Limiet: ${formatBytes(user.data_limit_bytes)}` : 'Onbeperkt' }}
              </div>
            </td>
            <td>
              <div class="flex items-center gap-1 flex-wrap">
                <span
                  v-for="p in user.protocols"
                  :key="p.protocol_type"
                  v-show="p.is_enabled"
                  class="badge text-[10px] px-2 py-0.5"
                  :class="getProtocolBadgeClass(p.protocol_type)"
                >
                  {{ getProtocolLabel(p.protocol_type) }}
                </span>
              </div>
            </td>
            <td>
              <button
                @click="openQrModal(user)"
                class="glass-btn glass-btn-secondary text-xs"
                data-tooltip="QR Code & Sub Link"
              >
                <QrCodeIcon class="w-4 h-4" />
              </button>
            </td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  @click="handleToggleBlock(user)"
                  class="glass-btn text-xs"
                  :class="user.status === 'active' ? 'glass-btn-danger' : 'glass-btn-primary'"
                  :data-tooltip="user.status === 'active' ? 'Pauzeren' : 'Hervatten'"
                >
                  {{ user.status === 'active' ? 'Pauzeren' : 'Hervatten' }}
                </button>
                <button
                  @click="handleResetToken(user.id)"
                  class="glass-btn glass-btn-secondary text-xs"
                  data-tooltip="Reset Token"
                >
                  <RefreshIcon class="w-3 h-3" />
                </button>
                <button
                  @click="openEditModal(user)"
                  class="glass-btn glass-btn-secondary text-xs"
                  data-tooltip="Bewerken"
                >
                  <PencilIcon class="w-3 h-3" />
                </button>
                <button
                  @click="handleDelete(user.id)"
                  class="glass-btn glass-btn-danger text-xs"
                  data-tooltip="Verwijderen"
                >
                  <TrashIcon class="w-3 h-3" />
                </button>
              </div>
            </td>
          </tr>
          
          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="text-center py-8 text-slate-400">
              Nog geen gebruikers aangemaakt. Klik op "Nieuwe Gebruiker" om te beginnen.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="filteredUsers.length > itemsPerPage" class="flex items-center justify-center gap-2">
      <button
        @click="prevPage"
        :disabled="currentPage === 1"
        class="glass-btn glass-btn-secondary disabled:opacity-50"
      >
        <ChevronLeftIcon class="w-5 h-5" />
      </button>
      <span class="px-4 py-2 bg-slate-800/50 rounded-xl text-sm">
        Pagina {{ currentPage }} van {{ totalPages }}
      </span>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="glass-btn glass-btn-secondary disabled:opacity-50"
      >
        <ChevronRightIcon class="w-5 h-5" />
      </button>
    </div>

    <!-- Add/Edit User Modal -->
    <transition name="fade">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box max-w-lg w-full" @click.stop>
          <div class="flex-between mb-4">
            <h3 class="text-xl font-extrabold text-white">
              {{ isEditing ? 'Gebruiker Bewerken' : 'Nieuwe Gebruiker Toevoegen' }}
            </h3>
            <button @click="closeModal" class="text-slate-400 hover:text-white text-2xl">
              ×
            </button>
          </div>

          <form @submit.prevent="saveUser" class="space-y-4">
            <div>
              <label class="form-label">Gebruikersnaam</label>
              <input
                type="text"
                v-model="form.username"
                required
                :disabled="isEditing"
                class="glass-input w-full"
                placeholder="bijv. vince-phone"
                :class="{ 'border-red-500': usernameError }"
                @blur="validateUsername"
              />
              <p v-if="usernameError" class="text-red-500 text-xs mt-1">{{ usernameError }}</p>
            </div>

            <div>
              <label class="form-label">Datalimiet in GB (0 = Onbeperkt)</label>
              <input
                type="number"
                v-model.number="form.dataLimitGb"
                min="0"
                class="glass-input w-full"
                placeholder="0"
              />
            </div>

            <div>
              <label class="form-label">Toegewezen Protocollen</label>
              <div class="space-y-2">
                <label
                  v-for="proto in protocolOptions"
                  :key="proto.value"
                  class="protocol-option"
                >
                  <input
                    type="checkbox"
                    :value="proto.value"
                    v-model="form.protocols"
                    class="w-5 h-5 accent-primary-500"
                  />
                  <span class="ml-3 text-white font-medium">{{ proto.label }}</span>
                </label>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                @click="closeModal"
                class="glass-btn glass-btn-secondary"
              >
                Annuleren
              </button>
              <button
                type="submit"
                :disabled="saving || usernameError"
                class="glass-btn glass-btn-primary"
              >
                <span v-if="saving">Bezig met opslaan...</span>
                <span v-else>
                  {{ isEditing ? 'Opslaan' : 'Aanmaken & Genereer Config' }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- QR Modal -->
    <QrCodeModal
      :isOpen="showQrModal"
      :username="selectedUsername"
      :subToken="selectedSubToken"
      @close="showQrModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../stores/users';
import { useToastStore } from '../stores/toast';
import { useFormat } from '../composables/useFormat';
import QrCodeModal from '../components/QrCodeModal.vue';
import {
  SearchIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  RefreshIcon,
  DownloadIcon,
  UploadIcon,
  QrCodeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../components/Icons';

const userStore = useUserStore();
const toastStore = useToastStore();
const { formatBytes } = useFormat();

const fileInput = ref<HTMLInputElement | null>(null);

// Modal States
const showModal = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const selectedUserId = ref('');
const showQrModal = ref(false);
const selectedUsername = ref('');
const selectedSubToken = ref('');

// Form State
const form = ref({
  username: '',
  dataLimitGb: 0,
  protocols: ['hysteria2', 'tuic', 'vless_reality']
});

const usernameError = ref('');

// Filter & Sort States
const searchQuery = ref('');
const statusFilter = ref('');
const sortKey = ref<'username' | 'status' | 'used_bytes' | 'data_limit_bytes'>('username');
const sortOrder = ref<'asc' | 'desc'>('asc');

// Pagination States
const currentPage = ref(1);
const itemsPerPage = 10;

// Selection States
const selectedUsers = ref<string[]>([]);

// Protocol Options
const protocolOptions = [
  { value: 'hysteria2', label: 'Hysteria 2 (UDP QUIC)' },
  { value: 'tuic', label: 'TUIC v5 (UDP 0-RTT)' },
  { value: 'vless_reality', label: 'VLESS + REALITY (TCP TLS)' },
];

// Computed Properties
const users = computed(() => userStore.users);

const filteredUsers = computed(() => {
  return users.value
    .filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                           user.uuid.toLowerCase().includes(searchQuery.value.toLowerCase());
      const matchesStatus = !statusFilter.value || user.status === statusFilter.value;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sortKey.value === 'username') {
        aVal = a.username.toLowerCase();
        bVal = b.username.toLowerCase();
      } else if (sortKey.value === 'status') {
        aVal = a.status;
        bVal = b.status;
      } else if (sortKey.value === 'used_bytes') {
        aVal = a.used_bytes || 0;
        bVal = b.used_bytes || 0;
      } else {
        aVal = a.data_limit_bytes || 0;
        bVal = b.data_limit_bytes || 0;
      }
      
      if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1;
      return 0;
    });
});

const totalUsedBytes = computed(() => {
  return users.value.reduce((acc, u) => acc + (u.used_bytes || 0), 0);
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredUsers.value.slice(start, end);
});

// Methods
function triggerFileInput() {
  fileInput.value?.click();
}

function validateUsername() {
  if (!form.value.username) {
    usernameError.value = 'Gebruikersnaam is verplicht';
    return false;
  }
  if (form.value.username.includes(' ')) {
    usernameError.value = 'Gebruikersnaam mag geen spaties bevatten';
    return false;
  }
  if (form.value.username.length < 3) {
    usernameError.value = 'Gebruikersnaam moet minimaal 3 tekens lang zijn';
    return false;
  }
  usernameError.value = '';
  return true;
}

function toggleSelectAll(e: Event) {
  const isChecked = (e.target as HTMLInputElement).checked;
  selectedUsers.value = isChecked ? filteredUsers.value.map(u => u.id) : [];
}

function clearSelection() {
  selectedUsers.value = [];
}

function sortBy(key: typeof sortKey.value) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

async function handleExportCSV() {
  try {
    const data = await userStore.exportUsers();
    const users = Array.isArray(data) ? data : (data.users || []);

    const headers = ['ID', 'Gebruikersnaam', 'UUID', 'Status', 'Dataverbruik', 'Datalimiet', 'Protocollen'];
    const rows = users.map(user => [
      user.id,
      user.username,
      user.uuid,
      user.status,
      formatBytes(user.used_bytes || 0),
      user.data_limit_bytes > 0 ? formatBytes(user.data_limit_bytes) : 'Onbeperkt',
      user.protocols.filter(p => p.is_enabled).map(p => getProtocolLabel(p.protocol_type)).join(', ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amnion-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toastStore.addToast('Gebruikers succesvol geëxporteerd als CSV!', 'success');
  } catch (err: any) {
    toastStore.addToast(err.response?.data?.error || 'Exporteren mislukt.', 'error');
  }
}

async function handleFileImport(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
  const reader = new FileReader();

  reader.onload = async (evt) => {
    try {
      const content = evt.target?.result as string;
      const parsed = JSON.parse(content);
      const userList = Array.isArray(parsed) ? parsed : (parsed.users || []);

      if (userList.length === 0) {
        toastStore.addToast('Geen geldige gebruikers gevonden in het bestand.', 'error');
        return;
      }

      const res = await userStore.importUsers(userList);
      toastStore.addToast(`✨ Succesvol ${res.importedUsersCount} gebruiker(s) geïmporteerd!`, 'success');
    } catch (err: any) {
      toastStore.addToast('Importeren mislukt. Zorg dat het een geldig Amnion JSON bestand is.', 'error');
    } finally {
      if (fileInput.value) fileInput.value.value = '';
    }
  };

  reader.readAsText(file);
}

async function handleToggleBlock(user: any) {
  const newStatus = user.status === 'active' ? 'disabled' : 'active';
  const actionText = newStatus === 'disabled' ? 'pauzeren' : 'deblokkeren';
  
  if (confirm(`Weet je zeker dat je gebruiker "${user.username}" wilt ${actionText}?`)) {
    try {
      await userStore.updateUser(user.id, { status: newStatus });
      toastStore.addToast(
        `Gebruiker "${user.username}" is nu ${newStatus === 'disabled' ? 'gepauzeerd' : 'weer actief'}!`,
        'success'
      );
    } catch (err: any) {
      toastStore.addToast(err.response?.data?.error || 'Status wijzigen mislukt.', 'error');
    }
  }
}

function openAddModal() {
  isEditing.value = false;
  selectedUserId.value = '';
  form.value = {
    username: '',
    dataLimitGb: 0,
    protocols: ['hysteria2', 'tuic', 'vless_reality']
  };
  usernameError.value = '';
  showModal.value = true;
}

function openEditModal(user: any) {
  isEditing.value = true;
  selectedUserId.value = user.id;
  const enabledProtos = user.protocols.filter((p: any) => p.is_enabled).map((p: any) => p.protocol_type);
  form.value = {
    username: user.username,
    dataLimitGb: user.data_limit_bytes ? Math.round(user.data_limit_bytes / (1024 * 1024 * 1024)) : 0,
    protocols: enabledProtos
  };
  usernameError.value = '';
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
}

async function saveUser() {
  if (!validateUsername()) return;
  
  saving.value = true;
  try {
    const dataLimitBytes = (form.value.dataLimitGb || 0) * 1024 * 1024 * 1024;
    
    if (isEditing.value) {
      await userStore.updateUser(selectedUserId.value, {
        dataLimitBytes,
        protocols: form.value.protocols
      });
      toastStore.addToast('Gebruiker en VPN configuratie succesvol bijgewerkt!', 'success');
      closeModal();
    } else {
      const newUser = await userStore.createUser({
        username: form.value.username.trim(),
        dataLimitBytes,
        protocols: form.value.protocols
      });
      toastStore.addToast(`Gebruiker "${newUser.username}" succesvol aangemaakt!`, 'success');
      closeModal();
      openQrModal(newUser);
    }
  } catch (err: any) {
    toastStore.addToast(err.response?.data?.error || err.message || 'Fout bij opslaan gebruiker.', 'error');
  } finally {
    saving.value = false;
  }
}

async function handleResetToken(id: string) {
  if (confirm('Weet je zeker dat je het subscriptie token wilt resetten? De oude QR-code wordt ongeldig.')) {
    try {
      await userStore.resetToken(id);
      toastStore.addToast('Subscriptie token succesvol vernieuwd!', 'success');
    } catch (err: any) {
      toastStore.addToast(err.response?.data?.error || 'Token resetten mislukt.', 'error');
    }
  }
}

async function handleDelete(id: string) {
  if (confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) {
    try {
      await userStore.deleteUser(id);
      toastStore.addToast('Gebruiker succesvol verwijderd.', 'success');
      clearSelection();
    } catch (err: any) {
      toastStore.addToast(err.response?.data?.error || 'Verwijderen mislukt.', 'error');
    }
  }
}

function openQrModal(user: any) {
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

async function bulkToggleStatus() {
  const newStatus = selectedUsers.value.every(id => {
    const user = users.value.find(u => u.id === id);
    return user?.status === 'active';
  }) ? 'disabled' : 'active';
  
  if (confirm(`Weet je zeker dat je ${selectedUsers.value.length} gebruikers wilt ${newStatus === 'disabled' ? 'pauzeren' : 'hervatten'}?`)) {
    try {
      await userStore.bulkUpdateUsers(selectedUsers.value, { status: newStatus });
      toastStore.addToast(`${selectedUsers.value.length} gebruikers succesvol bijgewerkt!`, 'success');
      clearSelection();
    } catch (err: any) {
      toastStore.addToast('Bulk actie mislukt.', 'error');
    }
  }
}

async function bulkDelete() {
  if (confirm(`Weet je zeker dat je ${selectedUsers.value.length} gebruikers wilt verwijderen?`)) {
    try {
      await userStore.bulkDeleteUsers(selectedUsers.value);
      toastStore.addToast(`${selectedUsers.value.length} gebruikers succesvol verwijderd.`, 'success');
      clearSelection();
    } catch (err: any) {
      toastStore.addToast('Bulk verwijderen mislukt.', 'error');
    }
  }
}

// Fetch users on mount
onMounted(() => {
  userStore.fetchUsers();
});
</script>

<style scoped>
/* Protocol Option */
.protocol-option {
  @apply flex items-center p-3 rounded-xl;
  @apply bg-slate-800/50 border border-slate-700/50;
  @apply cursor-pointer;
  @apply transition-all duration-200;
  @apply hover:bg-slate-700/50;
}

.protocol-option input[type="checkbox"] {
  @apply accent-emerald-500;
}

/* Sort Indicator */
.sort-indicator {
  @apply ml-1 text-xs;
}

/* Table Wrapper */
.table-wrapper {
  @apply overflow-x-auto rounded-xl border border-slate-800;
}

/* Light Mode Adjustments */
.light .protocol-option {
  @apply bg-slate-100/80 border-slate-200;
}

.light .table-wrapper {
  @apply border-slate-200;
}

.light .sort-indicator {
  @apply text-slate-600;
}
</style>
