<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📋 学生成长日报</div>
          <div class="admin-card-subtitle">自动汇总每日课堂表现 · 作业 · 考勤 · 心理状态</div>
        </div>
        <div style="display:flex;gap:8px">
          <el-select v-model="selectedStudentId" size="small" placeholder="选择学生" style="width:160px" filterable>
            <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
          </el-select>
          <el-date-picker v-model="reportDate" size="small" type="date" style="width:140px" />
          <el-button size="small" type="primary" @click="generateReport">🤖 生成日报</el-button>
        </div>
      </div>

      <!-- Report preview -->
      <div v-if="report" class="report-preview">
        <div class="report-header">
          <h3>{{ selectedStudent?.name || '未选择' }} · 每日成长报告</h3>
          <span class="report-date">{{ reportDate?.toLocaleDateString('zh-CN') }}</span>
        </div>

        <div class="report-grid">
          <!-- 总体评价 -->
          <div class="report-section overall">
            <div class="rs-title">📝 总体评价</div>
            <div class="rs-content">
              <p>{{ report.overall }}</p>
            </div>
          </div>

          <!-- 课堂表现 -->
          <div class="report-section">
            <div class="rs-title">👥 课堂表现</div>
            <div class="rs-content">
              <div class="report-metric">
                <span>完成率</span>
                <div class="metric-bar"><div class="metric-fill" :style="{width:report.hwRate+'%',background:report.hwRate>=80?'var(--admin-success)':report.hwRate>=60?'var(--admin-warning)':'var(--admin-danger)'}"></div></div>
                <span class="metric-val">{{ report.hwRate }}%</span>
              </div>
              <p style="margin-top:10px;font-size:11px;color:var(--admin-text-muted)">{{ report.behaviorNote }}</p>
            </div>
          </div>

          <!-- 作业情况 -->
          <div class="report-section">
            <div class="rs-title">📝 作业完成</div>
            <div class="rs-content">
              <p style="font-size:12px;line-height:1.8;color:var(--admin-text-secondary)">{{ report.homeworkNote }}</p>
            </div>
          </div>

          <!-- 考勤 -->
          <div class="report-section">
            <div class="rs-title">✓ 出勤情况</div>
            <div class="rs-content">
              <div class="attendance-status">
                <span class="status-dot" :class="report.absentDays===0&&report.lateDays===0?'ontime':'late'"></span>
                {{ report.attendanceNote }}
              </div>
            </div>
          </div>

          <!-- 考试成绩 -->
          <div class="report-section" v-if="report.examNote">
            <div class="rs-title">📄 考试成绩</div>
            <div class="rs-content">
              <p style="font-size:12px;line-height:1.8;color:var(--admin-text-secondary)">{{ report.examNote }}</p>
            </div>
          </div>

          <!-- 亮点 -->
          <div class="report-section highlight">
            <div class="rs-title">⭐ 今日亮点</div>
            <div class="rs-content">
              <ul class="highlight-list">
                <li v-for="h in report.highlights" :key="h">{{ h }}</li>
              </ul>
            </div>
          </div>

          <!-- 需要关注 -->
          <div class="report-section attention">
            <div class="rs-title">💡 需要关注</div>
            <div class="rs-content">
              <ul class="attention-list">
                <li v-for="a in report.attention" :key="a">{{ a }}</li>
              </ul>
            </div>
          </div>

          <!-- 励志语录 -->
          <div class="report-section quote-section">
            <div class="rs-title">🌟 今日寄语</div>
            <div class="rs-content">
              <p class="quote-text">「{{ report.quote }}」</p>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:16px">
          <el-button type="primary" size="small" @click="sendToParent">📤 发送给家长</el-button>
          <el-button size="small" @click="printReport">🖨️ 打印报告</el-button>
          <el-button size="small" @click="copyReportText">📋 复制文字</el-button>
        </div>
      </div>

      <div v-else class="admin-empty">
        <div class="empty-icon">📋</div>
        <p>选择学生和日期，点击「生成日报」生成个性化成长报告</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { studentService, behaviorService, homeworkService, attendanceService, examService } from '@/services/dataService'
import { getWatermarkHTML, getWatermarkStyle } from '@/utils/watermark'

const selectedStudentId = ref(null)
const reportDate = ref(new Date())
const report = ref(null)
const studentList = ref([])

// 励志语录源（可维护扩展）
const quotes = [
  '学习如逆水行舟，不进则退。今天的每一分努力，都会在未来某一天开花结果。',
  '成功的路上并不拥挤，因为坚持的人不多。每一次认真完成作业，都是对未来的自己负责。',
  '千里之行，始于足下。基础扎实了，高楼才能稳固。',
  '学习不是为了超越别人，而是为了遇见更好的自己。',
  '每一个优秀的人，都有一段沉默的时光。那段时间付出了很多努力，却看不到结果——我们把它叫做扎根。',
  '知识的力量在于运用，而非记忆。把学到的知识讲给别人听，才是真正的掌握。',
  '今天的汗水，是明天的底气。不要在最能吃苦的年纪选择安逸。',
  '成长不是一蹴而就的，它藏在每一天的坚持里。今天比昨天进步一点点，就是胜利。',
  '学习就像爬山，每一步都很辛苦，但每登高一步，看到的风景就更广阔一些。',
  '世界上最公平的事就是：每个人每天都只有24小时。你怎样利用时间，时间就怎样回报你。'
]

onMounted(() => {
  studentList.value = studentService.getAll()
})

const selectedStudent = computed(() => {
  return studentList.value.find(s => s.id === selectedStudentId.value)
})

function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)]
}

function generateReport() {
  if (!selectedStudentId.value) { ElMessage.warning('请选择学生'); return }

  const sid = selectedStudentId.value
  const stu = selectedStudent.value
  if (!stu) { ElMessage.warning('未找到该学生'); return }

  // 从 behaviorService 获取课堂表现
  const behaviors = behaviorService.getAll().filter(b => b.studentId === sid)
  const positiveBehaviors = behaviors.filter(b => b.type === 'positive' || b.rating >= 4)
  const negativeBehaviors = behaviors.filter(b => b.type === 'negative' || b.rating <= 2)
  const behaviorNote = positiveBehaviors.length > 0
    ? positiveBehaviors.slice(0, 3).map(b => `${b.subject || ''}课${b.description || '表现积极'}`).join('。')
    : '今日课堂表现正常，无异常记录。'

  // 从 homeworkService 获取作业数据
  const homeworks = homeworkService.getAll().filter(h => {
    const hwStudent = h.studentId === sid || h.class === stu.class
    const hwDate = h.dueDate || h.date
    return hwStudent
  })
  const doneCount = homeworks.filter(h => h.status === 'done' || h.submitted).length
  const hwTotal = homeworks.length || 5
  const hwRate = Math.round((doneCount / hwTotal) * 100)
  const homeworkNote = homeworks.length > 0
    ? `本周共${hwTotal}项作业，已完成${doneCount}项，完成率${hwRate}%。${hwRate >= 80 ? '作业完成情况良好。' : hwRate >= 60 ? '部分作业尚未提交，需关注。' : '作业完成率偏低，需要重点督促。'}`
    : '本周暂未布置作业记录。'

  // 从 attendanceService 获取考勤
  const attendances = attendanceService.getAll().filter(a => a.studentId === sid)
  const normalDays = attendances.filter(a => a.status === '正常').length
  const lateDays = attendances.filter(a => a.status === '迟到').length
  const absentDays = attendances.filter(a => a.status === '缺勤').length
  const attendanceNote = `本周出勤：正常${normalDays}天，迟到${lateDays}次，缺勤${absentDays}天。${absentDays > 0 ? '存在缺勤情况，需了解原因。' : lateDays > 0 ? '有迟到现象，需提醒时间管理。' : '出勤情况良好。'}`

  // 从 examService 获取成绩
  const exams = examService.getAll().filter(e => e.studentId === sid).slice(-5)
  const examNote = exams.length > 0
    ? `最近${exams.length}次考试成绩：${exams.map(e => `${e.subject || '未知'}${e.score}分`).join('、')}。`
    : '暂无近期考试记录。'

  // 生成亮点和关注点
  const highlights = []
  const attention = []

  if (positiveBehaviors.length > 0) {
    highlights.push('课堂参与积极，表现突出')
  }
  if (hwRate >= 90) {
    highlights.push('作业完成率高，学习态度端正')
  }
  if (absentDays === 0 && lateDays === 0) {
    highlights.push('本周全勤，时间管理意识强')
  }
  if (exams.some(e => (e.score || 0) >= 85)) {
    highlights.push('部分科目成绩优异，展现扎实基础')
  }

  if (negativeBehaviors.length > 0) {
    attention.push('课堂表现偶有波动，建议关注学习状态')
  }
  if (hwRate < 80) {
    attention.push('作业完成率待提升，建议制定每日作业计划')
  }
  if (lateDays > 0) {
    attention.push(`迟到${lateDays}次，建议优化作息时间`)
  }
  if (exams.some(e => (e.score || 100) < 60)) {
    attention.push('部分科目基础薄弱，建议针对性加强练习')
  }
  if (attention.length === 0) {
    attention.push('整体表现均衡，可在优势科目上进一步突破')
  }
  if (highlights.length === 0) {
    highlights.push('学习态度端正，每天都有新收获')
  }

  const quote = getRandomQuote()

  report.value = {
    overall: `${stu.name}同学本阶段整体表现${hwRate >= 80 ? '良好' : '需要关注'}。${behaviorNote} ${homeworkNote} ${quote}`,
    behaviorNote,
    homeworkNote,
    attendanceNote,
    examNote,
    highlights,
    attention,
    quote,
    hwRate,
    normalDays,
    lateDays,
    absentDays
  }
}

function printReport() {
  if (!report.value) { ElMessage.warning('请先生成报告'); return }
  const r = report.value
  const stu = selectedStudent.value
  const dateLabel = reportDate.value.toLocaleDateString('zh-CN')
  const h = r.highlights.map(x => `<li>✓ ${x}</li>`).join('')
  const a = r.attention.map(x => `<li>→ ${x}</li>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>成长日报</title><style>
    @page { size: A4 portrait; margin: 18mm; }
    body { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; color: #2c2c2c; line-height: 1.8; }
    .header { border-bottom: 2px solid #c9a050; padding-bottom: 12px; margin-bottom: 18px; }
    .header h2 { margin: 0; font-size: 20px; color: #4a2c17; }
    .header .date { font-size: 12px; color: #888; }
    .section { margin: 14px 0; padding: 10px 14px; background: #faf8f5; border-radius: 8px; }
    .section h4 { margin: 0 0 6px; font-size: 14px; color: #4a2c17; }
    .section p { margin: 0; font-size: 12px; color: #555; }
    .section ul { list-style: none; padding: 0; margin: 4px 0; }
    .section ul li { font-size: 12px; color: #555; padding: 2px 0; }
    .highlight { border-left: 3px solid #4caf50; }
    .attention { border-left: 3px solid #c9a050; }
    .quote { text-align: center; font-style: italic; color: #8b6914; font-size: 13px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #e8e0d0; }
    .footer { margin-top: 20px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
    ${getWatermarkStyle()}
  </style></head><body>
  <div class="header"><h2>📋 ${stu?.name || ''} · 每日成长报告</h2><div class="date">${dateLabel}</div></div>
  <div class="section"><h4>📝 总体评价</h4><p>${r.overall}</p></div>
  <div class="section"><h4>👥 课堂表现</h4><p>${r.behaviorNote}</p></div>
  <div class="section"><h4>📝 作业完成</h4><p>${r.homeworkNote}</p></div>
  <div class="section"><h4>✓ 出勤情况</h4><p>${r.attendanceNote}</p></div>
  ${r.examNote ? `<div class="section"><h4>📄 考试成绩</h4><p>${r.examNote}</p></div>` : ''}
  <div class="section highlight"><h4>⭐ 今日亮点</h4><ul>${h}</ul></div>
  <div class="section attention"><h4>💡 需要关注</h4><ul>${a}</ul></div>
  <div class="quote">「${r.quote}」</div>
  <div class="footer">威学一百 DSE 教务管理系统 · ${new Date().toISOString().split('T')[0]}</div>
  ${getWatermarkHTML()}
  </body></html>`
  const w = window.open('', '_blank', 'width=600,height=800')
  if (!w) { ElMessage.warning('请允许弹窗后重试'); return }
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 300)
}

function copyReportText() {
  if (!report.value) { ElMessage.warning('请先生成报告'); return }
  const r = report.value
  const stu = selectedStudent.value
  const dateLabel = reportDate.value.toLocaleDateString('zh-CN')
  const text = [
    `📋 ${stu?.name || ''} · 每日成长报告 — ${dateLabel}`,
    '',
    `📝 总体评价：${r.overall}`,
    `👥 课堂表现：${r.behaviorNote}`,
    `📝 作业完成：${r.homeworkNote}`,
    `✓ 出勤情况：${r.attendanceNote}`,
    r.examNote ? `📄 考试成绩：${r.examNote}` : '',
    `⭐ 今日亮点：${r.highlights.join('；')}`,
    `💡 需要关注：${r.attention.join('；')}`,
    `🌟 今日寄语：「${r.quote}」`
  ].filter(Boolean).join('\n\n')
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('报告文字已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动选择文字复制')
  })
}

function sendToParent() {
  if (!report.value) { ElMessage.warning('请先生成报告'); return }
  ElMessage.success('已模拟发送给家长（测试模式）')
}
</script>

<style scoped>
.report-preview {
  background: var(--admin-bg);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--admin-border);
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--admin-accent);
}

.report-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--admin-text);
}

.report-date {
  font-size: 12px;
  color: var(--admin-text-muted);
  background: var(--admin-surface);
  padding: 4px 12px;
  border-radius: 6px;
}

.report-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.report-section.overall {
  grid-column: 1 / -1;
}

.report-section {
  background: var(--admin-surface);
  border-radius: 10px;
  padding: 16px;
}

.report-section.highlight {
  border-left: 3px solid var(--admin-success);
}

.report-section.attention {
  border-left: 3px solid var(--admin-accent);
}

.rs-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--admin-text);
  margin-bottom: 10px;
}

.rs-content {
  position: relative;
  font-size: 12px;
  line-height: 1.8;
  color: var(--admin-text-secondary);
}

.ai-badge {
  display: inline-block;
  font-size: 9px;
  background: linear-gradient(135deg, var(--admin-accent), var(--admin-accent-dark));
  color: #0a1628;
  padding: 1px 8px;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 8px;
}

.report-metric {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 11px;
}

.report-metric > span:first-child {
  width: 56px;
  color: var(--admin-text-secondary);
}

.metric-bar {
  flex: 1;
  height: 6px;
  background: var(--admin-bg);
  border-radius: 3px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.metric-val {
  width: 32px;
  text-align: right;
  font-weight: 600;
  color: var(--admin-text);
}

.attendance-status {
  font-size: 13px;
  color: var(--admin-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.ontime { background: var(--admin-success); }
.status-dot.late { background: var(--admin-warning); }

.report-section.quote-section {
  background: linear-gradient(135deg, rgba(201,160,80,0.08) 0%, rgba(201,160,80,0.02) 100%);
  border-left: 3px solid var(--admin-accent);
  grid-column: 1 / -1;
}

.quote-text {
  font-size: 13px;
  font-style: italic;
  color: var(--admin-accent);
  line-height: 1.8;
  text-align: center;
}

.highlight-list, .attention-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.highlight-list li {
  padding: 3px 0;
  font-size: 12px;
  color: var(--admin-text-secondary);
}

.highlight-list li::before {
  content: '✓ ';
  color: var(--admin-success);
  font-weight: 700;
}

.attention-list li {
  padding: 3px 0;
  font-size: 12px;
  color: var(--admin-text-secondary);
}

.attention-list li::before {
  content: '→ ';
  color: var(--admin-accent);
  font-weight: 700;
}
</style>
