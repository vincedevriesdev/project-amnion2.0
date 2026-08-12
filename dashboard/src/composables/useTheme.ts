// Project Amnion 2.0 - Theme Composables

import { ref, onMounted, watch } from 'vue';

export function useTheme() {
  const isDark = ref<boolean>(true);
  const theme = ref<'dark' | 'light'>('dark');

  function toggleTheme() {
    isDark.value = !isDark.value;
    theme.value = isDark.value ? 'dark' : 'light';
    updateTheme();
  }

  function setTheme(newTheme: 'dark' | 'light') {
    theme.value = newTheme;
    isDark.value = newTheme === 'dark';
    updateTheme();
  }

  function updateTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', theme.value);
  }

  function checkSystemPreference() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  onMounted(() => {
    checkSystemPreference();
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  });

  return {
    isDark,
    theme,
    toggleTheme,
    setTheme,
  };
}
