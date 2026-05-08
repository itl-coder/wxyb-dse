<template>
  <div ref="katexEl" v-html="sanitizedHtml"></div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useKatex } from '@/composables/useKatex'

const props = defineProps({
  text: { type: String, default: '' }
})

const katexEl = ref(null)
const { renderMath } = useKatex()

const sanitizedHtml = computed(() => {
  return props.text
    .replace(/\\\(/g, '\\(')
    .replace(/\\\)/g, '\\)')
    .replace(/\\\[/g, '\\[')
    .replace(/\\\]/g, '\\]')
})

onMounted(() => renderMath(katexEl.value))
watch(() => props.text, () => renderMath(katexEl.value))
</script>
