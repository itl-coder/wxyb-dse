<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 指数与对数函数</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <div class="log-controls">
      <div class="log-row">
        <span class="log-param">
          <label>底数 a</label>
          <input type="range" v-model.number="logA" :min="0.2" :max="5" :step="0.05" class="log-range" @input="updateDisplay" />
          <span class="log-val">{{ logA.toFixed(2) }}</span>
        </span>
        <div class="log-presets">
          <button v-for="p in presets" :key="p" class="log-preset-btn" :class="{ active: Math.abs(logA-p)<0.01 }" @click="setA(p)">a={{ p }}</button>
        </div>
        <span class="log-param">
          <label>范围</label>
          <input type="range" v-model.number="logZoom" :min="2" :max="10" :step="0.5" class="log-range" />
          <span class="log-val">{{ logZoom.toFixed(1) }}</span>
        </span>
      </div>
      <div class="log-row">
        <label class="log-check"><input type="checkbox" v-model="showIntersect" /> 交点</label>
        <label class="log-check"><input type="checkbox" v-model="showDomain" /> 定义域/值域</label>
        <label class="log-check"><input type="checkbox" v-model="compareMode" /> a=2对比</label>
        <select v-model="logProblem" class="log-select" @change="onProblem($event.target.value)">
          <option value="">DSE例题</option>
          <option v-for="p in dseProblems" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>
      </div>
    </div>

    <div class="canvas-card">
      <P5Canvas :sketch="sketchFn" />
      <div class="log-info" v-html="infoHtml"></div>
    </div>

    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、基本性质" tag="★ 高频">
          <FormulaBox>a⁰ = 1 logₐ1 = 0<br>a¹ = a logₐa = 1<br>a^(logₐx) = x（对数恒等式）<br>logₐaˣ = x</FormulaBox>
        </ConceptBlock>
        <ConceptBlock title="二、互为反函数" tag="★ 核心">
          <p>y = aˣ 与 y = logₐx 关于直线 y = x 对称。一个的定义域是另一个的值域。</p>
          <FormulaBox>指数：定义域 ℝ，值域 (0,∞)<br>对数：定义域 (0,∞)，值域 ℝ<br>a > 1 时递增，0 < a < 1 时递减</FormulaBox>
        </ConceptBlock>
        <ConceptBlock title="三、DSE常见题型">
          <p>① 解指数/对数方程 → 利用反函数转化</p>
          <p>② 应用指数增长/衰减模型（细菌、放射性）</p>
          <p>③ 图像交点分析：aˣ = x 的解</p>
        </ConceptBlock>
      </div>
      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>对数只对正数有意义 — logₐ0 和 logₐ(-x) 无定义</li>
            <li>aˣ = 0 无解 — 指数函数永不为零</li>
            <li>混淆 logₐ(xy) = logₐx + logₐy 与 logₐ(x+y)</li>
            <li>误以为 aˣ 与 logₐx 永远相交 — 需具体分析</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>化为同底：指数/对数方程统一底数</li>
            <li>换底公式：logₐb = ln b / ln a</li>
            <li>利用反函数消去指数/对数</li>
            <li>应用题的增长率/衰减率识别</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import P5Canvas from '@/components/common/P5Canvas.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '理解指数函数与对数函数互为反函数的关系',
  '掌握指数/对数函数的定义域、值域、渐近线',
  '能分析底数 a 对函数图像的影响',
  '熟练求解指数/对数方程及不等式',
  '掌握指数增长/衰减模型的DSE应用题'
]

const logA = ref(2)
const logZoom = ref(5)
const showIntersect = ref(true)
const showDomain = ref(false)
const compareMode = ref(false)
const logProblem = ref('')
const infoHtml = ref('')
const presets = [0.5, 1.5, 2, Math.E, 3, 4]

const dseProblems = [
  { key: 'growth', label: '指数增长（细菌）' },
  { key: 'decay', label: '指数衰减（放射性）' },
  { key: 'graph', label: '图像对比 y=2ˣ vs log₂x' }
]

function setA(v) { logA.value = v; updateDisplay() }

function findIntersection(a) {
  if (a <= 1 || Math.abs(a - 1) < 0.001) return null
  let lo = -1, hi = 2
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2, v = Math.pow(a, m) - m
    if (v > 0) lo = m; else hi = m
  }
  const x = (lo + hi) / 2, y = Math.pow(a, x)
  if (Math.abs(y - x) > 0.1) return null
  return { x, y }
}

function updateDisplay() {
  const a = logA.value
  const inter = a > 1 ? findIntersection(a) : null
  let h = `<b>指数</b>：\\(y=${a.toFixed(2)}^x\\) &nbsp; <b>对数</b>：\\(y=\\log_{${a.toFixed(2)}}x\\)<br>`
  h += `<b>定义域</b>：指 ℝ &nbsp; 对 (0,∞)<br>`
  h += `<b>值域</b>：指 (0,∞) &nbsp; 对 ℝ<br>`
  h += `<b>${a > 1 ? '递增 (a>1)' : '递减 (0<a<1)'}</b><br>`
  h += `<b>特殊点</b>：(0,1) (1,0) (1,${a.toFixed(2)}) (${a.toFixed(2)},1)<br>`
  h += inter ? `<b>交点 aˣ=x</b>：(${inter.x.toFixed(3)}, ${inter.y.toFixed(3)})` : '<b>交点</b>：无'
  infoHtml.value = h
}

function onProblem(key) {
  const scenes = {
    growth: { a: 2, text: '细菌每3小时翻一番，初始100个<br><b>模型</b>：N(t)=100·2^(t/3)<br><b>12小时后</b>：N(12)=1600个' },
    decay: { a: 0.5, text: '放射性物质半衰期10年，初始1000g<br><b>模型</b>：M(t)=1000·0.5^(t/10)<br><b>30年后</b>：M(30)=125g' },
    graph: { a: 2, text: '观察 y=2ˣ 与 y=log₂x 的图像<br>关键点：(0,1)和(1,0)关于y=x对称' }
  }
  if (!key || !scenes[key]) return
  logA.value = scenes[key].a
  updateDisplay()
}

const sketchFn = (p, container) => {
  p.setup = () => {
    const sz = Math.min(container.clientWidth - 20, 680, 680)
    p.createCanvas(sz, sz)
    p.frameRate(30)
    p.textFont('sans-serif')
  }
  p.draw = () => {
    const sz = Math.min(container.clientWidth - 20, 680, 680)
    if (p.width !== sz) p.resizeCanvas(sz, sz)
    p.background('#f8f7fc')
    drawLog(p)
  }
}

function drawLog(p) {
  const W = p.width, H = p.height, m = 45
  const a = logA.value, zoom = logZoom.value
  const gs = (W - 2 * m) / (2 * zoom)
  const ox = m + zoom * gs, oy = m + zoom * gs
  const toS = (x, y) => [ox + x * gs, oy - y * gs]

  // 网格
  p.stroke(228, 230, 240); p.strokeWeight(0.5)
  const step = zoom <= 3 ? 0.5 : 1
  for (let x = -Math.ceil(zoom); x <= Math.ceil(zoom); x += step) {
    const [sx] = toS(x, 0); if (sx >= m && sx <= W - m) p.line(sx, m, sx, H - m)
  }
  for (let y = -Math.ceil(zoom); y <= Math.ceil(zoom); y += step) {
    const [, sy] = toS(0, y); if (sy >= m && sy <= H - m) p.line(m, sy, W - m, sy)
  }

  // 坐标轴
  p.stroke('#7c7c9e'); p.strokeWeight(1.5)
  p.line(ox, m, ox, H - m); p.line(m, oy, W - m, oy)

  // 渐近线
  p.stroke(200, 80, 80, 100); p.strokeWeight(1.2); p.drawingContext.setLineDash([5, 3])
  p.line(m, oy, W - m, oy); p.line(ox, m, ox, H - m)
  p.drawingContext.setLineDash([])
  p.fill(200, 80, 80); p.textSize(8); p.textAlign(p.RIGHT, p.BOTTOM)
  p.text('y=0', W - m - 4, oy - 4); p.textAlign(p.LEFT, p.TOP); p.text('x=0', ox + 4, m + 4)

  // y = x
  p.stroke(180, 180, 190, 100); p.strokeWeight(1)
  const [l1x, l1y] = toS(-zoom, -zoom), [l2x, l2y] = toS(zoom, zoom)
  if (l1x >= m && l2x <= W-m) p.line(l1x, l1y, l2x, l2y)
  p.fill(180, 180, 190); p.textSize(8); p.text('y=x', l2x - 20, l2y - 8)

  // 对比模式
  if (compareMode.value && Math.abs(a - 2) > 0.01) {
    p.stroke(150, 150, 150, 60); p.strokeWeight(1.2); p.drawingContext.setLineDash([3, 3])
    p.beginShape()
    for (let x = -zoom; x <= zoom; x += 0.03) {
      const y = Math.pow(2, x)
      if (y > zoom*1.2 || y < -zoom*0.5) continue
      const [sx, sy] = toS(x, y); p.vertex(sx, sy)
    }
    p.endShape()
    p.beginShape()
    for (let x = 0.01; x <= zoom; x += 0.03) {
      const y = Math.log(x) / Math.log(2)
      if (y > zoom*1.2 || y < -zoom*0.5) continue
      const [sx, sy] = toS(x, y); p.vertex(sx, sy)
    }
    p.endShape()
    p.drawingContext.setLineDash([])
  }

  // 指数曲线
  p.stroke('#ef4444'); p.strokeWeight(2.5)
  p.beginShape()
  for (let x = -zoom; x <= zoom; x += 0.03) {
    const y = Math.pow(a, x)
    if (y > zoom*1.2 || y < -zoom*0.5) continue
    const [sx, sy] = toS(x, y); p.vertex(sx, sy)
  }
  p.endShape()

  // 对数曲线
  p.stroke('#4f46e5'); p.strokeWeight(2.5)
  p.beginShape()
  for (let x = 0.01; x <= zoom; x += 0.03) {
    const y = Math.log(x) / Math.log(a)
    if (y > zoom*1.2 || y < -zoom*0.5) continue
    const [sx, sy] = toS(x, y); p.vertex(sx, sy)
  }
  p.endShape()

  // 图例
  p.fill(255, 255, 255, 200); p.noStroke(); p.rect(m+4, m+4, 100, 36, 4)
  p.fill('#ef4444'); p.textSize(9); p.textAlign(p.LEFT, p.TOP)
  p.text(`y=${a.toFixed(2)}ˣ`, m+8, m+8)
  p.fill('#4f46e5'); p.text(`y=logₐx`, m+8, m+22)

  // 特殊点
  const [epx, epy] = toS(0, 1)
  p.fill('#ef4444'); p.noStroke(); p.circle(epx, epy, 4); p.text('(0,1)', epx+6, epy-4)
  const [lpx, lpy] = toS(1, 0)
  p.fill('#4f46e5'); p.noStroke(); p.circle(lpx, lpy, 4); p.text('(1,0)', lpx+6, lpy-4)

  // aˣ = x 交点
  if (showIntersect.value && a > 1) {
    const pt = findIntersection(a)
    if (pt && pt.x > -zoom && pt.x < zoom && pt.y < zoom*1.2) {
      const [ix, iy] = toS(pt.x, pt.y)
      p.fill('#e67e22'); p.noStroke(); p.circle(ix, iy, 6)
      p.textSize(9); p.textAlign(p.LEFT, p.BOTTOM)
      p.text(`(${pt.x.toFixed(3)},${pt.y.toFixed(3)})`, ix+8, iy-4)
    }
  }

  // 轴标签
  p.fill('#94a3b8'); p.noStroke(); p.textSize(8)
  for (let i = Math.ceil(-zoom); i <= Math.floor(zoom); i++) {
    if (i === 0) continue
    const [lx, ly] = toS(i, 0); const [lx2, ly2] = toS(0, i)
    if (lx >= m && lx <= W - m) { p.textAlign(p.CENTER, p.TOP); p.text(i, lx, oy + 4) }
    if (ly2 >= m && ly2 <= H - m) { p.textAlign(p.RIGHT, p.CENTER); p.text(i, ox - 6, ly2) }
  }
  p.textAlign(p.RIGHT, p.TOP); p.text('O', ox - 4, oy + 4)
}

onMounted(() => updateDisplay())
</script>

<style scoped>
.log-controls { display:flex;flex-direction:column;gap:8px;padding:10px 14px;background:var(--card-bg);border:1px solid var(--border-lighter);border-radius:var(--radius-lg);margin-bottom:10px;box-shadow:var(--shadow-light) }
.log-row { display:flex;flex-wrap:wrap;align-items:center;gap:10px }
.log-param { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary) }
.log-param label { font-weight:600;min-width:40px }
.log-range { width:100px;accent-color:var(--accent);height:4px }
.log-val { font-size:10px;color:var(--text-muted);min-width:28px;font-family:var(--font-mono) }
.log-presets { display:flex;gap:2px }
.log-preset-btn { padding:3px 8px;border:1px solid var(--border-light);border-radius:4px;background:var(--card-bg);color:var(--text-secondary);font-size:10px;font-family:var(--font-mono);cursor:pointer;transition:all 0.2s }
.log-preset-btn:hover { border-color:var(--accent);color:var(--accent) }
.log-preset-btn.active { background:var(--accent);color:#fff;border-color:var(--accent) }
.log-check { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary);cursor:pointer }
.log-check input { accent-color:var(--accent) }
.log-select { padding:4px 8px;border:1px solid var(--border-light);border-radius:6px;font-size:11px;font-family:inherit;color:var(--text-primary);background:var(--card-bg);outline:none }
.log-select:focus { border-color:var(--accent) }
.log-info { padding:6px 14px;font-size:11px;color:var(--text-regular);background:var(--card-bg-warm);border-top:1px solid var(--border-lighter);line-height:1.8 }
.canvas-card { background:var(--card-bg);border-radius:var(--radius-lg);border:1px solid var(--border-lighter);box-shadow:var(--shadow);overflow:hidden;margin-bottom:14px }
</style>
