<template>
  <transition name="fade">
    <div v-if="isOpen" class="modal-backdrop" @click.self="close">
      <div class="modal-box max-w-md w-full" @click.stop>
        <div class="flex-between mb-4">
          <h3 class="text-xl font-extrabold text-white">
            Hiddify Config - {{ username }}
          </h3>
          <button @click="close" class="text-slate-400 hover:text-white text-2xl">
            ×
          </button>
        </div>

        <div class="bg-white p-5 rounded-2xl flex justify-center items-center mb-6">
          <div v-html="qrSvg" v-if="qrSvg" class="w-full max-w-xs"></div>
          <div v-else class="text-slate-500 text-sm">QR Code laden...</div>
        </div>

        <div class="space-y-3">
          <label class="form-label">Hiddify Subscription URL</label>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              :value="subUrl"
              class="glass-input flex-1 font-mono text-xs"
            />
            <button
              @click="copySubUrl"
              class="glass-btn glass-btn-primary"
              :class="{ 'bg-emerald-600': copied }"
            >
              <CopyIcon class="w-4 h-4" />
              <span>{{ copied ? 'Gekopieerd!' : 'Kopieer' }}</span>
            </button>
          </div>
        </div>

        <div class="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <p class="text-sm text-white font-medium mb-1">
            <InformationCircleIcon class="w-4 h-4 inline-block mr-2 text-cyan-500" />
            Hoe te gebruiken:
          </p>
          <p class="text-xs text-slate-400">
            Open de <span class="text-emerald-500 font-bold">Hiddify Next</span> app op je telefoon/PC 
            en kies <em class="text-cyan-400">"Import from Clipboard"</em> of scan de QR-code.
          </p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from '../api/client';
import { useClipboard } from '../composables/useClipboard';
import { CopyIcon, InformationCircleIcon } from '../components/Icons';

const props = defineProps<{
  isOpen: boolean;
  username: string;
  subToken: string;
}>();

const emit = defineEmits(['close']);

const qrSvg = ref<string>('');
const subUrl = ref<string>('');
const { copied, copyToClipboard } = useClipboard();

watch(() => props.isOpen, async (val) => {
  if (val && props.subToken) {
    const origin = window.location.origin;
    subUrl.value = `${origin}/api/v1/sub/${props.subToken}`;
    try {
      const res = await api.get(`/sub/qr/svg?text=${encodeURIComponent(subUrl.value)}`);
      qrSvg.value = res.data;
    } catch {
      qrSvg.value = '';
    }
  }
});

function copySubUrl() {
  copyToClipboard(subUrl.value);
}

function close() {
  emit('close');
}
</script>
