<template>
  <div class="chart-container w-full h-64">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useFormat } from '../composables/useFormat';

Chart.register(...registerables);

const props = defineProps<{
  data: { label: string; value: number }[];
  type?: 'bar' | 'line' | 'doughnut' | 'pie';
  title?: string;
}>();

const { formatBytes } = useFormat();

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
  const isLight = document.documentElement.classList.contains('light');
  return isLight ? lightModeColors : defaultColors;
}

function updateOrCreateChart() {
  if (!chartCanvas.value) return;

  const colors = getColors();
  const chartType = props.type || 'bar';
  const labels = props.data.map(d => d.label);
  const dataValues = props.data.map(d => d.value);

  // If chart already exists, update data smoothly without replaying entrance animation
  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = dataValues;
    chartInstance.update('none');
    return;
  }

  const datasets = [{
    label: props.title || 'Dataverbruik',
    data: dataValues,
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

  const isLight = document.documentElement.classList.contains('light');

  chartInstance = new Chart(chartCanvas.value, {
    type: chartType,
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400
      },
      plugins: {
        legend: {
          display: chartType !== 'bar',
          position: 'bottom',
          labels: {
            color: isLight ? '#334155' : '#f8fafc',
            padding: 15,
            font: { size: 12 },
          },
        },
        title: {
          display: !!props.title,
          text: props.title,
          color: isLight ? '#0f172a' : '#f8fafc',
          font: { size: 14, weight: 'bold' },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const val = Number(context.raw || 0);
              if (chartType === 'bar' || chartType === 'line') {
                return ` Verbruik: ${formatBytes(val)}`;
              }
              return ` ${context.label}: ${val} verbindingen`;
            }
          }
        }
      },
      scales: chartType === 'bar' || chartType === 'line' ? {
        y: {
          beginAtZero: true,
          ticks: {
            color: isLight ? '#64748b' : '#94a3b8',
            callback: (value) => formatBytes(Number(value))
          },
          grid: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)' },
        },
        x: {
          ticks: { color: isLight ? '#64748b' : '#94a3b8', maxRotation: 45, minRotation: 45 },
          grid: { color: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)' },
        },
      } : {},
    },
  });
}

onMounted(() => {
  updateOrCreateChart();
});

watch(() => [props.data, props.type], () => {
  updateOrCreateChart();
}, { deep: true });

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>
