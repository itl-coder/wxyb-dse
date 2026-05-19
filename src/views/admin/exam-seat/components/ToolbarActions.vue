<template>
  <div class="toolbar-actions">
    <div class="tb-left">
      <!-- 自动排座按钮组 -->
      <div class="tb-arrange-group">
        <button class="tb-btn tb-btn-primary" :disabled="!canAutoArrange" @click="store.runAutoArrange()" title="全部学生随机分配至各教室">
          <span class="tb-btn-icon">⚡</span>自动排座
        </button>
        <button class="tb-btn tb-btn-primary tb-btn-split" :disabled="!canAutoArrange" @click.stop="showArrangeMenu = !showArrangeMenu" title="更多排座选项">
          <span class="tb-btn-arrow">▾</span>
        </button>
        <div class="tb-arrange-menu" v-if="showArrangeMenu">
          <button class="tb-menu-item" @click="doArrange('currentRoom'); showArrangeMenu = false" :disabled="!store.selectedRoomId">📍 仅排当前教室</button>
          <button class="tb-menu-item" @click="doArrange('unassigned'); showArrangeMenu = false">👤 仅排未分配学生</button>
          <button class="tb-menu-item" @click="doArrange('classGroup'); showArrangeMenu = false">🏫 班级独立排布（同班同教室）</button>
        </div>
      </div>

      <!-- 撤销 -->
      <button class="tb-btn" :disabled="!store.canUndo" @click="store.undo()" title="撤销上一步操作 (Ctrl+Z)">
        <span class="tb-btn-icon">↩</span>撤销
      </button>

      <button class="tb-btn" :disabled="store.assignments.length === 0" @click="handleReset">
        <span class="tb-btn-icon">↺</span>清空座位
      </button>
      <button class="tb-btn" :disabled="store.assignments.length === 0" @click="showPrint = true">
        <span class="tb-btn-icon">⎙</span>打印导出
      </button>
      <button class="tb-btn" @click="showImport = true">
        <span class="tb-btn-icon">↓</span>导入学生
      </button>

      <span class="tb-sep"></span>

      <!-- 前台显示配置 -->
      <span class="tb-config-label">前台显示:</span>
      <label class="tb-config-toggle" title="是否在座位表前台显示班级">
        <input type="checkbox" v-model="seatShowClass" @change="saveDisplayConfig" />
        <span>班级</span>
      </label>
      <label class="tb-config-toggle" title="是否在座位表前台显示选修科目">
        <input type="checkbox" v-model="seatShowElectives" @change="saveDisplayConfig" />
        <span>选修</span>
      </label>
    </div>
    <div class="tb-right">
      <el-input
        v-model="localSearch"
        placeholder="搜索考生姓名 / 班级..."
        clearable
        :prefix-icon="Search"
        style="width: 230px"
        @input="onSearch"
      />
      <button class="tb-btn tb-btn-ghost" @click="store.resetAll()">重置全部</button>
    </div>

    <div v-if="store.warnings.length" class="tb-warnings">
      <el-alert
        v-for="(w, i) in store.warnings" :key="i"
        :title="w"
        type="warning"
        :closable="true"
        show-icon
        style="margin-bottom:4px"
      />
    </div>

    <ImportExcelDialog v-if="showImport" @close="showImport = false" />
    <PrintPreview v-if="showPrint" @close="showPrint = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useExamSeatStore } from '../store/examSeatStore.js'
import ImportExcelDialog from './ImportExcelDialog.vue'
import PrintPreview from './PrintPreview.vue'

const store = useExamSeatStore()

const localSearch = ref('')
const showImport = ref(false)
const showPrint = ref(false)
const showArrangeMenu = ref(false)

const canAutoArrange = computed(() => store.students.length > 0 && store.rooms.length > 0)

// 前台显示配置
const seatShowClass = ref(true)
const seatShowElectives = ref(true)

onMounted(() => {
  try {
    const raw = localStorage.getItem('dse_schoolSettings')
    if (raw) {
      const s = JSON.parse(raw)
      seatShowClass.value = s.seatShowClass !== false
      seatShowElectives.value = s.seatShowElectives !== false
    }
  } catch {}
})

function saveDisplayConfig() {
  try {
    const raw = localStorage.getItem('dse_schoolSettings')
    const s = raw ? JSON.parse(raw) : {}
    s.seatShowClass = seatShowClass.value
    s.seatShowElectives = seatShowElectives.value
    localStorage.setItem('dse_schoolSettings', JSON.stringify(s))
  } catch {}
}

function onSearch(val) { store.setSearchKeyword(val || '') }
function handleReset() { store.resetAssignments() }

function doArrange(mode) {
  if (mode === 'currentRoom') {
    store.runAutoArrange({ targetRoomId: store.selectedRoomId })
  } else if (mode === 'unassigned') {
    store.runAutoArrange({ unassignedOnly: true })
  } else if (mode === 'classGroup') {
    store.runAutoArrange({ groupByClass: true })
  }
}

// 点击菜单外部关闭
function onDocClick(e) {
  if (showArrangeMenu.value && !e.target.closest('.tb-arrange-group')) {
    showArrangeMenu.value = false
  }
}
watch(showArrangeMenu, (v) => {
  if (v) document.addEventListener('mousedown', onDocClick)
  else document.removeEventListener('mousedown', onDocClick)
})
onUnmounted(() => document.removeEventListener('mousedown', onDocClick))
</script>

<style scoped>
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tb-left { display: flex; gap: 6px; align-items: center; flex: 1; flex-wrap: wrap; }
.tb-right { display: flex; gap: 6px; align-items: center; }

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border: 1px solid var(--es-border);
  background: var(--es-surface);
  color: var(--es-text);
  border-radius: 7px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  transition: all 0.18s;
  white-space: nowrap;
}
.tb-btn:hover:not(:disabled) {
  border-color: var(--es-border-active);
  background: var(--es-surface-alt);
}
.tb-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.tb-btn-icon { font-size: 14px; line-height: 1; }

.tb-btn-primary {
  background: var(--es-vermillion);
  border-color: var(--es-vermillion);
  color: #fff;
  font-weight: 600;
}
.tb-btn-primary:hover:not(:disabled) {
  background: #d42a45;
  border-color: #d42a45;
  box-shadow: 0 2px 12px var(--es-vermillion-dim);
}
.tb-btn-arrow {
  font-size: 10px;
  margin-left: 2px;
  opacity: 0.7;
}
.tb-btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--es-text-muted);
  font-size: 11px;
}
.tb-btn-ghost:hover { color: var(--es-vermillion); }

.dd-item {
  font-size: 12px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

.tb-warnings { width: 100%; margin-top: 6px; }

/* 排座按钮组 */
.tb-arrange-group {
  position: relative;
  display: inline-flex;
}
.tb-btn-split {
  padding: 7px 8px;
  border-left: 1px solid rgba(255,255,255,0.15);
  border-radius: 0 7px 7px 0;
  margin-left: -1px;
}
.tb-arrange-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 220px;
  background: var(--es-surface);
  border: 1px solid var(--es-border-active);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  z-index: 100;
  overflow: hidden;
  padding: 4px;
}
.tb-menu-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: var(--es-text);
  cursor: pointer;
  font-size: 12px;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  text-align: left;
  border-radius: 5px;
  transition: all 0.12s;
}
.tb-menu-item:hover:not(:disabled) {
  background: var(--es-surface-alt);
  color: var(--es-gold);
}
.tb-menu-item:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 分隔符 */
.tb-sep {
  width: 1px;
  height: 22px;
  background: var(--es-border);
  margin: 0 4px;
}

/* 显示配置 */
.tb-config-label {
  font-size: 10px;
  color: var(--es-text-muted);
  letter-spacing: 0.5px;
}
.tb-config-toggle {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--es-text-secondary);
  cursor: pointer;
  user-select: none;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}
.tb-config-toggle:hover {
  background: var(--es-surface-alt);
}
.tb-config-toggle input {
  width: 13px;
  height: 13px;
  cursor: pointer;
  accent-color: var(--es-vermillion);
}
.tb-config-toggle span {
  white-space: nowrap;
}
</style>
