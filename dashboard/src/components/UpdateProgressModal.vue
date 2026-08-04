<template>
  <div class="modal-backdrop" v-if="isOpen">
    <div class="modal-box" style="max-width: 520px;">
      <div class="flex-between" style="margin-bottom: 16px;">
        <h3 style="font-size: 20px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 10px;">
          <span style="width: 12px; height: 12px; border-radius: 50%; display: inline-block;" :style="isFinished ? 'background: #34d399;' : 'background: #38bdf8;' " class="animate-pulse"></span>
          {{ isFinished ? 'Update Voltooid' : 'Amnion 2.0 Live Update' }}
        </h3>
        <button v-if="isFinished || isError" @click="close" style="background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer;">&times;</button>
      </div>

      <!-- Live Progress Bar -->
      <div style="margin-bottom: 24px;">
        <div class="flex-between" style="margin-bottom: 8px;">
          <span style="font-size: 13px; font-weight: 700; color: var(--text-muted);">Voortgang</span>
          <span class="font-mono text-cyan" style="font-weight: 800; font-size: 14px;">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar" style="height: 12px; background: rgba(255,255,255,0.08);">
          <div class="progress-fill" style="background: linear-gradient(90deg, #06b6d4 0%, #10b981 100%); transition: width 0.4s ease;" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- Current Step Message -->
      <div style="background: rgba(30, 41, 59, 0.6); padding: 18px; border-radius: 14px; border: 1px solid var(--border-glass); margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); font-weight: 700; margin-bottom: 6px;">
          {{ isError ? 'Foutmelding' : `Stap ${step}/5` }}
        </div>
        <div style="font-size: 14px; font-weight: 600; color: #fff; line-height: 1.5;">
          {{ message }}
        </div>
      </div>

      <!-- Auto reload on completion -->
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button v-if="isFinished" @click="reloadPage" class="btn btn-primary" style="width: 100%;">
          🎉 Pagina Herladen
        </button>
        <button v-else-if="isError" @click="close" class="btn btn-secondary" style="width: 100%;">
          Sluiten
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  step: number;
  progressPercent: number;
  message: string;
  isFinished: boolean;
  isError: boolean;
}>();

const emit = defineEmits(['close']);

function close() {
  emit('close');
}

function reloadPage() {
  window.location.reload();
}
</script>
