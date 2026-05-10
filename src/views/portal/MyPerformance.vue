<template>
  <div class="perf-page" v-if="student">
    <!-- Habit Overview -->
    <div class="section-card">
      <div class="sec-head">
        <h3 class="sec-title">学习习惯总览</h3>
      </div>
      <div class="habit-grid">
        <div class="habit-card">
          <span class="hc-icon">✅</span>
          <span class="hc-val" :class="hwRate >= 80 ? 'c-green' : 'c-amber'">{{ hwRate }}%</span>
          <span class="hc-label">作业完成率</span>
          <span class="hc-sub">{{ completedHw }}/{{ allHomeworks.length }} 项已完成</span>
        </div>
        <div class="habit-card">
          <span class="hc-icon">🕐</span>
          <span class="hc-val" :class="attendanceRate >= 90 ? 'c-green' : 'c-amber'">{{ attendanceRate }}%</span>
          <span class="hc-label">出勤率</span>
          <span class="hc-sub">近30天考勤统计</span>
        </div>
        <div class="habit-card">
          <span class="hc-icon">⭐</span>
          <span class="hc-val c-accent">{{ praiseCount }}</span>
          <span class="hc-label">获表扬</span>
          <span class="hc-sub">课堂积极表现</span>
        </div>
        <div class="habit-card">
          <span class="hc-icon">📝</span>
          <span class="hc-val c-primary">{{ feedbackTotal }}</span>
          <span class="hc-label">反馈总数</span>
          <span class="hc-sub">各渠道老师反馈</span>
        </div>
      </div>
    </div>

    <!-- Teacher Feedback — Categorized -->
    <div class="section-card" v-if="portalCfg.showTeacherFeedback">
      <div class="sec-head">
        <h3 class="sec-title">老师反馈</h3>
        <span class="sec-badge">{{ feedbackTotal }} 条</span>
      </div>

      <div v-if="feedbackTotal === 0" class="sec-empty">暂无反馈记录，老师反馈会按类别显示在这里</div>

      <!-- Category: 考试反馈 -->
      <div v-if="examFeedbacks.length" class="fb-category">
        <div class="fb-cat-head">
          <span class="fb-cat-dot" style="background:#c47a5a"></span>
          <span class="fb-cat-name">考试反馈</span>
          <span class="fb-cat-count">{{ examFeedbacks.length }} 条</span>
        </div>
        <div class="fb-list">
          <div v-for="f in examFeedbacks" :key="f.id" class="fb-item" @click="f._open = !f._open">
            <div class="fbi-top">
              <span class="fbi-subject">{{ f.subject }}</span>
              <span class="fbi-type">{{ f.examType }}</span>
              <span class="fbi-date">{{ f.date }}</span>
              <span class="fbi-caret">{{ f._open ? '▾' : '▸' }}</span>
            </div>
            <div v-if="f._open" class="fbi-body">{{ f.teacherFeedback }}</div>
          </div>
        </div>
      </div>

      <!-- Category: 课堂观察 -->
      <div v-if="behaviorFeedbacks.length" class="fb-category">
        <div class="fb-cat-head">
          <span class="fb-cat-dot" style="background:#3b82f6"></span>
          <span class="fb-cat-name">课堂观察</span>
          <span class="fb-cat-count">{{ behaviorFeedbacks.length }} 条</span>
        </div>
        <div class="fb-list">
          <div v-for="b in behaviorFeedbacks" :key="b.id" class="fb-item">
            <div class="fbi-top">
              <span class="fbi-icon">{{ b.type === 'success' ? '🌟' : b.type === 'warning' ? '⚠️' : '💡' }}</span>
              <span class="fbi-subject">{{ b.subject }}</span>
              <span class="fbi-type" :class="b.type === 'success' ? 't-good' : b.type === 'warning' ? 't-warn' : 't-info'">{{ {success:'表扬',warning:'提醒',info:'观察'}[b.type] || b.type }}</span>
              <span class="fbi-date">{{ b.time }}</span>
            </div>
            <div class="fbi-body fbi-body-always">{{ b.behavior }}</div>
          </div>
        </div>
      </div>

      <!-- Category: 日常评语 -->
      <div v-if="generalFeedbacks.length" class="fb-category">
        <div class="fb-cat-head">
          <span class="fb-cat-dot" style="background:#6b9e7a"></span>
          <span class="fb-cat-name">日常评语</span>
          <span class="fb-cat-count">{{ generalFeedbacks.length }} 条</span>
        </div>
        <div class="fb-list">
          <div v-for="f in generalFeedbacks" :key="f.id" class="fb-item">
            <div class="fbi-top">
              <span class="fbi-subject">{{ f.subject || '综合' }}</span>
              <span class="fbi-date">{{ f.date }}</span>
            </div>
            <div class="fbi-body fbi-body-always">{{ f.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Behavior Records -->
    <div class="section-card" v-if="portalCfg.showBehavior">
      <div class="sec-head">
        <h3 class="sec-title">课堂表现记录</h3>
        <span class="sec-badge">{{ behaviors.length }} 条</span>
      </div>
      <div v-if="behaviors.length === 0" class="sec-empty">暂无课堂表现记录</div>
      <div v-else class="bh-list">
        <div v-for="b in behaviors" :key="b.id" class="bh-row">
          <span class="bh-dot" :class="b.type === 'success' ? 'dot-good' : b.type === 'warning' ? 'dot-warn' : 'dot-info'"></span>
          <span class="bh-icon">{{ b.type === 'success' ? '🌟' : b.type === 'warning' ? '⚠️' : '💡' }}</span>
          <div class="bh-info">
            <span class="bh-text">{{ b.behavior }}</span>
            <span class="bh-meta">{{ b.subject }} · {{ b.time }}</span>
          </div>
          <span class="bh-score" :class="b.type === 'success' ? 's-good' : b.type === 'warning' ? 's-warn' : 's-info'">{{ b.score }}</span>
        </div>
      </div>
    </div>

    <div class="page-quote">优秀不是偶然，而是每一天好习惯的累积。关注过程，结果自然会来。</div>
  </div>

  <div v-else class="loading-state">
    <div class="loading-spinner"></div>
    <p>正在加载学生数据...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { examService, behaviorService, homeworkService, attendanceService, portalConfigService } from '@/services/dataService'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const allExams = ref([]), allBehaviors = ref([]), allHomeworks = ref([]), attendances = ref([])
const portalCfg = ref(portalConfigService.get())

onMounted(() => {
  if (!store.currentStudentId) return
  const sid = store.currentStudentId
  allExams.value = examService.getByStudent(sid)
  allBehaviors.value = behaviorService.getAll().filter(b => b.studentId === sid)
  allHomeworks.value = homeworkService.getByStudent(sid)
  attendances.value = attendanceService.getByStudent(sid)
})

const completedHw = computed(() => allHomeworks.value.filter(h => h.status === '已提交').length)
const hwRate = computed(() => {
  const a = allHomeworks.value
  return a.length ? Math.round(completedHw.value / a.length * 100) : 100
})
const attendanceRate = computed(() => {
  const a = attendances.value
  return a.length ? Math.round(a.filter(x => x.status === '正常').length / a.length * 100) : 100
})
const praiseCount = computed(() => allBehaviors.value.filter(b => b.type === 'success').length)

// --- Categorized Feedbacks ---

// 考试反馈: from exam teacherFeedback
const examFeedbacks = computed(() =>
  allExams.value.filter(e => e.teacherFeedback).slice(0, 6).map(e => ({
    id: 'exam-' + e.id, subject: e.subject, examType: e.examType,
    date: e.date, teacherFeedback: e.teacherFeedback, _open: false
  }))
)

// 课堂观察: behavior records of all types (they contain teacher notes)
const behaviorFeedbacks = computed(() =>
  allBehaviors.value.filter(b => b.behavior && b.behavior.trim()).slice(0, 8)
)

// 日常评语: behavior records with detailed descriptions (type === 'info')
const generalFeedbacks = computed(() =>
  allBehaviors.value
    .filter(b => b.type === 'info' && b.behavior && b.behavior.length > 15)
    .slice(0, 5)
    .map(b => ({ id: 'gen-' + b.id, subject: b.subject, date: b.time, content: b.behavior }))
)

const feedbackTotal = computed(() =>
  examFeedbacks.value.length + behaviorFeedbacks.value.length + generalFeedbacks.value.length
)

const behaviors = computed(() => allBehaviors.value.slice(0, 10))
</script>

<style scoped>
.perf-page { max-width: 1000px; margin: 0 auto; font-family: var(--font-body); color: var(--text-primary); }

/* ---- Section Card ---- */
.section-card {
  background: var(--card-bg); border: 1px solid var(--border-light);
  border-radius: 12px; padding: 20px 22px; margin-bottom: 14px;
}

.sec-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}

.sec-title {
  font-size: 14px; font-weight: 700; color: var(--primary);
  font-family: var(--font-display); margin: 0; letter-spacing: 0.02em;
}

.sec-badge {
  font-size: 10px; font-weight: 600; color: var(--text-muted);
  background: var(--bg-warm); padding: 2px 10px; border-radius: 10px;
}

.sec-empty {
  font-size: 12px; color: var(--text-muted); text-align: center;
  padding: 30px 0; font-style: italic;
}

/* ---- Habit Grid ---- */
.habit-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 768px) { .habit-grid { grid-template-columns: repeat(2, 1fr); } }

.habit-card {
  background: var(--bg-warm); border-radius: 10px; padding: 18px 14px;
  text-align: center; border: 1px solid var(--border-lighter);
}

.hc-icon { font-size: 26px; display: block; margin-bottom: 6px; }
.hc-val { font-size: 26px; font-weight: 700; font-family: var(--font-display); display: block; line-height: 1.1; }
.hc-val.c-green  { color: var(--success); }
.hc-val.c-amber  { color: var(--warning); }
.hc-val.c-accent { color: var(--accent); }
.hc-val.c-primary{ color: var(--primary); }
.hc-label { font-size: 12px; color: var(--text-primary); font-weight: 500; display: block; margin-top: 4px; }
.hc-sub { font-size: 10px; color: var(--text-muted); display: block; margin-top: 2px; }

/* ---- Feedback Categories ---- */
.fb-category { margin-bottom: 18px; }
.fb-category:last-child { margin-bottom: 0; }

.fb-cat-head {
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  padding-bottom: 6px; border-bottom: 1px solid var(--border-lighter);
}

.fb-cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.fb-cat-name {
  font-size: 12px; font-weight: 600; color: var(--text-primary);
}

.fb-cat-count {
  font-size: 10px; color: var(--text-muted);
  background: var(--bg-warm); padding: 1px 8px; border-radius: 10px;
  margin-left: auto;
}

.fb-list { display: flex; flex-direction: column; gap: 4px; }

.fb-item {
  padding: 10px 14px; border-radius: 8px; transition: background 0.15s;
  cursor: default;
}

.fb-item:hover { background: var(--bg-warm); }

.fbi-top {
  display: flex; align-items: center; gap: 8px;
}

.fbi-icon { font-size: 14px; flex-shrink: 0; }

.fbi-subject { font-size: 12px; font-weight: 600; color: var(--text-primary); }

.fbi-type {
  font-size: 10px; color: var(--text-muted);
  background: #fff; padding: 1px 8px; border-radius: 4px;
}

.t-good { background: #d1fae5; color: #065f46; }
.t-warn { background: #fef3c7; color: #92400e; }
.t-info { background: #dbeafe; color: #1e40af; }

.fbi-date { font-size: 10px; color: var(--text-muted); margin-left: auto; }

.fbi-caret { font-size: 11px; color: var(--text-muted); cursor: pointer; }

.fbi-body {
  margin-top: 6px; font-size: 12px; line-height: 1.7;
  color: var(--text-secondary); padding: 8px 12px;
  background: var(--bg-warm); border-radius: 6px;
}

.fbi-body-always {
  margin-top: 4px; font-size: 12px; line-height: 1.65;
  color: var(--text-secondary); padding: 0; background: none;
}

/* ---- Behavior List ---- */
.bh-list { display: flex; flex-direction: column; gap: 2px; }

.bh-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px; border-radius: 8px; transition: background 0.15s;
}

.bh-row:hover { background: var(--bg-warm); }

.bh-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.dot-good { background: var(--success); }
.dot-warn { background: var(--warning); }
.dot-info { background: #3b82f6; }

.bh-icon { font-size: 15px; flex-shrink: 0; }

.bh-info { flex: 1; min-width: 0; }

.bh-text { font-size: 12px; color: var(--text-primary); }

.bh-meta { display: block; font-size: 10px; color: var(--text-muted); margin-top: 1px; }

.bh-score {
  font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 10px;
}
.s-good { background: #d1fae5; color: #065f46; }
.s-warn { background: #fef3c7; color: #92400e; }
.s-info { background: #dbeafe; color: #1e40af; }

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
</style>
