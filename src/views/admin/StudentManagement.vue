<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">👨‍🎓 学生信息管理</div>
          <div class="admin-card-subtitle">学生档案 · 班级归属 · DSE课程选修 · 留学规划</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-select v-model="filterClass" size="small" placeholder="班级筛选" style="width:110px" clearable>
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
          <el-select v-model="filterCampus" size="small" placeholder="校区筛选" style="width:120px" clearable>
            <el-option v-for="c in campusList" :key="c" :label="c" :value="c" />
          </el-select>
          <el-button size="small" type="primary" @click="openDialog(null)">+ 添加学生</el-button>
          <el-button size="small" @click="printPreview">🖨️ 打印预览</el-button>
          <el-button size="small" type="success" @click="batchExport" :disabled="selectedIds.length===0">📥 批量导出</el-button>
          <el-button size="small" type="danger" @click="batchDelete" :disabled="selectedIds.length===0">🗑 批量删除</el-button>
        </div>
      </div>

      <div class="student-table-wrap">
        <el-table
          ref="studentTableRef"
          :data="filteredStudents"
          size="small"
          height="400"
          style="width:100%"
          @selection-change="onSelectionChange"
          @row-click="onRowClick"
        >
        <el-table-column type="selection" width="40" fixed />
        <el-table-column prop="name" label="姓名" fixed width="100">
          <template #default="{ row }">
            <span class="student-name-link" @click.stop="openDialog(row)">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="campus" label="校区" width="110" />
        <el-table-column prop="class" label="班级" width="70" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column label="身份" width="90">
          <template #default="{ row }">
            <span class="admin-tag" :class="row.identity === '港籍永居' ? 'success' : row.identity === '港籍临时' ? 'warning' : 'info'">{{ row.identity || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="住宿" width="70">
          <template #default="{ row }">
            <span class="admin-tag" :class="row.boarding ? 'success' : 'info'">{{ row.boarding ? '是' : '否' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="targetUniversity" label="目标院校" min-width="120" show-overflow-tooltip />
        <el-table-column prop="cc" label="CC" width="80" />
        <el-table-column prop="sa" label="SA" width="80" />
        <el-table-column label="留学" width="70">
          <template #default="{ row }">
            <span class="admin-tag" :class="row.studyAbroadPlanning ? 'warning' : 'info'">{{ row.studyAbroadPlanning ? '是' : '否' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="elective1" label="选修1" width="90" />
        <el-table-column prop="elective2" label="选修2" width="90" />
        <el-table-column prop="elective3" label="选修3" width="90" />
        <el-table-column label="操作" fixed="right" width="140">
          <template #default="{ row }">
            <el-button size="small" text @click="openDialog(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
      <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:11px;color:var(--admin-text-muted)">共 {{ totalFiltered }} 名学生</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10,15,20,50]"
          :total="totalFiltered"
          layout="total, sizes, prev, pager, next, jumper"
          size="small"
          background
        />
      </div>
    </div>

    <!-- Student form dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑学生信息' : '添加学生'" width="720px" :close-on-click-modal="false" @closed="resetForm">
      <div class="dialog-body-scroll">
        <div class="form-grid">
          <div class="admin-form-group">
            <label>学生姓名 <span style="color:var(--admin-danger)">*</span></label>
            <el-input v-model="form.name" placeholder="请输入学生姓名" />
          </div>
          <div class="admin-form-group">
            <label>性别</label>
            <el-select v-model="form.gender" style="width:100%">
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>所属校区</label>
            <el-select v-model="form.campus" style="width:100%" filterable>
              <el-option v-for="c in campusList" :key="c" :label="c" :value="c" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>所属班级</label>
            <el-select v-model="form.class" style="width:100%" filterable>
              <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>是否住宿</label>
            <el-switch v-model="form.boarding" active-text="是" inactive-text="否" />
          </div>
          <div class="admin-form-group">
            <label>学校</label>
            <el-input v-model="form.school" placeholder="如：威学一百" />
          </div>
          <div class="admin-form-group">
            <label>目标院校</label>
            <el-input v-model="form.targetUniversity" placeholder="如：香港大学" />
          </div>
          <div class="admin-form-group">
            <label>身份</label>
            <el-select v-model="form.identity" style="width:100%">
              <el-option label="港籍永居" value="港籍永居" />
              <el-option label="港籍临时" value="港籍临时" />
              <el-option label="大陆" value="大陆" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>CC（咨询）</label>
            <el-input v-model="form.cc" placeholder="班主任姓名" />
          </div>
          <div class="admin-form-group">
            <label>SA（学习顾问）</label>
            <el-input v-model="form.sa" placeholder="助教姓名" />
          </div>
          <div class="admin-form-group">
            <label>是否规划留学</label>
            <el-switch v-model="form.studyAbroadPlanning" active-text="是" inactive-text="否" />
          </div>
          <div class="admin-form-group">
            <label>选修1 <span style="color:var(--admin-danger)">*</span></label>
            <el-select v-model="form.elective1" style="width:100%" filterable>
              <el-option-group v-for="group in groupedCourses" :key="group.label" :label="group.label">
                <el-option v-for="c in group.options" :key="c.id" :label="c.name" :value="c.name" />
              </el-option-group>
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>选修2</label>
            <el-select v-model="form.elective2" style="width:100%" filterable clearable>
              <el-option-group v-for="group in groupedCourses" :key="group.label" :label="group.label">
                <el-option v-for="c in group.options" :key="c.id" :label="c.name" :value="c.name" />
              </el-option-group>
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>选修3</label>
            <el-select v-model="form.elective3" style="width:100%" filterable clearable>
              <el-option-group v-for="group in groupedCourses" :key="group.label" :label="group.label">
                <el-option v-for="c in group.options" :key="c.id" :label="c.name" :value="c.name" />
              </el-option-group>
            </el-select>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">{{ editingId ? '保存修改' : '添加学生' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { studentService, courseService } from '@/services/dataService'
import { getWatermarkConfig, buildExportHTML } from '@/utils/watermark'

const students = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const filterClass = ref('')
const filterCampus = ref('')
const form = ref(getDefaultForm())
const selectedIds = ref([])
const currentPage = ref(1)
const pageSize = ref(15)
const studentTableRef = ref(null)

const groupedCourses = computed(() => {
  const courses = courseService.getEnabled().filter(c => c.category === 'elective' && !c.parentId)
  return [
    { label: '选修科目', options: courses }
  ]
})

const classList = computed(() => studentService.getClasses())
const campusList = computed(() => studentService.getCampuses())

const filteredStudents = computed(() => {
  let list = students.value.filter(s => {
    if (filterClass.value && s.class !== filterClass.value) return false
    if (filterCampus.value && s.campus !== filterCampus.value) return false
    return true
  })
  const start = (currentPage.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

const totalFiltered = computed(() => {
  return students.value.filter(s => {
    if (filterClass.value && s.class !== filterClass.value) return false
    if (filterCampus.value && s.campus !== filterCampus.value) return false
    return true
  }).length
})

function getDefaultForm() {
  return {
    name: '', gender: '男', campus: '九龙塘总校', class: '5D',
    boarding: false, targetUniversity: '', school: '威学一百',
    identity: '港籍永居', cc: '张老师', sa: '李老师',
    studyAbroadPlanning: false, elective1: '', elective2: '', elective3: ''
  }
}

onMounted(() => { loadStudents() })

function loadStudents() { students.value = studentService.getAll() }

function openDialog(student) {
  if (student) {
    editingId.value = student.id
    form.value = { ...student }
  } else {
    editingId.value = null
    form.value = getDefaultForm()
  }
  dialogVisible.value = true
}

function resetForm() {
  editingId.value = null
  form.value = getDefaultForm()
}

function handleSave() {
  if (!form.value.name) { ElMessage.warning('请输入学生姓名'); return }
  const electives = [form.value.elective1, form.value.elective2, form.value.elective3].filter(Boolean)
  if (electives.length === 0) { ElMessage.warning('请至少选择一门选修课'); return }
  if (new Set(electives).size !== electives.length) { ElMessage.warning('选修课不能重复选择'); return }
  if (editingId.value) {
    studentService.update(editingId.value, form.value)
    ElMessage.success('学生信息已更新')
  } else {
    studentService.create({ ...form.value, createdAt: new Date().toISOString().split('T')[0] })
    ElMessage.success('学生已添加')
  }
  dialogVisible.value = false
  loadStudents()
}

function printPreview() {
  const students = filteredStudents.value
  const today = new Date().toISOString().split('T')[0]
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>学生信息表</title><style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; color: #2c2c2c; padding: 0; }
    .header { text-align: center; border: 3px double #8b5e3c; padding: 16px; margin-bottom: 16px; }
    .header h1 { font-size: 18px; margin: 0 0 6px; color: #4a2c17; letter-spacing: 2px; }
    .header .meta { font-size: 11px; color: #888; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f5f0e8; padding: 8px 6px; border: 1px solid #ddd; font-weight: 600; }
    td { padding: 6px; border: 1px solid #ddd; text-align: center; }
    .name { font-weight: 600; }
    .footer { text-align: center; font-size: 10px; color: #999; margin-top: 12px; border-top: 1px solid #eee; padding-top: 8px; }
    @media print { body { margin: 0; } }
  </style></head><body>
  <div class="header">
    <h1>📋 威学一百 · 学生信息表</h1>
    <div class="meta">${filterClass.value || '全部班级'} · ${filterCampus.value || '全部校区'} · ${students.length}名学生 · ${today}</div>
  </div>
  <table><thead><tr><th>姓名</th><th>班级</th><th>校区</th><th>身份</th><th>CC</th><th>SA</th><th>选修1</th><th>选修2</th><th>选修3</th></tr></thead><tbody>`

  students.forEach(s => {
    html += `<tr><td class="name">${s.name}</td><td>${s.class}</td><td>${s.campus}</td><td>${s.identity || '—'}</td><td>${s.cc || '—'}</td><td>${s.sa || '—'}</td><td>${s.elective1 || '—'}</td><td>${s.elective2 || '—'}</td><td>${s.elective3 || '—'}</td></tr>`
  })

  html += `</tbody></table><div class="footer">威学一百 DSE 学情管理系统 · 仅供内部使用</div></body></html>`

  // Inject watermark
  const wmConfig = getWatermarkConfig()
  if (wmConfig.enabled) {
    const now = new Date().toLocaleString('zh-CN')
    const username = localStorage.getItem('dse_username') || '管理员'
    html = html.replace('</style>', `
      .watermark-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.12; }
      .watermark-overlay .wm-text { font-size: 48px; color: #ff0000; font-weight: 900; transform: rotate(-25deg); white-space: nowrap; }
      .watermark-overlay .wm-meta { font-size: 10px; color: #ff0000; margin-top: 8px; }
    </style>`)
    html = html.replace('</body>', `<div class="watermark-overlay">
      ${Array(8).fill(`<div class="wm-text">${wmConfig.text}</div>`).join('')}
      <div class="wm-meta">导出人：${username} · 导出时间：${now}</div>
    </div></body>`)
  }

  const w = window.open('', '_blank', 'width=800,height=600')
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 300)
}

async function handleDelete(student) {
  try {
    await ElMessageBox.confirm(`确定删除学生「${student.name}」吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    studentService.delete(student.id)
    ElMessage.success('学生已删除')
    loadStudents()
    clearSelection()
  } catch {}
}

function onSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

function onRowClick(row) {
  openDialog(row)
}

function clearSelection() {
  studentTableRef.value?.clearSelection()
}

function batchExport() {
  if (selectedIds.value.length === 0) { ElMessage.warning('请先勾选学生'); return }
  const selected = students.value.filter(s => selectedIds.value.includes(s.id))
  const headers = ['姓名','校区','班级','性别','住宿','目标院校','身份','CC','SA','留学规划','选修1','选修2','选修3']
  const rows = selected.map(s => [s.name, s.campus, s.class, s.gender, s.boarding?'是':'否', s.targetUniversity, s.identity, s.cc, s.sa, s.studyAbroadPlanning?'是':'否', s.elective1, s.elective2, s.elective3])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `学生数据_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${selected.length} 名学生`)
}

async function batchDelete() {
  if (selectedIds.value.length === 0) { ElMessage.warning('请先勾选学生'); return }
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 名学生吗？此操作不可恢复。`, '批量删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    selectedIds.value.forEach(id => studentService.delete(id))
    ElMessage.success(`已删除 ${selectedIds.value.length} 名学生`)
    loadStudents()
    clearSelection()
  } catch {}
}
</script>

<style scoped>
.student-name-link {
  color: var(--admin-text);
  font-weight: 500;
  cursor: pointer;
}
.student-name-link:hover { color: var(--admin-primary); }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0 16px;
}

.student-table-wrap {
  overflow-x: auto;
  max-width: 100%;
}

.dialog-body-scroll {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 480px) {
  .form-grid { grid-template-columns: 1fr; }
  .student-table-wrap { overflow-x: auto; }
}
</style>
