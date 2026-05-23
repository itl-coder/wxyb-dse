<template>
  <header class="app-header">
    <div class="ah-inner">
      <div class="ah-brand" @click="$router.push('/')">
        <div class="ah-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/>
            <path d="m22 10-8.5 8.5a2.12 2.12 0 0 1-3-3L15 11"/>
            <path d="M12 12 8.5 8.5"/>
          </svg>
        </div>
        <div class="ah-title-group">
          <h1 class="ah-title">DSE 智能学情系统</h1>
          <p class="ah-subtitle">覆盖全科 · 可视化教学 · 精准分析</p>
        </div>
      </div>

      <nav class="ah-subjects">
        <button
          v-for="s in subjects"
          :key="s.id"
          class="ah-subject-btn"
          :class="{ active: currentSubject === s.id }"
          @click="$emit('switchSubject', s.id)"
        >
          <span class="ah-subject-icon">{{ s.icon }}</span>
          <span class="ah-subject-label">{{ s.label }}</span>
        </button>
      </nav>

      <button class="ah-theme-btn" @click="toggleTheme" :title="store.theme === 'dark' ? '切换浅色模式' : '切换深色模式'">
        <svg v-if="store.theme === 'dark'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { useAppStore } from '@/stores/app'

defineProps({
  currentSubject: { type: String, default: 'math' }
})

defineEmits(['switchSubject'])

const store = useAppStore()

function toggleTheme() {
  store.setTheme(store.theme === 'dark' ? 'light' : 'dark')
}

const subjects = [
  { id: 'math', icon: '📐', label: '数学' },
  { id: 'chinese', icon: '📝', label: '中文' },
  { id: 'physics', icon: '⚡', label: '物理' },
  { id: 'chemistry', icon: '🧪', label: '化学' }
]
</script>

<style scoped>
.app-header {
  background: linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #3730a3 100%);
  position: relative;
  overflow: hidden;
}
.app-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 80%, rgba(99, 102, 241, 0.25) 0%, transparent 55%),
    radial-gradient(ellipse at 75% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 45%),
    radial-gradient(ellipse at 60% 100%, rgba(255, 255, 255, 0.03) 0%, transparent 40%);
  pointer-events: none;
}

.ah-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 14px 28px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

/* ---- 品牌区 ---- */
.ah-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex-shrink: 0;
}
.ah-logo {
  width: 44px; height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  transition: background 0.2s;
}
.ah-brand:hover .ah-logo {
  background: rgba(255, 255, 255, 0.15);
}
.ah-title-group {
  display: flex;
  flex-direction: column;
}
.ah-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: 0.5px;
  line-height: 1.3;
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}
.ah-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
  letter-spacing: 2px;
}

/* ---- 学科切换 ---- */
.ah-subjects {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.ah-subject-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 18px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}
.ah-subject-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
}
.ah-subject-btn.active {
  background: rgba(255, 255, 255, 0.95);
  color: #312e81;
  border-color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}
.ah-subject-icon {
  font-size: 15px;
  line-height: 1;
}

/* ---- 主题切换 ---- */
.ah-theme-btn {
  width: 34px; height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}
.ah-theme-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

/* ---- 响应式 ---- */
@media (max-width: 640px) {
  .ah-inner {
    padding: 12px 16px 10px;
    gap: 12px;
  }
  .ah-logo {
    width: 36px; height: 36px;
    border-radius: 10px;
  }
  .ah-logo svg { width: 22px; height: 22px; }
  .ah-title { font-size: 16px; }
  .ah-subtitle { font-size: 10px; letter-spacing: 1px; }
  .ah-subjects { width: 100%; justify-content: center; }
  .ah-subject-btn { padding: 5px 12px; font-size: 11px; gap: 3px; }
  .ah-subject-icon { font-size: 13px; }
}
</style>
