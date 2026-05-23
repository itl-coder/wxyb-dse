<template>
  <div class="teaching-wrap">
    <!-- 学习目标 -->
    <div v-if="objectives?.length" class="obj-section">
      <div class="sec-title">🎯 学习目标</div>
      <ul class="obj-grid">
        <li v-for="(obj, i) in objectives" :key="i">{{ obj }}</li>
      </ul>
    </div>

    <!-- 主内容 -->
    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念与公式</div>
        <slot name="concepts" />
      </div>

      <div class="teaching-sidebar">
        <div v-if="hasMisconceptions" class="mis-section">
          <div class="sec-title">⚠️ 常见误区</div>
          <slot name="misconceptions" />
        </div>
        <div v-if="hasStrategies" class="strategy-section">
          <div class="sec-title">🎯 DSE 应考策略</div>
          <slot name="strategies" />
        </div>
      </div>
    </div>

    <!-- 探索指南 -->
    <div v-if="hasExploration" class="exp-section">
      <div class="sec-title">🔬 探索指南</div>
      <slot name="exploration" />
    </div>

    <!-- 相关资源 -->
    <div class="resources-section">
      <div class="resources-title">📎 相关资源</div>
      <div class="resources-grid">
        <router-link to="/practice" class="resource-link">📝 DSE练习题</router-link>
        <router-link to="/mistakes" class="resource-link">❌ 相关错题整理</router-link>
        <router-link to="/knowledge" class="resource-link">📖 知识体系速览</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 模块：TeachingLayout
 * 功能：教学页面布局，包含学习目标、核心概念与公式、常见误区、DSE 应考策略、探索指南和相关资源链接等模块
 * 使用位置：各知识点教学页面（如三角函数、对数指数等）
 */
import { computed, useSlots } from 'vue'

const props = defineProps({
  objectives: { type: Array, default: () => [] }
})

const slots = useSlots()
const hasMisconceptions = computed(() => !!slots.misconceptions)
const hasStrategies = computed(() => !!slots.strategies)
const hasExploration = computed(() => !!slots.exploration)
</script>
