<template>
  <div class="admin-layout" :data-theme="store.theme">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="admin-sidebar-overlay" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ open: sidebarOpen, collapsed: store.sidebarCollapsed }">
      <div class="admin-sidebar-logo">
        <div class="logo-icon">学</div>
        <div>
          <div class="logo-text">DSE AI 学情问诊</div>
          <div class="logo-sub">AI Intelligent System</div>
        </div>
      </div>

      <nav class="admin-sidebar-nav">
        <!-- Favorites Section -->
        <div v-if="favoriteItems.length > 0" class="admin-nav-group favorites-group">
          <div class="admin-nav-group-title">⭐ 收藏菜单</div>
          <router-link
            v-for="item in favoriteItems"
            :key="'fav-' + item.menuKey"
            :to="item.route"
            class="admin-nav-item"
            :class="{ active: isActive(item.route) }"
            @click="closeSidebar"
            :title="item.label"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
            <button class="nav-fav-toggle faved" @click.prevent="store.toggleFavorite(item.menuKey)" title="取消收藏">⭐</button>
          </router-link>
        </div>

        <!-- Recent Access Section -->
        <div v-if="recentItems.length > 0" class="admin-nav-group recent-group">
          <div class="admin-nav-group-title">🕐 最近访问</div>
          <router-link
            v-for="item in recentItems"
            :key="'recent-' + item.menuKey"
            :to="item.route"
            class="admin-nav-item"
            :class="{ active: isActive(item.route) }"
            @click="closeSidebar"
            :title="item.label"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </div>

        <template v-for="group in groupedMenuItems" :key="group.group">
          <div class="admin-nav-group" v-if="group.items.length > 0">
            <div class="admin-nav-group-title">{{ group.group }}</div>
            <template v-for="item in group.items" :key="item.menuKey">
              <!-- Parent with children: expandable -->
              <div v-if="item.children && item.children.length" class="admin-nav-parent">
                <div
                  class="admin-nav-item admin-nav-parent-toggle"
                  :class="{ expanded: expandedMenus.has(item.menuKey) }"
                  @click="toggleExpand(item.menuKey)"
                >
                  <span class="nav-icon">{{ item.icon }}</span>
                  <span class="nav-label">{{ item.label }}</span>
                  <span class="nav-expand-icon">{{ expandedMenus.has(item.menuKey) ? '▾' : '▸' }}</span>
                </div>
                <div v-show="expandedMenus.has(item.menuKey)" class="admin-nav-children">
                  <router-link
                    v-for="child in item.children"
                    :key="child.menuKey"
                    :to="child.route"
                    class="admin-nav-item admin-nav-child"
                    :class="{ active: isActive(child.route) }"
                    @click="closeSidebar"
                    :title="child.label"
                  >
                    <span class="nav-icon">{{ child.icon }}</span>
                    <span class="nav-label">{{ child.label }}</span>
                    <button
                      class="nav-fav-toggle"
                      :class="{ faved: store.isFavorite(child.menuKey) }"
                      @click.prevent="store.toggleFavorite(child.menuKey)"
                      :title="store.isFavorite(child.menuKey) ? '取消收藏' : '添加到收藏'"
                    >⭐</button>
                  </router-link>
                </div>
              </div>
              <!-- Leaf item: direct router-link -->
              <router-link
                v-else
                :to="item.route"
                class="admin-nav-item"
                :class="{ active: isActive(item.route) }"
                @click="closeSidebar"
                :title="item.label"
              >
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label">{{ item.label }}</span>
                <button
                  class="nav-fav-toggle"
                  :class="{ faved: store.isFavorite(item.menuKey) }"
                  @click.prevent="store.toggleFavorite(item.menuKey)"
                  :title="store.isFavorite(item.menuKey) ? '取消收藏' : '添加到收藏'"
                >⭐</button>
              </router-link>
            </template>
          </div>
        </template>
      </nav>

      <div class="admin-sidebar-footer">
        <span style="font-size:10px;color:var(--admin-text-muted)">v1.0.0 · {{ store.currentUser?.displayName || '管理员' }}</span>
      </div>
    </aside>

    <!-- Main -->
    <div class="admin-main" :class="{ 'sidebar-collapsed': store.sidebarCollapsed }">
      <header class="admin-header">
        <div class="admin-header-left">
          <button class="admin-sidebar-toggle" @click="handleSidebarToggle()">
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
          <button class="header-btn header-btn-logout" title="退出登录" @click="handleLogout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span class="header-btn-label">退出</span>
          </button>
          <div class="admin-avatar">
            <div class="avatar-img">{{ store.currentUser?.displayName?.charAt(0) || '管' }}</div>
            <div class="avatar-info">
              <div class="avatar-name">{{ store.currentUser?.displayName || '管理员' }}</div>
              <div class="avatar-role">{{ store.currentRole?.name || '' }}</div>
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
/**
 * 模块：AdminLayout
 * 功能：管理后台整体布局，包含可折叠侧边栏菜单、自动展开当前路由所属菜单组、移动端适配
 * 使用位置：router 中 admin 相关路由的父级布局组件
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { settingsService, MENU_DEFINITIONS, MENU_GROUP_ORDER } from '@/services/dataService'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const sidebarOpen = ref(false)
const expandedMenus = ref(new Set())

// Auto-expand parent menu when navigating to a child route
watch(() => route.path, (path) => {
  for (const item of MENU_DEFINITIONS) {
    if (item.children) {
      const hasActiveChild = item.children.some(c => path.startsWith(c.route))
      if (hasActiveChild) {
        expandedMenus.value.add(item.menuKey)
      }
    }
  }
}, { immediate: true })

function toggleExpand(menuKey) {
  if (expandedMenus.value.has(menuKey)) {
    expandedMenus.value.delete(menuKey)
  } else {
    expandedMenus.value.add(menuKey)
  }
}

const watermarkConfig = ref(settingsService.get())
const watermarkEnabled = computed(() => watermarkConfig.value.watermarkEnabled)

function toggleWatermark(v) {
  watermarkConfig.value.watermarkEnabled = v
  settingsService.save({ watermarkEnabled: v })
}

const pageTitles = {
  Dashboard: '数据看板', Timetable: '课表管理', Behavior: '课堂表现',
  Homework: '作业管理', ShiftHandover: '早晚班交接',
  Discipline: '纪律台账', Phone: '手机管理',
  Attendance: '考勤请假', Reports: '成长日报', Exam: '试卷错题',
  Questions: '智能出题', Counseling: '心理辅导', Conference: '家长会准备', Voice: '语音记录',
  StudentManagement: '学生信息管理', CourseManagement: '课程维护', CourseFeedback: '课堂反馈',
  ParentConference: '家长会预约', QuestionBank: '题库中心', ExamTips: '做题技巧',
  Settings: '系统设置', ConfigCenter: '配置中心',
  UserManagement: '用户管理', RoleManagement: '角色管理',
  AISkills: 'Skills技能收录', AIFunctions: 'Excel公式收录', AITools: '软件工具收录',
  AIQuotes: '名言语录收录', AIPrompts: 'Prompt收录',
  ExamSeat: '考试座位安排'
}

const groupedMenuItems = computed(() => {
  const visible = store.getVisibleMenuItems()
  const groups = {}
  visible.forEach(item => {
    if (!groups[item.group]) groups[item.group] = []
    groups[item.group].push(item)
  })
  return MENU_GROUP_ORDER.map(g => ({ group: g, items: groups[g] || [] })).filter(g => g.items.length > 0)
})

// Favorites and recent menus (dedup against main menu to avoid duplicates)
const visibleMenuKeys = computed(() => new Set(store.getVisibleMenuItems().map(m => m.menuKey)))
const favoriteItems = computed(() => {
  return store.getFavoriteMenuItems()
    .filter(m => !visibleMenuKeys.value.has(m.menuKey))
})
const recentItems = computed(() => {
  return store.getRecentMenuItems()
    .filter(m => !store.isFavorite(m.menuKey) && !visibleMenuKeys.value.has(m.menuKey))
    .slice(0, 5)
})

// Watch role changes and refresh
watch(() => store.currentRole, () => {
  // Force sidebar re-render when role changes
}, { deep: true })

// Track page for recent access
onMounted(() => {
  store.trackPageAccess(route.name)
})
watch(() => route.name, (name) => {
  store.trackPageAccess(name)
})

const pageTitle = computed(() => pageTitles[route.name] || '数据看板')

function isActive(path) {
  return route.path === path || (path !== '/admin' && route.path.startsWith(path))
}

function handleSidebarToggle() {
  if (window.innerWidth <= 1200) {
    sidebarOpen.value = !sidebarOpen.value
  } else {
    store.toggleSidebar()
  }
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
  store.logout()
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
