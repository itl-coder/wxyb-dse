<template>
  <div class="ai-data-page">
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">💬 名言语录收录</div>
          <div class="admin-card-subtitle">收录激励名言与金句，支持轮播展示与多场景使用</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-button size="small" @click="downloadTemplate">📥 下载模板</el-button>
          <el-button size="small" @click="triggerImport">📤 导入Excel</el-button>
          <el-button size="small" @click="exportData">📊 导出Excel</el-button>
          <el-button size="small" type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">🗑 批量删除 ({{ selectedIds.length }})</el-button>
          <el-button size="small" type="primary" @click="openAddDialog">+ 新增语录</el-button>
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
            <label>展示样式</label>
            <el-select v-model="filterStyle" style="width:100%" clearable placeholder="全部样式">
              <el-option v-for="s in displayStyles" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>轮播</label>
            <el-switch v-model="filterCarouselOnly" size="small" active-text="仅轮播" inactive-text="全部" />
          </div>
          <div class="admin-form-group">
            <el-input v-model="searchText" size="small" placeholder="搜索语录/作者..." clearable />
          </div>
        </div>
        <div class="admin-card" style="margin-top:8px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:10px">📊 统计</div>
          <div style="font-size:11px;color:var(--admin-text-secondary);line-height:1.8">
            <div>总语录数：<b style="color:var(--admin-text)">{{ items.length }}</b></div>
            <div>轮播展示：<b style="color:var(--admin-accent-light)">{{ items.filter(i => i.isCarousel).length }}</b></div>
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
              语录列表（{{ filteredItems.length }} 项）
              <span v-if="filterCategory || filterScene || filterStyle || filterCarouselOnly || searchText" style="color:var(--admin-accent-light);font-size:11px"> · 已筛选</span>
            </span>
            <div style="display:flex;gap:6px">
              <el-button size="small" @click="clearFilters">清除筛选</el-button>
              <el-button size="small" type="warning" @click="carouselPreviewVisible = true" :disabled="!carouselItems.length">🎠 轮播预览</el-button>
            </div>
          </div>
          <el-table :data="pagedItems" style="width:100%" size="small" @selection-change="onSelectionChange">
            <el-table-column type="selection" width="40" />
            <el-table-column prop="id" label="ID" width="60" sortable />
            <el-table-column label="语录" min-width="280" show-overflow-tooltip>
              <template #default="{ row }">
                <span style="font-style:italic;color:var(--admin-text)">"{{ row.quoteText }}"</span>
              </template>
            </el-table-column>
            <el-table-column prop="author" label="作者" width="120" />
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                <span class="admin-tag info" style="font-size:10px">{{ row.category || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="usageScene" label="使用场景" width="100">
              <template #default="{ row }"><span class="admin-tag" style="font-size:10px;background:var(--admin-surface-hover)">{{ row.usageScene || '-' }}</span></template>
            </el-table-column>
            <el-table-column label="样式" width="80" align="center">
              <template #default="{ row }">{{ displayStyleLabel(row.displayStyle) }}</template>
            </el-table-column>
            <el-table-column label="轮播" width="60" align="center">
              <template #default="{ row }">
                <span :style="{color: row.isCarousel ? 'var(--admin-success)' : 'var(--admin-text-muted)'}">{{ row.isCarousel ? '✓' : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="weight" label="权重" width="60" sortable align="center" />
            <el-table-column label="图片" width="60" align="center">
              <template #default="{ row }">
                <span v-if="(row.images || []).length" style="font-size:12px">🖼️{{ row.images.length }}</span>
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
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑语录' : '新增语录'" width="720px" :close-on-click-modal="false" destroy-on-close>
      <div class="admin-form-group">
        <label>语录内容 <span style="color:var(--admin-danger)">*</span></label>
        <el-input v-model="form.quoteText" size="small" type="textarea" :rows="3" placeholder="输入名言或金句..." />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>作者 <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="form.author" size="small" placeholder="例如: 爱因斯坦" />
        </div>
        <div class="admin-form-group">
          <label>分类</label>
          <el-select v-model="form.category" style="width:100%" size="small" filterable placeholder="选择分类">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>使用场景</label>
          <el-select v-model="form.usageScene" style="width:100%" size="small" filterable allow-create placeholder="选择或输入场景">
            <el-option v-for="s in scenes" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>展示样式</label>
          <el-select v-model="form.displayStyle" style="width:100%" size="small">
            <el-option v-for="s in displayStyles" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>权重（越大越靠前）</label>
          <el-input-number v-model="form.weight" :min="0" :max="999" size="small" style="width:100%" />
        </div>
        <div class="admin-form-group">
          <label style="display:flex;align-items:center;gap:8px">
            <el-switch v-model="form.isCarousel" size="small" /> 加入轮播展示
          </label>
        </div>
      </div>
      <div class="admin-form-group">
        <label>配图（每张≤2MB，最多3张）</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
          <div v-for="(img, idx) in (form.images || [])" :key="idx" style="position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid var(--admin-border)">
            <img :src="img" style="width:100%;height:100%;object-fit:cover" />
            <button @click="removeImage(idx)" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer">✕</button>
          </div>
          <label v-if="(form.images || []).length < 3" class="ai-upload-btn">
            +<input type="file" accept="image/*" style="display:none" @change="handleImageUpload" />
          </label>
        </div>
      </div>
      <template #footer>
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="handleSave" :disabled="!form.quoteText || !form.author">{{ isEditing ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog v-model="viewVisible" title="语录详情" width="700px" destroy-on-close>
      <template v-if="viewItem">
        <div style="text-align:center;padding:20px;background:var(--admin-bg-secondary);border-radius:var(--admin-radius);margin-bottom:16px">
          <div style="font-size:20px;font-style:italic;color:var(--admin-text);line-height:1.6;margin-bottom:12px">"{{ viewItem.quoteText }}"</div>
          <div style="font-size:13px;color:var(--admin-accent-light);font-weight:600">—— {{ viewItem.author }}</div>
        </div>
        <div class="ai-detail-grid">
          <div class="ai-detail-item">
            <div class="ai-detail-label">分类</div><div class="ai-detail-value">{{ viewItem.category || '-' }}</div>
          </div>
          <div class="ai-detail-item">
            <div class="ai-detail-label">使用场景</div><div class="ai-detail-value">{{ viewItem.usageScene || '-' }}</div>
          </div>
          <div class="ai-detail-item">
            <div class="ai-detail-label">展示样式</div><div class="ai-detail-value">{{ displayStyleLabel(viewItem.displayStyle) }}</div>
          </div>
          <div class="ai-detail-item">
            <div class="ai-detail-label">权重 / 轮播</div>
            <div class="ai-detail-value">{{ viewItem.weight || 0 }} / {{ viewItem.isCarousel ? '是' : '否' }}</div>
          </div>
        </div>
        <div v-if="(viewItem.images || []).length" class="ai-detail-section">
          <div class="ai-detail-label">配图（{{ viewItem.images.length }} 张）</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <img v-for="(img, idx) in viewItem.images" :key="idx" :src="img" style="max-width:200px;max-height:160px;border-radius:6px;border:1px solid var(--admin-border);object-fit:cover;cursor:pointer" @click="previewImg = img; imgPreviewVisible = true" />
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
      <el-timeline v-if="logs.length"><el-timeline-item v-for="l in logs" :key="l.id" :timestamp="l.timestamp" placement="top" size="small"><div style="font-size:12px"><b>{{ l.operator }}</b><span style="margin:0 4px;color:var(--admin-text-muted)">{{ { create:'创建了', update:'更新了', delete:'删除了', batchDelete:'批量删除了', import:'导入了' }[l.action] || l.action }}</span><b>{{ l.entityLabel || '#' + l.entityId }}</b></div></el-timeline-item></el-timeline>
      <div v-else style="text-align:center;padding:40px;color:var(--admin-text-muted)">暂无操作记录</div>
    </el-dialog>

    <!-- Carousel Preview -->
    <el-dialog v-model="carouselPreviewVisible" title="轮播预览" width="700px">
      <el-carousel v-if="carouselItems.length" :interval="4000" height="300px" indicator-position="outside">
        <el-carousel-item v-for="item in carouselItems" :key="item.id">
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center">
            <img v-if="(item.images || []).length" :src="item.images[0]" style="max-width:200px;max-height:100px;border-radius:8px;margin-bottom:16px;object-fit:cover" />
            <div style="font-size:22px;font-style:italic;color:var(--admin-text);line-height:1.6;margin-bottom:12px">"{{ item.quoteText }}"</div>
            <div style="font-size:14px;color:var(--admin-accent-light);font-weight:600">—— {{ item.author }}</div>
          </div>
        </el-carousel-item>
      </el-carousel>
      <div v-else style="text-align:center;padding:40px;color:var(--admin-text-muted)">暂无可轮播的语录</div>
    </el-dialog>

    <el-dialog v-model="imgPreviewVisible" title="图片预览" width="auto"><img :src="previewImg" style="max-width:80vw;max-height:70vh;border-radius:8px" /></el-dialog>

    <AiCategoryManager ref="categoryManagerRef" module-key="ai_quotes" module-label="名言语录" @updated="loadItems" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { aiQuotesService, operationLogService } from '@/services/dataService'
import { useExcel } from '@/composables/useExcel'
import { useAttachment } from '@/composables/useAttachment'
import AiCategoryManager from '@/components/admin/AiCategoryManager.vue'

const { exportToExcel, importFromExcel, downloadTemplate } = useExcel()
const { validateFile, ALL_IMAGE_TYPES } = useAttachment()

const items = ref([])
const selectedIds = ref([])
const importInput = ref(null)
const categoryManagerRef = ref(null)

const displayStyles = [
  { value: 'text', label: '文字' },
  { value: 'card', label: '卡片' },
  { value: 'emoji', label: '表情包' }
]

const filterCategory = ref('')
const filterScene = ref('')
const filterStyle = ref('')
const filterCarouselOnly = ref(false)
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const dialogVisible = ref(false)
const isEditing = ref(false)
const viewVisible = ref(false)
const logVisible = ref(false)
const carouselPreviewVisible = ref(false)
const imgPreviewVisible = ref(false)
const previewImg = ref('')
const viewItem = ref(null)
const logs = ref([])
const editingId = ref(null)

const defaultForm = () => ({
  quoteText: '', author: '', category: '', usageScene: '',
  images: [], isCarousel: false, weight: 0, displayStyle: 'text'
})
const form = ref(defaultForm())

const excelColumns = [
  { prop: 'quoteText', label: '语录内容', width: 40 },
  { prop: 'author', label: '作者', width: 15 },
  { prop: 'category', label: '分类', width: 12 },
  { prop: 'usageScene', label: '使用场景', width: 15 },
  { prop: 'displayStyle', label: '展示样式', width: 10 },
  { prop: 'isCarousel', label: '轮播', width: 8, transform: v => v ? '是' : '否' },
  { prop: 'weight', label: '权重', width: 8 }
]

const categories = computed(() => aiQuotesService.getCategories())
const scenes = computed(() => aiQuotesService.getScenes())

const filteredItems = computed(() => {
  let list = [...items.value]
  if (filterCategory.value) list = list.filter(s => s.category === filterCategory.value)
  if (filterScene.value) list = list.filter(s => s.usageScene === filterScene.value)
  if (filterStyle.value) list = list.filter(s => (s.displayStyle || 'text') === filterStyle.value)
  if (filterCarouselOnly.value) list = list.filter(s => s.isCarousel)
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(s => (s.quoteText || '').toLowerCase().includes(q) || (s.author || '').toLowerCase().includes(q))
  }
  list.sort((a, b) => (b.weight || 0) - (a.weight || 0) || (b.id || 0) - (a.id || 0))
  return list
})

const pagedItems = computed(() => filteredItems.value.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value))
const carouselItems = computed(() => items.value.filter(i => i.isCarousel).sort((a, b) => (b.weight || 0) - (a.weight || 0)))

const categoryStats = computed(() => {
  const map = {}
  items.value.forEach(s => { const c = s.category || '未分类'; map[c] = (map[c] || 0) + 1 })
  const total = items.value.length || 1
  return Object.entries(map).map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }))
})

function displayStyleLabel(v) {
  const map = { text: '文字', card: '卡片', emoji: '表情包' }
  return map[v] || '文字'
}

function clearFilters() {
  filterCategory.value = ''; filterScene.value = ''; filterStyle.value = ''; filterCarouselOnly.value = false; searchText.value = ''; currentPage.value = 1
}
function onSelectionChange(rows) { selectedIds.value = rows.map(r => r.id) }
function loadItems() { items.value = aiQuotesService.getAll() }

function openAddDialog() {
  isEditing.value = false; editingId.value = null; form.value = defaultForm(); dialogVisible.value = true
}

function openEditDialog(item) {
  isEditing.value = true; editingId.value = item.id
  form.value = {
    quoteText: item.quoteText || '', author: item.author || '', category: item.category || '',
    usageScene: item.usageScene || '', images: [...(item.images || [])],
    isCarousel: !!item.isCarousel, weight: item.weight || 0,
    displayStyle: item.displayStyle || 'text'
  }
  dialogVisible.value = true
}

function handleSave() {
  const data = { ...form.value, updatedAt: new Date().toISOString().slice(0, 10) }
  if (isEditing.value && editingId.value) {
    data.createdAt = items.value.find(s => s.id === editingId.value)?.createdAt || data.updatedAt
    aiQuotesService.update(editingId.value, data)
    operationLogService.log('ai-quotes', 'update', editingId.value, data.quoteText.slice(0, 20))
  } else {
    data.createdAt = new Date().toISOString().slice(0, 10)
    const created = aiQuotesService.create(data)
    operationLogService.log('ai-quotes', 'create', created.id, data.quoteText.slice(0, 20))
  }
  dialogVisible.value = false; loadItems()
}

function handleDelete(item) {
  if (!confirm(`确定删除「${item.quoteText.slice(0, 30)}...」吗？`)) return
  aiQuotesService.delete(item.id)
  operationLogService.log('ai-quotes', 'delete', item.id, item.quoteText.slice(0, 20))
  loadItems()
}

function handleBatchDelete() {
  if (!confirm(`确定批量删除选中的 ${selectedIds.value.length} 项吗？`)) return
  aiQuotesService.batchDelete(selectedIds.value)
  operationLogService.log('ai-quotes', 'batchDelete', 0, '', `批量删除 ${selectedIds.value.length} 项`)
  selectedIds.value = []; loadItems()
}

function openViewDialog(item) {
  viewItem.value = item
  logs.value = operationLogService.getByModule('ai-quotes').filter(l => l.entityId === item.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  viewVisible.value = true
}

function handleImageUpload(e) {
  const file = e.target.files?.[0]; if (!file) return
  const err = validateFile(file, ALL_IMAGE_TYPES, 2); if (err) { alert(err); e.target.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => { if (!form.value.images) form.value.images = []; form.value.images.push(reader.result); e.target.value = '' }
  reader.readAsDataURL(file)
}

function removeImage(idx) { form.value.images.splice(idx, 1) }

function exportData() { exportToExcel(items.value, excelColumns, '名言语录收录.xlsx', '名言语录') }
function triggerImport() { importInput.value?.click() }

async function handleImportFile(e) {
  const file = e.target.files?.[0]; if (!file) return
  try {
    const imported = await importFromExcel(file, excelColumns)
    if (!imported.length) { alert('未识别到有效数据'); return }
    if (!confirm(`识别到 ${imported.length} 条数据，确认导入？`)) { e.target.value = ''; return }
    aiQuotesService.importBatch(imported)
    operationLogService.log('ai-quotes', 'import', 0, '', `导入 ${imported.length} 条`)
    loadItems()
  } catch (err) { alert('导入失败：' + err.message) }
  e.target.value = ''
}

watch(() => [filterCategory.value, filterScene.value, filterStyle.value, filterCarouselOnly.value, searchText.value], () => { currentPage.value = 1 })
onMounted(() => { loadItems() })
</script>

<style scoped>
.ai-data-page { padding: 0; }
.ai-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; margin-top: 16px; }
.ai-sidebar { position: sticky; top: 72px; align-self: start; }
.ai-main { min-width: 0; }
.ai-upload-btn { width:80px; height:80px; border:1px dashed var(--admin-border); border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:24px; color:var(--admin-text-muted); transition:all 0.2s; }
.ai-upload-btn:hover { border-color:var(--admin-accent-light); color:var(--admin-accent-light); }
.ai-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
.ai-detail-item { padding:10px 12px; background:var(--admin-bg-secondary); border-radius:var(--admin-radius-sm); }
.ai-detail-label { font-size:11px; color:var(--admin-text-muted); margin-bottom:4px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
.ai-detail-value { font-size:13px; color:var(--admin-text); word-break:break-word; }
.ai-detail-section { margin-top:14px; }
.ai-detail-section .ai-detail-label { margin-bottom:6px; }
@media (max-width:900px) { .ai-layout { grid-template-columns:1fr; } .ai-sidebar { position:static; } }
</style>
