<template>
  <div class="portal-layout">
    <header class="portal-header">
      <div class="portal-header-left">
        <div class="portal-logo">DSE 学情</div>
        <button class="portal-nav-toggle" @click="navOpen = !navOpen" :aria-label="navOpen ? '关闭菜单' : '打开菜单'">
          <span class="nav-toggle-bar" :class="{ open: navOpen }"></span>
        </button>
        <nav class="portal-nav" :class="{ open: navOpen }">
          <router-link to="/portal" class="portal-nav-item" :class="{ active: $route.path === '/portal' }" @click="navOpen = false">首页</router-link>
          <router-link to="/portal/my-performance" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-performance' }" @click="navOpen = false">我的学情</router-link>
          <router-link to="/portal/my-homework" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-homework' }" @click="navOpen = false">我的作业</router-link>
          <router-link to="/portal/my-exams" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-exams' }" @click="navOpen = false">我的考试</router-link>
          <router-link to="/portal/my-mistakes" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-mistakes' }" @click="navOpen = false">错题本</router-link>
          <router-link to="/portal/my-tips" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-tips' }" @click="navOpen = false">做题技巧</router-link>
          <router-link to="/portal/my-exam-seat" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-exam-seat' }" @click="navOpen = false">考场座位</router-link>
        </nav>
      </div>
      <div class="portal-header-right">
        <button class="portal-theme-btn" @click="toggleTheme" :title="store.theme === 'dark' ? '切换浅色模式' : '切换深色模式'">
          <svg v-if="store.theme === 'dark'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
        <span class="portal-cycle-btn" title="切换学生" @click="cycleStudent">🔄</span>
        <button class="portal-btn portal-btn-home" @click="$router.push('/')">📚 学习系统</button>
        <button class="portal-btn portal-btn-logout" @click="handleLogout">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span class="logout-label">退出</span>
        </button>
        <div class="portal-user">
          <div class="portal-avatar">{{ store.currentStudent?.name?.charAt(0) || '?' }}</div>
          <span class="portal-user-name">{{ store.currentStudent?.name || '未选择' }}</span>
        </div>
      </div>
    </header>
    <main class="portal-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
/**
 * 模块：PortalLayout
 * 功能：学生端门户布局，含顶部导航（我的学情/作业/考试/错题本/技巧）、学生切换器、退出登录
 * 使用位置：router 中 /portal 相关路由的父级布局组件
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { studentService } from '@/services/dataService'

const router = useRouter()
const store = useAppStore()
const studentList = ref([])
const navOpen = ref(false)

function toggleTheme() {
  store.setTheme(store.theme === 'dark' ? 'light' : 'dark')
}

onMounted(() => {
  studentList.value = studentService.getAll()
  if (!store.currentStudentId && studentList.value.length > 0) {
    store.setCurrentStudentId(studentList.value[0].id)
  }
})

function cycleStudent() {
  if (studentList.value.length === 0) return
  const idx = studentList.value.findIndex(s => s.id === store.currentStudentId)
  const next = (idx + 1) % studentList.value.length
  store.setCurrentStudentId(studentList.value[next].id)
}

function handleLogout() {
  localStorage.removeItem('portal_token')
  localStorage.removeItem('portal_user')
  router.push('/portal/login')
}
</script>

<style scoped>
.portal-layout {
  min-height: 100vh;
  background: var(--bg);
  font-family: var(--font-body);
}

.portal-header {
  background: linear-gradient(135deg, #1a2e3c 0%, #2c4a5e 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.portal-header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.portal-logo {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--accent);
  flex-shrink: 0;
}

/* Hamburger toggle */
.portal-nav-toggle {
  display: none;
  width: 32px; height: 32px;
  background: none; border: none;
  cursor: pointer; padding: 6px;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}
.nav-toggle-bar,
.nav-toggle-bar::before,
.nav-toggle-bar::after {
  display: block;
  width: 18px; height: 2px;
  background: rgba(255,255,255,0.8);
  border-radius: 1px;
  transition: all 0.25s;
  position: relative;
}
.nav-toggle-bar::before { content: ''; position: absolute; top: -5px; }
.nav-toggle-bar::after  { content: ''; position: absolute; top: 5px; }
.nav-toggle-bar.open { background: transparent; }
.nav-toggle-bar.open::before { top: 0; transform: rotate(45deg); }
.nav-toggle-bar.open::after  { top: 0; transform: rotate(-45deg); }

.portal-nav {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}

.portal-nav-item {
  padding: 6px 14px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s;
  white-space: nowrap;
}

.portal-nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
.portal-nav-item.active { background: rgba(99,102,241,0.25); color: #c7d2fe; }

.portal-header-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.portal-theme-btn {
  width: 30px; height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  transition: all 0.2s;
}
.portal-theme-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

.portal-cycle-btn {
  font-size: 14px;
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.2s;
  padding: 4px;
  flex-shrink: 0;
}
.portal-cycle-btn:hover { opacity: 1; }

.portal-btn {
  padding: 5px 14px;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: rgba(255,255,255,0.8);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-body);
  white-space: nowrap;
}

.portal-btn:hover { background: rgba(255,255,255,0.1); }

.portal-btn-logout {
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0.6;
  border-color: rgba(255,255,255,0.15) !important;
}
.portal-btn-logout:hover {
  opacity: 1;
  background: rgba(239,68,68,0.12) !important;
  border-color: rgba(239,68,68,0.25) !important;
  color: #fca5a5 !important;
}

.portal-user {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  flex-shrink: 0;
}

.portal-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #1a2e3c;
  font-weight: 600;
  flex-shrink: 0;
}

.portal-user-name {
  white-space: nowrap;
}

.portal-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}

/* === Tablet: 900px and below === */
@media (max-width: 900px) {
  .portal-header { padding: 0 14px; }
  .portal-header-left { gap: 12px; }
  .portal-header-right { gap: 8px; }

  .portal-nav-item { padding: 5px 10px; font-size: 12px; }

  .portal-btn-home { display: none; }
  .portal-user-name { display: none; }
  .portal-btn { padding: 5px 10px; font-size: 11px; }
  .portal-content { padding: 14px; }
}

/* === Mobile: 640px and below === */
@media (max-width: 640px) {
  .portal-header { height: 48px; padding: 0 12px; }
  .portal-header-left { gap: 8px; }

  .portal-nav-toggle { display: flex; }

  .portal-nav {
    position: fixed;
    top: 48px;
    left: 0;
    right: 0;
    background: #1a2e3c;
    flex-direction: column;
    gap: 0;
    padding: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    transform: translateY(-120%);
    opacity: 0;
    transition: all 0.25s ease;
    z-index: 99;
  }
  .portal-nav.open {
    transform: translateY(0);
    opacity: 1;
  }

  .portal-nav-item {
    padding: 12px 16px;
    font-size: 14px;
    border-radius: 8px;
  }

  .portal-header-right { gap: 6px; }
  .portal-btn-logout { padding: 4px 8px; }
  .logout-label { display: none; }
  .portal-cycle-btn { font-size: 13px; }
  .portal-content { padding: 10px; }
}
</style>
