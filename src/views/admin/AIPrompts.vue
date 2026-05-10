<template>
  <div class="ai-data-page">
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📝 Prompt收录</div>
          <div class="admin-card-subtitle">收录优质AI Prompt提示词，含输入/输出示例与优化版本</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-button size="small" @click="downloadTemplate">📥 下载模板</el-button>
          <el-button size="small" @click="triggerImport">📤 导入Excel</el-button>
          <el-button size="small" @click="exportData">📊 导出Excel</el-button>
          <el-button size="small" type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">🗑 批量删除 ({{ selectedIds.length }})</el-button>
          <el-button size="small" type="primary" @click="openAddDialog">+ 新增Prompt</el-button>
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
            <label>使用场景</label>
            <el-select v-model="filterScene" style="width:100%" clearable placeholder="全部场景">
              <el-option v-for="s in scenes" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>标签</label>
            <div style="max-height:150px;overflow-y:auto">
              <el-checkbox v-for="t in allTags" :key="t" :model-value="filterTags.includes(t)" size="small" style="display:block;margin-bottom:4px" @change="(v) => toggleTag(t, v)">{{ t }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <el-input v-model="searchText" size="small" placeholder="搜索标题/内容..." clearable />
          </div>
        </div>
        <div class="admin-card" style="margin-top:8px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:10px">📊 统计</div>
          <div style="font-size:11px;color:var(--admin-text-secondary);line-height:1.8">
            <div>总Prompt数：<b style="color:var(--admin-text)">{{ items.length }}</b></div>
            <div>总收藏数：<b style="color:var(--admin-accent-light)">{{ totalFavorites }}</b></div>
            <div v-for="c in categoryStats" :key="c.name" style="display:flex;align-items:center;gap:6px">
              <span style="width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ c.name }}</span>
              <div style="flex:1;height:4px;background:var(--admin-bg);border-radius:2px"><div :style="{width:c.pct+'%',background:'var(--admin-accent-gradient)',height:'100%',borderRadius:'2px'}"></div></div>
              <span style="min-width:24px;text-align:right">{{ c.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="ai-main">
        <div class="admin-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:13px;font-weight:600;color:var(--admin-text)">
              Prompt列表（{{ filteredItems.length }} 项）
              <span v-if="filterCategory || filterScene || filterTags.length || searchText" style="color:var(--admin-accent-light);font-size:11px"> · 已筛选</span>
            </span>
            <el-button size="small" @click="clearFilters">清除筛选</el-button>
          </div>
          <el-table :data="pagedItems" style="width:100%" size="small" @selection-change="onSelectionChange">
            <el-table-column type="selection" width="40" />
            <el-table-column prop="id" label="ID" width="60" sortable />
            <el-table-column prop="promptTitle" label="标题" width="200" sortable>
              <template #default="{ row }">
                <span style="font-weight:600;color:var(--admin-text)">{{ row.promptTitle }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                <span class="admin-tag info" style="font-size:10px">{{ row.category || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="usageScene" label="场景" width="100">
              <template #default="{ row }"><span class="admin-tag" style="font-size:10px;background:var(--admin-surface-hover)">{{ row.usageScene || '-' }}</span></template>
            </el-table-column>
            <el-table-column label="内容" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">{{ (row.content || '').slice(0, 80) }}{{ (row.content || '').length > 80 ? '...' : '' }}</template>
            </el-table-column>
            <el-table-column label="优化版本" width="80" align="center">
              <template #default="{ row }">{{ (row.optimizedVersions || []).length || 0 }} 版</template>
            </el-table-column>
            <el-table-column label="收藏" width="70" align="center" sortable prop="favoriteCount">
              <template #default="{ row }">⭐ {{ row.favoriteCount || 0 }}</template>
            </el-table-column>
            <el-table-column label="标签" width="150">
              <template #default="{ row }">
                <span v-for="t in (row.tags || []).slice(0, 2)" :key="t" class="admin-tag" style="font-size:10px;margin-right:3px;background:var(--admin-surface-hover)">{{ t }}</span>
                <span v-if="(row.tags || []).length > 2" style="font-size:10px;color:var(--admin-text-muted)">+{{ row.tags.length - 2 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="110" sortable />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button size="small" text type="primary" @click="openViewDialog(row)">查看</el-button>
                <el-button size="small" text type="primary" @click="openEditDialog(row)">编辑</el-button>
                <el-button size="small" text type="success" @click="copyPrompt(row)">复制</el-button>
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
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑Prompt' : '新增Prompt'" width="780px" :close-on-click-modal="false" destroy-on-close>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>标题 <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="form.promptTitle" size="small" placeholder="例如: 代码审查助手" />
        </div>
        <div class="admin-form-group">
          <label>分类 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="form.category" style="width:100%" size="small" filterable placeholder="选择分类">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
      </div>
      <div class="admin-form-group">
        <label>Prompt内容 <span style="color:var(--admin-danger)">*</span></label>
        <el-input v-model="form.content" size="small" type="textarea" :rows="5" placeholder="输入完整的Prompt话术..." />
      </div>
      <div class="admin-form-group">
        <label>使用场景</label>
        <el-input v-model="form.usageScene" size="small" placeholder="例如: 代码审查、文案润色、翻译等" />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>输入示例</label>
          <el-input v-model="form.inputExample" size="small" type="textarea" :rows="3" placeholder="展示一个典型的输入..." />
        </div>
        <div class="admin-form-group">
          <label>输出示例</label>
          <el-input v-model="form.outputExample" size="small" type="textarea" :rows="3" placeholder="展示对应的期望输出..." />
        </div>
      </div>
      <div class="admin-form-group">
        <label>优化版本（每行一个版本）</label>
        <el-input v-model="optimizedVersionsInput" size="small" type="textarea" :rows="2" placeholder="每行一个优化后的Prompt版本" />
      </div>
      <div class="admin-form-group">
        <label>备注</label>
        <el-input v-model="form.notes" size="small" type="textarea" :rows="2" placeholder="使用技巧或注意事项" />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>标签（逗号分隔）</label>
          <el-input v-model="tagsInput" size="small" placeholder="例如: 编程, 代码审查" />
        </div>
        <div class="admin-form-group">
          <label>收藏数</label>
          <el-input-number v-model="form.favoriteCount" :min="0" size="small" style="width:100%" />
        </div>
      </div>
      <template #footer>
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="handleSave" :disabled="!form.promptTitle || !form.content || !form.category">{{ isEditing ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog v-model="viewVisible" title="Prompt详情" width="800px" destroy-on-close>
      <template v-if="viewItem">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <span style="font-size:18px;font-weight:700;color:var(--admin-text)">{{ viewItem.promptTitle }}</span>
          <span class="admin-tag info">{{ viewItem.category }}</span>
          <span v-if="viewItem.usageScene" class="admin-tag" style="background:var(--admin-surface-hover)">{{ viewItem.usageScene }}</span>
          <span style="font-size:11px;color:var(--admin-text-muted);margin-left:auto">⭐ {{ viewItem.favoriteCount || 0 }}</span>
          <el-button size="small" type="success" @click="copyPrompt(viewItem)">📋 一键复制</el-button>
        </div>
        <div class="ai-detail-section">
          <div class="ai-detail-label">Prompt内容</div>
          <div style="position:relative">
            <pre class="ai-prompt-block">{{ viewItem.content }}</pre>
          </div>
        </div>
        <div v-if="viewItem.inputExample || viewItem.outputExample" class="ai-compare">
          <div class="ai-compare-col" v-if="viewItem.inputExample">
            <div class="ai-detail-label">📥 输入示例</div>
            <pre class="ai-prompt-block small">{{ viewItem.inputExample }}</pre>
          </div>
          <div class="ai-compare-col" v-if="viewItem.outputExample">
            <div class="ai-detail-label">📤 输出示例</div>
            <pre class="ai-prompt-block small">{{ viewItem.outputExample }}</pre>
          </div>
        </div>
        <div v-if="(viewItem.optimizedVersions || []).length" class="ai-detail-section">
          <div class="ai-detail-label">优化版本（{{ viewItem.optimizedVersions.length }} 个）</div>
          <div v-for="(v, i) in viewItem.optimizedVersions" :key="i" style="margin-bottom:8px">
            <pre class="ai-prompt-block small">v{{ i + 1 }}: {{ v }}</pre>
          </div>
        </div>
        <div v-if="viewItem.notes" class="ai-detail-section">
          <div class="ai-detail-label">备注</div>
          <div class="ai-detail-value">{{ viewItem.notes }}</div>
        </div>
        <div v-if="(viewItem.tags || []).length" class="ai-detail-section">
          <span v-for="t in viewItem.tags" :key="t" class="admin-tag" style="font-size:10px;margin-right:4px;background:var(--admin-surface-hover)">{{ t }}</span>
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
      <el-timeline v-if="logs.length"><el-timeline-item v-for="l in logs" :key="l.id" :timestamp="l.timestamp" placement="top" size="small"><div style="font-size:12px"><b>{{ l.operator }}</b><span style="margin:0 4px;color:var(--admin-text-muted)">{{ { create:'创建了', update:'更新了', delete:'删除了', batchDelete:'批量删除了', import:'导入了' }[l.action] || l.action }}</span><b>{{ l.entityLabel || '#' + l.entityId }}</b></div></el-timeline-item></el-timeline>
      <div v-else style="text-align:center;padding:40px;color:var(--admin-text-muted)">暂无操作记录</div>
    </el-dialog>

    <AiCategoryManager ref="categoryManagerRef" module-key="ai_prompts" module-label="Prompt话术" @updated="loadItems" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { aiPromptsService, operationLogService } from '@/services/dataService'
import { useExcel } from '@/composables/useExcel'
import AiCategoryManager from '@/components/admin/AiCategoryManager.vue'

const { exportToExcel, importFromExcel, downloadTemplate } = useExcel()

const items = ref([])
const selectedIds = ref([])
const importInput = ref(null)
const categoryManagerRef = ref(null)

const filterCategory = ref('')
const filterScene = ref('')
const filterTags = ref([])
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const dialogVisible = ref(false)
const isEditing = ref(false)
const viewVisible = ref(false)
const logVisible = ref(false)
const viewItem = ref(null)
const logs = ref([])
const editingId = ref(null)

const defaultForm = () => ({
  promptTitle: '', category: '', content: '', usageScene: '',
  inputExample: '', outputExample: '', optimizedVersions: [],
  notes: '', tags: [], favoriteCount: 0
})
const form = ref(defaultForm())
const tagsInput = ref('')
const optimizedVersionsInput = ref('')

const excelColumns = [
  { prop: 'promptTitle', label: '标题', width: 25 },
  { prop: 'category', label: '分类', width: 12 },
  { prop: 'content', label: 'Prompt内容', width: 50 },
  { prop: 'usageScene', label: '使用场景', width: 15 },
  { prop: 'notes', label: '备注', width: 20 },
  { prop: 'tags', label: '标签', width: 25, transform: v => (v || []).join(', ') },
  { prop: 'favoriteCount', label: '收藏数', width: 8 }
]

const categories = computed(() => aiPromptsService.getCategories())
const allTags = computed(() => aiPromptsService.getAllTags())
const scenes = computed(() => [...new Set(items.value.map(i => i.usageScene).filter(Boolean))])
const totalFavorites = computed(() => items.value.reduce((sum, i) => sum + (i.favoriteCount || 0), 0))

const filteredItems = computed(() => {
  let list = [...items.value]
  if (filterCategory.value) list = list.filter(s => s.category === filterCategory.value)
  if (filterScene.value) list = list.filter(s => s.usageScene === filterScene.value)
  if (filterTags.value.length) list = list.filter(s => filterTags.value.some(t => (s.tags || []).includes(t)))
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(s => (s.promptTitle || '').toLowerCase().includes(q) || (s.content || '').toLowerCase().includes(q) || (s.notes || '').toLowerCase().includes(q))
  }
  list.sort((a, b) => (b.id || 0) - (a.id || 0))
  return list
})

const pagedItems = computed(() => filteredItems.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))

const categoryStats = computed(() => {
  const map = {}
  items.value.forEach(s => { const c = s.category || '未分类'; map[c] = (map[c] || 0) + 1 })
  const total = items.value.length || 1
  return Object.entries(map).map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }))
})

function toggleTag(tag, checked) {
  if (checked) { filterTags.value.push(tag) } else { filterTags.value = filterTags.value.filter(t => t !== tag) }
}
function clearFilters() { filterCategory.value = ''; filterScene.value = ''; filterTags.value = []; searchText.value = ''; currentPage.value = 1 }
function onSelectionChange(rows) { selectedIds.value = rows.map(r => r.id) }
function loadItems() { items.value = aiPromptsService.getAll() }

function copyPrompt(item) {
  const text = item.content || ''
  navigator.clipboard.writeText(text).then(() => {
    // Simple inline notification via DOM (no element-plus message import needed)
    const el = document.createElement('div')
    el.textContent = '已复制到剪贴板'
    Object.assign(el.style, { position:'fixed', bottom:'24px', right:'24px', background:'var(--admin-success)', color:'#fff', padding:'8px 16px', borderRadius:'8px', fontSize:'13px', zIndex:'9999', pointerEvents:'none' })
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2000)
  }).catch(() => alert('复制失败，请手动复制'))
}

function openAddDialog() {
  isEditing.value = false; editingId.value = null
  form.value = defaultForm(); tagsInput.value = ''; optimizedVersionsInput.value = ''
  dialogVisible.value = true
}

function openEditDialog(item) {
  isEditing.value = true; editingId.value = item.id
  form.value = {
    promptTitle: item.promptTitle || '', category: item.category || '',
    content: item.content || '', usageScene: item.usageScene || '',
    inputExample: item.inputExample || '', outputExample: item.outputExample || '',
    optimizedVersions: [...(item.optimizedVersions || [])], notes: item.notes || '',
    tags: [...(item.tags || [])], favoriteCount: item.favoriteCount || 0
  }
  tagsInput.value = (item.tags || []).join(', ')
  optimizedVersionsInput.value = (item.optimizedVersions || []).join('\n')
  dialogVisible.value = true
}

function handleSave() {
  const data = {
    ...form.value,
    optimizedVersions: optimizedVersionsInput.value.split('\n').map(l => l.trim()).filter(Boolean),
    tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
    updatedAt: new Date().toISOString().slice(0, 10)
  }
  if (isEditing.value && editingId.value) {
    data.createdAt = items.value.find(s => s.id === editingId.value)?.createdAt || data.updatedAt
    aiPromptsService.update(editingId.value, data)
    operationLogService.log('ai-prompts', 'update', editingId.value, data.promptTitle)
  } else {
    data.createdAt = new Date().toISOString().slice(0, 10)
    const created = aiPromptsService.create(data)
    operationLogService.log('ai-prompts', 'create', created.id, data.promptTitle)
  }
  dialogVisible.value = false; loadItems()
}

function handleDelete(item) {
  if (!confirm(`确定删除「${item.promptTitle}」吗？`)) return
  aiPromptsService.delete(item.id)
  operationLogService.log('ai-prompts', 'delete', item.id, item.promptTitle)
  loadItems()
}

function handleBatchDelete() {
  if (!confirm(`确定批量删除选中的 ${selectedIds.value.length} 项吗？`)) return
  aiPromptsService.batchDelete(selectedIds.value)
  operationLogService.log('ai-prompts', 'batchDelete', 0, '', `批量删除 ${selectedIds.value.length} 项`)
  selectedIds.value = []; loadItems()
}

function openViewDialog(item) {
  viewItem.value = item
  logs.value = operationLogService.getByModule('ai-prompts').filter(l => l.entityId === item.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  viewVisible.value = true
}

function exportData() { exportToExcel(items.value, excelColumns, 'Prompt提示词收录.xlsx', 'Prompts') }
function triggerImport() { importInput.value?.click() }

async function handleImportFile(e) {
  const file = e.target.files?.[0]; if (!file) return
  try {
    const imported = await importFromExcel(file, excelColumns)
    if (!imported.length) { alert('未识别到有效数据'); return }
    if (!confirm(`识别到 ${imported.length} 条数据，确认导入？`)) { e.target.value = ''; return }
    aiPromptsService.importBatch(imported)
    operationLogService.log('ai-prompts', 'import', 0, '', `导入 ${imported.length} 条`)
    loadItems()
  } catch (err) { alert('导入失败：' + err.message) }
  e.target.value = ''
}

watch(() => [filterCategory.value, filterScene.value, filterTags.value, searchText.value], () => { currentPage.value = 1 })
onMounted(() => { loadItems() })
</script>

<style scoped>
.ai-data-page { padding: 0; }
.ai-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; margin-top: 16px; }
.ai-sidebar { position: sticky; top: 72px; align-self: start; }
.ai-main { min-width: 0; }
.ai-prompt-block {
  background: var(--admin-bg-secondary);
  padding: 12px 16px;
  border-radius: var(--admin-radius-sm);
  font-size: 13px;
  line-height: 1.7;
  color: var(--admin-text);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
.ai-prompt-block.small { font-size: 12px; padding: 8px 12px; }
.ai-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
.ai-compare-col { min-width: 0; }
.ai-detail-section { margin-top: 14px; }
.ai-detail-label { font-size: 11px; color: var(--admin-text-muted); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.ai-detail-value { font-size: 13px; color: var(--admin-text); }
@media (max-width: 900px) { .ai-layout { grid-template-columns: 1fr; } .ai-sidebar { position: static; } .ai-compare { grid-template-columns: 1fr; } }
</style>
