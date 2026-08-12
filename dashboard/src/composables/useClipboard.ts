// Project Amnion 2.0 - Clipboard Composables

import { ref } from 'vue';

export function useClipboard() {
  const copied = ref(false);
  const copyError = ref<string | null>(null);

  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;
      copyError.value = null;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
      return true;
    } catch (err) {
      copyError.value = 'Kopieeren mislukt. Probeer het handmatig.';
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
