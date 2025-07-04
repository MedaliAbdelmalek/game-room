<template>
  <div :class="['app', isDark ? 'dark' : 'light']">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">
          <svg class="playstation-icon" viewBox="0 0 24 24">
            <path d="M9.5,4.27C10.88,4.53 12.9,5.14 14,5.5C16.75,6.45 17.69,7.63 17.69,10.29C17.69,12.86 16.41,13.9 14.05,13.9C12.12,13.9 10.19,13.4 8.71,12.8C7.05,12.12 5.64,11.1 5,9.88L7.17,8.87C7.63,9.94 8.45,10.74 9.56,11.19C10.31,11.5 11.13,11.63 12.14,11.63C13.84,11.63 14.92,10.9 14.92,9.47C14.92,7.84 13.67,7.11 11.12,6.31C9.31,5.79 7.12,5.05 5.78,4.59L9.5,4.27M4.5,14.68C6.17,15.1 7.69,15.45 9.05,15.7C10.54,15.97 12.13,16.13 13.79,16.13C17.24,16.13 19.5,14.9 19.5,12.13C19.5,9.72 18.33,8.1 15.5,7.12L16.05,5.27C19.93,6.85 22,9.15 22,12.35C22,16.22 18.5,18.5 13.5,18.5C11.34,18.5 9.5,18.2 7.83,17.83L4.5,14.68Z" />
          </svg>
          <h1 class="title">Sydney Game Room </h1>
        </div>
        <div class="header-controls">
          <div class="mode-toggle">
            <span class="mode-icon">{{ isDark ? '🌙' : '☀️' }}</span>
            <label class="switch">
              <input type="checkbox" v-model="isDark" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="current-time">
            {{ currentTime }}
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="stats-summary">
        <div class="stat-card">
          <div class="stat-value">{{ totalPlayedRevenue.toFixed(2) }} TND</div>
          <div class="stat-label">Total Played Revenue</div>
          <button class="reset-revenue-btn" @click="showResetDialog">Reset</button>
        </div>
      </div>

      <div class="stations-grid">
        <PosteCard 
          v-for="n in 7" 
          :key="n" 
          :posteNumber="n" 
          @started="handleStationStart"
          @stopped="handleStationStop"
          @time-updated="handleTimeUpdate"
        />
        
        <SnookerCard
          @started="handleStationStart"
          @stopped="handleStationStop"
          @time-updated="handleTimeUpdate"
        />
      </div>
    </main>

    <!-- Reset Confirmation Modal -->
    <div v-if="showResetModal" class="modal-overlay" @click="closeResetDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Reset Total Revenue</h3>
          <button class="close-btn" @click="closeResetDialog">&times;</button>
        </div>
        <div class="modal-body">
          <p>Enter the confirmation code to reset the total revenue:</p>
          <input 
            type="password" 
            v-model="resetCode" 
            class="code-input"
            placeholder="Enter code"
            maxlength="8"
            @keyup.enter="confirmReset"
            ref="codeInput"
          />
          <div v-if="resetError" class="error-message">
            {{ resetError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeResetDialog">Cancel</button>
          <button class="confirm-btn" @click="confirmReset" :disabled="!resetCode">
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import PosteCard from './components/PosteCard.vue';
import SnookerCard from './components/SnookerCard.vue';

const isDark = ref(true);
const currentTime = ref('');
const activeStations = ref(0);
const totalPlayedRevenue = ref(0);
const stationRevenues = ref<Record<number | string, number>>({});

// Reset modal state
const showResetModal = ref(false);
const resetCode = ref('');
const resetError = ref('');
const codeInput = ref<HTMLInputElement | null>(null);

const RESET_PASSCODE = '14061995';

// Update current time every second
let timeInterval: number;
onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
  
  // Load theme preference from localStorage (client-side only)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('isDark');
    if (saved !== null) {
      isDark.value = JSON.parse(saved);
    }
  }

  // Initialize KV data
  initializeKVData();
});

async function initializeKVData() {
  try {
    const response = await fetch('/api/kv/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keys: ['totalPlayedRevenue', 'stationRevenues'] }),
    });
    
    const data = await response.json();
    
    if (data.totalPlayedRevenue) {
      totalPlayedRevenue.value = parseFloat(data.totalPlayedRevenue);
    }
    
    if (data.stationRevenues) {
      stationRevenues.value = JSON.parse(data.stationRevenues);
    }
  } catch (error) {
    console.error('Error initializing KV data:', error);
  }
}

onBeforeUnmount(() => {
  clearInterval(timeInterval);
});

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  });
}

function handleStationStart() {
  activeStations.value++;
}

function handleStationStop() {
  activeStations.value--;
}

function handleTimeUpdate(stationId: number | string, newPrice: number, shouldSaveToKV = false) {
  // Only update the station's revenue if it's not a reset (newPrice > 0)
  // Or if we're explicitly stopping the station
  if (newPrice > 0 || shouldSaveToKV) {
    stationRevenues.value[stationId] = newPrice;
    
    // Recalculate total revenue
    totalPlayedRevenue.value = Object.values(stationRevenues.value).reduce((sum, price) => sum + price, 0);
    
    // Only save to KV if explicitly requested (on stop)
    if (shouldSaveToKV) {
      saveRevenueToKV();
    }
  }
}

async function saveRevenueToKV() {
  try {
    await fetch('/api/kv/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'stationRevenues',
        value: JSON.stringify(stationRevenues.value)
      }),
    });
    
    await fetch('/api/kv/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'totalPlayedRevenue',
        value: totalPlayedRevenue.value.toString()
      }),
    });
  } catch (error) {
    console.error('Error saving revenue to KV:', error);
  }
}

function showResetDialog() {
  showResetModal.value = true;
  resetCode.value = '';
  resetError.value = '';
  
  // Focus on input after modal is rendered
  nextTick(() => {
    if (codeInput.value) {
      codeInput.value.focus();
    }
  });
}

function closeResetDialog() {
  showResetModal.value = false;
  resetCode.value = '';
  resetError.value = '';
}

async function confirmReset() {
  if (resetCode.value !== RESET_PASSCODE) {
    resetError.value = 'Invalid confirmation code. Please try again.';
    resetCode.value = '';
    return;
  }

  try {
    // Reset total revenue and clear all station revenues
    totalPlayedRevenue.value = 0;
    stationRevenues.value = {};
    
    // Save to KV
    await fetch('/api/kv/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'totalPlayedRevenue',
        value: '0'
      }),
    });
    
    await fetch('/api/kv/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'stationRevenues',
        value: '{}'
      }),
    });
    
    closeResetDialog();
  } catch (error) {
    console.error('Error resetting KV storage:', error);
    resetError.value = 'Error occurred while resetting. Please try again.';
  }
}

watch(isDark, (val) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('isDark', JSON.stringify(val));
  }
});
</script>

<style scoped>
.reset-revenue-btn {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background-color: rgba(213, 0, 0, 0.1);
  color: #d50000;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-revenue-btn:hover {
  background-color: #d50000;
  color: white;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--stat-bg);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
}

.code-input {
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  text-align: center;
  letter-spacing: 2px;
  font-family: 'Fira Code', monospace;
  transition: border-color 0.2s;
}

.code-input:focus {
  outline: none;
  border-color: var(--accent);
}

.error-message {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background-color: rgba(213, 0, 0, 0.1);
  color: #d50000;
  border-radius: 6px;
  font-size: 0.9rem;
  text-align: center;
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border);
}

.cancel-btn,
.confirm-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: var(--stat-bg);
  color: var(--text-secondary);
}

.cancel-btn:hover {
  background-color: var(--border);
  color: var(--text-primary);
}

.confirm-btn {
  background-color: #d50000;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #b71c1c;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.app {
  min-height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  transition: background-color 0.3s, color 0.3s;
}

.dark {
  --bg-primary: #121212;
  --bg-secondary: #1e1e1e;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --accent: #00e5ff;
  --border: #333;
  --stat-bg: #252525;
}

.light {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --text-primary: #212529;
  --text-secondary: #495057;
  --accent: #0077cc;
  --border: #e0e0e0;
  --stat-bg: #f1f3f5;
}

.app {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.app-header {
  background-color: var(--bg-secondary);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid var(--border);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.playstation-icon {
  width: 32px;
  height: 32px;
  fill: var(--accent);
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, var(--accent), #00b4d8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.current-time {
  font-family: 'Fira Code', monospace;
  font-size: 1.1rem;
  color: var(--accent);
  background-color: var(--stat-bg);
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.app-main {
  padding:2rem;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border);
  position: relative;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  padding-bottom: 2rem;
}

.mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-icon {
  font-size: 1.2rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #555;
  border-radius: 34px;
  transition: 0.4s;
}

.slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
}

input:checked + .slider {
  background-color: var(--accent);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .stats-summary {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 1rem;
  }
}
</style>