<template>
  <div class="es2-page">
    <!-- 顶部统计 + 工具栏 -->
    <section class="es2-topbar">
      <div class="es2-stats">
        <span class="es2-stat">
          <b>{{ store.totalStudents }}</b> 考生
        </span>
        <span class="es2-stat-sep">·</span>
        <span class="es2-stat es2-stat-ok">
          <b>{{ store.assignedCount }}</b> 已入座
        </span>
        <span class="es2-stat-sep">·</span>
        <span class="es2-stat es2-stat-warn">
          <b>{{ store.unassignedCount }}</b> 待安排
        </span>
        <span class="es2-stat-sep">·</span>
        <span class="es2-stat">
          <b>{{ store.rooms.length }}</b> 教室
        </span>
        <span class="es2-stat-sep">·</span>
        <span class="es2-stat es2-stat-bad">
          <b>{{ store.totalBlockedCount }}</b> 屏蔽
        </span>
        <span class="es2-stat-sep">·</span>
        <span class="es2-stat es2-stat-info">
          <b>{{ store.conflicts.length }}</b> 冲突
        </span>
      </div>

      <div class="es2-actions">
        <a class="es2-act" @click="showImport = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          导入
        </a>
        <a class="es2-act" @click="showAddStudent = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          录入
        </a>
        <span class="es2-act-sep"></span>
        <a class="es2-act es2-act-primary" :class="{ disabled: !canAutoArrange }" @click="handleAutoArrange">自动排座</a>
        <a class="es2-act" :class="{ disabled: !store.canUndo }" @click="store.undo()">撤销</a>
        <span class="es2-act-sep"></span>
        <a class="es2-act" @click="showPrint = true">打印导出</a>
        <a class="es2-act" @click="showRules = true">规则</a>
        <a class="es2-act" @click="showElectiveProfile = true">画像</a>
        <a class="es2-act" :class="{ active: showDistAssist }" @click="toggleDistAssist">发卷</a>
        <a class="es2-act es2-act-danger" @click="handleResetAll">重置</a>
        <span class="es2-act-sep"></span>
        <label class="es2-toggle"><input type="checkbox" :checked="store.publicShowNames" @change="store.savePublicShowNames($event.target.checked)"/> 姓名</label>
        <label class="es2-toggle"><input type="checkbox" :checked="store.publicShowClass" @change="store.savePublicShowClass($event.target.checked)"/> 班级</label>
        <label class="es2-toggle"><input type="checkbox" :checked="store.publicShowElectives" @change="store.savePublicShowElectives($event.target.checked)"/> 选修</label>
      </div>
    </section>

    <!-- 警告 -->
    <section class="es2-warnings" v-if="store.warnings.length">
      <el-alert
        v-for="(w, i) in store.warnings"
        :key="i"
        :title="w"
        type="warning"
        :closable="true"
        show-icon
        style="margin-bottom:4px"
      />
    </section>

    <!-- 主体三栏 -->
    <section class="es2-main">
      <!-- 左侧：教室列表 -->
      <aside class="es2-sidebar es2-sidebar-left" :style="{ width: leftWidth + 'px' }">
        <ExamSeatRoomSidebar />
      </aside>

      <div class="es2-resize-handle" @mousedown="startResize('left', $event)"></div>

      <!-- 中间：座位表 -->
      <main class="es2-center">
        <ExamSeatHeader />
        <ExamSeatGrid />
      </main>

      <div class="es2-resize-handle" @mousedown="startResize('right', $event)"></div>

      <!-- 右侧：学生池 / 发卷辅助，支持向右折叠 -->
      <aside class="es2-sidebar es2-sidebar-right" :class="{ 'es2-sidebar-folded': rightFolded }" :style="{ width: rightFolded ? '36px' : rightWidth + 'px' }">
        <button class="es2-fold-toggle" @click="rightFolded = !rightFolded" :title="rightFolded ? '展开面板' : '折叠面板'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline v-if="rightFolded" points="15 18 9 12 15 6"/>
            <polyline v-else points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <div class="es2-sidebar-inner" v-show="!rightFolded">
          <ExamDistributionAssist v-if="showDistAssist" @close="showDistAssist = false" @highlight-change="onHighlightChange" />
          <ExamSeatStudentPool v-else />
        </div>
      </aside>
    </section>

    <!-- 导入对话框 -->
    <ImportPreviewDialog v-if="showImport" @close="showImport = false" />

    <!-- 录入学生对话框 -->
    <el-dialog v-model="showAddStudent" title="录入学生" width="460px" :close-on-click-modal="true">
      <div class="es2-add-form">
        <div class="es2-add-field">
          <label>姓名 <em>*</em></label>
          <input v-model="addForm.name" class="es2-add-input" placeholder="学生姓名" maxlength="20" @keyup.enter="doAddStudent"/>
        </div>
        <div class="es2-add-field">
          <label>班级</label>
          <input v-model="addForm.className" class="es2-add-input" placeholder="如：6A" maxlength="20"/>
        </div>
        <div class="es2-add-field">
          <label>学号</label>
          <input v-model="addForm.classNo" class="es2-add-input" placeholder="学号" maxlength="20"/>
        </div>
        <div class="es2-add-field">
          <label>选修科目</label>
          <input v-model="addForm.electivesStr" class="es2-add-input" placeholder="多个用逗号分隔，如：物理,化学,生物" maxlength="100"/>
        </div>
        <div class="es2-add-field">
          <label>状态</label>
          <select v-model="addForm.status" class="es2-add-input">
            <option value="normal">正常</option>
            <option value="special">特殊</option>
            <option value="absent">缺考</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="es2-add-btn" @click="doAddStudent">确认录入</button>
        <button class="es2-add-btn-cancel" @click="showAddStudent = false">取消</button>
      </template>
    </el-dialog>

    <!-- 打印导出对话框 -->
    <ExamSeatPrint v-if="showPrint" @close="showPrint = false" />

    <!-- 选修画像弹窗 -->
    <ExamElectiveProfile v-if="showElectiveProfile" @close="showElectiveProfile = false" />

    <!-- 排座规则弹窗 -->
    <el-dialog v-model="showRules" title="排座规则说明" width="520px" :close-on-click-modal="true">
      <div class="es2-rules-dialog">
        <div class="es2-rules-tags">
          <span class="erp-tag erp-tag-active" v-for="rule in rulesList" :key="rule.key">✓ {{ rule }}</span>
        </div>
        <div class="erp-conflict-summary" v-if="store.selectedRoom" style="margin-top:16px;padding-top:10px;border-top:1px solid var(--admin-border);font-size:13px;">
          <span>当前考场冲突评分：</span>
          <span :style="{ fontWeight:700, fontFamily:'var(--font-mono)', color: conflictScoreColor }">{{ roomConflictScore }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useExamSeat2Store } from './store/examSeat2Store'
import { autoArrangeAll } from './utils/seatAllocator'
import ExamSeatHeader from './components/ExamSeatHeader.vue'
import ExamSeatGrid from './components/ExamSeatGrid.vue'
import ExamSeatStudentPool from './components/ExamSeatStudentPool.vue'
import ExamSeatRoomSidebar from './components/ExamSeatRoomSidebar.vue'
import ExamSeatPrint from './components/ExamSeatPrint.vue'
import ExamDistributionAssist from './components/ExamDistributionAssist.vue'
import ExamElectiveProfile from './components/ExamElectiveProfile.vue'
import ImportPreviewDialog from '@/components/student/ImportPreviewDialog.vue'
import { ElMessageBox, ElMessage } from 'element-plus'

const store = useExamSeat2Store()

const showImport = ref(false)
const showPrint = ref(false)
const showElectiveProfile = ref(false)
const showDistAssist = ref(false)
const showRules = ref(false)
const showAddStudent = ref(false)
const rightFolded = ref(false)

const addForm = reactive({
  name: '', className: '', classNo: '', electivesStr: '', status: 'normal'
})

function resetAddForm() {
  addForm.name = ''; addForm.className = ''; addForm.classNo = ''
  addForm.electivesStr = ''; addForm.status = 'normal'
}

function doAddStudent() {
  const name = addForm.name.trim()
  if (!name) { ElMessage.warning('请输入学生姓名'); return }

  const electives = addForm.electivesStr
    .split(/[,，、\s]+/)
    .map(s => s.trim())
    .filter(Boolean)

  // 生成唯一 ID，不影响已排座数据
  const maxId = store.students.reduce((m, s) => Math.max(m, s.id || 0), 0)
  const student = {
    id: maxId + 1,
    name,
    className: addForm.className.trim(),
    classNo: addForm.classNo.trim(),
    electives,
    status: addForm.status
  }

  store.students.push(student)
  store.persistStudents()
  store.detectConflicts()

  ElMessage.success(`已录入：${name}`)
  resetAddForm()
  showAddStudent.value = false
}

const rulesList = [
  'S型蛇形排座', '同班间隔1位', '优先前后错开', '专属班优先填充',
  '预留位自动跳过', '屏蔽位跳过', '特殊考生前置', '最低冲突方案', '排座后自动锁定'
]

const roomConflictScore = computed(() => {
  if (!store.selectedRoom) return '—'
  return store.conflictScores?.[store.selectedRoom.id] ?? '—'
})

const conflictScoreColor = computed(() => {
  const s = roomConflictScore.value
  if (s === '—') return 'var(--admin-text-muted)'
  if (s <= 5) return 'var(--admin-success)'
  if (s <= 15) return 'var(--admin-warning)'
  return 'var(--admin-danger)'
})

const canAutoArrange = computed(() => store.students.length > 0 && store.rooms.length > 0)

function toggleDistAssist() {
  showDistAssist.value = !showDistAssist.value
  if (showDistAssist.value) rightFolded.value = false
}

function onHighlightChange({ subject, elective, seats }) {
  window.__examDistHighlight = { subject, elective, seats, roomId: store.selectedRoomId }
}

function handleAutoArrange() {
  if (!canAutoArrange.value) return
  store.pushUndoSnapshot()

  store.assignments = store.assignments.filter(a => a.locked)

  const result = autoArrangeAll(
    store.rooms,
    store.students,
    store.assignments,
    store.blockedSeats,
    store.reservedSeats,
    store.doorDirection
  )

  store.assignments = [...store.assignments, ...result.newAssignments]
  store.lockAllNewAssignments(result.newAssignments)
  store.persistAssignments()
  store.detectConflicts()

  if (result.conflictScores) {
    store.conflictScores = result.conflictScores
  }

  result.warnings.forEach(w => store.warnings.push(w))

  const parts = [`已安排 ${result.stats.placed} 人 · 已自动锁定`]
  if (result.stats.unplaced) parts.push(`未分配 ${result.stats.unplaced} 人`)
  if (result.stats.exclusiveFilled) parts.push(`专属 ${result.stats.exclusiveFilled} 人`)

  const report = store.generateArrangeReport()
  if (report.duplicates.length) parts.push(`重复 ${report.duplicates.length} 人`)
  if (report.capacityIssues.length) parts.push(`${report.capacityIssues.length} 间教室座位不足`)

  const scores = Object.values(result.conflictScores || {})
  if (scores.length > 0) {
    const totalScore = scores.reduce((a, b) => a + b, 0)
    if (totalScore > 20) {
      parts.push(`冲突评分 ${totalScore}（建议手动调整）`)
    }
  }

  ElMessage.success(parts.join(' · '))
  if (report.capacityIssues.length) {
    report.capacityIssues.forEach(c => {
      store.warnings.push(`${c.room}(${c.classId}班)：${c.studentCount}名学生，仅${c.available}可用座位，缺少${c.shortage}座`)
    })
  }
}

async function handleResetAll() {
  try {
    await ElMessageBox.confirm(
      '此操作将清空全部数据（学生、分配、屏蔽、预留），从导入 Excel 重新开始。已有数据会通过快照保留，可撤销恢复。',
      '重置全部数据',
      { confirmButtonText: '确认重置', cancelButtonText: '取消', type: 'warning' }
    )
    store.resetAllToDefaults()
    ElMessage.success('已重置全部数据，请导入学生 Excel 开始排座')
  } catch { /* cancelled */ }
}

// 键盘快捷键
function onKeydown(e) {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault()
    store.undo()
  }
  if (e.key === 'Escape') {
    store.selectedSeat = null
  }
}

// ========== 面板拖拽 ==========
const LEFT_DEFAULT = 230; const RIGHT_DEFAULT = 280
const LEFT_MIN = 160; const RIGHT_MIN = 200
const LEFT_MAX = 360; const RIGHT_MAX = 420

function loadWidth(key, fallback) {
  try {
    const v = parseInt(localStorage.getItem(key))
    return v && !isNaN(v) ? Math.max(fallback - 40, Math.min(v, fallback + 100)) : fallback
  } catch { return fallback }
}

const leftWidth = ref(loadWidth('dse_es2_left_w', LEFT_DEFAULT))
const rightWidth = ref(loadWidth('dse_es2_right_w', RIGHT_DEFAULT))

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
    leftWidth.value = Math.min(LEFT_MAX, Math.max(LEFT_MIN, leftWidth.value + dx))
  } else {
    rightWidth.value = Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, rightWidth.value - dx))
  }
  resizing.startX = e.clientX
}
function stopResize() {
  if (resizing) {
    localStorage.setItem('dse_es2_left_w', leftWidth.value)
    localStorage.setItem('dse_es2_right_w', rightWidth.value)
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
.es2-page {
  display: flex; flex-direction: column;
  height: calc(100vh - 104px); gap: 8px;
  position: relative; z-index: 1;
}

/* ---- 顶部统计 + 工具栏 ---- */
.es2-topbar {
  display: flex; align-items: center; gap: 16px;
  flex-shrink: 0; flex-wrap: wrap;
  padding: 8px 14px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
}
.es2-stats {
  display: flex; align-items: center; gap: 6px;
  flex-wrap: wrap; font-size: 12px; color: var(--admin-text-secondary);
}
.es2-stat b {
  font-weight: 700; color: var(--admin-text);
  font-family: var(--font-mono); font-size: 14px; margin-right: 1px;
}
.es2-stat-ok b { color: var(--admin-success); }
.es2-stat-warn b { color: var(--admin-warning); }
.es2-stat-bad b { color: var(--admin-danger); }
.es2-stat-info b { color: var(--admin-accent-light); }
.es2-stat-sep { color: var(--admin-text-muted); opacity: 0.4; font-weight: 300; }

/* ---- 操作链接（非按钮） ---- */
.es2-actions {
  display: flex; align-items: center; gap: 2px;
  margin-left: auto; flex-wrap: wrap;
}
.es2-act {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 9px; border-radius: 5px;
  font-size: 12px; font-weight: 500; color: var(--admin-text-secondary);
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
  text-decoration: none; user-select: none;
}
.es2-act:hover { color: var(--admin-text); background: var(--admin-surface-hover); }
.es2-act.disabled { opacity: 0.3; pointer-events: none; }
.es2-act.active { color: var(--admin-accent-light); background: rgba(99,102,241,0.08); }
.es2-act-primary { color: var(--admin-accent-light); font-weight: 600; }
.es2-act-primary:hover { background: rgba(99,102,241,0.1); }
.es2-act-danger:hover { color: var(--admin-danger); background: rgba(248,113,113,0.08); }
.es2-act-sep {
  width: 1px; height: 16px; background: var(--admin-border);
  margin: 0 4px; flex-shrink: 0;
}

/* 前台显示开关 */
.es2-toggle {
  display: inline-flex; align-items: center; gap: 3px;
  color: var(--admin-text-muted); cursor: pointer;
  font-size: 11px; user-select: none; padding: 2px 4px;
}
.es2-toggle:hover { color: var(--admin-text-secondary); }
.es2-toggle input[type="checkbox"] {
  accent-color: var(--admin-accent); width: 12px; height: 12px; cursor: pointer;
}

/* ---- 警告 ---- */
.es2-warnings { flex-shrink: 0; }

/* ---- 主体 ---- */
.es2-main {
  flex: 1; display: flex; gap: 0; min-height: 0; overflow: hidden;
}
.es2-sidebar {
  flex-shrink: 0; overflow-y: auto;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  padding: 12px; border-radius: 8px;
  transition: width 0.2s ease;
}
.es2-center {
  flex: 1; min-width: 0; display: flex;
  flex-direction: column; gap: 8px;
  padding: 0 8px; overflow: hidden;
}

/* ---- 右侧折叠 ---- */
.es2-sidebar-folded {
  padding: 8px 4px; overflow: hidden;
  display: flex; flex-direction: column; align-items: center;
}
.es2-fold-toggle {
  flex-shrink: 0;
  width: 28px; height: 28px; border: 1px solid var(--admin-border);
  background: var(--admin-surface); color: var(--admin-text-muted);
  border-radius: 5px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.es2-fold-toggle:hover { border-color: var(--admin-border-light); color: var(--admin-text); }
.es2-sidebar-inner { flex: 1; overflow: hidden; min-width: 0; }

/* ---- 拖拽手柄 ---- */
.es2-resize-handle {
  width: 6px; flex-shrink: 0; cursor: col-resize;
  background: transparent; transition: background 0.15s;
  position: relative; z-index: 2;
}
.es2-resize-handle:hover { background: rgba(99,102,241,0.3); }

/* ---- 录入学生表单 ---- */
.es2-add-form { display: flex; flex-direction: column; gap: 12px; }
.es2-add-field { display: flex; flex-direction: column; gap: 4px; }
.es2-add-field label { font-size: 12px; font-weight: 600; color: var(--admin-text-secondary); }
.es2-add-field label em { color: var(--admin-danger); font-style: normal; }
.es2-add-input {
  padding: 8px 12px; border: 1px solid var(--admin-border);
  border-radius: 6px; font-size: 13px; font-family: var(--admin-font);
  color: var(--admin-text); background: var(--admin-surface);
  outline: none; transition: border-color 0.15s;
}
.es2-add-input:focus { border-color: var(--admin-accent); }
.es2-add-btn {
  padding: 8px 24px; border: none; border-radius: 6px;
  background: var(--admin-accent); color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: var(--admin-font);
}
.es2-add-btn:hover { background: var(--admin-accent-dark); }
.es2-add-btn-cancel {
  padding: 8px 20px; border: 1px solid var(--admin-border);
  border-radius: 6px; background: var(--admin-surface);
  color: var(--admin-text-secondary); font-size: 13px; cursor: pointer;
  font-family: var(--admin-font); margin-left: 8px;
}

/* ---- 规则弹窗 ---- */
.es2-rules-dialog { font-family: var(--admin-font); }
.es2-rules-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.erp-tag {
  font-size: 12px; padding: 4px 12px; border-radius: 4px; white-space: nowrap;
}
.erp-tag-active {
  background: rgba(99,102,241,0.08); color: var(--admin-accent-light);
  border: 1px solid rgba(99,102,241,0.15);
}
</style>
