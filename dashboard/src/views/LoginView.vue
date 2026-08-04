<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="glass-card p-8 w-full max-w-md relative overflow-hidden">
      <div class="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>

      <div class="text-center mb-8">
        <div class="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400 font-extrabold text-2xl mx-auto mb-3">
          A
        </div>
        <h1 class="text-2xl font-extrabold text-white">Project Amnion 2.0</h1>
        <p class="text-sm text-slate-400 mt-1">Log in op je VPN beheeromgeving</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div v-if="error" class="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {{ error }}
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Gebruikersnaam</label>
          <input type="text" v-model="username" required class="input-field" placeholder="admin" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Wachtwoord</label>
          <input type="password" v-model="password" required class="input-field" placeholder="••••••••" />
        </div>

        <button type="submit" :disabled="submitting" class="btn-primary w-full justify-center py-3 text-base">
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
    error.value = err.response?.data?.error || 'Inloggen mislukt. Controleer gegevens.';
  } finally {
    submitting.value = false;
  }
}
</script>
