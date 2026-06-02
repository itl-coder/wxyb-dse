<template>
  <div class="admin-layout" :data-theme="store.theme">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="admin-sidebar-overlay" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ open: sidebarOpen, collapsed: store.sidebarCollapsed }">
      <!-- Logo -->
      <div class="admin-sidebar-logo" @click="$router.push('/admin')" title="返回管理后台首页">
        <div class="logo-icon">学</div>
        <transition name="fade">
          <div v-show="!store.sidebarCollapsed">
            <div class="logo-text">DSE AI 学情问诊</div>
            <div class="logo-sub">AI Intelligent System</div>
          </div>
        </transition>
      </div>

      <el-menu :default-active="route.path" :collapse="store.sidebarCollapsed" :router="true"
        :unique-opened="true" background-color="transparent"
        text-color="var(--admin-text-secondary)" active-text-color="var(--color-primary-400)"
        class="admin-menu">
        <!-- 🕐 最近访问 -->
        <el-menu-item-group v-if="recentItems.length > 0 && !store.sidebarCollapsed" title="🕐 最近访问">
          <el-menu-item v-for="item in recentItems" :key="'recent-' + item.menuKey" :index="item.route"
            @click="closeSidebar">
            <i class="menu-icon-badge">{{ getMenuIcon(item.icon) }}</i>
            <span class="menu-full-label">{{ item.label }}</span>
          </el-menu-item>
        </el-menu-item-group>

        <!-- 动态菜单 — 直接消费后端 /system/menu/tree 原始树 -->
        <template v-for="node in menuStore.serverMenuTree" :key="node.menuId">
          <el-sub-menu v-if="node.menuType === 'M' && node.visible === '0' && node.children?.length" :index="String(node.menuId)">
            <template #title>
              <i class="menu-icon-badge">{{ getMenuIcon(node.icon) }}</i>
              <span>{{ node.menuName }}</span>
            </template>
            <template v-for="child in node.children" :key="child.menuId">
              <template v-if="child.visible === '0'">
                <!-- 嵌套目录 -->
                <el-sub-menu v-if="child.menuType === 'M' && child.children?.length" :index="String(child.menuId)">
                  <template #title>
                    <i class="menu-icon-badge">{{ getMenuIcon(child.icon) }}</i>
                    <span>{{ child.menuName }}</span>
                  </template>
                  <template v-for="sub in child.children" :key="sub.menuId">
                    <el-menu-item v-if="sub.menuType === 'C' && sub.visible === '0'" :index="sub.path" @click="closeSidebar">
                      <i class="menu-icon-badge">{{ getMenuIcon(sub.icon) }}</i>
                      <span class="menu-full-label">{{ sub.menuName }}</span>
                    </el-menu-item>
                    <!-- C 下的 F 按钮 -->
                    <template v-if="sub.menuType === 'C' && sub.children">
                      <el-menu-item v-for="btn in sub.children.filter(f=>f.menuType==='F'&&f.visible==='0')"
                        :key="btn.menuId" class="menu-btn-item" @click="closeSidebar">
                        <span class="menu-full-label">{{ btn.menuName }}</span>
                      </el-menu-item>
                    </template>
                  </template>
                </el-sub-menu>
                <!-- C 菜单项 + 其 F 按钮 -->
                <template v-else-if="child.menuType === 'C'">
                  <el-menu-item :index="child.path" @click="closeSidebar">
                    <i class="menu-icon-badge">{{ getMenuIcon(child.icon) }}</i>
                    <span class="menu-full-label">{{ child.menuName }}</span>
                  </el-menu-item>
                  <el-menu-item v-for="btn in (child.children||[]).filter(f=>f.menuType==='F'&&f.visible==='0')"
                    :key="btn.menuId" class="menu-btn-item" @click="closeSidebar">
                    <span class="menu-full-label">{{ btn.menuName }}</span>
                  </el-menu-item>
                </template>
              </template>
            </template>
          </el-sub-menu>
          <el-menu-item v-else-if="node.menuType === 'C' && node.visible === '0'" :index="node.path" @click="closeSidebar">
            <i class="menu-icon-badge">{{ getMenuIcon(node.icon) }}</i>
            <span class="menu-full-label">{{ node.menuName }}</span>
          </el-menu-item>
        </template>
      </el-menu>

      <div class="admin-sidebar-footer">
        <span>v1.0.0 · {{ store.currentUser?.displayName || '管理员' }}</span>
      </div>
    </aside>

    <!-- Main -->
    <div class="admin-main" :class="{ 'sidebar-collapsed': store.sidebarCollapsed }">
      <header class="admin-header">
        <div class="admin-header-left">
          <button class="admin-sidebar-toggle" @click="handleSidebarToggle">
            ☰
          </button>
          <div class="breadcrumb">
            学情问诊 <span>/</span> <span>{{ pageTitle }}</span>
          </div>
        </div>
        <div class="admin-header-right">
          <button class="header-btn" title="全屏" @click="toggleFullscreen">⛶</button>
          <el-dropdown trigger="click" size="small">
            <button class="header-btn" title="外观与水印">🎨</button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <div class="dropdown-row">
                    <span>主题</span>
                    <el-switch :model-value="store.theme === 'light'" size="small" active-text="浅" inactive-text="深"
                      @change="(v) => store.setTheme(v ? 'light' : 'dark')" />
                  </div>
                </el-dropdown-item>
                <el-dropdown-item>
                  <div class="dropdown-row">
                    <span>水印</span>
                    <el-switch :model-value="watermarkEnabled" size="small" @change="toggleWatermark" />
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided>
                  <span class="dropdown-link" @click="$router.push('/admin/settings')">⚙️ 更多设置</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <button class="header-btn" title="消息">🔔<span class="dot"></span></button>
          <button class="header-btn" title="切换至学生端" @click="$router.push('/portal')">👁️</button>
          <button class="header-btn" title="返回前台首页" @click="$router.push('/')">🏠</button>
          <button class="header-btn header-btn-logout" title="退出登录" @click="handleLogout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span class="header-btn-label">退出</span>
          </button>
          <div class="admin-avatar">
            <div class="avatar-img">{{ store.currentUser?.displayName?.charAt(0) || '管' }}</div>
            <div class="avatar-info">
              <div class="avatar-name">{{ store.currentUser?.displayName || '管理员' }}</div>
              <div class="avatar-role">管理员</div>
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
 * AdminLayout — 管理后台布局
 * 左侧菜单 = el-menu，唯一数据源 = menuStore.dynamicMenuGroups
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useMenuStore } from '@/stores/menu'
import { settingsService } from '@/services/dataService'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const menuStore = useMenuStore()
const sidebarOpen = ref(false)

// ==================== 图标映射（UI 呈现，非假数据） ====================
const iconMap = {
  dashboard: '📊', timetable: '📅', homework: '📝', handover: '🤝',
  behavior: '👥', discipline: '⚖️', phone: '📱', attendance: '✓',
  students: '👨‍🎓', reports: '📋', counseling: '💬',
  exam: '📄', questions: '🎯', 'question-bank': '📚', 'exam-tips': '💡', 'exam-seat': '🪑',
  conference: '📋', 'course-feedback': '📝', 'parent-conference': '👨‍👩‍👧', voice: '🎙️',
  'ai-skills': '🛠️', 'ai-excel': '📊', 'ai-tools': '💻', 'ai-quotes': '💬', 'ai-prompts': '📝',
  courses: '📖', settings: '⚙️', config: '🔧', users: '👤', roles: '🛡️', menus: '📋',
  common: '⭐', teaching: '📖', student: '👨‍🎓', communication: '💬', 'ai-data': '🤖',
  course: '📖'
}
function getMenuIcon(icon) {
  return iconMap[icon] || (icon ? icon.charAt(0).toUpperCase() : '●')
}

// ==================== Watermark ====================
const watermarkConfig = ref(settingsService.get())
const watermarkEnabled = computed(() => watermarkConfig.value.watermarkEnabled)
function toggleWatermark(v) {
  watermarkConfig.value.watermarkEnabled = v
  settingsService.save({ watermarkEnabled: v })
}

// ==================== 收藏 & 最近 — 与主导航去重 ====================
const mainMenuPaths = computed(() => {
  const paths = new Set()
  function walk(nodes) {
    if (!nodes) return
    for (const n of nodes) {
      if (n.path) paths.add(n.path)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(menuStore.serverMenuTree)
  return paths
})

const favoriteItems = computed(() =>
  menuStore.getFavoriteMenuItems().filter(m => !mainMenuPaths.value.has(m.route))
)
const recentItems = computed(() =>
  menuStore.getRecentMenuItems()
    .filter(m => !menuStore.isFavorite(m.route) && !mainMenuPaths.value.has(m.route))
    .slice(0, 5)
)

// ==================== 页面标题 — 从后端菜单树查找 ====================
const pageTitle = computed(() => {
  const node = menuStore.flatPathMap[route.path]
  return node?.menuName || '数据看板'
})

// ==================== 页面追踪 ====================
onMounted(() => menuStore.trackPageAccess(route.path))
watch(() => route.path, (path) => menuStore.trackPageAccess(path))

// ==================== Sidebar ====================
function handleSidebarToggle() {
  if (window.innerWidth <= 1200) {
    sidebarOpen.value = !sidebarOpen.value
  } else {
    store.toggleSidebar()
  }
}
function closeSidebar() { sidebarOpen.value = false }
function toggleFullscreen() {
  document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
}
function handleLogout() {
  store.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ==================== Overlay ==================== */
.admin-sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 199;
}

@media (max-width: 768px) {
  .admin-sidebar-overlay {
    display: block;
  }
}

/* ==================== Sidebar ==================== */
.admin-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  background: var(--admin-bg-secondary, #131B2B);
  border-right: 1px solid var(--admin-border, rgba(99, 102, 241, 0.08));
  display: flex;
  flex-direction: column;
  z-index: 200;
  transition: width 0.3s;
  overflow-y: auto;
  overflow-x: hidden;
}

.admin-sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.logo-icon {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.logo-text {
  font-size: 14px;
  font-weight: 700;
  color: var(--admin-text-primary, #e0e6f0);
  white-space: nowrap;
}

.logo-sub {
  font-size: 9px;
  color: var(--admin-text-muted, rgba(148, 163, 184, 0.4));
  letter-spacing: 1px;
  white-space: nowrap;
}

/* ==================== el-menu 覆盖 ==================== */
.admin-menu {
  flex: 1;
  border-right: none !important;
  padding: 4px 8px;
}

.admin-menu :deep(.el-menu-item),
.admin-menu :deep(.el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  border-radius: 8px;
  margin: 1px 0;
  font-size: var(--text-sm, 13px);
}

.admin-menu :deep(.el-menu-item:hover),
.admin-menu :deep(.el-sub-menu__title:hover) {
  background: var(--admin-hover, rgba(99, 102, 241, 0.08)) !important;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.08)) !important;
  font-weight: 600;
}

.admin-menu :deep(.el-menu-item-group__title) {
  padding: 12px 12px 4px;
  font-size: 10px;
  color: var(--admin-text-muted, rgba(148, 163, 184, 0.35));
  letter-spacing: 1px;
}

/* 暗黑模式 el-menu 全覆盖 */
.admin-menu :deep(.el-sub-menu__title),
.admin-menu :deep(.el-menu-item) {
  color: var(--admin-text-secondary, #94a3b8) !important;
}
/* 弹出子菜单（flyout）暗黑背景 */
.admin-layout :deep(.el-menu--popup),
.admin-layout :deep(.el-popper.is-light .el-menu--popup) {
  background: var(--admin-bg-secondary, #131B2B) !important;
  border: 1px solid var(--admin-border, rgba(99,102,241,0.1)) !important;
}
.admin-layout :deep(.el-menu--popup .el-menu-item) {
  background: transparent !important;
  color: var(--admin-text-secondary, #94a3b8) !important;
}
.admin-layout :deep(.el-menu--popup .el-menu-item:hover) {
  background: var(--admin-hover, rgba(99,102,241,0.1)) !important;
  color: #cbd5e1 !important;
}
/* ===== 亮色主题覆盖 ===== */
.admin-layout[data-theme="light"] .admin-sidebar { background: #f8f9fc; border-right-color: #e8ecf2; }
.admin-layout[data-theme="light"] .admin-sidebar-logo .logo-text { color: #1e1b4b; }
.admin-layout[data-theme="light"] .admin-sidebar-logo .logo-sub { color: #8890a8; }
.admin-layout[data-theme="light"] .admin-sidebar-footer { border-top-color: #e8ecf2; }
.admin-layout[data-theme="light"] .admin-sidebar-footer span { color: #8890a8; }
.admin-layout[data-theme="light"] .admin-menu :deep(.el-sub-menu__title),
.admin-layout[data-theme="light"] .admin-menu :deep(.el-menu-item) { color: #4a4a5e !important; }
.admin-layout[data-theme="light"] .admin-menu :deep(.el-menu-item:hover),
.admin-layout[data-theme="light"] .admin-menu :deep(.el-sub-menu__title:hover) { background: rgba(99,102,241,0.06) !important; color: #312e81 !important; }
.admin-layout[data-theme="light"] .admin-menu :deep(.el-menu-item.is-active) { background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.06)) !important; color: #4338ca !important; }
.admin-layout[data-theme="light"] .admin-menu :deep(.el-menu-item-group__title) { color: #8890a8; }
.admin-layout[data-theme="light"] .menu-icon-badge { filter: none; }
.admin-layout[data-theme="light"] :deep(.el-menu--popup) { background: #fff !important; border-color: #e5e7eb !important; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.admin-layout[data-theme="light"] :deep(.el-menu--popup .el-menu-item) { color: #4a4a5e !important; }
.admin-layout[data-theme="light"] :deep(.el-menu--popup .el-menu-item:hover) { background: rgba(99,102,241,0.06) !important; color: #312e81 !important; }
.admin-layout[data-theme="light"] .admin-main { background: #f5f6fa; }
.admin-layout[data-theme="light"] .admin-header { background: rgba(255,255,255,0.9); border-bottom-color: #e8ecf2; }
.admin-layout[data-theme="light"] .breadcrumb { color: #78788e; }
.admin-layout[data-theme="light"] .breadcrumb span:last-child { color: #312e81; }
.admin-layout[data-theme="light"] .header-btn { color: #78788e; }
.admin-layout[data-theme="light"] .header-btn:hover { background: rgba(99,102,241,0.06); color: #4f46e5; }
.admin-layout[data-theme="light"] .avatar-name { color: #312e81; }
.admin-layout[data-theme="light"] .avatar-role { color: #8890a8; }
.admin-layout[data-theme="light"] .admin-sidebar-toggle { color: #78788e; }
.admin-layout[data-theme="light"] .admin-sidebar-toggle:hover { background: rgba(99,102,241,0.06); color: #4f46e5; }

/* 菜单图标：始终可见 */
i.menu-icon-badge {
  display: inline-flex;
  width: 28px; height: 28px;
  align-items: center; justify-content: center;
  font-size: 14px; font-style: normal;
  border-radius: 6px;
  flex-shrink: 0;
  margin-right: 10px;
}
.el-menu--collapse .menu-icon-badge { margin-right: 0; }
.el-menu--collapse .menu-full-label { display: none; }

.admin-sidebar-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--admin-border, rgba(99, 102, 241, 0.06));
  flex-shrink: 0;
}

.admin-sidebar-footer span {
  font-size: 10px;
  color: var(--admin-text-muted, rgba(148, 163, 184, 0.3));
}

/* collapse */
.admin-sidebar.collapsed {
  width: 64px;
}

.admin-sidebar.collapsed .admin-sidebar-logo {
  justify-content: center;
  padding: 20px 12px 16px;
}

/* ==================== Main ==================== */
.admin-main {
  margin-left: 260px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s;
  background: var(--admin-bg, #0f1419);
}

.admin-main.sidebar-collapsed {
  margin-left: 64px;
}

/* ==================== Header ==================== */
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: var(--admin-bg-secondary, #131B2B);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--admin-border, rgba(99, 102, 241, 0.06));
  position: sticky;
  top: 0;
  z-index: 10;
}

.admin-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.admin-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.admin-sidebar-toggle {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--admin-text-secondary, #94a3b8);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-sidebar-toggle:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #cbd5e1;
}

.breadcrumb {
  font-size: var(--text-sm, 13px);
  color: var(--admin-text-secondary, #94a3b8);
}

.breadcrumb span:last-child {
  color: var(--admin-text-primary, #e0e6f0);
}

.header-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--admin-text-secondary, #94a3b8);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s;
}

.header-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #cbd5e1;
}

.header-btn .dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
}

.header-btn-logout {
  gap: 6px;
  width: auto;
  padding: 0 10px;
}

.header-btn-label {
  font-size: 12px;
}

/* Avatar */
.admin-avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  border-radius: 10px;
  margin-left: 4px;
  cursor: default;
}

.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-700));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.avatar-info {
  line-height: 1.2;
}

.avatar-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--admin-text-primary, #e0e6f0);
}

.avatar-role {
  font-size: 10px;
  color: var(--admin-text-muted, rgba(148, 163, 184, 0.4));
}

/* Dropdown */
.dropdown-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.dropdown-link {
  font-size: 12px;
  cursor: pointer;
}

/* ==================== Content ==================== */
.admin-content {
  flex: 1;
  padding: 24px;
}

/* ==================== Transitions ==================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==================== Responsive ==================== */
@media (max-width: 1200px) {
  .admin-main {
    margin-left: 0;
  }

  .admin-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .admin-header {
    padding: 0 12px;
  }

  .admin-content {
    padding: 16px;
  }

  .avatar-info {
    display: none;
  }

  .header-btn-label {
    display: none;
  }
}
</style>

<style>
.el-menu--collapse i.menu-icon-badge { display: inline-flex !important; visibility: visible !important; margin: 0 auto !important; }
.el-menu--collapse .menu-full-label { display: none !important; }
/* 折叠时菜单项居中 */
.el-menu--collapse .el-menu-item,
.el-menu--collapse .el-sub-menu__title { justify-content: center !important; padding: 0 !important; }
/* F 按钮项 */
.menu-btn-item { height: 32px !important; line-height: 32px !important; font-size: 12px !important; padding-left: 56px !important; opacity: 0.75; }
.menu-btn-item:hover { opacity: 1; }
</style>
