<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">👥 课堂表现记录</div>
          <div class="admin-card-subtitle">按班级记录学生课堂行为、参与度、专注度</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-select v-model="filterClass" size="small" placeholder="班级" style="width:100px" clearable>
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
          <el-select v-model="filterSubject" size="small" placeholder="科目" style="width:100px" clearable>
            <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
          </el-select>
          <el-button size="small" type="primary" @click="openDialog(null)">+ 添加记录</el-button>
        </div>
      </div>

      <el-table :data="filteredRecords" stripe size="small" style="width:100%">
        <el-table-column prop="time" label="时间" fixed width="160" />
        <el-table-column label="学生">
          <template #default="{ row }">
            <span style="color:var(--admin-text);font-weight:500">{{ row.studentName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="class" label="班级" />
        <el-table-column prop="subject" label="科目" />
        <el-table-column label="行为类型">
          <template #default="{ row }">
            <span class="admin-tag" :class="tagType(row.behavior)">{{ row.behavior }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="具体描述" show-overflow-tooltip />
        <el-table-column label="评分">
          <template #default="{ row }">
            <b :style="{color: scoreColor(row.score)}">{{ row.score }}</b>
          </template>
        </el-table-column>
        <el-table-column label="记录人">
          <template #default="{ row }">
            <span>{{ row.recorder || '张老师' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button size="small" text @click="openDialog(row)">编辑</el-button>
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
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑课堂表现' : '记录课堂表现'" width="500px">
      <div class="admin-form-group">
        <label>学生</label>
        <el-select v-model="form.studentId" style="width:100%" filterable @change="onStudentSelect">
          <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
        </el-select>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>科目</label>
          <el-select v-model="form.subject" style="width:100%">
            <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>行为类型</label>
          <el-select v-model="form.behavior" style="width:100%">
            <el-option v-for="b in behaviorTypes" :key="b" :label="b" :value="b" />
          </el-select>
        </div>
      </div>
      <div class="admin-form-group">
        <label>具体描述</label>
        <el-input v-model="form.note" type="textarea" :rows="3" placeholder="请描述具体行为..." />
      </div>
      <div class="admin-form-group">
        <label>评分</label>
        <el-select v-model="form.score" style="width:100%">
          <el-option v-for="s in scores" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">{{ editingId ? '保存修改' : '添加记录' }}</el-button>
      </template>
    </el-dialog>

    <!-- Stats -->
    <div class="admin-two-col" style="margin-top:16px">
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📊 行为类型分布</div>
        <div v-for="stat in typeStats" :key="stat.type" style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:12px;width:60px;color:var(--admin-text-secondary)">{{ stat.type }}</span>
          <div style="flex:1;height:6px;background:var(--admin-bg);border-radius:3px;overflow:hidden">
            <div :style="{width:stat.percent+'%',background:stat.color,height:'100%',borderRadius:'3px'}"></div>
          </div>
          <span style="font-size:11px;color:var(--admin-text-muted);width:40px;text-align:right">{{ stat.count }}</span>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">⭐ 本周课堂之星</div>
        <div v-for="(star, i) in topStudents" :key="star.name" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--admin-border)">
          <span style="font-size:16px;width:24px;text-align:center">{{ ['🥇','🥈','🥉'][i] }}</span>
          <span style="flex:1;font-size:13px;color:var(--admin-text)">{{ star.name }}</span>
          <span class="admin-tag success">{{ star.positive }}次表扬</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { behaviorService, studentService, courseService } from '@/services/dataService'

const records = ref([])
const studentList = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const filterClass = ref('')
const filterSubject = ref('')

const subjects = computed(() => courseService.getAllNames())
const behaviorTypes = ['积极发言','认真听讲','小组合作','走神','瞌睡','玩手机','迟到','扰乱秩序']
const scores = ['A+','A','B+','B','C','D']
const classList = computed(() => studentService.getClasses())

const form = ref({
  studentId: null, studentName: '', class: '', subject: '数学',
  behavior: '积极发言', note: '', score: 'B'
})

onMounted(() => {
  studentList.value = studentService.getAll()
  records.value = behaviorService.getAll()
})

const currentPage = ref(1)
const pageSize = ref(15)

const filteredRecords = computed(() => {
  const list = records.value.filter(r => {
    if (filterClass.value && r.class !== filterClass.value) return false
    if (filterSubject.value && r.subject !== filterSubject.value) return false
    return true
  })
  const start = (currentPage.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

const totalFiltered = computed(() => {
  return records.value.filter(r => {
    if (filterClass.value && r.class !== filterClass.value) return false
    if (filterSubject.value && r.subject !== filterSubject.value) return false
    return true
  }).length
})

function tagType(type) {
  const map = { '积极发言':'success','认真听讲':'success','小组合作':'success','走神':'warning','瞌睡':'warning','玩手机':'danger','迟到':'danger','扰乱秩序':'danger' }
  return map[type] || 'info'
}

function scoreColor(s) {
  if (s.startsWith('A')) return 'var(--admin-success)'
  if (s.startsWith('B')) return 'var(--admin-primary)'
  if (s === 'C') return 'var(--admin-warning)'
  return 'var(--admin-danger)'
}

function onStudentSelect() {
  const s = studentList.value.find(s => s.id === form.value.studentId)
  if (s) { form.value.studentName = s.name; form.value.class = s.class }
}

const typeStats = computed(() => [
  { type:'积极', count:records.value.filter(r=>r.type==='success').length, percent:50, color:'var(--admin-success)' },
  { type:'一般', count:1, percent:17, color:'var(--admin-primary)' },
  { type:'走神', count:1, percent:17, color:'var(--admin-warning)' },
  { type:'违纪', count:1, percent:17, color:'var(--admin-danger)' }
])

const topStudents = [{ name:'陈小明', positive:5 },{ name:'林志远', positive:4 },{ name:'张伟豪', positive:3 }]

function openDialog(r) {
  if (r) {
    editingId.value = r.id
    form.value = { ...r, studentId: r.studentId }
  } else {
    editingId.value = null
    form.value = { studentId: null, studentName: '', class: '', subject: '数学', behavior: '积极发言', note: '', score: 'B' }
  }
  dialogVisible.value = true
}

function saveRecord() {
  if (!form.value.studentId) { ElMessage.warning('请选择学生'); return }
  const data = {
    ...form.value,
    time: new Date().toLocaleString('zh-CN'),
    type: tagType(form.value.behavior),
    recorder: '张老师'
  }
  if (editingId.value) {
    behaviorService.update(editingId.value, data)
    ElMessage.success('已更新')
  } else {
    behaviorService.create(data)
    ElMessage.success('记录已添加')
  }
  dialogVisible.value = false
  records.value = behaviorService.getAll()
}

async function handleDelete(r) {
  try {
    await ElMessageBox.confirm('确定删除此记录吗？', '确认删除', { confirmButtonText:'删除', cancelButtonText:'取消', type:'warning' })
    behaviorService.delete(r.id)
    records.value = behaviorService.getAll()
    ElMessage.success('已删除')
  } catch {}
}
</script>
