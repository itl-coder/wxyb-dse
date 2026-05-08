<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 三角函数</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <!-- 控制面板 -->
    <div class="trig-controls">
      <div class="control-row">
        <el-radio-group v-model="trigFn" size="small" @change="updateDisplay">
          <el-radio-button value="sin">sin</el-radio-button>
          <el-radio-button value="cos">cos</el-radio-button>
        </el-radio-group>
        <el-checkbox v-model="showUnit" size="small">单位圆</el-checkbox>
        <el-checkbox v-model="showAnim" size="small">动画</el-checkbox>
        <el-checkbox v-model="showGuide" size="small">辅助线</el-checkbox>
        <el-select v-model="trigProblem" size="small" placeholder="DSE例题" clearable style="width:180px" @change="onProblem">
          <el-option v-for="p in dseProblems" :key="p.key" :label="p.label" :value="p.key" />
        </el-select>
      </div>
      <div class="param-row">
        <span v-for="p in params" :key="p.key" class="param-item">
          <label>{{ p.label }}</label>
          <el-slider v-model="p.value" :min="p.min" :max="p.max" :step="p.step" style="width:100px" @input="updateDisplay" show-input size="small" />
        </span>
      </div>
    </div>

    <!-- Canvas -->
    <div class="canvas-card">
      <P5Canvas ref="canvasRef" :sketch="sketchFn" />
      <div class="trig-info" v-html="infoHtml"></div>
    </div>

    <!-- 教学概念 -->
    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、标准形式 y = a·sin(bx + c) + d" tag="★ 高频">
          <FormulaBox>振幅 A = |a| 周期 T = 2π/|b| 相移 = -c/b 纵移 = d<br>最大值 = d + |a| 最小值 = d - |a| 值域 [d-|a|, d+|a|]</FormulaBox>
          <p><b>五点法作图</b>：取五点——起始点、峰点、中点、谷点、终点，每个点间隔 T/4。适用于 sin 和 cos 的作图题。</p>
          <ExampleBox><b>示例</b>：y = 3cos(2x-π/3)+1，振幅=3，周期=π，相移=π/6(右)，最大值=4，最小值=-2</ExampleBox>
        </ConceptBlock>
        <ConceptBlock title="二、基本恒等式">
          <FormulaBox>sin²θ + cos²θ = 1<br>tanθ = sinθ/cosθ<br>sin(A±B) = sinAcosB ± cosAsinB<br>cos(A±B) = cosAcosB ∓ sinAsinB<br>二倍角：sin2θ = 2sinθcosθ，cos2θ = cos²θ - sin²θ</FormulaBox>
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
            <li>混淆周期公式 — 周期只与 |b| 有关</li>
            <li>相移符号搞反 — y=sin(2x+π/3) 向左移 π/6</li>
            <li>忽视值域范围 — 振幅是 |a| 不是 a</li>
            <li>sin/cos 混淆 — cos 图像从 (0,1) 开始</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>五点法快速定位关键点</li>
            <li>先确定周期再确定相移</li>
            <li>单位圆 → 函数图像联动理解</li>
            <li>特殊角三角函数值需熟练记忆</li>
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
  '掌握正弦、余弦函数的图像特征（振幅、周期、相移、纵移）',
  '理解单位圆与三角函数图像的对应关系',
  '熟练运用五点法绘制三角函数图像',
  '掌握三角函数图像的平移、伸缩变换',
  '能解 DSE 常见三角函数方程与不等式'
]

const trigFn = ref('sin')
const showUnit = ref(true)
const showAnim = ref(true)
const showGuide = ref(false)
const trigProblem = ref('')
const infoHtml = ref('')
let animTheta = 0

const params = reactive([
  { key: 'a', label: 'a 振幅', value: 1, min: -4, max: 4, step: 0.1 },
  { key: 'b', label: 'b 频率', value: 1, min: 0.2, max: 4, step: 0.1 },
  { key: 'c', label: 'c 相移', value: 0, min: -Math.PI, max: Math.PI, step: 0.05 },
  { key: 'd', label: 'd 纵移', value: 0, min: -3, max: 3, step: 0.1 }
])

const dseProblems = [
  { key: 'maxmin', label: '求最大/最小值' },
  { key: 'period', label: '求周期和相移' },
  { key: 'amplitude', label: '求振幅和值域' },
  { key: 'transform', label: '图像变换步骤' }
]

function getParams() {
  return { a: params[0].value, b: params[1].value, c: params[2].value, d: params[3].value }
}

function updateDisplay() {
  const { a, b, c, d } = getParams()
  const A = Math.abs(a), T = 2 * Math.PI / Math.abs(b), ps = -c / b
  const func = trigFn.value === 'sin' ? Math.sin : Math.cos
  let h = `<b>函数</b>：\\(y=${a.toFixed(2)}\\cdot\\${trigFn.value}(${b.toFixed(2)}x`
  h += c >= 0 ? `+${c.toFixed(2)}` : `${c.toFixed(2)}`
  h += `)${d >= 0 ? '+' : ''}${d.toFixed(2)}\\)<br>`
  h += `<b>振幅</b> A=|a|=${A.toFixed(2)} &nbsp; <b>周期</b> T=2π/|b|=${T.toFixed(2)}<br>`
  h += `<b>相移</b> =${ps.toFixed(2)} &nbsp; <b>纵移</b> d=${d.toFixed(2)}<br>`
  h += `<b>值域</b> [${(d-A).toFixed(2)}, ${(d+A).toFixed(2)}]<br>`
  h += '<b>五点法</b>：'
  for (let i = 0; i < 5; i++) {
    const x = ps + i * T / 4
    h += `P${i}(${x.toFixed(2)}, ${(a*func(b*x+c)+d).toFixed(2)}) `
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
  params[0].value = s.a; params[1].value = s.b; params[2].value = s.c; params[3].value = s.d
  trigFn.value = s.fn
  updateDisplay()
}

const sketchFn = (p, container) => {
  p.setup = () => {
    const sz = Math.min(container.clientWidth - 20, 720, 720)
    p.createCanvas(sz, sz)
    p.frameRate(30)
    p.textFont('sans-serif')
  }
  p.draw = () => {
    const sz = Math.min(container.clientWidth - 20, 720, 720)
    if (p.width !== sz) p.resizeCanvas(sz, sz)
    p.background('#fafbfc')
    drawTrig(p)
  }
}

function drawTrig(p) {
  const { a, b, c, d } = getParams()
  const W = p.width, H = p.height
  const hasUC = showUnit.value
  const graphW = hasUC ? W * 0.72 : W - 20
  const m = 45
  const gsX = graphW / (5 * Math.PI)
  const gsY = (H - 2 * m) / 7
  const ox = m + graphW / 2, oy = m + 3.5 * gsY
  const toS = (x, y) => [ox + x * gsX, oy - y * gsY]
  const func = trigFn.value === 'sin' ? Math.sin : Math.cos

  // 网格
  p.stroke(220, 225, 235); p.strokeWeight(0.5)
  for (let x = m; x <= m + graphW; x += gsX * Math.PI / 2) p.line(x, m, x, H - m - 10)
  for (let y = m; y <= H - m - 10; y += gsY) p.line(m + 10, y, m + graphW, y)

  // 坐标轴
  p.stroke('#94a3b8'); p.strokeWeight(1.5)
  p.line(m, oy, m + graphW, oy); p.line(ox, m, ox, H - m - 10)

  // 轴标签
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

  // 辅助线
  if (showGuide.value) {
    const A = Math.abs(a)
    p.stroke(200, 80, 80, 40); p.strokeWeight(0.5); p.drawingContext.setLineDash([3, 3])
    const [, ey1] = toS(0, d + A); const [, ey3] = toS(0, d - A)
    p.line(ox, ey1, ox + 2 * Math.PI * gsX, ey1)
    p.line(ox, ey3, ox + 2 * Math.PI * gsX, ey3)
    p.drawingContext.setLineDash([])
    const T = 2 * Math.PI / Math.abs(b)
    const [tx1, ty1] = toS(0, d); const [tx2] = toS(T, d)
    p.stroke(80, 80, 200, 60); p.strokeWeight(1); p.drawingContext.setLineDash([4, 2])
    p.line(tx1, ty1, tx2, ty1); p.drawingContext.setLineDash([])
    p.fill(80, 80, 200); p.textSize(7); p.textAlign(p.CENTER, p.BOTTOM)
    p.text(`T=${T.toFixed(2)}`, (tx1+tx2)/2, ty1-3)
  }

  // 主函数曲线
  p.noFill(); p.stroke('#1a4a7a'); p.strokeWeight(2.5)
  p.beginShape()
  for (let x = -2 * Math.PI; x <= 2 * Math.PI; x += 0.02) {
    const y = a * func(b * x + c) + d
    if (isNaN(y) || Math.abs(y) > 6) continue
    const [sx, sy] = toS(x, y); p.vertex(sx, sy)
  }
  p.endShape()

  // 动点动画
  if (showAnim.value) {
    animTheta += 0.02
    const yVal = a * func(b * animTheta + c) + d
    if (!isNaN(yVal) && Math.abs(yVal) < 6) {
      const [px, py] = toS(animTheta, yVal)
      p.fill('#c0392b'); p.noStroke(); p.circle(px, py, 7)
      p.textSize(8); p.textAlign(p.LEFT, p.BOTTOM); p.text(`y=${yVal.toFixed(2)}`, px + 6, py + 10)
    }
  }

  // 五点法
  const T2 = 2 * Math.PI / Math.abs(b), ps2 = -c / b
  p.fill(45, 90, 135, 120); p.noStroke()
  for (let i = 0; i < 5; i++) {
    const x = ps2 + i * T2 / 4, y = a * func(b * x + c) + d
    if (!isNaN(y) && Math.abs(y) < 6) { const [sx, sy] = toS(x, y); if (sx > m && sx < m + graphW) p.circle(sx, sy, 4) }
  }

  // 单位圆
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
  const dir = ratio >= 0 ? '' : '-'
  if (Math.abs(Math.abs(ratio) - n) < 0.001) {
    if (n === 0) return '0'; if (n === 1) return dir + 'π'; if (n === 2) return dir + '2π'; return dir + n + 'π'
  }
  return x.toFixed(2)
}

onMounted(() => updateDisplay())
</script>

<style scoped>
.trig-controls { display:flex;flex-direction:column;gap:8px;padding:10px 16px;background:var(--card-bg);border:1px solid var(--border-lighter);border-radius:var(--radius-lg);margin-bottom:10px }
.control-row { display:flex;flex-wrap:wrap;align-items:center;gap:12px }
.param-row { display:flex;flex-wrap:wrap;gap:8px 16px }
.param-item { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary) }
.param-item label { font-weight:600;min-width:40px }
.trig-info { padding:6px 14px;font-size:11px;color:var(--text-regular);background:var(--card-bg-warm);border-top:1px solid var(--border-lighter);line-height:1.8 }
.canvas-card { background:var(--card-bg);border-radius:var(--radius-lg);border:1px solid var(--border-lighter);box-shadow:0 2px 12px rgba(26,46,60,0.06);overflow:hidden;margin-bottom:14px }
</style>
