<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div class="admin-card-title">菜单管理</div>
        <el-button size="small" type="primary" @click="openDrawer('M',0)">新增目录</el-button>
      </div>
      <el-table :data="menuList" size="small" row-key="menuId" border default-expand-all
        :tree-props="{ children: 'children' }" highlight-current-row style="width:100%">
        <el-table-column prop="menuName" label="菜单名称" min-width="180">
          <template #default="{ row }"><span class="mm-icon">{{ iconLabel(row.icon) }}</span><span style="font-weight:500">{{ row.menuName }}</span></template>
        </el-table-column>
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.menuType==='M'?'warning':row.menuType==='C'?'primary':'success'">{{ row.menuType==='M'?'目录':row.menuType==='C'?'菜单':'按钮' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" width="60" align="center" />
        <el-table-column prop="perms" label="权限标识" width="160" show-overflow-tooltip />
        <el-table-column prop="path" label="路由地址" width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="row.menuType!=='F'" size="small" text type="primary" @click="openDrawer('C',row.menuId)">新增</el-button>
            <el-button size="small" text @click="openDrawer(row.menuType,row.parentId||0,row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="visible" :title="isEdit?'修改菜单':'新增菜单'" size="460px" append-to-body>
      <div class="mm-form">
        <div class="mm-types">
          <div class="mm-type-card" :class="{on:form.menuType==='M'}" @click="form.menuType='M';onTypeChange()">
            <span class="mm-type-icon">📁</span><span>目录</span><small>侧边栏分组</small>
          </div>
          <div class="mm-type-card" :class="{on:form.menuType==='C'}" @click="form.menuType='C';onTypeChange()">
            <span class="mm-type-icon">📄</span><span>菜单</span><small>页面路由</small>
          </div>
          <div class="mm-type-card" :class="{on:form.menuType==='F'}" @click="form.menuType='F';onTypeChange()">
            <span class="mm-type-icon">🔘</span><span>按钮</span><small>操作权限</small>
          </div>
        </div>
        <div class="admin-form-group" v-if="form.menuType!=='M'"><label>上级菜单</label>
          <el-tree-select v-model="form.parentId" :data="treeSelectData" size="small"
            :props="{value:'menuId',label:'menuName',children:'children'}" check-strictly clearable placeholder="选择上级" style="width:100%" />
        </div>
        <div class="admin-form-group"><label>菜单名称</label><el-input v-model="form.menuName" size="small" :placeholder="form.menuType==='F'?'按钮名称':'菜单名称'" /></div>
        <div class="admin-two-col"><div class="admin-form-group"><label>排序</label><el-input-number v-model="form.orderNum" size="small" :min="0" style="width:100%" /></div><div class="admin-form-group" v-if="form.menuType!=='F'"><label>图标</label><el-input v-model="form.icon" size="small" placeholder="dashboard" /></div></div>
        <div class="admin-form-group" v-if="form.menuType!=='F'"><label>路由地址</label><el-input v-model="form.path" size="small" placeholder="/admin/xxx" /></div>
        <div class="admin-form-group" v-if="form.menuType==='C'"><label>组件路径</label><el-input v-model="form.component" size="small" placeholder="admin/xxx/Xxx" /></div>
        <div class="admin-form-group" v-if="form.menuType!=='M'"><label>权限标识</label><el-input v-model="form.perms" size="small" placeholder="sys:xxx:list" /></div>
        <div class="admin-form-group" v-if="form.menuType!=='F'"><label>显示状态</label>
          <el-radio-group v-model="form.visible" size="small"><el-radio-button value="0">显示</el-radio-button><el-radio-button value="1">隐藏</el-radio-button></el-radio-group>
        </div>
      </div>
      <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" @click="saveMenu" :loading="saving">保存</el-button></template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAllMenuTreeHandler, createMenuHandler, updateMenuHandler, deleteMenuHandler } from '@/api/menu'

const menuList = ref([]), visible = ref(false), isEdit = ref(false), saving = ref(false)
const form = reactive({ menuId: null, menuName: '', parentId: 0, menuType: 'M', orderNum: 0, icon: '', path: '', component: '', perms: '', visible: '0' })

const treeSelectData = computed(() => {
  const t = JSON.parse(JSON.stringify(menuList.value))
  !function add(n,d){for(const x of n){x.menuName='└ '.repeat(d)+x.menuName;if(x.children)add(x.children,d+1)}}(t,0);return t
})

const iconMap = { dashboard:'📊',timetable:'📅',homework:'📝',behavior:'👥',discipline:'⚖️',phone:'📱',attendance:'✓',students:'👨‍🎓',reports:'📋',counseling:'💬',exam:'📄',questions:'🎯','question-bank':'📚','exam-tips':'💡','exam-seat':'🪑',conference:'📋','course-feedback':'📝','parent-conference':'👨‍👩‍👧',voice:'🎙️','ai-skills':'🛠️','ai-excel':'📊','ai-tools':'💻','ai-quotes':'💬','ai-prompts':'📝',courses:'📖',settings:'⚙️',config:'🔧',users:'👤',roles:'🛡️',menus:'📋',common:'⭐',teaching:'📖',student:'👨‍🎓',communication:'💬','ai-data':'🤖',course:'📖' }
function iconLabel(i){return iconMap[i]||'📌'}
function onTypeChange(){const t=form.menuType;if(t==='M'){form.path='';form.component='';form.perms=''}else if(t==='F'){form.path='';form.component='';form.icon='';form.visible='0'}}

async function load(){try{const r=await getAllMenuTreeHandler();menuList.value=r.data||[]}catch{}}
function openDrawer(type,parentId,row){
  if(row){isEdit.value=true;Object.assign(form,{menuId:row.menuId,menuName:row.menuName,parentId:row.parentId||0,menuType:row.menuType,orderNum:row.orderNum||0,icon:row.icon||'',path:row.path||'',component:row.component||'',perms:row.perms||'',visible:row.visible||'0'})}
  else{isEdit.value=false;Object.assign(form,{menuId:null,menuName:'',parentId,menuType:type,orderNum:0,icon:'',path:'',component:'',perms:'',visible:'0'})}
  visible.value=true
}
async function saveMenu(){
  if(!form.menuName)return ElMessage.warning('请输入菜单名称')
  saving.value=true
  try{const d={...form,parentId:form.menuType==='M'?0:(form.parentId||0)};isEdit.value?await updateMenuHandler(d.menuId,d):await createMenuHandler(d);ElMessage.success('已保存');visible.value=false;await load()}catch{ElMessage.error('保存失败')}
  saving.value=false
}
async function handleDelete(row){
  try{await ElMessageBox.confirm('删除「'+row.menuName+'」及子菜单？','确认',{type:'warning'});await deleteMenuHandler(row.menuId);ElMessage.success('已删除');await load()}catch{}
}
onMounted(load)
</script>

<style scoped>
.mm-icon { margin-right: 6px; font-size: 15px; }
.mm-form { display: flex; flex-direction: column; gap: 14px; }
.mm-types { display: flex; gap: 8px; }
.mm-type-card { flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 8px;border:1px solid var(--admin-border);border-radius:10px;cursor:pointer;transition:all .15s; }
.mm-type-card:hover { border-color: var(--admin-accent); }
.mm-type-card.on { border-color: var(--admin-accent); background: rgba(99,102,241,0.06); }
.mm-type-icon { font-size: 22px; }
.mm-type-card span:nth-child(2) { font-size: 12px; font-weight: 600; color: var(--admin-text); }
.mm-type-card small { font-size: 9px; color: var(--admin-text-muted); }

/* light mode */
.admin-layout[data-theme="light"] .mm-type-card { background: #fff; border-color: #e2e8f0; }
.admin-layout[data-theme="light"] .mm-type-card:hover { border-color: #6366f1; }
.admin-layout[data-theme="light"] .mm-type-card.on { border-color: #6366f1; background: #eef2ff; }
</style>
