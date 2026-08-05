<template>
  <nav class="navbar">
    <router-link to="/" class="nav-brand">
      <AmnionLogo :size="38" />
      <div>
        <div class="brand-title">AMNION <span>2.0</span></div>
        <div class="brand-subtitle">Self-Hosted VPN Engine</div>
      </div>
    </router-link>

    <div class="nav-menu" v-if="authStore.isAuthenticated">
      <router-link to="/" class="nav-item" :class="{ 'active': $route.name === 'overview' }">Overzicht</router-link>
      <router-link to="/users" class="nav-item" :class="{ 'active': $route.name === 'users' }">Gebruikers</router-link>
      <router-link to="/analytics" class="nav-item" :class="{ 'active': $route.name === 'analytics' }">Analyses</router-link>
      <router-link to="/logs" class="nav-item" :class="{ 'active': $route.name === 'logs' }">Logboeken</router-link>
      <router-link to="/settings" class="nav-item" :class="{ 'active': $route.name === 'settings' }">Instellingen</router-link>

      <button @click="handleLogout" class="btn btn-secondary btn-sm" style="margin-left: 12px;">
        <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        Uitloggen
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import AmnionLogo from './AmnionLogo.vue';

const authStore = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await authStore.logout();
  router.push({ name: 'login' });
}
</script>
