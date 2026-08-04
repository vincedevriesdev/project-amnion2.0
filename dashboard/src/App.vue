<template>
  <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
    <Navbar v-if="authStore.isAuthenticated" />
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();
</script>
