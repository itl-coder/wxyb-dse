<template>
  <div class="evr-root">
    <span class="evr-title">考场规则</span>
    <span class="evr-text">{{ rules || defaultRules }}</span>
  </div>
</template>

<script setup>
defineProps({
  rules: { type: String, default: '' }
})

const defaultRules = '禁止携带手机、智能手表等电子设备 · 对号入座，保持安静 · 听从监考老师安排 · 不得交头接耳、传递物品'
</script>

<style>
.evr-root {
  margin: 4px 0;
  padding: 2px 8px;
  border: 1px solid #999;
  font-size: 6px;
  color: #888;
  display: flex;
  gap: 6px;
}
.evr-title {
  font-weight: 700;
  color: #444;
  white-space: nowrap;
}
.evr-text {
  color: #888;
}
</style>
