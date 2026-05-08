<template>
  <div v-if="student">
    <div class="p-card" style="margin-bottom:16px">
      <div class="p-card-title">📊 学习习惯总览</div>
      <div class="habit-grid">
        <div class="habit-card">
          <div class="habit-icon">✅</div>
          <div class="habit-val" :style="{color: hwRate>=80?'var(--success)':'var(--warning)'}">{{ hwRate }}%</div>
          <div class="habit-label">作业完成率</div>
          <div class="habit-sub">{{ allHomeworks.length }}项作业中完成{{ completedHw }}项</div>
        </div>
        <div class="habit-card">
          <div class="habit-icon">🕐</div>
          <div class="habit-val" :style="{color: attendanceRate>=90?'var(--success)':'var(--warning)'}">{{ attendanceRate }}%</div>
          <div class="habit-label">出勤率</div>
          <div class="habit-sub">近30天考勤统计</div>
        </div>
        <div class="habit-card">
          <div class="habit-icon">⭐</div>
          <div class="habit-val" style="color:var(--accent)">{{ praiseCount }}</div>
          <div class="habit-label">获表扬次数</div>
          <div class="habit-sub">课堂积极表现</div>
        </div>
        <div class="habit-card">
          <div class="habit-icon">📝</div>
          <div class="habit-val" style="color:var(--primary)">{{ feedbackCount }}</div>
          <div class="habit-label">老师反馈</div>
          <div class="habit-sub">针对性学习建议</div>
        </div>
      </div>
    </div>

    <div class="p-card" style="margin-bottom:16px">
      <div class="p-card-title">💬 近期老师反馈</div>
      <div v-if="feedbacks.length === 0" class="ph-empty">暂无反馈记录</div>
      <div v-for="f in feedbacks" :key="f.id" class="fb-card">
        <div class="fb-header">
          <span class="fb-subject">{{ f.subject }}</span>
          <span class="fb-type">{{ f.examType }}</span>
          <span class="fb-date">{{ f.date }}</span>
        </div>
        <div class="fb-body" :class="{ expanded: expandedFb.has(f.id) }" @click="toggleFb(f.id)">
          {{ f.teacherFeedback }}
        </div>
      </div>
    </div>

    <div class="p-card" style="margin-bottom:16px">
      <div class="p-card-title">📋 课堂表现记录</div>
      <div v-if="behaviors.length === 0" class="ph-empty">暂无课堂表现记录</div>
      <div v-for="b in behaviors" :key="b.id" class="bh-row">
        <span class="bh-icon">{{ b.type === 'success' ? '🌟' : b.type === 'warning' ? '⚠️' : '💡' }}</span>
        <div class="bh-info">
          <span class="bh-text">{{ b.behavior }}</span>
          <span class="bh-meta">{{ b.subject }} · {{ b.time }}</span>
        </div>
        <span class="admin-tag" :class="b.type==='success'?'success':b.type==='warning'?'warning':'info'">{{ b.score }}</span>
      </div>
    </div>

    <div class="p-quote">🌱 "优秀不是偶然，而是每一天好习惯的累积。关注过程，结果自然会来。"</div>
  </div>
  <div v-else class="ph-empty" style="padding:60px;text-align:center">正在加载学生数据...</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { examService, behaviorService, homeworkService, attendanceService } from '@/services/dataService'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const allExams = ref([])
const allBehaviors = ref([])
const allHomeworks = ref([])
const attendances = ref([])
const expandedFb = ref(new Set())

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
const feedbackCount = computed(() => allExams.value.filter(e => e.teacherFeedback).length)

const feedbacks = computed(() =>
  allExams.value.filter(e => e.teacherFeedback).slice(0, 6).map(e => ({
    id: e.id, subject: e.subject, examType: e.examType, date: e.date, teacherFeedback: e.teacherFeedback
  }))
)

const behaviors = computed(() => allBehaviors.value.slice(0, 10))

function toggleFb(id) {
  if (expandedFb.value.has(id)) {
    expandedFb.value.delete(id)
  } else {
    expandedFb.value.add(id)
  }
}
</script>

<style scoped>
.p-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
.p-card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
.ph-empty { font-size: 12px; color: var(--text-light); padding: 20px 0; text-align: center; }

.habit-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media (max-width: 768px) { .habit-grid { grid-template-columns: repeat(2, 1fr); } }
.habit-card { background: var(--bg); border-radius: 10px; padding: 16px; text-align: center; }
.habit-icon { font-size: 24px; margin-bottom: 6px; }
.habit-val { font-size: 24px; font-weight: 700; }
.habit-label { font-size: 12px; color: var(--text); font-weight: 500; margin-top: 2px; }
.habit-sub { font-size: 10px; color: var(--text-light); margin-top: 4px; }

.fb-card { background: var(--bg); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
.fb-header { display: flex; gap: 10px; margin-bottom: 6px; }
.fb-subject { font-size: 12px; font-weight: 600; color: var(--text); }
.fb-type { font-size: 10px; color: var(--text-light); background: var(--card-bg); padding: 1px 6px; border-radius: 4px; }
.fb-date { font-size: 10px; color: var(--text-light); margin-left: auto; }
.fb-body { font-size: 12px; color: var(--text-light); line-height: 1.6; max-height: 2.4em; overflow: hidden; cursor: pointer; }
.fb-body.expanded { max-height: none; }
.fb-body:hover { color: var(--accent); }

.bh-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
.bh-row:last-child { border-bottom: none; }
.bh-icon { font-size: 16px; width: 24px; text-align: center; }
.bh-info { flex: 1; }
.bh-text { color: var(--text); }
.bh-meta { display: block; font-size: 10px; color: var(--text-light); margin-top: 1px; }

.p-quote { text-align: center; font-size: 13px; color: var(--accent); padding: 20px; font-style: italic; line-height: 1.8; }
</style>
