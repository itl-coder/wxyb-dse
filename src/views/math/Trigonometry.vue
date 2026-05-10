<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 三角函数</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <div class="trig-controls">
      <div class="trig-row">
        <select v-model="trigFn" class="trig-select" @change="updateDisplay">
          <option v-for="fn in trigFunctions" :key="fn.key" :value="fn.key">{{ fn.label }}</option>
        </select>
        <label class="trig-check"><input type="checkbox" v-model="showUnit" /> 单位圆</label>
        <label class="trig-check"><input type="checkbox" v-model="showAnim" /> 动画</label>
        <label class="trig-check"><input type="checkbox" v-model="showGuide" /> 辅助线</label>
        <select v-model="trigProblem" class="trig-select" @change="onProblem($event.target.value)">
          <option value="">DSE例题</option>
          <option v-for="p in dseProblems" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>
      </div>
      <div class="trig-row">
        <span v-for="p in trigParams" :key="p.key" class="trig-param">
          <label>{{ p.label }}</label>
          <input type="range" :value="p.value" :min="p.min" :max="p.max" :step="p.step" class="trig-range" @input="setParam(p.key, +$event.target.value)" />
          <span class="trig-val">{{ p.value.toFixed(2) }}</span>
        </span>
      </div>
    </div>

    <div class="canvas-card">
      <P5Canvas ref="canvasRef" :sketch="sketchFn" />
      <div class="trig-info" v-html="infoHtml"></div>
    </div>

    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、标准形式 y = a·trig(bx + c) + d" tag="★ 高频">
          <FormulaBox>振幅 |A| = |a| 周期 T = 2π/|b| 相移 = -c/b 纵移 = d<br>最大值 = d + |a| 最小值 = d - |a| 值域 [d-|a|, d+|a|]<br>tan/cot 周期 T = π/|b|，无振幅概念</FormulaBox>
          <p><b>五点法作图</b>：取五点——起始点、峰点、中点、谷点、终点，每个点间隔 T/4。适用于 sin/cos。</p>
          <ExampleBox><b>示例</b>：y = 3cos(2x-π/3)+1，振幅=3，周期=π，相移=π/6(右)，最大值=4，最小值=-2</ExampleBox>
        </ConceptBlock>
        <ConceptBlock title="二、基本恒等式">
          <FormulaBox>sin²θ + cos²θ = 1<br>tanθ = sinθ/cosθ &nbsp; cotθ = cosθ/sinθ<br>secθ = 1/cosθ &nbsp; cscθ = 1/sinθ<br>1 + tan²θ = sec²θ &nbsp; 1 + cot²θ = csc²θ</FormulaBox>
        </ConceptBlock>
        <ConceptBlock title="三、三角函数图像变换" tag="★ DSE高频">
          <p>① 横向伸缩：y = sin(bx) 周期变为 2π/|b|</p>
          <p>② 横向平移：y = sin(x + c) 左移 c（c>0 时）</p>
          <p>③ 纵向伸缩：y = a·sin x 振幅变为 |a|</p>
          <p>④ 纵向平移：y = sin x + d 上移 d（d>0 时）</p>
        </ConceptBlock>
      </div>
      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>混淆周期公式 — sin/cos 周期=2π/|b|，tan/cot 周期=π/|b|</li>
            <li>相移符号搞反 — y=sin(2x+π/3) 向左移 π/6</li>
            <li>忽视值域范围 — 振幅是 |a| 不是 a</li>
            <li>tan 渐近线位置 — 在 cos(bx+c)=0 处</li>
            <li>sin/cos 混淆 — cos 图像从 (0,1) 开始</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>五点法快速定位 sin/cos 关键点</li>
            <li>先确定周期再确定相移</li>
            <li>单位圆 → 函数图像联动理解</li>
            <li>特殊角三角函数值需熟练记忆</li>
            <li>tan/cot 注意渐近线位置画图</li>
            <li>解三角方程注意多解情况</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import P5Canvas from '@/components/common/P5Canvas.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'
import ExampleBox from '@/components/common/ExampleBox.vue'

const objectives = [
  '掌握正弦、余弦、正切等函数的图像特征（振幅、周期、相移、纵移）',
  '理解单位圆与三角函数图像的对应关系',
  '熟练运用五点法绘制 sin/cos 图像',
  '掌握三角函数的平移、伸缩变换',
  '理解 tan/cot/sec/csc 的渐近线行为',
  '能解 DSE 常见三角函数方程与不等式'
]

const trigFunctions = [
  { key: 'sin', label: 'sin x' },
  { key: 'cos', label: 'cos x' },
  { key: 'tan', label: 'tan x' },
  { key: 'cot', label: 'cot x' },
  { key: 'sec', label: 'sec x' },
  { key: 'csc', label: 'csc x' }
]

const trigFn = ref('sin')
const showUnit = ref(true)
const showAnim = ref(true)
const showGuide = ref(false)
const trigProblem = ref('')
const infoHtml = ref('')
let animTheta = 0

const funcMap = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  cot: x => 1 / Math.tan(x),
  sec: x => 1 / Math.cos(x),
  csc: x => 1 / Math.sin(x)
}

// Period multipliers: sin/cos period=2π/|b|, tan/cot period=π/|b|
const periodMap = { sin: 2, cos: 2, tan: 1, cot: 1, sec: 2, csc: 2 }

const trigParams = reactive([
  { key: 'a', label: 'a 振幅', value: 1, min: -4, max: 4, step: 0.1 },
  { key: 'b', label: 'b 频率', value: 1, min: 0.2, max: 4, step: 0.1 },
  { key: 'c', label: 'c 相移', value: 0, min: -Math.PI, max: Math.PI, step: 0.05 },
  { key: 'd', label: 'd 纵移', value: 0, min: -3, max: 3, step: 0.1 }
])

function setParam(key, val) {
  const p = trigParams.find(x => x.key === key)
  if (p) p.value = val
}

const dseProblems = [
  { key: 'maxmin', label: '求最大/最小值' },
  { key: 'period', label: '求周期和相移' },
  { key: 'amplitude', label: '求振幅和值域' },
  { key: 'transform', label: '图像变换步骤' }
]

function getParams() {
  const a = trigParams[0].value, b = trigParams[1].value
  const c = trigParams[2].value, d = trigParams[3].value
  return { a, b, c, d }
}

function updateDisplay() {
  const { a, b, c, d } = getParams()
  const fn = trigFn.value
  const periodMult = periodMap[fn]
  const T = periodMult * Math.PI / Math.abs(b)
  const ps = -c / b
  const A = Math.abs(a)

  let h = `<b>函数</b>：\\(y=${a.toFixed(2)}\\cdot\\${fn}(${b.toFixed(2)}x`
  h += c >= 0 ? `+${c.toFixed(2)}` : `${c.toFixed(2)}`
  h += `)${d >= 0 ? '+' : ''}${d.toFixed(2)}\\)<br>`

  if (fn === 'sin' || fn === 'cos' || fn === 'sec' || fn === 'csc') {
    h += `<b>振幅</b> |a|=${A.toFixed(2)} &nbsp; <b>周期</b> T=${T.toFixed(2)}<br>`
    h += `<b>值域</b> [`; if (fn === 'sec' || fn === 'csc') h += `(-∞,${(d-A).toFixed(2)}]∪[${(d+A).toFixed(2)},+∞)`; else h += `${(d-A).toFixed(2)}, ${(d+A).toFixed(2)}`; h += `]<br>`
  } else {
    h += `<b>周期</b> T=${T.toFixed(2)} &nbsp; <b>值域</b> R<br>`
    // Asymptote positions for tan: bx+c = π/2 + kπ => x = (π/2 + kπ - c)/b
    h += `<b>渐近线</b>：x = (π/2 + kπ - c)/b<br>`
  }
  h += `<b>相移</b> =${ps.toFixed(2)}<br>`

  if (fn === 'sin' || fn === 'cos') {
    const func = funcMap[fn]
    h += '<b>五点法</b>：'
    for (let i = 0; i < 5; i++) {
      const x = ps + i * T / 4
      h += `P${i}(${x.toFixed(2)}, ${(a*func(b*x+c)+d).toFixed(2)}) `
    }
  }
  infoHtml.value = h
}

function onProblem(key) {
  const scenes = {
    maxmin: { a: 2, b: 1, c: 0, d: 0, fn: 'sin' },
    period: { a: 1, b: 2, c: Math.PI/3, d: -1, fn: 'sin' },
    amplitude: { a: 3, b: 0.5, c: 0, d: 1, fn: 'cos' },
    transform: { a: 2, b: 3, c: -Math.PI/4, d: 1, fn: 'sin' }
  }
  if (!key || !scenes[key]) return
  const s = scenes[key]
  trigParams[0].value = s.a; trigParams[1].value = s.b
  trigParams[2].value = s.c; trigParams[3].value = s.d
  trigFn.value = s.fn
  updateDisplay()
}

function trigValue(fn, x, a, b, c, d) {
  const val = funcMap[fn](b * x + c)
  if (!isFinite(val) || Math.abs(val) > 1e6) return NaN
  return a * val + d
}

const sketchFn = (p, container) => {
  p.setup = () => {
    const sz = Math.min(container.clientWidth - 20, 720)
    p.createCanvas(sz, sz)
    p.frameRate(30)
    p.textFont('sans-serif')
  }
  p.draw = () => {
    const sz = Math.min(container.clientWidth - 20, 720)
    if (p.width !== sz) p.resizeCanvas(sz, sz)
    p.background('#f8f7fc')
    drawTrig(p)
  }
}

function drawTrig(p) {
  const { a, b, c, d } = getParams()
  const W = p.width, H = p.height
  const fn = trigFn.value
  const hasUC = showUnit.value && (fn === 'sin' || fn === 'cos')
  const graphW = hasUC ? W * 0.72 : W - 20
  const m = 45
  const gsX = graphW / (5 * Math.PI)
  const gsY = (H - 2 * m) / 7
  const ox = m + graphW / 2, oy = m + 3.5 * gsY
  const toS = (x, y) => [ox + x * gsX, oy - y * gsY]

  // Grid
  p.stroke(220, 225, 235); p.strokeWeight(0.5)
  for (let x = m; x <= m + graphW; x += gsX * Math.PI / 2) p.line(x, m, x, H - m - 10)
  for (let y = m; y <= H - m - 10; y += gsY) p.line(m + 10, y, m + graphW, y)

  // Axes
  p.stroke('#94a3b8'); p.strokeWeight(1.5)
  p.line(m, oy, m + graphW, oy); p.line(ox, m, ox, H - m - 10)

  // Axis labels
  p.fill('#94a3b8'); p.noStroke(); p.textSize(8)
  p.textAlign(p.RIGHT, p.CENTER)
  for (let y = -3; y <= 3; y++) { if (y !== 0) { const [, ly] = toS(0, y); p.text(y, ox - 6, ly) } }
  p.textAlign(p.RIGHT, p.TOP); p.text('O', ox - 4, oy + 4)
  p.textAlign(p.CENTER, p.TOP); p.textSize(7)
  for (let x = -2 * Math.PI; x <= 2 * Math.PI; x += Math.PI / 6) {
    if (Math.abs(x) < 0.01) continue
    if (Math.abs(x / Math.PI - Math.round(x / Math.PI)) < 0.01) {
      const [lx] = toS(x, 0); p.text(formatPiLabel(x), lx, oy + 4)
    }
  }

  // Guide lines
  if (showGuide.value && (fn === 'sin' || fn === 'cos')) {
    const A = Math.abs(a)
    p.stroke(200, 80, 80, 40); p.strokeWeight(0.5); p.drawingContext.setLineDash([3, 3])
    const [, ey1] = toS(0, d + A); const [, ey3] = toS(0, d - A)
    p.line(ox, ey1, ox + 2 * Math.PI * gsX, ey1)
    p.line(ox, ey3, ox + 2 * Math.PI * gsX, ey3)
    p.drawingContext.setLineDash([])
    const periodMult = periodMap[fn]
    const T = periodMult * Math.PI / Math.abs(b)
    const [tx1, ty1] = toS(0, d); const [tx2] = toS(T, d)
    p.stroke(80, 80, 200, 60); p.strokeWeight(1); p.drawingContext.setLineDash([4, 2])
    p.line(tx1, ty1, tx2, ty1); p.drawingContext.setLineDash([])
    p.fill(80, 80, 200); p.textSize(7); p.textAlign(p.CENTER, p.BOTTOM)
    p.text(`T=${T.toFixed(2)}`, (tx1+tx2)/2, ty1-3)
  }

  // Draw asymptotes for tan/cot/sec/csc
  if (['tan', 'cot', 'sec', 'csc'].includes(fn)) {
    const periodMult = periodMap[fn]
    p.stroke('#f59e0b', 100); p.strokeWeight(1); p.drawingContext.setLineDash([4, 4])
    const kStart = Math.floor((-2*Math.PI*b + c) / Math.PI - 2)
    const kEnd = Math.ceil((2*Math.PI*b + c) / Math.PI + 2)
    for (let k = kStart; k <= kEnd; k++) {
      let asymptoteX
      if (fn === 'tan' || fn === 'sec') {
        asymptoteX = (Math.PI/2 + k * Math.PI - c) / b
      } else {
        asymptoteX = (k * Math.PI - c) / b
      }
      if (asymptoteX >= -2*Math.PI - 0.5 && asymptoteX <= 2*Math.PI + 0.5) {
        const [ax] = toS(asymptoteX, 0)
        p.line(ax, m, ax, H - m - 10)
      }
    }
    p.drawingContext.setLineDash([])
  }

  // Main function curve
  p.noFill(); p.stroke('#1a4a7a'); p.strokeWeight(2.5)
  let prevY = NaN
  p.beginShape()
  let started = false
  for (let x = -2 * Math.PI; x <= 2 * Math.PI; x += 0.015) {
    const y = trigValue(fn, x, a, b, c, d)
    if (isNaN(y) || Math.abs(y) > 8) {
      if (started) { p.endShape(); started = false }
      prevY = NaN
      continue
    }
    // Detect asymptote crossing (jump in y)
    if (!isNaN(prevY) && Math.abs(y - prevY) > 5) {
      if (started) { p.endShape(); started = false }
    }
    const [sx, sy] = toS(x, y)
    if (sx >= m && sx <= m + graphW && sy >= m && sy <= H - m - 10) {
      if (!started) { p.beginShape(); started = true }
      p.vertex(sx, sy)
    } else if (started) {
      p.endShape(); started = false
    }
    prevY = y
  }
  if (started) p.endShape()

  // Animated point
  if (showAnim.value) {
    animTheta += 0.02
    const yVal = trigValue(fn, animTheta, a, b, c, d)
    if (!isNaN(yVal) && Math.abs(yVal) < 8) {
      const [px, py] = toS(animTheta, yVal)
      p.fill('#c0392b'); p.noStroke(); p.circle(px, py, 7)
      p.textSize(8); p.textAlign(p.LEFT, p.BOTTOM); p.text(`y=${yVal.toFixed(2)}`, px + 6, py + 10)
    }
  }

  // Five-point marks (sin/cos only)
  if (fn === 'sin' || fn === 'cos') {
    const T = periodMap[fn] * Math.PI / Math.abs(b), ps = -c / b
    p.fill(45, 90, 135, 120); p.noStroke()
    for (let i = 0; i < 5; i++) {
      const x = ps + i * T / 4, y = trigValue(fn, x, a, b, c, d)
      if (!isNaN(y) && Math.abs(y) < 8) { const [sx, sy] = toS(x, y); if (sx > m && sx < m + graphW) p.circle(sx, sy, 4) }
    }
  }

  // Unit circle (sin/cos only)
  if (hasUC) {
    const ucOX = W * 0.78, ucOY = H / 2, ucR = Math.min(W * 0.18, H * 0.38)
    p.noFill(); p.stroke('#1a4a7a', 180); p.strokeWeight(1.5)
    p.ellipse(ucOX, ucOY, ucR * 2, ucR * 2)
    p.stroke(180, 185, 195, 60); p.strokeWeight(0.5)
    p.line(ucOX - ucR, ucOY, ucOX + ucR, ucOY); p.line(ucOX, ucOY - ucR, ucOX, ucOY + ucR)
    p.fill(180, 185, 195); p.textSize(7); p.textAlign(p.CENTER, p.TOP)
    p.text('1', ucOX + ucR + 8, ucOY - 2); p.text('−1', ucOX - ucR - 8, ucOY - 2)
    p.textAlign(p.RIGHT, p.CENTER)
    p.text('1', ucOX - 2, ucOY - ucR - 4); p.text('−1', ucOX - 2, ucOY + ucR + 4)

    if (showAnim.value) {
      const angle = animTheta
      const px = ucOX + ucR * Math.cos(angle), py = ucOY - ucR * Math.sin(angle)
      p.stroke(200, 80, 80, 50); p.strokeWeight(1); p.drawingContext.setLineDash([3, 3])
      p.line(px, py, px, ucOY); p.line(px, py, ucOX, py)
      p.drawingContext.setLineDash([])
      p.fill('#c0392b'); p.noStroke(); p.circle(px, py, 6)
      p.textSize(8); p.textAlign(p.LEFT, p.BOTTOM)
      p.text(`sin=${Math.sin(angle).toFixed(3)}`, px + 6, (ucOY + py) / 2)
      p.fill(80, 80, 200); p.textAlign(p.RIGHT, p.CENTER)
      p.text(`cos=${Math.cos(angle).toFixed(3)}`, (ucOX + px) / 2 - 4, py)
      p.fill(60, 160, 80); p.textSize(9); p.textAlign(p.LEFT, p.TOP)
      p.text('θ=' + angle.toFixed(2), ucOX + ucR * 0.22 * Math.cos(angle/2) + 4, ucOY - ucR * 0.22 * Math.sin(angle/2) - 6)
    }

    p.fill(100, 100, 100, 80); p.noStroke(); p.textSize(7); p.textAlign(p.CENTER, p.CENTER)
    p.text('I', ucOX + ucR*0.6, ucOY - ucR*0.6); p.text('II', ucOX - ucR*0.6, ucOY - ucR*0.6)
    p.text('III', ucOX - ucR*0.6, ucOY + ucR*0.6); p.text('IV', ucOX + ucR*0.6, ucOY + ucR*0.6)
  }
}

function formatPiLabel(x) {
  const ratio = x / Math.PI, n = Math.round(Math.abs(ratio))
  if (Math.abs(Math.abs(ratio) - n) < 0.001) {
    if (n === 0) return '0'; if (n === 1) return ratio >= 0 ? 'π' : '-π'
    if (n === 2) return ratio >= 0 ? '2π' : '-2π'
    return (ratio >= 0 ? '' : '-') + n + 'π'
  }
  return x.toFixed(2)
}

onMounted(() => updateDisplay())
</script>

<style scoped>
.trig-controls { display:flex;flex-direction:column;gap:8px;padding:10px 14px;background:var(--card-bg);border:1px solid var(--border-lighter);border-radius:var(--radius-lg);margin-bottom:10px;box-shadow:var(--shadow-light) }
.trig-row { display:flex;flex-wrap:wrap;align-items:center;gap:10px }
.trig-check { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary);cursor:pointer }
.trig-check input { accent-color:var(--accent) }
.trig-select { padding:4px 8px;border:1px solid var(--border-light);border-radius:6px;font-size:11px;font-family:inherit;color:var(--text-primary);background:var(--card-bg);outline:none;cursor:pointer }
.trig-select:focus { border-color:var(--accent) }
.trig-param { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary) }
.trig-param label { font-weight:600;min-width:40px }
.trig-range { width:80px;accent-color:var(--accent);height:4px }
.trig-val { font-size:10px;color:var(--text-muted);min-width:35px;font-family:var(--font-mono) }
.trig-info { padding:6px 14px;font-size:11px;color:var(--text-regular);background:var(--card-bg-warm);border-top:1px solid var(--border-lighter);line-height:1.8 }
.canvas-card { background:var(--card-bg);border-radius:var(--radius-lg);border:1px solid var(--border-lighter);box-shadow:var(--shadow);overflow:hidden;margin-bottom:14px }
</style>
