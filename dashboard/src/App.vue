<template>
  <div class="app-wrapper min-h-screen flex flex-col transition-colors duration-300">
    <!-- Toast Container -->
    <div class="fixed bottom-5 right-5 z-[100] flex flex-col gap-3">
      <transition-group name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="toast"
          :class="{
            'bg-emerald-500/15 border-emerald-500/30 text-emerald-400': toast.type === 'success',
            'bg-red-500/15 border-red-500/30 text-red-400': toast.type === 'error',
            'bg-amber-500/15 border-amber-500/30 text-amber-400': toast.type === 'warning',
            'bg-cyan-500/15 border-cyan-500/30 text-cyan-400': toast.type === 'info',
          }"
        >
          <span class="text-lg">
            {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : toast.type === 'warning' ? '⚠' : 'ℹ' }}
          </span>
          <span>{{ toast.message }}</span>
          <button
            @click="toastStore.removeToast(toast.id)"
            class="ml-2 text-inherit hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      </transition-group>
    </div>

    <!-- Navbar -->
    <Navbar v-if="authStore.isAuthenticated" />

    <!-- Main Content -->
    <transition name="fade" mode="out-in">
      <main :class="authStore.isAuthenticated ? 'main-content' : 'main-content-full'">
        <router-view />
      </main>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from './stores/auth';
import { useToastStore } from './stores/toast';
import Navbar from './components/Navbar.vue';

const authStore = useAuthStore();
const toastStore = useToastStore();
</script>

<style scoped>
/* Toast Animations */
.toast-move,
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-active {
  position: absolute;
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

/* Main Content */
.main-content {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.main-content-full {
  flex: 1;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

/* Toast Styles */
.toast {
  @apply flex items-center gap-3 px-5 py-3 rounded-xl font-semibold shadow-lg;
  border: 1px solid currentColor;
  min-width: 280px;
}
</style>
