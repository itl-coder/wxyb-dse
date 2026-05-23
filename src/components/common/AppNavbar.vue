<template>
  <nav class="app-navbar" ref="navbarRef">
    <div class="an-inner">
      <!-- 快捷入口 -->
      <div class="an-group">
        <router-link to="/" class="an-link an-link-home">总览</router-link>
        <router-link to="/practice" class="an-link">练习</router-link>
        <router-link to="/mistakes" class="an-link">错题</router-link>
        <router-link to="/knowledge" class="an-link">知识库</router-link>
      </div>

      <span class="an-divider"></span>

      <!-- 专题导航（可横向滚动） -->
      <div class="an-group an-topics">
        <router-link
          v-for="t in topics"
          :key="t.to"
          :to="t.to"
          class="an-link an-link-topic"
        >{{ t.label }}</router-link>
      </div>

      <span class="an-current">{{ pageNames[currentPage] || '总览' }}</span>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  currentPage: { type: String, default: 'Home' }
})

const navbarRef = ref(null)

const topics = [
  { to: '/3d-geometry', label: '立体几何' },
  { to: '/trigonometry', label: '三角函数' },
  { to: '/log-exp', label: '对数指数' },
  { to: '/circle-line', label: '圆与直线' },
  { to: '/composite', label: '复合函数' },
  { to: '/locus', label: '轨迹' },
  { to: '/triangle-center', label: '四心' },
  { to: '/quadratic', label: '二次函数' },
  { to: '/sequence', label: '数列' },
  { to: '/probability', label: '概率' },
  { to: '/statistics', label: '统计' },
  { to: '/polynomial', label: '多项式' },
  { to: '/inequality', label: '不等式' },
  { to: '/numbers', label: '数与式' }
]

const pageNames = {
  Home: '总览', Geometry3D: '立体几何', Trigonometry: '三角函数',
  LogExp: '对数指数', CircleLine: '圆与直线', Composite: '复合函数',
  Locus: '轨迹', TriangleCenter: '四心',
  Quadratic: '二次函数', Sequence: '数列', Probability: '概率',
  Statistics: '统计', Polynomial: '多项式', Inequality: '不等式',
  Numbers: '数与式', Practice: '练习', Mistakes: '错题', Knowledge: '知识库',
  Chinese: '中文', Physics: '物理', Chemistry: '化学'
}
</script>

<style scoped>
.app-navbar {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(14px) saturate(1.3);
  transition: box-shadow var(--duration-normal) var(--ease-out),
              background-color var(--duration-normal) var(--ease-out);
}
[data-theme="light"] .app-navbar {
  background: rgba(255, 255, 255, 0.82);
}
[data-theme="dark"] .app-navbar {
  background: rgba(26, 29, 58, 0.88);
}
.app-navbar.scrolled {
  box-shadow: var(--shadow-sm);
}
[data-theme="light"] .app-navbar.scrolled {
  background: rgba(255, 255, 255, 0.95);
}
[data-theme="dark"] .app-navbar.scrolled {
  background: rgba(26, 29, 58, 0.95);
}

.an-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ---- 链接组 ---- */
.an-group {
  display: flex;
  align-items: center;
  gap: 2px;
}
.an-topics {
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.an-topics::-webkit-scrollbar { display: none; }

/* ---- 链接 ---- */
.an-link {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  white-space: nowrap;
  transition: all var(--duration-fast) var(--ease-out);
  font-family: inherit;
}
.an-link:hover {
  background: rgba(99, 102, 241, 0.08);
  color: var(--accent);
}
.an-link.router-link-active {
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent);
  font-weight: 600;
}

.an-link-home {
  font-weight: 600;
  color: var(--text-primary);
}
.an-link-topic {
  font-size: 11px;
  padding: 4px 10px;
}

/* ---- 分隔线 ---- */
.an-divider {
  width: 1px; height: 18px;
  background: var(--border-base);
  flex-shrink: 0;
  border-radius: 1px;
}

/* ---- 当前页面标记 ---- */
.an-current {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-warm);
  padding: 3px 10px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .an-inner {
    padding: 0 12px;
    height: 38px;
    gap: 6px;
  }
  .an-link {
    padding: 4px 8px;
    font-size: 11px;
  }
  .an-link-topic {
    font-size: 10px;
    padding: 3px 7px;
  }
  .an-divider { height: 14px; }
  .an-current { display: none; }
}
</style>
