<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 圆与直线</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <!-- 交互画布 -->
    <div class="cl-controls">
      <div class="cl-row">
        <span class="cl-param">
          <label>圆心 X</label>
          <input type="range" v-model.number="ch" :min="-4" :max="4" :step="0.1" class="cl-range" />
          <span class="cl-val">{{ ch.toFixed(1) }}</span>
        </span>
        <span class="cl-param">
          <label>圆心 Y</label>
          <input type="range" v-model.number="ck" :min="-4" :max="4" :step="0.1" class="cl-range" />
          <span class="cl-val">{{ ck.toFixed(1) }}</span>
        </span>
        <span class="cl-param">
          <label>半径 r</label>
          <input type="range" v-model.number="cr" :min="0.3" :max="5" :step="0.1" class="cl-range" />
          <span class="cl-val">{{ cr.toFixed(1) }}</span>
        </span>
      </div>
      <div class="cl-row">
        <span class="cl-param">
          <label>直线 A</label>
          <input type="range" v-model.number="la" :min="-3" :max="3" :step="0.1" class="cl-range" />
          <span class="cl-val">{{ la.toFixed(1) }}</span>
        </span>
        <span class="cl-param">
          <label>B</label>
          <input type="range" v-model.number="lb" :min="-3" :max="3" :step="0.1" class="cl-range" />
          <span class="cl-val">{{ lb.toFixed(1) }}</span>
        </span>
        <span class="cl-param">
          <label>C</label>
          <input type="range" v-model.number="lc" :min="-8" :max="8" :step="0.1" class="cl-range" />
          <span class="cl-val">{{ lc.toFixed(1) }}</span>
        </span>
        <button class="cl-preset-btn" v-for="p in presets" :key="p.label" @click="applyPreset(p)">{{ p.label }}</button>
      </div>
    </div>

    <div class="canvas-card">
      <P5Canvas ref="canvasRef" :sketch="sketchFn" />
      <div class="cl-info" v-html="infoHtml"></div>
    </div>

    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、圆的方程" tag="★ 高频">
          <FormulaBox>
            \text{标准方程：} (x - a)^2 + (y - b)^2 = r^2 \\
            \text{圆心：} (a, b) \\
            \text{半径：} r
          </FormulaBox>
          <FormulaBox>
            \text{一般式：} x^2 + y^2 + Dx + Ey + F = 0 \\
            \text{一般式圆心：} \left( -\frac{D}{2}, -\frac{E}{2} \right) \\
            \text{一般式半径：} \frac{1}{2}\sqrt{D^2 + E^2 - 4F}
          </FormulaBox>
        </ConceptBlock>
        <ConceptBlock title="二、直线与圆的位置关系" tag="★ 高频">
          <FormulaBox>
            d = \frac{|Ah+Bk+C|}{\sqrt{A^2+B^2}} \\
            d < r \text{ 相交} \quad d=r \text{ 相切} \quad d> r \text{ 相离} \\
              \text{弦长} = 2\sqrt{r^2 - d^2} \quad (d \le r)
          </FormulaBox>
        </ConceptBlock>

        <ConceptBlock title="三、切线方程">
          <p>圆 \(x^2 + y^2 = r^2\) 上一点 \((x_0, y_0)\) 的切线：\(x_0x + y_0y = r^2\)</p>
          <p>圆 \((x-h)^2 + (y-k)^2 = r^2\) 上一点 \((x_0, y_0)\) 的切线：\((x_0-h)(x-h) + (y_0-k)(y-k) = r^2\)</p>
        </ConceptBlock>
      </div>
      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>点到直线距离忘记绝对值 — 距离永远为正</li>
            <li>判别式判断位置关系记反 — Δ&gt;0→相交，Δ&lt;0→相离</li>
            <li>弦长公式用错 — 先求d再代入 \\(2\\sqrt{r^2-d^2}\\)</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>几何法优先：用距离公式 d 比判别式更快</li>
            <li>弦长公式熟记：\\(2\\sqrt{r^2-d^2}\\) 快速求解</li>
            <li>切线⊥切点处半径：利用垂直关系确定斜率</li>
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
  '掌握圆的标准方程与一般式的互化',
  '熟练使用几何法（距离公式d）判断直线与圆位置关系',
  '掌握弦长公式 \\(2\\sqrt{r^2-d^2}\\)',
  '理解切线⊥半径的性质并能求切线方程',
  '能判断圆与圆的位置关系（外切/内切/相交/相离）'
]

const ch = ref(0), ck = ref(0), cr = ref(2)
const la = ref(1), lb = ref(-1), lc = ref(0)
const infoHtml = ref('')

const presets = [
  { label: '相交', ch: 0, ck: 0, cr: 2, la: 1, lb: -1, lc: 0 },
  { label: '相切', ch: 0, ck: 0, cr: 2, la: 1, lb: 0, lc: -2 },
  { label: '相离', ch: 0, ck: 0, cr: 1.5, la: 1, lb: 0, lc: -4 },
  { label: '弦长', ch: 0, ck: 0, cr: 2, la: 1, lb: 0, lc: -1 }
]

function applyPreset(p) {
  ch.value = p.ch; ck.value = p.ck; cr.value = p.cr
  la.value = p.la; lb.value = p.lb; lc.value = p.lc
  updateInfo()
}

function updateInfo() {
  const d = Math.abs(la.value * ch.value + lb.value * ck.value + lc.value) / Math.sqrt(la.value * la.value + lb.value * lb.value)
  const status = d < cr.value - 0.001 ? '相交' : Math.abs(d - cr.value) < 0.001 ? '相切' : '相离'
  const chord = d < cr.value ? 2 * Math.sqrt(Math.max(0, cr.value * cr.value - d * d)) : 0
  let h = `<b>圆心</b> C(${ch.value.toFixed(1)}, ${ck.value.toFixed(1)}) <b>半径</b> r = ${cr.value.toFixed(1)}<br>`
  h += `<b>直线</b> \\(${la.value.toFixed(1)}x ${lb.value >= 0 ? '+' : ''}${lb.value.toFixed(1)}y ${lc.value >= 0 ? '+' : ''}${lc.value.toFixed(1)} = 0\\)<br>`
  h += `<b>圆心到直线距离</b> d = ${d.toFixed(2)} &nbsp; <b>位置</b>：${status}<br>`
  if (chord > 0) h += `<b>弦长</b> = 2√(r²−d²) = ${chord.toFixed(2)}`
  infoHtml.value = h
}

function lineSlope() {
  if (Math.abs(lb.value) < 0.001) return null // vertical
  return -la.value / lb.value
}

function lineY(x) {
  if (Math.abs(lb.value) < 0.001) return null
  return (-la.value * x - lc.value) / lb.value
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
    drawCL(p)
  }
}

function drawCL(p) {
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
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue
    const [lx] = toS(i, 0); p.textAlign(p.CENTER, p.TOP); p.text(i, lx, oy + 4)
    const [, ly] = toS(0, i); p.textAlign(p.RIGHT, p.CENTER); p.text(i, ox - 5, ly)
  }
  p.textAlign(p.RIGHT, p.TOP); p.text('O', ox - 4, oy + 4)

  // Line: Ax + By + C = 0
  const A = la.value, B = lb.value, C = lc.value
  p.stroke('#ef4444'); p.strokeWeight(2)
  const x1 = -5, x2 = 5
  if (Math.abs(B) > 0.001) {
    const y1 = (-A * x1 - C) / B, y2 = (-A * x2 - C) / B
    const [sx1, sy1] = toS(x1, y1), [sx2, sy2] = toS(x2, y2)
    if (Math.abs(y1) < 8 && Math.abs(y2) < 8) p.line(sx1, sy1, sx2, sy2)
  } else if (Math.abs(A) > 0.001) {
    const x0 = -C / A
    const [sx] = toS(x0, -5), [sx2] = toS(x0, 5)
    p.line(sx, m, sx2, H - m)
  }

  // Distance line from center to line
  const d = Math.abs(A * ch.value + B * ck.value + C) / Math.sqrt(A * A + B * B)
  const [chx, chy] = toS(ch.value, ck.value)
  p.stroke('#f59e0b'); p.strokeWeight(1); p.drawingContext.setLineDash([4, 3])
  if (Math.abs(B) > 0.001) {
    const footX = (B * (B * ch.value - A * ck.value) - A * C) / (A * A + B * B)
    const footY = (A * (-B * ch.value + A * ck.value) - B * C) / (A * A + B * B)
    const [fx, fy] = toS(footX, footY)
    p.line(chx, chy, fx, fy)
    p.fill('#f59e0b'); p.noStroke(); p.circle(fx, fy, 4)
    p.textSize(8); p.textAlign(p.LEFT, p.BOTTOM); p.text(`d=${d.toFixed(2)}`, (chx + fx) / 2 + 4, (chy + fy) / 2)
  }
  p.drawingContext.setLineDash([])

  // Intersection points
  if (d < cr.value - 0.001) {
    const denom = A * A + B * B
    const cx = ch.value, cy = ck.value, r = cr.value
    const disc = r * r - d * d
    if (disc > 0) {
      const hd = Math.sqrt(disc)
      const perpX = -B / Math.sqrt(denom), perpY = A / Math.sqrt(denom)
      const footX = (B * (B * cx - A * cy) - A * C) / denom
      const footY = (A * (-B * cx + A * cy) - B * C) / denom
      const ix1 = footX + perpX * hd, iy1 = footY + perpY * hd
      const ix2 = footX - perpX * hd, iy2 = footY - perpY * hd
      const [px1, py1] = toS(ix1, iy1), [px2, py2] = toS(ix2, iy2)
      p.fill('#6366f1'); p.noStroke(); p.circle(px1, py1, 6); p.circle(px2, py2, 6)
      // Chord line
      p.stroke('#6366f1'); p.strokeWeight(1.5); p.drawingContext.setLineDash([3, 3])
      p.line(px1, py1, px2, py2)
      p.drawingContext.setLineDash([])
    }
  } else if (Math.abs(d - cr.value) < 0.001) {
    const denom = A * A + B * B
    const cx = ch.value, cy = ck.value
    const footX = (B * (B * cx - A * cy) - A * C) / denom
    const footY = (A * (-B * cx + A * cy) - B * C) / denom
    const [fx, fy] = toS(footX, footY)
    p.fill('#10b981'); p.noStroke(); p.circle(fx, fy, 7)
    p.textSize(9); p.textAlign(p.LEFT, p.TOP); p.text('切点', fx + 6, fy + 4)
  }

  // Circle
  const [cpX, cpY] = toS(ch.value, ck.value)
  const rPx = cr.value * gs
  p.noFill(); p.stroke('#4f46e5'); p.strokeWeight(2)
  p.circle(cpX, cpY, rPx * 2)
  p.fill('#4f46e5'); p.noStroke(); p.circle(cpX, cpY, 5)
  p.textSize(10); p.textAlign(p.LEFT, p.BOTTOM); p.text(`C(${ch.value.toFixed(1)},${ck.value.toFixed(1)})`, cpX + 6, cpY - 6)

  // Legend
  p.fill(255, 255, 255, 200); p.noStroke()
  p.rect(m + 4, m + 4, 90, 48, 4)
  p.fill('#4f46e5'); p.textSize(9); p.textAlign(p.LEFT, p.TOP)
  p.text(`圆 (x${ch.value >= 0 ? '-' : '+'}${Math.abs(ch.value).toFixed(1)})²`, m + 8, m + 8)
  p.fill('#ef4444'); p.text(`直线 Ax+By+C=0`, m + 8, m + 22)
  p.fill('#6366f1'); p.text('交点/弦', m + 8, m + 36)
}

onMounted(() => updateInfo())
</script>

<style scoped>
.cl-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: var(--radius-lg);
  margin-bottom: 10px;
  box-shadow: var(--shadow-light)
}

.cl-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px
}

.cl-param {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--text-secondary)
}

.cl-param label {
  font-weight: 600;
  min-width: 36px;
  font-size: 10px
}

.cl-range {
  width: 70px;
  accent-color: var(--accent);
  height: 4px
}

.cl-val {
  font-size: 10px;
  color: var(--text-muted);
  min-width: 24px;
  font-family: var(--font-mono)
}

.cl-preset-btn {
  padding: 3px 8px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-secondary);
  font-size: 10px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s
}

.cl-preset-btn:hover {
  border-color: var(--accent);
  color: var(--accent)
}

.cl-info {
  padding: 6px 14px;
  font-size: 11px;
  color: var(--text-regular);
  background: var(--card-bg-warm);
  border-top: 1px solid var(--border-lighter);
  line-height: 1.8
}

.canvas-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-lighter);
  box-shadow: var(--shadow);
  overflow: hidden;
  margin-bottom: 14px
}
</style>
