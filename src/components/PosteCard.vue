<template>
  <div class="station-card" :class="{ 
    active: isRunning, 
    'ps4-active': isRunning && consoleValue === 'ps4', 
    'ps5-active': isRunning && consoleValue === 'ps5' 
  }">
    <div class="card-header">
      <div class="station-icon">
        <svg v-if="posteNumber <= 5" class="ps-icon" viewBox="0 0 24 24">
          <path d="M8.5,4.27C9.88,4.53 11.9,5.14 13,5.5C15.75,6.45 16.69,7.63 16.69,10.29C16.69,12.86 15.41,13.9 13.05,13.9C11.12,13.9 9.19,13.4 7.71,12.8C6.05,12.12 4.64,11.1 4,9.88L6.17,8.87C6.63,9.94 7.45,10.74 8.56,11.19C9.31,11.5 10.13,11.63 11.14,11.63C12.84,11.63 13.92,10.9 13.92,9.47C13.92,7.84 12.67,7.11 10.12,6.31C8.31,5.79 6.12,5.05 4.78,4.59L8.5,4.27M3.5,14.68C5.17,15.1 6.69,15.45 8.05,15.7C9.54,15.97 11.13,16.13 12.79,16.13C16.24,16.13 18.5,14.9 18.5,12.13C18.5,9.72 17.33,8.1 14.5,7.12L15.05,5.27C18.93,6.85 21,9.15 21,12.35C21,16.22 17.5,18.5 12.5,18.5C10.34,18.5 9.5,18.2 7.83,17.83L3.5,14.68Z" />
        </svg>
        <svg v-else class="ps-icon ps5" viewBox="0 0 24 24">
          <path d="M9.87,4.25C11.56,4.7 13.3,5.18 14.38,5.47C16.5,6 17.59,6.7 17.59,8.18C17.59,9.68 16.75,10.46 15.25,10.46C13.25,10.46 12.32,9.78 11.47,8.5C10.25,9.82 9.12,10.54 7.25,10.54C5.45,10.54 4.36,9.69 4.36,8.18C4.36,6.69 5.41,5.8 7.25,5.8C8,5.8 8.92,6 9.87,6.33C9.87,5.25 9.87,4.25 9.87,4.25M7.25,6.57C6,6.57 5.68,7.25 5.68,8.18C5.68,9.13 6.12,9.73 7.25,9.73C8.36,9.73 9.25,9.22 9.87,8.5C9.87,7.25 8.81,6.57 7.25,6.57M15.25,6.57C14,6.57 13.68,7.25 13.68,8.18C13.68,9.13 14.12,9.73 15.25,9.73C16.36,9.73 17.25,9.22 17.87,8.5C17.87,7.25 16.81,6.57 15.25,6.57M8.25,11.25C9.75,11.64 11.25,12.04 12.25,12.25C14.75,12.75 15.75,13.13 15.75,14.5C15.75,15.88 14.5,16.75 12.25,16.75C9.75,16.75 8.75,16.13 7.75,15.25C9,16.38 10.25,17 12.25,17C15,17 16.75,15.88 16.75,14.5C16.75,13.13 15.5,12.5 12.25,12C10.75,11.75 9.25,11.38 8.25,11.25M3.25,17C5.5,17.38 7.5,17.75 9.25,18C11.5,18.38 13.25,18.5 15.25,18.5C19.5,18.5 21.25,17.38 21.25,15.5C21.25,13.5 19.5,12.88 15.25,12.5C13.5,12.38 11.75,12.25 9.25,11.75C6.5,11.25 4.5,10.38 3.25,9.25V17Z" />
        </svg>
      </div>
      <h2 class="station-title">Station {{ posteNumber }}</h2>
      <div class="status-indicator" :class="{ active: isRunning }"></div>
    </div>

    <div class="player-selector">
      <select 
        v-model="playerCount" 
        class="player-select"
        :disabled="isRunning"
      >
        <option value="2">2 Players</option>
        <option value="4">4 Players</option>
      </select>
    </div>

    <div v-if="posteNumber === 6 || posteNumber === 7" class="console-selector">
      <select 
        v-model="consoleValue" 
        class="console-select"
        :disabled="isRunning"
      >
        <option value="ps4">PS4</option>
        <option value="ps5">PS5</option>
      </select>
    </div>

    <div class="station-info">
      <div class="info-row">
        <span class="info-label">Time:</span>
        <span class="info-value">{{ formattedTime }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Rate:</span>
        <span class="info-value">{{ hourlyRate.toFixed(2) }} TND/h</span>
      </div>
      <div class="info-row total">
        <span class="info-label">Total:</span>
        <span class="info-value">{{ price.toFixed(2) }} TND</span>
      </div>
    </div>

    <div class="action-buttons">
      <button 
        class="action-btn start" 
        @click="start"
        :disabled="isRunning"
      >
        <svg class="btn-icon" viewBox="0 0 24 24">
          <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
        </svg>
        Start
      </button>
      <button 
        class="action-btn stop" 
        @click="stop"
        :disabled="!isRunning"
      >
        <svg class="btn-icon" viewBox="0 0 24 24">
          <path d="M6,19H18V5H6V19Z" />
        </svg>
        Stop
      </button>
      <button 
        class="action-btn reset" 
        @click="reset"
      >
        <svg class="btn-icon" viewBox="0 0 24 24">
          <path d="M12,5V1L7,6L12,11V7A6,6 0 0,1 18,13A6,6 0 0,1 12,19A6,6 0 0,1 6,13H4A8,8 0 0,0 12,21A8,8 0 0,0 20,13A8,8 0 0,0 12,5Z" />
        </svg>
        Reset
      </button>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps<{ posteNumber: number }>();
const emit = defineEmits(['started', 'stopped', 'time-updated']);

const storageKey = `poste-${props.posteNumber}`;
const seconds = ref(0);
const isRunning = ref(false);
const timer = ref<number | null>(null);
const consoleValue = ref<'ps4' | 'ps5'>('ps4');
const playerCount = ref<'2' | '4'>('2');

const hourlyRate = computed(() => {
  if (props.posteNumber <= 5) {
    return playerCount.value === '4' ? 10 : 5;
  }
  
  if (consoleValue.value === 'ps5') {
    return playerCount.value === '4' ? 16 : 8;
  } else {
    return playerCount.value === '4' ? 10 : 5;
  }
});

const price = computed(() => {
  return (seconds.value / 3600) * hourlyRate.value;
});

const formattedTime = computed(() => {
  const h = Math.floor(seconds.value / 3600);
  const m = Math.floor((seconds.value % 3600) / 60);
  const s = seconds.value % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const start = async () => {
  if (!isRunning.value) {
    isRunning.value = true;
    await saveState();
    emit('started');
    timer.value = setInterval(() => {
      seconds.value++;
      emit('time-updated', props.posteNumber, price.value);
    }, 1000);
  }
};

const stop = async () => {
  if (isRunning.value) {
    isRunning.value = false;
    if (timer.value) clearInterval(timer.value);
    timer.value = null;
    await saveState();
    emit('stopped');
    emit('time-updated', props.posteNumber, price.value);
  }
};

const reset = async () => {
  if (confirm('Are you sure you want to reset this station?')) {
    await stop();
    seconds.value = 0;
    playerCount.value = '2';
    if (props.posteNumber <= 5) {
      consoleValue.value = 'ps4';
    }
    await deleteState();
  }
};

async function saveState() {
  try {
    const response = await fetch('/api/kv/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: storageKey,
        value: JSON.stringify({
          seconds: seconds.value,
          isRunning: isRunning.value,
          lastStart: isRunning.value ? Date.now() : null,
          console: consoleValue.value,
          playerCount: playerCount.value
        })
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save state');
    }
  } catch (error) {
    console.error('Error saving station state:', error);
  }
}

async function deleteState() {
  try {
    await fetch('/api/kv/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keys: [storageKey]
      }),
    });
  } catch (error) {
    console.error('Error deleting station state:', error);
  }
}

onMounted(async () => {
  try {
    const response = await fetch('/api/kv/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keys: [storageKey] }),
    });
    
    const data = await response.json();
    const stationData = data[storageKey];
    
    if (stationData) {
      const parsedData = JSON.parse(stationData);
      const { 
        seconds: savedSec = 0, 
        isRunning: wasRunning = false, 
        lastStart = null, 
        console: savedConsole = 'ps4',
        playerCount: savedPlayerCount = '2' 
      } = parsedData;
      
      seconds.value = savedSec;
      consoleValue.value = savedConsole;
      playerCount.value = savedPlayerCount;
      
      if (wasRunning && lastStart) {
        const elapsed = Math.floor((Date.now() - lastStart) / 1000);
        seconds.value += elapsed;
        start();
      }
      emit('time-updated', props.posteNumber, price.value);
    }
  } catch (e) {
    console.error('Failed to load station data:', e);
  }
});

watch([seconds, consoleValue, playerCount], () => {
  if (isRunning.value) {
    saveState();
    emit('time-updated', props.posteNumber, price.value);
  }
});

onBeforeUnmount(() => {
  if (timer.value) clearInterval(timer.value);
});
</script>


<style scoped>
.station-card {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.station-card.active {
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.2);
}

.station-card.ps4-active {
  border-color: #0070cc;
  box-shadow: 0 0 15px rgba(0, 112, 204, 0.2);
}

.station-card.ps5-active {
  border-color: #0072ce;
  box-shadow: 0 0 15px rgba(0, 114, 206, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  position: relative;
}

.station-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 229, 255, 0.1);
  border-radius: 8px;
}

.ps-icon {
  width: 24px;
  height: 24px;
  fill: var(--accent);
}

.ps-icon.ps5 {
  fill: #0072ce;
}

.station-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  margin-left: auto;
}

.status-indicator.active {
  background-color: #00e500;
  box-shadow: 0 0 8px rgba(0, 229, 0, 0.5);
}

.player-selector,
.console-selector {
  margin-bottom: 1rem;
}

.player-select,
.console-select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background-color: var(--stat-bg);
  color: var(--text-primary);
  font-family: inherit;
  cursor: pointer;
}

.player-select:disabled,
.console-select:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.station-info {
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.info-row.total {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
  font-weight: 600;
}

.info-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.info-value {
  color: var(--text-primary);
  font-family: 'Fira Code', monospace;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.action-btn.start {
  background-color: rgba(0, 200, 83, 0.1);
  color: #00c853;
}

.action-btn.start:not(:disabled):hover {
  background-color: #00c853;
  color: white;
}

.action-btn.stop {
  background-color: rgba(213, 0, 0, 0.1);
  color: #d50000;
}

.action-btn.stop:not(:disabled):hover {
  background-color: #d50000;
  color: white;
}

.action-btn.reset {
  background-color: rgba(41, 98, 255, 0.1);
  color: #2962ff;
}

.action-btn.reset:hover {
  background-color: #2962ff;
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
}
</style>