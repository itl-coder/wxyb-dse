<template>
  <div class="concept-block">
    <h4>{{ title }}<span v-if="tag" :style="{ color: '#d4351c', fontSize: '0.85em', fontWeight: 'normal' }"> {{ tag }}</span></h4>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  tag: { type: String, default: '' }
})
</script>
