<template>
  <div>
    <div class="dashboard-hero">
      <h2>📝 DSE 练习系统</h2>
      <p>按考试类型和模块筛选 · 逐步提示 · 自评检验</p>
    </div>

    <div class="card">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
        <select v-model="examIdx" class="native-select">
          <option v-for="(t,i) in examTypes" :key="i" :value="i">{{ t }}</option>
        </select>
        <select v-model="modFilter" class="native-select">
          <option v-for="(v,k) in allMods" :key="k" :value="k">{{ v }}</option>
        </select>
        <select v-model="diffFilter" class="native-select">
          <option :value="0">全部难度</option>
          <option v-for="d in [1,2,3,4,5,6,7,8]" :key="d" :value="d">难度 {{ d }}</option>
        </select>
        <span style="font-size:12px;color:var(--text-secondary)">共 {{ filteredProblems.length }} 题</span>
      </div>
    </div>

    <div v-if="filteredProblems.length === 0" class="no-data">没有匹配的题目</div>

    <div v-for="p in filteredProblems" :key="p.id" class="problem-card" @click="toggleProblem(p.id)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <h4>{{ p.title }}</h4>
        <span class="diff-badge" :class="'diff-' + Math.min(p.diff, 5)">难度 {{ p.diff }}</span>
      </div>
      <div class="q">{{ p.q }}</div>
      <div v-if="expanded[p.id]">
        <div class="steps" v-if="p.steps">
          <div class="step" v-for="(s,i) in p.steps" :key="i">Step {{ i+1 }}: {{ s }}</div>
        </div>
        <div class="answer">
          <b>答案：</b>{{ p.ans }}
          <span v-if="p.key" style="margin-left:8px;color:var(--text-secondary)">知识点：{{ p.key }}</span>
        </div>
        <div v-if="p.score" style="font-size:11px;color:var(--text-secondary);margin-top:4px">{{ p.score }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 页面：练习系统
 * 功能：按考试类型、模块和难度筛选题目，支持逐步提示与自评检验
 * 路由：/practice
 */
import { ref, computed } from 'vue'
import { examTypes, examProblems, allMods } from '@/data/examProblems.js'

const examIdx = ref(0)
const modFilter = ref('all')
const diffFilter = ref(0)
const expanded = ref({})

const filteredProblems = computed(() => {
  let list = examProblems[examIdx.value] || []
  if (modFilter.value !== 'all') list = list.filter(p => p.module === modFilter.value)
  if (diffFilter.value > 0) list = list.filter(p => p.diff === diffFilter.value)
  return list
})

function toggleProblem(id) {
  expanded.value[id] = !expanded.value[id]
}
</script>

<style scoped>
.native-select {
  padding: 6px 10px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--card-bg);
  outline: none;
  cursor: pointer;
  min-width: 130px;
}
.native-select:focus {
  border-color: var(--accent);
}
</style>
