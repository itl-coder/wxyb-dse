<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 三角形四心</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <div class="tc-controls">
      <div class="tc-row">
        <div class="tc-legend">
          <span class="tc-legend-item"><span class="tc-dot" style="background:#ef4444"></span>重心G</span>
          <span class="tc-legend-item"><span class="tc-dot" style="background:#f59e0b"></span>外心O</span>
          <span class="tc-legend-item"><span class="tc-dot" style="background:#10b981"></span>内心I</span>
          <span class="tc-legend-item"><span class="tc-dot" style="background:#6366f1"></span>垂心H</span>
          <span class="tc-legend-item"><span class="tc-dot" style="background:#ec4899"></span>欧拉线</span>
        </div>
        <button class="tc-preset-btn" v-for="p in presets" :key="p.label" @click="applyPreset(p)">{{ p.label }}</button>
        <button class="tc-reset-btn" @click="randomTriangle">随机三角形</button>
      </div>
    </div>

    <div class="canvas-card">
      <P5Canvas ref="canvasRef" :sketch="sketchFn" />
      <div class="tc-info" v-html="infoHtml"></div>
    </div>

    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、重心 G (Centroid)" tag="★ 高频">
          <p>三条中线的交点。重心分中线为 2:1（顶点到重心:重心到对边中点=2:1）。</p>
          <FormulaBox>\\(G = \\left(\\frac{x_1+x_2+x_3}{3},\\frac{y_1+y_2+y_3}{3}\\right)\\)</FormulaBox>
        </ConceptBlock>
        <ConceptBlock title="二、外心 O (Circumcenter)">
          <p>三条中垂线的交点，到三顶点等距 = R（外接圆半径）。直角三角形外心在斜边中点。</p>
        </ConceptBlock>
        <ConceptBlock title="三、内心 I (Incenter)" tag="★ 高频">
          <p>三条角平分线的交点，到三边等距 = r。r = 面积/半周长。面积=½ab·sinC 或海伦公式。</p>
        </ConceptBlock>
        <ConceptBlock title="四、垂心 H (Orthocenter)">
          <p>三条高的交点。锐角三角形垂心在内部，钝角在外，直角三角形在直角顶点。</p>
        </ConceptBlock>
        <ConceptBlock title="五、欧拉线 (Euler Line)">
          <p>O、G、H 三点共线，OG:GH = 1:2。等边三角形的四心合一。</p>
        </ConceptBlock>
      </div>
      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>重心坐标除以2 — 重心=(A+B+C)/3，不是除以2</li>
            <li>内心与外心混淆 — 内心→到三边等距，外心→到三顶点等距</li>
            <li>垂心不在三角形内部 — 钝角三角形垂心在外部</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>重心公式必背：坐标取三顶点平均值</li>
            <li>内切圆半径 r = 面积/半周长，搭配海伦公式</li>
            <li>直角三角形：外心在斜边中点，内心 r=(a+b-c)/2</li>
            <li>欧拉线 OG:GH=1:2 是重要几何关系</li>
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
  '掌握重心 G 的坐标公式 (A+B+C)/3',
  '理解外心是外接圆圆心，到三顶点等距',
  '理解内心是内切圆圆心，到三边等距',
  '知道垂心是三条高的交点',
  '理解欧拉线：O/G/H共线且OG:GH=1:2',
  '能用海伦公式求面积→内切圆半径'
]

const infoHtml = ref('')
const vertices = ref([
  { x: -2, y: -1 }, { x: 3, y: -0.5 }, { x: 0, y: 3 }
])

const presets = [
  { label: '锐角三角形', pts: [{ x: -2, y: -1 }, { x: 3, y: -0.5 }, { x: 0, y: 3 }] },
  { label: '直角三角形', pts: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }] },
  { label: '钝角三角形', pts: [{ x: 1, y: 0 }, { x: 4, y: 0 }, { x: -1, y: 2 }] },
  { label: '等腰三角形', pts: [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 3.5 }] },
  { label: '等边三角形', pts: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1.732 }] }
]

function applyPreset(p) {
  vertices.value = p.pts.map(pt => ({ ...pt }))
  updateInfo()
}

function randomTriangle() {
  vertices.value = [
    { x: Math.random() * 5 - 2.5, y: Math.random() * 3 - 1.5 },
    { x: Math.random() * 5 - 2.5, y: Math.random() * 3 - 1.5 },
    { x: Math.random() * 5 - 2.5, y: Math.random() * 3 - 1.5 }
  ]
  updateInfo()
}

// --- Geometry helpers ---
function centroid(A, B, C) {
  return { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 }
}

function circumcenter(A, B, C) {
  const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y))
  if (Math.abs(d) < 0.0001) return null
  const ux = ((A.x * A.x + A.y * A.y) * (B.y - C.y) + (B.x * B.x + B.y * B.y) * (C.y - A.y) + (C.x * C.x + C.y * C.y) * (A.y - B.y)) / d
  const uy = ((A.x * A.x + A.y * A.y) * (C.x - B.x) + (B.x * B.x + B.y * B.y) * (A.x - C.x) + (C.x * C.x + C.y * C.y) * (B.x - A.x)) / d
  return { x: ux, y: uy }
}

function incenter(A, B, C) {
  const a = dist(B, C), b = dist(C, A), c2 = dist(A, B)
  const p = a + b + c2
  if (p < 0.0001) return null
  return { x: (a * A.x + b * B.x + c2 * C.x) / p, y: (a * A.y + b * B.y + c2 * C.y) / p }
}

function orthocenter(A, B, C) {
  const G = centroid(A, B, C)
  const O = circumcenter(A, B, C)
  if (!O) return G
  // Euler: OG:GH = 1:2, so H = G + 2*(G - O) = 3G - 2O
  return { x: 3 * G.x - 2 * O.x, y: 3 * G.y - 2 * O.y }
}

function dist(A, B) {
  return Math.sqrt((A.x - B.x) ** 2 + (A.y - B.y) ** 2)
}

function area(A, B, C) {
  return Math.abs(A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2
}

function inradius(A, B, C) {
  const a = area(A, B, C)
  const s = (dist(B, C) + dist(C, A) + dist(A, B)) / 2
  return s > 0 ? a / s : 0
}

function circumradius(A, B, C) {
  const a = dist(B, C), b = dist(C, A), c = dist(A, B)
  const area2 = area(A, B, C)
  return area2 > 0 ? (a * b * c) / (4 * area2) : 0
}

function midpoint(A, B) {
  return { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
}

function updateInfo() {
  const [A, B, C] = vertices.value
  const G = centroid(A, B, C)
  const O = circumcenter(A, B, C)
  const I = incenter(A, B, C)
  const H = orthocenter(A, B, C)
  const ir = inradius(A, B, C)
  const cr = circumradius(A, B, C)
  const triArea = area(A, B, C)

  let h = `<b>顶点</b>：A(${A.x.toFixed(2)},${A.y.toFixed(2)}) B(${B.x.toFixed(2)},${B.y.toFixed(2)}) C(${C.x.toFixed(2)},${C.y.toFixed(2)})<br>`
  h += `<b>重心 G</b> = (${G.x.toFixed(2)}, ${G.y.toFixed(2)})<br>`
  h += O ? `<b>外心 O</b> = (${O.x.toFixed(2)}, ${O.y.toFixed(2)}), R = ${cr.toFixed(2)}<br>` : ''
  h += `<b>内心 I</b> = (${I.x.toFixed(2)}, ${I.y.toFixed(2)}), r = ${ir.toFixed(2)}<br>`
  h += `<b>垂心 H</b> = (${H.x.toFixed(2)}, ${H.y.toFixed(2)})<br>`
  h += `<b>面积</b> = ${triArea.toFixed(2)}`
  infoHtml.value = h
}

const sketchFn = (p, container) => {
  let dragIdx = -1, dragOffX = 0, dragOffY = 0
  p.setup = () => {
    const sz = Math.min(container.clientWidth - 20, 580, 580)
    p.createCanvas(sz, sz)
    p.frameRate(30)
    p.textFont('sans-serif')
  }
  p.draw = () => {
    const sz = Math.min(container.clientWidth - 20, 580, 580)
    if (p.width !== sz) p.resizeCanvas(sz, sz)
    p.background('#f8f7fc')
    drawTC(p)
  }
  p.mousePressed = () => {
    const [A, B, C] = vertices.value
    const gs = (p.width - 80) / 10
    const ox = 40 + 5 * gs, oy = 40 + 5 * gs
    const toS = (x, y) => [ox + x * gs, oy - y * gs]
    const pts = [toS(A.x, A.y), toS(B.x, B.y), toS(C.x, C.y)]
    for (let i = 0; i < 3; i++) {
      if (Math.hypot(p.mouseX - pts[i][0], p.mouseY - pts[i][1]) < 18) {
        dragIdx = i
        dragOffX = pts[i][0] - p.mouseX
        dragOffY = pts[i][1] - p.mouseY
        return
      }
    }
    dragIdx = -1
  }
  p.mouseDragged = () => {
    if (dragIdx < 0) return
    const gs = (p.width - 80) / 10
    const ox = 40 + 5 * gs, oy = 40 + 5 * gs
    const mx = (p.mouseX + dragOffX - ox) / gs
    const my = (oy - (p.mouseY + dragOffY)) / gs
    vertices.value[dragIdx] = { x: Math.round(mx * 10) / 10, y: Math.round(my * 10) / 10 }
    updateInfo()
  }
  p.mouseReleased = () => { dragIdx = -1 }
}

function drawTC(p) {
  const W = p.width, pH = p.height, m = 40
  const gs = (W - 2 * m) / 10
  const ox = m + 5 * gs, oy = m + 5 * gs
  const toS = (x, y) => [ox + x * gs, oy - y * gs]

  const [A, B, C] = vertices.value
  const G = centroid(A, B, C)
  const O = circumcenter(A, B, C)
  const I = incenter(A, B, C)
  const H = orthocenter(A, B, C)
  const ir = inradius(A, B, C)
  const cr = circumradius(A, B, C)
  const [aX, aY] = toS(A.x, A.y), [bX, bY] = toS(B.x, B.y), [cX, cY] = toS(C.x, C.y)

  // Grid
  p.stroke(228, 230, 240); p.strokeWeight(0.5)
  for (let i = 0; i <= 10; i++) { p.line(m + i * gs, m, m + i * gs, pH - m); p.line(m, m + i * gs, W - m, m + i * gs) }

  // Axes
  p.stroke('#7c7c9e'); p.strokeWeight(1.2)
  p.line(ox, m, ox, pH - m); p.line(m, oy, W - m, oy)
  p.fill('#7c7c9e'); p.noStroke(); p.textSize(9)
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue
    p.textAlign(p.CENTER, p.TOP); p.text(i, ox + i * gs, oy + 4)
    p.textAlign(p.RIGHT, p.CENTER); p.text(i, ox - 5, oy - i * gs)
  }
  p.textAlign(p.RIGHT, p.TOP); p.text('O', ox - 4, oy + 4)

  // Triangle fill
  p.fill(99, 102, 241, 20); p.noStroke()
  p.triangle(aX, aY, bX, bY, cX, cY)

  // Circumcircle
  if (O && cr > 0 && cr < 12) {
    const [oX, oY] = toS(O.x, O.y)
    const rPx = cr * gs
    p.noFill(); p.stroke('#f59e0b'); p.strokeWeight(1); p.drawingContext.setLineDash([3, 3])
    p.circle(oX, oY, rPx * 2)
    p.drawingContext.setLineDash([])
    p.fill('#f59e0b'); p.noStroke(); p.circle(oX, oY, 5)
    p.textSize(9); p.textAlign(p.LEFT, p.BOTTOM); p.text('O', oX + 5, oY - 4)
  }

  // Incircle
  if (ir > 0 && ir < 10) {
    const [iX, iY] = toS(I.x, I.y)
    const irPx = ir * gs
    p.noFill(); p.stroke('#10b981'); p.strokeWeight(1); p.drawingContext.setLineDash([3, 3])
    p.circle(iX, iY, irPx * 2)
    p.drawingContext.setLineDash([])
    p.fill('#10b981'); p.noStroke(); p.circle(iX, iY, 5)
    p.textSize(9); p.textAlign(p.LEFT, p.TOP); p.text('I', iX + 5, iY + 4)
  }

  // Euler line
  if (O) {
    const [oX, oY] = toS(O.x, O.y)
    const [gX, gY] = toS(G.x, G.y)
    const [hX, hY] = toS(H.x, H.y)
    p.stroke('#ec4899'); p.strokeWeight(2); p.drawingContext.setLineDash([6, 3])
    p.line(oX, oY, hX, hY)
    p.drawingContext.setLineDash([])
  }

  // Medians (G)
  p.stroke('#ef4444'); p.strokeWeight(0.8); p.drawingContext.setLineDash([3, 2])
  const [mABx, mABy] = toS(midpoint(A, B).x, midpoint(A, B).y)
  const [mBCx, mBCy] = toS(midpoint(B, C).x, midpoint(B, C).y)
  const [mCAx, mCAy] = toS(midpoint(C, A).x, midpoint(C, A).y)
  p.line(aX, aY, mBCx, mBCy); p.line(bX, bY, mCAx, mCAy); p.line(cX, cY, mABx, mABy)
  p.drawingContext.setLineDash([])

  // Centers
  const [gX, gY] = toS(G.x, G.y)
  p.fill('#ef4444'); p.noStroke(); p.circle(gX, gY, 6)
  p.textSize(9); p.textAlign(p.LEFT, p.BOTTOM); p.text('G', gX + 6, gY - 4)

  if (O) {
    const [hX, hY] = toS(H.x, H.y)
    p.fill('#6366f1'); p.noStroke(); p.circle(hX, hY, 6)
    p.textSize(9); p.textAlign(p.LEFT, p.TOP); p.text('H', hX + 6, hY + 4)
  }

  // Triangle edges
  p.stroke('#1a1a2e'); p.strokeWeight(2.5)
  p.line(aX, aY, bX, bY); p.line(bX, bY, cX, cY); p.line(cX, cY, aX, aY)

  // Vertices
  p.fill('#4f46e5'); p.noStroke()
  p.circle(aX, aY, 8); p.circle(bX, bY, 8); p.circle(cX, cY, 8)
  p.fill('#fff'); p.textSize(10); p.textAlign(p.CENTER, p.CENTER)
  p.text('A', aX, aY + 1); p.text('B', bX, bY + 1); p.text('C', cX, cY + 1)
}

onMounted(() => updateInfo())
</script>

<style scoped>
.tc-controls { display:flex;padding:8px 14px;background:var(--card-bg);border:1px solid var(--border-lighter);border-radius:var(--radius-lg);margin-bottom:10px;box-shadow:var(--shadow-light) }
.tc-row { display:flex;flex-wrap:wrap;align-items:center;gap:8px }
.tc-legend { display:flex;gap:10px;margin-right:8px }
.tc-legend-item { display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text-secondary) }
.tc-dot { width:8px;height:8px;border-radius:50%;display:inline-block }
.tc-preset-btn { padding:4px 9px;border:1px solid var(--border-light);border-radius:4px;background:var(--card-bg);color:var(--text-secondary);font-size:10px;font-family:inherit;cursor:pointer;transition:all 0.2s }
.tc-preset-btn:hover { border-color:var(--accent);color:var(--accent) }
.tc-reset-btn { padding:4px 10px;border:1px solid var(--accent);border-radius:4px;background:var(--accent);color:#fff;font-size:10px;font-family:inherit;cursor:pointer;transition:all 0.2s;margin-left:auto }
.tc-reset-btn:hover { background:var(--accent-d) }
.tc-info { padding:6px 14px;font-size:11px;color:var(--text-regular);background:var(--card-bg-warm);border-top:1px solid var(--border-lighter);line-height:1.8 }
.canvas-card { background:var(--card-bg);border-radius:var(--radius-lg);border:1px solid var(--border-lighter);box-shadow:var(--shadow);overflow:hidden;margin-bottom:14px }
</style>
