<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">⚖️ 学生纪律台账</div>
          <div class="admin-card-subtitle">违纪记录 · 处理措施 · 跟踪教育</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-select v-model="filterStatus" size="small" placeholder="处理状态" style="width:110px" clearable>
            <el-option label="处理中" value="处理中" />
            <el-option label="已处理" value="已处理" />
          </el-select>
          <el-button size="small" type="primary" @click="openDialog(null)">+ 新增记录</el-button>
        </div>
      </div>

      <el-table :data="paginatedDiscipline" stripe size="small" style="width:100%">
        <el-table-column prop="date" label="日期" fixed width="120" />
        <el-table-column label="学生" fixed>
          <template #default="{ row }">
            <span style="color:var(--admin-text);font-weight:500">{{ row.studentName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="class" label="班级" />
        <el-table-column prop="violation" label="违纪类型" />
        <el-table-column label="严重程度">
          <template #default="{ row }">
            <span class="admin-tag" :class="levelClass(row.level)">{{ row.level }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="punishment" label="处理措施" show-overflow-tooltip />
        <el-table-column label="执行时间">
          <template #default="{ row }">
            <span>{{ row.executionTime || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="执行凭证">
          <template #default="{ row }">
            <img v-if="row.executionImage" :src="row.executionImage" class="execution-thumb" @click="previewExecution(row)" title="点击查看执行凭证" />
            <span v-else style="font-size:11px;color:var(--admin-text-muted)">无</span>
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <span class="admin-tag" :class="row.status==='已处理'?'success':'warning'">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="handler" label="记录人" />
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button size="small" text @click="openDialog(row)">编辑</el-button>
            <el-button size="small" text @click="previewExecution(row)" v-if="row.executionImage">凭证</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:12px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:11px;color:var(--admin-text-muted)">共 {{ totalFiltered }} 条记录</span>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,15,20,50]" :total="totalFiltered" layout="total, sizes, prev, pager, next, jumper" size="small" background />
      </div>
    </div>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑纪律记录' : '新增纪律记录'" width="500px">
      <div class="admin-form-group">
        <label>学生</label>
        <el-select v-model="form.studentId" style="width:100%" filterable @change="onStudentSelect">
          <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>违纪类型</label>
          <el-select v-model="form.violation" style="width:100%">
            <el-option v-for="t in violationTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>严重程度</label>
          <el-select v-model="form.level" style="width:100%">
            <el-option label="轻微" value="轻微" />
            <el-option label="一般" value="一般" />
            <el-option label="严重" value="严重" />
          </el-select>
        </div>
      </div>
      <div class="admin-form-group">
        <label>详细描述</label>
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请客观描述违纪事实..." />
      </div>
      <div class="admin-form-group">
        <label>处理措施</label>
        <el-input v-model="form.punishment" type="textarea" :rows="2" placeholder="已采取的处理措施..." />
      </div>
      <div class="admin-form-group">
        <label>执行时间</label>
        <el-date-picker v-model="form.executionTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择日期时间" style="width:100%" />
      </div>
      <div class="admin-form-group">
        <label>执行凭证（照片）</label>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="image-upload-area" @click="triggerExecImageUpload">
            <input ref="execImageInput" type="file" accept="image/*" style="display:none" @change="handleExecImageUpload" />
            <img v-if="form.executionImage" :src="form.executionImage" class="image-preview" />
            <div v-else class="image-placeholder">
              <span style="font-size:28px">📷</span>
              <span style="font-size:11px;color:var(--admin-text-muted)">点击上传</span>
            </div>
          </div>
          <el-button v-if="form.executionImage" size="small" type="danger" @click="form.executionImage = null">移除图片</el-button>
        </div>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>处理状态</label>
          <el-select v-model="form.status" style="width:100%">
            <el-option label="处理中" value="处理中" />
            <el-option label="已处理" value="已处理" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>记录人</label>
          <el-input v-model="form.handler" placeholder="记录人" />
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">{{ editingId ? '保存修改' : '添加记录' }}</el-button>
      </template>
    </el-dialog>

    <!-- Execution Preview Modal -->
    <el-dialog v-model="execPreviewVisible" title="执行凭证" width="600px" :close-on-click-modal="true">
      <div style="text-align:center">
        <img v-if="execPreviewImage" :src="execPreviewImage" style="max-width:100%;max-height:65vh;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,0.2)" />
        <div v-if="execPreviewRecord" style="margin-top:16px;text-align:left;background:var(--admin-bg);border-radius:10px;padding:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
            <div><span style="color:var(--admin-text-muted)">学生：</span><span style="color:var(--admin-text);font-weight:500">{{ execPreviewRecord.studentName }}</span></div>
            <div><span style="color:var(--admin-text-muted)">班级：</span><span style="color:var(--admin-text)">{{ execPreviewRecord.class }}</span></div>
            <div><span style="color:var(--admin-text-muted)">违纪类型：</span><span style="color:var(--admin-text)">{{ execPreviewRecord.violation }}</span></div>
            <div><span style="color:var(--admin-text-muted)">严重程度：</span><span class="admin-tag" :class="levelClass(execPreviewRecord.level)">{{ execPreviewRecord.level }}</span></div>
            <div style="grid-column:1/-1"><span style="color:var(--admin-text-muted)">处理措施：</span><span style="color:var(--admin-text)">{{ execPreviewRecord.punishment }}</span></div>
            <div><span style="color:var(--admin-text-muted)">执行时间：</span><span style="color:var(--admin-text)">{{ execPreviewRecord.executionTime || '未记录' }}</span></div>
            <div><span style="color:var(--admin-text-muted)">记录人：</span><span style="color:var(--admin-text)">{{ execPreviewRecord.handler }}</span></div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Summary -->
    <div class="admin-two-col" style="margin-top:16px">
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📊 违纪类型统计</div>
        <div v-for="s in typeSummary" :key="s.type" style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span style="font-size:12px;width:72px;color:var(--admin-text-secondary)">{{ s.type }}</span>
          <div style="flex:1;height:6px;background:var(--admin-bg);border-radius:3px;overflow:hidden">
            <div :style="{width:Math.max(s.count*15,5)+'%',background:s.color,height:'100%',borderRadius:'3px'}"></div>
          </div>
          <span style="font-size:11px;color:var(--admin-text-muted);width:30px;text-align:right">{{ s.count }}次</span>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📋 近期处理记录</div>
        <div class="admin-timeline">
          <div v-for="l in discipline.slice(0, 5)" :key="l.id" class="admin-timeline-item">
            <div class="tl-time">{{ l.date }}</div>
            <div class="tl-content"><b style="color:var(--admin-text)">{{ l.studentName }}</b> — {{ l.violation }} · {{ l.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { disciplineService, studentService } from '@/services/dataService'

const discipline = ref([])
const studentList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(15)
const execPreviewVisible = ref(false)
const execPreviewImage = ref('')
const execPreviewRecord = ref(null)
const execImageInput = ref(null)

function triggerExecImageUpload() {
  execImageInput.value?.click()
}

const violationTypes = ['迟到','旷课','课堂违纪','打架斗殴','破坏公物','考试作弊','携带违禁品','言语不当','未完成作业','手机违规使用']

const form = ref({
  studentId: null, studentName: '', class: '', violation: '', level: '轻微',
  description: '', punishment: '', executionTime: '', executionImage: null, status: '处理中', handler: '张老师'
})

onMounted(() => {
  studentList.value = studentService.getAll()
  discipline.value = disciplineService.getAll()
})

const filteredDiscipline = computed(() => {
  if (!filterStatus.value) return discipline.value
  return discipline.value.filter(d => d.status === filterStatus.value)
})

const totalFiltered = computed(() => filteredDiscipline.value.length)

const paginatedDiscipline = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDiscipline.value.slice(start, start + pageSize.value)
})

function levelClass(l) { return { '轻微':'info', '一般':'warning', '严重':'danger' }[l] || 'info' }

function onStudentSelect() {
  const s = studentList.value.find(s => s.id === form.value.studentId)
  if (s) { form.value.studentName = s.name; form.value.class = s.class }
}

function handleExecImageUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片大小不能超过5MB'); return }
  const reader = new FileReader()
  reader.onload = () => { form.value.executionImage = reader.result }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function previewExecution(d) {
  execPreviewImage.value = d.executionImage
  execPreviewRecord.value = d
  execPreviewVisible.value = true
}

const typeSummary = computed(() => {
  const map = {}
  discipline.value.forEach(d => { map[d.violation] = (map[d.violation] || 0) + 1 })
  const colors = ['var(--admin-info)','var(--admin-warning)','var(--admin-primary)','var(--admin-danger)','var(--admin-success)']
  return Object.entries(map).map(([type, count], i) => ({ type, count, color: colors[i % colors.length] }))
})

function openDialog(d) {
  if (d) {
    editingId.value = d.id
    form.value = { ...d, studentId: d.studentId, executionImage: d.executionImage || null, executionTime: d.executionTime || '' }
  } else {
    editingId.value = null
    form.value = { studentId: null, studentName: '', class: '', violation: '', level: '轻微', description: '', punishment: '', executionTime: '', executionImage: null, status: '处理中', handler: '张老师' }
  }
  dialogVisible.value = true
}

function saveRecord() {
  if (!form.value.studentId) { ElMessage.warning('请选择学生'); return }
  if (!form.value.violation) { ElMessage.warning('请选择违纪类型'); return }
  const data = { ...form.value, date: new Date().toISOString().split('T')[0] }
  if (editingId.value) {
    disciplineService.update(editingId.value, data)
    ElMessage.success('已更新')
  } else {
    disciplineService.create(data)
    ElMessage.success('记录已添加')
  }
  dialogVisible.value = false
  discipline.value = disciplineService.getAll()
}

async function handleDelete(d) {
  try {
    await ElMessageBox.confirm('确定删除此纪律记录吗？', '确认删除', { confirmButtonText:'删除', cancelButtonText:'取消', type:'warning' })
    disciplineService.delete(d.id)
    discipline.value = disciplineService.getAll()
    ElMessage.success('已删除')
  } catch {}
}
</script>

<style scoped>
.execution-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid var(--admin-border); }
.execution-thumb:hover { border-color: var(--admin-accent); transform: scale(1.1); }
.image-upload-area { width: 100px; height: 100px; border: 2px dashed var(--admin-border); border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; transition: border-color 0.2s; }
.image-upload-area:hover { border-color: var(--admin-accent); }
.image-preview { width: 100%; height: 100%; object-fit: cover; }
.image-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.row-selected td { background: rgba(201,160,80,0.08) !important; }
</style>
