<template>
  <div class="ev-page">
    <!-- 空状态 -->
    <div v-if="rooms.length === 0" class="ev-empty">
      <div class="ev-empty-seal">座</div>
      <p class="ev-empty-title">暂无座位安排</p>
      <p class="ev-empty-desc">请前往管理后台导入考生并完成排座后查看</p>
    </div>

    <template v-else>
      <div class="ev-toolbar no-print">
        <h1 class="ev-tb-title">{{ examName || '考试座位安排' }}</h1>
        <span class="ev-tb-count">共 {{ rooms.length }} 间教室</span>
      </div>

      <article
        v-for="(room, ri) in rooms"
        :key="room.id"
        class="ev-room-card"
      >
        <div class="ev-room-actions no-print">
          <span class="ev-room-label">{{ room.name }}</span>
          <button
            class="ev-print-btn"
            v-print="printConfigFor(room, ri)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            打印 {{ room.name }}
          </button>
        </div>

        <!--
          预览层：.ev-a4-scaler 负责屏幕缩小显示
          打印目标：.ev-a4-page 始终是 297mm×210mm 的真实 A4 尺寸
          vue3-print-nb 克隆 #ev-a4-room-X 到 iframe，不会带上 scaler 的 transform
        -->
        <div class="ev-a4-preview no-print">
          <div class="ev-a4-scaler">
            <div
              :id="printTargetId(ri)"
              class="ev-a4-page"
              :style="a4InlineStyle"
            >
              <ExamViewerHeader
                :title="examName || '考试座位表'"
                :room-name="room.name"
                :student-count="getRoomStudentCount(room.id)"
                :room-index="ri + 1"
                :rows="room.rows"
                :cols="room.cols"
              />
              <ExamViewerInfo
                :exam-subject="room.examSubject || examName || '—'"
                :exam-date="examDate || formatDateStr()"
                :exam-time="room.examTime || formattedTime"
                :room-name="room.name"
                :proctor="room.proctor || invigilators.join('、') || '—'"
                :room-type="room.exclusiveClassId ? room.exclusiveClassId + '班专属' : '混合编排'"
                :status-text="examStatus || '未开始'"
                :door-arrow="doorDir === 'left' ? '←' : '→'"
              />
              <ExamViewerSeatTable
                :rows="room.rows"
                :cols="room.cols"
                :assignments="getRoomAssignments(room.id)"
                :blocked-set="getRoomBlockedSet(room.id)"
                :student-map="studentMap"
                :door-seat-index="getDoorSeatIndex(room.id)"
                :door-dir="doorDir"
              />
              <div class="ev-podium">
                <span class="ev-podium-text">讲 台</span>
              </div>
              <ExamViewerRules :rules="examRules" />
              <ExamViewerFooter :total-seats="room.rows * room.cols" />
            </div>
          </div>
        </div>
      </article>
    </template>
  </div>
</template>

<script setup>
/**
 * 考试座位表 A4 查看器
 *
 * 打印链路：v-print → vue3-print-nb 克隆 #ev-a4-room-X → iframe → window.print()
 * 关键：A4 尺寸用 inline style 写在目标元素上，不依赖 scoped CSS
 */
import { computed } from 'vue'
import { useExamSeat2Store } from '@/views/admin/exams/exam-seat2/store/examSeat2Store'
import ExamViewerHeader from '@/components/exam/viewer/ExamViewerHeader.vue'
import ExamViewerInfo from '@/components/exam/viewer/ExamViewerInfo.vue'
import ExamViewerSeatTable from '@/components/exam/viewer/ExamViewerSeatTable.vue'
import ExamViewerRules from '@/components/exam/viewer/ExamViewerRules.vue'
import ExamViewerFooter from '@/components/exam/viewer/ExamViewerFooter.vue'

const store = useExamSeat2Store()

const rooms = computed(() => store.rooms)
const students = computed(() => store.students)
const assignments = computed(() => store.assignments)
const blockedSeats = computed(() => store.blockedSeats)

const examName = computed(() => store.examName)
const examDate = computed(() => store.examDate)
const examStartTime = computed(() => store.examStartTime)
const examEndTime = computed(() => store.examEndTime)
const invigilators = computed(() => store.invigilators || [])
const examStatus = computed(() => store.examStatus)
const doorDir = computed(() => store.doorDirection || 'left')

const formattedTime = computed(() => {
  const s = examStartTime.value || ''
  const e = examEndTime.value || ''
  if (s || e) return `${s} — ${e}`
  return '—'
})

const studentMap = computed(() => {
  const m = {}
  students.value.forEach(s => { m[s.id] = s })
  return m
})

// ---- inline style 保证 A4 尺寸在 print iframe 中生效 ----
const a4InlineStyle = 'width:297mm;height:210mm;background:#fff;color:#000;padding:6mm 8mm;box-sizing:border-box;overflow:hidden;font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;'

function getRoomAssignments(roomId) {
  return assignments.value.filter(a => a.roomId === roomId)
}

function getRoomBlockedSet(roomId) {
  const set = new Set()
  blockedSeats.value.forEach(b => {
    if (b.roomId === roomId) set.add(b.seatIndex)
  })
  return set
}

function getRoomStudentCount(roomId) {
  return new Set(assignments.value.filter(a => a.roomId === roomId).map(a => a.studentId)).size
}

function getDoorSeatIndex(roomId) {
  return store.getDoorSeatIndex(roomId)
}

function printTargetId(ri) {
  return `ev-a4-room-${ri}`
}

function printConfigFor(room, ri) {
  return {
    id: printTargetId(ri),
    standard: 'html5',
    popTitle: `${examName.value || '座位表'} - ${room.name}`,
    preview: false,
    beforeOpenCallback() {},
    openCallback() {},
    closeCallback() {}
  }
}

function formatDateStr() {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}
</script>

<script>
export default { name: 'ExamSeatViewer' }
</script>

<style scoped>
/* ====== 页面壳（屏幕预览用，不会进入打印 iframe） ====== */
.ev-page {
  min-height: 100vh;
  background: #2c2c2c;
  padding: 24px 32px;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.ev-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80vh;
  color: #888;
}
.ev-empty-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px; height: 64px;
  border: 2px solid #888;
  color: #888;
  font-family: "Noto Serif SC", serif;
  font-size: 24px;
  border-radius: 50%;
  margin-bottom: 12px;
}
.ev-empty-title { font-size: 14px; font-weight: 600; color: #aaa; margin: 0; }
.ev-empty-desc { font-size: 11px; color: #666; margin: 4px 0 0; }

.ev-toolbar {
  display: flex; align-items: baseline; gap: 16px;
  margin-bottom: 20px; padding-bottom: 12px;
  border-bottom: 1px solid #444;
}
.ev-tb-title { margin: 0; font-size: 20px; font-weight: 700; color: #e0e0e0; letter-spacing: 2px; }
.ev-tb-count { font-size: 12px; color: #777; }

.ev-room-card { margin-bottom: 32px; }
.ev-room-actions { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.ev-room-label { font-size: 13px; font-weight: 600; color: #ccc; }
.ev-print-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 16px; border: 1px solid #666;
  background: #3a3a3a; color: #ddd;
  cursor: pointer; font-size: 12px; font-weight: 500;
  font-family: inherit; letter-spacing: 0.5px; transition: all 0.15s;
}
.ev-print-btn:hover { background: #555; border-color: #999; color: #fff; }

/* ====== 预览容器 ====== */
.ev-a4-preview {
  display: flex; justify-content: center;
  background: #1a1a1a; padding: 16px 0; border-radius: 4px;
}

/* ====== A4 缩放器（仅屏幕预览，不进打印） ====== */
.ev-a4-scaler {
  width: 297mm;
  height: 210mm;
  transform-origin: top center;
  transform: scale(0.55);
  margin-bottom: calc(-210mm * 0.45);
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);
}

/* A4 页面在 scaler 内部撑满 */
.ev-a4-scaler > .ev-a4-page {
  transform: none !important;
  margin: 0 !important;
  box-shadow: none !important;
}

/* ====== 讲台 ====== */
.ev-podium {
  text-align: center; margin: 6px 0; padding: 4px 0;
  border-top: 1px solid #999; border-bottom: 1px solid #999;
}
.ev-podium-text {
  font-size: 10px; font-weight: 600; letter-spacing: 8px;
  color: #444; font-family: "Noto Serif SC", serif;
}
</style>

<!--
  非 scoped 样式：
  - 会被 document.styleSheets 收集
  - vue3-print-nb 会将所有 styleSheets 的 cssRules 写入 iframe 的 <style>
  - 所以 .ev-a4-page 的打印样式必须在非 scoped 块中定义
-->
<style>
/* ---- A4 页面基础尺寸（非 scoped，会被注入 iframe） ---- */
.ev-a4-page {
  width: 297mm;
  height: 210mm;
  background: #fff;
  color: #000;
  padding: 6mm 8mm;
  box-sizing: border-box;
  overflow: hidden;
  font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
}

/* ---- 打印时 @page 规则 ---- */
@media print {
  @page {
    size: 297mm 210mm landscape;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
    background: #fff;
  }

  .ev-a4-page {
    width: 297mm;
    height: 210mm;
    margin: 0;
    padding: 6mm 8mm;
    box-sizing: border-box;
    overflow: hidden;
    page-break-after: always;
  }

  .ev-a4-page:last-child {
    page-break-after: auto;
  }
}
</style>
