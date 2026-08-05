<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Systeem & Beveiligingsinstellingen</h1>
        <p class="page-subtitle">Beheer admin authenticatie, REALITY sleutels en updates</p>
      </div>

      <span class="badge badge-purple" style="font-size: 13px; padding: 8px 16px;">
        Project Amnion v2.0.41
      </span>
    </div>

    <!-- Alert Toast -->
    <div v-if="toastMessage" style="margin-bottom: 24px; padding: 16px; border-radius: 14px; font-size: 14px; font-weight: 500;" :style="toastSuccess ? 'background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399;' : 'background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5;'">
      {{ toastMessage }}
    </div>

    <div class="grid-2" style="margin-bottom: 32px;">
      <!-- 🔑 Change Password Form -->
      <div class="glass-card">
        <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">🔑 Beheerders Wachtwoord Wijzigen</h3>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">
          Wijzig het admin wachtwoord. Na het succesvol wijzigen word je automatisch uitgelogd.
        </p>

        <form @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label class="form-label">Huidig Wachtwoord</label>
            <input type="password" v-model="pwdForm.oldPassword" required class="input-field" placeholder="••••••••" />
          </div>

          <div class="form-group">
            <label class="form-label">Nieuw Wachtwoord (min. 8 tekens)</label>
            <input type="password" v-model="pwdForm.newPassword" required minlength="8" class="input-field" placeholder="••••••••" />
          </div>

          <div class="form-group" style="margin-bottom: 24px;">
            <label class="form-label">Bevestig Nieuw Wachtwoord</label>
            <input type="password" v-model="pwdForm.confirmPassword" required minlength="8" class="input-field" placeholder="••••••••" />
          </div>

          <button type="submit" :disabled="submitting" class="btn btn-primary" style="width: 100%;">
            {{ submitting ? 'Opslaan...' : 'Wachtwoord Opslaan & Uitloggen' }}
          </button>
        </form>
      </div>

      <!-- 🛡️ REALITY Sleutels & Systeem Info -->
      <div class="glass-card flex-col justify-between">
        <div>
          <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">🛡️ VLESS REALITY Sleuteldetails</h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
            Cryptografische Curve25519 sleutelpaar gegenereerd voor VLESS REALITY TLS camouflage.
          </p>

          <div class="form-group" v-if="systemStore.realityDetails">
            <label class="form-label">REALITY Public Key</label>
            <input type="text" readonly :value="systemStore.realityDetails.publicKey" class="input-field font-mono" style="font-size: 12px; color: #38bdf8;" />
          </div>

          <div class="form-group" v-if="systemStore.realityDetails">
            <label class="form-label">REALITY Short ID</label>
            <input type="text" readonly :value="systemStore.realityDetails.shortId" class="input-field font-mono" style="font-size: 12px; color: #c084fc;" />
          </div>
        </div>

        <div style="background: rgba(30, 41, 59, 0.6); padding: 16px; border-radius: 12px; border: 1px solid var(--border-glass); margin-top: 20px;">
          <div style="font-size: 12px; color: var(--text-muted);">
            💡 <strong style="color: #fff;">Privacy Garantie:</strong> SSL certificaten en private keys worden strikt opgeslagen in <code>/etc/amnion/env</code> met <code>0600</code> bestandpermissies.
          </div>
        </div>
      </div>
    </div>

    <!-- 🚀 Update & Rollback Engine Actions -->
    <div class="glass-card">
      <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 8px;">🔄 Systeem Updates & Rollback Engine</h3>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">
        Controleer live op GitHub of er een nieuwe Amnion 2.0 release beschikbaar is, voer geautomatiseerde updates uit of herstel via een tarball rollback.
      </p>

      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <button @click="handleCheckUpdates" :disabled="checkingUpdates" class="btn btn-secondary">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          {{ checkingUpdates ? 'Controleren...' : 'Controleer op Updates' }}
        </button>

        <button @click="handleTriggerUpdate" :disabled="updating" class="btn btn-primary">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          {{ updating ? 'Update Bezig...' : 'Amnion 2.0 Update Uitvoeren' }}
        </button>

        <button @click="handleTriggerRollback" :disabled="rollingBack" class="btn btn-danger">
          <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
          {{ rollingBack ? 'Rollback Bezig...' : 'Nood-Rollback Uitvoeren' }}
        </button>
      </div>
    </div>

    <!-- Live Update Progress Modal -->
    <UpdateProgressModal
      :isOpen="showUpdateModal"
      :step="systemStore.updateProgress.step"
      :progressPercent="systemStore.updateProgress.progressPercent"
      :message="systemStore.updateProgress.message"
      :isFinished="systemStore.updateProgress.progressPercent === 100"
      :isError="!!systemStore.updateProgress.error"
      @close="showUpdateModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useSystemStore } from '../stores/system';
import { useRouter } from 'vue-router';
import UpdateProgressModal from '../components/UpdateProgressModal.vue';

const authStore = useAuthStore();
const systemStore = useSystemStore();
const router = useRouter();

const pwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const submitting = ref(false);
const checkingUpdates = ref(false);
const updating = ref(false);
const rollingBack = ref(false);
const showUpdateModal = ref(false);

const toastMessage = ref('');
const toastSuccess = ref(true);

let pollTimer: any = null;

onMounted(() => {
  systemStore.fetchRealityInfo();
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

async function handleCheckUpdates() {
  checkingUpdates.value = true;
  toastMessage.value = '';
  try {
    const res = await systemStore.checkUpdates();
    toastSuccess.value = true;
    toastMessage.value = res.message || 'Controle voltooid.';
  } catch (err: any) {
    toastSuccess.value = false;
    toastMessage.value = 'Controleren op updates mislukt.';
  } finally {
    checkingUpdates.value = false;
  }
}

async function handleChangePassword() {
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    toastSuccess.value = false;
    toastMessage.value = 'Nieuwe wachtwoorden komen niet overeen.';
    return;
  }

  submitting.value = true;
  toastMessage.value = '';
  try {
    const res = await authStore.changePassword(pwdForm.value.oldPassword.trim(), pwdForm.value.newPassword.trim());
    toastSuccess.value = true;
    toastMessage.value = res.message || 'Wachtwoord succesvol gewijzigd! Je wordt nu uitgelogd...';
    
    pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };

    setTimeout(async () => {
      await authStore.logout();
      router.push({ name: 'login' });
    }, 2000);
  } catch (err: any) {
    toastSuccess.value = false;
    toastMessage.value = err.response?.data?.error || 'Wachtwoord wijzigen mislukt. Controleer je huidige wachtwoord.';
  } finally {
    submitting.value = false;
  }
}

async function handleTriggerUpdate() {
  if (!confirm('Weet je zeker dat je een geautomatiseerde update wilt uitvoeren? Er wordt eerst een backup gemaakt.')) return;
  updating.value = true;
  showUpdateModal.value = true;
  
  try {
    await systemStore.triggerUpdate();

    // Start polling update status every 2 seconds
    pollTimer = setInterval(async () => {
      const status = await systemStore.fetchUpdateStatus();
      if (status && (status.progressPercent === 100 || status.error)) {
        clearInterval(pollTimer);
      }
    }, 2000);
  } catch (err: any) {
    toastSuccess.value = false;
    toastMessage.value = err.response?.data?.error || 'Update kon niet worden gestart.';
  } finally {
    updating.value = false;
  }
}

async function handleTriggerRollback() {
  if (!confirm('Weet je zeker dat je een Rollback wilt uitvoeren naar de laatst bekende werkende staat?')) return;
  rollingBack.value = true;
  toastMessage.value = '';
  try {
    const res = await systemStore.triggerRollback();
    toastSuccess.value = true;
    toastMessage.value = res.message;
  } catch (err: any) {
    toastSuccess.value = false;
    toastMessage.value = err.response?.data?.error || 'Rollback mislukt.';
  } finally {
    rollingBack.value = false;
  }
}
</script>
