<template>
  <div class="login-wrapper">
    <!-- Glowing Ambient Background Orbs -->
    <div class="ambient-orb orb-1"></div>
    <div class="ambient-orb orb-2"></div>
    <div class="ambient-orb orb-3"></div>

    <div class="login-card">
      <!-- Top Brand Header -->
      <div style="text-align: center; margin-bottom: 36px; position: relative; z-index: 2;">
        <div style="margin: 0 auto 20px auto; display: flex; justify-content: center;">
          <AmnionLogo :size="68" />
        </div>
        <h1 style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 6px;">
          Project Amnion <span class="version-tag">2.0</span>
        </h1>
        <p style="font-size: 14px; color: rgba(226, 232, 240, 0.65); font-weight: 500;">
          Beveiligde Beheersomgeving & VPN Engine
        </p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" style="position: relative; z-index: 2;">
        <!-- Error Alert -->
        <div v-if="error" class="login-error-alert">
          <svg style="width: 18px; height: 18px; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{{ error }}</span>
        </div>

        <div class="form-group" style="margin-bottom: 20px;">
          <label class="form-label-custom">Gebruikersnaam</label>
          <div class="input-container">
            <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <input type="text" v-model="username" required class="input-field-custom" placeholder="Voer je gebruikersnaam in" />
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 28px;">
          <label class="form-label-custom">Wachtwoord</label>
          <div class="input-container">
            <svg class="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            <input type="password" v-model="password" required class="input-field-custom" placeholder="••••••••••••" />
          </div>
        </div>

        <button type="submit" :disabled="submitting" class="login-submit-btn">
          <span>{{ submitting ? 'Bezig met verifiëren...' : 'Inloggen op Dashboard' }}</span>
          <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </form>

      <!-- Bottom Security Tag -->
      <div style="margin-top: 32px; text-align: center; position: relative; z-index: 2;">
        <span style="font-size: 12px; color: rgba(226, 232, 240, 0.4); font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
          🔒 Argon2id Cryptografische Sleutelbeveiliging
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import AmnionLogo from '../components/AmnionLogo.vue';

const authStore = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

async function handleLogin() {
  error.value = '';
  submitting.value = true;
  try {
    await authStore.login(username.value, password.value);
    router.push({ name: 'overview' });
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Inloggen mislukt. Controleer je gegevens.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(circle at 50% 0%, #0d1527 0%, #070a12 60%, #030509 100%);
  position: relative;
  overflow: hidden;
}

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

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 44px 40px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 80px rgba(16, 185, 129, 0.05);
  position: relative;
}

.version-tag {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 20px;
}

.form-label-custom {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: rgba(226, 232, 240, 0.9);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  width: 18px;
  height: 18px;
  color: rgba(226, 232, 240, 0.4);
  pointer-events: none;
  transition: color 0.2s ease;
}

.input-field-custom {
  width: 100%;
  padding: 14px 16px 14px 46px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-field-custom:focus {
  background: rgba(30, 41, 59, 0.9);
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.input-field-custom:focus + .input-icon,
.input-container:focus-within .input-icon {
  color: #10b981;
}

.login-submit-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%);
  border: none;
  border-radius: 14px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);
}

.login-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(5, 150, 105, 0.45);
}

.login-submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-error-alert {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
