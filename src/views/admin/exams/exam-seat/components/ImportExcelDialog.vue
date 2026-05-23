<template>
  <el-dialog
    v-model="visible"
    title="导入学生数据"
    width="820px"
    :close-on-click-modal="false"
    :append-to-body="true"
    :z-index="2100"
    @close="$emit('close')"
    class="import-dialog"
  >
    <!-- 上传区域 -->
    <div class="import-upload" v-if="!preview.length">
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
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls"
        style="display:none"
        @change="handleFile"
      />
      <div class="import-actions">
        <el-button @click="downloadTemplate" type="primary" plain>
          下载导入模板
        </el-button>
      </div>
      <div class="import-tips">
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
    <div class="import-preview" v-else>
      <div class="preview-summary">
        <div class="preview-summary-left">
          <span class="preview-count">共解析 <b>{{ preview.length }}</b> 条数据</span>
          <span class="preview-count-valid">有效 <b>{{ validCount }}</b> 条</span>
          <span v-if="preview.length - validCount > 0" class="preview-count-invalid">异常 {{ preview.length - validCount }} 条</span>
          <span class="preview-col-count">检测到 {{ detectedCols.length }} 列</span>
        </div>
        <el-button @click="preview = []; file = null; fileInput.value = ''" text>重新选择</el-button>
      </div>

      <!-- 检测到的列信息 -->
      <div class="preview-cols-info" v-if="detectedCols.length">
        <span class="cols-info-label">识别列：</span>
        <span v-for="c in detectedCols" :key="c.key" class="cols-info-tag" :class="{ 'is-primary': c.isPrimary }">
          {{ c.label }}
        </span>
      </div>

      <el-table :data="preview" max-height="340" border stripe size="small" class="preview-table">
        <el-table-column prop="name" label="姓名" width="90" fixed />
        <el-table-column prop="classNo" label="学号" width="110" />
        <el-table-column prop="className" label="班级" width="100" />
        <el-table-column label="选修科目" min-width="160">
          <template #default="{ row }">
            <div class="elective-tags-wrap">
              <el-tag
                v-for="e in row.electives" :key="e"
                size="small"
                class="elective-tag"
              >{{ e }}</el-tag>
              <span v-if="!row.electives.length" class="no-elective">—</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="其他字段" min-width="120">
          <template #default="{ row }">
            <div class="extra-fields" v-if="row._extra && Object.keys(row._extra).length">
              <span v-for="(v, k) in row._extra" :key="k" class="extra-field-item">
                <span class="extra-field-key">{{ k }}</span>: {{ v }}
              </span>
            </div>
            <span v-else class="no-elective">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="72" align="center" fixed="right">
          <template #default="{ row }">
            <span v-if="row.valid" class="status-ok">✓</span>
            <el-tooltip v-else :content="row.error" placement="left">
              <span class="status-err">⚠</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer v-if="preview.length">
      <div class="import-footer">
        <div style="flex:1"></div>
        <el-button @click="$emit('close')">取消</el-button>
        <el-button type="primary" @click="doImport" :disabled="validCount === 0">
          导入 {{ validCount }} 名学生
        </el-button>
      </div>
    </template>
    <template #footer v-else>
      <el-button @click="$emit('close')">取消</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExamSeatStore } from '@/views/admin/exams/exam-seat/store/examSeatStore.js'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

const emit = defineEmits(['close'])
const store = useExamSeatStore()
const visible = ref(true)

const fileInput = ref(null)
const file = ref(null)
const preview = ref([])
const detectedCols = ref([])


const validCount = computed(() => preview.value.filter(r => r.valid).length)

function triggerFile() {
  fileInput.value?.click()
}

function handleDrop(e) {
  const f = e.dataTransfer?.files?.[0]
  if (f) {
    file.value = f
    parseExcel(f)
  }
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

      // 列名自动识别
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

      preview.value = rows
        .filter(r => {
          // 过滤完全空行
          const name = String(r[colMap.name] || '').trim()
          const hasAnyData = Object.values(r).some(v => String(v || '').trim() !== '')
          return name || hasAnyData
        })
        .map(r => {
          const name = String(r[colMap.name] || '').trim()
          const classNo = colMap.classNo ? String(r[colMap.classNo] || '').trim() : ''
          const className = colMap.className ? String(r[colMap.className] || '').trim() : ''

          // 收集选修科目
          const electives = []
          for (const h of colMap.electiveCols) {
            const raw = String(r[h] || '').trim()
            if (!raw) continue
            electives.push(...raw.split(/[,，、;；\s]+/).filter(Boolean))
          }

          // 收集额外字段
          const extra = {}
          for (const h of colMap.extraCols) {
            const raw = String(r[h] || '').trim()
            if (raw) extra[h] = raw
          }

          const valid = !!name
          return {
            name,
            classNo,
            className,
            electives,
            _extra: extra,
            valid,
            error: !name ? '缺少姓名' : ''
          }
        })
    } catch (err) {
      ElMessage.error('解析 Excel 失败：' + err.message)
    }
  }
  reader.readAsArrayBuffer(f)
}

function doImport() {
  const valid = preview.value.filter(r => r.valid)
  if (!valid.length) {
    ElMessage.warning('没有有效数据')
    return
  }
  const result = store.importStudents(valid)
  ElMessage.success(`已导入 ${result.added.length} 名学生（共 ${result.total} 人）`)
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
.import-upload { text-align: center; }
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
.upload-icon {
  color: rgba(255,255,255,0.2);
  margin-bottom: 12px;
}
.upload-text { font-size: 14px; color: var(--admin-text, #e2e8f0); }
.upload-hint {
  font-size: 12px;
  color: var(--admin-text-secondary, #64748b);
  margin-top: 6px;
}
.import-actions { margin-top: 18px; }
.import-tips {
  margin-top: 20px;
  text-align: left;
  padding: 16px 18px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 8px;
}
.import-tips h4 { margin: 0 0 10px; font-size: 13px; color: var(--admin-text, #e2e8f0); font-weight: 600; }
.import-tips ul { margin: 0; padding-left: 18px; font-size: 12px; color: var(--admin-text-secondary, #94a3b8); line-height: 2; }

/* Preview */
.import-preview { display: flex; flex-direction: column; gap: 10px; }

.preview-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-summary-left {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.preview-count {
  font-size: 13px;
  color: var(--admin-text, #e2e8f0);
}
.preview-count b { color: #e4dfd5; }

.preview-count-valid {
  font-size: 12px;
  color: #10b981;
}
.preview-count-valid b { font-weight: 700; }

.preview-count-invalid {
  font-size: 12px;
  color: #f59e0b;
}

.preview-col-count {
  font-size: 11px;
  color: var(--admin-text-secondary, #64748b);
}

/* Column detection info */
.preview-cols-info {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: rgba(255,255,255,0.015);
  border-radius: 6px;
}

.cols-info-label {
  font-size: 11px;
  color: var(--admin-text-secondary, #64748b);
  margin-right: 4px;
}

.cols-info-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(255,255,255,0.04);
  color: var(--admin-text-secondary, #8a8570);
  border: 1px solid rgba(255,255,255,0.06);
}
.cols-info-tag.is-primary {
  background: rgba(99,102,241,0.1);
  border-color: rgba(99,102,241,0.2);
  color: #a5b4fc;
}

/* Table */
.preview-table {
  width: 100%;
}

.elective-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.elective-tag {
  margin: 0;
}

.no-elective {
  color: var(--admin-text-secondary, #64748b);
  font-size: 12px;
}

.extra-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.extra-field-item {
  font-size: 11px;
  color: var(--admin-text-secondary, #8a8570);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.extra-field-key {
  font-size: 10px;
  color: var(--admin-text-muted, #5a5568);
}

.status-ok {
  color: #10b981;
  font-size: 16px;
  font-weight: 700;
}

.status-err {
  color: #f59e0b;
  font-size: 15px;
  cursor: help;
}

.import-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.import-footer-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--admin-text-secondary, #94a3b8);
  cursor: pointer;
  user-select: none;
}

.import-footer-check input {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #6366f1;
}

.import-footer-hint {
  font-size: 12px;
  color: var(--admin-text-muted, #5a5568);
  cursor: help;
  width: 16px;
  height: 16px;
  border: 1px solid var(--admin-text-muted, #5a5568);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 10px;
}
</style>
