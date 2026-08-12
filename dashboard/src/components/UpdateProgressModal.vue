<template>
  <transition name="fade">
    <div v-if="isOpen" class="modal-backdrop" @click.self="close">
      <div class="modal-box max-w-lg w-full" @click.stop>
        <div class="flex-between mb-4">
          <h3 class="text-xl font-extrabold text-white flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full"
              :class="isFinished ? 'bg-emerald-500' : 'bg-cyan-500 animate-pulse'"
            ></span>
            {{ isFinished ? '✨ Update Voltooid' : 'Amnion 2.0 Live Update' }}
          </h3>
          <button
            v-if="isFinished || isError"
            @click="close"
            class="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6">
          <div class="flex-between mb-2">
            <span class="text-sm font-bold text-slate-400">Voortgang</span>
            <span class="font-mono text-cyan-500 font-bold">{{ isFinished ? 100 : progressPercent }}%</span>
          </div>
          <div class="progress-bar h-3">
            <div
              class="progress-fill bg-gradient-to-r from-cyan-500 to-emerald-500"
              :style="{ width: (isFinished ? 100 : progressPercent) + '%' }"
            ></div>
          </div>
        </div>

        <!-- Current Step Message -->
        <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6">
          <div class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {{ isError ? 'Foutmelding' : (isFinished ? 'Stap 5/5' : `Stap ${step}/5`) }}
          </div>
          <div class="text-sm font-semibold text-white">
            {{ isFinished ? '🎉 Update succesvol voltooid! Amnion 2.0 is nu bijgewerkt. Pagina wordt automatisch ververst...' : message }}
          </div>
        </div>

        <!-- Auto reload on completion -->
        <div class="flex justify-end">
          <button
            v-if="isFinished"
            @click="reloadPage"
            class="glass-btn glass-btn-primary w-full"
          >
            🎉 Pagina Nu Herladen
          </button>
          <button
            v-else-if="isError"
            @click="close"
            class="glass-btn glass-btn-secondary w-full"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  step: number;
  progressPercent: number;
  message: string;
  isFinished: boolean;
  isError: boolean;
}>();

const emit = defineEmits(['close']);

watch(() => props.isFinished, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }
});

function close() {
  emit('close');
}

function reloadPage() {
  window.location.reload();
}
</script>
