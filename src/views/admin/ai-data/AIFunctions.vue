<template>
  <div class="ai-data-page">
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📊 Excel公式收录</div>
          <div class="admin-card-subtitle">收录常用Excel函数与公式，含参数说明、案例与常见错误</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-button size="small" @click="downloadTemplate">📥 下载模板</el-button>
          <el-button size="small" @click="triggerImport">📤 导入Excel</el-button>
          <el-button size="small" @click="exportData">📊 导出Excel</el-button>
          <el-button size="small" type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">🗑 批量删除 ({{ selectedIds.length }})</el-button>
          <el-button size="small" type="primary" @click="openAddDialog">+ 新增公式</el-button>
        </div>
      </div>
    </div>

    <div class="ai-layout">
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
            <label>难度</label>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <el-checkbox v-for="d in difficulties" :key="d.value" :model-value="filterDifficulties.includes(d.value)" size="small" @change="(v) => toggleFilter('difficulties', d.value, v)">{{ d.label }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <label>标签</label>
            <div style="max-height:150px;overflow-y:auto">
              <el-checkbox v-for="t in allTags" :key="t" :model-value="filterTags.includes(t)" size="small" style="display:block;margin-bottom:4px" @change="(v) => toggleTag(t, v)">{{ t }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <el-input v-model="searchText" size="small" placeholder="搜索函数名/公式/描述..." clearable />
          </div>
        </div>
        <div class="admin-card" style="margin-top:8px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:10px">📊 统计</div>
          <div style="font-size:11px;color:var(--admin-text-secondary);line-height:1.8">
            <div>总公式数：<b style="color:var(--admin-text)">{{ items.length }}</b></div>
            <div v-for="d in difficultyStats" :key="d.name" style="display:flex;align-items:center;gap:6px">
              <span style="width:48px">{{ d.name }}</span>
              <div style="flex:1;height:4px;background:var(--admin-bg);border-radius:2px"><div :style="{width:d.pct+'%',background:difficultyColor(d.value),height:'100%',borderRadius:'2px'}"></div></div>
              <span style="min-width:20px;text-align:right">{{ d.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ai-main">
        <div class="admin-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600;color:var(--admin-text)">
              公式列表（{{ filteredItems.length }} 项）
              <span v-if="filterCategory || filterDifficulties.length || filterTags.length || searchText" style="color:var(--admin-accent-light);font-size:11px"> · 已筛选</span>
            </span>
            <el-button size="small" @click="clearFilters">清除筛选</el-button>
          </div>
          <el-table :data="pagedItems" style="width:100%" size="small" @selection-change="onSelectionChange">
            <el-table-column type="selection" width="40" />
            <el-table-column prop="id" label="ID" width="60" sortable />
            <el-table-column prop="functionName" label="函数名" width="140" sortable>
              <template #default="{ row }">
                <span style="font-family:'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;font-size:13px;font-weight:600;color:var(--admin-accent-cyan)">{{ row.functionName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="公式" min-width="220">
              <template #default="{ row }">
                <code style="background:var(--admin-bg-secondary);padding:2px 8px;border-radius:4px;font-size:11px;word-break:break-all">{{ row.formula }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                <span class="admin-tag info" style="font-size:10px">{{ row.category || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="难度" width="80" align="center">
              <template #default="{ row }">
                <span class="admin-tag" :style="difficultyTagStyle(row.difficulty)" style="font-size:10px">{{ difficultyLabel(row.difficulty) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="标签" width="150">
              <template #default="{ row }">
                <span v-if="!row.tags || !row.tags.length" style="color:var(--admin-text-muted);font-size:11px">-</span>
                <span v-for="t in (row.tags || []).slice(0, 2)" :key="t" class="admin-tag" style="font-size:10px;margin-right:3px;background:var(--admin-surface-hover)">{{ t }}</span>
                <span v-if="(row.tags || []).length > 2" style="font-size:10px;color:var(--admin-text-muted)">+{{ row.tags.length - 2 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="附件" width="60" align="center">
              <template #default="{ row }">
                <span v-if="(row.screenshots || []).length" style="font-size:12px">🖼️{{ row.screenshots.length }}</span>
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
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,20,50,100]" :total="filteredItems.length" layout="total, sizes, prev, pager, next" small />
          </div>
        </div>
      </div>
    </div>

    <input ref="importInput" type="file" accept=".xlsx,.xls" style="display:none" @change="handleImportFile" />

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑公式' : '新增公式'" width="720px" :close-on-click-modal="false" destroy-on-close>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>函数名 <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="form.functionName" size="small" placeholder="例如: VLOOKUP" />
        </div>
        <div class="admin-form-group">
          <label>分类 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="form.category" style="width:100%" size="small" filterable placeholder="选择分类">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>公式 <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="form.formula" size="small" placeholder="例如: =VLOOKUP(A1, B:C, 2, FALSE)" style="font-family:monospace" />
        </div>
        <div class="admin-form-group">
          <label>难度</label>
          <el-select v-model="form.difficulty" style="width:100%" size="small">
            <el-option v-for="d in difficulties" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>
      </div>
      <div class="admin-form-group">
        <label>描述</label>
        <el-input v-model="form.description" size="small" type="textarea" :rows="2" placeholder="简述该公式的用途" />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>参数说明（每行一个参数，格式: 参数名: 说明）</label>
          <el-input v-model="paramsInput" size="small" type="textarea" :rows="3" placeholder="lookup_value: 要查找的值&#10;table_array: 查找范围" />
        </div>
        <div class="admin-form-group">
          <label>使用案例（每行一个案例）</label>
          <el-input v-model="examplesInput" size="small" type="textarea" :rows="3" placeholder="查找学生成绩: =VLOOKUP(A1, Sheet2!A:B, 2, FALSE)" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>常见错误</label>
        <el-input v-model="errorCasesInput" size="small" type="textarea" :rows="2" placeholder="每行一个常见错误场景" />
      </div>
      <div class="admin-form-group">
        <label>标签（逗号分隔）</label>
        <el-input v-model="tagsInput" size="small" placeholder="例如: 查找, 引用, 入门" />
      </div>
      <div class="admin-form-group">
        <label>截图附件（每张≤2MB，最多5张）</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
          <div v-for="(img, idx) in (form.screenshots || [])" :key="idx" style="position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid var(--admin-border)">
            <img :src="img" style="width:100%;height:100%;object-fit:cover" />
            <button @click="removeScreenshot(idx)" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer">✕</button>
          </div>
          <label v-if="(form.screenshots || []).length < 5" class="ai-upload-btn">
            +<input type="file" accept="image/*" style="display:none" @change="handleScreenshotUpload" />
          </label>
        </div>
      </div>
      <template #footer>
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="handleSave" :disabled="!form.functionName || !form.formula || !form.category">{{ isEditing ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog v-model="viewVisible" title="公式详情" width="800px" destroy-on-close>
      <template v-if="viewItem">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <code style="font-size:18px;font-weight:700;color:var(--admin-accent-cyan);background:var(--admin-bg-secondary);padding:4px 12px;border-radius:6px">{{ viewItem.functionName }}</code>
          <span class="admin-tag info">{{ viewItem.category }}</span>
          <span class="admin-tag" :style="difficultyTagStyle(viewItem.difficulty)">{{ difficultyLabel(viewItem.difficulty) }}</span>
        </div>
        <div class="ai-detail-section">
          <div class="ai-detail-label">公式</div>
          <code style="background:var(--admin-bg-secondary);padding:8px 12px;border-radius:6px;display:block;font-size:13px">{{ viewItem.formula }}</code>
        </div>
        <div class="ai-detail-section">
          <div class="ai-detail-label">描述</div>
          <div class="ai-detail-value">{{ viewItem.description || '-' }}</div>
        </div>
        <div v-if="(viewItem.params || []).length" class="ai-detail-section">
          <div class="ai-detail-label">参数说明</div>
          <div style="font-size:12px;color:var(--admin-text)">
            <div v-for="(p, i) in viewItem.params" :key="i" style="padding:4px 0;border-bottom:1px solid var(--admin-border-light)">{{ p }}</div>
          </div>
        </div>
        <div v-if="(viewItem.examples || []).length" class="ai-detail-section">
          <div class="ai-detail-label">使用案例</div>
          <div style="font-size:12px;color:var(--admin-text)">
            <div v-for="(e, i) in viewItem.examples" :key="i" style="padding:4px 0;border-bottom:1px solid var(--admin-border-light);font-family:monospace">{{ e }}</div>
          </div>
        </div>
        <div v-if="(viewItem.errorCases || []).length" class="ai-detail-section">
          <div class="ai-detail-label">常见错误</div>
          <div style="font-size:12px;color:var(--admin-danger)">
            <div v-for="(e, i) in viewItem.errorCases" :key="i" style="padding:4px 0">⚠️ {{ e }}</div>
          </div>
        </div>
        <div v-if="(viewItem.tags || []).length" class="ai-detail-section">
          <span v-for="t in viewItem.tags" :key="t" class="admin-tag" style="font-size:10px;margin-right:4px;background:var(--admin-surface-hover)">{{ t }}</span>
        </div>
        <div v-if="(viewItem.screenshots || []).length" class="ai-detail-section">
          <div class="ai-detail-label">截图（{{ viewItem.screenshots.length }} 张）</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <img v-for="(img, idx) in viewItem.screenshots" :key="idx" :src="img" style="max-width:200px;max-height:160px;border-radius:6px;border:1px solid var(--admin-border);object-fit:cover;cursor:pointer" @click="previewImg = img; imgPreviewVisible = true" />
          </div>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--admin-text-muted)">创建时间：{{ viewItem.createdAt }} · 更新时间：{{ viewItem.updatedAt || viewItem.createdAt }}</div>
      </template>
      <template #footer>
        <el-button size="small" @click="viewVisible = false">关闭</el-button>
        <el-button size="small" type="primary" @click="viewVisible = false; openEditDialog(viewItem)">编辑</el-button>
      </template>
    </el-dialog>

    <!-- Operation Log -->
    <el-dialog v-model="logVisible" title="操作日志" width="640px">
      <el-timeline v-if="logs.length">
        <el-timeline-item v-for="l in logs" :key="l.id" :timestamp="l.timestamp" placement="top" size="small">
          <div style="font-size:12px">
            <b>{{ l.operator }}</b>
            <span style="margin:0 4px;color:var(--admin-text-muted)">
              {{ { create:'创建了', update:'更新了', delete:'删除了', batchDelete:'批量删除了', import:'导入了' }[l.action] || l.action }}
            </span>
            <b>{{ l.entityLabel || '#' + l.entityId }}</b>
          </div>
        </el-timeline-item>
      </el-timeline>
      <div v-else style="text-align:center;padding:40px;color:var(--admin-text-muted)">暂无操作记录</div>
    </el-dialog>

    <el-dialog v-model="imgPreviewVisible" title="图片预览" width="auto"><img :src="previewImg" style="max-width:80vw;max-height:70vh;border-radius:8px" /></el-dialog>

    <AiCategoryManager ref="categoryManagerRef" module-key="ai_excel_functions" module-label="Excel公式" @updated="loadItems" />
  </div>
</template>

<script setup>
/**
 * 页面：Excel公式收录管理
 * 功能：收录常用Excel函数与公式，含参数说明、使用案例、常见错误，支持难度分类与Excel导入导出
 * 路由：/admin/ai-functions
 */
import { ref, computed, watch, onMounted } from 'vue'
import { aiExcelFunctionsService, operationLogService } from '@/services/dataService'
import { useExcel } from '@/composables/useExcel'
import { useAttachment } from '@/composables/useAttachment'
import AiCategoryManager from '@/components/admin/AiCategoryManager.vue'

const { exportToExcel, importFromExcel, downloadTemplate } = useExcel()
const { validateFile, ALL_IMAGE_TYPES } = useAttachment()

const items = ref([])
const selectedIds = ref([])
const importInput = ref(null)
const categoryManagerRef = ref(null)

const difficulties = [
  { value: 'beginner', label: '入门' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '高级' }
]

const filterCategory = ref('')
const filterDifficulties = ref([])
const filterTags = ref([])
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const dialogVisible = ref(false)
const isEditing = ref(false)
const viewVisible = ref(false)
const logVisible = ref(false)
const imgPreviewVisible = ref(false)
const previewImg = ref('')
const viewItem = ref(null)
const logs = ref([])
const editingId = ref(null)

const defaultForm = () => ({
  functionName: '', formula: '', category: '', description: '',
  params: [], examples: [], errorCases: [], screenshots: [],
  difficulty: 'beginner', tags: []
})
const form = ref(defaultForm())
const tagsInput = ref('')
const paramsInput = ref('')
const examplesInput = ref('')
const errorCasesInput = ref('')

const excelColumns = [
  { prop: 'functionName', label: '函数名', width: 18 },
  { prop: 'formula', label: '公式', width: 35 },
  { prop: 'category', label: '分类', width: 12 },
  { prop: 'description', label: '描述', width: 30 },
  { prop: 'difficulty', label: '难度', width: 10 },
  { prop: 'tags', label: '标签', width: 25, transform: v => (v || []).join(', ') }
]

const categories = computed(() => aiExcelFunctionsService.getCategories())
const allTags = computed(() => aiExcelFunctionsService.getAllTags())

const filteredItems = computed(() => {
  let list = [...items.value]
  if (filterCategory.value) list = list.filter(s => s.category === filterCategory.value)
  if (filterDifficulties.value.length) list = list.filter(s => filterDifficulties.value.includes(s.difficulty))
  if (filterTags.value.length) list = list.filter(s => filterTags.value.some(t => (s.tags || []).includes(t)))
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(s =>
      (s.functionName || '').toLowerCase().includes(q) ||
      (s.formula || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    )
  }
  list.sort((a, b) => (b.id || 0) - (a.id || 0))
  return list
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

const difficultyStats = computed(() => {
  const map = {}
  items.value.forEach(s => { const d = s.difficulty || 'beginner'; map[d] = (map[d] || 0) + 1 })
  const total = items.value.length || 1
  return difficulties.map(d => ({ ...d, count: map[d.value] || 0, pct: Math.round((map[d.value] || 0) / total * 100) }))
})

function difficultyLabel(v) {
  const map = { beginner: '入门', intermediate: '进阶', advanced: '高级' }
  return map[v] || '入门'
}

function difficultyColor(v) {
  const map = { beginner: 'var(--admin-success)', intermediate: 'var(--admin-warning)', advanced: 'var(--admin-danger)' }
  return map[v] || 'var(--admin-success)'
}

function difficultyTagStyle(v) {
  const map = {
    beginner: 'background:rgba(16,185,129,0.15);color:#10b981',
    intermediate: 'background:rgba(245,158,11,0.15);color:#f59e0b',
    advanced: 'background:rgba(248,113,113,0.15);color:#f87171'
  }
  return map[v] || map.beginner
}

function toggleFilter(key, val, checked) {
  const arr = key === 'difficulties' ? filterDifficulties : filterTags
  if (checked) { arr.value.push(val) } else { arr.value = arr.value.filter(v => v !== val) }
}

function toggleTag(tag, checked) {
  if (checked) { filterTags.value.push(tag) } else { filterTags.value = filterTags.value.filter(t => t !== tag) }
}

function clearFilters() {
  filterCategory.value = ''; filterDifficulties.value = []; filterTags.value = []; searchText.value = ''; currentPage.value = 1
}

function onSelectionChange(rows) { selectedIds.value = rows.map(r => r.id) }

function loadItems() { items.value = aiExcelFunctionsService.getAll() }

function openAddDialog() {
  isEditing.value = false; editingId.value = null
  form.value = defaultForm(); tagsInput.value = ''; paramsInput.value = ''; examplesInput.value = ''; errorCasesInput.value = ''
  dialogVisible.value = true
}

function openEditDialog(item) {
  isEditing.value = true; editingId.value = item.id
  form.value = {
    functionName: item.functionName || '', formula: item.formula || '', category: item.category || '',
    description: item.description || '', params: [...(item.params || [])], examples: [...(item.examples || [])],
    errorCases: [...(item.errorCases || [])], screenshots: [...(item.screenshots || [])],
    difficulty: item.difficulty || 'beginner', tags: [...(item.tags || [])]
  }
  tagsInput.value = (item.tags || []).join(', ')
  paramsInput.value = (item.params || []).join('\n')
  examplesInput.value = (item.examples || []).join('\n')
  errorCasesInput.value = (item.errorCases || []).join('\n')
  dialogVisible.value = true
}

function handleSave() {
  const data = {
    ...form.value,
    params: paramsInput.value.split('\n').map(l => l.trim()).filter(Boolean),
    examples: examplesInput.value.split('\n').map(l => l.trim()).filter(Boolean),
    errorCases: errorCasesInput.value.split('\n').map(l => l.trim()).filter(Boolean),
    tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
    updatedAt: new Date().toISOString().slice(0, 10)
  }
  if (isEditing.value && editingId.value) {
    data.createdAt = items.value.find(s => s.id === editingId.value)?.createdAt || data.updatedAt
    aiExcelFunctionsService.update(editingId.value, data)
    operationLogService.log('ai-excel', 'update', editingId.value, data.functionName)
  } else {
    data.createdAt = new Date().toISOString().slice(0, 10)
    const created = aiExcelFunctionsService.create(data)
    operationLogService.log('ai-excel', 'create', created.id, data.functionName)
  }
  dialogVisible.value = false; loadItems()
}

function handleDelete(item) {
  if (!confirm(`确定删除「${item.functionName}」吗？`)) return
  aiExcelFunctionsService.delete(item.id)
  operationLogService.log('ai-excel', 'delete', item.id, item.functionName)
  loadItems()
}

function handleBatchDelete() {
  if (!confirm(`确定批量删除选中的 ${selectedIds.value.length} 项吗？`)) return
  aiExcelFunctionsService.batchDelete(selectedIds.value)
  operationLogService.log('ai-excel', 'batchDelete', 0, '', `批量删除 ${selectedIds.value.length} 项`)
  selectedIds.value = []; loadItems()
}

function openViewDialog(item) {
  viewItem.value = item
  logs.value = operationLogService.getByModule('ai-excel').filter(l => l.entityId === item.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  viewVisible.value = true
}

function handleScreenshotUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const err = validateFile(file, ALL_IMAGE_TYPES, 2)
  if (err) { alert(err); e.target.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => { if (!form.value.screenshots) form.value.screenshots = []; form.value.screenshots.push(reader.result); e.target.value = '' }
  reader.readAsDataURL(file)
}

function removeScreenshot(idx) { form.value.screenshots.splice(idx, 1) }

function exportData() { exportToExcel(items.value, excelColumns, 'Excel公式收录.xlsx', 'Excel公式') }
function triggerImport() { importInput.value?.click() }

async function handleImportFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const imported = await importFromExcel(file, excelColumns)
    if (!imported.length) { alert('未识别到有效数据'); return }
    if (!confirm(`识别到 ${imported.length} 条数据，确认导入？`)) { e.target.value = ''; return }
    aiExcelFunctionsService.importBatch(imported)
    operationLogService.log('ai-excel', 'import', 0, '', `导入 ${imported.length} 条`)
    loadItems()
  } catch (err) { alert('导入失败：' + err.message) }
  e.target.value = ''
}

watch(() => [filterCategory.value, filterDifficulties.value, filterTags.value, searchText.value], () => { currentPage.value = 1 })
onMounted(() => { loadItems() })
</script>

<style scoped>
.ai-data-page { padding: 0; }
.ai-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; margin-top: 16px; }
.ai-sidebar { position: sticky; top: 72px; align-self: start; }
.ai-main { min-width: 0; }
.ai-upload-btn {
  width: 80px; height: 80px; border: 1px dashed var(--admin-border); border-radius: 6px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  font-size: 24px; color: var(--admin-text-muted); transition: all 0.2s;
}
.ai-upload-btn:hover { border-color: var(--admin-accent-light); color: var(--admin-accent-light); }
.ai-detail-section { margin-top: 14px; }
.ai-detail-label { font-size: 11px; color: var(--admin-text-muted); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.ai-detail-value { font-size: 13px; color: var(--admin-text); }
@media (max-width: 900px) { .ai-layout { grid-template-columns: 1fr; } .ai-sidebar { position: static; } }
</style>
