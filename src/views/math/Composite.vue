<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">&#x1F4D0; 学习目标 · 函数工坊</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <div class="cfw-controls">
      <div class="cfw-row">
        <div class="cfw-fn-select">
          <label>外函数 f</label>
          <select v-model="outerFn" class="cfw-select" @change="updateWorkshop">
            <option v-for="f in outerFunctions" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
        </div>
        <span class="cfw-compose">∘</span>
        <div class="cfw-fn-select">
          <label>内函数 g</label>
          <select v-model="innerFn" class="cfw-select" @change="updateWorkshop">
            <option v-for="f in innerFunctions" :key="f.key" :value="f.key">{{ f.label }}</option>
          </select>
        </div>
        <div class="cfw-result-label">=</div>
        <div class="cfw-result" v-html="compositeLabel"></div>
      </div>

      <div class="cfw-row">
        <template v-if="innerFn === 'custom'">
          <span class="cfw-param">
            <label>px+q: p</label>
            <input type="range" :value="innerP" :min="-3" :max="3" :step="0.1" class="cfw-range" @input="innerP = +$event.target.value" />
            <span class="cfw-val">{{ innerP.toFixed(1) }}</span>
          </span>
          <span class="cfw-param">
            <label>q</label>
            <input type="range" :value="innerQ" :min="-3" :max="3" :step="0.1" class="cfw-range" @input="innerQ = +$event.target.value" />
            <span class="cfw-val">{{ innerQ.toFixed(1) }}</span>
          </span>
        </template>
        <template v-if="outerFn === 'custom'">
          <span class="cfw-param">
            <label>a</label>
            <input type="range" :value="outerA" :min="-3" :max="3" :step="0.1" class="cfw-range" @input="outerA = +$event.target.value" />
            <span class="cfw-val">{{ outerA.toFixed(1) }}</span>
          </span>
          <span class="cfw-param">
            <label>k</label>
            <input type="range" :value="outerK" :min="-3" :max="3" :step="0.1" class="cfw-range" @input="outerK = +$event.target.value" />
            <span class="cfw-val">{{ outerK.toFixed(1) }}</span>
          </span>
        </template>
        <label class="cfw-check"><input type="checkbox" v-model="compareMode" /> 对比模式</label>
        <button class="cfw-reset-btn" @click="resetWorkshop">重置</button>
      </div>
    </div>

    <div class="canvas-card">
      <P5Canvas ref="canvasRef" :sketch="sketchFn" />
      <div class="cfw-info" v-html="infoHtml"></div>
    </div>

    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、复合函数定义" tag="★ 核心">
          <p>复合函数 (f∘g)(x) = f(g(x))，先作用内函数 g，再作用外函数 f。</p>
          <FormulaBox>定义域：x 在 g 的定义域内，且 g(x) 在 f 的定义域内<br>值域：f(g(x)) 的值域 ⊆ f 的值域</FormulaBox>
        </ConceptBlock>
        <ConceptBlock title="二、标准变换顺序" tag="★ 高频">
          <FormulaBox>y = a·f(bx+c) + d 的变换：<br>① f(x) → f(x+c) 水平平移<br>② → f(bx+c) 水平伸缩<br>③ → a·f(bx+c) 垂直伸缩<br>④ → a·f(bx+c)+d 垂直平移</FormulaBox>
        </ConceptBlock>
      </div>
      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>变换顺序错误 — 必须先平移再伸缩</li>
            <li>忘记 f(bx+c) = f(b(x+c/b))，水平伸缩后平移 c/b</li>
            <li>复合后定义域可能缩小</li>
            <li>ln(g(x)) 要求 g(x) > 0</li>
            <li>sqrt(g(x)) 要求 g(x) ≥ 0</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>找出内函数 g(x) 和外函数 f(x)</li>
            <li>确定内函数的值域</li>
            <li>检查内函数值域是否在外函数定义域内</li>
            <li>按顺序分解变换：平移→伸缩→反射→平移</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import P5Canvas from '@/components/common/P5Canvas.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '理解复合函数 (f∘g)(x) = f(g(x)) 的构造方式',
  '掌握常见外函数与内函数的组合特性',
  '能从原函数图像推导复合函数图像',
  '理解复合函数定义域的变化',
  '熟练分析 sin(x²)、ln(x+1) 等经典复合函数'
]

const outerFunctions = [
  { key: 'sin', label: 'sin x' },
  { key: 'cos', label: 'cos x' },
  { key: 'exp', label: 'eˣ' },
  { key: 'ln', label: 'ln x' },
  { key: 'sqrt', label: '√x' },
  { key: 'abs', label: '|x|' },
  { key: 'sq', label: 'x²' }
]

const innerFunctions = [
  { key: 'linear', label: 'px+q' },
  { key: 'sq', label: 'x²' },
  { key: 'abs', label: '|x|' },
  { key: 'cube', label: 'x³' },
  { key: 'custom', label: '自定义' }
]

const outerFn = ref('sin')
const innerFn = ref('sq')
const innerP = ref(1), innerQ = ref(0)
const outerA = ref(1), outerK = ref(0)
const compareMode = ref(false)
const infoHtml = ref('')

function g(x) {
  switch (innerFn.value) {
    case 'linear': return innerP.value * x + innerQ.value
    case 'sq': return x * x
    case 'abs': return Math.abs(x)
    case 'cube': return x * x * x
    case 'custom': return innerP.value * x + innerQ.value
    default: return x
  }
}

function f(x) {
  switch (outerFn.value) {
    case 'sin': return Math.sin(x)
    case 'cos': return Math.cos(x)
    case 'exp': return Math.exp(x)
    case 'ln': return x > 0 ? Math.log(x) : NaN
    case 'sqrt': return x >= 0 ? Math.sqrt(x) : NaN
    case 'abs': return Math.abs(x)
    case 'sq': return x * x
    default: return x
  }
}

function fg(x) {
  const gx = g(x)
  return f(gx)
}

function getDomain() {
  const fn = outerFn.value
  switch (fn) {
    case 'ln': return { desc: 'g(x) > 0' }
    case 'sqrt': return { desc: 'g(x) ≥ 0' }
    case 'exp': case 'sin': case 'cos': case 'abs': case 'sq': return { desc: 'x ∈ R' }
    default: return { desc: 'x ∈ R' }
  }
}

const compositeLabel = computed(() => {
  const outerLabel = outerFunctions.find(o => o.key === outerFn.value)?.label || outerFn.value
  let innerLabel
  switch (innerFn.value) {
    case 'linear': innerLabel = `${innerP.value.toFixed(1)}x${innerQ.value >= 0 ? '+' : ''}${innerQ.value.toFixed(1)}`; break
    case 'sq': innerLabel = 'x²'; break
    case 'abs': innerLabel = '|x|'; break
    case 'cube': innerLabel = 'x³'; break
    case 'custom': innerLabel = `${innerP.value.toFixed(1)}x${innerQ.value >= 0 ? '+' : ''}${innerQ.value.toFixed(1)}`; break
    default: innerLabel = 'x'
  }
  return `f(g(x)) = ${outerLabel.replace('x', `(${innerLabel})`)}`
})

function updateWorkshop() {
  const domain = getDomain()
  let h = `<b>复合函数</b>：${compositeLabel.value}<br>`
  h += `<b>定义域</b>：${domain.desc}<br>`
  h += `<b>示例点</b>：`
  for (let x = -2; x <= 2; x += 0.5) {
    const y = fg(x)
    h += `f(g(${x.toFixed(1)})) = ${isNaN(y) ? '无定义' : y.toFixed(3)} &nbsp;`
  }
  infoHtml.value = h
}

function resetWorkshop() {
  outerFn.value = 'sin'; innerFn.value = 'sq'
  innerP.value = 1; innerQ.value = 0
  outerA.value = 1; outerK.value = 0
  compareMode.value = false
  updateWorkshop()
}

const sketchFn = (p, container) => {
  p.setup = () => {
    const sz = Math.min(container.clientWidth - 20, 650)
    p.createCanvas(sz, sz)
    p.frameRate(30)
    p.textFont('sans-serif')
  }
  p.draw = () => {
    const sz = Math.min(container.clientWidth - 20, 650)
    if (p.width !== sz) p.resizeCanvas(sz, sz)
    p.background('#f8f7fc')
    drawComposite(p)
  }
}

function drawComposite(p) {
  const W = p.width, H = p.height, m = 40
  const gs = (W - 2 * m) / 8
  const ox = m + 4 * gs, oy = m + 4 * gs
  const toS = (x, y) => [ox + x * gs, oy - y * gs]

  // Grid
  p.stroke(228, 230, 240); p.strokeWeight(0.5)
  for (let i = 0; i <= 8; i++) {
    p.line(m + i * gs, m, m + i * gs, H - m)
    p.line(m, m + i * gs, W - m, m + i * gs)
  }

  // Axes
  p.stroke('#7c7c9e'); p.strokeWeight(1.2)
  p.line(ox, m, ox, H - m); p.line(m, oy, W - m, oy)
  p.fill('#7c7c9e'); p.noStroke(); p.textSize(9)
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue
    p.textAlign(p.CENTER, p.TOP); p.text(i, ox + i * gs, oy + 4)
    p.textAlign(p.RIGHT, p.CENTER); p.text(i, ox - 5, oy - i * gs)
  }
  p.textAlign(p.RIGHT, p.TOP); p.text('O', ox - 4, oy + 4)

  // Inner function g(x) — dashed gray
  if (compareMode.value) {
    p.stroke('#94a3b8', 150); p.strokeWeight(1.3); p.drawingContext.setLineDash([4, 3])
    p.noFill()
    p.beginShape()
    let gStarted = false
    for (let x = -4; x <= 4; x += 0.02) {
      const y = g(x)
      if (isNaN(y) || Math.abs(y) > 5) { if (gStarted) { p.endShape(); gStarted = false } continue }
      const [sx, sy] = toS(x, y)
      if (sx >= m && sx <= W - m && sy >= m && sy <= H - m) {
        if (!gStarted) { p.beginShape(); gStarted = true }
        p.vertex(sx, sy)
      } else if (gStarted) { p.endShape(); gStarted = false }
    }
    if (gStarted) p.endShape()
    p.drawingContext.setLineDash([])
    p.fill('#94a3b8'); p.textSize(10); p.textAlign(p.LEFT, p.TOP)
    p.text('g(x)', ox + gs * 1.5, oy - gs * 2.5)
  }

  // Composite function f(g(x)) — solid blue
  p.stroke('#6366f1'); p.strokeWeight(2.3)
  p.noFill()
  p.beginShape()
  let started = false
  let prevY = NaN
  for (let x = -4; x <= 4; x += 0.015) {
    const y = fg(x)
    if (isNaN(y) || Math.abs(y) > 6) {
      if (started) { p.endShape(); started = false }
      prevY = NaN
      continue
    }
    if (!isNaN(prevY) && Math.abs(y - prevY) > 3) {
      if (started) { p.endShape(); started = false }
    }
    const [sx, sy] = toS(x, y)
    if (sx >= m && sx <= W - m && sy >= m && sy <= H - m) {
      if (!started) { p.beginShape(); started = true }
      p.vertex(sx, sy)
    } else if (started) { p.endShape(); started = false }
    prevY = y
  }
  if (started) p.endShape()

  // Label
  p.fill('#6366f1'); p.textSize(11); p.textAlign(p.LEFT, p.BOTTOM)
  p.text('f(g(x))', ox + gs * 1, oy - gs * 1)
}

onMounted(() => updateWorkshop())
</script>

<style scoped>
.cfw-controls { display:flex;flex-direction:column;gap:8px;padding:10px 14px;background:var(--card-bg);border:1px solid var(--border-lighter);border-radius:var(--radius-lg);margin-bottom:10px;box-shadow:var(--shadow-light) }
.cfw-row { display:flex;flex-wrap:wrap;align-items:center;gap:10px }
.cfw-fn-select { display:flex;flex-direction:column;gap:2px }
.cfw-fn-select label { font-size:10px;color:var(--text-muted);font-weight:600 }
.cfw-select { padding:4px 8px;border:1px solid var(--border-light);border-radius:6px;font-size:12px;font-family:inherit;color:var(--text-primary);background:var(--card-bg);outline:none;cursor:pointer;min-width:90px }
.cfw-select:focus { border-color:var(--accent) }
.cfw-compose { font-size:22px;color:var(--accent);font-weight:700;font-family:var(--font-mono) }
.cfw-result-label { font-size:14px;color:var(--text-secondary);font-weight:600 }
.cfw-result { font-size:13px;color:var(--accent);font-weight:700;font-family:var(--font-mono);letter-spacing:0.5px }
.cfw-param { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary) }
.cfw-param label { font-weight:600;min-width:30px }
.cfw-range { width:70px;accent-color:var(--accent);height:4px }
.cfw-val { font-size:10px;color:var(--text-muted);min-width:22px;font-family:var(--font-mono) }
.cfw-check { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary);cursor:pointer;white-space:nowrap }
.cfw-check input { accent-color:var(--accent) }
.cfw-reset-btn { padding:4px 10px;border:1px solid var(--border-light);border-radius:6px;background:var(--card-bg);color:var(--text-secondary);font-size:11px;font-family:inherit;cursor:pointer;transition:all 0.2s }
.cfw-reset-btn:hover { border-color:var(--accent);color:var(--accent) }
.cfw-info { padding:8px 14px;font-size:11px;color:var(--text-regular);background:var(--card-bg-warm);border-top:1px solid var(--border-lighter);line-height:1.8 }
.canvas-card { background:var(--card-bg);border-radius:var(--radius-lg);border:1px solid var(--border-lighter);box-shadow:var(--shadow);overflow:hidden;margin-bottom:14px }
</style>
