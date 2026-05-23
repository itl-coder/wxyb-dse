<template>
  <div class="evf-root">
    <span class="evf-left">DSE AI 智能学情分析 · {{ dateStr }}</span>
    <span class="evf-right">共 {{ totalSeats }} 座</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalSeats: { type: Number, default: 0 }
})

const dateStr = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
})
</script>

<style>
.evf-root {
  display: flex;
  justify-content: space-between;
  padding-top: 4px;
  margin-top: 4px;
  border-top: 1px solid #ccc;
  font-size: 6px;
  color: #aaa;
}
.evf-left {}
.evf-right {}
</style>
