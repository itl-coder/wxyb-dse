<template>
  <div class="hop">
    <!-- 功能关闭提示 -->
    <div v-if="!enabled" class="hop-off-wrap">
      <div class="hop-off-card">
        <div class="hop-off-icon">📭</div>
        <h2>当日无交接内容</h2>
        <p>按照日常流程进行，无需特殊交接事项。</p>
        <p class="hop-cd">{{ countdown }} 秒后自动跳转智能学习系统首页</p>
        <button class="hop-btn hop-btn-pri" @click="goHome">立即跳转</button>
      </div>
    </div>

    <template v-else>
      <!-- 顶部工具栏 -->
      <div class="hop-toolbar">
        <div class="hop-tb-left">
          <button class="hop-arr" @click="prevWeek">◂</button>
          <span class="hop-week-title">{{ weekLabel }}</span>
          <button class="hop-arr" @click="nextWeek">▸</button>
          <button class="hop-today-btn" @click="goToday">今天</button>
        </div>
        <div class="hop-tb-right">
          <span class="hop-summary">{{ doneCount }}/{{ activeDayCount }} 天已交接</span>
          <button class="hop-export-btn" @click="exportImage" :disabled="exporting">
            {{ exporting ? '导出中...' : '📸 导出图片' }}
          </button>
        </div>
      </div>

      <!-- 导出区域 -->
      <div ref="exportRef" class="hop-export-area">
        <!-- 周概览卡片 -->
        <div class="hop-week-row">
          <div v-for="d in weekDays" :key="d.key" class="hop-wd-card" :class="{ today: d.isToday, empty: !d.shift }">
            <div class="hop-wd-name">{{ d.label }}</div>
            <div class="hop-wd-date">{{ d.dateStr }}</div>
            <div v-if="d.shift" class="hop-wd-shift" :class="d.shift === 'L' ? 'sl' : d.shift === 'M' ? 'sm' : 'sa'">
              {{ d.shift === 'L' ? '🌅 早班' : d.shift === 'M' ? '🌇 晚班' : '☀️ A班' }}
            </div>
            <div v-else class="hop-wd-shift so">休</div>
            <div v-if="d.hasRecord" class="hop-wd-ok">✓</div>
            <div v-else-if="d.shift" class="hop-wd-no">—</div>
          </div>
        </div>

        <!-- 每天的交接详情 -->
        <div v-for="d in weekDaysWithRecords" :key="d.key" class="hop-day-section">
          <div class="hop-day-title-bar">
            <span class="hop-dt-day">{{ d.label }} {{ d.dateStr }}</span>
            <span class="hop-dt-shift" :class="d.shift === 'L' ? 'sl' : d.shift === 'M' ? 'sm' : 'sa'">
              {{ d.shift === 'L' ? '早班 7:30-16:30' : d.shift === 'M' ? '晚班 13:00-22:00' : 'A班 9:00-18:00' }}
            </span>
          </div>

          <!-- 无记录 -->
          <div v-if="!d.record" class="hop-day-empty">该日暂无交接内容</div>

          <template v-else>
            <!-- 作业收集 -->
            <div v-if="d.record.homeworkItems?.length" class="hop-block">
              <div class="hop-block-title">📝 作业收集情况</div>
              <div class="hop-hw-list">
                <div v-for="(h, i) in d.record.homeworkItems" :key="i" class="hop-hw-item">
                  <div class="hop-hw-head">
                    <span class="hop-hw-subject">{{ h.subject }}</span>
                    <span class="hop-hw-count">实交 {{ h.count }}{{ h.totalCount ? ' / 应交 ' + h.totalCount : '' }} 份</span>
                    <span class="hop-hw-grade" :class="h.graded === true ? 'done' : h.graded === 'partial' ? 'part' : 'no'">
                      {{ h.graded === true ? '✓ 已批改' : h.graded === 'partial' ? '◐ 部分批改' : '○ 未批改' }}
                    </span>
                  </div>
                  <div class="hop-hw-body">
                    <div v-if="h.studentNames" class="hop-hw-line"><b>缺交/迟交：</b>{{ h.studentNames }}</div>
                    <div v-if="h.location" class="hop-hw-line"><b>放置位置：</b>{{ h.location }}</div>
                    <div v-if="h.notes" class="hop-hw-line"><b>备注：</b>{{ h.notes }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 会议纪要 -->
            <div v-if="d.record.meetingNotes?.hasMeeting" class="hop-block">
              <div class="hop-block-title">📋 会议纪要</div>
              <div class="hop-mt-card">
                <div class="hop-mt-title">{{ d.record.meetingNotes.title }}</div>
                <div v-if="d.record.meetingNotes.content" class="hop-mt-content">{{ d.record.meetingNotes.content }}</div>
                <div v-if="d.record.meetingNotes.transcription" class="hop-mt-trans">
                  <b>📝 文字记录：</b>{{ d.record.meetingNotes.transcription }}
                </div>
              </div>
            </div>

            <!-- 学生情况 -->
            <div v-if="d.record.studentSituations?.length" class="hop-block">
              <div class="hop-block-title">👥 学生特殊情况同步 ({{ d.record.studentSituations.length }}条)</div>
              <div class="hop-stu-grid">
                <div v-for="(s, i) in d.record.studentSituations" :key="i" class="hop-stu-card" :class="{ handled: s.handled }">
                  <div class="hop-stu-card-hd">
                    <span class="hop-stu-name">{{ s.studentName }}</span>
                    <span class="hop-stu-status" :class="s.handled ? 'ok' : 'warn'">{{ s.handled ? '✓ 已处理' : '⚠ 待跟进' }}</span>
                  </div>
                  <span class="hop-stu-type-tag">{{ s.type }}</span>
                  <div v-if="s.description" class="hop-stu-desc">{{ s.description }}</div>
                  <div v-if="s.followUp" class="hop-stu-follow">👉 接班注意：{{ s.followUp }}</div>
                </div>
              </div>
            </div>

            <!-- 手机管理 -->
            <div v-if="d.record.phoneManagement?.enabled" class="hop-block hop-phone-block">
              <div class="hop-block-title">📱 班级手机管理</div>
              <div class="hop-phone-stats">
                <div class="hop-phone-stat">
                  <span class="hop-phone-val">{{ d.record.phoneManagement.totalPhones }}</span>
                  <span class="hop-phone-lbl">班级总数</span>
                </div>
                <div class="hop-phone-divider"></div>
                <div class="hop-phone-stat">
                  <span class="hop-phone-val ok">{{ d.record.phoneManagement.receivedPhones }}</span>
                  <span class="hop-phone-lbl">实际收到</span>
                </div>
                <div class="hop-phone-divider"></div>
                <div class="hop-phone-stat">
                  <span class="hop-phone-val warn">{{ d.record.phoneManagement.totalPhones - d.record.phoneManagement.receivedPhones }}</span>
                  <span class="hop-phone-lbl">未交数量</span>
                </div>
              </div>
              <div v-if="d.record.phoneManagement.unreceivedReason" class="hop-phone-reason">
                <b>未交原因：</b>{{ d.record.phoneManagement.unreceivedReason }}
              </div>
              <div class="hop-phone-hint">※ 学生请假离校时手机直接发放</div>
            </div>

            <!-- 请假记录 -->
            <div v-if="d.record.leaveRecords?.length" class="hop-block">
              <div class="hop-block-title">🏥 请假情况 ({{ d.record.leaveRecords.length }}人)</div>
              <div class="hop-leave-list">
                <div v-for="(l, i) in d.record.leaveRecords" :key="i" class="hop-leave-item">
                  <div class="hop-leave-head">
                    <span class="hop-leave-name">{{ l.studentName }}</span>
                    <span class="hop-leave-reason">{{ l.reason }}</span>
                    <span class="hop-leave-tag" :class="l.parentNotified ? 'ok' : 'warn'">{{ l.parentNotified ? '家长知晓' : '待通知家长' }}</span>
                    <span v-if="l.phoneGiven" class="hop-leave-tag phone">📱 已发手机</span>
                  </div>
                  <div class="hop-leave-time">离校时间：{{ l.leaveTime || '未填写' }}</div>
                </div>
              </div>
            </div>

            <!-- 备注 -->
            <div v-if="d.record.generalNotes" class="hop-block">
              <div class="hop-block-title">📌 其他备注</div>
              <div class="hop-note-card">{{ d.record.generalNotes }}</div>
            </div>
          </template>
        </div>

        <!-- 整周无交接 -->
        <div v-if="weekDaysWithRecords.length === 0" class="hop-all-empty">
          <div class="hop-all-empty-icon">📋</div>
          <p>本周暂无交接内容记录</p>
          <p class="hop-all-empty-sub">各天班次配置后，请前往 <a href="/admin/handover" style="color:var(--accent)">管理后台</a> 填写交接数据</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { handoverService, shiftConfigService, portalConfigService } from '@/services/dataService'
import html2canvas from 'html2canvas'

const router = useRouter()

// ===== 开关 =====
const enabled = ref(true)
const countdown = ref(10)
let cdTimer = null
function checkEnabled() { const cfg = portalConfigService.get(); enabled.value = cfg.handoverEnabled !== false }
function startCd() { countdown.value = 10; cdTimer = setInterval(() => { countdown.value--; if(countdown.value <= 0) { clearInterval(cdTimer); goHome() } }, 1000) }
function goHome() { router.push('/') }

// ===== 周视图 =====
const shiftConfig = ref(shiftConfigService.get())
const dayKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const dayLabels = ['周一','周二','周三','周四','周五','周六','周日']
function getMonday(d) { const dd = new Date(d); const day = dd.getDay(); dd.setDate(dd.getDate() - day + (day === 0 ? -6 : 1)); return dd }
function fmtDateShort(d) { const dd = new Date(d); return `${dd.getMonth()+1}/${dd.getDate()}` }
function dateKeyToISO(dk, ws) { const idx = dayKeys.indexOf(dk); const d = new Date(ws); d.setDate(d.getDate() + idx); return d.toISOString().split('T')[0] }

const weekStart = ref(getMonday(new Date()))
const weekLabel = computed(() => { const m = new Date(weekStart.value); const s = new Date(weekStart.value); s.setDate(s.getDate()+6); return `${m.getFullYear()}.${m.getMonth()+1}.${m.getDate()} – ${s.getMonth()+1}.${s.getDate()}` })
function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate()-7); weekStart.value = d }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate()+7); weekStart.value = d }
function goToday() { weekStart.value = getMonday(new Date()) }

const weekDays = computed(() => dayKeys.map((k,i) => {
  const d = new Date(weekStart.value); d.setDate(d.getDate()+i); const ds = d.toISOString().split('T')[0]
  return { key: k, label: dayLabels[i], dateStr: fmtDateShort(d), shift: shiftConfig.value[k] || '', isToday: d.toDateString() === new Date().toDateString(), hasRecord: handoverService.hasForDate(ds) }
}))

const weekDaysWithRecords = computed(() => weekDays.value.map(d => {
  const ds = dateKeyToISO(d.key, weekStart.value)
  const records = handoverService.getByDate(ds)
  const record = records.length > 0 ? (records.find(r => r.shift === d.shift) || records[0]) : null
  return { ...d, record }
}).filter(d => d.record))

const doneCount = computed(() => weekDays.value.filter(d=>d.hasRecord&&d.shift).length)
const activeDayCount = computed(() => weekDays.value.filter(d=>d.shift).length)

// ===== HTML2canvas 导出 =====
const exportRef = ref(null)
const exporting = ref(false)

async function exportImage() {
  if (!exportRef.value) return
  exporting.value = true
  try {
    const canvas = await html2canvas(exportRef.value, {
      backgroundColor: '#f8f7fc',
      scale: 2,
      useCORS: true,
      logging: false
    })
    const link = document.createElement('a')
    link.download = `早晚班交接_${weekLabel.value.replace(/[–\s]/g,'_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (e) {
    console.error('导出失败', e)
  } finally {
    exporting.value = false
  }
}

onMounted(() => { checkEnabled(); if(!enabled.value) startCd() })
onUnmounted(() => { if(cdTimer) clearInterval(cdTimer) })
</script>

<style scoped>
/* ===== 基础 ===== */
.hop { max-width: 900px; margin: 0 auto; }

/* 关闭页 */
.hop-off-wrap { display:flex; align-items:center; justify-content:center; min-height:50vh }
.hop-off-card { text-align:center; padding:50px 36px; background:var(--card-bg); border:1px solid var(--border-light); border-radius:var(--radius-xl); max-width:440px; box-shadow:var(--shadow-light) }
.hop-off-icon { font-size:48px; margin-bottom:12px }
.hop-off-card h2 { font-size:18px; color:var(--text-primary); margin:0 0 6px }
.hop-off-card p { font-size:13px; color:var(--text-secondary); margin:0 }
.hop-cd { font-size:12px; color:var(--accent); margin:14px 0 !important }
.hop-btn { padding:8px 22px; border-radius:var(--radius); font-size:13px; font-family:var(--font-body); cursor:pointer; border:none; transition:all .2s }
.hop-btn-pri { background:var(--accent); color:#fff }
.hop-btn-pri:hover { background:var(--accent-d); box-shadow:var(--shadow) }

/* 工具栏 */
.hop-toolbar { display:flex; align-items:center; justify-content:space-between; padding:0 0 16px; flex-wrap:wrap; gap:8px }
.hop-tb-left { display:flex; align-items:center; gap:6px }
.hop-arr { width:28px; height:28px; border-radius:6px; border:1px solid var(--border-base); background:var(--card-bg); color:var(--text-secondary); cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; font-family:var(--font-body) }
.hop-arr:hover { background:var(--bg-warm); color:var(--text-primary) }
.hop-week-title { font-size:14px; font-weight:600; color:var(--text-primary); min-width:200px; text-align:center }
.hop-today-btn { padding:4px 14px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent); font-size:12px; cursor:pointer; font-family:var(--font-body) }
.hop-today-btn:hover { background:var(--accent); color:#fff }
.hop-tb-right { display:flex; align-items:center; gap:10px }
.hop-summary { font-size:12px; color:var(--success); font-weight:500 }
.hop-export-btn { padding:7px 16px; border-radius:var(--radius); border:1px solid var(--success); background:rgba(16,185,129,.06); color:var(--success); font-size:12px; cursor:pointer; font-family:var(--font-body); font-weight:500; transition:all .2s }
.hop-export-btn:hover { background:var(--success); color:#fff }

/* 导出区域 */
.hop-export-area { padding:10px }

/* 周卡片行 */
.hop-week-row { display:grid; grid-template-columns:repeat(7,1fr); gap:8px; margin-bottom:24px }
.hop-wd-card { display:flex; flex-direction:column; align-items:center; gap:2px; padding:14px 4px; border-radius:var(--radius-lg); background:var(--card-bg); border:1px solid var(--border-light); position:relative; box-shadow:var(--shadow-light) }
.hop-wd-card.today { border-color:var(--accent); background:rgba(99,102,241,.04) }
.hop-wd-card.empty { opacity:.55 }
.hop-wd-name { font-size:13px; font-weight:600; color:var(--text-primary) }
.hop-wd-date { font-size:11px; color:var(--text-muted) }
.hop-wd-shift { font-size:10px; padding:1px 6px; border-radius:3px; font-weight:500; margin-top:2px }
.sl { background:rgba(245,158,11,.1); color:#b45309 }
.sm { background:rgba(99,102,241,.1); color:var(--accent) }
.sa { background:rgba(16,185,129,.1); color:var(--success) }
.so { color:var(--text-muted) }
.hop-wd-ok { position:absolute; top:5px; right:6px; font-size:14px; color:var(--success); font-weight:700 }
.hop-wd-no { position:absolute; top:5px; right:8px; font-size:12px; color:var(--text-muted) }

/* 天详情区 */
.hop-day-section { margin-bottom:24px }
.hop-day-title-bar { display:flex; align-items:center; gap:10px; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid var(--border-lighter) }
.hop-dt-day { font-size:16px; font-weight:700; color:var(--text-primary) }
.hop-dt-shift { font-size:11px; padding:2px 8px; border-radius:4px; font-weight:500 }
.hop-day-empty { text-align:center; padding:20px; color:var(--text-muted); font-size:13px; background:var(--card-bg); border-radius:var(--radius-lg); border:1px dashed var(--border-base) }

/* 内容块 */
.hop-block { background:var(--card-bg); border:1px solid var(--border-light); border-radius:var(--radius-xl); padding:18px; margin-bottom:12px; box-shadow:var(--shadow-light) }
.hop-block-title { font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid var(--border-lighter) }

/* 作业 */
.hop-hw-list { display:flex; flex-direction:column; gap:8px }
.hop-hw-item { background:var(--bg-warm); border-radius:var(--radius); padding:12px }
.hop-hw-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:6px }
.hop-hw-subject { font-size:13px; font-weight:600; color:var(--text-primary) }
.hop-hw-count { font-size:12px; background:var(--accent); color:#fff; padding:1px 8px; border-radius:4px; font-weight:500 }
.hop-hw-grade { font-size:11px; padding:2px 6px; border-radius:4px }
.hop-hw-grade.done { background:rgba(16,185,129,.1); color:var(--success) }
.hop-hw-grade.part { background:rgba(245,158,11,.1); color:var(--warning) }
.hop-hw-grade.no { background:rgba(100,100,120,.1); color:var(--text-muted) }
.hop-hw-body { font-size:12px; color:var(--text-secondary); line-height:1.8 }
.hop-hw-line b { color:var(--text-primary) }

/* 会议 */
.hop-mt-card { background:var(--bg-warm); border-radius:var(--radius); padding:14px }
.hop-mt-title { font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:8px }
.hop-mt-content { font-size:13px; color:var(--text-secondary); line-height:1.7; white-space:pre-wrap }
.hop-mt-trans { font-size:12px; color:var(--text-muted); margin-top:10px; padding-top:10px; border-top:1px solid var(--border-lighter); line-height:1.6 }

/* 学生 */
.hop-stu-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:8px }
.hop-stu-card { background:var(--bg-warm); border-radius:var(--radius); padding:12px; border-left:3px solid var(--accent); display:flex; flex-direction:column; gap:6px }
.hop-stu-card.handled { border-left-color:var(--success); opacity:.85 }
.hop-stu-card-hd { display:flex; align-items:center; justify-content:space-between; gap:8px }
.hop-stu-name { font-size:13px; font-weight:600; color:var(--text-primary) }
.hop-stu-type-tag { font-size:10px; padding:1px 6px; border-radius:3px; background:rgba(99,102,241,.1); color:var(--accent); align-self:flex-start }
.hop-stu-status { font-size:10px; padding:2px 6px; border-radius:3px; white-space:nowrap }
.hop-stu-status.ok { background:rgba(16,185,129,.1); color:var(--success) }
.hop-stu-status.warn { background:rgba(245,158,11,.1); color:var(--warning) }
.hop-stu-desc { font-size:12px; color:var(--text-secondary); line-height:1.6 }
.hop-stu-follow { font-size:11px; color:var(--accent); margin-top:4px; padding:6px 8px; background:rgba(99,102,241,.04); border-radius:4px; line-height:1.5 }

/* 手机管理 */
.hop-phone-block { border-left:3px solid var(--success) }
.hop-phone-stats { display:flex; align-items:center; justify-content:center; gap:0; padding:16px 0 }
.hop-phone-stat { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1 }
.hop-phone-val { font-size:28px; font-weight:700; color:var(--text-primary) }
.hop-phone-val.ok { color:var(--success) }
.hop-phone-val.warn { color:var(--warning) }
.hop-phone-lbl { font-size:11px; color:var(--text-muted) }
.hop-phone-divider { width:1px; height:36px; background:var(--border-lighter) }
.hop-phone-reason { font-size:12px; color:var(--text-secondary); background:var(--bg-warm); padding:10px 12px; border-radius:var(--radius); line-height:1.6; margin-top:4px }
.hop-phone-reason b { color:var(--text-primary) }
.hop-phone-hint { font-size:10px; color:var(--text-muted); text-align:center; margin-top:8px }

/* 请假记录 */
.hop-leave-list { display:flex; flex-direction:column; gap:6px }
.hop-leave-item { background:var(--bg-warm); border-radius:var(--radius); padding:10px 12px; border-left:3px solid var(--warning) }
.hop-leave-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px }
.hop-leave-name { font-size:13px; font-weight:600; color:var(--text-primary) }
.hop-leave-reason { font-size:11px; padding:1px 6px; border-radius:3px; background:rgba(245,158,11,.1); color:var(--warning) }
.hop-leave-tag { font-size:10px; padding:2px 6px; border-radius:3px }
.hop-leave-tag.ok { background:rgba(16,185,129,.1); color:var(--success) }
.hop-leave-tag.warn { background:rgba(239,68,68,.1); color:#ef4444 }
.hop-leave-tag.phone { background:rgba(99,102,241,.1); color:var(--accent) }
.hop-leave-time { font-size:11px; color:var(--text-muted) }

/* 备注 */
.hop-note-card { background:var(--bg-warm); border-radius:var(--radius); padding:14px; font-size:13px; color:var(--text-secondary); line-height:1.7; white-space:pre-wrap }

/* 整周空 */
.hop-all-empty { text-align:center; padding:60px 20px }
.hop-all-empty-icon { font-size:48px; margin-bottom:12px }
.hop-all-empty p { font-size:14px; color:var(--text-secondary); margin:0 0 4px }
.hop-all-empty-sub { font-size:12px; color:var(--text-muted) }

@media (max-width:860px) {
  .hop-week-row { grid-template-columns:repeat(4,1fr) }
}
</style>
