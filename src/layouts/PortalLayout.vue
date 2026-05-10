<template>
  <div class="portal-layout">
    <header class="portal-header">
      <div class="portal-header-left">
        <div class="portal-logo">DSE 学情</div>
        <nav class="portal-nav">
          <router-link to="/portal" class="portal-nav-item" :class="{ active: $route.path === '/portal' }">首页</router-link>
          <router-link to="/portal/my-performance" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-performance' }">我的学情</router-link>
          <router-link to="/portal/my-homework" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-homework' }">我的作业</router-link>
          <router-link to="/portal/my-exams" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-exams' }">我的考试</router-link>
          <router-link to="/portal/my-mistakes" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-mistakes' }">错题本</router-link>
          <router-link to="/portal/my-tips" class="portal-nav-item" :class="{ active: $route.path === '/portal/my-tips' }">做题技巧</router-link>
        </nav>
      </div>
      <div class="portal-header-right">
        <span style="font-size:11px;opacity:0.5;cursor:pointer" title="测试切换" @click="cycleStudent">🔄</span>
        <button class="portal-btn" @click="$router.push('/')">📚 学习系统</button>
        <button class="portal-btn portal-btn-logout" @click="handleLogout">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          退出
        </button>
        <div class="portal-user">
          <div class="portal-avatar">{{ store.currentStudent?.name?.charAt(0) || '?' }}</div>
          <span>{{ store.currentStudent?.name || '未选择' }}</span>
        </div>
      </div>
    </header>
    <main class="portal-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { studentService } from '@/services/dataService'

const router = useRouter()
const store = useAppStore()
const studentList = ref([])

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
}

.portal-nav {
  display: flex;
  gap: 2px;
}

.portal-nav-item {
  padding: 6px 14px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 13px;
  border-radius: 6px;
  transition: all 0.2s;
}

.portal-nav-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
.portal-nav-item.active { background: rgba(99,102,241,0.25); color: #c7d2fe; }

.portal-header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

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
}

.portal-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
}
</style>
