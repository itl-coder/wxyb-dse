<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div class="admin-card-title">角色权限管理</div>
        <el-button type="primary" size="small" @click="openDrawer()">+ 新增角色</el-button>
      </div>
      <el-input v-model="searchText" size="small" placeholder="搜索角色..." clearable style="margin-bottom:12px;max-width:300px" />
      <el-table :data="filteredRoles" size="small" highlight-current-row @row-click="openDrawer">
        <el-table-column label="角色名称" min-width="140"><template #default="{ row }"><span style="font-weight:600">{{ row.roleName }}</span></template></el-table-column>
        <el-table-column label="权限编码" width="140"><template #default="{ row }"><code style="font-size:11px;color:var(--admin-accent-light)">{{ row.roleKey }}</code></template></el-table-column>
        <el-table-column prop="roleSort" label="排序" width="70" align="center" />
        <el-table-column label="状态" width="80" align="center"><template #default="{ row }"><el-tag size="small" :type="row.status==='1'?'danger':'success'">{{ row.status==='1'?'停用':'启用' }}</el-tag></template></el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }"><el-button size="small" text type="primary" @click.stop="openDrawer(row)">编辑</el-button><el-button size="small" text type="danger" @click.stop="handleDelete(row)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="visible" :title="form.roleId ? '编辑角色' : '新增角色'" size="480px" append-to-body>
      <el-tabs v-model="tab" class="rm-tabs">
        <el-tab-pane label="基本信息" name="info">
          <div class="admin-form-group"><label>角色名称 <span style="color:#ef4444">*</span></label><el-input v-model="form.roleName" size="small" placeholder="如：数据管理员" /></div>
          <div class="admin-form-group"><label>权限编码 <span style="color:#ef4444">*</span></label><el-input v-model="form.roleKey" size="small" placeholder="如：data_admin" /></div>
          <div class="admin-two-col"><div class="admin-form-group"><label>排序</label><el-input-number v-model="form.roleSort" :min="0" size="small" style="width:100%" /></div><div class="admin-form-group"><label>状态</label><el-radio-group v-model="form.status" size="small"><el-radio-button value="0">启用</el-radio-button><el-radio-button value="1">停用</el-radio-button></el-radio-group></div></div>
          <div class="admin-form-group"><label>备注</label><el-input v-model="form.remark" size="small" type="textarea" :rows="2" /></div>
        </el-tab-pane>
        <el-tab-pane label="菜单权限" name="perm" v-if="form.roleId">
          <div class="rm-tree-bar">
            <el-button size="small" text @click="expandAll">{{ expanded ? '收起' : '展开' }}</el-button>
            <el-button size="small" text @click="checkAll">全选</el-button>
            <el-button size="small" text @click="uncheckAll">清空</el-button>
            <span class="rm-tree-count" v-if="permCount">{{ permCount }} 项</span>
          </div>
          <div class="rm-tree-box">
            <el-tree ref="treeRef" :data="menuTree" show-checkbox node-key="menuId"
              :default-checked-keys="checkedKeys" :default-expanded-keys="expandedKeys"
              :props="{ children: 'children' }" check-strictly @check="permCount = treeRef?.getCheckedKeys().length || 0" :indent="16">
              <template #default="{ data }">
                <span class="rm-tn" :class="data.menuType"><span class="rm-tn-dot" /><span>{{ data.menuName }}</span></span>
              </template>
            </el-tree>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="saveAll" :loading="saving">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoleListHandler, getRoleByIdHandler, createRoleHandler, updateRoleHandler, deleteRoleHandler, assignRoleMenusHandler } from '@/api/role'
import { getAllMenuTreeHandler } from '@/api/menu'

const roles = ref([]), menuTree = ref([]), visible = ref(false), searchText = ref(''), tab = ref('info')
const saving = ref(false), expanded = ref(false), permCount = ref(0)
const checkedKeys = ref([]), expandedKeys = ref([]), treeRef = ref(null)
const form = reactive({ roleId: null, roleName: '', roleKey: '', roleSort: 0, status: '0', remark: '' })
const filteredRoles = computed(() => { const q = searchText.value.toLowerCase(); return q ? roles.value.filter(r => (r.roleName||'').toLowerCase().includes(q) || (r.roleKey||'').toLowerCase().includes(q)) : roles.value })

async function load() { try { const [a, b] = await Promise.all([getRoleListHandler(), getAllMenuTreeHandler()]); roles.value = a.data || []; menuTree.value = b.data || [] } catch {} }
async function openDrawer(row) {
  if (row) { try { const r = await getRoleByIdHandler(row.roleId); const d = r.data; Object.assign(form, { roleId: d.role?.roleId || d.roleId, roleName: d.role?.roleName || '', roleKey: d.role?.roleKey || '', roleSort: d.role?.roleSort || 0, status: d.role?.status || '0', remark: d.role?.remark || '' }); checkedKeys.value = (d.menuIds || []).map(String); permCount.value = d.menuIds?.length || 0; expandedKeys.value = [...checkedKeys.value] } catch { return } }
  else { Object.assign(form, { roleId: null, roleName: '', roleKey: '', roleSort: 0, status: '0', remark: '' }); checkedKeys.value = []; permCount.value = 0 }
  visible.value = true; tab.value = 'info'
}
async function saveAll() {
  if (!form.roleName || !form.roleKey) return ElMessage.warning('请填写完整')
  saving.value = true
  try {
    if (form.roleId) { await updateRoleHandler(form.roleId, form) } else { const r = await createRoleHandler(form); if (r.data) form.roleId = r.data.roleId || (roles.value.find(x => x.roleKey === form.roleKey)?.roleId) }
    if (treeRef.value) { const ids = treeRef.value.getCheckedKeys().map(Number); await assignRoleMenusHandler(form.roleId, ids); checkedKeys.value = ids.map(String); permCount.value = ids.length }
    ElMessage.success('已保存'); await load()
  } catch { ElMessage.error('保存失败') }
  saving.value = false
}
async function handleDelete(row) { try { await ElMessageBox.confirm('删除「' + row.roleName + '」？', '确认', { type: 'warning' }); await deleteRoleHandler(row.roleId); ElMessage.success('已删除'); await load() } catch {} }
function expandAll() { expanded.value = !expanded.value; const ns = treeRef.value?.store?.nodesMap; if (ns) Object.values(ns).forEach(n => expanded.value ? n.expand() : n.collapse()) }
function checkAll() { const a = []; (function w(ns) { ns.forEach(n => { a.push(n.menuId); if (n.children) w(n.children) }) })(menuTree.value); treeRef.value?.setCheckedKeys(a, false); permCount.value = a.length }
function uncheckAll() { treeRef.value?.setCheckedKeys([], false); permCount.value = 0 }
onMounted(load)
</script>

<style scoped>
.rm-tabs :deep(.el-tabs__content) { padding-top: 8px; }
.rm-tree-bar { display: flex; align-items: center; gap: 2px; margin-bottom: 8px; }
.rm-tree-count { font-size: 12px; color: var(--admin-accent-light); margin-left: auto; }
.rm-tree-box { border: 1px solid var(--admin-border); border-radius: 8px; padding: 8px; flex: 1; overflow: auto; min-height: 320px; }
.rm-tn { display: flex; align-items: center; gap: 8px; }
.rm-tn-dot { width: 7px; height: 7px; border-radius: 2px; flex-shrink: 0; }
.rm-tn.M .rm-tn-dot { background: #eab308; } .rm-tn.C .rm-tn-dot { background: #3b82f6; } .rm-tn.F .rm-tn-dot { background: #22c55e; }
</style>
