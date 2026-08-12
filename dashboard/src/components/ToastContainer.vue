<template>
  <div class="fixed bottom-5 right-5 z-[100] flex flex-col gap-3">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="getToastClasses(toast.type)"
        @click="removeToast(toast.id)"
      >
        <span class="toast-icon">
          {{ getToastIcon(toast.type) }}
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close">×</button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToastStore } from '../stores/toast';
import type { Toast } from '../types';

const toastStore = useToastStore();
const { toasts, removeToast } = toastStore;

function getToastClasses(type: Toast['type']): string {
  const base = 'flex items-center gap-3 px-5 py-3 rounded-xl font-semibold shadow-lg border';
  const variants = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/15 border-red-500/30 text-red-400',
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    info: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  };
  return `${base} ${variants[type]}`;
}

function getToastIcon(type: Toast['type']): string {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };
  return icons[type];
}
</script>

<style scoped>
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

.toast {
  min-width: 280px;
  cursor: pointer;
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-message {
  flex: 1;
}

.toast-close {
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}
</style>
