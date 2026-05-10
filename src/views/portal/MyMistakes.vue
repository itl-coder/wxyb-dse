<template>
  <div v-if="student" class="mistakes-page">
    <!-- Page Header -->
    <div class="page-head">
      <div class="head-left">
        <h1 class="head-title">我的错题本</h1>
        <p class="head-sub">每道错题，都是通向满分的阶梯</p>
      </div>
      <div class="head-stats">
        <div class="hs-item">
          <span class="hs-num">{{ allMistakes.length }}</span>
          <span class="hs-label">错题总数</span>
        </div>
        <div class="hs-sep"></div>
        <div class="hs-item">
          <span class="hs-num">{{ subjectStats.length }}</span>
          <span class="hs-label">涉及科目</span>
        </div>
        <div class="hs-sep"></div>
        <div class="hs-item">
          <span class="hs-num">{{ topErrorType }}</span>
          <span class="hs-label">主要错因</span>
        </div>
      </div>
    </div>

    <!-- Filter Toolbar -->
    <div class="filter-section">
      <div class="filter-row">
        <span class="filter-hint">筛选：</span>
        <div class="chip-group">
          <button class="fl-chip" :class="{ on: !filterSubject }" @click="filterSubject = ''">全部科目</button>
          <button
            v-for="s in subjectStats" :key="s.subject"
            class="fl-chip" :class="{ on: filterSubject === s.subject }"
            @click="filterSubject = filterSubject === s.subject ? '' : s.subject"
          >{{ s.subject }}<i>{{ s.count }}</i></button>
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-hint">错因：</span>
        <div class="chip-group">
          <button class="fl-chip" :class="{ on: !filterErrorType }" @click="filterErrorType = ''">不限</button>
          <button
            v-for="e in errorTypeOptions" :key="e.value"
            class="fl-chip err-dot" :class="['dot-' + errorColorClass(e.value), { on: filterErrorType === e.value }]"
            @click="filterErrorType = filterErrorType === e.value ? '' : e.value"
          >{{ e.label }}</button>
        </div>
        <button class="print-btn" @click="printMistakes">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          打印错题卷
        </button>
      </div>
      <div v-if="filterSubject || filterErrorType" class="filter-active-tag">
        当前筛选：{{ filterSubject || '全部科目' }} · {{ filterErrorType ? errorTypeLabel(filterErrorType) : '全部错因' }}
        <button class="clear-filter-link" @click="clearFilters">清除</button>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="filteredMistakes.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 15c1.5-2 4-2 8 0"/><circle cx="9" cy="9" r="0.8" fill="currentColor"/><circle cx="15" cy="9" r="0.8" fill="currentColor"/></svg>
      </div>
      <p class="empty-title">{{ allMistakes.length === 0 ? '还没有错题记录' : '筛选结果为空' }}</p>
      <p class="empty-desc">{{ allMistakes.length === 0 ? '继续保持！每道错题都会被记录在这里，帮助你针对性提升。' : '调整筛选条件查看其他错题。' }}</p>
    </div>

    <!-- Ledger -->
    <div v-else class="ledger-wrap">
      <div class="ledger-head">
        <span class="col-num">#</span>
        <span class="col-q">题目内容</span>
        <span class="col-e">错因</span>
        <span class="col-d">日期</span>
      </div>

      <div
        v-for="(e, idx) in filteredMistakes"
        :key="e.id"
        class="ledger-item"
        :class="{ open: e._expanded }"
      >
        <!-- Row -->
        <div class="li-row" @click="e._expanded = !e._expanded">
          <span class="li-num">{{ idx + 1 }}</span>
          <span class="li-content">
            <span class="li-tags">
              <span class="tag-subject">{{ e.subject }}</span>
              <span class="tag-topic">{{ e.topic }}</span>
              <span v-if="e.count > 1" class="tag-repeat">错{{ e.count }}次</span>
            </span>
            <span class="li-text">{{ e.question }}</span>
          </span>
          <span class="li-err"><span class="err-badge" :class="'e-' + errorColorClass(e.errorType)">{{ errorTypeLabel(e.errorType) }}</span></span>
          <span class="li-date">{{ e.lastDate }}</span>
          <span class="li-caret">{{ e._expanded ? '▾' : '▸' }}</span>
        </div>

        <!-- Expanded -->
        <transition name="expand">
          <div v-if="e._expanded" class="li-detail">
            <div class="detail-body">
              <div class="detail-main">
                <!-- Full Question -->
                <div class="d-section">
                  <div class="d-sec-label">完整题目</div>
                  <div class="d-sec-question">{{ e.question }}</div>
                </div>

                <!-- Inline redo -->
                <div class="d-section">
                  <div class="d-sec-label">重新作答</div>
                  <textarea v-model="e._draftAnswer" class="d-textarea" rows="3" placeholder="在此写下你的答案……" @click.stop></textarea>
                  <button
                    class="d-compare-btn"
                    @click.stop="e._showCompare = !e._showCompare; if (e._showCompare) submitInlineRedo(e)"
                  >{{ e._showCompare ? '刷新对比' : '提交并查看答案对比' }}</button>
                </div>

                <!-- Compare result -->
                <div v-if="e._showCompare" class="d-compare">
                  <div class="dc-col dc-you">
                    <div class="dc-label">你的答案</div>
                    <p>{{ e._draftAnswer || '（未填写）' }}</p>
                  </div>
                  <div class="dc-col dc-std">
                    <div class="dc-label">标准答案</div>
                    <p>{{ e.correctAnswer || '请参阅教师提供的标准答案' }}</p>
                  </div>
                </div>
              </div>

              <!-- Sidebar -->
              <div class="detail-side">
                <div class="ds-card">
                  <div class="ds-row"><span>科目</span><span>{{ e.subject }}</span></div>
                  <div class="ds-row"><span>知识点</span><span>{{ e.topic }}</span></div>
                  <div class="ds-row"><span>错因</span><span class="e-txt" :class="'e-' + errorColorClass(e.errorType)">{{ errorTypeLabel(e.errorType) }}</span></div>
                  <div class="ds-row"><span>错误次数</span><span>{{ e.count }} 次</span></div>
                  <div class="ds-row"><span>最近记录</span><span>{{ e.lastDate }}</span></div>
                </div>
                <div class="ds-hint">
                  <div class="d-sec-label">提升建议</div>
                  <p v-if="e.solution">{{ e.solution }}</p>
                  <p v-else>回顾「{{ e.topic }}」相关概念，重点排查「{{ errorTypeLabel(e.errorType) }}」类错误。同类题目再练2-3道巩固。</p>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Footer -->
    <div class="page-foot">
      <p>"错误是最好的老师。每一道错题，都是通向满分的阶梯。"</p>
    </div>

    <!-- Redo Dialog -->
    <el-dialog v-model="redoVisible" title="错题重做" width="560px" :close-on-click-modal="false">
      <div v-if="redoItem">
        <div class="rd-meta">
          <span>{{ redoItem.subject }}</span><span class="rd-dot">·</span>
          <span>{{ redoItem.topic }}</span><span class="rd-dot">·</span>
          <span class="rd-err">{{ errorTypeLabel(redoItem.errorType) }}</span>
        </div>
        <div class="rd-qcard"><p>{{ redoItem.question }}</p></div>
        <div class="rd-input">
          <label class="rd-label">你的答案</label>
          <textarea v-model="redoAnswer" class="rd-textarea" rows="4" placeholder="请在此重新作答……"></textarea>
        </div>
        <button class="rd-submit" @click="submitRedoAnswer" :disabled="redoSubmitted">
          {{ redoSubmitted ? '已提交' : '提交答案，查看对比' }}
        </button>
        <div v-if="redoSubmitted" class="rd-compare">
          <div class="rd-compare-grid">
            <div class="rd-box rd-box-you"><div class="rd-box-label">你的答案</div><p>{{ redoAnswer }}</p></div>
            <div class="rd-box rd-box-std"><div class="rd-box-label">标准答案</div><p>{{ redoItem.correctAnswer || '请参阅教师提供的标准答案' }}</p></div>
          </div>
          <div class="rd-hint">重点回顾「{{ redoItem.topic }}」相关概念，留意「{{ errorTypeLabel(redoItem.errorType) }}」类错误。同类题目再练2-3道巩固。</div>
        </div>
      </div>
    </el-dialog>
  </div>

  <div v-else class="loading-state">
    <div class="loading-spinner"></div>
    <p>正在加载学生数据...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { errorBookService } from '@/services/dataService'
import { settingsService } from '@/services/dataService'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const allMistakes = ref([])
const filterSubject = ref('')
const filterErrorType = ref('')
const redoVisible = ref(false)
const redoItem = ref(null)
const redoAnswer = ref('')
const redoSubmitted = ref(false)

const errorTypeMap = {
  calc: '计算失误', concept: '概念不清', reading: '审题偏差',
  careless: '粗心', comprehensive: '综合能力不足'
}

function errorTypeLabel(t) { return errorTypeMap[t] || t }

function errorColorClass(type) {
  return { calc: 'calc', concept: 'concept', reading: 'reading', careless: 'careless', comprehensive: 'comp' }[type] || 'concept'
}

const errorTypeOptions = Object.entries(errorTypeMap).map(([value, label]) => ({ value, label }))

const filteredMistakes = computed(() => {
  return allMistakes.value.filter(e => {
    if (filterSubject.value && e.subject !== filterSubject.value) return false
    if (filterErrorType.value && e.errorType !== filterErrorType.value) return false
    return true
  })
})

const subjectStats = computed(() => {
  const map = {}
  allMistakes.value.forEach(e => { if (!map[e.subject]) map[e.subject] = 0; map[e.subject]++ })
  return Object.entries(map).map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count)
})

const topErrorType = computed(() => {
  const map = {}
  allMistakes.value.forEach(e => {
    const label = errorTypeLabel(e.errorType)
    if (!map[label]) map[label] = 0; map[label]++
  })
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
  return sorted.length > 0 ? sorted[0][0] : '—'
})

onMounted(() => {
  if (!store.currentStudentId) return
  allMistakes.value = errorBookService.getByStudent(store.currentStudentId).map(e => ({
    ...e, _expanded: false, _draftAnswer: '', _showCompare: false
  }))
})

function clearFilters() { filterSubject.value = ''; filterErrorType.value = '' }

function openRedo(e) {
  redoItem.value = e; redoAnswer.value = e._draftAnswer || ''
  redoSubmitted.value = false; redoVisible.value = true
}

function submitRedoAnswer() {
  if (!redoAnswer.value.trim()) { ElMessage.warning('请输入你的答案'); return }
  redoSubmitted.value = true
  if (redoItem.value) { redoItem.value._draftAnswer = redoAnswer.value; redoItem.value._showCompare = true }
  ElMessage.success('已提交，请查看答案对比')
}

function submitInlineRedo(e) {
  if (!e._draftAnswer || !e._draftAnswer.trim()) { ElMessage.warning('请先输入你的答案'); e._showCompare = false; return }
  ElMessage.success('已提交，请查看答案对比')
}

function printMistakes() {
  const items = filteredMistakes.value
  if (items.length === 0) { ElMessage.warning('当前筛选条件下没有错题可打印'); return }

  const now = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  const sname = student.value?.name || '________'
  const sclass = student.value?.class || '________'
  const subjects = [...new Set(items.map(e => e.subject))].join('、')
  const wmConfig = settingsService.get()
  const wmOn = wmConfig.watermarkEnabled !== false
  const wmText = wmConfig.watermarkText || '内部资料·仅供学生使用'
  const wmCells = Array.from({ length: 20 }, () => `<div class="wm-cell"><span>${wmText}</span></div>`).join('')

  const qItems = items.map((e, i) => `
    <div class="ei">
      <div class="ei-head">
        <span class="ei-num">${i + 1}.</span>
        <span class="ei-subj">${e.subject}</span>
        <span class="ei-topic">${e.topic}</span>
        <span class="ei-err">错因：${errorTypeLabel(e.errorType)}</span>
        <span class="ei-cnt">（错${e.count}次）</span>
      </div>
      <div class="ei-q">${e.question}</div>
      <div class="ei-ans"><span>作答：</span><span class="ei-dots">${'...................................................................................................................................................'}</span></div>
    </div>`).join('\n')

  const html = `<!DOCTYPE html>
<html lang="zh-HK">
<head>
<meta charset="utf-8">
<title>错题巩固练习卷 — ${sname}</title>
<style>
  @page { size: A4; margin: 16mm 18mm 18mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'PingFang SC','Microsoft YaHei','SimSun',serif;
    color: #1a1a1a; font-size: 13px; line-height: 1.8; padding: 0;
  }
  .wmo { position: fixed; inset: 0; pointer-events: none; z-index: 9999; overflow: hidden; display: ${wmOn ? 'block' : 'none'}; }
  .wmg { display: grid; grid-template-columns: repeat(4,1fr); grid-template-rows: repeat(5,1fr); width: 130%; height: 130%; margin: -8% 0 0 -8%; transform: rotate(-22deg); }
  .wmc { display: flex; align-items: center; justify-content: center; opacity: 0.05; }
  .wmc span { font-size: 16px; color: rgba(0,0,0,0.06); font-weight: 500; white-space: nowrap; }
  .ph { text-align: center; border-bottom: 2px solid #1a2e3c; padding-bottom: 16px; margin-bottom: 14px; }
  .ph-school { font-size: 11px; color: #666; letter-spacing: 0.3em; margin-bottom: 8px; }
  .ph-title { font-size: 22px; font-weight: 700; letter-spacing: 0.15em; color: #1a2e3c; }
  .ph-sub { font-size: 10px; color: #888; margin-top: 4px; letter-spacing: 0.1em; }
  .pi { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #444; margin-bottom: 10px; padding: 0 4px; }
  .pif { display: inline-flex; align-items: center; gap: 4px; }
  .blank { display: inline-block; min-width: 64px; border-bottom: 1px solid #333; }
  .blank.w { min-width: 100px; }
  .pscore { font-weight: 700; font-size: 14px; color: #1a2e3c; border: 1px solid #1a2e3c; padding: 3px 16px; border-radius: 2px; }
  hr.pdiv { border: none; border-top: 1px dashed #ccc; margin: 10px 0 14px; }
  .eis { display: flex; flex-direction: column; gap: 10px; }
  .ei { padding: 10px 0; border-bottom: 1px dotted #e0e0e0; break-inside: avoid; page-break-inside: avoid; }
  .ei-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
  .ei-num { font-weight: 700; font-size: 14px; color: #1a2e3c; min-width: 24px; }
  .ei-subj { font-size: 10px; color: #666; border: 1px solid #ccc; padding: 1px 8px; border-radius: 3px; }
  .ei-topic { font-size: 10px; color: #888; background: #f5f5f5; padding: 1px 8px; border-radius: 3px; }
  .ei-err { font-size: 10px; color: #c47a5a; }
  .ei-cnt { font-size: 10px; color: #aaa; }
  .ei-q { font-size: 13px; line-height: 1.8; padding: 4px 0 6px 28px; }
  .ei-ans { padding-left: 28px; font-size: 12px; line-height: 2.2; }
  .ei-ans span { color: #999; font-size: 11px; }
  .ei-dots { color: #d0d0d0; letter-spacing: -1px; }
  .pf { text-align: center; margin-top: 24px; padding-top: 10px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #aaa; letter-spacing: 0.1em; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
<\/script>
</head>
<body>
<div class="wmo"><div class="wmg">${wmCells}</div></div>
<div class="ph"><div class="ph-school">DSE 学情问诊系统</div><div class="ph-title">错 题 巩 固 练 习 卷</div><div class="ph-sub">针对个人薄弱环节 · 精准巩固提升</div></div>
<div class="pi">
  <span>
    <span class="pif">姓名：<span class="blank">${sname}</span></span>
    <span class="pif" style="margin-left:24px">班级：<span class="blank">${sclass}</span></span>
    <span class="pif" style="margin-left:24px">日期：<span class="blank w">${now}</span></span>
  </span>
  <span class="pscore">共 ${items.length} 题</span>
</div>
<div class="pi" style="font-size:11px;color:#888;margin-bottom:4px"><span>涵盖科目：${subjects}</span></div>
<hr class="pdiv">
<div class="eis">${qItems}</div>
<div class="pf">认真订正每道错题 · 把薄弱点变成得分点</div>
</body>
</html>`

  // CRITICAL: set onload BEFORE write/close so it fires reliably
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { ElMessage.error('打印窗口被浏览器拦截，请允许弹窗后重试'); return }
  w.document.open()
  w.document.write(html)
  w.document.close()
  // Use requestAnimationFrame to ensure rendering completes before printing
  w.focus()
  const doPrint = () => {
    try { w.print() } catch (_) { /* ok */ }
  }
  // Both onload and a backup setTimeout for reliability
  w.onload = () => { setTimeout(doPrint, 200) }
  setTimeout(() => {
    if (w.document.readyState === 'complete') doPrint()
  }, 600)
}
</script>

<style scoped>
/* ========================================
   Refined Scholarly Ledger
   ======================================== */

.mistakes-page {
  max-width: 1000px;
  margin: 0 auto;
  font-family: var(--font-body);
  color: var(--text-primary);
}

/* ---- Page Head ---- */
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 2px solid var(--border-light);
  flex-wrap: wrap;
}

.head-title {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--primary);
  margin: 0 0 4px;
  letter-spacing: 0.03em;
}

.head-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  font-style: italic;
}

.head-stats {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
}

.hs-item {
  text-align: center;
  min-width: 52px;
}

.hs-num {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
  font-family: var(--font-display);
  line-height: 1.1;
}

.hs-label {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
}

.hs-sep {
  width: 1px;
  height: 28px;
  background: var(--border-light);
}

/* ---- Filter Section ---- */
.filter-section {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-hint {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  flex-shrink: 0;
  min-width: 36px;
}

.chip-group {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  flex: 1;
}

.fl-chip {
  padding: 4px 13px;
  border-radius: 14px;
  border: 1px solid var(--border-light);
  background: var(--card-bg);
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.16s;
  font-family: var(--font-body);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.fl-chip:hover { border-color: var(--accent); color: var(--accent-d); }
.fl-chip.on { background: var(--primary); border-color: var(--primary); color: #fff; }
.fl-chip i { font-style: normal; opacity: 0.5; font-size: 10px; }
.fl-chip.on i { opacity: 0.75; }

/* error dot chips */
.err-dot::before { content: ''; width: 7px; height: 7px; border-radius: 50%; margin-right: 2px; flex-shrink: 0; }
.dot-calc::before    { background: #f59e0b; }
.dot-concept::before { background: #3b82f6; }
.dot-reading::before { background: #8b5cf6; }
.dot-careless::before{ background: #ef4444; }
.dot-comp::before    { background: #ec4899; }
.err-dot.on { color: #fff !important; border-color: transparent !important; }
.dot-calc.on    { background: #f59e0b; }
.dot-concept.on { background: #3b82f6; }
.dot-reading.on { background: #8b5cf6; }
.dot-careless.on{ background: #ef4444; }
.dot-comp.on    { background: #ec4899; }
.err-dot.on::before { background: rgba(255,255,255,0.5); }

.print-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 8px;
  border: 1px solid var(--primary); background: var(--card-bg);
  color: var(--primary); font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.2s; font-family: var(--font-body);
  white-space: nowrap; flex-shrink: 0; margin-left: auto;
}
.print-btn:hover { background: var(--primary); color: #fff; }

.filter-active-tag {
  font-size: 11px; color: var(--accent-d); padding: 4px 0;
}
.clear-filter-link {
  background: none; border: none; color: var(--text-muted);
  font-size: 10px; cursor: pointer; text-decoration: underline;
  font-family: var(--font-body); margin-left: 6px;
}
.clear-filter-link:hover { color: var(--danger); }

/* ---- Empty ---- */
.empty-state { text-align: center; padding: 80px 20px; }
.empty-icon { color: var(--text-muted); margin-bottom: 14px; opacity: 0.35; }
.empty-title { font-size: 15px; font-weight: 600; color: var(--text-secondary); margin: 0 0 4px; }
.empty-desc { font-size: 12px; color: var(--text-muted); margin: 0; }

/* ========================================
   Ledger
   ======================================== */

.ledger-wrap {
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  margin-bottom: 20px;
}

/* leder header */
.ledger-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 20px;
  background: linear-gradient(180deg, var(--bg-warm), var(--card-bg-warm));
  border-bottom: 1px solid var(--border-light);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.col-num { width: 32px; flex-shrink: 0; }
.col-q   { flex: 1; min-width: 0; }
.col-e   { width: 88px; flex-shrink: 0; }
.col-d   { width: 60px; flex-shrink: 0; text-align: right; }

/* ledger item */
.ledger-item {
  border-bottom: 1px solid var(--border-lighter);
  transition: background 0.15s;
}
.ledger-item:last-child { border-bottom: none; }
.ledger-item:hover { background: rgba(196,122,90,0.025); }
.ledger-item.open { background: rgba(196,122,90,0.04); }

/* row */
.li-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  user-select: none;
}

.li-num {
  width: 32px; flex-shrink: 0;
  font-size: 13px; font-weight: 700;
  color: var(--text-muted); font-family: var(--font-display);
}

.li-content {
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 10px;
  overflow: hidden;
}

.li-tags { display: flex; gap: 5px; align-items: center; flex-shrink: 0; }

.tag-subject {
  font-size: 10px; font-weight: 600; color: var(--accent);
  background: rgba(196,122,90,0.09); padding: 2px 8px; border-radius: 4px;
}

.tag-topic {
  font-size: 10px; color: var(--text-muted);
  background: var(--bg-warm); padding: 2px 8px; border-radius: 4px;
}

.tag-repeat {
  font-size: 9px; color: #92400e; background: #fef3c7;
  padding: 1px 7px; border-radius: 10px; font-weight: 600;
}

.li-text {
  font-size: 13px; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  line-height: 1.5;
}

.li-err { width: 88px; flex-shrink: 0; }

.err-badge {
  display: inline-block;
  font-size: 10px; font-weight: 600; padding: 2px 10px; border-radius: 10px;
}

.e-calc    { color: #b45309; background: #fef3c7; }
.e-concept { color: #1d4ed8; background: #dbeafe; }
.e-reading { color: #6d28d9; background: #ede9fe; }
.e-careless{ color: #b91c1c; background: #fee2e2; }
.e-comp    { color: #be185d; background: #fce7f3; }

.li-date {
  width: 60px; flex-shrink: 0; text-align: right;
  font-size: 10px; color: var(--text-muted);
}

.li-caret {
  flex-shrink: 0; font-size: 12px; color: var(--text-muted);
  transition: transform 0.2s;
}

/* ---- Expanded Detail ---- */
.li-detail {
  border-top: 1px dashed var(--border-lighter);
  padding: 18px 20px;
  background: rgba(246,243,238,0.5);
}

.detail-body {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 24px;
}

.detail-main { min-width: 0; }

.d-section { margin-bottom: 18px; }
.d-section:last-child { margin-bottom: 0; }

.d-sec-label {
  font-size: 10px; font-weight: 700; color: var(--text-muted);
  letter-spacing: 0.06em; margin-bottom: 8px;
}

.d-sec-question {
  font-size: 14px; line-height: 1.75; color: var(--text-primary);
  padding: 14px 16px; background: var(--bg-warm); border-radius: 8px;
  border: 1px solid var(--border-lighter);
}

.d-textarea {
  width: 100%; padding: 10px 14px;
  border: 1px solid var(--border-base); border-radius: 8px;
  font-size: 13px; line-height: 1.65; font-family: var(--font-body);
  resize: vertical; background: #fff; color: var(--text-primary);
  transition: border-color 0.2s; box-sizing: border-box;
}
.d-textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(196,122,90,0.1); }

.d-compare-btn {
  margin-top: 8px; padding: 7px 18px; border-radius: 7px;
  border: 1px solid var(--success); background: #fff;
  color: var(--success); font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.18s; font-family: var(--font-body);
}
.d-compare-btn:hover { background: var(--success); color: #fff; }

.d-compare {
  margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}

.dc-col {
  padding: 12px 14px; border-radius: 8px; font-size: 12px; line-height: 1.6;
}
.dc-you { background: #fffbeb; border: 1px solid #fde68a; }
.dc-std { background: #ecfdf5; border: 1px solid #a7f3d0; }
.dc-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 4px;
}
.dc-you .dc-label { color: #b45309; }
.dc-std .dc-label { color: #047857; }
.dc-col p { margin: 0; }

/* detail sidebar */
.detail-side { min-width: 0; }

.ds-card {
  padding: 14px; background: var(--card-bg); border-radius: 8px;
  border: 1px solid var(--border-lighter); margin-bottom: 12px;
}
.ds-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0; font-size: 12px;
  border-bottom: 1px dotted var(--border-lighter);
}
.ds-row:last-child { border-bottom: none; }
.ds-row span:first-child { color: var(--text-muted); font-size: 11px; }
.ds-row span:last-child { color: var(--text-primary); font-weight: 500; }

.e-txt { padding: 1px 8px; border-radius: 4px; font-size: 11px; }

.ds-hint {
  padding: 12px 14px; background: #f0f7f0; border-radius: 8px;
  border-left: 3px solid var(--success);
}
.ds-hint .d-sec-label { margin-bottom: 4px; }
.ds-hint p {
  margin: 0; font-size: 12px; line-height: 1.65; color: #2e5a30;
}

/* expand transition */
.expand-enter-active, .expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to, .expand-leave-from {
  opacity: 1;
  max-height: 600px;
}

/* ---- Page Foot ---- */
.page-foot { text-align: center; padding: 12px 0 40px; }
.page-foot p { font-size: 12px; color: var(--text-muted); font-style: italic; margin: 0; }

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

/* ---- Redo Dialog ---- */
.rd-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; }
.rd-dot { color: var(--border-base); }
.rd-err { font-weight: 600; color: var(--accent-d); }
.rd-qcard { padding: 14px; background: var(--bg-warm); border-radius: 8px; border: 1px solid var(--border-light); margin-bottom: 16px; }
.rd-qcard p { margin: 0; font-size: 14px; line-height: 1.7; color: var(--text-primary); font-weight: 500; }
.rd-input { margin-bottom: 14px; }
.rd-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.rd-textarea { width: 100%; padding: 12px; border: 1px solid var(--border-base); border-radius: 8px; font-size: 13px; line-height: 1.6; font-family: var(--font-body); resize: vertical; background: var(--card-bg); color: var(--text-primary); transition: border-color 0.2s; box-sizing: border-box; }
.rd-textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(196,122,90,0.12); }
.rd-submit { width: 100%; padding: 10px; border-radius: 8px; border: none; background: var(--primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: var(--font-body); }
.rd-submit:hover:not(:disabled) { background: var(--primary-l); }
.rd-submit:disabled { opacity: 0.5; cursor: default; }
.rd-compare { margin-top: 16px; }
.rd-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rd-box { padding: 12px; border-radius: 8px; font-size: 12px; line-height: 1.6; }
.rd-box-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.rd-box p { margin: 0; }
.rd-box-you { background: #fffbeb; border: 1px solid #fcd34d; }
.rd-box-you .rd-box-label { color: #92400e; }
.rd-box-std { background: #ecfdf5; border: 1px solid #6ee7b7; }
.rd-box-std .rd-box-label { color: #065f46; }
.rd-hint { margin-top: 12px; padding: 10px 12px; background: #fffbeb; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.6; border: 1px solid #fde68a; }

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .page-head { flex-direction: column; gap: 12px; }
  .head-stats { gap: 12px; }
  .hs-sep { display: none; }
  .ledger-head { display: none; }
  .li-row { flex-wrap: wrap; padding: 12px; gap: 6px 10px; }
  .li-num { order: 1; width: auto; }
  .li-content { order: 5; flex: 1 1 100%; min-width: 100%; }
  .li-text { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .li-err { order: 3; width: auto; }
  .li-date { order: 4; width: auto; }
  .li-caret { order: 6; }
  .detail-body { grid-template-columns: 1fr; }
  .d-compare { grid-template-columns: 1fr; }
  .rd-compare-grid { grid-template-columns: 1fr; }
  .print-btn { margin-left: 0; }
}
</style>
