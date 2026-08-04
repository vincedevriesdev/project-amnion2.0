<template>
  <nav class="border-b border-white/10 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xl">
        A
      </div>
      <div>
        <span class="font-heading font-extrabold text-lg tracking-wide text-white">AMNION <span class="text-emerald-400">2.0</span></span>
        <span class="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Self-Hosted VPN Engine</span>
      </div>
    </div>

    <div class="flex items-center gap-6" v-if="authStore.isAuthenticated">
      <router-link to="/" class="nav-link" :class="{ 'active': $route.name === 'overview' }">Overzicht</router-link>
      <router-link to="/users" class="nav-link" :class="{ 'active': $route.name === 'users' }">Gebruikers</router-link>
      <router-link to="/logs" class="nav-link" :class="{ 'active': $route.name === 'logs' }">Logboeken</router-link>

      <button @click="handleLogout" class="btn-secondary text-xs px-3 py-1.5 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        Uitloggen
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'login' });
}
</script>

<style scoped>
.nav-link {
  color: #94a3b8;
  font-weight: 500;
  font-size: 0.9rem;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  font-weight: 600;
}
</style>
