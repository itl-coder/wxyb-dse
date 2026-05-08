<template>
  <div class="chinese-page">
    <!-- Hero Banner -->
    <div class="chinese-hero">
      <div class="hero-bg-pattern"></div>
      <div class="hero-content">
        <div class="hero-badge">DSE 中国语文</div>
        <h1 class="hero-title">文以载道 · 学以养心</h1>
        <p class="hero-desc">12篇指定文言篇章精读 · 历年DSE作文题 · 写作格式指导 · 阅读策略 · 文化专题</p>
        <div class="hero-stats">
          <div class="hero-stat"><span class="stat-val">12</span><span class="stat-lbl">文言篇章</span></div>
          <div class="hero-stat"><span class="stat-val">30+</span><span class="stat-lbl">历年作文题</span></div>
          <div class="hero-stat"><span class="stat-val">5</span><span class="stat-lbl">写作格式</span></div>
          <div class="hero-stat"><span class="stat-val">3</span><span class="stat-lbl">阅读策略</span></div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="chinese-tabs-wrapper">
      <div class="chinese-tabs">
        <button v-for="tab in tabs" :key="tab.id" class="chinese-tab" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
          <span class="tab-desc">{{ tab.desc }}</span>
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="chinese-content">
      <!-- === 文言篇章 === -->
      <div v-if="activeTab === 'wenyan'" class="tab-panel fade-in">
        <div class="wenyan-shell">
          <!-- Left Sidebar -->
          <aside class="wenyan-sidebar">
            <div class="sidebar-header">
              <div class="sidebar-icon">📜</div>
              <div class="sidebar-title">12篇指定篇章</div>
              <div class="sidebar-subtitle">DSE 卷一甲部</div>
            </div>
            <nav class="wenyan-nav-list">
              <button v-for="(text, i) in wenyanData" :key="text.id" class="wenyan-nav-item" :class="{ active: activeWenyan === i }" @click="activeWenyan = i; scrollToTop()">
                <span class="wn-index">{{ i + 1 }}</span>
                <div class="wn-info">
                  <div class="wn-title">{{ text.title }}</div>
                  <div class="wn-meta">{{ text.tag }} · {{ text.source }}</div>
                </div>
                <span class="wn-arrow">→</span>
              </button>
            </nav>
          </aside>

          <!-- Main Content -->
          <section class="wenyan-main" ref="wenyanContent">
            <div v-if="currentText" class="article-view">
              <!-- Article Header -->
              <div class="article-head">
                <div class="article-num">{{ activeWenyan + 1 }}</div>
                <div class="article-info">
                  <h2 class="article-name">{{ currentText.title }}</h2>
                  <div class="article-meta">
                    <span class="am-tag">{{ currentText.tag }}</span>
                    <span class="am-source">{{ currentText.source }}</span>
                  </div>
                </div>
              </div>

              <!-- Core Idea Card -->
              <div class="core-idea-banner">
                <div class="cib-label">核心思想</div>
                <div class="cib-text">{{ currentText.coreIdea }}</div>
              </div>

              <!-- Toolbar -->
              <div class="article-tools">
                <button class="at-btn" :class="{ on: showTrans }" @click="showTrans = !showTrans">
                  <span>📖</span> {{ showTrans ? '隐藏翻译' : '显示翻译' }}
                </button>
                <button class="at-btn highlight-btn" @click="randomBlanks">
                  <span>🎯</span> 随机挖空
                </button>
                <button class="at-btn" @click="showAnswers">
                  <span>✅</span> 显示答案
                </button>
                <button class="at-btn" @click="resetBlanks">
                  <span>↺</span> 重置
                </button>
              </div>

              <!-- Classical Text -->
              <div class="classical-text-view">
                <div v-for="(section, si) in currentText.sections" :key="si" class="text-section">
                  <h3 class="section-label">{{ section.pTitle }}</h3>
                  <div v-for="(para, pi) in section.paragraphs" :key="pi" class="para-block">
                    <p class="classical-para"
                       :ref="el => setParaRef(el, si, pi)"
                       :data-raw="para.text"
                       v-html="renderText(para.text)"></p>
                    <div class="trans-para" :class="{ show: showTrans }">
                      <span class="trans-marker">译</span>
                      {{ para.trans }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Keywords Grid -->
              <div class="keywords-panel" v-if="currentText.keywords">
                <h3 class="kp-title">重点字词</h3>
                <div class="kp-grid">
                  <div v-for="k in currentText.keywords" :key="k.w" class="kp-item">
                    <span class="kp-word">{{ k.w }}</span>
                    <span class="kp-dot">→</span>
                    <span class="kp-meaning">{{ k.m }}</span>
                  </div>
                </div>
              </div>

              <!-- Exam Focus -->
              <div class="exam-focus-panel" v-if="currentText.examFocus">
                <div class="efp-header">
                  <span class="efp-icon">🎯</span>
                  <span>考试重点</span>
                </div>
                <p class="efp-body">{{ currentText.examFocus }}</p>
              </div>

              <!-- Question Types -->
              <div class="qt-section" v-if="currentText.questionTypes">
                <span class="qt-label">常见题型：</span>
                <el-tag v-for="(q, qi) in currentText.questionTypes" :key="qi" size="small"
                  :type="q.l === 'analysis' ? 'warning' : q.l === 'evaluation' ? 'danger' : ''"
                  class="qt-tag">{{ q.t }}</el-tag>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- === 写作指导 === -->
      <div v-if="activeTab === 'essay'" class="tab-panel fade-in">
        <div class="essay-shell">
          <!-- Left: Prompt Card + Format Guide -->
          <div class="essay-left">
            <!-- Random Prompt -->
            <div class="prompt-hero">
              <div class="prompt-hero-header">
                <h3>📝 随机作文题</h3>
                <button class="random-btn" @click="randomPrompt">
                  <span>🎲</span> 换一题
                </button>
              </div>
              <div v-if="currentPrompt" class="prompt-hero-body">
                <div class="phb-meta">
                  <span class="phb-year">{{ currentPrompt.year }}</span>
                  <span class="phb-type" :class="currentPrompt.tag">{{ currentPrompt.type }}</span>
                </div>
                <blockquote class="phb-text">{{ currentPrompt.text }}</blockquote>
                <button class="hint-toggle" @click="showHint = !showHint">
                  💡 {{ showHint ? '隐藏写作提示' : '查看写作提示' }}
                </button>
                <div v-if="showHint && currentPrompt.hint" class="hint-box">
                  {{ currentPrompt.hint }}
                </div>
              </div>
              <div v-else class="prompt-empty-state">
                <div class="empty-icon">📝</div>
                <p>点击「换一题」开始练习</p>
              </div>
            </div>

            <!-- Format Guides -->
            <div class="format-panel">
              <h3 class="format-panel-title">📐 写作格式指导</h3>
              <div class="format-list">
                <details v-for="fmt in formatGuides" :key="fmt.name" class="format-item">
                  <summary class="format-summary">{{ fmt.name }}</summary>
                  <div class="format-body">
                    <div class="format-row"><b>适用场景：</b>{{ fmt.scene }}</div>
                    <div class="format-row"><b>格式要点：</b>{{ fmt.keyPoints }}</div>
                    <div v-if="fmt.example" class="format-example-box">
                      <div class="feb-label">示例</div>
                      <pre class="feb-code">{{ fmt.example }}</pre>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          <!-- Right: All Prompts List -->
          <div class="essay-right">
            <div class="all-prompts-panel">
              <h3 class="app-title">📋 DSE历年作文题（2013-2024）</h3>
              <div class="app-list">
                <div v-for="p in essayPrompts" :key="p.year + p.text.slice(0,10)" class="app-item" @click="currentPrompt = p; showHint = false">
                  <div class="appi-header">
                    <span class="appi-year">{{ p.year }}</span>
                    <span class="appi-type" :class="p.tag">{{ p.type }}</span>
                  </div>
                  <p class="appi-text">{{ p.text }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- === 阅读策略 === -->
      <div v-if="activeTab === 'reading'" class="tab-panel fade-in">
        <div class="reading-shell">
          <div v-for="(strat, i) in readingStrategies" :key="i" class="reading-card">
            <div class="rc-header">
              <span class="rc-num">{{ i + 1 }}</span>
              <h3 class="rc-title">{{ strat.title }}</h3>
            </div>
            <ul class="rc-list">
              <li v-for="(item, j) in strat.items" :key="j">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- === 文化专题 === -->
      <div v-if="activeTab === 'culture'" class="tab-panel fade-in">
        <div class="culture-shell">
          <div v-for="topic in cultureTopics" :key="topic.id" class="culture-card">
            <div class="cc-icon">{{ topic.icon }}</div>
            <div class="cc-body">
              <h3 class="cc-title">{{ topic.title }}</h3>
              <p class="cc-desc">{{ topic.desc }}</p>
              <div class="cc-points">
                <span v-for="(pt, pi) in topic.points" :key="pi" class="cc-point">{{ pt }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { essayPrompts, wenyanData } from '@/data/chineseData.js'

const activeTab = ref('wenyan')
const activeWenyan = ref(0)
const showTrans = ref(false)
const showHint = ref(false)
const currentPrompt = ref(null)
const wenyanContent = ref(null)
const paraRefs = ref({})

const currentText = computed(() => wenyanData[activeWenyan.value] || null)

const tabs = [
  { id: 'wenyan', icon: '📜', label: '文言篇章', desc: '12篇指定精读' },
  { id: 'essay', icon: '✍️', label: '写作指导', desc: '历年真题+格式' },
  { id: 'reading', icon: '📖', label: '阅读策略', desc: '方法+技巧' },
  { id: 'culture', icon: '🏛️', label: '文化专题', desc: '传统文化素养' }
]

const cultureTopics = [
  { id: 1, icon: '🎭', title: '诸子百家思想', desc: '儒、道、墨、法四家核心思想的比较与融合。理解各家对社会、人性、政治的基本主张，辨析异同。', points: ['儒家：仁、礼、中庸', '道家：道、自然、无为', '墨家：兼爱、非攻、节用', '法家：法、术、势'] },
  { id: 2, icon: '🏯', title: '中国传统节日与民俗', desc: '春节、清明、端午、中秋等传统节日的文化内涵与文学表现。了解节日背后的历史故事与诗词意象。', points: ['春节：辞旧迎新、团圆', '清明：追思先祖、踏青', '端午：屈原、龙舟、粽子', '中秋：团圆、赏月、思乡'] },
  { id: 3, icon: '🎨', title: '中国书画艺术精神', desc: '书法与国画的美学追求："写意"、"留白"、"气韵生动"。理解这些美学概念在文学作品中的体现。', points: ['书法五体：篆隶楷行草', '写意与工笔的区别', '留白：虚实相生', '文人画：诗书画印一体'] },
  { id: 4, icon: '🏠', title: '中国传统家庭伦理', desc: '"孝"的文化内涵变迁——从《论语》到现代社会。理解"孝"在传统与现代语境中的不同意义。', points: ['《论语》论孝：敬与养', '二十四孝：历史与反思', '现代家庭关系变迁', '孝与个人独立性的平衡'] },
  { id: 5, icon: '📚', title: '文言文常见典故', desc: 'DSE高频典故溯源与运用，如"指鹿为马"、"卧薪尝胆"、"破釜沉舟"等。理解典故背后的历史背景和现代用法。', points: ['先秦典故：卧薪尝胆、完璧归赵', '两汉典故：指鹿为马、投笔从戎', '三国典故：三顾茅庐、鞠躬尽瘁', '典故在议论文中的运用技巧'] },
  { id: 6, icon: '🌿', title: '中国古代文人的山水情怀', desc: '"山水"在中国文学中的特殊地位——从谢灵运到柳宗元。理解"寄情山水"背后的文人心态与人生哲学。', points: ['山水诗的起源与发展', '贬谪文学中的山水', '《永州八记》与柳宗元', '山水与隐逸文化的关系'] }
]

const formatGuides = [
  {
    name: '📝 书信格式',
    scene: '给校长/老师/朋友写信',
    keyPoints: '上款（收信人称呼顶格）→ 问候语 → 正文（分段）→ 祝颂语（此致敬礼/祝好）→ 下款（署名+日期右对齐）',
    example: '尊敬的校长：\n\n　　您好！我是中五甲班的学生……\n\n　　此致\n敬礼\n\n　　　　　　　　　　　　　　　　　　学生 陈小明 谨启\n　　　　　　　　　　　　　　　　　　2024年3月15日'
  },
  {
    name: '🗣️ 演讲辞格式',
    scene: '学生会选举、主题演讲、毕业致辞',
    keyPoints: '开场问候（各位老师、各位同学）→ 互动引入 → 主体论述（2-3点）→ 结尾呼吁 → 致谢',
    example: '各位老师、各位同学：\n\n　　大家好！今天我想和大家谈谈……\n\n　　让我们共同努力！谢谢大家！'
  },
  {
    name: '📋 建议书格式',
    scene: '向校长/部门提出建议',
    keyPoints: '标题（关于×××的建议）→ 收件人 → 引言说明缘由 → 分点建议（每点含原因+做法+效果）→ 结尾期望 → 下款日期',
    example: '关于改善校园环境的建议书\n\n致：×××校长\n\n　　本人就校园环境提出以下建议：\n\n　　一、增设绿化区域……\n　　二、改善食堂……\n\n　　　　　　　　　　　　建议人：×××\n　　　　　　　　　　　　日期：2024年×月×日'
  },
  {
    name: '📰 议论文结构',
    scene: 'DSE议论文（卷一乙部）',
    keyPoints: '引论（提出问题/表明立场）→ 本论（2-3个分论点，每点有事例论证）→ 结论（总结观点/升华主题）。注意要有驳论或让步段落增强说服力。'
  },
  {
    name: '📖 记叙文结构',
    scene: 'DSE记叙文（卷一乙部）',
    keyPoints: '开端（背景/场景引入）→ 发展（事件推进）→ 高潮（关键转折/情感峰值）→ 结局（感悟/升华）。重点在细节描写和心理变化，结尾要有深度感悟。'
  }
]

const readingStrategies = [
  {
    title: '阅读理解三步法',
    items: ['一读：快速浏览，把握大意和主题', '二读：细读段落，关注过渡句和关键词', '三读：结合题目，定位答案区间']
  },
  {
    title: '文言文阅读技巧',
    items: ['先看注释了解背景和作者', '通读全文不求逐字理解', '关注【】标记的重点字词', '结合上下文推断词义', '注意「而」「之」「其」等虚词用法']
  },
  {
    title: '修辞手法辨析',
    items: ['比喻（明喻/暗喻/借喻）', '拟人 — 赋予事物人的特征', '排比 — 句式整齐增强气势', '对偶 — 对称工整（对联/骈文）', '反问 — 答案在问句中', '夸张 — 放大特征突出效果']
  }
]

function setParaRef(el, si, pi) {
  if (el) {
    const key = `${si}-${pi}`
    if (!paraRefs.value[key]) paraRefs.value[key] = []
    if (!paraRefs.value[key].includes(el)) paraRefs.value[key].push(el)
  }
}

function renderText(text) {
  return text.replace(/【([^】]+)】/g, '<span class="highlight-word">$1</span>')
}

function scrollToTop() {
  if (wenyanContent.value) wenyanContent.value.scrollTop = 0
}

function randomBlanks() {
  if (!currentText.value) return
  nextTick(() => {
    const textEl = wenyanContent.value
    if (!textEl) return
    const paras = textEl.querySelectorAll('.classical-para')
    paras.forEach(p => {
      const raw = p.dataset.raw
      if (!raw) return
      const markers = []
      raw.replace(/【([^】]+)】/g, (m, ans, pos) => { markers.push({ ans, pos, len: m.length }); return m })
      if (markers.length === 0) return
      const selected = markers.filter(() => Math.random() > 0.45)
      let idx = 0, result = '', prevEnd = 0
      raw.replace(/【([^】]+)】/g, (m, ans, pos) => {
        if (!result) result = raw.substring(0, pos)
        else result += raw.substring(prevEnd, pos)
        const cur = markers[idx++]
        if (selected.find(s => s.pos === pos)) {
          result += `<span class="blank-field" data-answer="${ans}">______</span>`
        } else {
          result += ans
        }
        prevEnd = pos + m.length
        return m
      })
      if (prevEnd < raw.length) result += raw.substring(prevEnd)
      p.innerHTML = result
    })
  })
}

function showAnswers() {
  if (!wenyanContent.value) return
  wenyanContent.value.querySelectorAll('.blank-field').forEach(b => {
    b.textContent = b.dataset.answer
    b.classList.add('revealed')
  })
}

function resetBlanks() {
  if (!wenyanContent.value) return
  const paras = wenyanContent.value.querySelectorAll('.classical-para')
  paras.forEach(p => {
    const raw = p.dataset.raw
    if (raw) p.innerHTML = raw.replace(/【([^】]+)】/g, '$1')
  })
}

function randomPrompt() {
  const p = essayPrompts[Math.floor(Math.random() * essayPrompts.length)]
  currentPrompt.value = p
  showHint.value = false
}
</script>

<style scoped>
/* ===== Page Shell ===== */
.chinese-page {
  max-width: 1320px;
  margin: 0 auto;
}

/* ===== Hero Banner ===== */
.chinese-hero {
  position: relative;
  background: linear-gradient(145deg, #2c1810 0%, #3d2b1f 30%, #4a3728 60%, #3d2b1f 100%);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 8px 40px rgba(44,24,16,0.25);
}

.hero-bg-pattern {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 80%, rgba(180,120,60,0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 85% 20%, rgba(220,200,160,0.08) 0%, transparent 40%),
    repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.012) 40px, rgba(255,255,255,0.012) 41px);
  pointer-events: none;
}

.hero-content {
  position: relative;
  padding: 36px 40px;
  text-align: center;
  z-index: 1;
}

.hero-badge {
  display: inline-block;
  padding: 4px 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  font-size: 12px;
  color: rgba(255,255,255,0.8);
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.hero-title {
  font-family: 'STKaiti', 'KaiTi', 'SimSun', 'PingFang SC', serif;
  font-size: 36px;
  font-weight: 700;
  color: #f0e6d3;
  margin: 0 0 8px;
  letter-spacing: 4px;
}

.hero-desc {
  font-size: 13px;
  color: rgba(240,230,211,0.6);
  margin: 0 auto 20px;
  max-width: 600px;
  line-height: 1.8;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-val {
  font-size: 22px;
  font-weight: 700;
  color: #d4a860;
  font-family: 'Georgia', 'STKaiti', serif;
}

.stat-lbl {
  font-size: 11px;
  color: rgba(240,230,211,0.5);
  margin-top: 2px;
}

/* ===== Tab Navigation ===== */
.chinese-tabs-wrapper {
  margin-bottom: 20px;
}

.chinese-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.chinese-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  border: 1.5px solid transparent;
  border-radius: 12px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-body);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.chinese-tab:hover {
  border-color: rgba(180,120,60,0.3);
  background: #fdfaf7;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(180,120,60,0.08);
}

.chinese-tab.active {
  border-color: #b4783c;
  background: linear-gradient(135deg, #fdf8f3 0%, #fefcf9 100%);
  box-shadow: 0 4px 16px rgba(180,120,60,0.12);
}

.tab-icon {
  font-size: 24px;
  line-height: 1;
}

.tab-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.tab-desc {
  font-size: 11px;
  color: var(--text-muted);
}

.chinese-tab.active .tab-label {
  color: #b4783c;
}

.chinese-tab.active .tab-desc {
  color: #c4946a;
}

/* ===== Content Area ===== */
.chinese-content {
  min-height: 500px;
}

.tab-panel.fade-in {
  animation: fadeSlideIn 0.4s ease;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== Wenyan Shell ===== */
.wenyan-shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  align-items: start;
}

/* Sidebar */
.wenyan-sidebar {
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: 14px;
  overflow: hidden;
  position: sticky;
  top: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}

.sidebar-header {
  padding: 20px 18px 14px;
  border-bottom: 1px solid var(--border-lighter);
  text-align: center;
}

.sidebar-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
}

.sidebar-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.wenyan-nav-list {
  padding: 6px;
}

.wenyan-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  font-family: var(--font-body);
  margin-bottom: 2px;
}

.wenyan-nav-item:hover {
  background: rgba(180,120,60,0.06);
}

.wenyan-nav-item.active {
  background: rgba(180,120,60,0.1);
}

.wn-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--bg-warm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: all 0.2s;
}

.wenyan-nav-item.active .wn-index {
  background: #b4783c;
  color: #fff;
}

.wn-info {
  flex: 1;
  min-width: 0;
}

.wn-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.wn-meta {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
}

.wn-arrow {
  font-size: 12px;
  color: var(--text-muted);
  opacity: 0;
  transition: all 0.2s;
}

.wenyan-nav-item:hover .wn-arrow,
.wenyan-nav-item.active .wn-arrow {
  opacity: 1;
  color: #b4783c;
}

/* Wenyan Main Content */
.wenyan-main {
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: 14px;
  padding: 28px 32px;
  max-height: 78vh;
  overflow-y: auto;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}

/* Article Header */
.article-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-lighter);
}

.article-num {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #b4783c 0%, #8b5e3c 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Georgia', 'STKaiti', serif;
  flex-shrink: 0;
}

.article-info {
  flex: 1;
}

.article-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.am-tag {
  font-size: 10px;
  padding: 2px 10px;
  background: rgba(180,120,60,0.1);
  color: #8b5e3c;
  border-radius: 4px;
  font-weight: 600;
}

.am-source {
  font-size: 12px;
  color: var(--text-muted);
}

/* Core Idea */
.core-idea-banner {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(180,120,60,0.04) 0%, rgba(180,120,60,0.01) 100%);
  border-left: 3px solid #b4783c;
  border-radius: 0 8px 8px 0;
  margin-bottom: 18px;
}

.cib-label {
  font-size: 12px;
  font-weight: 700;
  color: #b4783c;
  white-space: nowrap;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
}

.cib-text {
  font-size: 13px;
  color: var(--text-regular);
  line-height: 1.8;
}

/* Tools */
.article-tools {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.at-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 16px;
  border: 1px solid var(--border-base);
  border-radius: 8px;
  background: var(--card-bg);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-regular);
  transition: all 0.2s;
  font-family: var(--font-body);
}

.at-btn:hover {
  border-color: #b4783c;
  color: #8b5e3c;
  background: #fdf8f3;
}

.at-btn.on {
  background: rgba(180,120,60,0.08);
  border-color: #b4783c;
  color: #8b5e3c;
}

.at-btn span {
  font-size: 14px;
}

/* Classical Text */
.classical-text-view {
  margin: 20px 0;
}

.text-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 14px;
  font-weight: 700;
  color: #8b5e3c;
  margin: 0 0 12px;
  padding: 6px 14px;
  background: rgba(180,120,60,0.05);
  border-left: 3px solid #b4783c;
  border-radius: 0 6px 6px 0;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
}

.para-block {
  margin-bottom: 10px;
}

.classical-para {
  font-family: 'STKaiti', 'KaiTi', 'SimSun', 'PingFang SC', serif;
  font-size: 17px;
  line-height: 2.4;
  text-indent: 2em;
  margin: 0;
  color: #2c2c2c;
  letter-spacing: 0.5px;
}

.classical-para :deep(.highlight-word) {
  color: #b4783c;
  font-weight: 700;
  padding: 0 2px;
}

.trans-para {
  font-size: 13px;
  line-height: 2;
  padding: 10px 14px;
  margin: 8px 0 14px;
  background: rgba(107,142,100,0.05);
  border-left: 3px solid var(--success);
  border-radius: 0 6px 6px 0;
  color: #5a7a55;
  display: none;
}

.trans-para.show {
  display: block;
}

.trans-marker {
  display: inline-block;
  font-size: 10px;
  padding: 0 6px;
  background: var(--success);
  color: #fff;
  border-radius: 3px;
  margin-right: 8px;
  font-weight: 600;
  vertical-align: middle;
}

/* Blank fill */
.classical-para :deep(.blank-field) {
  background: #fff8e1;
  border-bottom: 2px solid #b4783c;
  padding: 0 8px;
  margin: 0 2px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 15px;
}

.classical-para :deep(.blank-field.revealed) {
  background: #e8f5e9;
  border-color: var(--success);
  color: #2e7d32;
}

/* Keywords Panel */
.keywords-panel {
  margin: 24px 0;
  padding: 20px;
  background: var(--card-bg-warm);
  border: 1px solid var(--border-lighter);
  border-radius: 12px;
}

.kp-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-lighter);
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
}

.kp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 6px 16px;
}

.kp-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 13px;
}

.kp-word {
  font-weight: 700;
  color: #8b5e3c;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
  font-size: 15px;
}

.kp-dot {
  color: var(--text-muted);
  font-size: 10px;
}

.kp-meaning {
  color: var(--text-regular);
}

/* Exam Focus */
.exam-focus-panel {
  padding: 14px 18px;
  margin: 16px 0;
  background: rgba(180,120,60,0.03);
  border: 1px solid rgba(180,120,60,0.12);
  border-radius: 10px;
}

.efp-header {
  font-size: 13px;
  font-weight: 700;
  color: #8b5e3c;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.efp-icon {
  font-size: 16px;
}

.efp-body {
  font-size: 12px;
  line-height: 1.9;
  color: var(--text-regular);
  margin: 0;
}

/* Question Types */
.qt-section {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.qt-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.qt-tag {
  margin: 2px;
}

/* ===== Essay Shell ===== */
.essay-shell {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
  align-items: start;
}

.essay-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Prompt Hero */
.prompt-hero {
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: 14px;
  padding: 24px 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}

.prompt-hero-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-lighter);
}

.prompt-hero-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
}

.random-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  border: 1px solid #b4783c;
  border-radius: 20px;
  background: transparent;
  color: #8b5e3c;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
  font-family: var(--font-body);
}

.random-btn:hover {
  background: #b4783c;
  color: #fff;
}

.prompt-hero-body {
  padding: 4px 0;
}

.phb-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.phb-year {
  font-size: 11px;
  padding: 2px 10px;
  background: var(--bg-warm);
  border-radius: 4px;
  color: var(--text-secondary);
  font-weight: 600;
}

.phb-type {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 600;
}

.phb-type.narrate { background: rgba(107,158,122,0.1); color: #4a7a55; }
.phb-type.argue { background: rgba(196,122,90,0.1); color: #a86040; }
.phb-type.practical { background: rgba(59,130,246,0.1); color: #3b82f6; }

.phb-text {
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
  font-size: 16px;
  line-height: 2.2;
  color: var(--text-primary);
  margin: 0 0 12px;
  padding: 12px 18px;
  background: var(--card-bg-warm);
  border-radius: 8px;
  border-left: 3px solid #b4783c;
}

.hint-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  transition: color 0.2s;
  font-family: var(--font-body);
}

.hint-toggle:hover {
  color: #8b5e3c;
}

.hint-box {
  margin-top: 10px;
  padding: 12px 16px;
  background: rgba(107,158,122,0.06);
  border-radius: 8px;
  font-size: 12px;
  line-height: 2;
  color: #4a7a55;
  border: 1px solid rgba(107,158,122,0.12);
}

.prompt-empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
  opacity: 0.5;
}

/* Format Panel */
.format-panel {
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: 14px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}

.format-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 14px;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
}

.format-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.format-item {
  border: 1px solid var(--border-lighter);
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.format-item[open] {
  border-color: rgba(180,120,60,0.3);
}

.format-summary {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  user-select: none;
  transition: background 0.2s;
}

.format-summary:hover {
  background: var(--card-bg-warm);
}

.format-body {
  padding: 4px 16px 16px;
  font-size: 12px;
  line-height: 2;
  color: var(--text-regular);
}

.format-row {
  margin: 6px 0;
}

.format-row b {
  color: var(--text-primary);
}

.format-example-box {
  margin-top: 10px;
}

.feb-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.feb-code {
  background: var(--card-bg-warm);
  border: 1px solid var(--border-lighter);
  border-radius: 8px;
  padding: 14px 18px;
  font-size: 12px;
  line-height: 2;
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
  color: var(--text-primary);
}

/* All Prompts Panel */
.all-prompts-panel {
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  position: sticky;
  top: 20px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border-lighter);
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
  position: sticky;
  top: 0;
  background: var(--card-bg);
  border-radius: 14px 14px 0 0;
}

.app-list {
  overflow-y: auto;
  padding: 4px 8px;
}

.app-item {
  padding: 14px 14px;
  border-bottom: 1px solid var(--border-lighter);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
  margin: 2px 0;
}

.app-item:hover {
  background: var(--card-bg-warm);
}

.app-item:last-child {
  border-bottom: none;
}

.appi-header {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 4px;
}

.appi-year {
  font-size: 10px;
  padding: 1px 8px;
  background: var(--bg-warm);
  border-radius: 3px;
  color: var(--text-secondary);
  font-weight: 600;
}

.appi-type {
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 3px;
  font-weight: 600;
}

.appi-type.narrate { background: rgba(107,158,122,0.1); color: #4a7a55; }
.appi-type.argue { background: rgba(196,122,90,0.1); color: #a86040; }
.appi-type.practical { background: rgba(59,130,246,0.1); color: #3b82f6; }

.appi-text {
  font-size: 11px;
  line-height: 1.7;
  color: var(--text-regular);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== Reading Shell ===== */
.reading-shell {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.reading-card {
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  transition: all 0.3s;
}

.reading-card:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

.rc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-lighter);
}

.rc-num {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #b4783c, #8b5e3c);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.rc-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
}

.rc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.rc-list li {
  font-size: 13px;
  line-height: 2;
  color: var(--text-regular);
  padding: 3px 0 3px 20px;
  position: relative;
}

.rc-list li::before {
  content: '•';
  position: absolute;
  left: 4px;
  color: #b4783c;
  font-weight: 700;
}

/* ===== Culture Shell ===== */
.culture-shell {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.culture-card {
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: 14px;
  padding: 24px 28px;
  display: flex;
  gap: 18px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
  transition: all 0.3s;
}

.culture-card:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

.cc-icon {
  font-size: 36px;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--card-bg-warm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--border-lighter);
}

.cc-body {
  flex: 1;
  min-width: 0;
}

.cc-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px;
  font-family: 'STKaiti', 'KaiTi', 'SimSun', serif;
}

.cc-desc {
  font-size: 12px;
  line-height: 1.8;
  color: var(--text-regular);
  margin: 0 0 12px;
}

.cc-points {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cc-point {
  font-size: 11px;
  padding: 3px 10px;
  background: rgba(180,120,60,0.06);
  color: #8b5e3c;
  border-radius: 6px;
  border: 1px solid rgba(180,120,60,0.1);
}

/* ===== Responsive ===== */
@media (max-width: 1024px) {
  .wenyan-shell { grid-template-columns: 1fr; }
  .wenyan-sidebar { position: static; }
  .essay-shell { grid-template-columns: 1fr; }
  .reading-shell { grid-template-columns: 1fr; }
  .culture-shell { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .chinese-tabs { grid-template-columns: repeat(2, 1fr); }
  .hero-title { font-size: 24px; }
  .hero-stats { gap: 16px; flex-wrap: wrap; }
  .hero-content { padding: 24px 20px; }
  .wenyan-main { padding: 18px; }
  .article-head { flex-direction: column; }
}
</style>
