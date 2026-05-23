<template>
  <div ref="rootRef" class="esp-root" :class="{ 'esp-collapsed': collapsed, 'esp-narrow': isNarrow }">
    <div class="esp-header">
      <div class="esp-header-left">
        <button class="esp-collapse-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开' : '收起'">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" :style="{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(90deg)' }"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <h3 class="esp-title">待安排考生</h3>
      </div>
      <span class="esp-count">{{ filteredStudents.length }}</span>
    </div>

    <!-- 搜索 + 筛选 -->
    <div class="esp-toolbar" v-if="unassignedStudents.length > 0 && !collapsed">
      <div class="esp-search">
        <el-input
          v-model="searchText"
          placeholder="搜索姓名 / 班级..."
          clearable
          size="small"
        />
      </div>
      <div class="esp-filters">
        <select class="esp-select" v-model="classFilter">
          <option value="">全部班级</option>
          <option v-for="c in store.availableClasses" :key="c" :value="c">{{ c }}</option>
        </select>
        <select class="esp-select" v-model="electiveFilter">
          <option value="">全部选修</option>
          <option v-for="e in store.availableElectives" :key="e" :value="e">{{ e }}</option>
        </select>
      </div>
      <!-- 批量操作栏 -->
      <div class="esp-bulk-bar" v-if="selectedIds.size > 0">
        <span class="esp-bulk-count">已选 {{ selectedIds.size }} 人</span>
        <button
          class="esp-bulk-btn"
          :disabled="!store.selectedRoom"
          @click="onBulkAssign"
          :title="store.selectedRoom ? '放入 ' + store.selectedRoom.name : '请先在左侧选择目标教室'"
        >
          放入{{ store.selectedRoom ? '【' + store.selectedRoom.name + '】' : '教室' }}
        </button>
        <button class="esp-bulk-btn esp-bulk-btn-clear" @click="selectedIds.clear()">取消选择</button>
      </div>
    </div>

    <!-- 学生列表（Draggable） -->
    <DraggableContainer
      v-if="filteredStudents.length > 0 && !collapsed"
      v-model="draggableList"
      :group="dragGroup"
      :sort="false"
      :animation="200"
      ghost-class="esp-ghost"
      drag-class="esp-drag-item"
      item-key="id"
      tag="div"
      class="esp-list"
      @end="onDragEnd"
    >
      <div
        v-for="s in draggableList"
        :key="s.id"
        class="esp-student"
        :class="{ 'esp-student-selected': selectedIds.has(s.id) }"
        :data-student-id="s.id"
      >
        <!-- 多选复选框 -->
        <label class="esp-check-label" @click.stop>
          <input
            type="checkbox"
            class="esp-checkbox"
            :checked="selectedIds.has(s.id)"
            @change="toggleSelect(s.id)"
          />
        </label>
        <span class="esp-handle">⠿</span>
        <div class="esp-info">
          <span class="esp-name">{{ s.name }}</span>
          <span class="esp-class-dot" :style="{ background: classColor(s.className) }"></span>
          <span class="esp-class">{{ s.className }}</span>
        </div>
        <div class="esp-electives" v-if="s.electives?.length">
          <span class="esp-elective-tag" v-for="e in s.electives" :key="e">{{ e }}</span>
        </div>
        <button class="esp-remove-btn" @click.stop="onRemove(s)" title="移除该学生">×</button>
      </div>
    </DraggableContainer>

    <!-- 空状态 -->
    <div class="esp-empty" v-else-if="!collapsed && unassignedStudents.length === 0 && store.students.length > 0">
      <span class="esp-empty-glyph">✓</span>
      <p>所有考生已入座</p>
    </div>
    <div class="esp-empty" v-else-if="!collapsed && store.students.length === 0">
      <span class="esp-empty-glyph">—</span>
      <p>尚未导入考生</p>
    </div>
    <div class="esp-empty" v-else-if="!collapsed">
      <span class="esp-empty-glyph">~</span>
      <p>无匹配结果</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'
import DraggableContainer from '@/components/common/DraggableContainer.vue'
import { classColor } from '@/utils/colorHash'
import { ElMessage } from 'element-plus'

const store = useExamSeat2Store()

const collapsed = ref(false)
const isNarrow = ref(false)
let resizeObserver = null
const rootRef = ref(null)

onMounted(() => {
  if (rootRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        isNarrow.value = entry.contentRect.width < 230
      }
    })
    resizeObserver.observe(rootRef.value)
  }
})
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

const searchText = ref('')
const classFilter = ref('')
const electiveFilter = ref('')
const selectedIds = ref(new Set())

const dragGroup = { name: 'exam-seats', pull: 'clone', put: false }

const unassignedStudents = computed(() => store.unassignedStudents)

const filteredStudents = computed(() => {
  let list = unassignedStudents.value
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(s =>
      s.name.toLowerCase().includes(kw) ||
      (s.className || '').toLowerCase().includes(kw) ||
      (s.classNo || '').toLowerCase().includes(kw)
    )
  }
  if (classFilter.value) {
    list = list.filter(s => s.className === classFilter.value)
  }
  if (electiveFilter.value) {
    list = list.filter(s => (s.electives || []).includes(electiveFilter.value))
  }
  return list
})

// 过滤条件变化时清除选择
watch([searchText, classFilter, electiveFilter], () => {
  selectedIds.value.clear()
})

// DraggableContainer v-model requires a local array
const draggableList = computed({
  get: () => filteredStudents.value,
  set: () => {} // no-op: pool doesn't reorder
})

function toggleSelect(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedIds.value = next
}

function onDragEnd(evt) {
  const nativeEvt = evt.originalEvent
  let clientX = 0, clientY = 0
  if (nativeEvt?.changedTouches?.length) {
    clientX = nativeEvt.changedTouches[0].clientX
    clientY = nativeEvt.changedTouches[0].clientY
  } else if (nativeEvt?.clientX) {
    clientX = nativeEvt.clientX
    clientY = nativeEvt.clientY
  } else {
    return
  }

  const elements = document.elementsFromPoint(clientX, clientY)
  const cell = elements.find(el => el.classList?.contains('esg-cell'))
  if (!cell) return

  const roomId = parseInt(cell.dataset.roomId)
  const seatIndex = parseInt(cell.dataset.seatIndex)
  const studentId = parseInt(evt.item?.dataset?.studentId)

  if (!roomId || isNaN(seatIndex) || !studentId) return

  if (store.isSeatBlocked(roomId, seatIndex)) return
  const existing = store.getAssignment(roomId, seatIndex)
  if (existing?.locked) return // 不覆盖已锁定座位
  if (existing) {
    store.unassignStudent(existing.studentId)
  }

  store.assignStudent(studentId, roomId, seatIndex)
}

function onRemove(student) {
  store.removeStudent(student.id)
}

/**
 * 批量分配选中的学生到当前选中的教室
 */
function onBulkAssign() {
  const room = store.selectedRoom
  if (!room) return
  const ids = [...selectedIds.value]
  if (ids.length === 0) return

  const result = store.bulkAssignStudents(ids, room.id)

  if (result.placed > 0) {
    ElMessage.success(`已将 ${result.placed} 名学生放入【${room.name}】`)
  }
  if (result.failed.length > 0) {
    result.failed.forEach(f => {
      ElMessage.warning(`${store.students.find(s => s.id === f.studentId)?.name || '学生' + f.studentId}：${f.reason}`)
    })
  }

  selectedIds.value.clear()
}
</script>

<style scoped>
.esp-root {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.esp-collapsed {
  height: auto;
}
.esp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--admin-border);
  margin-bottom: 8px;
}
.esp-collapsed .esp-header {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.esp-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.esp-collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--admin-text-muted);
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  transition: all 0.15s;
}
.esp-collapse-btn:hover {
  background: rgba(255,255,255,0.05);
  color: var(--admin-text);
}
.esp-collapse-btn svg {
  transition: transform 0.2s ease;
}
.esp-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
  margin: 0;
}
.esp-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--admin-accent-light);
  background: rgba(99,102,241,0.1);
  min-width: 24px;
  text-align: center;
  padding: 1px 8px;
  border-radius: 10px;
}

/* ---- 工具栏 ---- */
.esp-toolbar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.esp-filters {
  display: flex;
  gap: 4px;
}
.esp-select {
  flex: 1;
  min-width: 0;
  padding: 5px 6px;
  border: 1px solid var(--admin-border);
  border-radius: 5px;
  background: var(--admin-surface);
  color: var(--admin-text);
  font-size: 11px;
  font-family: var(--admin-font);
  cursor: pointer;
  outline: none;
}
.esp-select:focus { border-color: var(--admin-accent); }
.esp-select option {
  background: var(--admin-surface);
  color: var(--admin-text);
}

/* ---- 批量操作栏 ---- */
.esp-bulk-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: rgba(99,102,241,0.06);
  border: 1px solid rgba(99,102,241,0.15);
  border-radius: 6px;
}
.esp-bulk-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--admin-accent-light);
  white-space: nowrap;
}
.esp-bulk-btn {
  padding: 4px 10px;
  border: 1px solid var(--admin-accent);
  background: var(--admin-accent);
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--admin-font);
  transition: all 0.15s;
  white-space: nowrap;
}
.esp-bulk-btn:hover:not(:disabled) {
  background: var(--admin-accent-dark);
  border-color: var(--admin-accent-dark);
}
.esp-bulk-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.esp-bulk-btn-clear {
  background: transparent;
  color: var(--admin-text-muted);
  border-color: var(--admin-border);
}
.esp-bulk-btn-clear:hover {
  background: var(--admin-surface-hover);
  color: var(--admin-text);
  border-color: var(--admin-border-light);
}

/* ---- 列表 ---- */
.esp-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.esp-student {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 6px 8px;
  background: var(--admin-surface);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.15s;
  position: relative;
}
.esp-drag-item {
  opacity: 0.5;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.esp-student:hover {
  border-color: var(--admin-border-light);
  background: var(--admin-surface-hover);
}
.esp-student-selected {
  border-color: var(--admin-accent-light);
  background: rgba(99,102,241,0.06);
}
.esp-ghost {
  opacity: 0.3;
  background: var(--admin-accent);
}

/* ---- 多选复选框 ---- */
.esp-check-label {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-top: 2px;
}
.esp-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: var(--admin-accent);
  margin: 0;
}

.esp-handle {
  font-size: 13px;
  color: var(--admin-text-muted);
  cursor: grab;
  flex-shrink: 0;
  opacity: 0.5;
  line-height: 1.4;
}
.esp-student:hover .esp-handle { opacity: 0.85; }

.esp-info {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1;
}
.esp-name {
  font-weight: 600;
  font-size: 12px;
  color: var(--admin-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.esp-class-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.esp-class {
  font-size: 10px;
  color: var(--admin-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}
.esp-electives {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}
.esp-elective-tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(99,102,241,0.08);
  color: var(--admin-accent-light);
  line-height: 1.6;
  white-space: nowrap;
}
.esp-remove-btn {
  width: 18px; height: 18px;
  border: none;
  background: transparent;
  color: var(--admin-text-muted);
  cursor: pointer;
  font-size: 15px;
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
.esp-student:hover .esp-remove-btn { opacity: 0.5; }
.esp-remove-btn:hover {
  opacity: 1 !important;
  color: var(--admin-danger);
  background: rgba(248,113,113,0.08);
}

/* ---- 窄容器适配 ---- */
.esp-narrow .esp-electives { display: none; }
.esp-narrow .esp-info { flex-wrap: wrap; }

/* ---- 空状态 ---- */
.esp-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--admin-text-muted);
}
.esp-empty-glyph {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.3;
}
.esp-empty p { margin: 0; font-size: 12px; }
</style>
