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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { initAllData } from '@/services/dataService'

const expanded = ref(null)
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
  { key: 'schoolSettings', label: '学校设置', icon: '⚙️' }
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
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
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
</style>
