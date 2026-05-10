<template>
  <template v-if="student">
    <div v-if="portalCfg.showExamRecords" class="ex-page">
    <!-- Header -->
    <div class="page-head">
      <div class="head-left">
        <h2 class="head-title">我的考试</h2>
        <p class="head-sub">共 {{ exams.length }} 次考试记录</p>
      </div>
      <div v-if="overallAvg !== null && portalCfg.showScores" class="head-avg">
        <span class="havg-label">总平均分</span>
        <span class="havg-num" :class="overallAvg >= 80 ? 'c-green' : overallAvg >= 60 ? 'c-amber' : 'c-red'">{{ overallAvg }}%</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="fb-row">
        <span class="fb-label">筛选</span>
        <div class="fb-chips">
          <button class="fb-chip" :class="{ on: !filterExamType }" @click="filterExamType = ''">全部类型</button>
          <button
            v-for="t in examTypes" :key="t"
            class="fb-chip" :class="{ on: filterExamType === t }"
            @click="filterExamType = filterExamType === t ? '' : t"
          >{{ t }}</button>
        </div>
      </div>
      <div class="fb-row">
        <span class="fb-label">科目</span>
        <div class="fb-chips">
          <button class="fb-chip" :class="{ on: !filterSubject }" @click="filterSubject = ''">全部科目</button>
          <button
            v-for="s in subjectList" :key="s"
            class="fb-chip" :class="{ on: filterSubject === s }"
            @click="filterSubject = filterSubject === s ? '' : s"
          >{{ s }}</button>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="filteredExams.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15c1.5-2 4-2 8 0"/><circle cx="9" cy="9" r="0.8" fill="currentColor"/><circle cx="15" cy="9" r="0.8" fill="currentColor"/></svg>
      </div>
      <p class="empty-title">{{ exams.length === 0 ? '暂无考试记录' : '筛选结果为空' }}</p>
    </div>

    <!-- Exam List -->
    <div v-else class="ex-list">
      <div
        v-for="e in filteredExams" :key="e.id"
        class="ex-card"
        :class="{ open: e._open }"
      >
        <!-- Card Row -->
        <div class="exc-row" @click="e._open = !e._open">
          <!-- Score circle -->
          <div v-if="portalCfg.showScores" class="exc-score-ring">
            <svg viewBox="0 0 40 40" class="exc-svg">
              <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border-lighter)" stroke-width="3"/>
              <circle
                cx="20" cy="20" r="17" fill="none"
                :stroke="scoreRingColor(e.score / e.total)"
                stroke-width="3" stroke-linecap="round"
                :style="{ strokeDasharray: (e.score / e.total * 107) + ', 107', transform: 'rotate(-90deg)', transformOrigin: 'center' }"
              />
            </svg>
            <span class="exc-score-text" :style="{ color: scoreRingColor(e.score / e.total) }">{{ Math.round(e.score / e.total * 100) }}</span>
          </div>

          <!-- Info -->
          <div class="exc-info">
            <div class="exc-info-top">
              <span class="exc-subject">{{ e.subject }}</span>
              <span class="exc-type">{{ e.examType }}</span>
            </div>
            <div class="exc-info-meta">
              <span>{{ e.date }}</span>
              <span v-if="e.rank && portalCfg.showRanking" class="exc-sep">·</span>
              <span v-if="e.rank && portalCfg.showRanking" class="exc-rank">排名 {{ e.rank }}/{{ e.totalStudents }}</span>
            </div>
          </div>

          <!-- Score -->
          <div v-if="portalCfg.showScores" class="exc-score">
            <span class="exc-score-val" :style="{ color: scoreRingColor(e.score / e.total) }">{{ e.score }}</span>
            <span class="exc-score-total">/ {{ e.total }}</span>
          </div>

          <!-- English sub-scores -->
          <div v-if="e.englishScores" class="exc-eng">
            <span v-for="(v, k) in e.englishScores" :key="k" class="exc-eng-tag">
              {{ {reading:'R',writing:'W',listening:'L',speaking:'S'}[k] }} {{ v }}
            </span>
          </div>

          <span class="exc-caret">{{ e._open ? '▾' : '▸' }}</span>
        </div>

        <!-- Expanded -->
        <div v-if="e._open" class="exc-detail">
          <div class="exc-detail-grid">
            <div class="exc-detail-left">
              <div class="edd-section" v-if="e.teacherFeedback">
                <div class="edd-label">老师反馈</div>
                <p class="edd-feedback">{{ e.teacherFeedback }}</p>
              </div>
              <div v-else class="edd-section">
                <p class="edd-feedback" style="color:var(--text-muted)">暂无教师反馈</p>
              </div>
            </div>
            <div class="exc-detail-right">
              <div class="edd-card">
                <div class="edd-row"><span>科目</span><span>{{ e.subject }}</span></div>
                <div class="edd-row"><span>考试类型</span><span>{{ e.examType }}</span></div>
                <div class="edd-row"><span>日期</span><span>{{ e.date }}</span></div>
                <div class="edd-row"><span>得分</span><span class="edd-score">{{ e.score }} / {{ e.total }} ({{ Math.round(e.score / e.total * 100) }}%)</span></div>
                <div class="edd-row" v-if="e.rank && portalCfg.showRanking"><span>排名</span><span>{{ e.rank }} / {{ e.totalStudents }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-grid" v-if="exams.length">
      <!-- Radar: Subject Ability -->
      <div class="chart-card">
        <div class="chart-head">科目能力分布</div>
        <div v-if="radarData.length" class="chart-body">
          <VChart :option="radarOption" autoresize style="height:320px" />
        </div>
        <div v-else class="chart-empty">至少需要2个科目的考试数据才能生成能力图</div>
      </div>

      <!-- Line: 6-Month Trend -->
      <div class="chart-card">
        <div class="chart-head">近6月成绩趋势</div>
        <div v-if="trendData.length" class="chart-body">
          <VChart :option="trendOption" autoresize style="height:320px" />
        </div>
        <div v-else class="chart-empty">至少需要2个月的考试数据才能生成趋势</div>
      </div>
    </div>

    <div class="page-quote">每一次考试都是成长的阶梯，分数不是终点，进步才是方向。</div>
    </div>
    <div v-else class="empty-state" style="padding:80px 0">
      <p class="empty-title">考试记录功能暂未开放</p>
    </div>
  </template>
  <div v-else class="loading-state">
    <div class="loading-spinner"></div>
    <p>正在加载学生数据...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { examService, portalConfigService } from '@/services/dataService'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const portalCfg = ref(portalConfigService.get())
const allExams = ref([])
const filterExamType = ref('')
const filterSubject = ref('')

const examTypes = ['月考', '期中', '期末', '模考', 'DSE真题', '课堂测验']

function scoreRingColor(rate) {
  return rate >= 0.9 ? 'var(--success)' : rate >= 0.75 ? 'var(--primary)' : rate >= 0.6 ? 'var(--warning)' : 'var(--danger)'
}

function getGradeKey(className) {
  if (!className) return null
  const n = parseInt(className)
  if (n === 5) return 's5'
  if (n === 6) return 's6'
  return null
}

function isExamVisible(exam, cfg) {
  const ev = cfg.examVisibility
  if (!ev) return true
  switch (exam.examType) {
    case '月考': {
      const m = parseInt(exam.date.split('-')[1])
      return ev.monthly[m] !== false
    }
    case '期中': {
      const gk = getGradeKey(student.value?.class)
      return gk ? ev.midterm[gk] !== false : true
    }
    case '期末': {
      const gk = getGradeKey(student.value?.class)
      return gk ? ev.final[gk] !== false : true
    }
    case '模考': return ev.mock !== false
    case 'DSE真题': return ev.dse !== false
    case '课堂测验': return ev.quiz !== false
    default: return true
  }
}

// --- ECharts options ---
const radarOption = computed(() => {
  const labels = radarData.value.map(d => d.label)
  const values = radarData.value.map(d => d.value)
  const maxVal = Math.ceil(Math.max(...values, 60) / 10) * 10

  return {
    tooltip: {
      trigger: 'item',
      formatter: (p) => `${p.name}: <b>${p.value}%</b>`
    },
    legend: { show: false },
    radar: {
      center: ['50%', '52%'],
      radius: '68%',
      indicator: labels.map(l => ({ name: l, max: maxVal })),
      axisName: { color: '#8a8a8a', fontSize: 11 },
      axisLine: { lineStyle: { color: '#e0d8d0' } },
      splitLine: { lineStyle: { color: '#e8e2da' } },
      splitArea: { areaStyle: { color: ['#fefcf9', '#f6f3ee'] } }
    },
    series: [{
      type: 'radar',
      data: [{ value: values, name: '当前水平', areaStyle: { color: 'rgba(196,122,90,0.18)' } }],
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#c47a5a', width: 2 },
      itemStyle: { color: '#c47a5a' },
      areaStyle: { color: 'rgba(196,122,90,0.12)' }
    }]
  }
})

const trendOption = computed(() => {
  const labels = trendData.value.map(d => d.label + '月')
  const values = trendData.value.map(d => d.value)
  const minVal = Math.floor(Math.min(...values, 40) / 10) * 10
  const maxVal = Math.ceil(Math.max(...values, 80) / 10) * 10

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => `${params[0].axisValue}<br/>平均分: <b>${params[0].value}%</b>`,
      backgroundColor: '#fff',
      borderColor: '#e0d8d0',
      textStyle: { color: '#1c1c1c', fontSize: 12 }
    },
    grid: { left: 16, right: 20, top: 20, bottom: 16, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#e0d8d0' } },
      axisTick: { show: false },
      axisLabel: { color: '#8a8a8a', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: minVal,
      max: maxVal,
      axisLabel: { color: '#8a8a8a', fontSize: 10, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f0ece5', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#c47a5a', width: 2.5 },
      itemStyle: { color: '#c47a5a', borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(196,122,90,0.22)' },
            { offset: 1, color: 'rgba(196,122,90,0.02)' }
          ]
        }
      },
      markLine: {
        silent: true,
        data: [{ type: 'average', name: '平均' }],
        lineStyle: { color: '#c49a5a', type: 'dashed', width: 1 },
        label: { fontSize: 10, color: '#c49a5a', formatter: '均 {c}%' }
      }
    }]
  }
})

onMounted(() => {
  if (!store.currentStudentId) return
  allExams.value = examService.getAll()
})

const subjectList = computed(() => {
  const sids = allExams.value.filter(e => e.studentId === store.currentStudentId).map(e => e.subject)
  return [...new Set(sids)]
})

const exams = computed(() => {
  const sid = store.currentStudentId
  if (!sid) return []
  const mine = allExams.value.filter(e => e.studentId === sid)
  return mine.map(e => {
    const sameExam = allExams.value.filter(x => x.subject === e.subject && x.examType === e.examType && x.date === e.date)
    const sorted = sameExam.sort((a, b) => b.score / b.total - a.score / a.total)
    const rank = sorted.findIndex(x => x.studentId === sid) + 1
    return { ...e, rank, totalStudents: sameExam.length, _open: false }
  }).sort((a, b) => b.date.localeCompare(a.date))
})

const overallAvg = computed(() => {
  if (!exams.value.length) return null
  return Math.round(exams.value.reduce((s, e) => s + e.score / e.total * 100, 0) / exams.value.length)
})

const filteredExams = computed(() => {
  return exams.value.filter(e => {
    if (filterExamType.value && e.examType !== filterExamType.value) return false
    if (filterSubject.value && e.subject !== filterSubject.value) return false
    if (!isExamVisible(e, portalCfg.value)) return false
    return true
  })
})

const radarData = computed(() => {
  const sid = store.currentStudentId
  if (!sid) return []
  const mine = allExams.value.filter(e => e.studentId === sid)
  const bySubject = {}
  mine.forEach(e => {
    if (!bySubject[e.subject]) bySubject[e.subject] = []
    bySubject[e.subject].push(e.score / e.total * 100)
  })
  return Object.entries(bySubject).map(([label, scores]) => ({
    label, value: Math.round(scores.reduce((s, r) => s + r, 0) / scores.length)
  })).sort((a, b) => b.value - a.value)
})

const trendData = computed(() => {
  const sid = store.currentStudentId
  if (!sid) return []
  const mine = allExams.value.filter(e => e.studentId === sid)
  const byMonth = {}
  mine.forEach(e => {
    const m = e.date.substring(0, 7)
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(e.score / e.total * 100)
  })
  return Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([label, scores]) => ({
      label: label.substring(5),
      value: Math.round(scores.reduce((s, r) => s + r, 0) / scores.length)
    }))
})

</script>

<style scoped>
.ex-page { max-width: 1000px; margin: 0 auto; font-family: var(--font-body); color: var(--text-primary); }

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

.head-avg { text-align: center; flex-shrink: 0; }

.havg-label { display: block; font-size: 10px; color: var(--text-muted); }

.havg-num {
  font-size: 28px; font-weight: 700; font-family: var(--font-display);
}

.havg-num.c-green { color: var(--success); }
.havg-num.c-amber { color: var(--warning); }
.havg-num.c-red   { color: var(--danger); }

/* ---- Filters ---- */
.filter-bar { margin-bottom: 18px; display: flex; flex-direction: column; gap: 8px; }

.fb-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.fb-label { font-size: 11px; font-weight: 600; color: var(--text-muted); flex-shrink: 0; min-width: 28px; }

.fb-chips { display: flex; gap: 5px; flex-wrap: wrap; }

.fb-chip {
  padding: 4px 13px; border-radius: 14px; border: 1px solid var(--border-light);
  background: var(--card-bg); font-size: 11px; color: var(--text-secondary);
  cursor: pointer; transition: all 0.16s; font-family: var(--font-body);
}

.fb-chip:hover { border-color: var(--accent); color: var(--accent-d); }
.fb-chip.on { background: var(--primary); border-color: var(--primary); color: #fff; }

/* ---- Empty ---- */
.empty-state { text-align: center; padding: 80px 20px; }
.empty-icon { color: var(--text-muted); margin-bottom: 14px; opacity: 0.35; }
.empty-title { font-size: 15px; font-weight: 600; color: var(--text-secondary); margin: 0; }

/* ---- Exam List ---- */
.ex-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }

.ex-card {
  background: var(--card-bg); border: 1px solid var(--border-light);
  border-radius: 12px; overflow: hidden; transition: all 0.18s;
}

.ex-card:hover { border-color: var(--border-base); box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
.ex-card.open { border-color: var(--border-base); box-shadow: 0 2px 12px rgba(0,0,0,0.05); }

/* ---- Card Row ---- */
.exc-row {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 18px; cursor: pointer; user-select: none;
}

/* Score Ring */
.exc-score-ring {
  width: 44px; height: 44px; position: relative;
  flex-shrink: 0;
}

.exc-svg { width: 100%; height: 100%; }

.exc-score-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; font-family: var(--font-display);
}

/* Info */
.exc-info { flex: 1; min-width: 0; }

.exc-info-top { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }

.exc-subject { font-size: 14px; font-weight: 600; color: var(--text-primary); }

.exc-type {
  font-size: 10px; color: var(--text-muted);
  background: var(--bg-warm); padding: 2px 8px; border-radius: 4px;
}

.exc-info-meta {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--text-muted);
}

.exc-sep { color: var(--border-base); }

.exc-rank { color: var(--accent-d); font-weight: 500; }

/* Score */
.exc-score {
  text-align: right; flex-shrink: 0;
}

.exc-score-val { font-size: 22px; font-weight: 700; font-family: var(--font-display); line-height: 1; }

.exc-score-total { font-size: 11px; color: var(--text-muted); }

/* English sub-scores */
.exc-eng {
  display: flex; gap: 4px; flex-shrink: 0;
}

.exc-eng-tag {
  font-size: 10px; font-weight: 600; color: #1a2e3c;
  background: rgba(196,122,90,0.12); padding: 2px 6px; border-radius: 4px;
}

.exc-caret { font-size: 12px; color: var(--text-muted); flex-shrink: 0; }

/* ---- Expanded Detail ---- */
.exc-detail {
  padding: 0 18px 16px; border-top: 1px dashed var(--border-lighter);
  background: rgba(246,243,238,0.5);
}

.exc-detail-grid {
  display: grid; grid-template-columns: 1fr 220px; gap: 20px;
  padding-top: 14px;
}

.edd-label {
  font-size: 10px; font-weight: 700; color: var(--text-muted);
  letter-spacing: 0.06em; margin-bottom: 8px;
}

.edd-feedback {
  font-size: 13px; line-height: 1.7; color: var(--text-secondary);
  margin: 0; padding: 12px 14px; background: var(--bg-warm);
  border-radius: 8px; border: 1px solid var(--border-lighter);
}

.edd-card {
  padding: 14px; background: var(--card-bg); border-radius: 8px;
  border: 1px solid var(--border-lighter);
}

.edd-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; font-size: 12px;
  border-bottom: 1px dotted var(--border-lighter);
}

.edd-row:last-child { border-bottom: none; }

.edd-row span:first-child { color: var(--text-muted); font-size: 11px; }

.edd-row span:last-child { color: var(--text-primary); font-weight: 500; }

.edd-score { color: var(--accent-d) !important; font-weight: 600 !important; }

/* ---- Charts ---- */
.charts-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  margin-bottom: 24px;
}

@media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }

.chart-card {
  background: var(--card-bg); border: 1px solid var(--border-light);
  border-radius: 12px; padding: 18px 20px;
}

.chart-head {
  font-size: 13px; font-weight: 700; color: var(--primary);
  font-family: var(--font-display); margin-bottom: 14px;
}

.chart-body { padding: 4px 0; }

.chart-empty {
  font-size: 12px; color: var(--text-muted); text-align: center;
  padding: 50px 0; font-style: italic;
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
  .exc-row { flex-wrap: wrap; gap: 8px; }
  .exc-eng { width: 100%; }
  .exc-detail-grid { grid-template-columns: 1fr; }
}
</style>
