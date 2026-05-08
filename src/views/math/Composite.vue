<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 函数变换</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <div class="comp-controls">
      <div class="control-row">
        <el-select v-model="compFn" size="small" style="width:120px" @change="updateDesc">
          <el-option v-for="(name,key) in funcNames" :key="key" :label="name" :value="key" />
        </el-select>
        <span v-for="p in compParams" :key="p.key" class="param-item">
          <label>{{ p.label }}</label>
          <el-slider v-model="p.value" :min="p.min" :max="p.max" :step="p.step" style="width:100px" @input="updateDesc" show-input size="small" />
        </span>
        <el-button size="small" @click="resetComp">重置</el-button>
      </div>
      <div class="control-row">
        <el-checkbox v-model="stepMode" size="small">分步模式</el-checkbox>
        <template v-if="stepMode">
          <el-radio-group v-model="compStep" size="small">
            <el-radio-button v-for="(name,i) in stepLabels" :key="i" :value="i">{{ name }}</el-radio-button>
          </el-radio-group>
          <el-checkbox v-model="overlayMode" size="small">叠加</el-checkbox>
        </template>
      </div>
    </div>

    <div class="canvas-card">
      <P5Canvas :sketch="sketchFn" />
      <div class="comp-info" v-html="infoHtml"></div>
    </div>

    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、标准变换顺序" tag="★ 高频">
          <p>y = a·f(bx+c) + d 的变换过程：</p>
          <FormulaBox>① f(x) → f(x+c) 水平平移 c 单位（c>0向左）<br>② → f(bx+c) 水平伸缩 1/|b| 倍<br>③ → a·f(bx+c) 垂直伸缩 |a| 倍<br>④ → a·f(bx+c)+d 垂直平移 d 单位（d>0向上）</FormulaBox>
          <p><b>注意</b>：a<0 或 b<0 时还涉及反射变换</p>
        </ConceptBlock>
        <ConceptBlock title="二、复合函数概念" tag="★ 核心">
          <p>复合函数 (f∘g)(x) = f(g(x))，先作用 g，再作用 f。</p>
          <p>DSE 常见：sin(2x)、|2x-3|、√(x²+1) 等都是复合函数。</p>
        </ConceptBlock>
      </div>
      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>变换顺序错误 — 必须先平移再伸缩</li>
            <li>水平方向符号搞反 — f(x+2) 向左移2</li>
            <li>忘记 f(bx+c) = f(b(x+c/b))，水平伸缩后平移 c/b</li>
            <li>反射与伸缩顺序混淆</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>找出原始函数 f(x)</li>
            <li>按顺序分解变换：平移→伸缩→反射→平移</li>
            <li>画图验证变换结果</li>
            <li>注意 sin/cos 五点法的变换</li>
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

const objectives = [
  '理解函数平移、伸缩、反射变换的几何意义',
  '掌握 y = a·f(bx+c)+d 的标准变换顺序',
  '能从原函数图像推导变换后的图像',
  '掌握复合函数 (f∘g)(x) 的基本概念',
  '熟练运用五点法分析三角函数的复合变换'
]

const funcs = {
  sin: Math.sin,
  cos: Math.cos,
  quad: x => x * x,
  abs: Math.abs,
  sqrt: x => x >= 0 ? Math.sqrt(x) : NaN,
  cube: x => x * x * x
}
const funcNames = { sin: 'sin x', cos: 'cos x', quad: 'x²', abs: '|x|', sqrt: '√x', cube: 'x³' }
const stepLabels = ['f(x)', 'f(bx)', 'f(bx+c)', 'a·f(bx+c)', '完整']

const compFn = ref('sin')
const stepMode = ref(false)
const overlayMode = ref(false)
const compStep = ref(4)
const infoHtml = ref('')
let panX = 0, panY = 0

const compParams = reactive([
  { key: 'ca', label: 'a', value: 1, min: -3, max: 3, step: 0.1 },
  { key: 'cb', label: 'b', value: 1, min: -3, max: 3, step: 0.1 },
  { key: 'cc', label: 'c', value: 0, min: -3, max: 3, step: 0.1 },
  { key: 'cd', label: 'd', value: 0, min: -3, max: 3, step: 0.1 }
])

function getCP() {
  return { a: compParams[0].value, b: compParams[1].value, c: compParams[2].value, d: compParams[3].value }
}

function resetComp() {
  compParams[0].value = 1; compParams[1].value = 1; compParams[2].value = 0; compParams[3].value = 0
  updateDesc()
}

function updateDesc() {
  const { a, b, c, d } = getCP()
  const steps = []
  if (c !== 0) steps.push(`① 平移 x: ${c>0?'左':'右'}${Math.abs(c).toFixed(1)}`)
  if (b !== 1) steps.push(`② 横缩 ${Math.abs(1/b).toFixed(2)}倍${b<0?'（水平反射）':''}`)
  if (a !== 1) steps.push(`③ 纵伸 ${Math.abs(a).toFixed(2)}倍${a<0?'（垂直反射）':''}`)
  if (d !== 0) steps.push(`④ ${d>0?'上':'下'}移 ${Math.abs(d).toFixed(1)}`)
  infoHtml.value =
    `<b>原函数</b>：y=${funcNames[compFn.value]}(x)<br>` +
    `<b>变换后</b>：y=${a.toFixed(1)}·${funcNames[compFn.value]}(${b.toFixed(1)}x${c>=0?'+':''}${c.toFixed(1)})${d>=0?'+':''}${d.toFixed(1)}<br>` +
    (steps.length ? `<b>变换</b>：${steps.join(' → ')}` : '(原函数)') +
    '<br><span style="color:#64748b;font-size:11px">标准顺序：平移→伸缩→反射→平移</span>'
}

const sketchFn = (p, container) => {
  let dragActive = false, lmx = 0, lmy = 0
  p.setup = () => {
    const sz = Math.min(container.clientWidth - 20, 640, 640)
    p.createCanvas(sz, sz); p.frameRate(30); p.textFont('sans-serif')
  }
  p.draw = () => {
    const sz = Math.min(container.clientWidth - 20, 640, 640)
    if (p.width !== sz) p.resizeCanvas(sz, sz)
    p.background('#fafbfc')
    drawComp(p)
  }
  p.mousePressed = () => { dragActive = true; lmx = p.mouseX; lmy = p.mouseY }
  p.mouseReleased = () => { dragActive = false }
  p.mouseDragged = () => {
    if (dragActive) { panX += p.mouseX - lmx; panY += p.mouseY - lmy; lmx = p.mouseX; lmy = p.mouseY }
  }
}

function drawStep(p, step, col, dash, label, toS, f) {
  const { a, b, c, d } = getCP()
  p.stroke(col); p.strokeWeight(dash ? 1.5 : 2.5)
  if (dash) p.drawingContext.setLineDash([4, 4])
  p.beginShape()
  for (let x = -3; x <= 3; x += 0.02) {
    let y
    if (step === 0) y = f(x)
    else if (step === 1) y = f(b * x)
    else if (step === 2) y = f(b * x + c)
    else if (step === 3) y = a * f(b * x + c)
    else y = a * f(b * x + c) + d
    if (isNaN(y) || Math.abs(y) > 5) continue
    const [sx, sy] = toS(x, y); p.vertex(sx, sy)
  }
  p.endShape()
  if (dash) p.drawingContext.setLineDash([])
  if (label) {
    p.fill(col); p.noStroke(); p.textSize(9); p.textAlign(p.LEFT, p.TOP)
    const lx = 2.2
    let ly
    if (step === 0) ly = f(lx)
    else if (step === 1) ly = f(b * lx)
    else if (step === 2) ly = f(b * lx + c)
    else if (step === 3) ly = a * f(b * lx + c)
    else ly = a * f(b * lx + c) + d
    if (!isNaN(ly) && Math.abs(ly) < 5) { const [slx, sly] = toS(lx, ly); p.text(label, slx + 4, sly - 6) }
  }
}

function drawComp(p) {
  const { a, b, c, d } = getCP()
  const W = p.width, H = p.height, m = 45
  const gs = (W - 2 * m) / 6
  const ox = m + 3 * gs + panX, oy = m + 3 * gs + panY
  const toS = (x, y) => [ox + x * gs, oy - y * gs]
  const f = funcs[compFn.value]

  // 网格
  p.stroke(220, 225, 235); p.strokeWeight(0.5)
  for (let i = 0; i <= 6; i++) { p.line(m + i * gs, m, m + i * gs, H - m); p.line(m, m + i * gs, W - m, m + i * gs) }

  // 坐标轴
  p.stroke('#94a3b8'); p.strokeWeight(1.5)
  p.line(ox, m, ox, H - m); p.line(m, oy, W - m, oy)
  p.fill('#94a3b8'); p.noStroke()
  p.triangle(W - m - 1, oy, W - m - 9, oy - 4, W - m - 9, oy + 4)
  p.triangle(ox, 1, ox - 4, 10, ox + 4, 10)

  // 轴标签
  p.textSize(9)
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue
    const [lx, ly] = toS(i, 0)
    p.textAlign(p.CENTER, p.TOP); p.text(i, lx, oy + 4)
    p.textAlign(p.RIGHT, p.CENTER); p.text(i, ox - 6, ly)
  }
  p.textAlign(p.RIGHT, p.TOP); p.text('O', ox - 4, oy + 4)

  if (stepMode.value) {
    if (overlayMode.value) {
      const colors = ['#94a3b8', '#2d6a9f', '#e67e22', '#9b59b6', '#c0392b']
      for (let s = 0; s <= 4; s++) drawStep(p, s, colors[s], s !== compStep.value, stepLabels[s], toS, f)
    } else {
      for (let s = 0; s < compStep.value; s++) {
        const gray = 150 - s * 20
        drawStep(p, s, p.color(gray, gray, gray + 20, 80), true, null, toS, f)
      }
      const colors = ['#94a3b8', '#2d6a9f', '#e67e22', '#9b59b6', '#c0392b']
      drawStep(p, compStep.value, colors[compStep.value], false, stepLabels[compStep.value], toS, f)
    }
  } else {
    // 原函数虚线
    p.stroke(150, 160, 175); p.strokeWeight(1.5); p.drawingContext.setLineDash([4, 4])
    p.beginShape()
    for (let x = -3; x <= 3; x += 0.02) {
      const y = f(x); if (isNaN(y) || Math.abs(y) > 5) continue
      const [sx, sy] = toS(x, y); p.vertex(sx, sy)
    }
    p.endShape(); p.drawingContext.setLineDash([])

    // 变换后实线
    p.stroke('#c0392b'); p.strokeWeight(2.5); p.beginShape()
    for (let x = -3; x <= 3; x += 0.02) {
      const inner = b * x + c; let y = f(inner)
      if (isNaN(y) || Math.abs(y) > 5) continue
      y = a * y + d; const [sx, sy] = toS(x, y); p.vertex(sx, sy)
    }
    p.endShape()

    // 图例
    p.fill(150, 160, 175); p.noStroke(); p.textSize(10); p.textAlign(p.LEFT, p.TOP)
    p.text('原函数', m + 6, m + 6)
    p.fill('#c0392b'); p.text('变换后', m + 6, m + 22)
  }

  // sin/cos 离散点
  if (compFn.value === 'sin' || compFn.value === 'cos') {
    p.fill('#2d5a87'); p.noStroke(); p.textSize(8)
    for (let x = -3; x <= 3; x += 0.5) {
      const inner = b * x + c; let y = Math[compFn.value === 'cos' ? 'cos' : 'sin'](inner)
      if (isNaN(y) || Math.abs(y) > 5) continue
      y = a * y + d; const [sx, sy] = toS(x, y)
      p.fill('#2d5a87', 100); p.circle(sx, sy, 3)
    }
  }
}

onMounted(() => updateDesc())
</script>

<style scoped>
.comp-controls { display:flex;flex-direction:column;gap:8px;padding:10px 16px;background:var(--card-bg);border:1px solid var(--border-lighter);border-radius:var(--radius-lg);margin-bottom:10px }
.control-row { display:flex;flex-wrap:wrap;align-items:center;gap:10px }
.param-item { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary) }
.param-item label { font-weight:600;min-width:16px }
.comp-info { padding:6px 14px;font-size:11px;color:var(--text-regular);background:var(--card-bg-warm);border-top:1px solid var(--border-lighter);line-height:1.8 }
.canvas-card { background:var(--card-bg);border-radius:var(--radius-lg);border:1px solid var(--border-lighter);box-shadow:0 2px 12px rgba(26,46,60,0.06);overflow:hidden;margin-bottom:14px }
</style>
