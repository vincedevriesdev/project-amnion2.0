<template>
  <div class="amnion-logo-box" :style="{ width: size + 'px', height: size + 'px' }">
    <div class="logo-glow"></div>
    <svg viewBox="0 0 100 100" class="logo-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient :id="'logoGrad-' + instanceId" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#34d399" />
          <stop offset="50%" stop-color="#10b981" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>

      <!-- Outer Stylized Geometric 'A' Inspired by User Reference -->
      <!-- Left leg slant up to apex, right leg slant down, connected by sharp diagonal crossbar -->
      <path
        d="M 50 12 
           L 84 86 
           L 68 86 
           L 59 65 
           L 35 65 
           L 27 86 
           L 12 86 
           Z 
           M 50 30 
           L 41 53 
           L 59 53 
           Z"
        :fill="'url(#logoGrad-' + instanceId + ')'"
        fill-rule="evenodd"
      />
      <!-- Sharp Futuristic Crossbar Accent Line -->
      <path
        d="M 33 65 
           L 67 65 
           L 61 54 
           L 43 54 
           Z"
        :fill="'url(#logoGrad-' + instanceId + ')'"
        opacity="0.95"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(defineProps<{
  size?: number;
}>(), {
  size: 40
});

const instanceId = ref(Math.random().toString(36).substring(2, 9));
</script>

<style scoped>
.amnion-logo-box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(6, 182, 212, 0.3) 100%);
  border-radius: 30%;
  filter: blur(8px);
  opacity: 0.7;
}

.logo-svg {
  position: relative;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 8px rgba(16, 185, 129, 0.3));
}
</style>
