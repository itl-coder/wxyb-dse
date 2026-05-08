<template>
  <div class="app-header">
    <div class="header-top-row">
      <div class="header-entry-links">
        <router-link to="/admin" class="entry-link admin-entry">🏫 管理后台</router-link>
        <router-link to="/portal" class="entry-link portal-entry">👨‍🎓 学生门户</router-link>
      </div>
    </div>
    <h1 @click="$router.push('/')" style="cursor:pointer">DSE 智能学习系统</h1>
    <p>全面覆盖DSE考点 · 互动可视化教学</p>
    <div class="subject-bar">
      <button
        v-for="s in subjects"
        :key="s.id"
        class="subject-btn"
        :class="{ active: currentSubject === s.id }"
        @click="$emit('switchSubject', s.id)"
      >{{ s.icon }} {{ s.label }}</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  currentSubject: { type: String, default: 'math' }
})

defineEmits(['switchSubject'])

const subjects = [
  { id: 'math', icon: '📐', label: '数学' },
  { id: 'chinese', icon: '📝', label: '中文' },
  { id: 'physics', icon: '⚡', label: '物理' },
  { id: 'chemistry', icon: '🧪', label: '化学' }
]
</script>
