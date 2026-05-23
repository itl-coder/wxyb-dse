<template>
  <div class="um-page">
    <div class="um-hd">
      <h3>用户管理</h3>
      <button class="um-btn-add" @click="openDialog()">+ 新增用户</button>
    </div>

    <!-- Users Table -->
    <div class="um-table-wrap">
      <table class="um-table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>显示名称</th>
            <th>角色</th>
            <th>校区</th>
            <th>班级</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>
              <div class="um-user-cell">
                <div class="um-avatar">{{ u.displayName.charAt(0) }}</div>
                <span>{{ u.username }}</span>
              </div>
            </td>
            <td>{{ u.displayName }}</td>
            <td>
              <span class="um-role-badge" :style="{ background: roleColor(getRoleName(u.roleId)) }">
                {{ getRoleName(u.roleId) }}
              </span>
            </td>
            <td>{{ u.campus || '-' }}</td>
            <td>{{ u.class || '-' }}</td>
            <td>
              <span class="um-status" :class="{ off: !u.active }">
                <span class="um-status-dot"></span>
                {{ u.active ? '启用' : '停用' }}
              </span>
            </td>
            <td>{{ u.createdAt }}</td>
            <td>
              <div class="um-actions">
                <button class="um-btn-edit" @click="openDialog(u)">编辑</button>
                <button class="um-btn-del" @click="deleteUser(u)">删除</button>
              </div>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="8" style="text-align:center;color:var(--admin-text-muted);padding:32px">暂无用户</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog -->
    <Teleport to="body">
      <div class="um-overlay" v-if="dialogOpen" @click.self="dialogOpen = false">
        <div class="um-dialog">
          <h4>{{ isEdit ? '编辑用户' : '新增用户' }}</h4>
          <div class="um-field">
            <label>用户名</label>
            <input v-model="form.username" class="um-input" placeholder="登录账号" :disabled="isEdit" />
          </div>
          <div class="um-field">
            <label>{{ isEdit ? '新密码（留空不修改）' : '密码' }}</label>
            <input v-model="form.password" class="um-input" type="password" placeholder="输入密码" />
          </div>
          <div class="um-field">
            <label>显示名称</label>
            <input v-model="form.displayName" class="um-input" placeholder="如：张老师" />
          </div>
          <div class="um-field">
            <label>角色</label>
            <select v-model="form.roleId" class="um-input">
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="um-row">
            <div class="um-field">
              <label>校区</label>
              <select v-model="form.campus" class="um-input" @change="onCampusChange($event.target.value)">
                <option value="">-- 选择校区 --</option>
                <option v-for="c in campusOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="um-field">
              <label>班级</label>
              <select v-model="form.class" class="um-input" :disabled="!form.campus">
                <option value="">-- 选择班级 --</option>
                <option v-for="c in classOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
          </div>
          <div class="um-field">
            <label class="um-check-label">
              <input type="checkbox" v-model="form.active" />
              <span>启用账号</span>
            </label>
          </div>
          <div class="um-dialog-actions">
            <button class="um-btn-cancel" @click="dialogOpen = false">取消</button>
            <button class="um-btn-save" @click="saveUser">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * 页面：用户管理
 * 功能：系统用户的增删改查，支持按角色、校区、班级分配权限
 * 路由：/admin/users
 */
import { ref, reactive, onMounted } from 'vue'
import { userService, roleService, studentService, classroomService } from '@/services/dataService'
import { ElMessage, ElMessageBox } from 'element-plus'

const users = ref([])
const roles = ref([])
const dialogOpen = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const form = reactive({ username: '', password: '', displayName: '', roleId: 2, campus: '', class: '', active: true })

const campusOptions = ref([])
const classOptions = ref([])

function loadUsers() { users.value = userService.getAll() }
function loadRoles() { roles.value = roleService.getAll() }
function loadCampuses() {
  const campuses = new Set()
  studentService.getAll().forEach(s => { if (s.campus) campuses.add(s.campus) })
  campusOptions.value = [...campuses].sort()
}
function loadClasses(campus) {
  if (!campus) { classOptions.value = []; return }
  classOptions.value = classroomService.getByCampus(campus).map(c => c.name)
}
function onCampusChange(campus) {
  form.campus = campus
  form.class = ''
  loadClasses(campus)
}

function getRoleName(roleId) {
  return roles.value.find(r => r.id === roleId)?.name || '未知'
}

function roleColor(name) {
  const map = {
    '超级管理员': 'rgba(99,102,241,0.15)',
    '班主任/教师': 'rgba(52,211,153,0.15)',
    '教务主任': 'rgba(251,191,36,0.15)'
  }
  return map[name] || 'rgba(148,163,184,0.12)'
}

function openDialog(user) {
  if (user) {
    isEdit.value = true
    editingId.value = user.id
    form.username = user.username
    form.password = ''
    form.displayName = user.displayName
    form.roleId = user.roleId
    form.campus = user.campus || ''
    form.class = user.class || ''
    form.active = user.active
    loadClasses(user.campus)
  } else {
    isEdit.value = false
    editingId.value = null
    form.username = ''
    form.password = ''
    form.displayName = ''
    form.roleId = roles.value[0]?.id || 2
    form.campus = ''
    form.class = ''
    form.active = true
    classOptions.value = []
  }
  dialogOpen.value = true
}

function saveUser() {
  if (!form.username.trim()) { ElMessage.warning('请输入用户名'); return }
  if (!isEdit.value && !form.password) { ElMessage.warning('请输入密码'); return }
  if (!form.displayName.trim()) { ElMessage.warning('请输入显示名称'); return }
  if (!form.roleId) { ElMessage.warning('请选择角色'); return }

  const data = {
    username: form.username.trim(),
    displayName: form.displayName.trim(),
    roleId: form.roleId,
    campus: form.campus.trim(),
    class: form.class.trim(),
    active: form.active
  }

  if (isEdit.value) {
    if (form.password) data.password = form.password
    userService.update(editingId.value, data)
    ElMessage.success('用户已更新')
  } else {
    if (userService.getByUsername(data.username)) {
      ElMessage.warning('用户名已存在')
      return
    }
    data.password = form.password
    data.createdAt = new Date().toISOString().slice(0, 10)
    userService.create(data)
    ElMessage.success('用户已创建')
  }
  dialogOpen.value = false
  loadUsers()
}

async function deleteUser(user) {
  try {
    await ElMessageBox.confirm(`确定删除用户「${user.displayName}」？`, '删除确认', { type: 'warning' })
  } catch { return }
  userService.delete(user.id)
  ElMessage.success('用户已删除')
  loadUsers()
}

onMounted(() => { loadUsers(); loadRoles(); loadCampuses() })
</script>

<style scoped>
.um-page { padding: 4px 0; }
.um-hd {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.um-hd h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--admin-text); }
.um-btn-add {
  padding: 6px 16px; border-radius: 8px;
  border: 1px solid var(--admin-accent);
  background: var(--admin-accent); color: #fff;
  font-size: 13px; font-family: inherit; cursor: pointer; transition: all .2s;
}
.um-btn-add:hover { background: var(--admin-accent-dark); }

/* Table */
.um-table-wrap { overflow-x: auto; }
.um-table {
  width: 100%; border-collapse: collapse;
  background: var(--admin-surface);
  border-radius: 12px; overflow: hidden;
  border: 1px solid var(--admin-border);
}
.um-table th {
  text-align: left; padding: 10px 14px;
  font-size: 11px; font-weight: 600; color: var(--admin-text-secondary);
  background: var(--admin-bg-secondary);
  border-bottom: 1px solid var(--admin-border);
}
.um-table td {
  padding: 10px 14px; font-size: 13px; color: var(--admin-text);
  border-bottom: 1px solid var(--admin-border);
}
.um-table tr:last-child td { border-bottom: none; }
.um-table tr:hover td { background: var(--admin-bg-secondary); }

.um-user-cell { display: flex; align-items: center; gap: 8px; }
.um-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--admin-accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
}
.um-role-badge {
  display: inline-block; padding: 2px 10px; border-radius: 12px;
  font-size: 11px; font-weight: 500; color: var(--admin-text);
}
.um-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--admin-success); }
.um-status.off { color: var(--admin-text-muted); }
.um-status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--admin-success);
}
.um-status.off .um-status-dot { background: var(--admin-text-muted); }

.um-actions { display: flex; gap: 8px; }
.um-btn-edit, .um-btn-del {
  padding: 3px 10px; border-radius: 6px; font-size: 11px; font-family: inherit;
  border: 1px solid var(--admin-border); background: transparent; cursor: pointer; transition: all .15s;
}
.um-btn-edit { color: var(--admin-accent); }
.um-btn-edit:hover { background: rgba(99,102,241,0.1); }
.um-btn-del { color: var(--admin-danger); }
.um-btn-del:hover { background: rgba(248,113,113,0.1); }

/* Dialog */
.um-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.um-dialog {
  width: 440px; max-height: 80vh; overflow-y: auto;
  padding: 24px; border-radius: 16px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.um-dialog h4 { margin: 0 0 20px; font-size: 15px; font-weight: 600; color: var(--admin-text); }
.um-field { margin-bottom: 14px; flex: 1; }
.um-field label { display: block; font-size: 12px; font-weight: 600; color: var(--admin-text-secondary); margin-bottom: 4px; }
.um-input {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--admin-border);
  background: var(--admin-bg);
  color: var(--admin-text);
  font-size: 13px; font-family: inherit; outline: none;
  box-sizing: border-box; transition: border-color .2s;
}
.um-input:focus { border-color: var(--admin-accent); }
.um-row { display: flex; gap: 12px; }
.um-check-label {
  display: flex !important; align-items: center; gap: 8px;
  font-size: 13px !important; font-weight: 400 !important; color: var(--admin-text) !important;
  cursor: pointer;
}
.um-check-label input { accent-color: var(--admin-accent); }
.um-dialog-actions {
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px;
}
.um-btn-cancel, .um-btn-save {
  padding: 8px 20px; border-radius: 8px; font-size: 13px; font-family: inherit; cursor: pointer;
}
.um-btn-cancel {
  border: 1px solid var(--admin-border); background: var(--admin-bg); color: var(--admin-text-secondary);
}
.um-btn-save {
  border: none; background: var(--admin-accent); color: #fff;
}
.um-btn-save:hover { background: var(--admin-accent-dark); }
</style>
