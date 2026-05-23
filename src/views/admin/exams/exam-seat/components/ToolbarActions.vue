<template>
  <div class="toolbar-actions">
    <div class="tb-left">
      <!-- 自动排座按钮 -->
      <button class="tb-btn tb-btn-primary" :disabled="!canAutoArrange" @click="handleAutoArrange" title="随机打散分配至各教室，同班≤4人，选修相邻分离">
        <span class="tb-btn-icon">⚡</span>自动排座
      </button>
      <button class="tb-btn tb-btn-info" @click="showExplain = true" title="查看排座算法说明">
        <span class="tb-btn-icon">?</span>
      </button>

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

    <!-- 自动排座说明弹窗 -->
    <el-dialog v-model="showExplain" title="📐 自动排座算法说明" width="560px" top="5vh">
      <div class="explain-body">
        <div class="explain-section">
          <h4>1. 选修打散</h4>
          <p>按学生第一门选修科目分组，Fisher-Yates 洗牌后轮询取出，确保相同选修的学生不会集中排列。</p>
        </div>
        <div class="explain-section">
          <h4>2. 贪心轮询分配</h4>
          <p>学生在所有可用教室之间轮流分配，避免某一教室人员过密。</p>
        </div>
        <div class="explain-section">
          <h4>3. 同班限制</h4>
          <p>每个教室同一班级最多安排 <strong>4 人</strong>，超过则跳过该教室尝试下一间。</p>
        </div>
        <div class="explain-section">
          <h4>4. 相邻冲突分离</h4>
          <p>分配座位时检查上下左右四个方向的相邻座位，避免同班相邻、同选修相邻。</p>
        </div>
        <div class="explain-section">
          <h4>5. 放宽重试</h4>
          <p>如果严格约束下无座位可分配，放宽同班限制进行第二轮尝试。若仍无空位，该生进入"待安排"列表。</p>
        </div>
        <div class="explain-section">
          <h4>6. 冲突检测</h4>
          <p>排座完成后全局扫描相邻冲突并报告，红色脉动标记冲突座位，方便人工微调。</p>
        </div>
        <div class="explain-note">
          <strong>提示：</strong>自动排座结果默认锁定。如需手动换座，先解锁学生或使用拖拽操作。
        </div>
      </div>
      <template #footer>
        <el-button @click="showExplain = false">关闭</el-button>
        <el-button type="primary" @click="showExplain = false; handleAutoArrange()">开始排座</el-button>
      </template>
    </el-dialog>

    <ImportExcelDialog v-if="showImport" @close="showImport = false" />
    <PrintPreview v-if="showPrint" @close="showPrint = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useExamSeatStore } from '@/views/admin/exams/exam-seat/store/examSeatStore.js'
import ImportExcelDialog from '@/components/student/ImportPreviewDialog.vue'
import PrintPreview from './PrintPreview.vue'

const store = useExamSeatStore()

const localSearch = ref('')
const showImport = ref(false)
const showPrint = ref(false)
const showExplain = ref(false)

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
function handleAutoArrange() { store.runAutoArrange() }
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

.tb-btn-info {
  padding: 7px 10px;
  border-color: var(--es-border);
  background: var(--es-surface-alt);
  color: var(--es-text-secondary);
  font-weight: 700;
}
.tb-btn-info:hover {
  border-color: var(--es-gold);
  color: var(--es-gold);
}

.tb-btn-ghost {
  background: transparent;
  border-color: transparent;
  color: var(--es-text-muted);
  font-size: 11px;
}
.tb-btn-ghost:hover { color: var(--es-vermillion); }

.tb-warnings { width: 100%; margin-top: 6px; }

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

/* 排座说明弹窗 */
.explain-body {
  font-size: 13px;
  color: var(--es-text);
  line-height: 1.7;
}
.explain-section {
  margin-bottom: 16px;
}
.explain-section h4 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--es-gold);
}
.explain-section p {
  margin: 0;
  font-size: 12px;
  color: var(--es-text-secondary);
  padding-left: 8px;
  border-left: 2px solid var(--es-border);
}
.explain-note {
  margin-top: 16px;
  padding: 10px 14px;
  background: rgba(201,168,76,0.06);
  border: 1px solid rgba(201,168,76,0.15);
  border-radius: 8px;
  font-size: 12px;
  color: var(--es-text-secondary);
}
.explain-note strong {
  color: var(--es-gold);
}
</style>
