<template>
  <div class="hp-page">
    <!-- Hero -->
    <section class="hp-hero">
      <div class="hp-hero-badge">DSE Mathematics</div>
      <h2 class="hp-hero-title">数学专题学习</h2>
      <p class="hp-hero-desc">选择专题进入交互式学习，每专题含概念讲解、可视化演示与 DSE 解题策略</p>
      <div class="hp-hero-line"></div>
    </section>

    <!-- 系统入口卡片 -->
    <section class="hp-entries">
      <router-link to="/admin" class="hp-entry hp-entry-admin">
        <div class="hp-entry-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </div>
        <div class="hp-entry-text">
          <span class="hp-entry-title">管理后台</span>
          <span class="hp-entry-desc">学情问诊 · 班级管理 · AI 分析</span>
        </div>
        <span class="hp-entry-arrow">&rarr;</span>
      </router-link>

      <router-link to="/portal" class="hp-entry hp-entry-portal">
        <div class="hp-entry-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </div>
        <div class="hp-entry-text">
          <span class="hp-entry-title">学生门户</span>
          <span class="hp-entry-desc">我的学情 · 作业考试 · 错题本</span>
        </div>
        <span class="hp-entry-arrow">&rarr;</span>
      </router-link>

      <router-link v-if="showExamSeat" to="/exam-seat" class="hp-entry hp-entry-exam">
        <div class="hp-entry-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
        </div>
        <div class="hp-entry-text">
          <span class="hp-entry-title">考场座位</span>
          <span class="hp-entry-desc">考场查询 · 座位分布 · 打印</span>
        </div>
        <span class="hp-entry-arrow">&rarr;</span>
      </router-link>

      <router-link v-if="showHandover" to="/handover" class="hp-entry hp-entry-handover">
        <div class="hp-entry-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M21 5H9a4 4 0 0 0 0 8h2"/><path d="M7 23l-4-4 4-4"/><path d="M3 19h12a4 4 0 0 0 0-8h-2"/></svg>
        </div>
        <div class="hp-entry-text">
          <span class="hp-entry-title">早晚班交接</span>
          <span class="hp-entry-desc">作业收集 · 会议纪要 · 同步</span>
        </div>
        <span class="hp-entry-arrow">&rarr;</span>
      </router-link>
    </section>

    <!-- 专题标题 -->
    <div class="hp-section-header">
      <h3 class="hp-section-title">专题模块</h3>
      <span class="hp-section-count">{{ mathModules.length }} 个专题</span>
    </div>

    <!-- 专题卡片网格 -->
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
        <div class="hp-topic-tags">
          <span class="hp-topic-freq" :class="m.freq">{{ freqLabel(m.freq) }}</span>
          <span class="hp-topic-stars">{{ starStr(m.stars) }}</span>
        </div>
      </router-link>
    </section>

    <!-- 快捷入口 -->
    <div class="hp-section-header">
      <h3 class="hp-section-title">快捷入口</h3>
    </div>
    <section class="hp-quick-links">
      <router-link to="/practice" class="hp-quick-link">
        <span class="hp-ql-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </span>
        <div class="hp-ql-text">
          <strong>练习系统</strong>
          <small>DSE 真题与模拟训练</small>
        </div>
        <span class="hp-ql-arrow">&rarr;</span>
      </router-link>
      <router-link to="/mistakes" class="hp-quick-link">
        <span class="hp-ql-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </span>
        <div class="hp-ql-text">
          <strong>经典错题</strong>
          <small>高频易错整理与解析</small>
        </div>
        <span class="hp-ql-arrow">&rarr;</span>
      </router-link>
      <router-link to="/knowledge" class="hp-quick-link">
        <span class="hp-ql-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></svg>
        </span>
        <div class="hp-ql-text">
          <strong>知识体系</strong>
          <small>系统化考点总结</small>
        </div>
        <span class="hp-ql-arrow">&rarr;</span>
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

function starStr(n) { return '★'.repeat(n) }
</script>

<style scoped>
/* ====== 页面容器 ====== */
.hp-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

/* ====== Hero ====== */
.hp-hero {
  text-align: center;
  padding: 12px 0 32px;
}
.hp-hero-badge {
  display: inline-block;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--accent);
  background: rgba(99, 102, 241, 0.08);
  padding: 4px 14px;
  border-radius: var(--radius-full);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: var(--space-4);
}
.hp-hero-title {
  font-size: var(--text-3xl);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-2);
  letter-spacing: 0.5px;
  font-family: var(--font-display);
}
.hp-hero-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0 auto;
  max-width: 440px;
  line-height: var(--leading-relaxed);
}
.hp-hero-line {
  width: 48px; height: 3px;
  background: linear-gradient(90deg, var(--accent), var(--primary-l));
  border-radius: 2px;
  margin: var(--space-5) auto 0;
}

/* ====== 系统入口卡片 ====== */
.hp-entries {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}
.hp-entry {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 18px 20px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: all var(--duration-normal) var(--ease-out);
  position: relative;
  overflow: hidden;
}
.hp-entry:hover {
  transform: translateY(-2px);
}

/* Admin — 品牌渐变，始终深色 */
.hp-entry-admin {
  background: linear-gradient(145deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%);
  color: #fff;
  box-shadow: 0 2px 12px rgba(49, 46, 129, 0.2);
}
.hp-entry-admin:hover {
  box-shadow: 0 8px 28px rgba(49, 46, 129, 0.35);
}
.hp-entry-admin .hp-entry-icon {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.hp-entry-admin .hp-entry-desc {
  color: rgba(255, 255, 255, 0.6);
}
.hp-entry-admin .hp-entry-arrow {
  color: rgba(255, 255, 255, 0.5);
}

/* Portal / Exam / Handover — 自适应主题 */
.hp-entry-portal,
.hp-entry-exam,
.hp-entry-handover {
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  color: var(--text-primary);
  box-shadow: var(--shadow-light);
}
.hp-entry-portal:hover,
.hp-entry-exam:hover,
.hp-entry-handover:hover {
  box-shadow: var(--shadow-md);
}
.hp-entry-portal .hp-entry-icon {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
}
.hp-entry-exam .hp-entry-icon {
  background: rgba(139, 92, 246, 0.08);
  color: #8b5cf6;
}
.hp-entry-handover .hp-entry-icon {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
}
.hp-entry-portal .hp-entry-desc,
.hp-entry-exam .hp-entry-desc,
.hp-entry-handover .hp-entry-desc {
  color: var(--text-secondary);
}
.hp-entry-portal .hp-entry-arrow { color: #6366f1; }
.hp-entry-exam .hp-entry-arrow { color: #8b5cf6; }
.hp-entry-handover .hp-entry-arrow { color: #10b981; }

/* Portal hover */
.hp-entry-portal:hover { border-color: rgba(99, 102, 241, 0.3); }
.hp-entry-exam:hover { border-color: rgba(139, 92, 246, 0.3); }
.hp-entry-handover:hover { border-color: rgba(16, 185, 129, 0.3); }

/* Entry 内部元素 */
.hp-entry-icon {
  width: 42px; height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hp-entry-text {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.hp-entry-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  letter-spacing: 0.3px;
}
.hp-entry-desc {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hp-entry-arrow {
  font-size: 16px;
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-4px);
  transition: all var(--duration-normal) var(--ease-out);
}
.hp-entry:hover .hp-entry-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ====== 区块标题 ====== */
.hp-section-header {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.hp-section-title {
  font-size: var(--text-base);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  font-family: var(--font-display);
  margin: 0;
}
.hp-section-count {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* ====== 专题卡片网格 ====== */
.hp-topics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}
.hp-topic-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 15px 18px;
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: inherit;
  transition: all var(--duration-normal) var(--ease-out);
  box-shadow: var(--shadow-xs);
  animation: hpCardIn 0.4s var(--ease-out) both;
}
@keyframes hpCardIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.hp-topic-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.hp-topic-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 36px;
  text-align: center;
  line-height: 1;
}
.hp-topic-body {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.hp-topic-name {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}
.hp-topic-desc {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hp-topic-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  flex-shrink: 0;
}
.hp-topic-freq {
  font-size: 9px; font-weight: var(--weight-semibold);
  padding: 1px 7px; border-radius: 4px;
  white-space: nowrap;
}
.hp-topic-freq.high { background: rgba(239, 68, 68, 0.1); color: #d43030; }
.hp-topic-freq.mid  { background: rgba(245, 158, 11, 0.1); color: #b1740e; }
.hp-topic-freq.low  { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.hp-topic-stars {
  font-size: 9px; color: #e0b040; letter-spacing: 1px;
}

/* ====== 快捷入口 ====== */
.hp-quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.hp-quick-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 16px 20px;
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: inherit;
  transition: all var(--duration-normal) var(--ease-out);
  box-shadow: var(--shadow-xs);
}
.hp-quick-link:hover {
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.hp-ql-icon {
  width: 40px; height: 40px;
  border-radius: var(--radius-md);
  background: rgba(99, 102, 241, 0.06);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hp-ql-text {
  flex: 1;
  display: flex; flex-direction: column; gap: 2px;
}
.hp-ql-text strong {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}
.hp-ql-text small {
  font-size: 11px;
  color: var(--text-secondary);
}
.hp-ql-arrow {
  font-size: 14px;
  color: var(--text-muted);
  opacity: 0;
  transform: translateX(-4px);
  transition: all var(--duration-normal) var(--ease-out);
}
.hp-quick-link:hover .hp-ql-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--accent);
}

/* ====== 响应式 ====== */
@media (max-width: 900px) {
  .hp-entries { grid-template-columns: repeat(2, 1fr); }
  .hp-topics { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
}
@media (max-width: 640px) {
  .hp-page { padding: 20px 12px 32px; }
  .hp-hero-title { font-size: var(--text-2xl); }
  .hp-hero-desc { font-size: 12px; }
  .hp-entries { grid-template-columns: 1fr; gap: var(--space-2); }
  .hp-entry { padding: 14px 16px; }
  .hp-topics { grid-template-columns: 1fr; gap: var(--space-2); }
  .hp-topic-card { padding: 12px 14px; }
  .hp-quick-links { grid-template-columns: 1fr; }
}
</style>
