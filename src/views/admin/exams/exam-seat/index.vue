<template>
  <div class="exam-seat-page">
    <!-- 顶部统计 -->
    <section class="es-stats-section">
      <ExamStats />
    </section>

    <!-- 操作栏 -->
    <section class="es-toolbar-section">
      <ToolbarActions />
    </section>

    <!-- 主体三栏 -->
    <section class="es-main-section">
      <aside class="es-sidebar es-sidebar-left" :style="{ width: leftWidth + 'px' }">
        <RoomSidebar />
      </aside>

      <!-- 左拖拽手柄 -->
      <div class="es-resize-handle" @mousedown="startResize('left', $event)"></div>

      <main class="es-center">
        <SeatGrid />
      </main>

      <!-- 右拖拽手柄 -->
      <div class="es-resize-handle" @mousedown="startResize('right', $event)"></div>

      <aside class="es-sidebar es-sidebar-right" :style="{ width: rightWidth + 'px' }">
        <StudentPool />
      </aside>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import './styles/examSeat.css'
import { useExamSeatStore } from './store/examSeatStore.js'
import ExamStats from './components/ExamStats.vue'
import ToolbarActions from './components/ToolbarActions.vue'
import RoomSidebar from './components/RoomSidebar.vue'
import SeatGrid from './components/SeatGrid.vue'
import StudentPool from './components/StudentPool.vue'

const store = useExamSeatStore()

// 面板宽度 — 从 localStorage 恢复
const LEFT_DEFAULT = 230
const RIGHT_DEFAULT = 280
const LEFT_MIN = 160
const RIGHT_MIN = 200
const LEFT_MAX = 360
const RIGHT_MAX = 420

function loadWidth(key, fallback) {
  try {
    const v = parseInt(localStorage.getItem(key))
    return v && !isNaN(v) ? Math.max(fallback - 40, Math.min(v, fallback + 100)) : fallback
  } catch { return fallback }
}

const leftWidth = ref(loadWidth('es_left_width', LEFT_DEFAULT))
const rightWidth = ref(loadWidth('es_right_width', RIGHT_DEFAULT))

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
  }
}

// 拖拽调整面板大小
let resizing = null

function startResize(side, e) {
  resizing = { side, startX: e.clientX }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}

function onResize(e) {
  if (!resizing) return
  const dx = e.clientX - resizing.startX
  if (resizing.side === 'left') {
    const newW = Math.min(LEFT_MAX, Math.max(LEFT_MIN, leftWidth.value + dx))
    leftWidth.value = newW
  } else {
    const newW = Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, rightWidth.value - dx))
    rightWidth.value = newW
  }
  resizing.startX = e.clientX
}

function stopResize() {
  if (resizing) {
    localStorage.setItem('es_left_width', leftWidth.value)
    localStorage.setItem('es_right_width', rightWidth.value)
    resizing = null
  }
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
})
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
  gap: 0;
  min-height: 0;
  overflow: hidden;
}

.es-sidebar {
  flex-shrink: 0;
  overflow-y: auto;
  background: var(--es-surface);
  border: 1px solid var(--es-border);
  padding: 14px;
}
.es-sidebar-left {
  border-radius: var(--es-radius-lg) 0 0 var(--es-radius-lg);
}
.es-sidebar-right {
  border-radius: 0 var(--es-radius-lg) var(--es-radius-lg) 0;
}

.es-center {
  flex: 1;
  min-width: 0;
  background: var(--es-surface);
  border-top: 1px solid var(--es-border);
  border-bottom: 1px solid var(--es-border);
  padding: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 拖拽手柄 */
.es-resize-handle {
  width: 6px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
  position: relative;
  z-index: 2;
}
.es-resize-handle:hover,
.es-resize-handle:active {
  background: rgba(201,168,76,0.3);
}
.es-resize-handle::after {
  content: '';
  position: absolute;
  inset: 20% 0;
  width: 6px;
  border-left: 1px dotted rgba(201,168,76,0.1);
  border-right: 1px dotted rgba(201,168,76,0.1);
}

/* 小屏幕适配 */
@media (max-width: 1400px) {
  .es-sidebar-left { width: 200px !important; }
  .es-sidebar-right { width: 240px !important; }
}
@media (max-width: 1200px) {
  .es-sidebar-left { width: 170px !important; }
  .es-sidebar-right { width: 200px !important; }
  .es-center { padding: 12px; }
  .es-resize-handle { width: 3px; }
}
@media (max-width: 900px) {
  .es-main-section { flex-direction: column; }
  .es-sidebar { width: 100% !important; max-height: 180px; }
  .es-resize-handle { display: none; }
}
</style>
