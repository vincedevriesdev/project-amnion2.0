<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;">
    <div class="glass-card" style="width: 100%; max-width: 440px; padding: 40px; position: relative;">
      
      <div style="text-align: center; margin-bottom: 32px;">
        <div class="brand-icon" style="margin: 0 auto 16px auto; width: 56px; height: 56px; font-size: 30px; border-radius: 16px;">
          A
        </div>
        <h1 style="font-size: 26px; font-weight: 800; color: #ffffff;">Project Amnion 2.0</h1>
        <p style="font-size: 14px; color: var(--text-muted); margin-top: 6px;">Log in op je VPN beheeromgeving</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div v-if="error" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; padding: 12px; border-radius: 12px; font-size: 14px; margin-bottom: 20px;">
          {{ error }}
        </div>

        <div class="form-group">
          <label class="form-label">Gebruikersnaam</label>
          <input type="text" v-model="username" required class="input-field" placeholder="admin" />
        </div>

        <div class="form-group" style="margin-bottom: 28px;">
          <label class="form-label">Wachtwoord</label>
          <input type="password" v-model="password" required class="input-field" placeholder="••••••••" />
        </div>

        <button type="submit" :disabled="submitting" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 16px;">
          {{ submitting ? 'Inloggen...' : 'Inloggen op Dashboard' }}
        </button>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

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
