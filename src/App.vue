<template>
  <router-view />
</template>

<script setup>
/**
 * 根组件 — 仅负责主题初始化 + 路由出口
 * onMounted 时从 localStorage 读取主题并应用到 <html data-theme>
 */
import { onMounted } from 'vue'

onMounted(() => {
  const saved = localStorage.getItem('dse_theme')
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved)
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
})
</script>
