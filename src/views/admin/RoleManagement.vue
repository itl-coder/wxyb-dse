<template>
  <div class="rm-page">
    <!-- Top: Role Basic Info -->
    <div class="rm-top" v-if="editing">
      <div class="rm-top-row">
        <div class="rm-top-field">
          <label>角色名称</label>
          <input v-model="editing.name" class="rm-input" placeholder="输入角色名称" />
        </div>
        <div class="rm-top-field" style="flex:1">
          <label>角色编码</label>
          <input v-model="editing.code" class="rm-input" placeholder="自动生成或手动输入" />
        </div>
        <div class="rm-top-field">
          <label>状态</label>
          <el-switch v-model="editing.active" active-text="启用" inactive-text="禁用" size="small" />
        </div>
        <div class="rm-top-meta" v-if="editing.id">
          <span>创建：{{ editing.createdAt || '-' }}</span>
          <span>更新：{{ editing.updatedAt || editing.createdAt || '-' }}</span>
        </div>
      </div>
      <div class="rm-top-row">
        <div class="rm-top-field" style="flex:1">
          <label>描述说明</label>
          <input v-model="editing.description" class="rm-input" placeholder="输入角色描述" />
        </div>
      </div>
    </div>

    <!-- Three-column split -->
    <div class="rm-split">
      <!-- Left: Role List -->
      <aside class="rm-left">
        <div class="rm-left-hd">
          <h3>角色列表</h3>
          <button class="rm-btn-add" @click="addRole">+ 新建角色</button>
        </div>
        <div class="rm-left-search">
          <input v-model="roleSearch" class="rm-input" placeholder="搜索角色名称..." />
        </div>
        <div class="rm-left-filters">
          <button
            v-for="f in roleFilters"
            :key="f.key"
            class="rm-filter-btn"
            :class="{ active: roleFilter === f.key }"
            @click="roleFilter = f.key"
          >{{ f.label }}</button>
        </div>
        <div class="rm-card-list">
          <div
            v-for="role in filteredRoles"
            :key="role.id"
            class="rm-role-card"
            :class="{ active: selectedId === role.id }"
            @click="selectRole(role)"
          >
            <div class="rm-card-accent"></div>
            <div class="rm-card-body">
              <div class="rm-card-name-row">
                <span class="rm-card-name">
                  {{ role.name }}
                  <span v-if="role.isSystem" class="rm-sys-badge" title="系统内置角色">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 8v10c0 7.18 5.12 13.88 12 15.46 6.88-1.58 12-8.28 12-15.46V8L12 2z"/></svg>
                  </span>
                </span>
                <span v-if="!role.active" class="rm-inactive-tag">已禁用</span>
              </div>
              <div class="rm-card-desc">{{ role.description }}</div>
              <div class="rm-card-meta">
                <span>{{ getUserCount(role.id) }} 用户</span>
                <span class="rm-scope-dot">{{ scopeLabel(role.dataScope) }}</span>
              </div>
            </div>
            <el-dropdown trigger="click" @command="(cmd) => handleRoleAction(cmd, role)">
              <button class="rm-card-menu" @click.stop>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="duplicate">📋 复制角色</el-dropdown-item>
                  <el-dropdown-item v-if="!role.isSystem" command="delete" divided>🗑️ 删除角色</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </aside>

      <!-- Center: Permission Config -->
      <main class="rm-center" v-if="editing">
        <div class="rm-center-hd">
          <span class="rm-center-title">权限配置</span>
          <div class="rm-center-actions">
            <button class="rm-link-btn" @click="expandAllPerms">{{ allExpanded ? '收起全部' : '展开全部' }}</button>
            <button class="rm-link-btn" @click="toggleAllPerms">{{ allPermsOn ? '取消全选' : '全选所有' }}</button>
          </div>
        </div>

        <!-- Menu permissions tree -->
        <div class="rm-perm-section">
          <div class="rm-perm-section-title">菜单权限</div>
          <el-tree
            ref="permTreeRef"
            :data="permTreeData"
            show-checkbox
            node-key="key"
            :default-checked-keys="editing.permissions"
            :default-expanded-keys="defaultExpandedKeys"
            :props="{ label: 'label', children: 'children', disabled: 'disabled' }"
            @check="onPermCheck"
            class="rm-perm-tree"
          >
            <template #default="{ node, data }">
              <span class="rm-tree-node">
                <span class="rm-tree-icon">{{ data.icon || '' }}</span>
                <span class="rm-tree-label">{{ data.label }}</span>
                <el-tag v-if="data.isGroup" size="small" type="info" class="rm-tree-tag">{{ data.children?.length || 0 }}项</el-tag>
              </span>
            </template>
          </el-tree>
        </div>

        <!-- Button/Action permissions -->
        <div class="rm-perm-section">
          <div class="rm-perm-section-title">按钮/操作权限</div>
          <div class="rm-perm-cats">
            <div v-for="cat in permCategories" :key="cat.key" class="rm-perm-cat">
              <div class="rm-perm-cat-hd" @click="cat.collapsed = !cat.collapsed">
                <span>{{ cat.collapsed ? '▶' : '▼' }} {{ cat.label }}</span>
                <button class="rm-cat-toggle" @click.stop="toggleCategory(cat.key)">
                  {{ categoryAllOn(cat.key) ? '取消' : '全选' }}
                </button>
              </div>
              <div v-show="!cat.collapsed" class="rm-perm-grid">
                <label
                  v-for="p in cat.perms"
                  :key="p.key"
                  class="rm-perm-pill"
                  :class="{ on: editing.permissions.includes(p.key) }"
                >
                  <input type="checkbox" :value="p.key" v-model="editing.permissions" />
                  <span>{{ p.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Right: Data Scope Config -->
      <aside class="rm-right" v-if="editing">
        <div class="rm-right-hd">
          <span class="rm-right-title">数据范围配置</span>
        </div>
        <div class="rm-scope-grid">
          <div
            v-for="s in DATA_SCOPES"
            :key="s.value"
            class="rm-scope-card"
            :class="{ on: editing.dataScope === s.value }"
            @click="editing.dataScope = s.value"
          >
            <div class="rm-scope-icon">{{ s.icon }}</div>
            <div class="rm-scope-label">{{ s.label }}</div>
            <div class="rm-scope-desc">{{ s.desc }}</div>
            <div v-if="editing.dataScope === s.value" class="rm-scope-check">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
        </div>

        <!-- Usage info -->
        <div class="rm-right-info">
          <div class="rm-right-info-title">角色说明</div>
          <div class="rm-right-info-content">
            <p v-if="editing.dataScope === 'all'">⚠️ 此角色可查看<b>所有校区、所有班级</b>的数据。请谨慎分配给非管理员用户。</p>
            <p v-else-if="editing.dataScope === 'campus'">此角色可查看<b>所属校区</b>的全部数据。适用于校区级别的管理者。</p>
            <p v-else-if="editing.dataScope === 'class'">此角色仅可查看<b>所管理班级</b>的数据。适用于班主任和科任教师。</p>
            <p v-else>此角色仅可查看<b>自己创建或负责</b>的数据。适用于心理咨询师等需要数据隔离的角色。</p>
          </div>
        </div>
      </aside>

      <!-- Empty center state -->
      <main class="rm-center rm-empty" v-else>
        <span style="font-size:48px;opacity:0.3">🛡️</span>
        <p>选择一个角色或新建角色以编辑权限</p>
      </main>
    </div>

    <!-- Bottom Actions -->
    <div class="rm-bottom" v-if="editing">
      <button class="rm-btn-cancel" @click="cancelEdit">取消</button>
      <button class="rm-btn-save" @click="saveRole">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        保存角色
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { roleService, userService, PERMISSIONS, MENU_DEFINITIONS, DATA_SCOPES, MENU_GROUP_ORDER } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useAppStore()

// ==================== Role List ====================
const roles = ref([])
const selectedId = ref(null)
const roleSearch = ref('')
const roleFilter = ref('all')
const roleFilters = [
  { key: 'all', label: '全部' },
  { key: 'system', label: '系统角色' },
  { key: 'custom', label: '自定义' }
]

const filteredRoles = computed(() => {
  let list = roles.value
  if (roleFilter.value === 'system') list = list.filter(r => r.isSystem)
  else if (roleFilter.value === 'custom') list = list.filter(r => !r.isSystem)
  if (roleSearch.value.trim()) {
    const q = roleSearch.value.trim().toLowerCase()
    list = list.filter(r => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q))
  }
  return list
})

function scopeLabel(scope) {
  const map = { all: '全部数据', campus: '校区', class: '班级', self: '仅自己' }
  return map[scope] || scope
}

function getUserCount(roleId) {
  return roleService.getUserCount(roleId)
}

function loadRoles() {
  roles.value = roleService.getAll()
}

// ==================== Editor State ====================
const emptyRole = () => ({
  id: null, name: '', code: '', description: '', permissions: [], menuIds: [], dataScope: 'class',
  isSystem: false, active: true
})
const editing = ref(null)

function selectRole(role) {
  selectedId.value = role.id
  editing.value = {
    ...role,
    permissions: [...(role.permissions || [])],
    menuIds: [...(role.menuIds || [])],
    code: role.code || '',
    active: role.active !== false,
    updatedAt: new Date().toISOString().slice(0, 10)
  }
}

function addRole() {
  selectedId.value = null
  editing.value = emptyRole()
}

function cancelEdit() {
  editing.value = null
  selectedId.value = null
}

function handleRoleAction(cmd, role) {
  if (cmd === 'duplicate') {
    const copy = { ...role, id: null, name: role.name + ' (副本)', isSystem: false }
    const created = roleService.create({
      name: copy.name,
      description: copy.description,
      permissions: [...copy.permissions],
      menuIds: [...copy.menuIds],
      dataScope: copy.dataScope,
      isSystem: false,
      active: true,
      createdAt: new Date().toISOString().slice(0, 10)
    })
    ElMessage.success('角色已复制')
    loadRoles()
    selectedId.value = created.id
    editing.value = { ...created, permissions: [...created.permissions], menuIds: [...(created.menuIds || [])] }
  } else if (cmd === 'delete') {
    deleteRole(role)
  }
}

async function deleteRole(role) {
  try {
    await ElMessageBox.confirm(`确定删除角色「${role.name}」？`, '删除确认', { type: 'warning' })
  } catch { return }
  const result = roleService.delete(role.id)
  if (result?.error) { ElMessage.warning(result.error); return }
  ElMessage.success('角色已删除')
  if (selectedId.value === role.id) { selectedId.value = null; editing.value = null }
  loadRoles()
}

// ==================== Permission Tree ====================
const permTreeRef = ref(null)
const allExpanded = ref(false)

// Build tree: Group → Menu Items → Menu Leaf
const permTreeData = computed(() => {
  return MENU_GROUP_ORDER.map(groupName => {
    const groupMenus = MENU_DEFINITIONS.filter(m => m.group === groupName)
    if (!groupMenus.length) return null
    return {
      key: 'group:' + groupName,
      label: groupName,
      icon: '📁',
      isGroup: true,
      disabled: true,
      children: groupMenus.map(menu => ({
        key: menu.menuKey,
        label: menu.label,
        icon: menu.icon,
        isGroup: false,
        children: []
      }))
    }
  }).filter(Boolean)
})

const defaultExpandedKeys = computed(() => {
  return permTreeData.value.map(g => g.key)
})

function expandAllPerms() {
  allExpanded.value = !allExpanded.value
  const tree = permTreeRef.value
  if (!tree) return
  // Expand/collapse all tree nodes
  const keys = permTreeData.value.map(g => g.key)
  if (allExpanded.value) {
    keys.forEach(k => { tree.store.nodesMap[k]?.expand() })
  } else {
    keys.forEach(k => { tree.store.nodesMap[k]?.collapse() })
  }
}

function onPermCheck(node, checkState) {
  if (!editing.value) return
  // With parent-child linkage, checkedKeys includes both parents and leaf nodes
  const allCheckedKeys = checkState.checkedKeys
  // Get only leaf menu keys (exclude group keys)
  const menuKeys = allCheckedKeys.filter(k => !k.startsWith('group:'))
  // Keep action/button permissions that aren't menu keys
  const actionPerms = editing.value.permissions.filter(p =>
    !MENU_DEFINITIONS.some(m => m.menuKey === p) && !p.startsWith('group:')
  )
  editing.value.permissions = [...new Set([...menuKeys, ...actionPerms])]
  // Also sync menuIds from menu permissions
  editing.value.menuIds = [...menuKeys]
}

// ==================== Button/Action Permissions ====================
const permCategories = ref(
  Object.entries(
    (() => {
      const cats = {}
      PERMISSIONS.forEach(p => {
        if (!cats[p.category]) cats[p.category] = { key: p.category, label: p.categoryLabel, perms: [], collapsed: false }
        cats[p.category].perms.push(p)
      })
      return cats
    })()
  ).map(([, v]) => v)
)

const allPermsOn = computed(() => {
  if (!editing.value) return false
  return PERMISSIONS.every(p => editing.value.permissions.includes(p.key))
})

function toggleAllPerms() {
  if (!editing.value) return
  const tree = permTreeRef.value
  if (!tree) return
  if (allPermsOn.value) {
    // Uncheck all — clear both menu and action permissions
    tree.setCheckedKeys([])
    editing.value.permissions = []
    editing.value.menuIds = []
  } else {
    // Check all menu keys
    const allMenuKeys = MENU_DEFINITIONS.map(m => m.menuKey)
    tree.setCheckedKeys(allMenuKeys)
    // Also select all action permissions
    const actionKeys = PERMISSIONS.map(p => p.key)
    editing.value.permissions = [...allMenuKeys, ...actionKeys]
    editing.value.menuIds = [...allMenuKeys]
  }
}

function categoryAllOn(catKey) {
  if (!editing.value) return false
  const catPerms = PERMISSIONS.filter(p => p.category === catKey)
  return catPerms.every(p => editing.value.permissions.includes(p.key))
}

function toggleCategory(catKey) {
  if (!editing.value) return
  const catPerms = PERMISSIONS.filter(p => p.category === catKey).map(p => p.key)
  if (categoryAllOn(catKey)) {
    editing.value.permissions = editing.value.permissions.filter(k => !catPerms.includes(k))
  } else {
    catPerms.forEach(k => { if (!editing.value.permissions.includes(k)) editing.value.permissions.push(k) })
  }
}

// ==================== Save ====================
function saveRole() {
  if (!editing.value.name.trim()) { ElMessage.warning('请输入角色名称'); return }
  const data = {
    name: editing.value.name.trim(),
    code: editing.value.code.trim() || editing.value.name.trim(),
    description: editing.value.description.trim(),
    permissions: [...editing.value.permissions],
    menuIds: [...editing.value.menuIds],
    dataScope: editing.value.dataScope,
    active: editing.value.active,
    updatedAt: new Date().toISOString().slice(0, 10)
  }
  if (editing.value.id) {
    roleService.update(editing.value.id, data)
    ElMessage.success('角色已更新')
    // Refresh permissions if editing current user's role
    if (store.currentUser && store.currentUser.roleId === editing.value.id) {
      store.refreshPermissions()
    }
  } else {
    data.createdAt = new Date().toISOString().slice(0, 10)
    const created = roleService.create(data)
    selectedId.value = created.id
    editing.value.id = created.id
    editing.value.createdAt = data.createdAt
    ElMessage.success('角色已创建')
  }
  loadRoles()
}

// ==================== Init ====================
onMounted(loadRoles)
</script>

<style scoped>
.rm-page { height: 100%; display: flex; flex-direction: column; gap: 0; }
.rm-split { display: flex; gap: 0; flex: 1; overflow: hidden; min-height: 0; }

/* ==================== Top Bar ==================== */
.rm-top {
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 14px 20px;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.rm-top-row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.rm-top-row + .rm-top-row { margin-top: 10px; }
.rm-top-field { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
.rm-top-field label { font-size: 11px; font-weight: 600; color: var(--admin-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.rm-top-meta { display: flex; gap: 16px; font-size: 10px; color: var(--admin-text-muted); margin-left: auto; }

/* ==================== Left Panel ==================== */
.rm-left {
  width: 280px; min-width: 280px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.rm-left-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--admin-border);
  flex-shrink: 0;
}
.rm-left-hd h3 { margin: 0; font-size: 14px; font-weight: 600; color: var(--admin-text); }
.rm-btn-add {
  padding: 5px 14px; border-radius: 6px; border: 1px solid var(--admin-accent);
  background: transparent; color: var(--admin-accent); font-size: 12px;
  cursor: pointer; transition: all .2s; font-family: inherit; font-weight: 500;
}
.rm-btn-add:hover { background: var(--admin-accent); color: #fff; }
.rm-left-search { padding: 10px 12px; flex-shrink: 0; }
.rm-left-filters { display: flex; gap: 4px; padding: 0 12px 8px; flex-shrink: 0; }
.rm-filter-btn {
  padding: 3px 10px; border-radius: 12px; border: 1px solid var(--admin-border);
  background: transparent; color: var(--admin-text-muted); font-size: 11px;
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.rm-filter-btn:hover { border-color: var(--admin-accent-light); color: var(--admin-text); }
.rm-filter-btn.active { background: rgba(99,102,241,0.12); border-color: var(--admin-accent); color: var(--admin-accent); }
.rm-card-list { flex: 1; overflow-y: auto; padding: 4px 12px 12px; }
.rm-input {
  width: 100%; padding: 7px 10px; border-radius: 6px;
  border: 1px solid var(--admin-border);
  background: var(--admin-bg);
  color: var(--admin-text);
  font-size: 12px; font-family: inherit;
  outline: none; transition: border-color .2s;
  box-sizing: border-box;
}
.rm-input:focus { border-color: var(--admin-accent); }

/* Role Cards */
.rm-role-card {
  position: relative; display: flex;
  padding: 12px 14px; margin-bottom: 6px;
  border-radius: 8px;
  background: var(--admin-bg-secondary);
  border: 1px solid transparent;
  cursor: pointer; transition: all .2s; overflow: hidden;
}
.rm-role-card:hover { border-color: var(--admin-border); }
.rm-role-card.active {
  border-color: var(--admin-accent);
  background: var(--admin-surface);
  box-shadow: 0 0 12px rgba(99,102,241,0.08);
}
.rm-card-accent {
  position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--admin-accent-gradient);
  opacity: 0; transition: opacity .2s; border-radius: 0 2px 2px 0;
}
.rm-role-card.active .rm-card-accent { opacity: 1; }
.rm-card-body { flex: 1; position: relative; z-index: 1; min-width: 0; }
.rm-card-name-row { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.rm-card-name { font-size: 13px; font-weight: 600; color: var(--admin-text); display: flex; align-items: center; gap: 5px; }
.rm-sys-badge { color: var(--admin-accent); display: flex; align-items: center; flex-shrink: 0; }
.rm-inactive-tag { font-size: 10px; background: rgba(239,68,68,0.12); color: var(--admin-danger); padding: 1px 6px; border-radius: 4px; }
.rm-card-desc {
  font-size: 11px; color: var(--admin-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;
}
.rm-card-meta { display: flex; gap: 10px; font-size: 10px; color: var(--admin-text-secondary); align-items: center; }
.rm-scope-dot {
  padding: 1px 6px; border-radius: 4px;
  background: rgba(99,102,241,0.08); color: var(--admin-accent-light); font-size: 10px;
}
.rm-card-menu {
  position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: var(--admin-text-muted);
  cursor: pointer; padding: 6px; border-radius: 4px; opacity: 0; transition: all .15s;
  z-index: 2;
}
.rm-role-card:hover .rm-card-menu { opacity: 1; }
.rm-card-menu:hover { background: var(--admin-surface-hover); color: var(--admin-text); }

/* ==================== Center Panel ==================== */
.rm-center {
  flex: 1; display: flex; flex-direction: column;
  padding: 0 16px; overflow-y: auto; min-width: 0;
}
.rm-center-hd {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px; padding-bottom: 10px;
  border-bottom: 1px solid var(--admin-border);
  flex-shrink: 0;
}
.rm-center-title { font-size: 14px; font-weight: 600; color: var(--admin-text); }
.rm-center-actions { display: flex; gap: 8px; }
.rm-link-btn {
  font-size: 11px; color: var(--admin-accent); cursor: pointer;
  background: none; border: none; padding: 2px 6px; border-radius: 4px;
  font-family: inherit; transition: background .15s;
}
.rm-link-btn:hover { background: rgba(99,102,241,0.08); }

/* Permission Tree */
.rm-perm-section { margin-bottom: 16px; flex-shrink: 0; }
.rm-perm-section-title {
  font-size: 12px; font-weight: 600; color: var(--admin-text-secondary);
  margin-bottom: 8px; padding-left: 2px;
}
.rm-perm-tree {
  background: transparent;
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 8px 4px;
  max-height: 280px;
  overflow-y: auto;
}
.rm-tree-node { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.rm-tree-icon { font-size: 14px; width: 18px; text-align: center; }
.rm-tree-label { color: var(--admin-text); }
.rm-tree-tag { font-size: 10px !important; }

/* Button Permissions */
.rm-perm-cats { max-height: 260px; overflow-y: auto; }
.rm-perm-cat {
  margin-bottom: 10px;
  padding: 10px 12px; border-radius: 8px;
  background: var(--admin-bg-secondary);
  border: 1px solid var(--admin-border);
}
.rm-perm-cat-hd {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px; font-weight: 600; color: var(--admin-text); cursor: pointer;
  user-select: none;
}
.rm-cat-toggle {
  font-size: 10px; color: var(--admin-accent); cursor: pointer; background: none; border: none;
  padding: 2px 6px; border-radius: 4px; font-family: inherit;
}
.rm-cat-toggle:hover { background: rgba(99,102,241,0.1); }
.rm-perm-grid { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.rm-perm-pill {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 16px;
  border: 1px solid var(--admin-border);
  font-size: 11px; color: var(--admin-text-secondary); cursor: pointer;
  transition: all .15s; user-select: none;
}
.rm-perm-pill:hover { border-color: var(--admin-accent-light); }
.rm-perm-pill.on {
  background: rgba(99,102,241,0.1);
  border-color: var(--admin-accent);
  color: var(--admin-accent);
}
.rm-perm-pill input { display: none; }

/* ==================== Right Panel ==================== */
.rm-right {
  width: 280px; min-width: 280px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 14px 16px;
  display: flex; flex-direction: column;
  overflow-y: auto;
}
.rm-right-hd {
  margin-bottom: 12px; padding-bottom: 8px;
  border-bottom: 1px solid var(--admin-border);
}
.rm-right-title { font-size: 14px; font-weight: 600; color: var(--admin-text); }
.rm-scope-grid { display: flex; flex-direction: column; gap: 8px; }
.rm-scope-card {
  position: relative;
  padding: 14px 16px; border-radius: 10px;
  border: 1px solid var(--admin-border);
  background: var(--admin-bg-secondary);
  cursor: pointer; transition: all .2s;
  display: flex; align-items: center; gap: 10px;
}
.rm-scope-card:hover { border-color: var(--admin-accent-light); }
.rm-scope-card.on {
  border-color: var(--admin-accent);
  background: rgba(99,102,241,0.05);
  box-shadow: 0 0 12px rgba(99,102,241,0.06);
}
.rm-scope-icon { font-size: 22px; flex-shrink: 0; }
.rm-scope-label { font-size: 13px; font-weight: 600; color: var(--admin-text); }
.rm-scope-desc { font-size: 10px; color: var(--admin-text-muted); line-height: 1.3; }
.rm-scope-check {
  margin-left: auto; width: 22px; height: 22px; border-radius: 50%;
  background: var(--admin-accent-gradient); color: #fff;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.rm-right-info { margin-top: 16px; padding: 12px; border-radius: 8px; background: var(--admin-bg-secondary); border: 1px solid var(--admin-border); }
.rm-right-info-title { font-size: 11px; font-weight: 600; color: var(--admin-text-muted); margin-bottom: 6px; text-transform: uppercase; }
.rm-right-info-content { font-size: 11px; color: var(--admin-text-secondary); line-height: 1.6; }
.rm-right-info-content p { margin: 0; }

/* ==================== Empty Center ==================== */
.rm-empty { align-items: center; justify-content: center; gap: 12px; color: var(--admin-text-muted); padding: 40px 16px !important; }

/* ==================== Bottom Actions ==================== */
.rm-bottom {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 0 0; flex-shrink: 0;
}
.rm-btn-cancel, .rm-btn-save {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 24px; border-radius: 8px; font-size: 13px;
  font-family: inherit; cursor: pointer; transition: all .2s;
}
.rm-btn-cancel {
  border: 1px solid var(--admin-border); background: var(--admin-surface);
  color: var(--admin-text-secondary);
}
.rm-btn-cancel:hover { background: var(--admin-bg-secondary); color: var(--admin-text); }
.rm-btn-save {
  border: none; background: var(--admin-accent-gradient); color: #fff;
  font-weight: 500;
}
.rm-btn-save:hover { background: var(--admin-accent-gradient-hover); box-shadow: var(--admin-glow); transform: translateY(-1px); }

/* ==================== Responsive ==================== */
@media (max-width: 1200px) {
  .rm-split { flex-wrap: wrap; }
  .rm-left { width: 100%; min-width: 100%; max-height: 200px; }
  .rm-right { width: 100%; min-width: 100%; margin-top: 12px; }
  .rm-scope-grid { flex-direction: row; flex-wrap: wrap; }
  .rm-scope-card { flex: 1; min-width: 140px; }
}

@media (max-width: 768px) {
  .rm-split { flex-direction: column; }
  .rm-left { max-height: 180px; }
  .rm-center { padding: 12px 8px; }
  .rm-top-row { flex-direction: column; align-items: stretch; gap: 8px; }
  .rm-top-meta { margin-left: 0; }
}
</style>
