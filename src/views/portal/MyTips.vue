<template>
  <div v-if="student" class="tips-page">
    <div v-if="portalCfg.showExamTips">
      <!-- Page Head -->
      <div class="page-head">
        <div class="head-left">
          <h2 class="head-title">💡 做题技巧</h2>
          <p class="head-sub">掌握方法，事半功倍。共 {{ filteredTips.length }} 条技巧供你学习</p>
        </div>
        <div class="head-stat">
          <span class="hs-num">{{ allTips.length }}</span>
          <span class="hs-lbl">条技巧</span>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="fb-row">
          <span class="fb-label">科目</span>
          <div class="fb-chips">
            <button class="fb-chip" :class="{ on: !filterSubject }" @click="filterSubject = ''; filterQuestionType = ''">全部</button>
            <button v-for="s in subjects" :key="s" class="fb-chip" :class="{ on: filterSubject === s }" @click="filterSubject = filterSubject === s ? '' : s; filterQuestionType = ''">{{ s }}</button>
          </div>
        </div>
        <div class="fb-row" v-if="questionTypes.length">
          <span class="fb-label">题型</span>
          <div class="fb-chips">
            <button class="fb-chip" :class="{ on: !filterQuestionType }" @click="filterQuestionType = ''">全部</button>
            <button v-for="t in questionTypes" :key="t" class="fb-chip" :class="{ on: filterQuestionType === t }" @click="filterQuestionType = filterQuestionType === t ? '' : t">{{ t }}</button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredTips.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <p class="empty-title">{{ allTips.length === 0 ? '暂无做题技巧，老师正在整理中' : '当前筛选条件下暂无技巧' }}</p>
        <p class="empty-desc" v-if="allTips.length > 0">试试切换科目或题型筛选</p>
      </div>

      <!-- Tips List -->
      <div v-else class="tips-list">
        <div
          v-for="(tip, idx) in filteredTips"
          :key="tip.id"
          class="tip-card"
          :class="{ open: tip._open }"
          :style="{ animationDelay: idx * 0.04 + 's' }"
        >
          <div class="tpc-row" @click="tip._open = !tip._open">
            <div class="tpc-accent" :style="{ background: subjectColor(tip.subject) }"></div>
            <span class="tpc-icon">{{ subjectIcon(tip.subject) }}</span>
            <div class="tpc-info">
              <div class="tpc-title-row">
                <span class="tpc-title">{{ tip.techniqueTitle }}</span>
                <span class="tpc-type" :style="{ background: subjectColor(tip.subject) + '18', color: subjectColor(tip.subject) }">{{ tip.questionType }}</span>
              </div>
              <div class="tpc-meta">
                <span class="tpc-subject">{{ tip.subject }}</span>
                <span class="tpc-sep">·</span>
                <span class="tpc-problem">{{ tip.studentProblem }}</span>
              </div>
            </div>
            <span class="tpc-caret">{{ tip._open ? '▾' : '▸' }}</span>
          </div>
          <div v-if="tip._open" class="tpc-detail">
            <div class="tpc-detail-body" v-html="renderedContent(tip.content)"></div>
            <div class="tpc-detail-footer">
              <span>{{ tip.createdBy || '老师' }} 整理</span>
              <span>{{ tip.createdAt }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="page-quote">
        <span class="pq-ornament">❦</span>
        <p>工欲善其事，必先利其器。掌握方法，勤加练习，每一步都在靠近目标。</p>
      </div>
    </div>

    <!-- Feature Disabled -->
    <div v-else class="empty-state" style="padding:80px 0">
      <div class="empty-icon">🔒</div>
      <p class="empty-title">做题技巧功能暂未开放</p>
      <p class="empty-desc">请联系班主任开启此功能</p>
    </div>
  </div>

  <!-- No Student Selected -->
  <div v-else class="loading-state">
    <div class="loading-spinner"></div>
    <p>加载中...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { examTipService, portalConfigService } from '@/services/dataService'
import { marked } from 'marked'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const portalCfg = ref(portalConfigService.get())

const allTips = ref([])
const filterSubject = ref('')
const filterQuestionType = ref('')

const subjectIcons = {
  '数学': '📐', '中国语文': '📖', '英国语文': '🌐',
  'English Reading': '🌐', 'English Writing': '🌐', 'English Listening': '🌐', 'English Speaking': '🌐',
  '物理': '⚛️', '化学': '🧪', '生物': '🧬', '历史': '📜',
  '地理': '🌍', '经济': '📊', '资讯及通讯科技': '💻',
  '企业、会计与财务概论': '💼', '视觉艺术': '🎨', '体育': '🏀',
  '音乐': '🎵', '公民与社会发展': '🏛️', '数学延伸M1': '📐', '数学延伸M2': '📐'
}
function subjectIcon(s) { return subjectIcons[s] || '📝' }

const subjectColors = {
  '数学': '#3b82f6', '中国语文': '#22c55e', '英国语文': '#8b5cf6',
  'English Reading': '#8b5cf6', 'English Writing': '#8b5cf6', 'English Listening': '#8b5cf6', 'English Speaking': '#8b5cf6',
  '物理': '#f59e0b', '化学': '#ef4444', '生物': '#10b981',
  '地理': '#06b6d4', '经济': '#f97316', '资讯及通讯科技': '#6366f1',
  '企业、会计与财务概论': '#14b8a6', '视觉艺术': '#ec4899', '体育': '#84cc16',
  '音乐': '#a855f7', '公民与社会发展': '#64748b', '历史': '#78716c',
  '数学延伸M1': '#3b82f6', '数学延伸M2': '#3b82f6'
}
function subjectColor(s) { return subjectColors[s] || '#8b6914' }

onMounted(() => {
  allTips.value = examTipService.getApproved().map(t => ({ ...t, _open: false }))
  allTips.value.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99) || (b.createdAt || '').localeCompare(a.createdAt || ''))
})

const subjects = computed(() => [...new Set(allTips.value.map(t => t.subject).filter(Boolean))].sort())

const questionTypes = computed(() => {
  let items = allTips.value
  if (filterSubject.value) items = items.filter(t => t.subject === filterSubject.value)
  return [...new Set(items.map(t => t.questionType).filter(Boolean))].sort()
})

const filteredTips = computed(() => {
  return allTips.value.filter(t => {
    if (filterSubject.value && t.subject !== filterSubject.value) return false
    if (filterQuestionType.value && t.questionType !== filterQuestionType.value) return false
    return true
  })
})

function renderedContent(content) {
  if (!content) return '<p style="color:#999">暂无内容</p>'
  return marked.parse(content)
}
</script>

<style scoped>
.tips-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 0 40px;
}

/* Page Head */
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 28px 0 20px;
  border-bottom: 1px solid var(--border-light);
}

.head-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.head-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.head-stat {
  text-align: center;
}

.hs-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.hs-lbl {
  font-size: 11px;
  color: var(--text-muted);
}

/* Filter Bar */
.filter-bar {
  margin-bottom: 20px;
}

.fb-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.fb-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  padding-top: 6px;
  min-width: 36px;
  flex-shrink: 0;
}

.fb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.fb-chip {
  padding: 5px 14px;
  font-size: 12px;
  font-family: var(--font-body);
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.fb-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.fb-chip.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}

/* Tip Cards */
.tips-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 32px;
}

.tip-card {
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.25s ease;
  animation: cardFadeIn 0.4s ease both;
}

@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.tip-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 20px rgba(139, 105, 20, 0.08);
}

.tip-card.open {
  border-color: var(--accent);
  box-shadow: 0 4px 24px rgba(139, 105, 20, 0.12);
}

.tpc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.tpc-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0;
  transition: width 0.2s;
}

.tip-card:hover .tpc-accent,
.tip-card.open .tpc-accent {
  width: 4px;
}

.tpc-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-left: 4px;
}

.tpc-info {
  flex: 1;
  min-width: 0;
}

.tpc-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 3px;
}

.tpc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.tpc-type {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.tpc-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.tpc-subject {
  font-weight: 500;
}

.tpc-sep {
  opacity: 0.4;
}

.tpc-problem {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpc-caret {
  font-size: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.2s;
}

/* Detail (expanded content) */
.tpc-detail {
  border-top: 1px solid var(--border-light);
  background: var(--bg-warm);
  padding: 0;
}

.tpc-detail-body {
  padding: 20px 24px 16px;
  font-size: 13px;
  line-height: 1.9;
  color: var(--text-secondary);
}

.tpc-detail-body :deep(h2) {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 18px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-light);
}

.tpc-detail-body :deep(h3) {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 14px 0 8px;
}

.tpc-detail-body :deep(p) {
  margin: 6px 0;
}

.tpc-detail-body :deep(ul), .tpc-detail-body :deep(ol) {
  padding-left: 1.5em;
  margin: 6px 0;
}

.tpc-detail-body :deep(li) {
  margin: 3px 0;
}

.tpc-detail-body :deep(blockquote) {
  border-left: 3px solid var(--accent);
  margin: 10px 0;
  padding: 8px 16px;
  background: rgba(139, 105, 20, 0.06);
  font-style: italic;
  color: var(--text-secondary);
}

.tpc-detail-body :deep(blockquote p) {
  margin: 0;
}

.tpc-detail-body :deep(strong) {
  color: var(--text-primary);
  font-weight: 700;
}

.tpc-detail-body :deep(pre) {
  background: var(--card-bg);
  padding: 12px 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.7;
  border: 1px solid var(--border-light);
  margin: 10px 0;
}

.tpc-detail-body :deep(code) {
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.9em;
  background: rgba(139, 105, 20, 0.06);
  padding: 2px 5px;
  border-radius: 3px;
}

.tpc-detail-body :deep(pre code) {
  background: none;
  padding: 0;
}

.tpc-detail-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 12px;
}

.tpc-detail-body :deep(th) {
  background: var(--bg-warm);
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  font-weight: 600;
  text-align: left;
  color: var(--text-primary);
}

.tpc-detail-body :deep(td) {
  padding: 6px 12px;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
}

.tpc-detail-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-light);
  margin: 16px 0;
}

.tpc-detail-footer {
  display: flex;
  justify-content: space-between;
  padding: 10px 24px 14px;
  font-size: 11px;
  color: var(--text-muted);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  margin-bottom: 12px;
  color: var(--text-muted);
}

.empty-title {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 4px;
}

.empty-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

/* Page Quote */
.page-quote {
  text-align: center;
  padding: 24px 0;
}

.pq-ornament {
  display: block;
  font-size: 18px;
  color: var(--accent);
  margin-bottom: 8px;
  opacity: 0.6;
}

.page-quote p {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
  letter-spacing: 0.5px;
}

/* Loading */
.loading-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
  font-size: 13px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-light);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .tpc-row {
    padding: 12px;
    gap: 8px;
  }

  .tpc-title {
    font-size: 13px;
  }

  .tpc-detail-body {
    padding: 16px;
  }

  .fb-row {
    flex-direction: column;
    gap: 4px;
  }

  .fb-label {
    padding-top: 0;
  }
}
</style>
