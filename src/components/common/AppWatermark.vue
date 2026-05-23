<template>
  <el-watermark
    v-if="wmEnabled"
    :content="wmText"
    :font="{ fontSize: wmFontSize, color: wmColor }"
    :gap="[wmGapX, wmGapY]"
    :rotate="wmRotation"
    :z-index="wmZIndex"
  >
    <slot />
  </el-watermark>
  <slot v-else />
</template>

<script setup>
import { computed } from 'vue'
import { getWatermarkConfig } from '@/composables/useWatermark'

const props = defineProps({
  zIndex: { type: Number, default: -1 },
  content: { type: String, default: '' },
})

const wmCfg = computed(() => getWatermarkConfig())
const wmEnabled = computed(() => wmCfg.value.enabled)
const wmText = computed(() => props.content || wmCfg.value.text)
const wmFontSize = computed(() => wmCfg.value.fontSize)
const wmColor = computed(() => wmCfg.value.color)
const wmRotation = computed(() => wmCfg.value.rotation)
const wmGapX = computed(() => wmCfg.value.gapX)
const wmGapY = computed(() => wmCfg.value.gapY)
const wmZIndex = computed(() => props.zIndex)
</script>
