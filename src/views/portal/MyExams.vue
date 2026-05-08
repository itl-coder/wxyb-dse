<template>
  <div v-if="student">
    <div class="p-card" style="margin-bottom:16px">
      <div class="p-card-title">📄 我的考试记录</div>
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
        <el-select v-model="filterExamType" size="small" placeholder="考试类型" style="width:110px" clearable>
          <el-option v-for="t in examTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-select v-model="filterSubject" size="small" placeholder="科目" style="width:110px" clearable>
          <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
        </el-select>
      </div>

      <div v-if="filteredExams.length === 0" class="ph-empty">暂无考试记录</div>

      <div class="ex-card-list">
        <div v-for="e in filteredExams" :key="e.id" class="ex-card">
          <div class="ex-card-top">
            <span class="ex-card-icon">{{ subjectIcon(e.subject) }}</span>
            <div class="ex-card-info">
              <span class="ex-card-subject">{{ e.subject }}</span>
              <span class="ex-card-type">{{ e.examType }}</span>
              <span class="ex-card-date">{{ e.date }}</span>
            </div>
            <div class="ex-card-score">
              <span class="ex-score-val" :style="{color: scoreColor(e.score, e.total)}">{{ e.score }}</span>
              <span class="ex-score-total">/ {{ e.total }}</span>
              <span class="ex-score-rate">{{ Math.round(e.score/e.total*100) }}%</span>
            </div>
          </div>
          <div class="ex-card-bottom">
            <div class="ex-rank" v-if="e.rank">排名 <b>{{ e.rank }}</b>/{{ e.totalStudents }}</div>
            <div v-if="e.englishScores" class="ex-eng-subs">
              <span v-for="(v, k) in e.englishScores" :key="k" class="ex-eng-sub">
                {{ {reading:'R',writing:'W',listening:'L',speaking:'S'}[k] }}:{{ v }}
              </span>
            </div>
            <div v-if="e.teacherFeedback" class="ex-feedback" :class="{ expanded: expandedFeedback.has(e.id) }" @click="toggleFeedback(e.id)">
              💬 {{ e.teacherFeedback }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Radar + Trend dual charts -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="p-card">
        <div class="p-card-title">🎯 科目能力雷达</div>
        <div v-if="radarData.length" class="radar-container">
          <div v-for="(d, i) in radarData" :key="d.label" class="radar-bar-row">
            <span class="radar-label">{{ d.label }}</span>
            <div class="radar-bar-wrap">
              <div class="radar-bar" :style="{width:d.value+'%',background:radarColor(i)}"></div>
            </div>
            <span class="radar-val" :style="{color:radarColor(i)}">{{ d.value }}%</span>
          </div>
        </div>
        <div v-else class="ph-empty">数据不足，无法生成能力图</div>
      </div>
      <div class="p-card">
        <div class="p-card-title">📈 成绩趋势（近6个月）</div>
        <div v-if="trendData.length" style="display:flex;align-items:flex-end;gap:12px;height:180px;padding:10px 0">
          <div v-for="t in trendData" :key="t.label" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
            <span style="font-size:11px;font-weight:600" :style="{color:t.value>=80?'var(--success)':t.value>=60?'var(--warning)':'var(--danger)'}">{{ t.value }}</span>
            <div :style="{height:t.value*1.4+'px',width:'28px',background:t.value>=80?'var(--success)':t.value>=60?'var(--warning)':'var(--danger)',borderRadius:'4px 4px 0 0',minHeight:'4px'}"></div>
            <span style="font-size:10px;color:var(--text-light)">{{ t.label }}</span>
          </div>
        </div>
        <div v-else class="ph-empty">数据不足，无法生成趋势</div>
      </div>
    </div>

    <div class="p-quote">🎯 "每一次考试都是成长的阶梯，分数不是终点，进步才是方向。"</div>
  </div>
  <div v-else class="ph-empty" style="padding:60px;text-align:center">正在加载学生数据...</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { examService, courseService } from '@/services/dataService'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const allExams = ref([])
const filterExamType = ref('')
const filterSubject = ref('')
const expandedFeedback = ref(new Set())

const examTypes = ['月考', '期中', '期末', '模考', 'DSE真题', '课堂测验']
const iconMap = { '数学':'📐', '中国语文':'📝', '英国语文':'🔤', '物理':'⚡', '化学':'🧪', '生物':'🧬', '历史':'📜', '地理':'🌍', '经济':'📈', '资讯及通讯科技':'💻', '企业、会计与财务概论':'📊', '视觉艺术':'🎨', '体育':'⚽', '音乐':'🎵', '数学延伸M1':'📐', '数学延伸M2':'📐' }
function subjectIcon(s) { return iconMap[s] || '📖' }
const radarColors = ['#4a90d9','#e67e22','#2ecc71','#9b59b6','#e74c3c','#1abc9c','#f39c12','#3498db']
function radarColor(i) { return radarColors[i % radarColors.length] }

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
    return { ...e, rank, totalStudents: sameExam.length }
  }).sort((a, b) => b.date.localeCompare(a.date))
})

const filteredExams = computed(() => {
  return exams.value.filter(e => {
    if (filterExamType.value && e.examType !== filterExamType.value) return false
    if (filterSubject.value && e.subject !== filterSubject.value) return false
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
    label,
    value: Math.round(scores.reduce((s, r) => s + r, 0) / scores.length)
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
  return Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([label, scores]) => ({
    label: label.substring(5),
    value: Math.round(scores.reduce((s, r) => s + r, 0) / scores.length)
  }))
})

function scoreColor(score, total) {
  const r = score / total
  return r >= 0.9 ? 'var(--success)' : r >= 0.75 ? 'var(--primary)' : r >= 0.6 ? 'var(--warning)' : 'var(--danger)'
}

function toggleFeedback(id) {
  if (expandedFeedback.value.has(id)) {
    expandedFeedback.value.delete(id)
  } else {
    expandedFeedback.value.add(id)
  }
}
</script>

<style scoped>
.p-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
.p-card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
.ph-empty { font-size: 12px; color: var(--text-light); padding: 20px 0; text-align: center; }

.ex-card-list { display: flex; flex-direction: column; gap: 8px; }
.ex-card { background: var(--bg); border-radius: 10px; padding: 12px 14px; border: 1px solid var(--border); }
.ex-card-top { display: flex; align-items: center; gap: 12px; }
.ex-card-icon { font-size: 22px; }
.ex-card-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.ex-card-subject { font-size: 13px; font-weight: 600; color: var(--text); }
.ex-card-type { font-size: 10px; color: var(--text-light); }
.ex-card-date { font-size: 10px; color: var(--text-light); }
.ex-card-score { text-align: right; }
.ex-score-val { font-size: 20px; font-weight: 700; }
.ex-score-total { font-size: 11px; color: var(--text-light); }
.ex-score-rate { display: block; font-size: 10px; color: var(--text-light); }
.ex-card-bottom { display: flex; align-items: center; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
.ex-rank { font-size: 11px; color: var(--text-light); background: var(--card-bg); padding: 2px 8px; border-radius: 4px; }
.ex-eng-subs { display: flex; gap: 4px; }
.ex-eng-sub { font-size: 10px; background: var(--accent); color: #1a2e3c; padding: 1px 5px; border-radius: 3px; }
.ex-feedback { font-size: 11px; color: var(--text-light); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.ex-feedback.expanded { white-space: normal; overflow: visible; }
.ex-feedback:hover { color: var(--accent); }

/* Radar */
.radar-container { display: flex; flex-direction: column; gap: 8px; }
.radar-bar-row { display: flex; align-items: center; gap: 8px; }
.radar-label { font-size: 11px; color: var(--text); width: 72px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.radar-bar-wrap { flex: 1; height: 14px; background: var(--bg); border-radius: 7px; overflow: hidden; }
.radar-bar { height: 100%; border-radius: 7px; transition: width 0.6s; }
.radar-val { font-size: 11px; font-weight: 600; width: 36px; }

.p-quote { text-align: center; font-size: 13px; color: var(--accent); padding: 20px; font-style: italic; line-height: 1.8; }
</style>
