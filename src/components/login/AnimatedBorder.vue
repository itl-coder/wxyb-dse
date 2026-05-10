<template>
  <div class="ab-wrapper" :style="wrapperStyle">
    <div class="ab-border" :style="borderStyle"></div>
    <div class="ab-border ab-border-2" :style="borderStyle2"></div>
    <div class="ab-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  speed: { type: Number, default: 8 },
  width: { type: Number, default: 1 },
  opacity: { type: Number, default: 0.3 },
  colors: { type: Array, default: () => ['#6366f1', '#06b6d4', '#8b5cf6', '#6366f1'] },
  radius: { type: Number, default: 20 }
})

const colorStr = computed(() => props.colors.join(', '))

const wrapperStyle = computed(() => ({
  '--ab-radius': props.radius + 'px',
}))

const borderStyle = computed(() => ({
  '--ab-speed': props.speed + 's',
  '--ab-opacity': props.opacity,
  '--ab-width': props.width + 'px',
  '--ab-colors': colorStr.value,
  background: `conic-gradient(from 0deg at 50% 50%, ${props.colors.map((c, i) => `${c} ${i * (360 / props.colors.length)}deg`).join(', ')})`,
}))

const borderStyle2 = computed(() => ({
  '--ab-speed': (props.speed * 1.4) + 's',
  '--ab-opacity': props.opacity * 0.6,
  '--ab-width': (props.width + 1) + 'px',
  background: `conic-gradient(from 180deg at 50% 50%, ${props.colors.reverse().map((c, i) => `${c} ${i * (360 / props.colors.length)}deg`).join(', ')})`,
}))
</script>

<style scoped>
.ab-wrapper {
  position: relative;
  border-radius: var(--ab-radius);
  overflow: hidden;
}

.ab-border {
  position: absolute;
  inset: calc(-1 * var(--ab-width));
  border-radius: calc(var(--ab-radius) + var(--ab-width));
  animation: ab-rotate var(--ab-speed) linear infinite;
  opacity: var(--ab-opacity);
  z-index: 0;
  pointer-events: none;
}

.ab-border-2 {
  animation-direction: reverse;
  animation-duration: calc(var(--ab-speed) * 1.4);
  opacity: calc(var(--ab-opacity) * 0.6);
}

@keyframes ab-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ab-content {
  position: relative;
  z-index: 1;
  border-radius: var(--ab-radius);
  background: inherit;
}
</style>
