<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div class="admin-card-title">用户管理</div>
        <el-button type="primary" size="small" @click="openDialog()">+ 新增用户</el-button>
      </div>
      <el-table :data="users" size="small" style="width:100%">
        <el-table-column label="用户名" min-width="120">
          <template #default="{ row }"><span style="font-weight:600">{{ row.username }}</span></template>
        </el-table-column>
        <el-table-column prop="displayName" label="显示名称" width="120" />
        <el-table-column label="角色" width="140">
          <template #default="{ row }"><el-tag size="small" type="primary">{{ getRoleName(row.roleId) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="campus" label="校区" width="120" />
        <el-table-column prop="class" label="班级" width="80" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }"><el-tag size="small" :type="row.active ? 'success' : 'danger'">{{ row.active ? '启用' : '停用' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="110" />
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:12px;font-size:11px;color:var(--admin-text-muted)">共 {{ users.length }} 个用户</div>
    </div>

    <el-dialog v-model="dialogOpen" :title="isEdit ? '编辑用户' : '新增用户'" width="480px" append-to-body @close="dialogOpen=false">
      <div class="admin-form-group"><label>用户名 <span style="color:#ef4444">*</span></label><el-input v-model="form.username" size="small" placeholder="登录账号" :disabled="isEdit" /></div>
      <div class="admin-form-group"><label>{{ isEdit ? '新密码（留空不修改）' : '密码' }} <span v-if="!isEdit" style="color:#ef4444">*</span></label><el-input v-model="form.password" size="small" type="password" placeholder="输入密码" show-password /></div>
      <div class="admin-form-group"><label>显示名称 <span style="color:#ef4444">*</span></label><el-input v-model="form.displayName" size="small" placeholder="如：张老师" /></div>
      <div class="admin-form-group"><label>角色</label><el-select v-model="form.roleId" size="small" style="width:100%"><el-option v-for="r in roles" :key="r.roleId" :label="r.roleName" :value="r.roleId" /></el-select></div>
      <div class="admin-two-col">
        <div class="admin-form-group"><label>校区</label><el-select v-model="form.campus" size="small" style="width:100%" clearable @change="onCampusChange"><el-option v-for="c in campusOptions" :key="c" :label="c" :value="c" /></el-select></div>
        <div class="admin-form-group"><label>班级</label><el-select v-model="form.class" size="small" style="width:100%" :disabled="!form.campus" clearable><el-option v-for="c in classOptions" :key="c" :label="c" :value="c" /></el-select></div>
      </div>
      <div class="admin-form-group"><el-checkbox v-model="form.active">启用账号</el-checkbox></div>
      <template #footer><el-button @click="dialogOpen=false">取消</el-button><el-button type="primary" @click="saveUser" :loading="saving">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserListHandler, createUserHandler, updateUserHandler, deleteUserHandler } from '@/api/user'
import { getRoleListHandler } from '@/api/role'
import { dseApi } from '@/api/dse'

const studentApi = dseApi('students')
const users = ref([]), roles = ref([]), dialogOpen = ref(false), isEdit = ref(false), saving = ref(false)
const editingId = ref(null), campusOptions = ref([]), classOptions = ref([])
const form = reactive({ username: '', password: '', displayName: '', roleId: null, campus: '', class: '', active: true })

async function loadAll() {
  try {
    const [u, r, s] = await Promise.all([getUserListHandler(), getRoleListHandler(), studentApi.getAll()])
    users.value = (u.data || []).map(x => ({ id: x.userId, username: x.userName, displayName: x.nickName || x.userName, roleId: x.roleIds?.[0] || (r.data||[])[0]?.roleId, campus: x.campusName || '', class: x.className || '', active: x.status === '0', createdAt: x.createTime || '' }))
    roles.value = r.data || []
    const campuses = new Set(); (s.data || []).forEach(st => { if (st.campusName) campuses.add(st.campusName) }); campusOptions.value = [...campuses].sort()
  } catch { ElMessage.error('加载失败') }
}

function getRoleName(rid) { return roles.value.find(r => r.roleId === rid)?.roleName || '—' }
function onCampusChange(val) { form.campus = val || ''; form.class = ''; classOptions.value = val ? (users.value.filter(u => u.campus === val).map(u => u.class).filter(Boolean)) : [] }

function openDialog(user) {
  if (user) { isEdit.value = true; editingId.value = user.id; Object.assign(form, { username: user.username, password: '', displayName: user.displayName, roleId: user.roleId, campus: user.campus || '', class: user.class || '', active: user.active }) }
  else { isEdit.value = false; editingId.value = null; Object.assign(form, { username: '', password: '', displayName: '', roleId: roles.value[0]?.roleId || null, campus: '', class: '', active: true }) }
  dialogOpen.value = true
}

async function saveUser() {
  if (!form.username || (!isEdit.value && !form.password) || !form.displayName) return ElMessage.warning('请填写必填项')
  saving.value = true
  const data = { userName: form.username, nickName: form.displayName, password: form.password, status: form.active ? '0' : '1' }
  if (isEdit.value && !data.password) delete data.password
  try { if (isEdit.value) { await updateUserHandler(editingId.value, data); ElMessage.success('已更新') } else { await createUserHandler(data); ElMessage.success('已创建') }; dialogOpen.value = false; await loadAll() }
  catch { ElMessage.error('保存失败') }
  saving.value = false
}

async function handleDelete(user) {
  try { await ElMessageBox.confirm('删除「' + user.username + '」？', '确认', { type: 'warning' }); await deleteUserHandler(user.id); ElMessage.success('已删除'); await loadAll() } catch {}
}

onMounted(loadAll)
</script>
