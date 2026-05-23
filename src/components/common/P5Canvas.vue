<template>
  <div ref="containerRef" class="p5-container"></div>
</template>

<script setup>
/**
 * 模块：P5Canvas
 * 功能：P5.js 画布容器，管理 p5 实例的创建/销毁生命周期，支持动态重绘和 ready 事件通知
 * 使用位置：数学可视化页面（如几何、函数图像等需要动态绘图的场景）
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import p5 from 'p5'

const props = defineProps({
  sketch: { type: Function, required: true },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 }
})

const emit = defineEmits(['ready', 'resize'])

const containerRef = ref(null)
let p5Instance = null

const createInstance = () => {
  if (!containerRef.value) return
  if (p5Instance) p5Instance.remove()

  const wrapper = (p) => {
    props.sketch(p, containerRef.value)
  }
  p5Instance = new p5(wrapper, containerRef.value)
  emit('ready', p5Instance)
}

onMounted(() => {
  createInstance()
})

onBeforeUnmount(() => {
  if (p5Instance) {
    p5Instance.remove()
    p5Instance = null
  }
})

defineExpose({ getInstance: () => p5Instance, recreate: createInstance })
</script>

<style scoped>
.p5-container {
  width: 100%;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius);
  overflow: hidden;
}
.p5-container :deep(canvas) {
  display: block !important;
  border-radius: var(--radius);
}
</style>
