<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 轨迹方程</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <div class="lc-controls">
      <div class="lc-row">
        <div class="lc-type-btns">
          <button v-for="t in locusTypes" :key="t.key" class="lc-type-btn" :class="{ active: locusType === t.key }" @click="locusType = t.key">{{ t.label }}</button>
        </div>
        <select v-model="presetKey" class="lc-select" @change="onPreset($event.target.value)">
          <option value="">预设示例</option>
          <option v-for="p in curPresets" :key="p.key" :value="p.key">{{ p.label }}</option>
        </select>
      </div>
      <div class="lc-row">
        <template v-if="locusType === 'parabola'">
          <span class="lc-param"><label>焦点</label><input type="range" :value="pFocus" :min="-4" :max="4" :step="0.1" class="lc-range" @input="setParam('pFocus', +$event.target.value)" /><span class="lc-val">{{ pFocus.toFixed(1) }}</span></span>
          <span class="lc-param"><label>准线</label><input type="range" :value="pDirectrix" :min="-4" :max="4" :step="0.1" class="lc-range" @input="setParam('pDirectrix', +$event.target.value)" /><span class="lc-val">{{ pDirectrix.toFixed(1) }}</span></span>
        </template>
        <template v-else-if="locusType === 'hyperbola'">
          <span class="lc-param"><label>F1 x</label><input type="range" :value="hF1x" :min="-5" :max="0" :step="0.1" class="lc-range" @input="setParam('hF1x', +$event.target.value)" /><span class="lc-val">{{ hF1x.toFixed(1) }}</span></span>
          <span class="lc-param"><label>F2 x</label><input type="range" :value="hF2x" :min="0" :max="5" :step="0.1" class="lc-range" @input="setParam('hF2x', +$event.target.value)" /><span class="lc-val">{{ hF2x.toFixed(1) }}</span></span>
          <span class="lc-param"><label>a</label><input type="range" :value="ha" :min="0.3" :max="4" :step="0.1" class="lc-range" @input="setParam('ha', +$event.target.value)" /><span class="lc-val">{{ ha.toFixed(1) }}</span></span>
        </template>
        <template v-else>
          <span class="lc-param"><label>F1 x</label><input type="range" :value="eF1x" :min="-5" :max="0" :step="0.1" class="lc-range" @input="setParam('eF1x', +$event.target.value)" /><span class="lc-val">{{ eF1x.toFixed(1) }}</span></span>
          <span class="lc-param"><label>F2 x</label><input type="range" :value="eF2x" :min="0" :max="5" :step="0.1" class="lc-range" @input="setParam('eF2x', +$event.target.value)" /><span class="lc-val">{{ eF2x.toFixed(1) }}</span></span>
          <span class="lc-param"><label>a</label><input type="range" :value="ea" :min="1" :max="5" :step="0.1" class="lc-range" @input="setParam('ea', +$event.target.value)" /><span class="lc-val">{{ ea.toFixed(1) }}</span></span>
        </template>
      </div>
    </div>

    <div class="canvas-card">
      <P5Canvas ref="canvasRef" :sketch="sketchFn" />
      <div class="lc-info" v-html="infoHtml"></div>
    </div>

    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、椭圆" tag="★ 高频">
          <p>\\(PF_1+PF_2 = 2a\\) (\\(2a > F_1F_2\\))。标准方程：\\(\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1\\)。\\(a^2=b^2+c^2\\)，离心率 \\(e = c/a\\) (0&lt;e&lt;1)。</p>
        </ConceptBlock>
        <ConceptBlock title="二、双曲线" tag="★ 高频">
          <p>\\(|PF_1-PF_2| = 2a\\) (\\(2a < F_1F_2\\))。标准方程：\\(\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1\\)。\\(c^2=a^2+b^2\\)。渐近线：\\(y = \\pm(b/a)x\\)。</p>
        </ConceptBlock>
        <ConceptBlock title="三、抛物线">
          <p>\\(PF = d(P, 准线)\\)。标准方程：\\(x^2=4py\\) 或 \\(y^2=4px\\)。</p>
        </ConceptBlock>
        <ConceptBlock title="四、阿波罗尼奥斯圆">
          <p>\\(PA:PB = k\\) (k&gt;0, k&ne;1)，轨迹为圆。k=1 时为 AB 中垂线。</p>
        </ConceptBlock>
      </div>
      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>阿波罗尼奥斯圆 k=1：轨迹是直线（中垂线），不是圆</li>
            <li>双曲线定义忘记绝对值：没绝对值只表示一支</li>
            <li>椭圆 \\(a^2=b^2+c^2\\)，双曲线 \\(c^2=a^2+b^2\\)，不要记混</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>定义法验证：遇到轨迹题先用定义判断类型</li>
            <li>椭圆/双曲线看 \\(a,c\\) 关系区分</li>
            <li>记住标准方程形式快速匹配</li>
            <li>离心率 e 的范围区分曲线类型</li>
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
  '理解椭圆定义 \\(PF_1+PF_2=2a\\) 及标准方程',
  '理解双曲线定义 \\(|PF_1-PF_2|=2a\\) 及渐近线',
  '理解抛物线定义 \\(PF=d(P,准线)\\) 及标准方程',
  '能区分椭圆、双曲线、抛物线的标准方程形式',
  '理解阿波罗尼奥斯圆的定义及 k=1 特殊情况'
]

const locusType = ref('ellipse')
const presetKey = ref('')
const infoHtml = ref('')

const locusTypes = [
  { key: 'ellipse', label: '椭圆' },
  { key: 'hyperbola', label: '双曲线' },
  { key: 'parabola', label: '抛物线' }
]

// Shared reactive state
const eF1x = ref(-2), eF1y = ref(0), eF2x = ref(2), eF2y = ref(0), ea = ref(3)
const hF1x = ref(-3), hF1y = ref(0), hF2x = ref(3), hF2y = ref(0), ha = ref(2)
const pFocus = ref(0), pDirectrix = ref(-2)

const ellipsePresets = [
  { key: 'e1', label: '横椭圆 a=3,c=2', eF1x: -2, eF1y: 0, eF2x: 2, eF2y: 0, ea: 3 },
  { key: 'e2', label: '纵椭圆 a=2.5,c=1.5', eF1x: 0, eF1y: -1.5, eF2x: 0, eF2y: 1.5, ea: 2.5 },
  { key: 'e3', label: '大椭圆 a=4,c=2.5', eF1x: -2.5, eF1y: 0, eF2x: 2.5, eF2y: 0, ea: 4 }
]
const hyperbolaPresets = [
  { key: 'h1', label: '横双曲线 a=2,c=3', hF1x: -3, hF1y: 0, hF2x: 3, hF2y: 0, ha: 2 },
  { key: 'h2', label: '纵双曲线 a=1.5,c=2.5', hF1x: 0, hF1y: -2.5, hF2x: 0, hF2y: 2.5, ha: 1.5 }
]
const parabolaPresets = [
  { key: 'p1', label: 'y²=8x', pFocus: 2, pDirectrix: -2 },
  { key: 'p2', label: 'x²=4y', pFocus: 1, pDirectrix: -1 }
]

const curPresets = computed(() => {
  if (locusType.value === 'ellipse') return ellipsePresets
  if (locusType.value === 'hyperbola') return hyperbolaPresets
  return parabolaPresets
})

function setParam(key, val) {
  switch (key) {
    case 'pFocus': pFocus.value = val; break
    case 'pDirectrix': pDirectrix.value = val; break
    case 'hF1x': hF1x.value = val; break
    case 'hF2x': hF2x.value = val; break
    case 'ha': ha.value = val; break
    case 'eF1x': eF1x.value = val; break
    case 'eF2x': eF2x.value = val; break
    case 'ea': ea.value = val; break
  }
}

const curParams = computed(() => {
  if (locusType.value === 'parabola') {
    return [
      { key: 'pFocus', label: '焦点', min: -4, max: 4, step: 0.1 },
      { key: 'pDirectrix', label: '准线', min: -4, max: 4, step: 0.1 }
    ]
  }
  if (locusType.value === 'hyperbola') {
    return [
      { key: 'hF1x', label: 'F1 x', min: -5, max: 0, step: 0.1 },
      { key: 'hF2x', label: 'F2 x', min: 0, max: 5, step: 0.1 },
      { key: 'ha', label: 'a', min: 0.3, max: 4, step: 0.1 }
    ]
  }
  return [
    { key: 'eF1x', label: 'F1 x', min: -5, max: 0, step: 0.1 },
    { key: 'eF2x', label: 'F2 x', min: 0, max: 5, step: 0.1 },
    { key: 'ea', label: 'a', min: 1, max: 5, step: 0.1 }
  ]
})

function onPreset(key) {
  if (!key) return
  const all = [...ellipsePresets, ...hyperbolaPresets, ...parabolaPresets]
  const p = all.find(x => x.key === key)
  if (!p) return
  if (p.eF1x !== undefined) { eF1x.value = p.eF1x; eF1y.value = p.eF1y; eF2x.value = p.eF2x; eF2y.value = p.eF2y; ea.value = p.ea; locusType.value = 'ellipse' }
  else if (p.hF1x !== undefined) { hF1x.value = p.hF1x; hF1y.value = p.hF1y; hF2x.value = p.hF2x; hF2y.value = p.hF2y; ha.value = p.ha; locusType.value = 'hyperbola' }
  else { pFocus.value = p.pFocus; pDirectrix.value = p.pDirectrix; locusType.value = 'parabola' }
  updateInfo()
}

function updateInfo() {
  if (locusType.value === 'ellipse') {
    const c = (eF2x.value - eF1x.value) / 2
    const b = Math.sqrt(Math.max(0, ea.value * ea.value - c * c))
    infoHtml.value = `<b>椭圆</b>：\\(\\frac{x^2}{${ea.value.toFixed(1)}^2}+\\frac{y^2}{${b.toFixed(1)}^2}=1\\)<br>a=${ea.value.toFixed(1)}, c=${c.toFixed(1)}, b=${b.toFixed(1)}<br>离心率 e=c/a=${(c/ea.value).toFixed(2)}`
  } else if (locusType.value === 'hyperbola') {
    const c2 = (hF2x.value - hF1x.value) / 2
    const b2 = Math.sqrt(Math.max(0, c2 * c2 - ha.value * ha.value))
    infoHtml.value = `<b>双曲线</b>：\\(\\frac{x^2}{${ha.value.toFixed(1)}^2}-\\frac{y^2}{${b2.toFixed(1)}^2}=1\\)<br>a=${ha.value.toFixed(1)}, c=${c2.toFixed(1)}, b=${b2.toFixed(1)}<br>渐近线 y=±${(b2/ha.value).toFixed(2)}x`
  } else {
    infoHtml.value = `<b>抛物线</b>：焦点(${pFocus.value.toFixed(1)},0), 准线 x=${pDirectrix.value.toFixed(1)}<br>方程：y²=${(-4*pDirectrix.value).toFixed(1)}x`
  }
}

function drawBezierEllipse(p, cx, cy, a, b) {
  const k = 0.5522847498
  p.beginShape()
  p.vertex(cx + a, cy)
  p.bezierVertex(cx + a, cy - k * b, cx + k * a, cy - b, cx, cy - b)
  p.bezierVertex(cx - k * a, cy - b, cx - a, cy - k * b, cx - a, cy)
  p.bezierVertex(cx - a, cy + k * b, cx - k * a, cy + b, cx, cy + b)
  p.bezierVertex(cx + k * a, cy + b, cx + a, cy + k * b, cx + a, cy)
  p.endShape()
}

const sketchFn = (p, container) => {
  p.setup = () => {
    const sz = Math.min(container.clientWidth - 20, 600, 600)
    p.createCanvas(sz, sz)
    p.frameRate(30)
    p.textFont('sans-serif')
  }
  p.draw = () => {
    const sz = Math.min(container.clientWidth - 20, 600, 600)
    if (p.width !== sz) p.resizeCanvas(sz, sz)
    p.background('#f8f7fc')
    drawLocus(p)
  }
}

function drawLocus(p) {
  const W = p.width, H = p.height, m = 40
  const gs = (W - 2 * m) / 10
  const ox = m + 5 * gs, oy = m + 5 * gs
  const toS = (x, y) => [ox + x * gs, oy - y * gs]

  // Grid
  p.stroke(228, 230, 240); p.strokeWeight(0.5)
  for (let i = 0; i <= 10; i++) { p.line(m + i * gs, m, m + i * gs, H - m); p.line(m, m + i * gs, W - m, m + i * gs) }

  // Axes
  p.stroke('#7c7c9e'); p.strokeWeight(1.2)
  p.line(ox, m, ox, H - m); p.line(m, oy, W - m, oy)
  p.fill('#7c7c9e'); p.noStroke(); p.textSize(9)
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue
    p.textAlign(p.CENTER, p.TOP); p.text(i, ox + i * gs, oy + 4)
    p.textAlign(p.RIGHT, p.CENTER); p.text(i, ox - 5, oy - i * gs)
  }
  p.textAlign(p.RIGHT, p.TOP); p.text('O', ox - 4, oy + 4)

  if (locusType.value === 'parabola') {
    // Directrix
    const [dx] = toS(pDirectrix.value, -5), [dx2] = toS(pDirectrix.value, 5)
    p.stroke('#ef4444'); p.strokeWeight(1.5); p.drawingContext.setLineDash([5, 3])
    p.line(dx, m, dx2, H - m)
    p.drawingContext.setLineDash([])
    p.fill('#ef4444'); p.textSize(9); p.textAlign(p.LEFT, p.TOP); p.text('准线', dx + 4, m + 4)

    // Focus
    const [fx, fy] = toS(pFocus.value, 0)
    p.fill('#4f46e5'); p.noStroke(); p.circle(fx, fy, 6)
    p.textSize(10); p.textAlign(p.LEFT, p.BOTTOM); p.text(`F(${pFocus.value.toFixed(1)},0)`, fx + 6, fy - 4)

    // Parabola y²=4px where p = focus - directrix/2... actually for focus at (f,0) and directrix x=d:
    // y² = 2(f-d)x - (f²-d²)... simpler: parabola with focus (p,0) directrix x=-p => y²=4px
    const p0 = -pDirectrix.value
    p.noFill(); p.stroke('#6366f1'); p.strokeWeight(2)
    p.beginShape()
    for (let y = -5; y <= 5; y += 0.05) {
      const x = y * y / (4 * p0)
      if (Math.abs(x) > 6) continue
      const [sx, sy] = toS(x, y)
      p.vertex(sx, sy)
    }
    p.endShape()

  } else if (locusType.value === 'hyperbola') {
    const cx = (hF1x.value + hF2x.value) / 2, cy = (hF1y.value + hF2y.value) / 2
    const c = (hF2x.value - hF1x.value) / 2
    const a = ha.value
    const b = Math.sqrt(Math.max(0, c * c - a * a))

    // Foci
    const [f1x, f1y] = toS(hF1x.value, hF1y.value)
    const [f2x, f2y] = toS(hF2x.value, hF2y.value)
    p.fill('#ef4444'); p.noStroke(); p.circle(f1x, f1y, 6); p.circle(f2x, f2y, 6)
    p.textSize(9); p.textAlign(p.LEFT, p.BOTTOM); p.text('F1', f1x + 6, f1y - 4)
    p.text('F2', f2x + 6, f2y - 4)

    // Hyperbola x²/a² - y²/b² = 1
    const [cxS, cyS] = toS(cx, cy)
    p.noFill(); p.stroke('#6366f1'); p.strokeWeight(2)
    // Right branch
    p.beginShape()
    for (let x = a; x <= 6 + cx; x += 0.05) {
      const xl = x - cx
      const y = b * Math.sqrt(xl * xl / (a * a) - 1)
      if (isNaN(y)) continue
      const [sx, sy] = toS(x, cy + y)
      if (sx >= m && sx <= W - m && sy >= m && sy <= H - m) p.vertex(sx, sy)
    }
    p.endShape()
    p.beginShape()
    for (let x = a; x <= 6 + cx; x += 0.05) {
      const xl = x - cx
      const y = b * Math.sqrt(xl * xl / (a * a) - 1)
      if (isNaN(y)) continue
      const [sx, sy] = toS(x, cy - y)
      if (sx >= m && sx <= W - m && sy >= m && sy <= H - m) p.vertex(sx, sy)
    }
    p.endShape()
    // Left branch
    p.beginShape()
    for (let x = cx - a; x >= -6; x -= 0.05) {
      const xl = x - cx
      const y = b * Math.sqrt(xl * xl / (a * a) - 1)
      if (isNaN(y)) continue
      const [sx, sy] = toS(x, cy + y)
      if (sx >= m && sx <= W - m && sy >= m && sy <= H - m) p.vertex(sx, sy)
    }
    p.endShape()
    p.beginShape()
    for (let x = cx - a; x >= -6; x -= 0.05) {
      const xl = x - cx
      const y = b * Math.sqrt(xl * xl / (a * a) - 1)
      if (isNaN(y)) continue
      const [sx, sy] = toS(x, cy - y)
      if (sx >= m && sx <= W - m && sy >= m && sy <= H - m) p.vertex(sx, sy)
    }
    p.endShape()

    // Asymptotes
    p.stroke('#f59e0b'); p.strokeWeight(1); p.drawingContext.setLineDash([4, 3])
    const [as1x, as1y] = toS(cx + 6, cy + 6 * b / a)
    const [as2x, as2y] = toS(cx - 6, cy - 6 * b / a)
    p.line(as1x, as1y, as2x, as2y)
    const [as3x, as3y] = toS(cx + 6, cy - 6 * b / a)
    const [as4x, as4y] = toS(cx - 6, cy + 6 * b / a)
    p.line(as3x, as3y, as4x, as4y)
    p.drawingContext.setLineDash([])

  } else {
    // Ellipse
    const cx = (eF1x.value + eF2x.value) / 2, cy = (eF1y.value + eF2y.value) / 2
    const c = (eF2x.value - eF1x.value) / 2
    const a = ea.value
    const b = Math.sqrt(Math.max(0, a * a - c * c))

    // Foci
    const [f1x, f1y] = toS(eF1x.value, eF1y.value)
    const [f2x, f2y] = toS(eF2x.value, eF2y.value)
    p.fill('#ef4444'); p.noStroke(); p.circle(f1x, f1y, 6); p.circle(f2x, f2y, 6)
    p.textSize(9); p.textAlign(p.LEFT, p.BOTTOM); p.text('F1', f1x + 6, f1y - 4)
    p.text('F2', f2x + 6, f2y - 4)

    // Ellipse using Bezier approximation
    const [cxS, cyS] = toS(cx, cy)
    const aPx = a * gs, bPx = b * gs
    p.noFill(); p.stroke('#6366f1'); p.strokeWeight(2.5)
    pushEllipse(p, cxS, cyS, aPx, bPx)
  }
}

function pushEllipse(p, cx, cy, a, b) {
  const k = 0.5522847498
  p.beginShape()
  p.vertex(cx + a, cy)
  p.bezierVertex(cx + a, cy - k * b, cx + k * a, cy - b, cx, cy - b)
  p.bezierVertex(cx - k * a, cy - b, cx - a, cy - k * b, cx - a, cy)
  p.bezierVertex(cx - a, cy + k * b, cx - k * a, cy + b, cx, cy + b)
  p.bezierVertex(cx + k * a, cy + b, cx + a, cy + k * b, cx + a, cy)
  p.endShape()
}

onMounted(() => updateInfo())
</script>

<style scoped>
.lc-controls { display:flex;flex-direction:column;gap:6px;padding:10px 14px;background:var(--card-bg);border:1px solid var(--border-lighter);border-radius:var(--radius-lg);margin-bottom:10px;box-shadow:var(--shadow-light) }
.lc-row { display:flex;flex-wrap:wrap;align-items:center;gap:8px }
.lc-type-btns { display:flex;gap:0;border-radius:6px;overflow:hidden;border:1px solid var(--border-light) }
.lc-type-btn { padding:5px 14px;border:none;background:transparent;color:var(--text-secondary);font-size:12px;font-family:inherit;cursor:pointer;transition:all 0.2s }
.lc-type-btn.active { background:var(--accent);color:#fff }
.lc-type-btn:hover:not(.active) { background:var(--bg-warm) }
.lc-select { padding:4px 8px;border:1px solid var(--border-light);border-radius:6px;font-size:11px;font-family:inherit;color:var(--text-primary);background:var(--card-bg);outline:none }
.lc-param { display:flex;align-items:center;gap:3px;font-size:11px;color:var(--text-secondary) }
.lc-param label { font-weight:600;min-width:28px;font-size:10px }
.lc-range { width:65px;accent-color:var(--accent);height:4px }
.lc-val { font-size:10px;color:var(--text-muted);min-width:22px;font-family:var(--font-mono) }
.lc-info { padding:6px 14px;font-size:11px;color:var(--text-regular);background:var(--card-bg-warm);border-top:1px solid var(--border-lighter);line-height:1.8 }
.canvas-card { background:var(--card-bg);border-radius:var(--radius-lg);border:1px solid var(--border-lighter);box-shadow:var(--shadow);overflow:hidden;margin-bottom:14px }
</style>
