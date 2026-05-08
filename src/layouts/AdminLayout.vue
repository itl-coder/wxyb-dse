<template>
  <div class="admin-layout" :data-theme="store.theme">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="admin-sidebar-overlay" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ open: sidebarOpen, collapsed: store.sidebarCollapsed }">
      <div class="admin-sidebar-logo">
        <div class="logo-icon">学</div>
        <div>
          <div class="logo-text">DSE 学情问诊</div>
          <div class="logo-sub">AI Intelligent System</div>
        </div>
      </div>

      <nav class="admin-sidebar-nav">
        <div class="admin-nav-group">
          <div class="admin-nav-group-title">教学管理</div>
          <router-link to="/admin" class="admin-nav-item" :class="{ active: isActive('/admin') }" @click="closeSidebar" title="数据看板">
            <span class="nav-icon">📊</span> <span class="nav-label">数据看板</span>
          </router-link>
          <router-link to="/admin/behavior" class="admin-nav-item" :class="{ active: isActive('/admin/behavior') }" @click="closeSidebar" title="课堂表现">
            <span class="nav-icon">👥</span> <span class="nav-label">课堂表现</span>
          </router-link>
          <router-link to="/admin/discipline" class="admin-nav-item" :class="{ active: isActive('/admin/discipline') }" @click="closeSidebar" title="纪律台账">
            <span class="nav-icon">⚖️</span> <span class="nav-label">纪律台账</span>
          </router-link>
          <router-link to="/admin/phone" class="admin-nav-item" :class="{ active: isActive('/admin/phone') }" @click="closeSidebar" title="手机管理">
            <span class="nav-icon">📱</span> <span class="nav-label">手机管理</span>
          </router-link>
          <router-link to="/admin/attendance" class="admin-nav-item" :class="{ active: isActive('/admin/attendance') }" @click="closeSidebar" title="考勤请假">
            <span class="nav-icon">✓</span> <span class="nav-label">考勤请假</span>
          </router-link>
        </div>

        <div class="admin-nav-group">
          <div class="admin-nav-group-title">学生管理</div>
          <router-link to="/admin/students" class="admin-nav-item" :class="{ active: isActive('/admin/students') }" @click="closeSidebar" title="学生信息">
            <span class="nav-icon">👨‍🎓</span> <span class="nav-label">学生信息</span>
          </router-link>
          <router-link to="/admin/reports" class="admin-nav-item" :class="{ active: isActive('/admin/reports') }" @click="closeSidebar" title="成长日报">
            <span class="nav-icon">📋</span> <span class="nav-label">成长日报</span>
          </router-link>
          <router-link to="/admin/counseling" class="admin-nav-item" :class="{ active: isActive('/admin/counseling') }" @click="closeSidebar" title="心理辅导">
            <span class="nav-icon">💬</span> <span class="nav-label">心理辅导</span>
          </router-link>
        </div>

        <div class="admin-nav-group">
          <div class="admin-nav-group-title">课程与课表</div>
          <router-link to="/admin/timetable" class="admin-nav-item" :class="{ active: isActive('/admin/timetable') }" @click="closeSidebar" title="课表管理">
            <span class="nav-icon">📅</span> <span class="nav-label">课表管理</span>
          </router-link>
          <router-link to="/admin/courses" class="admin-nav-item" :class="{ active: isActive('/admin/courses') }" @click="closeSidebar" title="课程维护">
            <span class="nav-icon">📖</span> <span class="nav-label">课程维护</span>
          </router-link>
        </div>

        <div class="admin-nav-group">
          <div class="admin-nav-group-title">作业系统</div>
          <router-link to="/admin/homework" class="admin-nav-item" :class="{ active: isActive('/admin/homework') }" @click="closeSidebar" title="作业管理">
            <span class="nav-icon">📝</span> <span class="nav-label">作业管理</span>
          </router-link>
        </div>

        <div class="admin-nav-group">
          <div class="admin-nav-group-title">家长会</div>
          <router-link to="/admin/parent-conference" class="admin-nav-item" :class="{ active: isActive('/admin/parent-conference') }" @click="closeSidebar" title="家长会预约">
            <span class="nav-icon">👨‍👩‍👧</span> <span class="nav-label">家长会预约</span>
          </router-link>
          <router-link to="/admin/conference" class="admin-nav-item" :class="{ active: isActive('/admin/conference') }" @click="closeSidebar" title="家长会准备">
            <span class="nav-icon">📋</span> <span class="nav-label">家长会准备</span>
          </router-link>
        </div>

        <div class="admin-nav-group">
          <div class="admin-nav-group-title">试卷与题库</div>
          <router-link to="/admin/exam" class="admin-nav-item" :class="{ active: isActive('/admin/exam') }" @click="closeSidebar" title="试卷错题">
            <span class="nav-icon">📄</span> <span class="nav-label">试卷错题</span>
          </router-link>
          <router-link to="/admin/question-bank" class="admin-nav-item" :class="{ active: isActive('/admin/question-bank') }" @click="closeSidebar" title="题库中心">
            <span class="nav-icon">📚</span> <span class="nav-label">题库中心</span>
          </router-link>
        </div>

        <div class="admin-nav-group">
          <div class="admin-nav-group-title">智能系统</div>
          <router-link to="/admin/course-feedback" class="admin-nav-item" :class="{ active: isActive('/admin/course-feedback') }" @click="closeSidebar" title="课堂反馈">
            <span class="nav-icon">📝</span> <span class="nav-label">课堂反馈</span>
          </router-link>
          <router-link to="/admin/questions" class="admin-nav-item" :class="{ active: isActive('/admin/questions') }" @click="closeSidebar" title="智能出题">
            <span class="nav-icon">🎯</span> <span class="nav-label">智能出题</span>
          </router-link>
          <router-link to="/admin/voice" class="admin-nav-item" :class="{ active: isActive('/admin/voice') }" @click="closeSidebar" title="语音记录">
            <span class="nav-icon">🎙️</span> <span class="nav-label">语音记录</span>
          </router-link>
        </div>

        <div class="admin-nav-group">
          <div class="admin-nav-group-title">系统设置</div>
          <router-link to="/admin/settings" class="admin-nav-item" :class="{ active: isActive('/admin/settings') }" @click="closeSidebar" title="系统设置">
            <span class="nav-icon">⚙️</span> <span class="nav-label">系统设置</span>
          </router-link>
          <router-link to="/admin/config" class="admin-nav-item" :class="{ active: isActive('/admin/config') }" @click="closeSidebar" title="系统配置中心">
            <span class="nav-icon">🔧</span> <span class="nav-label">系统配置中心</span>
          </router-link>
        </div>
      </nav>

      <div class="admin-sidebar-footer">
        <span style="font-size:10px;color:var(--admin-text-muted)">v1.0.0 · 张老师</span>
      </div>
    </aside>

    <!-- Main -->
    <div class="admin-main" :class="{ 'sidebar-collapsed': store.sidebarCollapsed }">
      <header class="admin-header">
        <div class="admin-header-left">
          <button class="admin-sidebar-toggle" @click="store.toggleSidebar()">
            ☰
          </button>
          <div class="breadcrumb">
            学情问诊 <span style="margin:0 6px;color:var(--admin-text-muted)">/</span> <span>{{ pageTitle }}</span>
          </div>
        </div>
        <div class="admin-header-right">
          <button class="header-btn" title="全屏" @click="toggleFullscreen">
            ⛶
          </button>
          <el-dropdown trigger="click" size="small">
            <button class="header-btn" title="外观与水印">🎨</button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <div style="display:flex;align-items:center;gap:8px;font-size:12px">
                    <span>主题</span>
                    <el-switch :model-value="store.theme === 'light'" size="small" active-text="浅" inactive-text="深" @change="(v) => store.setTheme(v ? 'light' : 'dark')" />
                  </div>
                </el-dropdown-item>
                <el-dropdown-item>
                  <div style="display:flex;align-items:center;gap:8px;font-size:12px">
                    <span>水印</span>
                    <el-switch :model-value="watermarkEnabled" size="small" @change="toggleWatermark" />
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided>
                  <span style="font-size:12px;cursor:pointer" @click="$router.push('/admin/settings')">⚙️ 更多设置</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <button class="header-btn" title="消息">
            🔔<span class="dot"></span>
          </button>
          <button class="header-btn" title="切换至学生端" @click="$router.push('/portal')">
            👁️
          </button>
          <div class="admin-avatar" @click="handleLogout">
            <div class="avatar-img">张</div>
            <div class="avatar-info">
              <div class="avatar-name">张老师</div>
              <div class="avatar-role">班主任</div>
            </div>
          </div>
        </div>
      </header>

      <div class="admin-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { getWatermarkConfig, saveWatermarkConfig } from '@/utils/watermark'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const sidebarOpen = ref(false)

const watermarkConfig = ref(getWatermarkConfig())
const watermarkEnabled = computed(() => watermarkConfig.value.enabled)

function toggleWatermark(v) {
  watermarkConfig.value.enabled = v
  saveWatermarkConfig({ ...watermarkConfig.value })
}

const pageTitles = {
  Dashboard: '数据看板', Timetable: '课表管理', Behavior: '课堂表现',
  Homework: '作业管理', Discipline: '纪律台账', Phone: '手机管理',
  Attendance: '考勤请假', Reports: '成长日报', Exam: '试卷错题',
  Questions: '智能出题', Counseling: '心理辅导', Conference: '家长会准备', Voice: '语音记录',
  StudentManagement: '学生信息管理', CourseManagement: '课程维护', CourseFeedback: '课堂反馈',
  ParentConference: '家长会预约', QuestionBank: '题库中心', Settings: '系统设置'
}

const pageTitle = computed(() => pageTitles[route.name] || '数据看板')

function isActive(path) {
  return route.path === path || (path !== '/admin' && route.path.startsWith(path))
}

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function handleLogout() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  router.push('/login')
}
</script>

<style scoped>
.admin-sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 199;
}

@media (max-width: 768px) {
  .admin-sidebar-overlay {
    display: block;
  }
}
</style>
