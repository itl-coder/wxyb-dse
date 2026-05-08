<template>
  <div class="portal-dashboard" v-if="student">
    <div class="welcome-card">
      <div class="welcome-info">
        <h2>{{ student.name }}，{{ timeGreeting }}</h2>
        <p>{{ student.class }}班 · {{ student.campus }} · 今日 {{ todayLessons.length }} 节课</p>
      </div>
      <div class="welcome-stats">
        <div class="ws-item"><div class="ws-val" :style="{color: hwRate >= 80 ? 'var(--success)' : 'var(--warning)'}">{{ hwRate }}%</div><div class="ws-label">作业完成率</div></div>
        <div class="ws-item"><div class="ws-val" :style="{color: latestExamAvg >= 75 ? 'var(--success)' : 'var(--warning)'}">{{ latestExamAvg }}</div><div class="ws-label">近考均分</div></div>
        <div class="ws-item"><div class="ws-val" style="color:var(--success)">{{ attendanceRate }}%</div><div class="ws-label">出勤率</div></div>
        <div class="ws-item"><div class="ws-val" style="color:var(--accent)">{{ praiseCount }}</div><div class="ws-label">获表扬</div></div>
      </div>
    </div>

    <div class="ph-grid">
      <div class="ph-card">
        <div class="ph-card-title">📅 今日课表</div>
        <div v-if="todayLessons.length === 0" class="ph-empty">今日无课程安排</div>
        <div v-for="l in todayLessons" :key="l.id" class="lesson-row">
          <span class="lr-period">{{ l.period }}</span><span class="lr-subject">{{ l.subject }}</span><span class="lr-info">{{ l.teacher }} · {{ l.room }}</span>
        </div>
      </div>
      <div class="ph-card">
        <div class="ph-card-title">📝 待完成作业 <span v-if="pendingHw.length" class="badge">{{ pendingHw.length }}</span></div>
        <div v-if="pendingHw.length === 0" class="ph-empty">所有作业已完成 🎉</div>
        <div v-for="h in pendingHw" :key="h.id" class="hw-row">
          <div class="hw-main"><span class="hw-subject">{{ h.subject }}</span><span class="hw-title">{{ h.title }}</span></div>
          <div class="hw-meta"><span :class="h.dueDate < today ? 'hw-overdue' : ''">截止 {{ h.dueDate }}</span></div>
        </div>
      </div>
      <div class="ph-card">
        <div class="ph-card-title">📊 近期成绩</div>
        <div v-if="recentExams.length === 0" class="ph-empty">暂无考试记录</div>
        <div v-for="e in recentExams" :key="e.id" class="exam-row">
          <span class="er-subject">{{ e.subject }}</span>
          <div class="er-bar-wrap"><div class="er-bar" :style="{width: (e.score/e.total*100)+'%', background: scoreGradient(e.score/e.total)}"></div></div>
          <span class="er-score">{{ e.score }}/{{ e.total }}</span>
        </div>
      </div>
      <div class="ph-card">
        <div class="ph-card-title">💬 老师反馈</div>
        <div v-if="feedbacks.length === 0" class="ph-empty">暂无反馈</div>
        <div v-for="f in feedbacks" :key="f.id" class="fb-row">
          <div class="fb-header"><span class="fb-teacher">{{ f.teacher }}</span><span class="fb-subject">{{ f.subject }}</span><span class="fb-date">{{ f.date }}</span></div>
          <div class="fb-text">{{ f.feedback }}</div>
        </div>
      </div>
    </div>

    <div class="ph-card" style="margin-top:16px">
      <div class="ph-card-title">🎯 周末练习卷</div>
      <div v-if="electiveSubjects.length === 0" class="ph-empty">请先完善选修课信息</div>
      <div v-else style="display:flex;gap:12px;flex-wrap:wrap">
        <div v-for="subj in electiveSubjects" :key="subj" class="practice-card" @click="$router.push('/practice')">
          <span style="font-size:20px">{{ subjectIcon(subj) }}</span><span style="font-size:12px;color:var(--text)">{{ subj }}</span><span style="font-size:10px;color:var(--text-light)">专项练习</span>
        </div>
      </div>
    </div>

    <div class="p-quote">🌟 "每一天的认真与坚持，都会在未来的某个时刻发光。"</div>
  </div>
  <div v-else class="ph-empty" style="padding:60px;text-align:center">正在加载学生数据...</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { timetableService, homeworkService, examService, behaviorService, attendanceService } from '@/services/dataService'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const today = new Date().toISOString().split('T')[0]
const timeGreeting = computed(() => {
  const h = new Date().getHours()
  return h < 6 ? '夜深了 🌙' : h < 12 ? '早上好 ☀️' : h < 14 ? '中午好 🌤️' : h < 18 ? '下午好 🌈' : '晚上好 🌙'
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

const todayLessons = computed(() => student.value ? timetableService.getByDay(today).filter(t => t.class === student.value.class) : [])
const pendingHw = computed(() => allHomeworks.value.filter(h => h.status !== '已提交').slice(0, 5))
const hwRate = computed(() => { const a = allHomeworks.value; return a.length ? Math.round(a.filter(h => h.status === '已提交').length / a.length * 100) : 100 })
const recentExams = computed(() => allExams.value.slice(0, 5))
const latestExamAvg = computed(() => { const l = allExams.value.slice(0, 3); return l.length ? Math.round(l.reduce((s, e) => s + e.score / e.total * 100, 0) / l.length) : '—' })
const attendanceRate = computed(() => { const a = attendances.value; return a.length ? Math.round(a.filter(x => x.status === '正常').length / a.length * 100) : 100 })
const praiseCount = computed(() => allBehaviors.value.filter(b => b.type === 'success').length)
const feedbacks = computed(() => allExams.value.filter(e => e.teacherFeedback).slice(0, 3).map(e => ({ id: e.id, teacher: student.value?.cc || '老师', subject: e.subject, date: e.date, feedback: e.teacherFeedback })))
const electiveSubjects = computed(() => student.value ? [student.value.elective1, student.value.elective2, student.value.elective3].filter(Boolean) : [])
const iconMap = { '物理':'⚛️','化学':'🧪','生物':'🧬','经济':'📈','历史':'📜','地理':'🌍','中国历史':'🏯','资讯及通讯科技':'💻','企业、会计与财务概论':'📊','视觉艺术':'🎨','体育':'⚽','音乐':'🎵','数学延伸M1':'📐','数学延伸M2':'📐' }
function subjectIcon(s) { return iconMap[s] || '📖' }
function scoreGradient(r) { return r >= 0.9 ? 'var(--success)' : r >= 0.75 ? 'var(--primary)' : r >= 0.6 ? 'var(--warning)' : 'var(--danger)' }
</script>

<style scoped>
.portal-dashboard { animation: fadeIn 0.3s; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.welcome-card { background: linear-gradient(135deg, #1a2e3c, #2c4a5e); border-radius: 14px; padding: 24px 28px; color: #fff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
.welcome-info h2 { font-size: 22px; margin: 0 0 4px; color: var(--accent); }
.welcome-info p { font-size: 12px; opacity: 0.7; margin: 0; }
.welcome-stats { display: flex; gap: 24px; }
.ws-item { text-align: center; }
.ws-val { font-size: 24px; font-weight: 700; }
.ws-label { font-size: 10px; opacity: 0.6; margin-top: 2px; }
.ph-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 768px) { .ph-grid { grid-template-columns: 1fr; } }
.ph-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
.ph-card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.ph-empty { font-size: 12px; color: var(--text-light); padding: 20px 0; text-align: center; }
.badge { background: var(--danger); color: #fff; font-size: 10px; padding: 1px 7px; border-radius: 10px; }
.lesson-row, .hw-row, .exam-row, .fb-row { padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.lesson-row:last-child, .hw-row:last-child, .exam-row:last-child, .fb-row:last-child { border-bottom: none; }
.lr-period { background: var(--accent); color: #1a2e3c; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; min-width: 44px; text-align: center; }
.lr-subject { flex: 1; color: var(--text); font-weight: 500; }
.lr-info { color: var(--text-light); font-size: 10px; }
.hw-main { flex: 1; }
.hw-subject { color: var(--accent); margin-right: 8px; font-weight: 500; }
.hw-title { color: var(--text); }
.hw-meta { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--text-light); }
.hw-overdue { color: var(--danger) !important; font-weight: 600; }
.er-subject { color: var(--text); font-weight: 500; width: 70px; font-size: 12px; }
.er-bar-wrap { flex: 1; height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; }
.er-bar { height: 100%; border-radius: 4px; transition: width 0.5s; }
.er-score { font-size: 11px; color: var(--text-light); width: 50px; text-align: right; }
.fb-header { display: flex; gap: 10px; margin-bottom: 4px; }
.fb-teacher { color: var(--accent); font-weight: 500; font-size: 11px; }
.fb-subject { color: var(--text-light); font-size: 10px; }
.fb-date { color: var(--text-light); font-size: 10px; margin-left: auto; }
.fb-text { font-size: 11px; color: var(--text); line-height: 1.6; }
.practice-card { width: 80px; height: 80px; background: var(--bg); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; border: 1px solid var(--border); transition: all 0.2s; }
.practice-card:hover { border-color: var(--accent); }
.p-quote { text-align: center; font-size: 13px; color: var(--accent); padding: 20px; font-style: italic; line-height: 1.8; }
</style>
