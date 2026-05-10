<template>
  <button
    class="glow-btn"
    :class="{ loading, block: props.block }"
    :disabled="disabled || loading"
    :style="btnStyle"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @click="onClick"
  >
    <span class="gb-bg-gradient"></span>
    <span v-if="loading" class="gb-spinner"></span>
    <span class="gb-text"><slot /></span>
    <span class="gb-shine" :style="shineStyle"></span>
    <span v-for="r in ripples" :key="r.id" class="gb-ripple" :style="r.style"></span>
  </button>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  loading: Boolean,
  disabled: Boolean,
  accent: { type: String, default: '#6366f1' },
  accentEnd: { type: String, default: '#06b6d4' },
  block: { type: Boolean, default: true }
})

const shineStyle = ref({ opacity: 0 })
const ripples = ref([])
let rippleId = 0

const btnStyle = computed(() => ({
  '--btn-accent': props.accent,
  '--btn-accent-end': props.accentEnd,
}))

function onMouseMove(e) {
  const rect = e.target.getBoundingClientRect()
  shineStyle.value = {
    '--mx': (e.clientX - rect.left) + 'px',
    '--my': (e.clientY - rect.top) + 'px',
    opacity: 1
  }
}

function onMouseLeave() {
  shineStyle.value = { opacity: 0 }
}

function onClick(e) {
  const rect = e.target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const size = Math.max(rect.width, rect.height) * 2
  const id = ++rippleId
  ripples.value.push({
    id,
    style: {
      '--rx': x + 'px',
      '--ry': y + 'px',
      '--rs': size + 'px'
    }
  })
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 600)
}
</script>

<style scoped>
.glow-btn {
  --btn-accent: #6366f1;
  --btn-accent-end: #06b6d4;
  position: relative;
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--btn-accent) 0%, var(--btn-accent-end) 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 2px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  isolation: isolate;
}

.glow-btn.block { width: 100%; }

/* Gradient flow overlay on hover */
.gb-bg-gradient {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(135deg, var(--btn-accent-end) 0%, var(--btn-accent) 50%, var(--btn-accent-end) 100%);
  background-size: 200% 200%;
  opacity: 0;
  transition: opacity 0.4s;
}

.glow-btn:hover:not(:disabled) .gb-bg-gradient {
  opacity: 1;
  animation: gb-gradient-flow 2s ease-in-out infinite;
}

@keyframes gb-gradient-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.glow-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 8px 28px rgba(99, 102, 241, 0.35),
    0 0 60px rgba(6, 182, 212, 0.1);
}

.glow-btn:active:not(:disabled) { transform: translateY(0); }

.glow-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.glow-btn.loading {
  opacity: 0.75;
}

.gb-text {
  position: relative;
  z-index: 2;
}

/* Shine effect */
.gb-shine {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: radial-gradient(circle 80px at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.18) 0%, transparent 80%);
  pointer-events: none;
  transition: opacity 0.3s;
  opacity: 0;
  z-index: 1;
}

/* Ripple */
.gb-ripple {
  position: absolute;
  left: var(--rx);
  top: var(--ry);
  width: var(--rs);
  height: var(--rs);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  transform: translate(-50%, -50%) scale(0);
  animation: gb-ripple 0.6s ease-out forwards;
  pointer-events: none;
  z-index: 1;
}

@keyframes gb-ripple {
  to { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

/* Spinner */
.gb-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: gb-spin 0.6s linear infinite;
  position: relative;
  z-index: 2;
}

@keyframes gb-spin { to { transform: rotate(360deg); } }
</style>
