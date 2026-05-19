<template>
  <div class="exam-seat-page">
    <!-- 顶部统计 — 朱砂红点缀的指标卡片 -->
    <section class="es-stats-section">
      <ExamStats />
    </section>

    <!-- 操作栏 — 科举文书风按钮 -->
    <section class="es-toolbar-section">
      <ToolbarActions />
    </section>

    <!-- 主体三栏 — 贡院格韵 -->
    <section class="es-main-section">
      <aside class="es-sidebar es-sidebar-left">
        <RoomSidebar />
      </aside>
      <main class="es-center">
        <SeatGrid />
      </main>
      <aside class="es-sidebar es-sidebar-right">
        <StudentPool />
      </aside>
    </section>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import './styles/examSeat.css'
import { useExamSeatStore } from './store/examSeatStore.js'
import ExamStats from './components/ExamStats.vue'
import ToolbarActions from './components/ToolbarActions.vue'
import RoomSidebar from './components/RoomSidebar.vue'
import SeatGrid from './components/SeatGrid.vue'
import StudentPool from './components/StudentPool.vue'

const store = useExamSeatStore()

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.exam-seat-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 104px);
  gap: 10px;
  position: relative;
  z-index: 1;
}

.es-stats-section,
.es-toolbar-section {
  flex-shrink: 0;
}

.es-main-section {
  flex: 1;
  display: flex;
  gap: 10px;
  min-height: 0;
  overflow: hidden;
}

.es-sidebar {
  width: 248px;
  flex-shrink: 0;
  overflow-y: auto;
  border-radius: var(--es-radius-lg);
  background: var(--es-surface);
  border: 1px solid var(--es-border);
  padding: 14px;
}

.es-center {
  flex: 1;
  min-width: 0;
  border-radius: var(--es-radius-lg);
  background: var(--es-surface);
  border: 1px solid var(--es-border);
  padding: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 小屏幕：右侧面板收缩 */
@media (max-width: 1400px) {
  .es-sidebar { width: 220px; }
  .es-sidebar-right { width: 200px; }
}
@media (max-width: 1200px) {
  .es-main-section { gap: 6px; }
  .es-sidebar { width: 180px; padding: 10px; }
  .es-center { padding: 12px; }
}
@media (max-width: 900px) {
  .es-main-section { flex-direction: column; }
  .es-sidebar { width: 100%; max-height: 180px; }
}
</style>
