<template>
  <div class="ai-data-page">
    <!-- Header -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">🛠️ Skills技能收录</div>
          <div class="admin-card-subtitle">收录、管理各类AI工具/平台的实用技能，支持附件与操作日志</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-button size="small" @click="downloadTemplate">📥 下载模板</el-button>
          <el-button size="small" @click="triggerImport">📤 导入Excel</el-button>
          <el-button size="small" @click="exportData">📊 导出Excel</el-button>
          <el-button size="small" type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">🗑 批量删除 ({{ selectedIds.length }})</el-button>
          <el-button size="small" type="primary" @click="openAddDialog">+ 新增技能</el-button>
        </div>
      </div>
    </div>

    <div class="ai-layout">
      <!-- Left: Filters -->
      <div class="ai-sidebar">
        <div class="admin-card">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">🔍 筛选条件</div>
          <div class="admin-form-group">
            <label>分类</label>
            <el-select v-model="filterCategory" style="width:100%" clearable placeholder="全部分类">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
            <div style="margin-top:4px">
              <el-button size="small" text type="primary" style="font-size:11px" @click="categoryManagerRef.open()">⚙️ 管理分类</el-button>
            </div>
          </div>
          <div class="admin-form-group">
            <label>标签</label>
            <div style="max-height:150px;overflow-y:auto">
              <el-checkbox v-for="t in allTags" :key="t" :model-value="filterTags.includes(t)" size="small" style="display:block;margin-bottom:4px" @change="(v) => toggleTag(t, v)">{{ t }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <el-input v-model="searchText" size="small" placeholder="搜索名称/用途..." clearable />
          </div>
        </div>
        <div class="admin-card" style="margin-top:8px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:10px">📊 统计</div>
          <div style="font-size:11px;color:var(--admin-text-secondary);line-height:1.8">
            <div>总技能数：<b style="color:var(--admin-text)">{{ skills.length }}</b></div>
            <div v-for="c in categoryStats" :key="c.name" style="display:flex;align-items:center;gap:6px">
              <span style="width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ c.name }}</span>
              <div style="flex:1;height:4px;background:var(--admin-bg);border-radius:2px"><div :style="{width:c.pct+'%',background:'var(--admin-accent-gradient)',height:'100%',borderRadius:'2px'}"></div></div>
              <span style="min-width:24px;text-align:right">{{ c.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Table -->
      <div class="ai-main">
        <div class="admin-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600;color:var(--admin-text)">
              技能列表（{{ filteredSkills.length }} 项）
              <span v-if="filterCategory || filterTags.length || searchText" style="color:var(--admin-accent-light);font-size:11px"> · 已筛选</span>
            </span>
            <el-button size="small" @click="clearFilters" :disabled="!filterCategory && !filterTags.length && !searchText">清除筛选</el-button>
          </div>
          <el-table
            :data="pagedSkills"
            style="width:100%"
            size="small"
            :row-class-name="() => 'ai-table-row'"
            @selection-change="onSelectionChange"
            ref="tableRef"
          >
            <el-table-column type="selection" width="40" />
            <el-table-column prop="id" label="ID" width="60" sortable />
            <el-table-column prop="nameEn" label="名称(EN)" width="160" sortable>
              <template #default="{ row }">
                <span style="font-family:monospace;font-size:12px;color:var(--admin-accent-light)">{{ row.nameEn }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="nameCn" label="名称(CN)" width="140" sortable />
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                <span class="admin-tag info" style="font-size:10px">{{ row.category || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="purpose" label="用途" min-width="180" show-overflow-tooltip />
            <el-table-column label="标签" width="160">
              <template #default="{ row }">
                <span v-if="!row.tags || row.tags.length === 0" style="color:var(--admin-text-muted);font-size:11px">-</span>
                <span v-for="t in (row.tags || []).slice(0, 3)" :key="t" class="admin-tag" style="font-size:10px;margin-right:3px;background:var(--admin-surface-hover)">{{ t }}</span>
                <span v-if="(row.tags || []).length > 3" style="font-size:10px;color:var(--admin-text-muted)">+{{ row.tags.length - 3 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="附件" width="60" align="center">
              <template #default="{ row }">
                <span v-if="(row.screenshots || []).length" style="font-size:12px" :title="row.screenshots.length + ' 张截图'">🖼️{{ row.screenshots.length }}</span>
                <span v-else style="color:var(--admin-text-muted)">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="110" sortable />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click="openViewDialog(row)">查看</el-button>
                <el-button size="small" text type="primary" @click="openEditDialog(row)">编辑</el-button>
                <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="display:flex;justify-content:flex-end;margin-top:12px">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredSkills.length"
              layout="total, sizes, prev, pager, next"
              small
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
    <input ref="importInput" type="file" accept=".xlsx,.xls" style="display:none" @change="handleImportFile" />

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑技能' : '新增技能'"
      width="720px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>名称(EN) <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="form.nameEn" size="small" placeholder="例如: Cursor AI" />
        </div>
        <div class="admin-form-group">
          <label>名称(CN) <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="form.nameCn" size="small" placeholder="例如: AI编程助手" />
        </div>
        <div class="admin-form-group">
          <label>分类 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="form.category" style="width:100%" size="small" filterable placeholder="选择分类">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>标签（逗号分隔）</label>
          <el-input v-model="tagsInput" size="small" placeholder="例如: AI, 编程, 效率" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>用途</label>
        <el-input v-model="form.purpose" size="small" type="textarea" :rows="2" placeholder="简述该技能的用途" />
      </div>
      <div class="admin-form-group">
        <label>安装命令</label>
        <el-input v-model="form.installCommand" size="small" placeholder="npm install / pip install / 下载地址等" />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>使用指南 (Markdown)</label>
          <el-input v-model="form.usageGuide" size="small" type="textarea" :rows="4" placeholder="支持Markdown格式..." />
        </div>
        <div class="admin-form-group">
          <label>常见问题 (Markdown)</label>
          <el-input v-model="form.faq" size="small" type="textarea" :rows="4" placeholder="支持Markdown格式..." />
        </div>
      </div>
      <div class="admin-form-group">
        <label>视频链接</label>
        <el-input v-model="form.videoUrl" size="small" placeholder="YouTube/B站 视频链接" />
      </div>
      <div class="admin-form-group">
        <label>截图附件（每张≤2MB，最多5张）</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
          <div v-for="(img, idx) in (form.screenshots || [])" :key="idx" style="position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid var(--admin-border)">
            <img :src="img" style="width:100%;height:100%;object-fit:cover" />
            <button @click="removeScreenshot(idx)" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;line-height:1">✕</button>
          </div>
          <label v-if="(form.screenshots || []).length < 5" style="width:80px;height:80px;border:1px dashed var(--admin-border);border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:24px;color:var(--admin-text-muted);transition:all 0.2s" @mouseenter="(e) => { e.target.style.borderColor = 'var(--admin-accent-light)'; e.target.style.color = 'var(--admin-accent-light)' }" @mouseleave="(e) => { e.target.style.borderColor = 'var(--admin-border)'; e.target.style.color = 'var(--admin-text-muted)' }">
            +
            <input type="file" accept="image/*" style="display:none" @change="handleScreenshotUpload" />
          </label>
        </div>
      </div>
      <template #footer>
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="handleSave" :disabled="!form.nameEn || !form.nameCn || !form.category">{{ isEditing ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>

    <!-- View Detail Dialog -->
    <el-dialog v-model="viewVisible" title="技能详情" width="800px" destroy-on-close>
      <template v-if="viewItem">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <span style="font-size:18px;font-weight:700;color:var(--admin-text)">{{ viewItem.nameCn }}</span>
          <span style="font-family:monospace;font-size:13px;color:var(--admin-text-secondary)">{{ viewItem.nameEn }}</span>
          <span class="admin-tag info" style="font-size:10px">{{ viewItem.category }}</span>
        </div>
        <div class="ai-detail-grid">
          <div class="ai-detail-item">
            <div class="ai-detail-label">用途</div>
            <div class="ai-detail-value">{{ viewItem.purpose || '-' }}</div>
          </div>
          <div class="ai-detail-item">
            <div class="ai-detail-label">安装命令</div>
            <div class="ai-detail-value" style="font-family:monospace">{{ viewItem.installCommand || '-' }}</div>
          </div>
          <div class="ai-detail-item">
            <div class="ai-detail-label">视频链接</div>
            <div class="ai-detail-value">{{ viewItem.videoUrl || '-' }}</div>
          </div>
          <div class="ai-detail-item">
            <div class="ai-detail-label">标签</div>
            <div class="ai-detail-value">
              <span v-if="!viewItem.tags || viewItem.tags.length === 0">-</span>
              <span v-for="t in viewItem.tags" :key="t" class="admin-tag" style="font-size:10px;margin-right:4px;background:var(--admin-surface-hover)">{{ t }}</span>
            </div>
          </div>
        </div>
        <div class="ai-detail-section">
          <div class="ai-detail-label">使用指南</div>
          <div class="ai-detail-content" v-html="renderMarkdown(viewItem.usageGuide || '暂无')"></div>
        </div>
        <div class="ai-detail-section">
          <div class="ai-detail-label">常见问题</div>
          <div class="ai-detail-content" v-html="renderMarkdown(viewItem.faq || '暂无')"></div>
        </div>
        <div v-if="(viewItem.screenshots || []).length" class="ai-detail-section">
          <div class="ai-detail-label">截图附件（{{ viewItem.screenshots.length }} 张）</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <img v-for="(img, idx) in viewItem.screenshots" :key="idx" :src="img" style="max-width:200px;max-height:160px;border-radius:6px;border:1px solid var(--admin-border);object-fit:cover;cursor:pointer" @click="previewImg = img" />
          </div>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--admin-text-muted)">
          创建时间：{{ viewItem.createdAt }} · 更新时间：{{ viewItem.updatedAt || viewItem.createdAt }}
        </div>
      </template>
      <template #footer>
        <el-button size="small" @click="viewVisible = false">关闭</el-button>
        <el-button size="small" type="primary" @click="viewVisible = false; openEditDialog(viewItem)">编辑</el-button>
      </template>
    </el-dialog>

    <!-- Operation Log Dialog -->
    <el-dialog v-model="logVisible" title="操作日志" width="640px">
      <el-timeline v-if="logs.length > 0">
        <el-timeline-item
          v-for="l in logs"
          :key="l.id"
          :timestamp="l.timestamp"
          placement="top"
          size="small"
        >
          <div style="font-size:12px">
            <b>{{ l.operator }}</b>
            <span style="margin:0 4px;color:var(--admin-text-muted)">
              {{ { create: '创建了', update: '更新了', delete: '删除了', batchDelete: '批量删除了', import: '导入了' }[l.action] || l.action }}
            </span>
            <b>{{ l.entityLabel || '#' + l.entityId }}</b>
            <span v-if="l.details" style="color:var(--admin-text-secondary);margin-left:4px">{{ l.details }}</span>
          </div>
        </el-timeline-item>
      </el-timeline>
      <div v-else style="text-align:center;padding:40px;color:var(--admin-text-muted)">暂无操作记录</div>
    </el-dialog>

    <!-- Image Preview -->
    <el-dialog v-model="imgPreviewVisible" title="图片预览" width="auto" :close-on-click-modal="true">
      <img :src="previewImg" style="max-width:80vw;max-height:70vh;border-radius:8px" />
    </el-dialog>

    <AiCategoryManager ref="categoryManagerRef" module-key="ai_skills" module-label="Skills技能" @updated="loadSkills" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { aiSkillsService, operationLogService } from '@/services/dataService'
import { useExcel } from '@/composables/useExcel'
import { useAttachment } from '@/composables/useAttachment'
import { useAppStore } from '@/stores/app'
import AiCategoryManager from '@/components/admin/AiCategoryManager.vue'

const store = useAppStore()
const { exportToExcel, importFromExcel, downloadTemplate } = useExcel()
const { validateFile, ALL_IMAGE_TYPES } = useAttachment()

const skills = ref([])
const selectedIds = ref([])
const tableRef = ref(null)
const importInput = ref(null)
const categoryManagerRef = ref(null)

// Filters
const filterCategory = ref('')
const filterTags = ref([])
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// Dialog states
const dialogVisible = ref(false)
const isEditing = ref(false)
const viewVisible = ref(false)
const logVisible = ref(false)
const imgPreviewVisible = ref(false)
const previewImg = ref('')
const viewItem = ref(null)
const logs = ref([])
const editingId = ref(null)

// Form
const defaultForm = () => ({
  nameEn: '', nameCn: '', category: '', purpose: '',
  installCommand: '', usageGuide: '', faq: '', videoUrl: '',
  screenshots: [], tags: []
})
const form = ref(defaultForm())
const tagsInput = ref('')

// Excel columns
const skillColumns = [
  { prop: 'nameEn', label: '名称(EN)', width: 20 },
  { prop: 'nameCn', label: '名称(CN)', width: 20 },
  { prop: 'category', label: '分类', width: 12 },
  { prop: 'purpose', label: '用途', width: 30 },
  { prop: 'installCommand', label: '安装命令', width: 30 },
  { prop: 'tags', label: '标签', width: 25, transform: v => (v || []).join(', ') }
]

// Computed
const categories = computed(() => aiSkillsService.getCategories())
const allTags = computed(() => aiSkillsService.getAllTags())

const filteredSkills = computed(() => {
  let list = [...skills.value]
  if (filterCategory.value) list = list.filter(s => s.category === filterCategory.value)
  if (filterTags.value.length) list = list.filter(s => filterTags.value.some(t => (s.tags || []).includes(t)))
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(s =>
      (s.nameEn || '').toLowerCase().includes(q) ||
      (s.nameCn || '').toLowerCase().includes(q) ||
      (s.purpose || '').toLowerCase().includes(q) ||
      (s.installCommand || '').toLowerCase().includes(q)
    )
  }
  list.sort((a, b) => (b.id || 0) - (a.id || 0))
  return list
})

const pagedSkills = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredSkills.value.slice(start, start + pageSize.value)
})

const categoryStats = computed(() => {
  const map = {}
  skills.value.forEach(s => {
    const c = s.category || '未分类'
    map[c] = (map[c] || 0) + 1
  })
  const total = skills.value.length || 1
  return Object.entries(map).map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }))
})

function toggleTag(tag, checked) {
  if (checked) {
    filterTags.value.push(tag)
  } else {
    filterTags.value = filterTags.value.filter(t => t !== tag)
  }
}

function clearFilters() {
  filterCategory.value = ''
  filterTags.value = []
  searchText.value = ''
  currentPage.value = 1
}

function onSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

// Load data
function loadSkills() {
  skills.value = aiSkillsService.getAll()
}

// CRUD
function openAddDialog() {
  isEditing.value = false
  editingId.value = null
  form.value = defaultForm()
  tagsInput.value = ''
  dialogVisible.value = true
}

function openEditDialog(item) {
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    nameEn: item.nameEn || '',
    nameCn: item.nameCn || '',
    category: item.category || '',
    purpose: item.purpose || '',
    installCommand: item.installCommand || '',
    usageGuide: item.usageGuide || '',
    faq: item.faq || '',
    videoUrl: item.videoUrl || '',
    screenshots: [...(item.screenshots || [])],
    tags: [...(item.tags || [])]
  }
  tagsInput.value = (item.tags || []).join(', ')
  dialogVisible.value = true
}

function handleSave() {
  const tags = tagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
  const data = {
    ...form.value,
    tags,
    updatedAt: new Date().toISOString().slice(0, 10)
  }

  if (isEditing.value && editingId.value) {
    data.createdAt = skills.value.find(s => s.id === editingId.value)?.createdAt || data.updatedAt
    aiSkillsService.update(editingId.value, data)
    operationLogService.log('ai-skills', 'update', editingId.value, data.nameCn, `更新技能: ${data.nameEn}`)
  } else {
    data.createdAt = new Date().toISOString().slice(0, 10)
    const created = aiSkillsService.create(data)
    operationLogService.log('ai-skills', 'create', created.id, data.nameCn, `新增技能: ${data.nameEn}`)
  }
  dialogVisible.value = false
  loadSkills()
}

function handleDelete(item) {
  if (!confirm(`确定删除「${item.nameCn}」吗？此操作不可恢复。`)) return
  aiSkillsService.delete(item.id)
  operationLogService.log('ai-skills', 'delete', item.id, item.nameCn, `删除技能: ${item.nameEn}`)
  loadSkills()
}

function handleBatchDelete() {
  if (!confirm(`确定批量删除选中的 ${selectedIds.value.length} 项技能吗？此操作不可恢复。`)) return
  aiSkillsService.batchDelete(selectedIds.value)
  const names = skills.value.filter(s => selectedIds.value.includes(s.id)).map(s => s.nameCn).join(', ')
  operationLogService.log('ai-skills', 'batchDelete', 0, names, `批量删除 ${selectedIds.value.length} 项`)
  selectedIds.value = []
  loadSkills()
}

function openViewDialog(item) {
  viewItem.value = item
  logs.value = operationLogService.getByModule('ai-skills').filter(l => l.entityId === item.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  viewVisible.value = true
}

// Attachments
function handleScreenshotUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const err = validateFile(file, ALL_IMAGE_TYPES, 2)
  if (err) { alert(err); e.target.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => {
    if (!form.value.screenshots) form.value.screenshots = []
    form.value.screenshots.push(reader.result)
    e.target.value = ''
  }
  reader.readAsDataURL(file)
}

function removeScreenshot(idx) {
  form.value.screenshots.splice(idx, 1)
}

// Excel
function exportData() {
  exportToExcel(skills.value, skillColumns, 'Skills技能收录.xlsx', 'Skills')
}

function triggerImport() {
  importInput.value?.click()
}

async function handleImportFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const imported = await importFromExcel(file, skillColumns)
    if (imported.length === 0) { alert('未识别到有效数据，请检查Excel格式'); return }
    if (!confirm(`识别到 ${imported.length} 条数据，确认导入？`)) { e.target.value = ''; return }
    aiSkillsService.importBatch(imported)
    operationLogService.log('ai-skills', 'import', 0, `批量导入`, `导入 ${imported.length} 条技能数据`)
    loadSkills()
  } catch (err) {
    alert('导入失败：' + err.message)
  }
  e.target.value = ''
}

function renderMarkdown(text) {
  if (!text) return ''
  // Simple markdown rendering for display
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/### (.+)/g, '<h4>$1</h4>')
    .replace(/## (.+)/g, '<h3>$1</h3>')
    .replace(/# (.+)/g, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/`(.+?)`/g, '<code style="background:var(--admin-bg-secondary);padding:1px 5px;border-radius:3px;font-family:monospace">$1</code>')
    .replace(/\n/g, '<br>')
}

watch(() => [filterCategory.value, filterTags.value, searchText.value], () => {
  currentPage.value = 1
})

onMounted(() => {
  loadSkills()
})
</script>

<style scoped>
.ai-data-page {
  padding: 0;
}
.ai-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  margin-top: 16px;
}
.ai-sidebar {
  position: sticky;
  top: 72px;
  align-self: start;
}
.ai-main {
  min-width: 0;
}

/* Detail grid */
.ai-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.ai-detail-item {
  padding: 10px 12px;
  background: var(--admin-bg-secondary);
  border-radius: var(--admin-radius-sm);
}
.ai-detail-label {
  font-size: 11px;
  color: var(--admin-text-muted);
  margin-bottom: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ai-detail-value {
  font-size: 13px;
  color: var(--admin-text);
  word-break: break-word;
}
.ai-detail-section {
  margin-top: 14px;
}
.ai-detail-section .ai-detail-label {
  margin-bottom: 8px;
}
.ai-detail-content {
  font-size: 13px;
  color: var(--admin-text);
  line-height: 1.7;
  padding: 12px;
  background: var(--admin-bg-secondary);
  border-radius: var(--admin-radius-sm);
  max-height: 300px;
  overflow-y: auto;
}
.ai-detail-content :deep(h2) { font-size: 15px; margin: 8px 0 4px; }
.ai-detail-content :deep(h3) { font-size: 14px; margin: 6px 0 3px; }
.ai-detail-content :deep(h4) { font-size: 13px; margin: 4px 0 2px; }
.ai-detail-content :deep(code) { font-size: 11px; }

@media (max-width: 900px) {
  .ai-layout {
    grid-template-columns: 1fr;
  }
  .ai-sidebar {
    position: static;
  }
}
</style>
