<template>
  <el-dialog
    v-model="visible"
    title="导入学生数据"
    width="960px"
    :close-on-click-modal="false"
    :append-to-body="true"
    :z-index="2100"
    @close="$emit('close')"
    class="import-preview-dialog"
  >
    <!-- 上传区域 -->
    <div class="ipd-upload" v-if="!preview.length">
      <div class="upload-dropzone" @click="triggerFile" @dragover.prevent @drop.prevent="handleDrop">
        <div class="upload-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="12" y2="12"/>
            <line x1="15" y1="15" x2="12" y2="12"/>
          </svg>
        </div>
        <div class="upload-text">点击选择 Excel 文件（.xlsx / .xls）</div>
        <div class="upload-hint">或拖拽文件到此处</div>
      </div>
      <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="handleFile" />
      <div class="ipd-upload-actions">
        <el-button @click="downloadTemplate" type="primary" plain>下载导入模板</el-button>
      </div>
      <div class="ipd-upload-tips">
        <h4>列名自动识别规则</h4>
        <ul>
          <li>姓名列：匹配 <b>姓名 / 名字 / name</b></li>
          <li>学号列：匹配 <b>学号 / 编号 / no</b></li>
          <li>班级列：匹配 <b>班级 / 班别 / class</b></li>
          <li>选修列：匹配 <b>选修1 / 选修2 / 选科 / elective / 科目</b>（可多列，也支持逗号分隔）</li>
          <li>未被识别的列仍会保留在导入数据中</li>
        </ul>
      </div>
    </div>

    <!-- 预览区域 -->
    <div class="ipd-preview" v-else>
      <!-- 顶部统计栏 -->
      <div class="ipd-stats-bar">
        <div class="ipd-stats-left">
          <span class="ipd-stat">解析 <b>{{ preview.length }}</b> 行</span>
          <span class="ipd-stat ipd-stat-ok">有效 <b>{{ validCount }}</b></span>
          <span v-if="anomalyCounts.duplicateId" class="ipd-stat ipd-stat-warn">重复学号 <b>{{ anomalyCounts.duplicateId }}</b></span>
          <span v-if="anomalyCounts.emptyName" class="ipd-stat ipd-stat-err">缺姓名 <b>{{ anomalyCounts.emptyName }}</b></span>
          <span v-if="anomalyCounts.unknownClass" class="ipd-stat ipd-stat-warn">未知班级 <b>{{ anomalyCounts.unknownClass }}</b></span>
          <span v-if="anomalyCounts.invalidChars" class="ipd-stat ipd-stat-err">不合格字符 <b>{{ anomalyCounts.invalidChars }}</b></span>
          <span class="ipd-stat ipd-stat-selected">已选 <b>{{ selectedCount }}</b></span>
        </div>
        <el-button @click="preview = []; file = null; fileInput.value = ''" text>重新选择</el-button>
      </div>

      <!-- 列识别信息 -->
      <div class="ipd-cols-info" v-if="detectedCols.length">
        <span class="cols-info-label">识别列：</span>
        <span v-for="c in detectedCols" :key="c.key" class="cols-info-tag" :class="{ 'is-primary': c.isPrimary }">
          {{ c.label }}
        </span>
      </div>

      <div class="ipd-body">
        <!-- 左侧筛选 -->
        <div class="ipd-filters">
          <div class="ipd-filter-section">
            <div class="ipd-filter-title">班级筛选</div>
            <div class="ipd-filter-list">
              <label
                v-for="cls in parsedClasses"
                :key="cls"
                class="ipd-filter-item"
                :class="{ active: filterClass === cls }"
                @click="filterClass = filterClass === cls ? '' : cls"
              >
                <span class="ipd-filter-name">{{ cls }}</span>
                <span class="ipd-filter-count">{{ classCounts[cls] }}</span>
              </label>
              <label
                class="ipd-filter-item"
                :class="{ active: filterClass === '__empty' }"
                @click="filterClass = filterClass === '__empty' ? '' : '__empty'"
              >
                <span class="ipd-filter-name">未填班级</span>
                <span class="ipd-filter-count">{{ classCounts['__empty'] || 0 }}</span>
              </label>
            </div>
          </div>

          <div class="ipd-filter-section">
            <div class="ipd-filter-title">状态筛选</div>
            <div class="ipd-filter-list">
              <label
                class="ipd-filter-item"
                :class="{ active: filterStatus === 'valid' }"
                @click="filterStatus = filterStatus === 'valid' ? '' : 'valid'"
              >
                <span class="ipd-filter-name">正常</span>
                <span class="ipd-filter-count ipd-fc-ok">{{ validCount }}</span>
              </label>
              <label
                class="ipd-filter-item"
                :class="{ active: filterStatus === 'warn' }"
                @click="filterStatus = filterStatus === 'warn' ? '' : 'warn'"
              >
                <span class="ipd-filter-name">警告（可导入）</span>
                <span class="ipd-filter-count ipd-fc-warn">{{ warnCount }}</span>
              </label>
              <label
                class="ipd-filter-item"
                :class="{ active: filterStatus === 'error' }"
                @click="filterStatus = filterStatus === 'error' ? '' : 'error'"
              >
                <span class="ipd-filter-name">错误（不可导入）</span>
                <span class="ipd-filter-count ipd-fc-err">{{ errorCount }}</span>
              </label>
              <label
                v-if="invalidCount"
                class="ipd-filter-item"
                :class="{ active: filterStatus === 'invalid' }"
                @click="filterStatus = filterStatus === 'invalid' ? '' : 'invalid'"
              >
                <span class="ipd-filter-name">不合格字符</span>
                <span class="ipd-filter-count ipd-fc-err">{{ invalidCount }}</span>
              </label>
            </div>
          </div>

          <div class="ipd-filter-section">
            <el-input
              v-model="searchText"
              placeholder="搜索姓名 / 学号..."
              clearable
              size="small"
            />
          </div>

          <div class="ipd-filter-actions">
            <el-button size="small" text @click="selectAll">全选可导入</el-button>
            <el-button size="small" text @click="deselectAll">取消全选</el-button>
          </div>
        </div>

        <!-- 中间表格 -->
        <div class="ipd-table-wrap">
          <el-table
            ref="tableRef"
            :data="pagedData"
            max-height="400"
            border
            stripe
            size="small"
            class="ipd-table"
            @selection-change="onSelectionChange"
            row-key="uid"
          >
            <el-table-column type="selection" width="36" :selectable="isSelectable" />
            <el-table-column label="姓名" min-width="90">
              <template #default="{ row }">
                <span :class="{ 'ipd-cell-err': row.anomalies.emptyName }">
                  {{ row.name || '(空)' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="学号" min-width="100">
              <template #default="{ row }">
                <span :class="{ 'ipd-cell-warn': row.anomalies.duplicateId }">
                  {{ row.classNo || '—' }}
                </span>
                <el-tooltip v-if="row.anomalies.duplicateId" content="学号重复" placement="top">
                  <span class="ipd-anomaly-icon">⚠</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="班级" min-width="80">
              <template #default="{ row }">
                <span :class="{ 'ipd-cell-warn': row.anomalies.unknownClass }">
                  {{ row.className || '—' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="选修科目" min-width="140">
              <template #default="{ row }">
                <div class="ipd-elective-tags" v-if="row.electives.length">
                  <span v-for="e in row.electives" :key="e" class="ipd-elective-tag">{{ e }}</span>
                </div>
                <span v-else class="ipd-no-data">—</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="72" align="center">
              <template #default="{ row }">
                <el-tooltip v-if="row.anomalies.emptyName" content="缺少姓名，无法导入" placement="left">
                  <span class="ipd-status-err">✕</span>
                </el-tooltip>
                <el-tooltip v-else-if="row.anomalies.duplicateId || row.anomalies.unknownClass" :content="row.warning" placement="left">
                  <span class="ipd-status-warn">!</span>
                </el-tooltip>
                <span v-else class="ipd-status-ok">✓</span>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="ipd-pagination" v-if="totalPages > 1">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="filteredData.length"
              layout="prev, pager, next, total"
              small
              background
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer v-if="preview.length">
      <div class="ipd-footer">
        <el-checkbox v-model="skipDuplicates" size="small">跳过已存在学生（相同学号+班级）</el-checkbox>
        <div style="flex:1"></div>
        <el-button @click="$emit('close')">取消</el-button>
        <el-button type="primary" @click="doImport" :disabled="selectedCount === 0">
          导入所选 {{ selectedCount }} 名学生
        </el-button>
      </div>
    </template>
    <template #footer v-else>
      <el-button @click="$emit('close')">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useExamSeat2Store } from '@/views/admin/exams/exam-seat2/store/examSeat2Store.js'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

const emit = defineEmits(['close'])
const store = useExamSeat2Store()
const visible = ref(true)

const fileInput = ref(null)
const tableRef = ref(null)
const file = ref(null)
const preview = ref([])
const detectedCols = ref([])
const selectedRows = ref([])
const skipDuplicates = ref(true)

// 筛选状态
const filterClass = ref('')
const filterStatus = ref('')
const searchText = ref('')
const currentPage = ref(1)
const pageSize = 20

let uidCounter = 0

// ---- 异常计数 ----
const anomalyCounts = computed(() => {
  let duplicateId = 0, emptyName = 0, unknownClass = 0, invalidChars = 0
  preview.value.forEach(r => {
    if (r.anomalies.emptyName) emptyName++
    if (r.anomalies.duplicateId) duplicateId++
    if (r.anomalies.unknownClass) unknownClass++
    if (r.anomalies.invalidChars) invalidChars++
  })
  return { duplicateId, emptyName, unknownClass, invalidChars }
})

const validCount = computed(() => preview.value.filter(r => r.valid).length)
const warnCount = computed(() => preview.value.filter(r => r.valid && (r.anomalies.duplicateId || r.anomalies.unknownClass)).length)
const errorCount = computed(() => preview.value.filter(r => !r.valid).length)
const invalidCount = computed(() => preview.value.filter(r => r.anomalies.invalidChars).length)
const selectedCount = computed(() => selectedRows.value.length)

// 班级统计
const parsedClasses = computed(() => {
  const set = new Set()
  preview.value.forEach(r => { if (r.className) set.add(r.className) })
  return [...set].sort()
})

const classCounts = computed(() => {
  const map = {}
  preview.value.forEach(r => {
    const key = r.className || '__empty'
    map[key] = (map[key] || 0) + 1
  })
  return map
})

// 筛选后数据
const filteredData = computed(() => {
  let data = preview.value
  if (filterClass.value) {
    if (filterClass.value === '__empty') {
      data = data.filter(r => !r.className)
    } else {
      data = data.filter(r => r.className === filterClass.value)
    }
  }
  if (filterStatus.value === 'valid') {
    data = data.filter(r => r.valid && !r.anomalies.duplicateId && !r.anomalies.unknownClass)
  } else if (filterStatus.value === 'warn') {
    data = data.filter(r => r.valid && (r.anomalies.duplicateId || r.anomalies.unknownClass))
  } else if (filterStatus.value === 'error') {
    data = data.filter(r => !r.valid)
  } else if (filterStatus.value === 'invalid') {
    data = data.filter(r => r.anomalies.invalidChars)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    data = data.filter(r =>
      r.name.toLowerCase().includes(q) || r.classNo.toLowerCase().includes(q)
    )
  }
  return data
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / pageSize))
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

function isSelectable(row) {
  return row.valid
}

// 筛选变化时回到第一页
watch([filterClass, filterStatus, searchText], () => { currentPage.value = 1 })

// 翻页后恢复已选中行的勾选状态
watch(currentPage, async () => {
  await nextTick()
  if (!tableRef.value) return
  const selectedUids = new Set(selectedRows.value.map(r => r.uid))
  pagedData.value.forEach(row => {
    if (selectedUids.has(row.uid)) {
      tableRef.value.toggleRowSelection(row, true)
    }
  })
})

function onSelectionChange(rows) {
  // 合并跨页选择：保留不在当前页的已选行 + 当前页新选行
  const currentUids = new Set(pagedData.value.map(r => r.uid))
  const otherSelected = selectedRows.value.filter(r => !currentUids.has(r.uid))
  selectedRows.value = [...otherSelected, ...rows]
}

function selectAll() {
  selectedRows.value = [...filteredData.value.filter(r => r.valid)]
  nextTick(() => {
    if (tableRef.value) {
      pagedData.value.forEach(row => {
        if (row.valid) tableRef.value.toggleRowSelection(row, true)
      })
    }
  })
}

function deselectAll() {
  selectedRows.value = []
  if (tableRef.value) tableRef.value.clearSelection()
}

// ---- 文件处理 ----
function triggerFile() { fileInput.value?.click() }

function handleDrop(e) {
  const f = e.dataTransfer?.files?.[0]
  if (f) { file.value = f; parseExcel(f) }
}

function handleFile(e) {
  const f = e.target.files?.[0]
  if (!f) return
  file.value = f
  parseExcel(f)
}

function parseExcel(f) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      if (!rows.length) {
        ElMessage.warning('Excel 文件中没有数据')
        return
      }

      const headers = Object.keys(rows[0])
      const colMap = { electiveCols: [], extraCols: [] }
      const colInfo = []

      headers.forEach(h => {
        if (/^姓\s*名$|^名字$|^name$/i.test(h)) {
          colMap.name = h
          colInfo.push({ key: h, label: `姓名(${h})`, isPrimary: true })
        } else if (/^学\s*号$|^编\s*号$|^student\s*no|^class\s*no$/i.test(h)) {
          colMap.classNo = h
          colInfo.push({ key: h, label: `学号(${h})`, isPrimary: true })
        } else if (/^班\s*级$|^班\s*别$|^class\s*name$|^class$/i.test(h)) {
          colMap.className = h
          colInfo.push({ key: h, label: `班级(${h})`, isPrimary: true })
        } else if (/^选修\s*\d+$|^elective\s*\d+$|^选科\s*\d*$|^科目\s*\d+$|^subject\s*\d+$/i.test(h)) {
          colMap.electiveCols.push(h)
          colInfo.push({ key: h, label: `选修(${h})`, isPrimary: false })
        } else if (/选修|选科|elective|科目|subject/i.test(h)) {
          colMap.electiveCols.push(h)
          colInfo.push({ key: h, label: `选修(${h})`, isPrimary: false })
        } else {
          colMap.extraCols.push(h)
          colInfo.push({ key: h, label: h, isPrimary: false })
        }
      })

      if (!colMap.name) {
        ElMessage.error('未找到"姓名"列，请检查 Excel 表头是否包含：姓名 / 名字 / Name')
        return
      }

      detectedCols.value = colInfo

      // 收集现有学生的 (classNo, className) 用于重复检测
      const existingKeys = new Set(
        store.students.map(s => `${s.classNo}__${s.className}`)
      )

      // 解析原始数据
      const raw = rows
        .filter(r => {
          const name = String(r[colMap.name] || '').trim()
          const hasAnyData = Object.values(r).some(v => String(v || '').trim() !== '')
          return name || hasAnyData
        })
        .map(r => {
          const name = String(r[colMap.name] || '').trim()
          const classNo = colMap.classNo ? String(r[colMap.classNo] || '').trim() : ''
          const className = colMap.className ? String(r[colMap.className] || '').trim() : ''

          const electives = []
          for (const h of colMap.electiveCols) {
            const raw = String(r[h] || '').trim()
            if (!raw) continue
            electives.push(...raw.split(/[,，、;；\s]+/).filter(Boolean))
          }

          const extra = {}
          for (const h of colMap.extraCols) {
            const raw = String(r[h] || '').trim()
            if (raw) extra[h] = raw
          }

          const anomalies = { emptyName: false, duplicateId: false, unknownClass: false, invalidChars: false }
          let valid = !!name
          if (!name) { anomalies.emptyName = true; valid = false }

          // 姓名仅允许中文、英文、数字、间隔号·、连字符-、撇号'
          let charError = ''
          if (name && !/^[一-鿿㐀-䶿a-zA-Z0-9\s·\-']+$/.test(name)) {
            anomalies.invalidChars = true; valid = false; charError = '姓名包含非法字符'
          }
          // 检测纯数字姓名
          if (name && /^\d+$/.test(name)) {
            anomalies.invalidChars = true; valid = false
            charError = (charError ? charError + '；' : '') + '姓名不能为纯数字'
          }
          // 班级仅允许中文、英文、数字、间隔号·、连字符-
          if (className && !/^[一-鿿㐀-䶿a-zA-Z0-9\s·\-]+$/.test(className)) {
            anomalies.invalidChars = true; valid = false
            charError = (charError ? charError + '；' : '') + '班级包含非法字符'
          }

          return {
            uid: ++uidCounter,
            name,
            classNo,
            className,
            electives,
            _extra: extra,
            valid,
            anomalies,
            warning: '',
            error: charError,
            _existingKey: classNo && className ? `${classNo}__${className}` : ''
          }
        })

      // 异常检测：文件内学号重复
      const fileIdCount = {}
      raw.forEach(r => {
        if (r.classNo) {
          fileIdCount[r.classNo] = (fileIdCount[r.classNo] || 0) + 1
        }
      })
      raw.forEach(r => {
        if (r.classNo && fileIdCount[r.classNo] > 1) {
          r.anomalies.duplicateId = true
          r.warning = `文件内学号 "${r.classNo}" 重复 ${fileIdCount[r.classNo]} 次`
        }
      })

      // 异常检测：与现有学生学号+班级重复
      raw.forEach(r => {
        if (r._existingKey && existingKeys.has(r._existingKey)) {
          if (!r.anomalies.duplicateId) {
            r.anomalies.duplicateId = true
            r.warning = `与已有学生重复：${r.classNo} (${r.className})`
          } else {
            r.warning += '；也与已有学生重复'
          }
        }
      })

      // 异常检测：班级不存在于现有班级列表
      const knownClasses = new Set(store.availableClasses)
      raw.forEach(r => {
        if (r.className && !knownClasses.has(r.className)) {
          r.anomalies.unknownClass = true
          r.warning = (r.warning ? r.warning + '；' : '') + `班级 "${r.className}" 不在现有班级中`
        }
      })

      // 设置 error 消息
      raw.forEach(r => {
        if (r.anomalies.emptyName && !r.error) r.error = '缺少姓名'
        else if (r.anomalies.emptyName && r.error) r.error = '缺少姓名；' + r.error
      })

      preview.value = raw
      selectedRows.value = raw.filter(r => r.valid)
      currentPage.value = 1
      // 同步 el-table 复选框选中状态
      nextTick(() => {
        if (!tableRef.value) return
        const selectedUids = new Set(selectedRows.value.map(r => r.uid))
        pagedData.value.forEach(row => {
          const shouldSelect = selectedUids.has(row.uid)
          tableRef.value.toggleRowSelection(row, shouldSelect)
        })
      })
    } catch (err) {
      ElMessage.error('解析 Excel 失败：' + err.message)
    }
  }
  reader.readAsArrayBuffer(f)
}

function doImport() {
  if (!selectedRows.value.length) {
    ElMessage.warning('没有选中任何学生')
    return
  }

  const toImport = selectedRows.value.map(r => ({
    name: r.name,
    classNo: r.classNo,
    className: r.className,
    electives: r.electives,
    _extra: r._extra
  }))

  if (skipDuplicates.value) {
    const existingKeys = new Set(
      store.students.map(s => `${s.classNo}__${s.className}`)
    )
    const filtered = toImport.filter(s => {
      const key = `${s.classNo}__${s.className}`
      return !(s.classNo && s.className && existingKeys.has(key))
    })
    const skipped = toImport.length - filtered.length
    const result = store.importStudents(filtered)
    if (skipped > 0) {
      ElMessage.success(`已导入 ${result.added.length} 名学生，跳过 ${skipped} 名重复（共 ${result.total} 人）`)
    } else {
      ElMessage.success(`已导入 ${result.added.length} 名学生（共 ${result.total} 人）`)
    }
  } else {
    const result = store.importStudents(toImport)
    ElMessage.success(`已导入 ${result.added.length} 名学生（共 ${result.total} 人）`)
  }
  emit('close')
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['姓名', '学号', '班级', '选修1', '选修2', '选修3'],
    ['陈小明', '2024001', '5D', '物理', '化学', ''],
    ['李小红', '2024002', '5D', '经济', '历史', ''],
    ['王大力', '2024003', '5E', '生物', 'ICT', '']
  ])
  ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '学生名单')
  XLSX.writeFile(wb, '考试座位导入模板.xlsx')
}
</script>

<style scoped>
/* ===== Upload ===== */
.ipd-upload { text-align: center; }
.upload-dropzone {
  border: 2px dashed rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 38px 20px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.upload-dropzone:hover {
  border-color: var(--admin-accent, #6366f1);
  background: rgba(99,102,241,0.03);
}
.upload-icon { color: rgba(255,255,255,0.2); margin-bottom: 12px; }
.upload-text { font-size: 14px; color: var(--admin-text, #e2e8f0); }
.upload-hint { font-size: 12px; color: var(--admin-text-secondary, #64748b); margin-top: 6px; }
.ipd-upload-actions { margin-top: 18px; }
.ipd-upload-tips {
  margin-top: 20px; text-align: left; padding: 16px 18px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px;
}
.ipd-upload-tips h4 { margin: 0 0 10px; font-size: 13px; color: var(--admin-text, #e2e8f0); font-weight: 600; }
.ipd-upload-tips ul { margin: 0; padding-left: 18px; font-size: 12px; color: var(--admin-text-secondary, #94a3b8); line-height: 2; }

/* ===== Preview ===== */
.ipd-preview { display: flex; flex-direction: column; gap: 10px; }

/* Stats bar */
.ipd-stats-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px;
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;
}
.ipd-stats-left { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.ipd-stat { font-size: 12px; color: var(--admin-text-secondary, #8a8570); }
.ipd-stat b { font-weight: 700; color: var(--admin-text, #e4dfd5); }
.ipd-stat-ok { color: #10b981; }
.ipd-stat-ok b { color: #10b981; }
.ipd-stat-warn { color: #f59e0b; }
.ipd-stat-warn b { color: #f59e0b; }
.ipd-stat-err { color: #ef4444; }
.ipd-stat-err b { color: #ef4444; }
.ipd-stat-selected { color: #6366f1; }
.ipd-stat-selected b { color: #818cf8; }

/* Column info */
.ipd-cols-info {
  display: flex; gap: 6px; align-items: center; flex-wrap: wrap;
  padding: 6px 12px; background: rgba(255,255,255,0.015); border-radius: 6px;
}
.cols-info-label { font-size: 11px; color: var(--admin-text-secondary, #64748b); margin-right: 4px; }
.cols-info-tag {
  font-size: 10px; padding: 2px 8px; border-radius: 3px;
  background: rgba(255,255,255,0.04); color: var(--admin-text-secondary, #8a8570);
  border: 1px solid rgba(255,255,255,0.06);
}
.cols-info-tag.is-primary {
  background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.2); color: #a5b4fc;
}

/* Body: filters + table */
.ipd-body { display: flex; gap: 12px; }

/* Filters */
.ipd-filters {
  width: 170px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 12px;
}
.ipd-filter-section { display: flex; flex-direction: column; gap: 2px; }
.ipd-filter-title { font-size: 11px; font-weight: 600; color: var(--admin-text-muted, #5a5568); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
.ipd-filter-list { display: flex; flex-direction: column; gap: 1px; }
.ipd-filter-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 8px; border-radius: 5px; cursor: pointer;
  font-size: 11px; color: var(--admin-text-secondary, #8a8570);
  transition: all 0.15s;
}
.ipd-filter-item:hover { background: rgba(255,255,255,0.03); }
.ipd-filter-item.active { background: rgba(99,102,241,0.1); color: #a5b4fc; }
.ipd-filter-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ipd-filter-count {
  font-size: 10px; color: var(--admin-text-muted, #5a5568); min-width: 20px; text-align: right;
}
.ipd-fc-ok { color: #10b981; }
.ipd-fc-warn { color: #f59e0b; }
.ipd-fc-err { color: #ef4444; }
.ipd-filter-actions { display: flex; gap: 4px; }

/* Table */
.ipd-table-wrap { flex: 1; min-width: 0; }

/* Cell anomaly colors */
.ipd-cell-err { color: #ef4444; font-weight: 600; }
.ipd-cell-warn { color: #f59e0b; }
.ipd-anomaly-icon { color: #f59e0b; font-size: 12px; margin-left: 4px; cursor: help; }

.ipd-elective-tags { display: flex; flex-wrap: wrap; gap: 3px; }
.ipd-elective-tag {
  font-size: 10px; padding: 1px 6px; border-radius: 3px;
  background: rgba(99,102,241,0.1); color: #a5b4fc;
  border: 1px solid rgba(99,102,241,0.15);
}
.ipd-no-data { color: var(--admin-text-secondary, #64748b); font-size: 12px; }

.ipd-status-ok { color: #10b981; font-size: 14px; font-weight: 700; }
.ipd-status-err { color: #ef4444; font-size: 14px; font-weight: 700; cursor: help; }
.ipd-status-warn { color: #f59e0b; font-size: 14px; font-weight: 700; cursor: help; }

/* Pagination */
.ipd-pagination { display: flex; justify-content: center; margin-top: 10px; }

/* Footer */
.ipd-footer { display: flex; align-items: center; gap: 8px; width: 100%; }
</style>
