<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📖 DSE 课程维护</div>
          <div class="admin-card-subtitle">管理核心科目与选修科目，控制课程启用/禁用</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-select v-model="filterCategory" size="small" placeholder="分类" style="width:110px" clearable>
            <el-option label="核心科目" value="core" />
            <el-option label="选修科目" value="elective" />
          </el-select>
          <el-button size="small" type="primary" @click="openDialog(null)">+ 添加课程</el-button>
        </div>
      </div>

      <el-table :data="filteredCourses" stripe size="small" style="width:100%" :row-class-name="({ row }) => { const cls = []; if (!row.enabled) cls.push('row-disabled'); if (row.parentId) cls.push('row-child'); return cls.join(' '); }">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="课程名称" fixed>
          <template #default="{ row }">
            <span v-if="row.parentId" style="margin-left:20px;color:var(--admin-text-muted)">└ </span>
            <span style="color:var(--admin-text);font-weight:500">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <span class="admin-tag" :class="row.category === 'core' ? 'primary' : 'info'">{{ row.category === 'core' ? '核心科目' : '选修科目' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="课程编号" width="120">
          <template #default="{ row }">
            <span style="font-family:monospace;font-size:11px;color:var(--admin-text-muted)">{{ row.id_code || row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column label="父课程" width="100">
          <template #default="{ row }">
            <span style="font-size:11px;color:var(--admin-text-muted)">{{ row.parentName || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" size="small" @change="toggleCourse(row)" />
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
        <span style="font-size:11px;color:var(--admin-text-muted)">共 {{ allFilteredCourses.length }} 门课程 · 已启用 {{ enabledCount }} 门</span>
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,15,20,50]" :total="allFilteredCourses.length" layout="total, sizes, prev, pager, next, jumper" size="small" background />
      </div>
    </div>

    <div class="admin-two-col" style="margin-top:16px">
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📊 核心科目（必修）</div>
        <div v-for="c in coreCourses" :key="c.id" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--admin-border)">
          <span :style="{color: c.enabled ? 'var(--admin-text)' : 'var(--admin-text-muted)', fontSize:'13px', flex:1}">{{ c.name }}</span>
          <span class="admin-tag" :class="c.enabled ? 'success' : 'danger'">{{ c.enabled ? '已启用' : '已禁用' }}</span>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📊 选修科目</div>
        <div v-for="c in electiveCourses" :key="c.id" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--admin-border)">
          <span :style="{color: c.enabled ? 'var(--admin-text)' : 'var(--admin-text-muted)', fontSize:'13px', flex:1}">{{ c.name }}</span>
          <span class="admin-tag" :class="c.enabled ? 'success' : 'danger'">{{ c.enabled ? '已启用' : '已禁用' }}</span>
        </div>
      </div>
    </div>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑课程' : '添加课程'" width="460px">
      <div class="admin-form-group">
        <label>课程名称 <span style="color:var(--admin-danger)">*</span></label>
        <el-input v-model="form.name" placeholder="如：物理" />
      </div>
      <div class="admin-form-group">
        <label>课程编号</label>
        <el-input v-model="form.id_code" placeholder="如：phy（小写字母开头，2-10位字母数字下划线）" />
        <div v-if="form.id_code && !idCodeValid" style="font-size:10px;color:var(--admin-danger);margin-top:4px">
          格式要求：小写字母开头，2-10位，仅字母数字下划线
        </div>
      </div>
      <div class="admin-form-group">
        <label>分类 <span style="color:var(--admin-danger)">*</span></label>
        <el-select v-model="form.category" style="width:100%">
          <el-option label="核心科目" value="core" />
          <el-option label="选修科目" value="elective" />
        </el-select>
      </div>
      <div class="admin-form-group" v-if="!editingId || form.parentId === 'eng' || isEnglishChild">
        <label>父课程（可选）</label>
        <el-select v-model="form.parentId" style="width:100%" clearable placeholder="选择父课程（用于创建子树）">
          <el-option v-for="p in parentCourseOptions" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <div style="font-size:10px;color:var(--admin-text-muted);margin-top:4px">
          如"英国语文"下设 Reading / Writing / Listening / Speaking 子课程
        </div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCourse">{{ editingId ? '保存修改' : '添加课程' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { courseService } from '@/services/dataService'

const courses = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const filterCategory = ref('')
const form = ref({ name: '', id_code: '', category: 'elective', parentId: null })

onMounted(() => { courses.value = courseService.getAll() })

const idCodeValid = computed(() => {
  if (!form.value.id_code) return true
  return /^[a-z][a-z0-9_]{1,9}$/.test(form.value.id_code)
})

const isEnglishChild = computed(() => {
  if (!editingId.value) return false
  const course = courses.value.find(c => c.id === editingId.value)
  return course && course.parentId === 'eng'
})

const parentCourseOptions = computed(() => {
  return courses.value.filter(c => !c.parentId && c.id !== editingId.value)
})

const currentPage = ref(1)
const pageSize = ref(15)

const allFilteredCourses = computed(() => {
  let list = courses.value
  if (filterCategory.value) list = list.filter(c => c.category === filterCategory.value)
  return list.map(c => ({
    ...c,
    parentName: c.parentId ? (courses.value.find(p => String(p.id) === String(c.parentId))?.name || '') : ''
  }))
})

const filteredCourses = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return allFilteredCourses.value.slice(start, start + pageSize.value)
})

const coreCourses = computed(() => courses.value.filter(c => c.category === 'core' && !c.parentId))
const electiveCourses = computed(() => courses.value.filter(c => c.category === 'elective' && !c.parentId))
const enabledCount = computed(() => courses.value.filter(c => c.enabled).length)

function openDialog(course) {
  if (course) {
    editingId.value = course.id
    form.value = { name: course.name, id_code: course.id_code || '', category: course.category, parentId: course.parentId || null }
  } else {
    editingId.value = null
    form.value = { name: '', id_code: '', category: 'elective', parentId: null }
  }
  dialogVisible.value = true
}

function saveCourse() {
  if (!form.value.name) { ElMessage.warning('请输入课程名称'); return }
  if (form.value.id_code && !idCodeValid.value) { ElMessage.warning('课程编号格式不正确：小写字母开头，2-10位字母数字下划线'); return }
  if (editingId.value) {
    courseService.update(editingId.value, { ...form.value })
    ElMessage.success('课程已更新')
  } else {
    courseService.create({ ...form.value, enabled: true })
    ElMessage.success('课程已添加')
  }
  dialogVisible.value = false
  courses.value = courseService.getAll()
}

function toggleCourse(course) {
  courseService.update(course.id, { enabled: course.enabled })
  const status = course.enabled ? '已启用' : '已禁用'
  ElMessage.success(`「${course.name}」${status}`)
}

async function handleDelete(course) {
  const { ElMessageBox } = await import('element-plus')
  try {
    await ElMessageBox.confirm(`确定删除课程「${course.name}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    courseService.delete(course.id)
    courses.value = courseService.getAll()
    ElMessage.success('课程已删除')
  } catch {}
}
</script>

<style scoped>
.row-disabled td { opacity: 0.5; }
.row-disabled td:first-child { opacity: 0.3; }
</style>
