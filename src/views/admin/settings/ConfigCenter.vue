<template>
  <div class="config-page">
    <div class="admin-card config-header-card">
      <div class="config-header">
        <div>
          <h2 style="margin:0;font-size:16px;color:var(--admin-text)">系统配置中心</h2>
          <p style="margin:4px 0 0;font-size:11px;color:var(--admin-text-muted)">所有数据集合集中管理 · JSON 结构化存储 · 预留 SpringBoot 接口对接</p>
        </div>
        <div style="display:flex;gap:8px">
          <el-button size="small" @click="exportAllJson">📦 导出全部 JSON</el-button>
          <el-button size="small" type="primary" @click="copyAllJson">📋 复制全部 JSON</el-button>
        </div>
      </div>
    </div>

    <!-- Portal Visibility Quick Config -->
    <div class="admin-card portal-config-card">
      <div class="portal-config-head">
        <div>
          <h3 style="margin:0;font-size:14px;color:var(--admin-text)">门户可见性配置</h3>
          <p style="margin:2px 0 0;font-size:11px;color:var(--admin-text-muted)">控制学生门户中各模块是否可见</p>
        </div>
        <el-button size="small" text @click="resetPortalConfig">恢复默认</el-button>
      </div>
      <div class="portal-toggles">
        <div class="pt-row" v-for="item in portalToggles" :key="item.key">
          <div class="pt-info">
            <span class="pt-icon">{{ item.icon }}</span>
            <span class="pt-label">{{ item.label }}</span>
            <span class="pt-desc">{{ item.desc }}</span>
          </div>
          <el-switch v-model="portalCfg[item.key]" size="small" @change="savePortalConfig" />
        </div>
      </div>
    </div>

    <!-- Exam Visibility Detail Config -->
    <div class="admin-card portal-config-card">
      <div class="portal-config-head">
        <div>
          <h3 style="margin:0;font-size:14px;color:var(--admin-text)">考试可见性详细配置</h3>
          <p style="margin:2px 0 0;font-size:11px;color:var(--admin-text-muted)">按考试类型、月份、年级精细控制考试记录可见范围</p>
        </div>
        <el-button size="small" text @click="resetExamVisibility">恢复默认</el-button>
      </div>

      <!-- 月考 — by month -->
      <div class="ev-section">
        <div class="ev-section-head">
          <span>📅 月考（按月份）</span>
          <span class="ev-section-hint">勾选可见月份</span>
        </div>
        <div class="ev-chips">
          <button
            v-for="m in 12" :key="'m'+m"
            class="ev-chip" :class="{ on: examVisibility.monthly[m] }"
            @click="examVisibility.monthly[m] = !examVisibility.monthly[m]; saveExamVisibility()"
          >{{ m }}月</button>
        </div>
      </div>

      <!-- 期中 — by grade -->
      <div class="ev-section">
        <div class="ev-section-head">
          <span>📝 期中考试（按年级）</span>
        </div>
        <div class="ev-grade-row">
          <div class="ev-grade-item" v-for="g in gradeOptions" :key="'mid'+g.key">
            <span class="ev-grade-label">{{ g.label }}</span>
            <el-switch v-model="examVisibility.midterm[g.key]" size="small" @change="saveExamVisibility" />
          </div>
        </div>
      </div>

      <!-- 期末 — by grade -->
      <div class="ev-section">
        <div class="ev-section-head">
          <span>📋 期末考试（按年级）</span>
        </div>
        <div class="ev-grade-row">
          <div class="ev-grade-item" v-for="g in gradeOptions" :key="'fin'+g.key">
            <span class="ev-grade-label">{{ g.label }}</span>
            <el-switch v-model="examVisibility.final[g.key]" size="small" @change="saveExamVisibility" />
          </div>
        </div>
      </div>

      <!-- 其他考试类型 -->
      <div class="ev-section">
        <div class="ev-section-head">
          <span>📊 其他考试类型</span>
        </div>
        <div class="ev-other-row">
          <div class="ev-other-item">
            <span class="ev-other-icon">🏆</span>
            <span class="ev-other-label">模考</span>
            <el-switch v-model="examVisibility.mock" size="small" @change="saveExamVisibility" />
          </div>
          <div class="ev-other-item">
            <span class="ev-other-icon">📄</span>
            <span class="ev-other-label">DSE真题</span>
            <el-switch v-model="examVisibility.dse" size="small" @change="saveExamVisibility" />
          </div>
          <div class="ev-other-item">
            <span class="ev-other-icon">📝</span>
            <span class="ev-other-label">课堂测验</span>
            <el-switch v-model="examVisibility.quiz" size="small" @change="saveExamVisibility" />
          </div>
        </div>
      </div>
    </div>

    <div class="config-grid">
      <div
        v-for="col in collections"
        :key="col.key"
        class="admin-card config-card"
        :class="{ expanded: expanded === col.key }"
        @click="expanded = expanded === col.key ? null : col.key"
      >
        <div class="config-card-header">
          <span class="config-icon">{{ col.icon }}</span>
          <div style="flex:1">
            <div class="config-name">{{ col.label }}</div>
            <div class="config-key">dse_{{ col.key }} · {{ col.count }} 条记录</div>
          </div>
          <div style="display:flex;gap:4px" @click.stop>
            <el-button size="small" text @click="editCollection(col)">✏️</el-button>
            <el-button size="small" text @click="copyCollection(col.key)">📋</el-button>
            <el-button size="small" text @click="exportCollection(col.key)">📥</el-button>
          </div>
        </div>
        <div v-if="expanded === col.key" class="config-json-wrap">
          <pre class="config-json">{{ formatJson(col.data) }}</pre>
        </div>
      </div>
    </div>

    <!-- Edit Collection Dialog -->
    <el-dialog v-model="editVisible" :title="'编辑 ' + editLabel" width="800px" top="5vh" :close-on-click-modal="false">
      <div style="margin-bottom:8px;font-size:11px;color:var(--admin-text-muted)">
        dse_{{ editKey }} · {{ editCount }} 条记录 · 直接编辑 JSON 数组或对象
      </div>
      <el-input v-model="editJson" type="textarea" :rows="20" placeholder="输入 JSON..." style="font-family:'Cascadia Code',monospace;font-size:12px" />
      <div v-if="jsonError" style="color:var(--admin-danger);font-size:11px;margin-top:4px">{{ jsonError }}</div>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="warning" @click="resetCollection">🔄 重置为默认</el-button>
        <el-button type="primary" @click="saveEdit">💾 保存</el-button>
      </template>
    </el-dialog>

    <!-- Full JSON Dialog -->
    <el-dialog v-model="fullJsonVisible" title="全部数据 JSON (SpringBoot Ready)" width="800px" top="5vh">
      <div style="max-height:70vh;overflow-y:auto">
        <pre class="config-json full-json">{{ fullJsonText }}</pre>
      </div>
      <template #footer>
        <el-button size="small" @click="copyAllJson">📋 复制</el-button>
        <el-button size="small" type="primary" @click="exportAllJson">📥 下载 JSON</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 页面：系统配置中心
 * 功能：门户可见性开关、考试可见性精细控制、所有数据集合JSON集中查看与编辑
 * 路由：/admin/config
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { initAllData, portalConfigService } from '@/services/dataService'

const expanded = ref(null)
const portalCfg = ref(portalConfigService.get())

const portalToggles = [
  { key: 'handoverEnabled', label: '早晚班交接', desc: '启用/停用早晚班交接功能,关闭后访问将提示当日无交接内容', icon: '🤝' },
  { key: 'showTimetable', label: '今日课表', desc: '门户首页课表展示', icon: '📅' },
  { key: 'showHomework', label: '待完成作业', desc: '门户首页 & 作业页面', icon: '📝' },
  { key: 'showScores', label: '近期成绩', desc: '门户首页成绩条 & 考试页分数', icon: '📊' },
  { key: 'showRanking', label: '排名显示', desc: '考试记录中的排名信息', icon: '🏆' },
  { key: 'showTeacherFeedback', label: '老师反馈', desc: '首页反馈 & 学情页反馈 & 考试反馈', icon: '💬' },
  { key: 'showExamRecords', label: '考试记录', desc: '我的考试页面整体可见', icon: '📄' },
  { key: 'showAttendance', label: '出勤统计', desc: '出勤率数字显示', icon: '✓' },
  { key: 'showBehavior', label: '课堂表现', desc: '学情页课堂表现记录', icon: '👥' },
  { key: 'showExamTips', label: '做题技巧', desc: '门户做题技巧页面', icon: '💡' }
]

function savePortalConfig() {
  portalConfigService.update(portalCfg.value)
  ElMessage.success('门户可见性已保存')
}

function resetPortalConfig() {
  portalCfg.value = portalConfigService.reset()
  examVisibility.value = portalCfg.value.examVisibility
  ElMessage.success('已恢复默认设置（全部可见）')
}

// --- Exam Visibility ---
const examVisibility = ref(portalCfg.value.examVisibility || portalConfigService.get().examVisibility)
const gradeOptions = [
  { key: 's5', label: '中五 (F5)' },
  { key: 's6', label: '中六 (F6)' }
]

function saveExamVisibility() {
  portalCfg.value.examVisibility = examVisibility.value
  portalConfigService.update({ examVisibility: examVisibility.value })
  ElMessage.success('考试可见性已保存')
}

function resetExamVisibility() {
  examVisibility.value = JSON.parse(JSON.stringify({
    monthly: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true },
    midterm: { s5: true, s6: true },
    final: { s5: true, s6: true },
    mock: true,
    dse: true,
    quiz: true
  }))
  portalCfg.value.examVisibility = examVisibility.value
  portalConfigService.update({ examVisibility: examVisibility.value })
  ElMessage.success('考试可见性已恢复默认（全部可见）')
}
const fullJsonVisible = ref(false)
const editVisible = ref(false)
const editKey = ref('')
const editLabel = ref('')
const editCount = ref(0)
const editJson = ref('')
const jsonError = ref('')

const collectionMeta = [
  { key: 'students', label: '学生信息', icon: '👨‍🎓' },
  { key: 'campuses', label: '校区管理', icon: '🏢' },
  { key: 'classrooms', label: '班级管理', icon: '📚' },
  { key: 'courses', label: '课程维护', icon: '📖' },
  { key: 'timetable', label: '课表管理', icon: '📅' },
  { key: 'exams', label: '考试成绩', icon: '📊' },
  { key: 'homework', label: '作业管理', icon: '📝' },
  { key: 'behaviors', label: '课堂表现', icon: '👥' },
  { key: 'discipline', label: '纪律台账', icon: '⚖️' },
  { key: 'attendance', label: '考勤请假', icon: '✓' },
  { key: 'phoneRegistrations', label: '手机登记', icon: '📱' },
  { key: 'phoneRecords', label: '手机存取记录', icon: '📱' },
  { key: 'counseling', label: '心理辅导', icon: '💬' },
  { key: 'voiceRecordings', label: '语音记录', icon: '🎙️' },
  { key: 'errorBook', label: '错题本', icon: '📄' },
  { key: 'questionBank', label: '题库', icon: '🎯' },
  { key: 'courseFeedback', label: '课堂反馈', icon: '📝' },
  { key: 'parentConferences', label: '家长会预约', icon: '👨‍👩‍👧' },
  { key: 'examPapers', label: '试卷分析', icon: '📋' },
  { key: 'quickActions', label: '快捷操作', icon: '⚡' },
  { key: 'schoolSettings', label: '学校设置', icon: '⚙️' },
  { key: 'portalConfig', label: '门户可见性', icon: '👁️' },
  { key: 'examTips', label: '做题技巧', icon: '💡' }
]

function loadCollection(key) {
  try {
    const raw = localStorage.getItem('dse_' + key)
    return raw ? JSON.parse(raw) : (key === 'schoolSettings' ? {} : [])
  } catch { return [] }
}

const collections = computed(() =>
  collectionMeta.map(m => {
    const data = loadCollection(m.key)
    const count = Array.isArray(data) ? data.length : Object.keys(data).length
    return { ...m, data, count }
  })
)

const fullJson = computed(() => {
  const result = {}
  collectionMeta.forEach(m => {
    result[m.key] = loadCollection(m.key)
  })
  return result
})

const fullJsonText = computed(() => JSON.stringify(fullJson.value, null, 2))

function formatJson(data) {
  return JSON.stringify(data, null, 2)
}

function copyCollection(key) {
  const data = loadCollection(key)
  navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
    ElMessage.success(`dse_${key} JSON 已复制`)
  }).catch(() => {
    ElMessage.warning('复制失败，请手动选择')
  })
}

function exportCollection(key) {
  const data = loadCollection(key)
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dse_${key}_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`${key} 已导出`)
}

function copyAllJson() {
  navigator.clipboard.writeText(fullJsonText.value).then(() => {
    ElMessage.success('全部数据 JSON 已复制到剪贴板')
  }).catch(() => {
    fullJsonVisible.value = true
  })
}

function exportAllJson() {
  const blob = new Blob([fullJsonText.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `DSE_全部数据_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('全部数据 JSON 已导出')
}

// Edit collection
function editCollection(col) {
  editKey.value = col.key
  editLabel.value = col.label
  editCount.value = col.count
  editJson.value = JSON.stringify(col.data, null, 2)
  jsonError.value = ''
  editVisible.value = true
}

function saveEdit() {
  try {
    const parsed = JSON.parse(editJson.value)
    if (editKey.value === 'schoolSettings') {
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        jsonError.value = 'schoolSettings 必须是一个 JSON 对象'
        return
      }
    } else if (!Array.isArray(parsed)) {
      jsonError.value = '该集合数据必须是一个 JSON 数组'
      return
    }
    localStorage.setItem('dse_' + editKey.value, editJson.value)
    editVisible.value = false
    // Force re-compute by triggering a reactive update
    expanded.value = null
    setTimeout(() => { expanded.value = editKey.value }, 50)
    ElMessage.success(`${editLabel.value} 数据已保存`)
  } catch (e) {
    jsonError.value = 'JSON 格式错误: ' + e.message
  }
}

async function resetCollection() {
  try {
    await ElMessageBox.confirm(
      `确定要重置「${editLabel.value}」为默认数据吗？当前数据将丢失。`,
      '确认重置',
      { confirmButtonText: '确认重置', cancelButtonText: '取消', type: 'warning' }
    )
    localStorage.removeItem('dse_' + editKey.value)
    initAllData()
    editVisible.value = false
    ElMessage.success(`${editLabel.value} 已重置为默认数据`)
  } catch {}
}
</script>

<style scoped>
.config-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.config-header-card { margin-bottom: 16px; }

/* Portal Config Card */
.portal-config-card {
  margin-bottom: 18px;
  padding: 20px 22px;
}

.portal-config-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.portal-toggles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 8px;
  transition: background 0.15s;
}

.pt-row:hover { background: var(--admin-bg); }

.pt-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pt-icon { font-size: 18px; width: 30px; text-align: center; flex-shrink: 0; }

.pt-label {
  font-size: 13px;
  color: var(--admin-text);
  font-weight: 500;
  min-width: 80px;
}

.pt-desc {
  font-size: 11px;
  color: var(--admin-text-muted);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 12px;
}

.config-card {
  margin-bottom: 0;
  cursor: pointer;
  transition: border-color 0.2s;
}
.config-card:hover { border-color: var(--admin-accent); }
.config-card.expanded { border-color: var(--admin-accent); }

.config-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-icon {
  font-size: 22px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-bg);
  border-radius: 8px;
  flex-shrink: 0;
}

.config-name { font-size: 13px; color: var(--admin-text); font-weight: 500; }
.config-key { font-size: 10px; color: var(--admin-text-muted); margin-top: 1px; }

.config-json-wrap { margin-top: 12px; }
.config-json {
  background: var(--admin-bg);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  padding: 14px;
  font-size: 11px;
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Segoe UI Mono', 'Consolas', monospace;
  line-height: 1.5;
  color: var(--admin-text-secondary);
  max-height: 360px;
  overflow-y: auto;
  white-space: pre;
  margin: 0;
}
.full-json { max-height: 65vh; }

@media (max-width: 768px) {
  .config-grid { grid-template-columns: 1fr; }
}

/* ---- Exam Visibility ---- */
.ev-section {
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--admin-bg);
}
.ev-section:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }

.ev-section-head {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 600; color: var(--admin-text);
  margin-bottom: 10px;
}

.ev-section-hint {
  font-size: 10px; color: var(--admin-text-muted); font-weight: 400;
  margin-left: auto;
}

.ev-chips {
  display: flex; gap: 6px; flex-wrap: wrap;
}

.ev-chip {
  width: 44px; padding: 5px 0; border-radius: 8px;
  border: 1px solid var(--admin-border);
  background: var(--card-bg);
  font-size: 11px; color: var(--admin-text-secondary);
  cursor: pointer; transition: all 0.16s;
  text-align: center; font-family: var(--font-body);
}
.ev-chip:hover { border-color: var(--admin-accent); color: var(--admin-accent); }
.ev-chip.on {
  background: var(--admin-accent); border-color: var(--admin-accent);
  color: #fff; font-weight: 600;
}

.ev-grade-row {
  display: flex; gap: 20px;
}

.ev-grade-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px; background: var(--admin-bg); border-radius: 8px;
}

.ev-grade-label {
  font-size: 12px; color: var(--admin-text); font-weight: 500; min-width: 60px;
}

.ev-other-row {
  display: flex; gap: 16px; flex-wrap: wrap;
}

.ev-other-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px; background: var(--admin-bg); border-radius: 8px;
}

.ev-other-icon { font-size: 16px; }

.ev-other-label {
  font-size: 12px; color: var(--admin-text); font-weight: 500;
}
</style>
