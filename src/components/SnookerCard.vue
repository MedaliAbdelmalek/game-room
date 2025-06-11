<template>
  <div class="snooker-card" :class="{ active: isRunning }">
    <div class="card-header" :style="{ backgroundImage: 'url(https://media.istockphoto.com/id/484690968/photo/opening-frame-of-snooker-game-with-cue-from-back.jpg?s=612x612&w=0&k=20&c=NSNBhy45SbbeudWwV1rXYtXA6oioRtxk7oxBeg9RxDI=)' }">
      <h2 class="station-title">Snooker Table</h2>
      <div class="status-indicator" :class="{ active: isRunning }"></div>
    </div>

    <div class="station-info">
      <div class="info-row">
        <span class="info-label">Time:</span>
        <span class="info-value">{{ formattedTime }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Rate:</span>
        <span class="info-value">10.00 TND/h</span>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const emit = defineEmits(['started', 'stopped', 'time-updated']);

const storageKey = 'snooker-table';
const seconds = ref(0);
const isRunning = ref(false);
const timer = ref<number | null>(null);
const startTime = ref<number | null>(null);
const hourlyRate = 10; // Fixed at 10 TND/h for snooker

const price = computed(() => {
  return (seconds.value / 3600) * hourlyRate;
});

const formattedTime = computed(() => {
  const h = Math.floor(seconds.value / 3600);
  const m = Math.floor((seconds.value % 3600) / 60);
  const s = seconds.value % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const calculateElapsedTime = () => {
  if (startTime.value && isRunning.value) {
    return Math.floor((Date.now() - startTime.value) / 1000);
  }
  return seconds.value;
};

const start = async () => {
  if (!isRunning.value) {
    isRunning.value = true;
    startTime.value = Date.now() - (seconds.value * 1000);
    await saveState();
    emit('started');
    
    timer.value = setInterval(() => {
      seconds.value = calculateElapsedTime();
      emit('time-updated', 'snooker', price.value);
    }, 1000);
  }
};

const stop = async () => {
  if (isRunning.value) {
    isRunning.value = false;
    if (timer.value) clearInterval(timer.value);
    timer.value = null;
    
    seconds.value = calculateElapsedTime();
    startTime.value = null;
    
    await saveState();
    emit('stopped');
    // Emit with shouldSaveToKV=true
    emit('time-updated', 'snooker', price.value, true);
  }
};

const reset = async () => {
  if (confirm('Are you sure you want to reset the snooker table timer?')) {
    // Get final price before resetting
    const finalPrice = price.value;
    
    await stop();
    seconds.value = 0;
    startTime.value = null;
    
    // Emit the final price (not 0) with shouldSaveToKV=true
    emit('time-updated', 'snooker', finalPrice, true);
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
          startTime: startTime.value
        })
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save snooker state');
    }
  } catch (error) {
    console.error('Error saving snooker state:', error);
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
    console.error('Error deleting snooker state:', error);
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
    const snookerData = data[storageKey];
    
    if (snookerData) {
      const { 
        seconds: savedSec = 0, 
        isRunning: wasRunning = false, 
        startTime: savedStartTime = null 
      } = JSON.parse(snookerData);
      
      if (wasRunning && savedStartTime) {
        isRunning.value = true;
        startTime.value = savedStartTime;
        seconds.value = calculateElapsedTime();
        
        timer.value = setInterval(() => {
          seconds.value = calculateElapsedTime();
          emit('time-updated', 'snooker', price.value);
        }, 1000);
        
        emit('started');
      } else {
        seconds.value = savedSec;
        startTime.value = null;
      }
      
      emit('time-updated', 'snooker', price.value);
    }
  } catch (e) {
    console.error('Failed to load snooker data:', e);
  }
});

onBeforeUnmount(() => {
  if (timer.value) clearInterval(timer.value);
});
</script>

<style scoped>
.snooker-card {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  grid-column: 1 / -1;

}

.snooker-card.active {
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.2);
  border-color: var(--accent);
}

.card-header {
  height: 200px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  padding: 1rem;
  position: relative;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}

.card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
}

.station-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  position: relative;
  z-index: 1;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ccc;
  margin-left: auto;
  position: relative;
  z-index: 1;
}

.status-indicator.active {
  background-color: #00e500;
  box-shadow: 0 0 8px rgba(0, 229, 0, 0.5);
}

.station-info {
  padding: 1.5rem;
  margin-bottom: 0;
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
  padding: 0 1.5rem 1.5rem;
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
  
  .snooker-card {
    max-width: 100%;
  }
}
</style>