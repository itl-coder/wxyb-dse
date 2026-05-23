<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📋 学生成长周报</div>
          <div class="admin-card-subtitle">时间范围选择 · Markdown 编辑 · 高清图片导出</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <el-select v-model="selectedStudentId" size="small" placeholder="选择学生" style="width:160px" filterable>
            <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
          </el-select>
          <el-date-picker v-model="dateRange" size="small" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" style="width:240px"
            :shortcuts="dateShortcuts" value-format="YYYY-MM-DD" />
          <el-button size="small" type="primary" @click="generateReport">🤖 生成周报</el-button>
        </div>
      </div>

      <!-- Report Content -->
      <div v-if="reportContent" class="report-workspace">
        <!-- Toolbar -->
        <div class="rw-toolbar">
          <span class="rw-title">{{ selectedStudent?.name || '未选择' }} · 成长周报</span>
          <span class="rw-dates">{{ dateRange?.[0] || '' }} 至 {{ dateRange?.[1] || '' }}</span>
          <span style="flex:1"></span>
          <el-button size="small" type="success" @click="exportImage">🖼️ 导出图片</el-button>
          <el-button size="small" @click="sendToParent">📤 发送家长</el-button>
          <el-button size="small" @click="copyReportText">📋 复制</el-button>
        </div>

        <!-- Markdown Editor (md-editor-v3) -->
        <div class="rw-md-editor-wrap">
          <AppWatermark>
            <MdEditor v-model="reportContent" :theme="store.theme" language="zh-CN" previewTheme="github" :toolbars="mdToolbars" :noPrettier="true" :noMermaid="true" />
          </AppWatermark>
        </div>

        <!-- Hidden export container (used by html2canvas) -->
        <div class="rw-export-hidden" style="position:absolute;left:-9999px;top:0;width:800px" aria-hidden="true">
          <div id="reportExportContainer" class="report-export-container">
            <div v-html="watermarkOverlayHTML"></div>
            <div class="re-ornament-top">
              <div class="re-ornament-line"></div>
              <div class="re-ornament-diamond">◆</div>
              <div class="re-ornament-line"></div>
            </div>
            <div class="re-header">
              <div class="re-header-left">
                <div class="re-student-name">{{ selectedStudent?.name || '' }}</div>
                <div class="re-student-meta">{{ selectedStudent?.class || '' }}班 · {{ dateRange?.[0] || '' }} 至 {{ dateRange?.[1] || '' }}</div>
              </div>
              <div class="re-header-right">
                <div class="re-badge">成长周报</div>
                <div class="re-school">{{ store.schoolName }}</div>
              </div>
            </div>
            <div class="re-stats-row" v-if="reportStats">
              <div class="re-stat-item">
                <div class="re-stat-icon">📅</div>
                <div class="re-stat-val">{{ reportStats.totalDays || 0 }}</div>
                <div class="re-stat-label">统计天数</div>
              </div>
              <div class="re-stat-item">
                <div class="re-stat-icon">✅</div>
                <div class="re-stat-val" :style="{color: (reportStats.attendanceRate || 100) >= 95 ? 'var(--admin-success)' : 'var(--admin-warning)'}">{{ reportStats.attendanceRate || 100 }}%</div>
                <div class="re-stat-label">出勤率</div>
              </div>
              <div class="re-stat-item">
                <div class="re-stat-icon">📝</div>
                <div class="re-stat-val" :style="{color: (reportStats.hwRate || 100) >= 90 ? 'var(--admin-success)' : 'var(--admin-warning)'}">{{ reportStats.hwRate || 100 }}%</div>
                <div class="re-stat-label">作业完成率</div>
              </div>
              <div class="re-stat-item">
                <div class="re-stat-icon">⭐</div>
                <div class="re-stat-val">{{ reportStats.positiveBehaviors || 0 }}</div>
                <div class="re-stat-label">积极表现</div>
              </div>
            </div>
            <div class="re-body" v-html="renderedReport"></div>
            <div class="re-footer-decoration">
              <div class="re-footer-flourish">❦</div>
              <div class="re-footer-line"></div>
              <div class="re-footer-text">{{ store.schoolName }} · 用心陪伴每一位学生的成长</div>
              <div class="re-footer-date">生成于 {{ today }}</div>
            </div>
            <div class="re-corner re-corner-tl"></div>
            <div class="re-corner re-corner-tr"></div>
            <div class="re-corner re-corner-bl"></div>
            <div class="re-corner re-corner-br"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="admin-empty">
        <div class="empty-icon">📋</div>
        <p>选择学生和时间范围，点击「生成周报」生成个性化成长报告</p>
        <p style="font-size:11px;color:var(--admin-text-muted);margin-top:4px">支持 Markdown 编辑，可导出为高清图片发送给家长</p>
      </div>
    </div>
  </div>
</template>

/**
 * 页面：学生成长周报
 * 功能：按学生与日期范围生成个性化成长周报，支持 Markdown 编辑与图片导出
 * 路由：/admin/reports
 */
<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { studentService, behaviorService, homeworkService, attendanceService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { marked } from 'marked'
import { getOverlayWatermarkHTML } from '@/utils/printTemplate'
import AppWatermark from '@/components/common/AppWatermark.vue'

const store = useAppStore()
const selectedStudentId = ref(null)
const dateRange = ref(null)
const reportContent = ref('')
const reportStats = ref(null)
const studentList = ref([])

const mdToolbars = ['bold', 'italic', 'underline', 'strikeThrough', 'title', '|', 'quote', 'unorderedList', 'orderedList', 'codeRow', 'code', '|', 'link', 'katex', 'table', '|', 'revoke', 'next', 'save', 'preview', 'fullscreen']

const today = new Date().toISOString().split('T')[0]
const watermarkOverlayHTML = computed(() => getOverlayWatermarkHTML())

// 励志语录源
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

const dateShortcuts = [
  { text: '本周', value: () => {
    const now = new Date()
    const day = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + 1)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return [monday, sunday]
  }},
  { text: '上周', value: () => {
    const now = new Date()
    const day = now.getDay() || 7
    const lastMonday = new Date(now)
    lastMonday.setDate(now.getDate() - day - 6)
    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastMonday.getDate() + 6)
    return [lastMonday, lastSunday]
  }},
  { text: '本月', value: () => {
    const now = new Date()
    return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)]
  }},
  { text: '上月', value: () => {
    const now = new Date()
    return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)]
  }}
]

onMounted(() => {
  studentList.value = studentService.getAll()
  // Default to current week
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  dateRange.value = [
    monday.toISOString().split('T')[0],
    sunday.toISOString().split('T')[0]
  ]
})

const selectedStudent = computed(() => {
  return studentList.value.find(s => s.id === selectedStudentId.value)
})

const renderedReport = computed(() => {
  if (!reportContent.value) return '<p style="color:#999">暂无内容</p>'
  return marked.parse(reportContent.value)
})

function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)]
}

function generateReport() {
  if (!selectedStudentId.value) { ElMessage.warning('请选择学生'); return }
  if (!dateRange.value || dateRange.value.length !== 2) { ElMessage.warning('请选择时间范围'); return }

  const sid = selectedStudentId.value
  const stu = selectedStudent.value
  if (!stu) { ElMessage.warning('未找到该学生'); return }

  const [startDate, endDate] = dateRange.value

  // 计算统计天数
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

  // Behavior data
  const behaviors = behaviorService.getAll().filter(b => b.studentId === sid)
  const positiveBehaviors = behaviors.filter(b => b.type === 'positive' || b.rating >= 4)
  const negativeBehaviors = behaviors.filter(b => b.type === 'negative' || b.rating <= 2)

  // Homework data
  const homeworks = homeworkService.getAll().filter(h => {
    return h.studentId === sid || h.class === stu.class
  })
  const doneCount = homeworks.filter(h => h.status === 'done' || h.submitted).length
  const hwTotal = homeworks.length || 1
  const hwRate = Math.round((doneCount / hwTotal) * 100)

  // Attendance data
  const attendances = attendanceService.getAll().filter(a => a.studentId === sid)
  const normalDays = attendances.filter(a => a.status === '正常').length
  const lateDays = attendances.filter(a => a.status === '迟到').length
  const absentDays = attendances.filter(a => a.status === '缺勤').length
  const totalAttDays = normalDays + lateDays + absentDays || totalDays
  const attendanceRate = Math.round((normalDays / totalAttDays) * 100)

  // Behavior summary
  const behaviorSummary = positiveBehaviors.length > 0
    ? positiveBehaviors.slice(0, 3).map(b => `${b.subject || '课堂'}表现积极`).join('、')
    : '课堂表现正常'

  reportStats.value = { totalDays, attendanceRate, hwRate, positiveBehaviors: positiveBehaviors.length }

  // Build highlights and concerns
  const highlights = []
  const concerns = []

  if (positiveBehaviors.length > 0) highlights.push('课堂参与积极，表现突出')
  if (hwRate >= 90) highlights.push('作业完成率高，学习态度端正')
  if (absentDays === 0 && lateDays === 0) highlights.push('时间段内全勤，时间管理意识强')
  if (highlights.length === 0) highlights.push('学习态度端正，每天都有新收获')

  if (negativeBehaviors.length > 0) concerns.push('课堂表现偶有波动，建议关注学习状态')
  if (hwRate < 80) concerns.push('作业完成率待提升，建议制定每日作业计划')
  if (lateDays > 0) concerns.push(`迟到${lateDays}次，建议优化作息时间`)
  if (concerns.length === 0) concerns.push('整体表现均衡，可在优势科目上进一步突破')

  const quote = getRandomQuote()

  // Generate Markdown report
  const mdLines = [
    `## 📝 总体评价`,
    ``,
    `${stu.name}同学在${startDate}至${endDate}期间（共${totalDays}天），整体表现${hwRate >= 80 ? '良好' : '需要关注'}。`,
    ``,
    `课堂方面，${behaviorSummary}。作业方面，共${hwTotal}项作业，已完成${doneCount}项，完成率 ${hwRate}%。出勤方面：正常${normalDays}天，迟到${lateDays}次，缺勤${absentDays}天。`,
    ``,
    `## ⭐ 本期亮点`,
    ``,
    ...highlights.map(h => `- ${h}`),
    ``,
    `## 💡 需要关注`,
    ``,
    ...concerns.map(c => `- ${c}`),
    ``,
    `## 📋 学习建议`,
    ``,
    `1. **课堂专注**：继续保持课堂积极参与，做好笔记整理`,
    `2. **作业习惯**：建议每天固定时间段完成作业，避免拖延`,
    `3. **时间管理**：合理分配各科学习时间，薄弱科目适当倾斜`,
    `4. **错题回顾**：每周抽出时间回顾本周错题，巩固薄弱知识点`,
    ``,
    `## 🌟 教师寄语`,
    ``,
    `> ${quote}`,
    ``,
    `---`,
    ``,
    `*${store.schoolName} · 用心陪伴每一位学生的成长*`
  ]

  reportContent.value = mdLines.join('\n')
}

async function exportImage() {
  if (!reportContent.value) { ElMessage.warning('请先生成周报'); return }

  const el = document.getElementById('reportExportContainer')
  if (!el) { ElMessage.warning('导出元素未找到'); return }

  try {
    ElMessage.info('正在生成高清图片…')
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#fffdf9',
      logging: false
    })

    // Download
    const link = document.createElement('a')
    link.download = `${selectedStudent.value?.name || '学生'}_成长周报_${dateRange.value?.[0] || ''}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success('高清图片已导出')
  } catch (e) {
    ElMessage.error('导出失败，请重试')
    console.error(e)
  }
}

function copyReportText() {
  if (!reportContent.value) { ElMessage.warning('请先生成周报'); return }
  navigator.clipboard.writeText(reportContent.value).then(() => {
    ElMessage.success('报告文字已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动选择文字复制')
  })
}

function sendToParent() {
  if (!reportContent.value) { ElMessage.warning('请先生成周报'); return }
  ElMessage.success('已模拟发送给家长（测试模式）')
}
</script>

<style scoped>
/* Workspace */
.report-workspace {
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-lg);
  overflow: hidden;
}

.rw-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--admin-bg-secondary);
  border-bottom: 1px solid var(--admin-border);
  flex-wrap: wrap;
}

.rw-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--admin-text);
}

.rw-dates {
  font-size: 11px;
  color: var(--admin-text-muted);
  background: var(--admin-surface);
  padding: 2px 10px;
  border-radius: 12px;
}

/* Editor Area */
.rw-md-editor-wrap {
  min-height: 500px;
}
.rw-md-editor-wrap :deep(.md-editor) {
  border: none;
  border-radius: 0;
}

.rw-export-hidden {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 800px;
}

/* === Export Container (for html2canvas) === */
.report-export-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.report-export-container {
  background: #fffdf9;
  padding: 48px 52px 40px;
  position: relative;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Serif SC', serif;
  color: #2c2416;
  line-height: 1.85;
  box-shadow: 0 2px 24px rgba(0,0,0,0.08);
  border-radius: 4px;
}

/* Decorative top ornament */
.re-ornament-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.re-ornament-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c9a050, transparent);
}

.re-ornament-diamond {
  color: #c9a050;
  font-size: 8px;
}

/* Header */
.re-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 2px solid #c9a050;
}

.re-header-left { }

.re-student-name {
  font-size: 22px;
  font-weight: 700;
  color: #1e180e;
  letter-spacing: 1px;
}

.re-student-meta {
  font-size: 12px;
  color: #8a7a60;
  margin-top: 4px;
}

.re-header-right {
  text-align: right;
}

.re-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #c9a050, #a07830);
  padding: 4px 16px;
  border-radius: 3px;
  letter-spacing: 2px;
}

.re-school {
  font-size: 11px;
  color: #8a7a60;
  margin-top: 6px;
}

/* Stats Row */
.re-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
  padding: 18px 0;
  border-top: 1px solid #e8e0d0;
  border-bottom: 1px solid #e8e0d0;
}

.re-stat-item {
  text-align: center;
}

.re-stat-icon {
  font-size: 18px;
  margin-bottom: 4px;
}

.re-stat-val {
  font-size: 22px;
  font-weight: 700;
  color: #1e180e;
}

.re-stat-label {
  font-size: 10px;
  color: #8a7a60;
  margin-top: 2px;
}

/* Body content */
.re-body {
  font-size: 13px;
  line-height: 1.9;
  color: #3d3226;
  min-height: 200px;
}

/* Override markdown rendered styles for the export */
.re-body :deep(h2) {
  font-size: 16px;
  font-weight: 700;
  color: #4a2c17;
  margin: 20px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e8e0d0;
}

.re-body :deep(h3) {
  font-size: 14px;
  font-weight: 600;
  color: #5c3d20;
  margin: 16px 0 8px;
}

.re-body :deep(p) {
  margin: 6px 0;
}

.re-body :deep(ul), .re-body :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.re-body :deep(li) {
  margin: 3px 0;
}

.re-body :deep(blockquote) {
  border-left: 3px solid #c9a050;
  margin: 12px 0;
  padding: 8px 16px;
  background: rgba(201,160,80,0.06);
  font-style: italic;
  color: #5c3d20;
}

.re-body :deep(strong) {
  color: #3d2200;
}

.re-body :deep(hr) {
  border: none;
  border-top: 1px solid #e8e0d0;
  margin: 20px 0;
}

.re-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 12px;
}

.re-body :deep(th) {
  background: #faf6ef;
  padding: 8px 12px;
  border: 1px solid #dad0b8;
  font-weight: 600;
  text-align: left;
}

.re-body :deep(td) {
  padding: 6px 12px;
  border: 1px solid #dad0b8;
}

/* Footer decoration */
.re-footer-decoration {
  text-align: center;
  margin-top: 32px;
  padding-top: 20px;
}

.re-footer-flourish {
  color: #c9a050;
  font-size: 14px;
  margin-bottom: 8px;
}

.re-footer-line {
  width: 60px;
  height: 1px;
  background: #c9a050;
  margin: 0 auto 10px;
}

.re-footer-text {
  font-size: 11px;
  color: #8a7a60;
  letter-spacing: 1px;
}

.re-footer-date {
  font-size: 10px;
  color: #b8a88a;
  margin-top: 4px;
}

/* Corner decorations */
.re-corner {
  position: absolute;
  width: 24px;
  height: 24px;
  pointer-events: none;
}

.re-corner-tl {
  top: 16px;
  left: 16px;
  border-top: 1px solid #c9a050;
  border-left: 1px solid #c9a050;
}

.re-corner-tr {
  top: 16px;
  right: 16px;
  border-top: 1px solid #c9a050;
  border-right: 1px solid #c9a050;
}

.re-corner-bl {
  bottom: 16px;
  left: 16px;
  border-bottom: 1px solid #c9a050;
  border-left: 1px solid #c9a050;
}

.re-corner-br {
  bottom: 16px;
  right: 16px;
  border-bottom: 1px solid #c9a050;
  border-right: 1px solid #c9a050;
}

/* Responsive */
@media (max-width: 768px) {
  .rw-editor-area { flex-direction: column; }
  .rw-mode-split .rw-editor-pane { border-right: none; border-bottom: 1px solid var(--admin-border); }
  .report-export-container { padding: 24px 20px 24px; }
  .re-stats-row { grid-template-columns: repeat(2, 1fr); }
  .rw-toolbar { gap: 4px; }
}
</style>
