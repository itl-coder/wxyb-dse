<template>
  <div class="student-pool">
    <div class="sp-header">
      <h3 class="sp-title">待安排考生</h3>
      <span class="sp-count">{{ store.filteredUnassigned.length }}</span>
    </div>

    <!-- 筛选 + 排序 -->
    <div class="sp-toolbar" v-if="store.unassignedStudents.length > 0">
      <div class="sp-search">
        <el-input
          v-model="localSearch"
          placeholder="搜索姓名 / 班级..."
          clearable
          size="small"
          @input="onSearch"
        />
      </div>
      <div class="sp-filters">
        <select class="sp-select" v-model="localClassFilter" @change="onClassFilter">
          <option value="">全部班级</option>
          <option v-for="c in store.availableClasses" :key="c" :value="c">{{ c }}</option>
        </select>
        <select class="sp-select" v-model="localElectiveFilter" @change="onElectiveFilter">
          <option value="">全部选修</option>
          <option v-for="e in store.availableElectives" :key="e" :value="e">{{ e }}</option>
        </select>
        <div class="sp-sort">
          <select class="sp-select sp-select-sort" v-model="localSortBy" @change="onSortBy">
            <option value="name">姓名</option>
            <option value="class">班级</option>
            <option value="electiveCount">选修数</option>
          </select>
          <button class="sp-sort-order" @click="store.togglePoolSortOrder()" :title="store.poolSortOrder === 'asc' ? '升序 → 降序' : '降序 → 升序'">
            {{ store.poolSortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 批量操作 -->
    <div class="sp-batch-bar" v-if="store.selectedPoolStudentIds.size > 0 && store.selectedRoomId">
      <span class="sp-batch-info">已选 {{ store.selectedPoolStudentIds.size }} 人</span>
      <button class="sp-batch-assign-btn" @click="onBatchAssign">分配到当前教室</button>
    </div>

    <!-- 学生列表 -->
    <div class="sp-list" ref="poolEl" v-if="store.filteredUnassigned.length > 0">
      <div class="sp-list-header">
        <label class="sp-checkbox-all" @click.prevent="store.selectAllPoolStudents()">
          <span class="sp-cb-box" :class="{ checked: store.isAllPoolSelected, partial: !store.isAllPoolSelected && store.selectedPoolStudentIds.size > 0 }"></span>
        </label>
        <span class="sp-list-header-hint">全选 / 取消</span>
      </div>
      <div
        v-for="s in store.filteredUnassigned"
        :key="s.id"
        class="sp-student"
        :class="{ selected: store.selectedPoolStudentIds.has(s.id) }"
        :data-student-id="s.id"
      >
        <label class="sp-checkbox" @click.prevent="store.togglePoolStudentSelection(s.id)">
          <span class="sp-cb-box" :class="{ checked: store.selectedPoolStudentIds.has(s.id) }"></span>
        </label>
        <span class="sp-handle">⠿</span>
        <div class="sp-info">
          <span class="sp-name">{{ s.name }}</span>
          <span class="sp-class-dot" :style="{ background: classColor(s.className) }"></span>
          <span class="sp-class">{{ s.className }}</span>
        </div>
        <div class="sp-electives" v-if="s.electives?.length">
          <span class="sp-elective-tag" v-for="e in s.electives" :key="e">{{ e }}</span>
        </div>
        <button class="sp-remove-btn" @click.stop="onRemove(s)" title="移除该学生">×</button>
      </div>
    </div>

    <div class="sp-empty" v-else-if="store.unassignedStudents.length === 0 && store.students.length > 0">
      <div class="sp-empty-glyph">✓</div>
      <p>所有考生已入座</p>
    </div>
    <div class="sp-empty" v-else-if="store.students.length === 0">
      <div class="sp-empty-glyph">—</div>
      <p>尚未导入考生</p>
    </div>
    <div class="sp-empty" v-else>
      <div class="sp-empty-glyph">~</div>
      <p>无匹配结果</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useExamSeatStore } from '@/views/admin/exams/exam-seat/store/examSeatStore.js'
import Sortable from 'sortablejs'

const store = useExamSeatStore()
const localSearch = ref('')
const localClassFilter = ref('')
const localElectiveFilter = ref('')
const localSortBy = ref('name')
const poolEl = ref(null)
let sortable = null

function onSearch(val) { store.setSearchKeyword(val || '') }
function onClassFilter() { store.setPoolFilterClass(localClassFilter.value) }
function onElectiveFilter() { store.setPoolFilterElective(localElectiveFilter.value) }
function onSortBy() { store.setPoolSortBy(localSortBy.value) }

function onBatchAssign() {
  if (!store.selectedRoomId || store.selectedPoolStudentIds.size === 0) return
  store.assignSelectedToRoom(store.selectedRoomId)
}

function onRemove(student) {
  store.removeStudent(student.id)
}

// Simple color hash for class dot
const classColors = {}
function classColor(className) {
  if (!className) return 'rgba(255,255,255,0.15)'
  if (classColors[className]) return classColors[className]
  const palette = ['#c9a84c', '#2d8a4e', '#5b5bce', '#c41e3a', '#4a9ec8', '#d4893a', '#8a5ec8', '#3a9e8a']
  let hash = 0
  for (let i = 0; i < className.length; i++) hash = className.charCodeAt(i) + ((hash << 5) - hash)
  classColors[className] = palette[Math.abs(hash) % palette.length]
  return classColors[className]
}

function initSortable() {
  if (!poolEl.value) return
  if (sortable) sortable.destroy()
  sortable = Sortable.create(poolEl.value, {
    group: { name: 'seats', pull: 'clone', put: true },
    sort: false,
    animation: 200,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    handle: '.sp-handle',
    filter: '.sp-checkbox, .sp-list-header',
    delay: 0,
    touchStartThreshold: 5,
    scroll: true,
    scrollSensitivity: 30,
    scrollSpeed: 10,
    forceFallback: false,
    onEnd(evt) {
      // Detect pool→grid drop target
      const clientX = evt.originalEvent.changedTouches
        ? evt.originalEvent.changedTouches[0].clientX
        : evt.originalEvent.clientX
      const clientY = evt.originalEvent.changedTouches
        ? evt.originalEvent.changedTouches[0].clientY
        : evt.originalEvent.clientY
      const targetEl = document.elementFromPoint(clientX, clientY)
      const cell = targetEl?.closest('.sg-td-seat')
      if (!cell) return
      const gridEl_data = cell.closest('.sg-table')
      const targetRoomId = gridEl_data ? parseInt(gridEl_data.dataset.roomId) : null
      const seatIndex = parseInt(cell.dataset.seatIndex)
      const studentId = parseInt(evt.item.dataset.studentId)
      if (targetRoomId && !isNaN(seatIndex) && studentId) {
        store.assignStudent(studentId, targetRoomId, seatIndex)
      }
    }
  })
}

onMounted(() => nextTick(initSortable))
onUnmounted(() => { if (sortable) sortable.destroy() })
</script>

<style scoped>
.student-pool {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.sp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--es-border);
  margin-bottom: 10px;
}
.sp-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--es-text);
  margin: 0;
}
.sp-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--es-gold);
  background: var(--es-gold-dim);
  min-width: 24px;
  text-align: center;
  padding: 1px 8px;
  border-radius: 10px;
}

/* 工具栏 */
.sp-toolbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.sp-search { /* el-input already styled */ }
.sp-filters {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.sp-select {
  flex: 1;
  min-width: 0;
  padding: 5px 6px;
  border: 1px solid var(--es-border);
  border-radius: 5px;
  background: var(--es-surface-alt);
  color: var(--es-text);
  font-size: 11px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  cursor: pointer;
  outline: none;
}
.sp-select:focus { border-color: var(--es-border-active); }
.sp-select option {
  background: #1a1d28;
  color: var(--es-text);
}
.sp-sort {
  display: flex;
  gap: 2px;
  align-items: center;
}
.sp-select-sort { flex: 1.5; }
.sp-sort-order {
  width: 26px;
  height: 26px;
  border: 1px solid var(--es-border);
  border-radius: 5px;
  background: var(--es-surface-alt);
  color: var(--es-text-secondary);
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}
.sp-sort-order:hover { color: var(--es-gold); border-color: var(--es-gold); }

/* 批量操作条 */
.sp-batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  margin-bottom: 6px;
  background: rgba(201,168,76,0.06);
  border: 1px solid rgba(201,168,76,0.15);
  border-radius: 6px;
}
.sp-batch-info {
  font-size: 11px;
  color: var(--es-gold);
  font-weight: 500;
}
.sp-batch-assign-btn {
  padding: 4px 12px;
  background: var(--es-gold);
  color: #080b14;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  transition: all 0.15s;
}
.sp-batch-assign-btn:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 8px rgba(201,168,76,0.3);
}

/* 列表 */
.sp-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sp-list-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 5px;
}
.sp-list-header:hover { background: rgba(255,255,255,0.02); }
.sp-list-header-hint {
  font-size: 10px;
  color: var(--es-text-muted);
}
.sp-student {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  background: var(--es-surface-alt);
  border: 1px solid transparent;
  border-radius: 7px;
  cursor: grab;
  transition: all 0.15s;
  position: relative;
}
.sp-student:hover {
  border-color: var(--es-border-active);
  background: var(--es-surface);
}
.sp-student.selected {
  border-color: rgba(201,168,76,0.3);
  background: rgba(201,168,76,0.04);
}

/* Checkbox */
.sp-checkbox, .sp-checkbox-all {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}
.sp-cb-box {
  width: 14px;
  height: 14px;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 3px;
  display: inline-block;
  position: relative;
  transition: all 0.15s;
  background: transparent;
}
.sp-cb-box.checked {
  background: var(--es-gold);
  border-color: var(--es-gold);
}
.sp-cb-box.checked::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: #080b14;
  font-weight: 700;
}
.sp-cb-box.partial {
  border-color: var(--es-gold);
}
.sp-cb-box.partial::after {
  content: '−';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--es-gold);
  font-weight: 700;
}

.sp-handle {
  font-size: 13px;
  color: var(--es-text-muted);
  cursor: grab;
  flex-shrink: 0;
  opacity: 0.55;
}
.sp-student:hover .sp-handle { opacity: 0.9; }
.sp-remove-btn {
  width: 20px; height: 20px;
  border: none;
  background: transparent;
  color: var(--es-text-muted);
  cursor: pointer;
  font-size: 16px;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
}
.sp-student:hover .sp-remove-btn { opacity: 0.5; }
.sp-remove-btn:hover { opacity: 1 !important; color: var(--es-vermillion); background: rgba(196,30,58,0.08); }
.sp-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.sp-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--es-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sp-class-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sp-class {
  font-size: 10px;
  color: var(--es-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}
.sp-electives {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}
.sp-elective-tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(201,168,76,0.08);
  color: var(--es-gold);
  line-height: 1.7;
  white-space: nowrap;
}
.sp-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--es-text-muted);
}
.sp-empty-glyph {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.3;
}
.sp-empty p { margin: 0; font-size: 12px; }
</style>
