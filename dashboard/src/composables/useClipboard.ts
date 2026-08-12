// Project Amnion 2.0 - Clipboard Composables with HTTP/HTTPS Fallbacks

import { ref } from 'vue';
import { useToastStore } from '../stores/toast';

export function useClipboard() {
  const copied = ref(false);
  const copyError = ref<string | null>(null);

  async function copyToClipboard(text: string): Promise<boolean> {
    const toastStore = useToastStore();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for HTTP / non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (!successful) throw new Error('execCommand failed');
      }

      copied.value = true;
      copyError.value = null;
      toastStore.addToast('Subscription URL gekopieerd naar klembord!', 'success');
      setTimeout(() => {
        copied.value = false;
      }, 2000);
      return true;
    } catch (err) {
      copyError.value = 'Kopiëren mislukt.';
      toastStore.addToast('Kopiëren mislukt. Selecteer de tekst handmatig.', 'error');
      copied.value = false;
      return false;
    }
  }

  return {
    copied,
    copyError,
    copyToClipboard,
  };
}
