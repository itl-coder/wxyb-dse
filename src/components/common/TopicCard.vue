<template>
  <router-link :to="to" class="topic-card-link">
    <div class="topic-card">
      <div class="tc-icon">{{ icon }}</div>
      <div class="tc-name">{{ name }}</div>
      <div class="tc-desc">{{ desc }}</div>
      <div class="tc-meta">
        <span class="meta-tag" :class="freq">{{ freqLabel }}</span>
        <span class="meta-tag" :class="starClass">{{ starDisplay }}</span>
      </div>
      <div class="tc-enter">进入学习 →</div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  to: String,
  icon: String,
  name: String,
  desc: String,
  freq: { type: String, default: 'mid' },
  stars: { type: Number, default: 3 }
})

const freqLabel = computed(() => {
  const map = { high: '📈 高频', mid: '📊 中频', low: '📉 低频' }
  return map[props.freq] || ''
})

const starClass = computed(() => {
  return props.stars >= 5 ? 'high' : props.stars >= 4 ? 'mid' : 'low'
})

const starDisplay = computed(() => '★'.repeat(props.stars) + '☆'.repeat(5 - props.stars))
</script>
