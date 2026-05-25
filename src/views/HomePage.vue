<template>
  <div class="hp-page">
    <!-- Hero -->
    <section class="hp-hero">
      <h2 class="hp-hero-title">DSE 数学专题学习</h2>
      <p class="hp-hero-desc">选择专题进入交互式学习 · 每专题含概念讲解、可视化演示与 DSE 解题策略</p>
    </section>

    <!-- 系统入口卡片 -->
    <section class="hp-entries">
      <router-link to="/admin" class="hp-entry-card admin">
        <div class="hp-entry-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </div>
        <div class="hp-entry-body">
          <span class="hp-entry-title">管理后台</span>
          <span class="hp-entry-desc">学情问诊 · 班级管理 · AI 分析</span>
        </div>
        <span class="hp-entry-chevron">→</span>
      </router-link>

      <router-link to="/portal" class="hp-entry-card portal">
        <div class="hp-entry-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </div>
        <div class="hp-entry-body">
          <span class="hp-entry-title">学生门户</span>
          <span class="hp-entry-desc">我的学情 · 作业考试 · 错题本</span>
        </div>
        <span class="hp-entry-chevron">→</span>
      </router-link>

      <router-link v-if="showExamSeat" to="/exam-seat" class="hp-entry-card exam">
        <div class="hp-entry-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
        </div>
        <div class="hp-entry-body">
          <span class="hp-entry-title">考场座位</span>
          <span class="hp-entry-desc">考场查询 · 座位分布 · 打印</span>
        </div>
        <span class="hp-entry-chevron">→</span>
      </router-link>

      <router-link v-if="showHandover" to="/handover" class="hp-entry-card handover">
        <div class="hp-entry-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M21 5H9a4 4 0 0 0 0 8h2"/><path d="M7 23l-4-4 4-4"/><path d="M3 19h12a4 4 0 0 0 0-8h-2"/></svg>
        </div>
        <div class="hp-entry-body">
          <span class="hp-entry-title">早晚班交接</span>
          <span class="hp-entry-desc">作业收集 · 会议纪要 · 同步</span>
        </div>
        <span class="hp-entry-chevron">→</span>
      </router-link>
    </section>

    <!-- 专题模块 -->
    <div class="hp-section-label">专题模块<span class="hp-label-count">{{ mathModules.length }}</span></div>
    <section class="hp-topics">
      <router-link
        v-for="(m, idx) in mathModules"
        :key="m.id"
        :to="routeMap[m.id]"
        class="hp-topic-card"
        :style="{ animationDelay: (idx * 0.03) + 's' }"
      >
        <span class="hp-topic-icon">{{ m.icon }}</span>
        <div class="hp-topic-body">
          <span class="hp-topic-name">{{ m.name }}</span>
          <span class="hp-topic-desc">{{ m.desc }}</span>
        </div>
        <div class="hp-topic-meta">
          <span class="hp-topic-freq" :class="m.freq">{{ freqLabel(m.freq) }}</span>
          <span class="hp-topic-stars">{{ '★'.repeat(m.stars) }}</span>
        </div>
      </router-link>
    </section>

    <!-- 快捷入口 -->
    <div class="hp-section-label">快捷入口</div>
    <section class="hp-quick-links">
      <router-link to="/practice" class="hp-quick-link">
        <span class="hp-ql-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </span>
        <span class="hp-ql-text">
          <strong>练习系统</strong>
          <small>DSE 真题与模拟训练</small>
        </span>
      </router-link>
      <router-link to="/mistakes" class="hp-quick-link">
        <span class="hp-ql-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </span>
        <span class="hp-ql-text">
          <strong>经典错题</strong>
          <small>高频易错整理与解析</small>
        </span>
      </router-link>
      <router-link to="/knowledge" class="hp-quick-link">
        <span class="hp-ql-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </span>
        <span class="hp-ql-text">
          <strong>知识体系</strong>
          <small>系统化考点总结</small>
        </span>
      </router-link>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { mathModules } from '@/data/moduleMeta.js'
import { portalConfigService } from '@/services/dataService'

const showHandover = ref(true)
const showExamSeat = ref(true)

onMounted(() => {
  const cfg = portalConfigService.get()
  showHandover.value = cfg.handoverEnabled !== false
  showExamSeat.value = cfg.examSeatEnabled !== false
})

const routeMap = {
  '3d': '/3d-geometry', trig: '/trigonometry', log: '/log-exp',
  circ: '/circle-line', comp: '/composite', loc: '/locus',
  cent: '/triangle-center', quad: '/quadratic',
  seq: '/sequence', prob: '/probability', stat: '/statistics',
  poly: '/polynomial', ineq: '/inequality', num: '/numbers'
}

function freqLabel(f) {
  const m = { high: '高频', mid: '中频', low: '低频' }
  return m[f] || ''
}
</script>

<style scoped>
/* ====== 页面容器 ====== */
.hp-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 36px 24px 48px;
}

/* ====== Hero ====== */
.hp-hero {
  text-align: center;
  padding: 0 0 32px;
}

.hp-hero-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
  letter-spacing: 0.3px;
  font-family: var(--font-display);
}

.hp-hero-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 auto;
  max-width: 440px;
  line-height: 1.7;
}

/* ====== 入口卡片 ====== */
.hp-entries {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 36px;
}

.hp-entry-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s var(--ease-out);
  position: relative;
  overflow: hidden;
}

.hp-entry-card:hover { transform: translateY(-2px); }

.hp-entry-icon {
  width: 42px; height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hp-entry-body {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 3px;
}

.hp-entry-title {
  font-size: 14px; font-weight: 700;
  letter-spacing: 0.2px;
}

.hp-entry-desc {
  font-size: 12px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.hp-entry-chevron {
  font-size: 15px; font-weight: 600;
  opacity: 0; transform: translateX(-6px);
  transition: all 0.2s;
  flex-shrink: 0;
}

.hp-entry-card:hover .hp-entry-chevron {
  opacity: 1; transform: translateX(0);
}

/* Admin card — always dark */
.hp-entry-card.admin {
  background: linear-gradient(135deg, #1e1b4b, #312e81);
  color: #fff;
  box-shadow: 0 2px 12px rgba(49,46,129,0.2);
}
.hp-entry-card.admin:hover { box-shadow: 0 6px 24px rgba(49,46,129,0.35); }
.hp-entry-card.admin .hp-entry-icon { background: rgba(255,255,255,0.12); color: #fff; }
.hp-entry-card.admin .hp-entry-desc { color: rgba(255,255,255,0.6); }
.hp-entry-card.admin .hp-entry-chevron { color: rgba(255,255,255,0.5); }

/* Portal / Exam / Handover — adaptive theme */
.hp-entry-card.portal,
.hp-entry-card.exam,
.hp-entry-card.handover {
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  box-shadow: var(--shadow-light);
}
.hp-entry-card.portal:hover,
.hp-entry-card.exam:hover,
.hp-entry-card.handover:hover {
  box-shadow: var(--shadow-md);
}
.hp-entry-card.portal:hover { border-color: var(--accent); }
.hp-entry-card.exam:hover { border-color: rgba(139,92,246,0.4); }
.hp-entry-card.handover:hover { border-color: rgba(16,185,129,0.4); }

.hp-entry-card.portal .hp-entry-icon { background: rgba(99,102,241,0.08); color: #6366f1; }
.hp-entry-card.exam .hp-entry-icon { background: rgba(139,92,246,0.08); color: #8b5cf6; }
.hp-entry-card.handover .hp-entry-icon { background: rgba(16,185,129,0.08); color: #10b981; }
.hp-entry-card.portal .hp-entry-desc,
.hp-entry-card.exam .hp-entry-desc,
.hp-entry-card.handover .hp-entry-desc { color: var(--text-secondary); }
.hp-entry-card.portal .hp-entry-chevron { color: #6366f1; }
.hp-entry-card.exam .hp-entry-chevron { color: #8b5cf6; }
.hp-entry-card.handover .hp-entry-chevron { color: #10b981; }

/* ====== 区块标签 ====== */
.hp-section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hp-label-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
  background: var(--bg-warm);
  padding: 1px 8px;
  border-radius: 10px;
}

/* ====== 专题卡片 ====== */
.hp-topics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
  margin-bottom: 32px;
}

.hp-topic-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s var(--ease-out);
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  animation: hpCardIn 0.35s var(--ease-out) both;
}

@keyframes hpCardIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.hp-topic-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.hp-topic-icon {
  font-size: 22px; flex-shrink: 0;
  width: 34px; text-align: center; line-height: 1;
}

.hp-topic-body {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}

.hp-topic-name {
  font-size: 14px; font-weight: 600;
  color: var(--text-primary);
}

.hp-topic-desc {
  font-size: 12px; color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hp-topic-meta {
  display: flex; flex-direction: column;
  align-items: flex-end; gap: 4px; flex-shrink: 0;
}

.hp-topic-freq {
  font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: 5px; white-space: nowrap;
}

.hp-topic-freq.high { background: #fef2f2; color: #dc2626; }
.hp-topic-freq.mid  { background: #fffbeb; color: #b45309; }
.hp-topic-freq.low  { background: #eef2ff; color: #4f46e5; }

.hp-topic-stars {
  font-size: 10px; color: #d4a017; letter-spacing: 1px;
}

/* ====== 快捷入口 ====== */
.hp-quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.hp-quick-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s var(--ease-out);
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.hp-quick-link:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.hp-ql-icon {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: rgba(99,102,241,0.06);
  color: var(--accent);
  display: flex;
  align-items: center; justify-content: center;
  flex-shrink: 0;
}

.hp-ql-text {
  flex: 1;
  display: flex; flex-direction: column; gap: 2px;
}

.hp-ql-text strong {
  font-size: 13px; font-weight: 600;
  color: var(--text-primary);
}

.hp-ql-text small {
  font-size: 12px; color: var(--text-secondary);
}

/* ====== 响应式 ====== */
@media (max-width: 900px) {
  .hp-entries { grid-template-columns: repeat(2, 1fr); }
  .hp-topics { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
}

@media (max-width: 640px) {
  .hp-page { padding: 20px 14px 36px; }
  .hp-hero-title { font-size: 20px; }
  .hp-hero-desc { font-size: 13px; }
  .hp-entries { grid-template-columns: 1fr; gap: 8px; }
  .hp-entry-card { padding: 14px 16px; }
  .hp-topics { grid-template-columns: 1fr; gap: 8px; }
  .hp-topic-card { padding: 12px 14px; }
  .hp-quick-links { grid-template-columns: 1fr; }
}
</style>
