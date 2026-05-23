<template>
  <div class="ai-data-page">
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">💻 软件工具收录</div>
          <div class="admin-card-subtitle">收录AI相关软件工具，含下载链接、安装指南与教程资源</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-button size="small" @click="downloadTemplate">📥 下载模板</el-button>
          <el-button size="small" @click="triggerImport">📤 导入Excel</el-button>
          <el-button size="small" @click="exportData">📊 导出Excel</el-button>
          <el-button size="small" type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">🗑 批量删除 ({{ selectedIds.length }})</el-button>
          <el-button size="small" type="primary" @click="openAddDialog">+ 新增工具</el-button>
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
            <label>标签</label>
            <div style="max-height:150px;overflow-y:auto">
              <el-checkbox v-for="t in allTags" :key="t" :model-value="filterTags.includes(t)" size="small" style="display:block;margin-bottom:4px" @change="(v) => toggleTag(t, v)">{{ t }}</el-checkbox>
            </div>
          </div>
          <div class="admin-form-group">
            <el-input v-model="searchText" size="small" placeholder="搜索软件名/用途..." clearable />
          </div>
        </div>
        <div class="admin-card" style="margin-top:8px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:10px">📊 统计</div>
          <div style="font-size:11px;color:var(--admin-text-secondary);line-height:1.8">
            <div>总工具数：<b style="color:var(--admin-text)">{{ items.length }}</b></div>
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
              工具列表（{{ filteredItems.length }} 项）
              <span v-if="filterCategory || filterTags.length || searchText" style="color:var(--admin-accent-light);font-size:11px"> · 已筛选</span>
            </span>
            <el-button size="small" @click="clearFilters">清除筛选</el-button>
          </div>
          <el-table :data="pagedItems" style="width:100%" size="small" @selection-change="onSelectionChange">
            <el-table-column type="selection" width="40" />
            <el-table-column prop="id" label="ID" width="60" sortable />
            <el-table-column label="图标" width="60" align="center">
              <template #default="{ row }">
                <img v-if="(row.icons || []).length" :src="row.icons[0]" style="width:28px;height:28px;border-radius:4px;object-fit:cover" />
                <span v-else style="color:var(--admin-text-muted);font-size:16px">💻</span>
              </template>
            </el-table-column>
            <el-table-column prop="softwareName" label="软件名" width="160" sortable>
              <template #default="{ row }">
                <span style="font-weight:600;color:var(--admin-text)">{{ row.softwareName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                <span class="admin-tag info" style="font-size:10px">{{ row.category || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="purpose" label="用途" min-width="160" show-overflow-tooltip />
            <el-table-column label="链接" width="120">
              <template #default="{ row }">
                <div style="display:flex;gap:4px">
                  <a v-if="row.downloadUrl" :href="row.downloadUrl" target="_blank" class="ai-link" title="下载">📥</a>
                  <a v-if="row.officialUrl" :href="row.officialUrl" target="_blank" class="ai-link" title="官网">🏠</a>
                  <span v-if="!row.downloadUrl && !row.officialUrl" style="color:var(--admin-text-muted)">-</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="80" />
            <el-table-column label="标签" width="150">
              <template #default="{ row }">
                <span v-for="t in (row.tags || []).slice(0, 3)" :key="t" class="admin-tag" style="font-size:10px;margin-right:3px;background:var(--admin-surface-hover)">{{ t }}</span>
                <span v-if="(row.tags || []).length > 3" style="font-size:10px;color:var(--admin-text-muted)">+{{ row.tags.length - 3 }}</span>
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
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑工具' : '新增工具'" width="720px" :close-on-click-modal="false" destroy-on-close>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>软件名 <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="form.softwareName" size="small" placeholder="例如: Cursor" />
        </div>
        <div class="admin-form-group">
          <label>分类 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="form.category" style="width:100%" size="small" filterable placeholder="选择分类">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>下载链接</label>
          <el-input v-model="form.downloadUrl" size="small" placeholder="https://..." />
        </div>
        <div class="admin-form-group">
          <label>官方网站</label>
          <el-input v-model="form.officialUrl" size="small" placeholder="https://..." />
        </div>
      </div>
      <div class="admin-form-group">
        <label>用途</label>
        <el-input v-model="form.purpose" size="small" type="textarea" :rows="2" placeholder="简述该软件的用途" />
      </div>
      <div class="admin-two-col">
        <div class="admin-form-group">
          <label>安装指南</label>
          <el-input v-model="form.installGuide" size="small" type="textarea" :rows="3" placeholder="安装步骤说明" />
        </div>
        <div class="admin-form-group">
          <label>教程资源（每行一个）</label>
          <el-input v-model="tutorialsInput" size="small" type="textarea" :rows="3" placeholder="官方文档: https://..." />
        </div>
      </div>
      <div class="admin-form-group">
        <label>版本</label>
        <el-input v-model="form.version" size="small" placeholder="例如: v2.1.0" />
      </div>
      <div class="admin-form-group">
        <label>标签（逗号分隔）</label>
        <el-input v-model="tagsInput" size="small" placeholder="例如: AI, 编程, 免费" />
      </div>
      <div class="admin-form-group">
        <label>图标（每张≤500KB，最多3张）</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
          <div v-for="(img, idx) in (form.icons || [])" :key="'icon-'+idx" style="position:relative;width:48px;height:48px;border-radius:6px;overflow:hidden;border:1px solid var(--admin-border)">
            <img :src="img" style="width:100%;height:100%;object-fit:cover" />
            <button @click="removeIcon(idx)" style="position:absolute;top:0;right:0;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:14px;height:14px;font-size:8px;cursor:pointer">✕</button>
          </div>
          <label v-if="(form.icons || []).length < 3" class="ai-upload-btn" style="width:48px;height:48px">
            +<input type="file" accept="image/*" style="display:none" @change="handleIconUpload" />
          </label>
        </div>
      </div>
      <div class="admin-form-group">
        <label>截图（每张≤2MB，最多5张）</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
          <div v-for="(img, idx) in (form.screenshots || [])" :key="'ss-'+idx" style="position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid var(--admin-border)">
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
        <el-button size="small" type="primary" @click="handleSave" :disabled="!form.softwareName || !form.category">{{ isEditing ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>

    <!-- View Dialog -->
    <el-dialog v-model="viewVisible" title="工具详情" width="800px" destroy-on-close>
      <template v-if="viewItem">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <img v-if="(viewItem.icons || []).length" :src="viewItem.icons[0]" style="width:40px;height:40px;border-radius:8px;object-fit:cover" />
          <span style="font-size:18px;font-weight:700;color:var(--admin-text)">{{ viewItem.softwareName }}</span>
          <span class="admin-tag info">{{ viewItem.category }}</span>
          <span v-if="viewItem.version" style="font-size:11px;color:var(--admin-text-muted)">{{ viewItem.version }}</span>
        </div>
        <div class="ai-detail-grid">
          <div class="ai-detail-item">
            <div class="ai-detail-label">下载链接</div>
            <div class="ai-detail-value"><a v-if="viewItem.downloadUrl" :href="viewItem.downloadUrl" target="_blank" style="color:var(--admin-accent-light)">{{ viewItem.downloadUrl }}</a><span v-else>-</span></div>
          </div>
          <div class="ai-detail-item">
            <div class="ai-detail-label">官方网站</div>
            <div class="ai-detail-value"><a v-if="viewItem.officialUrl" :href="viewItem.officialUrl" target="_blank" style="color:var(--admin-accent-light)">{{ viewItem.officialUrl }}</a><span v-else>-</span></div>
          </div>
        </div>
        <div class="ai-detail-section"><div class="ai-detail-label">用途</div><div class="ai-detail-value">{{ viewItem.purpose || '-' }}</div></div>
        <div class="ai-detail-section"><div class="ai-detail-label">安装指南</div><div class="ai-detail-content" v-html="simpleRender(viewItem.installGuide || '暂无')"></div></div>
        <div v-if="(viewItem.tutorials || []).length" class="ai-detail-section">
          <div class="ai-detail-label">教程资源</div>
          <div v-for="(t, i) in viewItem.tutorials" :key="i" style="padding:4px 0;font-size:12px;color:var(--admin-text)">{{ t }}</div>
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
      <el-timeline v-if="logs.length"><el-timeline-item v-for="l in logs" :key="l.id" :timestamp="l.timestamp" placement="top" size="small"><div style="font-size:12px"><b>{{ l.operator }}</b><span style="margin:0 4px;color:var(--admin-text-muted)">{{ { create:'创建了', update:'更新了', delete:'删除了', batchDelete:'批量删除了', import:'导入了' }[l.action] || l.action }}</span><b>{{ l.entityLabel || '#' + l.entityId }}</b></div></el-timeline-item></el-timeline>
      <div v-else style="text-align:center;padding:40px;color:var(--admin-text-muted)">暂无操作记录</div>
    </el-dialog>

    <el-dialog v-model="imgPreviewVisible" title="图片预览" width="auto"><img :src="previewImg" style="max-width:80vw;max-height:70vh;border-radius:8px" /></el-dialog>

    <AiCategoryManager ref="categoryManagerRef" module-key="ai_tools" module-label="软件工具" @updated="loadItems" />
  </div>
</template>

<script setup>
/**
 * 页面：软件工具收录管理
 * 功能：收录AI相关软件工具，含下载链接、安装指南、教程资源、图标与截图附件
 * 路由：/admin/ai-tools
 */
import { ref, computed, watch, onMounted } from 'vue'
import { aiToolsService, operationLogService } from '@/services/dataService'
import { useExcel } from '@/composables/useExcel'
import { useAttachment } from '@/composables/useAttachment'
import AiCategoryManager from '@/components/admin/AiCategoryManager.vue'

const { exportToExcel, importFromExcel, downloadTemplate } = useExcel()
const { validateFile, ALL_IMAGE_TYPES } = useAttachment()

const items = ref([])
const selectedIds = ref([])
const importInput = ref(null)
const categoryManagerRef = ref(null)

const filterCategory = ref('')
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
  softwareName: '', category: '', downloadUrl: '', officialUrl: '', purpose: '',
  installGuide: '', tutorials: [], icons: [], screenshots: [], version: '', tags: []
})
const form = ref(defaultForm())
const tagsInput = ref('')
const tutorialsInput = ref('')

const excelColumns = [
  { prop: 'softwareName', label: '软件名', width: 20 },
  { prop: 'category', label: '分类', width: 12 },
  { prop: 'purpose', label: '用途', width: 30 },
  { prop: 'downloadUrl', label: '下载链接', width: 30 },
  { prop: 'officialUrl', label: '官网', width: 30 },
  { prop: 'version', label: '版本', width: 10 },
  { prop: 'tags', label: '标签', width: 25, transform: v => (v || []).join(', ') }
]

const categories = computed(() => aiToolsService.getCategories())
const allTags = computed(() => aiToolsService.getAllTags())

const filteredItems = computed(() => {
  let list = [...items.value]
  if (filterCategory.value) list = list.filter(s => s.category === filterCategory.value)
  if (filterTags.value.length) list = list.filter(s => filterTags.value.some(t => (s.tags || []).includes(t)))
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(s => (s.softwareName || '').toLowerCase().includes(q) || (s.purpose || '').toLowerCase().includes(q) || (s.installGuide || '').toLowerCase().includes(q))
  }
  list.sort((a, b) => (b.id || 0) - (a.id || 0))
  return list
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})

const categoryStats = computed(() => {
  const map = {}
  items.value.forEach(s => { const c = s.category || '未分类'; map[c] = (map[c] || 0) + 1 })
  const total = items.value.length || 1
  return Object.entries(map).map(([name, count]) => ({ name, count, pct: Math.round(count / total * 100) }))
})

function toggleTag(tag, checked) {
  if (checked) { filterTags.value.push(tag) } else { filterTags.value = filterTags.value.filter(t => t !== tag) }
}
function clearFilters() { filterCategory.value = ''; filterTags.value = []; searchText.value = ''; currentPage.value = 1 }
function onSelectionChange(rows) { selectedIds.value = rows.map(r => r.id) }
function loadItems() { items.value = aiToolsService.getAll() }

function openAddDialog() {
  isEditing.value = false; editingId.value = null
  form.value = defaultForm(); tagsInput.value = ''; tutorialsInput.value = ''
  dialogVisible.value = true
}

function openEditDialog(item) {
  isEditing.value = true; editingId.value = item.id
  form.value = {
    softwareName: item.softwareName || '', category: item.category || '',
    downloadUrl: item.downloadUrl || '', officialUrl: item.officialUrl || '',
    purpose: item.purpose || '', installGuide: item.installGuide || '',
    tutorials: [...(item.tutorials || [])], icons: [...(item.icons || [])],
    screenshots: [...(item.screenshots || [])], version: item.version || '',
    tags: [...(item.tags || [])]
  }
  tagsInput.value = (item.tags || []).join(', ')
  tutorialsInput.value = (item.tutorials || []).join('\n')
  dialogVisible.value = true
}

function handleSave() {
  const data = {
    ...form.value,
    tutorials: tutorialsInput.value.split('\n').map(l => l.trim()).filter(Boolean),
    tags: tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
    updatedAt: new Date().toISOString().slice(0, 10)
  }
  if (isEditing.value && editingId.value) {
    data.createdAt = items.value.find(s => s.id === editingId.value)?.createdAt || data.updatedAt
    aiToolsService.update(editingId.value, data)
    operationLogService.log('ai-tools', 'update', editingId.value, data.softwareName)
  } else {
    data.createdAt = new Date().toISOString().slice(0, 10)
    const created = aiToolsService.create(data)
    operationLogService.log('ai-tools', 'create', created.id, data.softwareName)
  }
  dialogVisible.value = false; loadItems()
}

function handleDelete(item) {
  if (!confirm(`确定删除「${item.softwareName}」吗？`)) return
  aiToolsService.delete(item.id)
  operationLogService.log('ai-tools', 'delete', item.id, item.softwareName)
  loadItems()
}

function handleBatchDelete() {
  if (!confirm(`确定批量删除选中的 ${selectedIds.value.length} 项吗？`)) return
  aiToolsService.batchDelete(selectedIds.value)
  operationLogService.log('ai-tools', 'batchDelete', 0, '', `批量删除 ${selectedIds.value.length} 项`)
  selectedIds.value = []; loadItems()
}

function openViewDialog(item) {
  viewItem.value = item
  logs.value = operationLogService.getByModule('ai-tools').filter(l => l.entityId === item.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  viewVisible.value = true
}

function handleScreenshotUpload(e) {
  const file = e.target.files?.[0]; if (!file) return
  const err = validateFile(file, ALL_IMAGE_TYPES, 2); if (err) { alert(err); e.target.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => { if (!form.value.screenshots) form.value.screenshots = []; form.value.screenshots.push(reader.result); e.target.value = '' }
  reader.readAsDataURL(file)
}

function removeScreenshot(idx) { form.value.screenshots.splice(idx, 1) }

function handleIconUpload(e) {
  const file = e.target.files?.[0]; if (!file) return
  const err = validateFile(file, ALL_IMAGE_TYPES, 0.5); if (err) { alert(err); e.target.value = ''; return }
  const reader = new FileReader()
  reader.onload = () => { if (!form.value.icons) form.value.icons = []; form.value.icons.push(reader.result); e.target.value = '' }
  reader.readAsDataURL(file)
}

function removeIcon(idx) { form.value.icons.splice(idx, 1) }

function exportData() { exportToExcel(items.value, excelColumns, '软件工具收录.xlsx', '软件工具') }
function triggerImport() { importInput.value?.click() }

async function handleImportFile(e) {
  const file = e.target.files?.[0]; if (!file) return
  try {
    const imported = await importFromExcel(file, excelColumns)
    if (!imported.length) { alert('未识别到有效数据'); return }
    if (!confirm(`识别到 ${imported.length} 条数据，确认导入？`)) { e.target.value = ''; return }
    aiToolsService.importBatch(imported)
    operationLogService.log('ai-tools', 'import', 0, '', `导入 ${imported.length} 条`)
    loadItems()
  } catch (err) { alert('导入失败：' + err.message) }
  e.target.value = ''
}

function simpleRender(text) {
  if (!text) return ''
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
}

watch(() => [filterCategory.value, filterTags.value, searchText.value], () => { currentPage.value = 1 })
onMounted(() => { loadItems() })
</script>

<style scoped>
.ai-data-page { padding: 0; }
.ai-layout { display: grid; grid-template-columns: 260px 1fr; gap: 16px; margin-top: 16px; }
.ai-sidebar { position: sticky; top: 72px; align-self: start; }
.ai-main { min-width: 0; }
.ai-link { text-decoration: none; font-size: 14px; opacity: 0.7; transition: opacity 0.15s; }
.ai-link:hover { opacity: 1; }
.ai-upload-btn { width:80px; height:80px; border:1px dashed var(--admin-border); border-radius:6px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:24px; color:var(--admin-text-muted); transition:all 0.2s; }
.ai-upload-btn:hover { border-color:var(--admin-accent-light); color:var(--admin-accent-light); }
.ai-detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
.ai-detail-item { padding:10px 12px; background:var(--admin-bg-secondary); border-radius:var(--admin-radius-sm); }
.ai-detail-label { font-size:11px; color:var(--admin-text-muted); margin-bottom:4px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
.ai-detail-value { font-size:13px; color:var(--admin-text); word-break:break-word; }
.ai-detail-section { margin-top:14px; }
.ai-detail-section .ai-detail-label { margin-bottom:6px; }
.ai-detail-content { font-size:13px; color:var(--admin-text); line-height:1.7; padding:12px; background:var(--admin-bg-secondary); border-radius:var(--admin-radius-sm); max-height:200px; overflow-y:auto; }
@media (max-width:900px) { .ai-layout { grid-template-columns:1fr; } .ai-sidebar { position:static; } }
</style>
