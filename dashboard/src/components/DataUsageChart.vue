<template>
  <div class="chart-container w-full h-64">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, type Ref } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const props = defineProps<{
  data: { label: string; value: number }[];
  type?: 'bar' | 'line' | 'doughnut' | 'pie';
  title?: string;
}>();

const chartCanvas: Ref<HTMLCanvasElement | null> = ref(null);
let chartInstance: Chart | null = null;

const defaultColors = {
  primary: 'rgba(16, 185, 129, 0.8)',
  cyan: 'rgba(6, 182, 212, 0.8)',
  purple: 'rgba(168, 85, 247, 0.8)',
  amber: 'rgba(245, 158, 11, 0.8)',
  red: 'rgba(239, 68, 68, 0.8)',
};

const lightModeColors = {
  primary: 'rgba(16, 185, 129, 0.6)',
  cyan: 'rgba(6, 182, 212, 0.6)',
  purple: 'rgba(168, 85, 247, 0.6)',
  amber: 'rgba(245, 158, 11, 0.6)',
  red: 'rgba(239, 68, 68, 0.6)',
};

function getColors() {
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? defaultColors : lightModeColors;
}

function renderChart() {
  if (!chartCanvas.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const colors = getColors();
  const chartType = props.type || 'bar';
  
  const datasets = [{
    label: props.title || 'Data',
    data: props.data.map(d => d.value),
    backgroundColor: Object.values(colors),
    borderColor: Object.keys(colors).map(k => k.replace('0.8', '1')),
    borderWidth: 1,
  }];

  if (chartType === 'bar') {
    datasets[0].backgroundColor = colors.primary;
    datasets[0].borderColor = 'rgba(16, 185, 129, 1)';
  } else if (chartType === 'doughnut' || chartType === 'pie') {
    datasets[0].backgroundColor = Object.values(colors);
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: chartType,
    data: {
      labels: props.data.map(d => d.label),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType !== 'bar',
          position: 'bottom',
          labels: {
            color: '#f8fafc',
            padding: 15,
            font: { size: 12 },
          },
        },
        title: {
          display: !!props.title,
          text: props.title,
          color: '#f8fafc',
          font: { size: 14, weight: 'bold' },
        },
      },
      scales: chartType === 'bar' || chartType === 'line' ? {
        y: {
          beginAtZero: true,
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
        },
        x: {
          ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
        },
      } : {},
    },
  });
}

onMounted(() => {
  renderChart();
});

watch(() => [props.data, props.type], () => {
  renderChart();
}, { deep: true });

// Re-render on theme change
const observer = new MutationObserver(() => {
  if (document.documentElement.classList.contains('dark') !== 
      document.documentElement.classList.contains('light')) {
    renderChart();
  }
});

onMounted(() => {
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});
</script>
