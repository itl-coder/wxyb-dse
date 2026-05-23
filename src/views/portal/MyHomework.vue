<template>
  <template v-if="student">
    <div v-if="portalCfg.showHomework" class="hw-page">
    <!-- Header -->
    <div class="page-head">
      <div class="head-left">
        <h2 class="head-title">我的作业</h2>
        <p class="head-sub">提交情况：{{ doneCount }}/{{ allHomeworks.length }} 已完成</p>
      </div>
      <div class="head-progress">
        <div class="hp-ring">
          <svg viewBox="0 0 36 36" class="hp-svg">
            <path class="hp-track" d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0 -32" fill="none" stroke="var(--border-light)" stroke-width="3"/>
            <path class="hp-fill" :style="{ strokeDasharray: completeRate + ', 100' }" d="M18 2 a16 16 0 0 1 0 32 a16 16 0 0 1 0 -32" fill="none" :stroke="completeRate >= 80 ? 'var(--success)' : completeRate >= 50 ? 'var(--warning)' : 'var(--danger)'" stroke-width="3" stroke-linecap="round"/>
          </svg>
          <span class="hp-text">{{ completeRate }}%</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs" :key="tab.key"
        class="tab-btn" :class="{ on: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-num">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Empty -->
    <div v-if="filteredHomeworks.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15c1.5-2 4-2 8 0"/><circle cx="9" cy="9" r="0.8" fill="currentColor"/><circle cx="15" cy="9" r="0.8" fill="currentColor"/></svg>
      </div>
      <p class="empty-title">{{ activeTab === 'done' ? '暂无已提交的作业' : '全部完成，继续保持' }}</p>
    </div>

    <!-- Homework List -->
    <div v-else class="hw-list">
      <div
        v-for="h in filteredHomeworks" :key="h.id"
        class="hw-item"
        :class="{
          urgent: h.dueDate < today && h.status === '未提交',
          done: h.status === '已提交',
          late: h.status === '迟交'
        }"
      >
        <!-- Row -->
        <div class="hwi-row" @click="h._open = !h._open">
          <!-- Status dot -->
          <span class="hwi-dot" :class="statusDotClass(h)"></span>

          <!-- Icon -->
          <span class="hwi-icon">{{ subjectIcon(h.subject) }}</span>

          <!-- Info -->
          <div class="hwi-info">
            <div class="hwi-title-row">
              <span class="hwi-title">{{ h.title }}</span>
              <span class="hwi-status" :class="'s-' + statusSlug(h)">{{ h.status }}</span>
            </div>
            <div class="hwi-meta">
              <span>{{ h.subject }}</span>
              <span class="hwi-sep">·</span>
              <span>截止 {{ h.dueDate }}</span>
              <span v-if="h.submitTime" class="hwi-sep">·</span>
              <span v-if="h.submitTime">提交于 {{ h.submitTime }}</span>
              <span v-if="h.score" class="hwi-sep">·</span>
              <span v-if="h.score" class="hwi-score">评分 {{ h.score }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="hwi-actions" @click.stop>
            <button
              v-if="h.status === '未提交'"
              class="hwi-submit-btn"
              @click="toggleSubmit(h)"
            >标记已提交</button>
          </div>

          <!-- Caret -->
          <span class="hwi-caret">{{ h._open ? '▾' : '▸' }}</span>
        </div>

        <!-- Expanded content -->
        <div v-if="h._open" class="hwi-detail">
          <div class="hwi-detail-body" v-if="h.content">
            <div class="hwi-detail-label">作业内容</div>
            <p class="hwi-detail-text">{{ h.content }}</p>
          </div>
          <div v-else class="hwi-detail-body">
            <p class="hwi-detail-text" style="color:var(--text-muted)">暂无详细内容</p>
          </div>
        </div>
      </div>
    </div>

    <div class="page-quote">日积月累，水滴石穿。今天的每一份努力，都在为明天的突破积蓄力量。</div>
    </div>
    <div v-else class="empty-state" style="padding:80px 0">
      <p class="empty-title">作业功能暂未开放</p>
    </div>
  </template>
  <div v-else class="loading-state">
    <div class="loading-spinner"></div>
    <p>正在加载学生数据...</p>
  </div>
</template>

<script setup>
/**
 * 页面：我的作业
 * 功能：查看作业列表、跟踪提交状态、标记作业完成
 * 路由：/portal/my-homework
 */
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { homeworkService, portalConfigService } from '@/services/dataService'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const portalCfg = ref(portalConfigService.get())
const today = new Date().toISOString().split('T')[0]
const allHomeworks = ref([])
const activeTab = ref('all')

const tabs = computed(() => [
  { key: 'all', label: '全部', count: allHomeworks.value.length },
  { key: 'pending', label: '待提交', count: allHomeworks.value.filter(h => h.status === '未提交').length },
  { key: 'done', label: '已提交', count: allHomeworks.value.filter(h => h.status !== '未提交').length }
])

const doneCount = computed(() => allHomeworks.value.filter(h => h.status === '已提交').length)
const completeRate = computed(() =>
  allHomeworks.value.length ? Math.round(doneCount.value / allHomeworks.value.length * 100) : 0
)

const filteredHomeworks = computed(() => {
  let list = allHomeworks.value
  if (activeTab.value === 'pending') list = list.filter(h => h.status === '未提交')
  if (activeTab.value === 'done') list = list.filter(h => h.status !== '未提交')
  return [...list].sort((a, b) => {
    if (a.status === '未提交' && b.status !== '未提交') return -1
    if (a.status !== '未提交' && b.status === '未提交') return 1
    return b.dueDate.localeCompare(a.dueDate)
  })
})

const iconMap = { '数学':'📐', '中国语文':'📝', '英国语文':'🔤', 'English Reading':'📖', 'English Writing':'✍️', 'English Listening':'🎧', 'English Speaking':'🗣️', '物理':'⚡', '化学':'🧪', '生物':'🧬', '历史':'📜', '地理':'🌍', '经济':'📈', '资讯及通讯科技':'💻', '企业、会计与财务概论':'📊', '视觉艺术':'🎨', '体育':'⚽', '音乐':'🎵', '数学延伸M1':'📐', '数学延伸M2':'📐' }
function subjectIcon(s) { return iconMap[s] || '📖' }

function statusDotClass(h) {
  if (h.status === '已提交') return 'dot-done'
  if (h.dueDate < today) return 'dot-urgent'
  return 'dot-pending'
}

function statusSlug(h) {
  if (h.status === '已提交') return 'done'
  if (h.status === '迟交') return 'late'
  return 'pending'
}

onMounted(() => {
  if (!store.currentStudentId) return
  allHomeworks.value = homeworkService.getByStudent(store.currentStudentId).map(h => ({ ...h, _open: false }))
})

function toggleSubmit(h) {
  const now = new Date().toLocaleString('zh-CN')
  homeworkService.update(h.id, { status: '已提交', submitTime: now })
  allHomeworks.value = homeworkService.getByStudent(store.currentStudentId).map(h => ({ ...h, _open: false }))
  ElMessage.success('已标记为已提交')
}
</script>

<style scoped>
.hw-page { max-width: 1000px; margin: 0 auto; font-family: var(--font-body); color: var(--text-primary); }

/* ---- Page Head ---- */
.page-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; margin-bottom: 18px; padding-bottom: 18px;
  border-bottom: 2px solid var(--border-light); flex-wrap: wrap;
}

.head-title {
  font-size: 22px; font-weight: 700; font-family: var(--font-display);
  color: var(--primary); margin: 0 0 4px; letter-spacing: 0.02em;
}

.head-sub { font-size: 12px; color: var(--text-muted); margin: 0; }

.head-progress { flex-shrink: 0; }

.hp-ring {
  width: 56px; height: 56px; position: relative;
  display: flex; align-items: center; justify-content: center;
}

.hp-svg { width: 100%; height: 100%; transform: rotate(-90deg); }

.hp-track { }

.hp-fill { transition: stroke-dasharray 0.6s ease; }

.hp-text {
  position: absolute; font-size: 13px; font-weight: 700;
  color: var(--primary); font-family: var(--font-display);
}

/* ---- Tabs ---- */
.tab-bar { display: flex; gap: 6px; margin-bottom: 18px; }

.tab-btn {
  padding: 7px 18px; border-radius: 20px; border: 1px solid var(--border-light);
  background: var(--card-bg); font-size: 12px; font-weight: 500;
  color: var(--text-secondary); cursor: pointer; transition: all 0.18s;
  font-family: var(--font-body); display: inline-flex; align-items: center; gap: 5px;
}

.tab-btn:hover { border-color: var(--accent); color: var(--accent-d); }

.tab-btn.on { background: var(--primary); border-color: var(--primary); color: #fff; }

.tab-num {
  font-size: 10px; opacity: 0.55; font-weight: 600;
}

.tab-btn.on .tab-num { opacity: 0.8; }

/* ---- Empty ---- */
.empty-state { text-align: center; padding: 80px 20px; }
.empty-icon { color: var(--text-muted); margin-bottom: 14px; opacity: 0.35; }
.empty-title { font-size: 15px; font-weight: 600; color: var(--text-secondary); margin: 0; }

/* ---- Homework List ---- */
.hw-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 24px; }

.hw-item {
  background: var(--card-bg); border: 1px solid var(--border-light);
  border-radius: 10px; overflow: hidden; transition: all 0.18s;
}

.hw-item:hover { border-color: var(--border-base); box-shadow: 0 1px 8px rgba(0,0,0,0.04); }

.hw-item.urgent { border-left: 3px solid #ef4444; background: #fefcfb; }
.hw-item.done   { opacity: 0.7; }
.hw-item.late   { border-left: 3px solid #f59e0b; }

/* ---- Row ---- */
.hwi-row {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px; cursor: pointer; user-select: none;
}

.hwi-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}

.dot-done    { background: #6b9e7a; }
.dot-pending { background: #c49a5a; }
.dot-urgent  { background: #ef4444; animation: pulse-dot 2s infinite; }

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hwi-icon { font-size: 22px; flex-shrink: 0; }

.hwi-info { flex: 1; min-width: 0; }

.hwi-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }

.hwi-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }

.hwi-status {
  font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 10px;
}

.s-pending { background: #fef3c7; color: #92400e; }
.s-done    { background: #d1fae5; color: #065f46; }
.s-late    { background: #fed7aa; color: #9a3412; }

.hwi-meta {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--text-muted); flex-wrap: wrap;
}

.hwi-sep { color: var(--border-base); }

.hwi-score { color: var(--success); font-weight: 600; }

.hwi-actions { flex-shrink: 0; }

.hwi-submit-btn {
  padding: 5px 14px; border-radius: 6px; border: 1px solid var(--success);
  background: #fff; color: var(--success); font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.18s; font-family: var(--font-body);
}

.hwi-submit-btn:hover { background: var(--success); color: #fff; }

.hwi-caret { font-size: 12px; color: var(--text-muted); flex-shrink: 0; }

/* ---- Expanded Detail ---- */
.hwi-detail {
  padding: 0 18px 16px; border-top: 1px dashed var(--border-lighter);
  background: var(--bg-warm);
}

.hwi-detail-body { padding-top: 14px; }

.hwi-detail-label {
  font-size: 10px; font-weight: 700; color: var(--text-muted);
  letter-spacing: 0.06em; margin-bottom: 6px;
}

.hwi-detail-text {
  font-size: 13px; line-height: 1.7; color: var(--text-primary); margin: 0;
}

/* ---- Quote ---- */
.page-quote {
  text-align: center; font-size: 12px; color: var(--text-muted);
  padding: 12px 0 40px; font-style: italic;
}

/* ---- Loading ---- */
.loading-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px;
  color: var(--text-muted); font-size: 13px; gap: 14px;
}

.loading-spinner {
  width: 28px; height: 28px;
  border: 2px solid var(--border-light); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .hwi-row { flex-wrap: wrap; gap: 8px; }
  .hwi-actions { width: 100%; }
  .hwi-submit-btn { width: 100%; text-align: center; }
}
</style>
