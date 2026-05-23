<template>
  <div>
    <div class="dashboard-hero">
      <h2>❌ 经典错题整理</h2>
      <p>按模块查看常见易错点 · 理解错误原因 · 掌握正确解法</p>
    </div>

    <div class="card" style="display:flex;gap:8px;flex-wrap:wrap">
      <button
        v-for="(label, key) in moduleLabels" :key="key"
        class="tool-btn" :class="{ active: activeModule === key }"
        @click="activeModule = key"
      >{{ label }}</button>
    </div>

    <div v-if="currentMistakes.length === 0" class="no-data">该模块暂无错题记录</div>

    <div v-for="(m, i) in currentMistakes" :key="i" class="knowledge-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <h3>{{ m.title }}</h3>
        <span style="font-size:11px;color:var(--text-muted)">{{ m.tag }}</span>
      </div>
      <div class="mistake-wrong">
        <span class="mistake-label">❌ 错误做法：</span>{{ m.wrong }}
      </div>
      <div class="mistake-correct">
        <span class="mistake-label-correct">✅ 正确做法：</span>{{ m.correct }}
      </div>
      <div style="font-size:12px;color:var(--accent);margin-top:4px">💡 {{ m.tip }}</div>
      <div v-if="m.steps" style="margin-top:8px">
        <div class="step" v-for="(s,j) in m.steps" :key="j" style="margin:3px 0">Step {{ j+1 }}: {{ s }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 页面：经典错题整理
 * 功能：按模块查看常见易错点，对比错误与正确做法，理解错因
 * 路由：/mistakes
 */
import { ref, computed } from 'vue'
import { mistakeData } from '@/data/mistakeData.js'
import { allMods } from '@/data/examProblems.js'

const moduleLabels = { ...allMods }
delete moduleLabels.all

const activeModule = ref('3d')
const currentMistakes = computed(() => mistakeData[activeModule.value] || [])
</script>

<style scoped>
.mistake-wrong {
  background: rgba(239, 68, 68, 0.06);
  padding: 8px 12px;
  border-radius: 6px;
  margin: 8px 0;
}
.mistake-correct {
  background: rgba(16, 185, 129, 0.06);
  padding: 8px 12px;
  border-radius: 6px;
  margin: 8px 0;
}
.mistake-label {
  color: var(--danger);
  font-weight: 600;
}
.mistake-label-correct {
  color: var(--success);
  font-weight: 600;
}
[data-theme="dark"] .mistake-wrong {
  background: rgba(248, 113, 113, 0.08);
}
[data-theme="dark"] .mistake-correct {
  background: rgba(52, 211, 153, 0.08);
}
</style>
