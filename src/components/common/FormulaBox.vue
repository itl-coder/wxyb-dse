<template>
  <div class="formula-box">
    <MathRenderer :formula="extractedFormula" :display-mode="true" :debounce-ms="50" />
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import MathRenderer from '@/components/common/MathRenderer.vue'

const slots = useSlots()

const extractedFormula = computed(() => {
  const nodes = slots.default?.()
  if (!nodes || !nodes.length) return ''

  const text = nodes.map(n => {
    if (typeof n.children === 'string') return n.children
    const extract = (node) => {
      if (typeof node === 'string') return node
      if (typeof node.children === 'string') return node.children
      if (Array.isArray(node.children)) return node.children.map(extract).join('')
      return ''
    }
    return extract(n)
  }).join('')

  return text.trim() || ''
})
</script>
