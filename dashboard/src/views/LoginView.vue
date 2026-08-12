<template>
  <div class="login-wrapper min-h-screen flex items-center justify-center p-4 md:p-6">
    <!-- Ambient Background Orbs -->
    <div class="ambient-orb orb-1"></div>
    <div class="ambient-orb orb-2"></div>
    <div class="ambient-orb orb-3"></div>

    <div class="login-card w-full max-w-md">
      <!-- Brand Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-5">
          <AmnionLogo :size="68" />
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Project Amnion <span class="text-gradient">2.0</span>
        </h1>
        <p class="text-slate-400 mt-2 text-sm md:text-base">
          Beheer je VPN-server
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-5">
        <!-- Error Alert -->
        <transition name="fade">
          <div v-if="error" class="error-alert">
            <ExclamationIcon class="w-5 h-5 shrink-0" />
            <span>{{ error }}</span>
          </div>
        </transition>

        <!-- Username Field -->
        <div class="form-group">
          <label class="form-label">Gebruikersnaam</label>
          <div class="input-wrapper">
            <UserIcon class="input-icon" />
            <input
              type="text"
              v-model="username"
              required
              class="glass-input w-full !pl-12"
              placeholder="Voer je gebruikersnaam in"
              autocomplete="username"
              :disabled="submitting"
            />
          </div>
        </div>

        <!-- Password Field -->
        <div class="form-group">
          <label class="form-label">Wachtwoord</label>
          <div class="input-wrapper">
            <KeyIcon class="input-icon" />
            <input
              type="password"
              v-model="password"
              required
              class="glass-input w-full !pl-12"
              placeholder="Voer je wachtwoord in"
              autocomplete="current-password"
              :disabled="submitting"
            />
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="submitting"
          class="submit-btn w-full"
        >
          <span>{{ submitting ? 'Bezig met verifiëren...' : 'Inloggen' }}</span>
          <ArrowRightIcon class="w-5 h-5" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import AmnionLogo from '../components/AmnionLogo.vue';
import {
  UserIcon,
  KeyIcon,
  ArrowRightIcon,
  ExclamationIcon,
  ShieldCheckIcon,
} from '../components/Icons';

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

async function handleLogin() {
  error.value = '';
  submitting.value = true;
  
  try {
    await authStore.login(username.value.trim(), password.value);
    toastStore.addToast('Welkom terug!', 'success');
    router.push({ name: 'overview' });
  } catch (err: any) {
    error.value = err.response?.data?.error || 
                 err.message || 
                 'Inloggen mislukt. Controleer je gegevens.';
    toastStore.addToast(error.value, 'error');
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
/* Login Wrapper */
.login-wrapper {
  background: radial-gradient(circle at 50% 0%, #0d1527 0%, #070a12 60%, #030509 100%);
  position: relative;
  overflow: hidden;
}

/* Ambient Orbs */
.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: rgba(16, 185, 129, 0.12);
  top: -100px;
  left: 20%;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: rgba(6, 182, 212, 0.1);
  bottom: -150px;
  right: 15%;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: rgba(139, 92, 246, 0.08);
  top: 40%;
  left: 10%;
}

/* Login Card */
.login-card {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2rem;
  padding: 2.5rem 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 80px rgba(16, 185, 129, 0.05);
  position: relative;
  z-index: 1;
}

/* Form Elements */
.form-group {
  position: relative;
}

.form-label {
  @apply block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2;
}

.input-wrapper {
  @apply relative flex items-center;
}

.input-icon {
  @apply absolute left-4 w-5 h-5 text-slate-400 pointer-events-none transition-colors;
}

/* Error Alert */
.error-alert {
  @apply flex items-center gap-3 p-4 rounded-xl;
  @apply bg-red-500/15 border border-red-500/30;
  @apply text-red-400 text-sm font-semibold;
}

/* Submit Button */
.submit-btn {
  @apply flex items-center justify-center gap-3;
  @apply w-full py-4 rounded-xl;
  @apply bg-gradient-to-r from-emerald-600 to-cyan-600;
  @apply text-white font-bold text-sm;
  @apply shadow-lg shadow-emerald-500/30;
  @apply transition-all duration-200;
  @apply hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/40;
  @apply disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none;
}

/* Security Notice */
.security-notice {
  @apply text-xs text-slate-500;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Light Mode Adjustments */
.light .login-card {
  @apply bg-white/80 border-slate-200;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 80px rgba(16, 185, 129, 0.05);
}

.light .orb-1 { background: rgba(16, 185, 129, 0.05); }
.light .orb-2 { background: rgba(6, 182, 212, 0.05); }
.light .orb-3 { background: rgba(139, 92, 246, 0.03); }

.light .error-alert {
  @apply bg-red-100 border-red-200 text-red-600;
}

.light .submit-btn {
  @apply shadow-lg shadow-emerald-500/20;
}
</style>
