<template>
  <div class="dashboard" v-if="student">
    <!-- Welcome Banner -->
    <div class="welcome">
      <div class="welcome-main">
        <div class="welcome-avatar">{{ student.name.charAt(0) }}</div>
        <div class="welcome-text">
          <h2 class="welcome-greeting">{{ timeGreeting }}，{{ student.name }}</h2>
          <p class="welcome-detail">{{ student.class }}班 · {{ student.campus }} · 今日{{ todayLessons.length }}节课</p>
        </div>
      </div>
      <div class="welcome-stats">
        <div class="wstat">
          <span class="wstat-num" :class="hwRate >= 80 ? 'c-green' : 'c-amber'">{{ hwRate }}%</span>
          <span class="wstat-label">作业完成率</span>
        </div>
        <div class="wstat">
          <span class="wstat-num" :class="latestExamAvg >= 75 ? 'c-green' : 'c-amber'">{{ latestExamAvg }}</span>
          <span class="wstat-label">近考均分</span>
        </div>
        <div v-if="portalCfg.showAttendance" class="wstat">
          <span class="wstat-num c-green">{{ attendanceRate }}%</span>
          <span class="wstat-label">出勤率</span>
        </div>
        <div class="wstat">
          <span class="wstat-num c-accent">{{ praiseCount }}</span>
          <span class="wstat-label">获表扬</span>
        </div>
      </div>
    </div>

    <!-- 4-Card Grid -->
    <div class="card-grid">
      <!-- Card 1: Timetable -->
      <div v-if="portalCfg.showTimetable" class="d-card">
        <div class="dc-head">
          <h3 class="dc-title">今日课表</h3>
          <span class="dc-badge">{{ todayLessons.length }}节</span>
        </div>
        <div v-if="todayLessons.length === 0" class="dc-empty">今日无课程安排</div>
        <div v-else class="tt-list">
          <div v-for="l in todayLessons" :key="l.id" class="tt-row">
            <span class="tt-period">第{{ l.period }}节</span>
            <span class="tt-subject">{{ l.subject }}</span>
            <span class="tt-meta">{{ l.teacher }} · {{ l.room }}</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Pending Homework -->
      <div v-if="portalCfg.showHomework" class="d-card">
        <div class="dc-head">
          <h3 class="dc-title">待完成作业</h3>
          <span v-if="pendingHw.length" class="dc-badge dc-badge-warn">{{ pendingHw.length }}项</span>
        </div>
        <div v-if="pendingHw.length === 0" class="dc-empty">全部完成，继续保持</div>
        <div v-else class="hw-list">
          <div v-for="h in pendingHw" :key="h.id" class="hw-row" :class="{ overdue: h.dueDate < today }">
            <div class="hw-left">
              <span class="hw-subject">{{ h.subject }}</span>
              <span class="hw-title">{{ h.title }}</span>
            </div>
            <span class="hw-due" :class="{ 'hw-due-over': h.dueDate < today }">截止 {{ h.dueDate }}</span>
          </div>
        </div>
      </div>

      <!-- Card 3: Recent Scores -->
      <div v-if="portalCfg.showScores" class="d-card">
        <div class="dc-head">
          <h3 class="dc-title">近期成绩</h3>
          <span class="dc-badge dc-badge-info">{{ recentExams.length }}次</span>
        </div>
        <div v-if="recentExams.length === 0" class="dc-empty">暂无考试记录</div>
        <div v-else class="sc-list">
          <div v-for="e in recentExams" :key="e.id" class="sc-row">
            <span class="sc-subject">{{ e.subject }}</span>
            <div class="sc-bar-track">
              <div class="sc-bar" :style="{ width: (e.score / e.total * 100) + '%', background: scoreBarColor(e.score / e.total) }"></div>
            </div>
            <span class="sc-score">{{ e.score }}<small>/{{ e.total }}</small></span>
          </div>
        </div>
      </div>

      <!-- Card 4: Teacher Feedback -->
      <div v-if="portalCfg.showTeacherFeedback" class="d-card">
        <div class="dc-head">
          <h3 class="dc-title">老师反馈</h3>
          <span class="dc-badge dc-badge-accent">{{ feedbacks.length }}条</span>
        </div>
        <div v-if="feedbacks.length === 0" class="dc-empty">暂无反馈</div>
        <div v-else class="fb-list">
          <div v-for="f in feedbacks" :key="f.id" class="fb-row">
            <div class="fb-top">
              <span class="fb-teacher">{{ f.teacher }}</span>
              <span class="fb-subject">{{ f.subject }}</span>
              <span class="fb-date">{{ f.date }}</span>
            </div>
            <p class="fb-text">{{ f.feedback }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Weekend Practice -->
    <div class="d-card practice-section">
      <div class="dc-head">
        <h3 class="dc-title">周末练习卷</h3>
        <span class="dc-hint">选修科目专项训练</span>
      </div>
      <div v-if="electiveSubjects.length === 0" class="dc-empty">请先完善选修课信息</div>
      <div v-else class="practice-grid">
        <div v-for="subj in electiveSubjects" :key="subj" class="practice-card" @click="$router.push('/practice')">
          <span class="pc-icon">{{ subjectIcon(subj) }}</span>
          <span class="pc-name">{{ subj }}</span>
          <span class="pc-arrow">练一练 →</span>
        </div>
      </div>
    </div>

    <div class="page-quote">每一天的认真与坚持，都会在未来的某个时刻发光。</div>
  </div>

  <div v-else class="loading-state">
    <div class="loading-spinner"></div>
    <p>正在加载学生数据...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { timetableService, homeworkService, examService, behaviorService, attendanceService, portalConfigService } from '@/services/dataService'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const portalCfg = ref(portalConfigService.get())
const today = new Date().toISOString().split('T')[0]

const timeGreeting = computed(() => {
  const h = new Date().getHours()
  return h < 6 ? '夜深了' : h < 12 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好'
})

const allHomeworks = ref([]), allExams = ref([]), allBehaviors = ref([]), attendances = ref([])

onMounted(() => {
  if (!store.currentStudentId) return
  const sid = store.currentStudentId
  allHomeworks.value = homeworkService.getByStudent(sid)
  allExams.value = examService.getByStudent(sid)
  allBehaviors.value = behaviorService.getAll().filter(b => b.studentId === sid)
  attendances.value = attendanceService.getByStudent(sid)
})

const todayLessons = computed(() =>
  student.value ? timetableService.getByDay(today).filter(t => t.class === student.value.class) : []
)
const pendingHw = computed(() =>
  allHomeworks.value.filter(h => h.status !== '已提交').slice(0, 5)
)
const hwRate = computed(() => {
  const a = allHomeworks.value
  return a.length ? Math.round(a.filter(h => h.status === '已提交').length / a.length * 100) : 100
})
const recentExams = computed(() => allExams.value.slice(0, 5))
const latestExamAvg = computed(() => {
  const l = allExams.value.slice(0, 3)
  return l.length ? Math.round(l.reduce((s, e) => s + e.score / e.total * 100, 0) / l.length) : '—'
})
const attendanceRate = computed(() => {
  const a = attendances.value
  return a.length ? Math.round(a.filter(x => x.status === '正常').length / a.length * 100) : 100
})
const praiseCount = computed(() =>
  allBehaviors.value.filter(b => b.type === 'success').length
)
const feedbacks = computed(() =>
  allExams.value.filter(e => e.teacherFeedback).slice(0, 3).map(e => ({
    id: e.id, teacher: student.value?.cc || '老师', subject: e.subject, date: e.date, feedback: e.teacherFeedback
  }))
)
const electiveSubjects = computed(() =>
  student.value ? [student.value.elective1, student.value.elective2, student.value.elective3].filter(Boolean) : []
)

const iconMap = { '物理':'⚛️','化学':'🧪','生物':'🧬','经济':'📈','历史':'📜','地理':'🌍','中国历史':'🏯','资讯及通讯科技':'💻','企业、会计与财务概论':'📊','视觉艺术':'🎨','体育':'⚽','音乐':'🎵','数学延伸M1':'📐','数学延伸M2':'📐' }
function subjectIcon(s) { return iconMap[s] || '📖' }
function scoreBarColor(r) {
  return r >= 0.9 ? '#6b9e7a' : r >= 0.75 ? '#2c4a5e' : r >= 0.6 ? '#c49a5a' : '#c45a5a'
}
</script>

<style scoped>
.dashboard { max-width: 1000px; margin: 0 auto; font-family: var(--font-body); color: var(--text-primary); }

/* ---- Welcome Banner ---- */
.welcome {
  background: linear-gradient(135deg, #1a2e3c 0%, #233d50 40%, #2c4a5e 100%);
  border-radius: 14px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
  flex-wrap: wrap;
  box-shadow: 0 2px 16px rgba(26,46,60,0.15);
}

.welcome-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--accent);
  color: #1a2e3c;
  font-size: 20px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  font-family: var(--font-display);
}

.welcome-greeting {
  font-size: 20px; font-weight: 600; color: #fff; margin: 0 0 4px;
}

.welcome-detail {
  font-size: 12px; color: rgba(255,255,255,0.55); margin: 0;
}

.welcome-stats { display: flex; gap: 22px; flex-shrink: 0; }

.wstat { text-align: center; }

.wstat-num {
  display: block; font-size: 22px; font-weight: 700; color: #fff;
  font-family: var(--font-display); line-height: 1.2;
}

.wstat-num.c-green  { color: #6b9e7a; }
.wstat-num.c-amber  { color: #d49a5a; }
.wstat-num.c-accent { color: var(--accent); }

.wstat-label {
  display: block; font-size: 10px; color: rgba(255,255,255,0.45); margin-top: 2px;
}

/* ---- Card Grid ---- */
.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

@media (max-width: 768px) { .card-grid { grid-template-columns: 1fr; } }

/* ---- D-Card ---- */
.d-card {
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 18px 20px;
  transition: box-shadow 0.2s;
}

.d-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.04); }

.dc-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}

.dc-title {
  font-size: 14px; font-weight: 700; color: var(--primary);
  margin: 0; font-family: var(--font-display); letter-spacing: 0.02em;
}

.dc-badge {
  font-size: 10px; font-weight: 600;
  background: var(--bg-warm); color: var(--text-muted);
  padding: 2px 10px; border-radius: 10px;
}

.dc-badge-warn  { background: #fef3c7; color: #92400e; }
.dc-badge-info  { background: #dbeafe; color: #1e40af; }
.dc-badge-accent{ background: rgba(196,122,90,0.12); color: #a86040; }

.dc-hint { font-size: 11px; color: var(--text-muted); }

.dc-empty {
  font-size: 12px; color: var(--text-muted); text-align: center;
  padding: 28px 0; font-style: italic;
}

/* ---- Timetable ---- */
.tt-list { display: flex; flex-direction: column; gap: 2px; }

.tt-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 8px;
  transition: background 0.15s;
}

.tt-row:hover { background: var(--bg-warm); }

.tt-period {
  font-size: 11px; font-weight: 700; color: #fff;
  background: var(--accent); padding: 3px 10px; border-radius: 6px;
  min-width: 52px; text-align: center;
}

.tt-subject { font-size: 13px; font-weight: 600; color: var(--text-primary); flex: 1; }

.tt-meta { font-size: 10px; color: var(--text-muted); }

/* ---- Pending Homework ---- */
.hw-list { display: flex; flex-direction: column; gap: 2px; }

.hw-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-radius: 8px; gap: 12px;
  transition: background 0.15s;
}

.hw-row:hover { background: var(--bg-warm); }

.hw-row.overdue {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.hw-left { display: flex; align-items: center; gap: 8px; min-width: 0; }

.hw-subject {
  font-size: 11px; font-weight: 600; color: var(--accent);
  background: rgba(196,122,90,0.08); padding: 2px 8px; border-radius: 4px;
  flex-shrink: 0;
}

.hw-title {
  font-size: 13px; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.hw-due { font-size: 10px; color: var(--text-muted); flex-shrink: 0; }

.hw-due-over { color: #ef4444; font-weight: 600; }

/* ---- Scores ---- */
.sc-list { display: flex; flex-direction: column; gap: 6px; }

.sc-row {
  display: flex; align-items: center; gap: 10px;
}

.sc-subject {
  font-size: 12px; font-weight: 500; color: var(--text-primary);
  width: 64px; flex-shrink: 0;
}

.sc-bar-track {
  flex: 1; height: 8px; background: var(--bg-warm); border-radius: 4px;
  overflow: hidden;
}

.sc-bar {
  height: 100%; border-radius: 4px; transition: width 0.6s ease;
  min-width: 2px;
}

.sc-score {
  font-size: 12px; font-weight: 600; color: var(--text-primary);
  width: 60px; text-align: right; flex-shrink: 0;
}

.sc-score small { font-weight: 400; color: var(--text-muted); font-size: 10px; }

/* ---- Feedback ---- */
.fb-list { display: flex; flex-direction: column; gap: 10px; }

.fb-row {
  padding: 12px 14px; background: var(--bg-warm); border-radius: 8px;
  border: 1px solid var(--border-lighter);
}

.fb-top {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}

.fb-teacher {
  font-size: 12px; font-weight: 600; color: var(--accent-d);
}

.fb-subject {
  font-size: 10px; color: var(--text-muted);
  background: #fff; padding: 1px 8px; border-radius: 4px;
}

.fb-date { font-size: 10px; color: var(--text-muted); margin-left: auto; }

.fb-text {
  font-size: 12px; line-height: 1.7; color: var(--text-secondary); margin: 0;
}

/* ---- Practice ---- */
.practice-section { margin-bottom: 16px; }

.practice-grid {
  display: flex; gap: 12px; flex-wrap: wrap;
}

.practice-card {
  width: 100px; padding: 16px 12px;
  background: var(--bg-warm); border: 1px solid var(--border-light);
  border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; transition: all 0.2s;
}

.practice-card:hover {
  border-color: var(--accent);
  background: var(--card-bg);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.pc-icon { font-size: 26px; }

.pc-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }

.pc-arrow {
  font-size: 10px; color: var(--accent); font-weight: 500;
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
</style>
