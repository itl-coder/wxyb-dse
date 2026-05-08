<template>
  <div>
    <div class="dashboard-hero">
      <h2>📖 DSE 知识体系总结</h2>
      <p>各模块核心知识点 · DSE高频考点标注 · 常见陷阱提醒</p>
    </div>

    <div class="card" style="display:flex;gap:8px;flex-wrap:wrap">
      <button
        v-for="(label, key) in moduleLabels" :key="key"
        class="tool-btn" :class="{ active: activeModule === key }"
        @click="activeModule = key"
      >{{ label }}</button>
    </div>

    <div v-if="currentModule">
      <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;color:var(--primary)">{{ currentModule.title }}</h2>
      <div v-for="(item, i) in currentModule.items" :key="i" class="knowledge-card">
        <h3>{{ item.h }}</h3>
        <p style="white-space:pre-line">{{ item.c }}</p>
      </div>
    </div>
    <div v-else class="no-data">请选择模块</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { knowledgeData } from '@/data/knowledgeData.js'
import { allMods } from '@/data/examProblems.js'

const moduleLabels = { ...allMods }
delete moduleLabels.all

const activeModule = ref('3d')
const currentModule = computed(() => knowledgeData[activeModule.value] || null)
</script>
