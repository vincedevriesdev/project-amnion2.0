<template>
  <div class="modal-backdrop" v-if="isOpen" @click.self="close">
    <div class="glass-card p-6 w-full max-w-md relative animate-fadeIn">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-heading font-bold text-white">Hiddify Configuraie - {{ username }}</h3>
        <button @click="close" class="text-slate-400 hover:text-white">&times;</button>
      </div>

      <div class="bg-white p-4 rounded-xl flex items-center justify-center mb-4 border border-slate-200">
        <div v-html="qrSvg" v-if="qrSvg" class="w-full flex justify-center"></div>
        <div v-else class="text-slate-500 text-sm">QR Code laden...</div>
      </div>

      <div class="mb-4">
        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hiddify Subscription URL</label>
        <div class="flex gap-2">
          <input type="text" readonly :value="subUrl" class="input-field text-xs font-mono" />
          <button @click="copySubUrl" class="btn-primary text-xs shrink-0">
            {{ copied ? 'Gekopieerd!' : 'Kopiëren' }}
          </button>
        </div>
      </div>

      <div class="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-white/5">
        💡 <strong class="text-slate-300">Hoe te gebruiken:</strong> Open de <span class="text-emerald-400">Hiddify Next</span> app op je telefoon/PC en scanklik op <em>"Import from Clipboard"</em> of scan de QR-code.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from '../api/client';

const props = defineProps<{
  isOpen: boolean;
  username: string;
  subToken: string;
}>();

const emit = defineEmits(['close']);

const qrSvg = ref<string>('');
const copied = ref<boolean>(false);
const subUrl = ref<string>('');

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
  navigator.clipboard.writeText(subUrl.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

function close() {
  emit('close');
}
</script>
