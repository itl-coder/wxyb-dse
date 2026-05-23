<template>
  <div class="settings-page">
    <!-- Tab Navigation -->
    <div class="settings-tabs">
      <button
        v-for="tab in settingTabs" :key="tab.key"
        class="st-tab"
        :class="{ active: activeSettingTab === tab.key }"
        @click="activeSettingTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <!-- Tab 1: 基础设置 -->
    <div v-show="activeSettingTab === 'basic'" class="admin-two-col">
      <!-- 学校信息 -->
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">🏫 学校信息</div>
        <div class="admin-form-group">
          <label>学校简称</label>
          <el-input v-model="schoolSettings.schoolName" placeholder="如：威学一百" />
        </div>
        <div class="admin-form-group">
          <label>学校全称</label>
          <el-input v-model="schoolSettings.schoolFullName" placeholder="如：威学一百国际教育" />
        </div>
        <div class="admin-form-group">
          <label>副标题</label>
          <el-input v-model="schoolSettings.schoolSubtitle" placeholder="如：DSE 学习管理系统 · 个性化学习报告" />
        </div>
        <div class="admin-two-col" style="margin-bottom:0">
          <div class="admin-form-group">
            <label>学期开始</label>
            <el-date-picker v-model="schoolSettings.semesterStart" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </div>
          <div class="admin-form-group">
            <label>学期结束</label>
            <el-date-picker v-model="schoolSettings.semesterEnd" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </div>
        </div>
        <el-button v-if="store.hasPermission('settings.edit')" type="primary" size="small" @click="saveSchoolSettings">保存学校信息</el-button>
      </div>

      <!-- 班主任 & 文档 -->
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">📋 班主任 & 文档配置</div>
        <div class="admin-form-group">
          <label>班主任</label>
          <el-input v-model="schoolSettings.homeroomTeacher" placeholder="如：张老师" />
        </div>
        <div class="admin-form-group">
          <label>报告脚注</label>
          <el-input v-model="schoolSettings.reportFooter" placeholder="如：用心陪伴每一位学生的成长" />
        </div>
        <div class="admin-two-col" style="margin-bottom:0">
          <div class="admin-form-group">
            <label>显示班主任签字</label>
            <el-switch v-model="schoolSettings.showTeacherSign" size="small" />
          </div>
          <div class="admin-form-group">
            <label>显示家长签字</label>
            <el-switch v-model="schoolSettings.showParentSign" size="small" />
          </div>
        </div>
        <el-button v-if="store.hasPermission('settings.edit')" type="primary" size="small" @click="saveSchoolSettings">保存配置</el-button>
      </div>

      <!-- 显示偏好 -->
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">🎨 显示偏好</div>
        <div class="admin-form-group">
          <label>Markdown 预览主题</label>
          <el-select v-model="schoolSettings.previewTheme" style="width:100%">
            <el-option v-for="t in previewThemeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>座位表 — 显示班级</label>
          <el-switch v-model="schoolSettings.seatShowClass" size="small" active-text="显示" inactive-text="隐藏" />
        </div>
        <div class="admin-form-group">
          <label>座位表 — 显示选修科目</label>
          <el-switch v-model="schoolSettings.seatShowElectives" size="small" active-text="显示" inactive-text="隐藏" />
        </div>
        <el-button v-if="store.hasPermission('settings.edit')" type="primary" size="small" @click="saveSchoolSettings">保存偏好</el-button>
      </div>

      <!-- 个人资料 -->
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">👤 个人资料</div>
        <div class="admin-two-col" style="margin-bottom:0">
          <div class="admin-form-group"><label>姓名</label><el-input v-model="profile.name" /></div>
          <div class="admin-form-group"><label>工号</label><el-input v-model="profile.workId" disabled /></div>
        </div>
        <div class="admin-form-group"><label>手机号</label><el-input v-model="profile.phone" /></div>
        <div class="admin-two-col" style="margin-bottom:0">
          <div class="admin-form-group">
            <label>任教科目</label>
            <el-select v-model="profile.subject" style="width:100%">
              <el-option v-for="s in allSubjects" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>负责班级</label>
            <el-select v-model="profile.classes" style="width:100%" multiple filterable>
              <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
            </el-select>
          </div>
        </div>
        <el-button type="primary" size="small" @click="saveProfile">保存资料</el-button>
      </div>
    </div>

    <!-- Tab 2: 班级 & 校区 -->
    <div v-show="activeSettingTab === 'classes'">
      <div class="admin-card">
        <div class="admin-card-header">
          <div><div class="admin-card-title" style="font-size:14px">📚 班级管理</div></div>
          <el-button size="small" type="primary" @click="openClassDialog(null)">+ 添加班级</el-button>
        </div>
        <el-table :data="classrooms" stripe size="small" style="width:100%">
          <el-table-column label="班级" fixed>
            <template #default="{ row }"><span style="color:var(--admin-text);font-weight:500">{{ row.name }}</span></template>
          </el-table-column>
          <el-table-column prop="grade" label="年级" />
          <el-table-column prop="advisor" label="班主任" />
          <el-table-column prop="students" label="学生数" />
          <el-table-column prop="room" label="教室" />
          <el-table-column prop="campus" label="校区" />
          <el-table-column label="操作" fixed="right" width="150">
            <template #default="{ row }">
              <el-button size="small" text @click="openClassDialog(row)">编辑</el-button>
              <el-button size="small" text type="danger" @click="deleteClass(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="admin-card">
        <div class="admin-card-header">
          <div><div class="admin-card-title" style="font-size:14px">🏢 公司所属校区</div></div>
          <el-button size="small" type="primary" @click="openCampusDialog(null)">+ 添加校区</el-button>
        </div>
        <el-table :data="campuses" stripe size="small" style="width:100%">
          <el-table-column label="校区名称" fixed>
            <template #default="{ row }"><span style="color:var(--admin-text);font-weight:500">{{ row.name }}</span></template>
          </el-table-column>
          <el-table-column label="地址">
            <template #default="{ row }"><span style="font-size:12px;color:var(--admin-text-secondary)">{{ row.address }}</span></template>
          </el-table-column>
          <el-table-column prop="phone" label="电话" />
          <el-table-column label="关联学生"><template #default="{ row }">{{ getCampusStudentCount(row.name) }} 人</template></el-table-column>
          <el-table-column label="关联班级"><template #default="{ row }">{{ getCampusClassCount(row.name) }} 个</template></el-table-column>
          <el-table-column label="操作" fixed="right" width="150">
            <template #default="{ row }">
              <el-button size="small" text @click="openCampusDialog(row)">编辑</el-button>
              <el-button size="small" text type="danger" @click="deleteCampus(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">🏫 学生上课校区分布</div>
        <el-table :data="studentCampuses" stripe size="small" style="width:100%">
          <el-table-column label="校区" fixed>
            <template #default="{ row }"><span style="color:var(--admin-text);font-weight:500">{{ row.name }}</span></template>
          </el-table-column>
          <el-table-column label="在读学生">
            <template #default="{ row }">{{ row.studentNames.slice(0, 4).join('、') }}{{ row.studentNames.length > 4 ? '...' : '' }}</template>
          </el-table-column>
          <el-table-column label="班级列表">
            <template #default="{ row }">
              <span v-for="(cls, i) in row.classes" :key="cls"><el-tag size="small" type="info" style="margin-right:4px;margin-bottom:2px">{{ cls }}</el-tag></span>
              <span v-if="row.classes.length === 0" style="color:var(--admin-text-muted)">—</span>
            </template>
          </el-table-column>
          <el-table-column label="在读总人数"><template #default="{ row }">{{ row.studentCount }} 人</template></el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Tab 3: 偏好设置 -->
    <div v-show="activeSettingTab === 'preferences'" class="admin-two-col">
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">🎨 外观设置</div>
        <div class="admin-form-group">
          <label>主题模式</label>
          <div style="display:flex;gap:12px">
            <div class="theme-option" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">
              <div class="theme-preview dark-preview"><div class="tp-sidebar"></div><div class="tp-main"><div class="tp-header"></div><div class="tp-body"><div class="tp-card" style="width:60%"></div><div class="tp-card" style="width:40%;height:8px"></div></div></div></div>
              <span>深色模式</span>
            </div>
            <div class="theme-option" :class="{ active: theme === 'light' }" @click="setTheme('light')">
              <div class="theme-preview light-preview"><div class="tp-sidebar"></div><div class="tp-main"><div class="tp-header"></div><div class="tp-body"><div class="tp-card" style="width:60%"></div><div class="tp-card" style="width:40%;height:8px"></div></div></div></div>
              <span>浅色模式</span>
            </div>
          </div>
        </div>
        <div class="admin-form-group">
          <label>侧边栏</label>
          <el-switch v-model="sidebarCollapsed" active-text="折叠" inactive-text="展开" size="small" />
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">🖨️ 全局水印配置</div>
        <div class="admin-card-subtitle" style="margin-top:-8px;margin-bottom:10px">所有导出/打印功能统一使用此配置</div>
        <div class="admin-form-group">
          <label>启用水印</label>
          <el-switch v-model="watermarkSettings.watermarkEnabled" size="small" @change="saveWatermarkSettings" />
        </div>
        <div class="admin-form-group">
          <label>水印文字</label>
          <el-input v-model="watermarkSettings.watermarkText" placeholder="内部资料·仅供家长会使用" />
        </div>
        <div class="admin-two-col" style="margin-bottom:0">
          <div class="admin-form-group">
            <label>旋转角度</label>
            <el-slider v-model="watermarkSettings.watermarkRotation" :min="-45" :max="45" :step="1" show-input size="small" @change="saveWatermarkSettings" />
          </div>
          <div class="admin-form-group">
            <label>不透明度</label>
            <el-slider v-model="watermarkSettings.watermarkOpacity" :min="0.01" :max="0.2" :step="0.01" show-input size="small" @change="saveWatermarkSettings" />
          </div>
        </div>
        <div class="admin-two-col" style="margin-bottom:0">
          <div class="admin-form-group">
            <label>字号</label>
            <el-slider v-model="watermarkSettings.watermarkFontSize" :min="12" :max="48" :step="1" show-input size="small" @change="saveWatermarkSettings" />
          </div>
          <div class="admin-form-group">
            <label>颜色</label>
            <div style="display:flex;align-items:center;gap:8px">
              <el-color-picker v-model="watermarkSettings.watermarkColor" size="small" @change="saveWatermarkSettings" />
              <span style="font-size:10px;color:var(--admin-text-muted)">{{ watermarkSettings.watermarkColor }}</span>
            </div>
          </div>
        </div>
        <div class="admin-two-col" style="margin-bottom:0">
          <div class="admin-form-group">
            <label>水平间距</label>
            <el-slider v-model="watermarkSettings.watermarkGapX" :min="60" :max="300" :step="10" show-input size="small" @change="saveWatermarkSettings" />
          </div>
          <div class="admin-form-group">
            <label>垂直间距</label>
            <el-slider v-model="watermarkSettings.watermarkGapY" :min="40" :max="200" :step="10" show-input size="small" @change="saveWatermarkSettings" />
          </div>
        </div>
        <div class="admin-form-group">
          <label>显示时间戳</label>
          <el-switch v-model="watermarkSettings.watermarkShowTimestamp" size="small" @change="saveWatermarkSettings" />
        </div>
        <el-button size="small" type="primary" @click="saveWatermarkSettings">💾 保存水印配置</el-button>
      </div>
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">🔔 通知设置</div>
        <div class="notify-list">
          <div v-for="n in notificationSettings" :key="n.key" class="notify-item">
            <div class="notify-info">
              <div class="notify-name">{{ n.label }}</div>
              <div class="notify-desc">{{ n.desc }}</div>
            </div>
            <el-switch v-model="n.enabled" size="small" />
          </div>
        </div>
        <el-button size="small" type="primary" style="margin-top:12px" @click="saveNotifications">保存通知设置</el-button>
      </div>
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">ℹ️ 关于系统</div>
        <div class="about-info">
          <div class="about-row"><span>系统名称</span><span>DSE 智能学情管理系统</span></div>
          <div class="about-row"><span>版本号</span><span>v2.0.0</span></div>
          <div class="about-row"><span>技术栈</span><span>Vue 3 + Element Plus + ECharts</span></div>
          <div class="about-row"><span>数据存储</span><span>localStorage（演示模式）</span></div>
          <div class="about-row"><span>最后更新</span><span>{{ today }}</span></div>
        </div>
      </div>
    </div>

    <!-- Tab 4: 数据管理 -->
    <div v-show="activeSettingTab === 'data'">
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px">💾 数据导出与备份</div>
        <div class="admin-two-col" style="margin-bottom:0">
          <div class="admin-form-group">
            <label>导出学生数据</label>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <el-select size="small" style="width:130px" v-model="exportClass">
                <el-option label="全部班级" value="all" />
                <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
              </el-select>
              <el-button size="small" @click="exportData('excel')">📥 Excel</el-button>
            </div>
          </div>
          <div class="admin-form-group">
            <label>数据备份</label>
            <div style="display:flex;align-items:center;gap:12px">
              <el-button size="small" @click="backupData">立即备份</el-button>
              <span style="font-size:10px;color:var(--admin-text-muted)">上次备份：{{ lastBackup }}</span>
            </div>
          </div>
        </div>
        <div class="admin-form-group">
          <label>恢复数据</label>
          <div style="display:flex;gap:8px">
            <input ref="restoreFile" type="file" accept=".json" style="display:none" @change="handleRestore" />
            <el-button size="small" @click="triggerRestoreFile">📂 选择备份文件</el-button>
          </div>
        </div>
      </div>
      <div class="admin-card" style="border-left:3px solid var(--admin-danger)">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:14px;color:var(--admin-danger)">⚠️ 危险操作区域</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <el-button type="danger" @click="clearAllData">🗑 清空所有数据</el-button>
          <el-button type="warning" @click="resetToDefault">↺ 恢复默认数据</el-button>
        </div>
      </div>
    </div>

    <!-- Campus Dialog -->
    <el-dialog v-model="campusDialogVisible" :title="editingCampusId ? '编辑校区' : '添加校区'" width="480px">
      <div class="admin-form-group">
        <label>校区名称 <span style="color:var(--admin-danger)">*</span></label>
        <el-input v-model="campusForm.name" placeholder="如：九龙塘总校" />
      </div>
      <div class="admin-form-group">
        <label>地址</label>
        <el-input v-model="campusForm.address" placeholder="校区详细地址" />
      </div>
      <div class="admin-form-group">
        <label>电话</label>
        <el-input v-model="campusForm.phone" placeholder="校区联系电话" />
      </div>
      <template #footer>
        <el-button @click="campusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCampus">{{ editingCampusId ? '保存修改' : '添加' }}</el-button>
      </template>
    </el-dialog>

    <!-- Class Dialog -->
    <el-dialog v-model="classDialogVisible" :title="editingClassId ? '编辑班级' : '添加班级'" width="480px">
      <div class="admin-form-group">
        <label>班级名称</label>
        <el-input v-model="classForm.name" placeholder="如：5D" />
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>年级</label>
          <el-select v-model="classForm.grade" style="width:100%">
            <el-option v-for="g in ['中一','中二','中三','中四','中五','中六']" :key="g" :label="g" :value="g" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>校区</label>
          <el-select v-model="classForm.campus" style="width:100%">
            <el-option v-for="c in campusList" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>班主任</label>
          <el-input v-model="classForm.advisor" placeholder="班主任姓名" />
        </div>
        <div class="admin-form-group">
          <label>教室</label>
          <el-input v-model="classForm.room" placeholder="如：501" />
        </div>
      </div>
      <template #footer>
        <el-button @click="classDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveClass">{{ editingClassId ? '保存修改' : '添加' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 页面：系统设置
 * 功能：学校信息、班级与校区管理、偏好设置（主题/水印/通知）、数据备份与恢复
 * 路由：/admin/settings
 */
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { settingsService, classroomService, studentService, campusService } from '@/services/dataService'

const store = useAppStore()
const today = new Date().toISOString().split('T')[0]

// Tab state
const activeSettingTab = ref('basic')
const settingTabs = [
  { key: 'basic', label: '🏫 基础设置' },
  { key: 'classes', label: '📚 班级&校区' },
  { key: 'preferences', label: '🎨 偏好设置' },
  { key: 'data', label: '💾 数据管理' }
]

// School Settings
const schoolSettings = reactive({
  schoolName: '威学一百', schoolFullName: '威学一百国际教育',
  schoolSubtitle: 'DSE 学习管理系统 · 个性化学习报告',
  schoolLogo: '', semesterStart: '2025-09-01', semesterEnd: '2026-07-15',
  homeroomTeacher: '张老师', reportFooter: '用心陪伴每一位学生的成长',
  watermarkEnabled: true, watermarkText: '内部资料·仅供家长会使用',
  previewTheme: 'default', seatShowClass: true, seatShowElectives: true,
  showTeacherSign: true, showParentSign: true
})

// Profile
const profile = reactive({
  name: '张老师', workId: 'T2024001', phone: '138****8888',
  subject: '数学', classes: ['5D']
})

// Appearance
const theme = ref(store.theme)
const sidebarCollapsed = ref(store.sidebarCollapsed)

// Classes
const classrooms = ref([])
const classDialogVisible = ref(false)
const editingClassId = ref(null)
const classForm = reactive({ name: '', grade: '中五', advisor: '张老师', room: '', campus: '九龙塘总校', students: 0 })
const exportClass = ref('all')
const lastBackup = ref('2026-05-06 23:00')

// Campuses
const campuses = ref([])
const campusDialogVisible = ref(false)
const editingCampusId = ref(null)
const campusForm = reactive({ name: '', address: '', phone: '' })
const restoreFile = ref(null)

function triggerRestoreFile() {
  restoreFile.value?.click()
}

const allSubjects = ['数学', '中文', '英文', '物理', '化学', '生物', '经济', '历史', '地理', '资讯及通讯科技']
const previewThemeOptions = [
  { label: 'Default 默认', value: 'default' },
  { label: 'GitHub', value: 'github' },
  { label: 'VuePress', value: 'vuepress' },
  { label: 'Mk-Cute 可爱', value: 'mk-cute' },
  { label: 'Smart Blue 科技蓝', value: 'smart-blue' },
  { label: 'Cyanosis 青蓝', value: 'cyanosis' },
  { label: 'Arknights 明日方舟', value: 'arknights' }
]
const classList = ref([])
const campusList = ref([])
const watermarkSettings = ref(settingsService.get())

// Campus stats
function getCampusStudentCount(campusName) {
  return studentService.getAll().filter(s => s.campus === campusName).length
}
function getCampusClassCount(campusName) {
  return classroomService.getAll().filter(c => c.campus === campusName).length
}
const studentCampuses = computed(() => {
  const students = studentService.getAll()
  const classes = classroomService.getAll()
  const campusMap = new Map()
  campuses.value.forEach(c => {
    campusMap.set(c.name, { name: c.name, studentNames: [], classes: [], studentCount: 0 })
  })
  students.forEach(s => {
    if (!campusMap.has(s.campus)) {
      campusMap.set(s.campus, { name: s.campus, studentNames: [], classes: [], studentCount: 0 })
    }
    const entry = campusMap.get(s.campus)
    entry.studentNames.push(s.name)
    entry.studentCount++
  })
  classes.forEach(c => {
    if (campusMap.has(c.campus)) {
      campusMap.get(c.campus).classes.push(c.name)
    }
  })
  return [...campusMap.values()]
})

// Notifications
const notificationSettings = ref([
  { key:'behavior', label:'课堂表现提醒', desc:'学生有异常行为时推送通知', enabled:true },
  { key:'homework', label:'作业催交通知', desc:'学生未按时提交作业时提醒', enabled:true },
  { key:'attendance', label:'考勤异常通知', desc:'学生迟到/缺勤时通知班主任', enabled:true },
  { key:'discipline', label:'纪律预警', desc:'学生违纪时推送处理提醒', enabled:true },
  { key:'counseling', label:'心理关注提醒', desc:'学生情绪异常时推送关注通知', enabled:true },
  { key:'report', label:'日报生成通知', desc:'每日成长报告生成后推送', enabled:false },
  { key:'exam', label:'成绩发布提醒', desc:'新成绩录入后通知相关教师', enabled:true },
  { key:'conference', label:'家长会提醒', desc:'家长会前48小时推送通知', enabled:true }
])

onMounted(() => {
  const s = settingsService.get()
  Object.assign(schoolSettings, s)
  theme.value = store.theme
  sidebarCollapsed.value = store.sidebarCollapsed

  watermarkSettings.value = settingsService.get()

  classrooms.value = classroomService.getAll()
  campuses.value = campusService.getAll()
  classList.value = studentService.getClasses()
  campusList.value = campuses.value.map(c => c.name)
})

watch(sidebarCollapsed, (v) => store.setSidebarCollapsed(v))

// Save functions
function saveSchoolSettings() {
  settingsService.save({ ...schoolSettings })
  ElMessage.success('学校信息已保存')
}

function saveProfile() {
  ElMessage.success('个人资料已保存')
}

function saveNotifications() {
  ElMessage.success('通知设置已保存')
}

function saveWatermarkSettings() {
  settingsService.save({ ...watermarkSettings.value })
  ElMessage.success('水印配置已保存')
}

function setTheme(t) {
  theme.value = t
  store.setTheme(t)
  ElMessage.success(`已切换为${t === 'dark' ? '深色' : '浅色'}模式`)
}

// Class CRUD
function openClassDialog(cls) {
  if (cls) {
    editingClassId.value = cls.id
    Object.assign(classForm, cls)
  } else {
    editingClassId.value = null
    Object.assign(classForm, { name: '', grade: '中五', advisor: '张老师', room: '', campus: '九龙塘总校', students: 0 })
  }
  classDialogVisible.value = true
}

function saveClass() {
  if (!classForm.name) { ElMessage.warning('请输入班级名称'); return }
  if (editingClassId.value) {
    classroomService.update(editingClassId.value, { ...classForm })
    ElMessage.success('班级信息已更新')
  } else {
    classroomService.create({ ...classForm })
    ElMessage.success('班级已添加')
  }
  classDialogVisible.value = false
  classrooms.value = classroomService.getAll()
  classList.value = studentService.getClasses()
}

async function deleteClass(cls) {
  try {
    await ElMessageBox.confirm(`确定删除班级「${cls.name}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    const result = classroomService.delete(cls.id)
    if (result && result.error) { ElMessage.warning(result.error); return }
    classrooms.value = classroomService.getAll()
    classList.value = studentService.getClasses()
    ElMessage.success('班级已删除')
  } catch {}
}

// Campus CRUD
function openCampusDialog(campus) {
  if (campus) {
    editingCampusId.value = campus.id
    Object.assign(campusForm, campus)
  } else {
    editingCampusId.value = null
    Object.assign(campusForm, { name: '', address: '', phone: '' })
  }
  campusDialogVisible.value = true
}

function saveCampus() {
  if (!campusForm.name) { ElMessage.warning('请输入校区名称'); return }
  if (editingCampusId.value) {
    campusService.update(editingCampusId.value, { ...campusForm })
    ElMessage.success('校区信息已更新')
  } else {
    campusService.create({ ...campusForm })
    ElMessage.success('校区已添加')
  }
  campusDialogVisible.value = false
  campuses.value = campusService.getAll()
  campusList.value = campuses.value.map(c => c.name)
}

async function deleteCampus(campus) {
  try {
    await ElMessageBox.confirm(`确定删除校区「${campus.name}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    const result = campusService.delete(campus.id)
    if (result && result.error) { ElMessage.warning(result.error); return }
    campuses.value = campusService.getAll()
    campusList.value = campuses.value.map(c => c.name)
    ElMessage.success('校区已删除')
  } catch {}
}

function exportData(format) {
  const students = studentService.getAll()
  const filtered = exportClass.value === 'all' ? students : students.filter(s => s.class === exportClass.value)

  if (format === 'excel') {
    // Generate CSV
    const headers = ['姓名','校区','班级','性别','住宿','目标院校','身份','CC','SA','留学规划','选修1','选修2','选修3']
    const rows = filtered.map(s => [s.name, s.campus, s.class, s.gender, s.boarding?'是':'否', s.targetUniversity, s.identity, s.cc, s.sa, s.studyAbroadPlanning?'是':'否', s.elective1, s.elective2, s.elective3])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `学生数据_${today}.csv`; a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } else {
    ElMessage.info('PDF导出功能开发中，请使用浏览器打印功能')
  }
}

function backupData() {
  const allData = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('dse_')) {
      allData[key] = localStorage.getItem(key)
    }
  }
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `DSE_备份_${today}.json`; a.click()
  URL.revokeObjectURL(url)
  lastBackup.value = new Date().toLocaleString('zh-CN')
  ElMessage.success('数据备份成功')
}

function handleRestore(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result)
      Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value))
      ElMessage.success('数据恢复成功，请刷新页面')
      setTimeout(() => location.reload(), 1500)
    } catch {
      ElMessage.error('备份文件格式错误')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

async function clearAllData() {
  try {
    await ElMessageBox.confirm('此操作将清空所有本地数据（包括学生信息、成绩、录音等），且不可恢复！', '⚠️ 危险操作确认', {
      confirmButtonText: '确认清空', cancelButtonText: '取消', type: 'error',
      confirmButtonClass: 'el-button--danger'
    })
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('dse_')) keys.push(key)
    }
    keys.forEach(k => localStorage.removeItem(k))
    ElMessage.success('所有数据已清空，请刷新页面')
    setTimeout(() => location.reload(), 1500)
  } catch {}
}

async function resetToDefault() {
  try {
    await ElMessageBox.confirm('此操作将恢复所有默认演示数据，当前数据将被覆盖。确定继续？', '恢复默认数据', {
      confirmButtonText: '确认恢复', cancelButtonText: '取消', type: 'warning'
    })
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('dse_')) keys.push(key)
    }
    keys.forEach(k => localStorage.removeItem(k))
    const { initAllData } = await import('@/services/dataService')
    initAllData()
    ElMessage.success('已恢复默认数据，请刷新页面')
    setTimeout(() => location.reload(), 1500)
  } catch {}
}
</script>

<style scoped>
.settings-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.st-tab {
  padding: 7px 18px;
  border: 1px solid var(--admin-border);
  background: var(--admin-surface);
  border-radius: var(--admin-radius-sm);
  font-size: 13px;
  cursor: pointer;
  color: var(--admin-text-secondary);
  transition: all 0.2s;
  font-family: var(--admin-font);
}

.st-tab:hover {
  border-color: var(--admin-accent);
  color: var(--admin-text);
}

.st-tab.active {
  background: var(--admin-accent);
  color: #fff;
  border-color: var(--admin-accent);
}

/* Notifications */
.notify-list { max-height: 300px; overflow-y: auto; }
.notify-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid var(--admin-border);
}
.notify-item:last-child { border-bottom: none; }
.notify-info { flex: 1; }
.notify-name { font-size: 13px; color: var(--admin-text); font-weight: 500; }
.notify-desc { font-size: 10px; color: var(--admin-text-muted); margin-top: 2px; }

/* Theme selector */
.theme-option {
  cursor: pointer; padding: 8px; border-radius: 10px;
  border: 2px solid var(--admin-border); text-align: center;
  transition: all 0.2s; font-size: 11px; color: var(--admin-text-secondary);
}
.theme-option:hover { border-color: var(--admin-border-light); }
.theme-option.active { border-color: var(--admin-accent); color: var(--admin-accent); }
.theme-preview {
  width: 100px; height: 60px; border-radius: 6px; margin-bottom: 6px;
  display: flex; overflow: hidden; border: 1px solid #333;
}
.dark-preview { background: #0a1628; }
.light-preview { background: #f5f0e8; }
.dark-preview .tp-sidebar { width: 24px; background: #152040; border-right: 1px solid #1e3460; }
.light-preview .tp-sidebar { width: 24px; background: #e8e2d8; border-right: 1px solid #ddd; }
.tp-main { flex: 1; padding: 4px; display: flex; flex-direction: column; gap: 4px; }
.tp-header { height: 8px; border-radius: 2px; }
.dark-preview .tp-header { background: #1e3058; }
.light-preview .tp-header { background: #d4c8b0; }
.tp-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.dark-preview .tp-card { background: #1a2a50; border-radius: 2px; }
.light-preview .tp-card { background: #e8dcc8; border-radius: 2px; }

/* About */
.about-info { font-size: 12px; }
.about-row {
  display: flex; justify-content: space-between; padding: 6px 0;
  border-bottom: 1px solid var(--admin-border);
}
.about-row:last-child { border-bottom: none; }
.about-row span:first-child { color: var(--admin-text-muted); }
.about-row span:last-child { color: var(--admin-text-secondary); }

@media (max-width: 768px) {
  .settings-grid { grid-template-columns: 1fr; }
}
</style>
