<template>
  <div class="modal-backdrop" v-if="isOpen" @click.self="close">
    <div class="modal-box">
      <div class="flex-between" style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 800; color: #fff;">Hiddify Config - {{ username }}</h3>
        <button @click="close" style="background: none; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer;">&times;</button>
      </div>

      <div style="background: #ffffff; padding: 20px; border-radius: 16px; display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">
        <div v-html="qrSvg" v-if="qrSvg" style="width: 100%; max-width: 240px; display: flex; justify-content: center;"></div>
        <div v-else style="color: #64748b; font-size: 14px;">QR Code laden...</div>
      </div>

      <div class="form-group">
        <label class="form-label">Hiddify Subscription URL</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" readonly :value="subUrl" class="input-field font-mono" style="font-size: 12px;" />
          <button @click="copySubUrl" class="btn btn-primary btn-sm" style="white-space: nowrap;">
            {{ copied ? 'Gekopieerd!' : 'Kopiëren' }}
          </button>
        </div>
      </div>

      <div style="font-size: 12px; color: var(--text-muted); background: rgba(30, 41, 59, 0.6); padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-glass);">
        💡 <strong style="color: #fff;">Hoe te gebruiken:</strong> Open de <span class="text-emerald">Hiddify Next</span> app op je telefoon/PC en kies <em>"Import from Clipboard"</em> of scan de QR-code.
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
