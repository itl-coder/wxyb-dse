<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 二次函数</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <div class="quad-controls">
      <div class="control-row">
        <span v-for="p in quadParams" :key="p.key" class="param-item">
          <label>{{ p.label }}</label>
          <el-slider v-model="p.value" :min="p.min" :max="p.max" :step="p.step" style="width:110px" @input="updateDisplay" show-input size="small" />
        </span>
        <el-button size="small" @click="resetParams">重置</el-button>
      </div>
      <div class="control-row">
        <el-checkbox v-model="showRoots" size="small">根</el-checkbox>
        <el-checkbox v-model="showVertex" size="small">顶点</el-checkbox>
        <el-checkbox v-model="showSym" size="small">对称轴</el-checkbox>
        <el-checkbox v-model="showDelta" size="small">判别式</el-checkbox>
        <el-select v-model="quadProblem" size="small" placeholder="DSE例题" clearable style="width:180px" @change="onProblem">
          <el-option v-for="p in dseProblems" :key="p.key" :label="p.label" :value="p.key" />
        </el-select>
      </div>
    </div>

    <div class="canvas-card">
      <P5Canvas :sketch="sketchFn" />
      <div class="quad-info" v-html="infoHtml"></div>
    </div>

    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、三种标准形式" tag="★ 高频">
          <FormulaBox>标准式：y = ax² + bx + c<br>顶点式：y = a(x−h)² + k 顶点 (h,k)<br>交点式：y = a(x−x₁)(x−x₂)</FormulaBox>
        </ConceptBlock>
        <ConceptBlock title="二、判别式与根的关系" tag="★ 核心">
          <FormulaBox>Δ = b² − 4ac<br>Δ > 0 → 两不等实根<br>Δ = 0 → 重根（与x轴相切）<br>Δ < 0 → 无实根（不与x轴相交）</FormulaBox>
        </ConceptBlock>
        <ConceptBlock title="三、顶点与对称轴">
          <p>对称轴：x = −b/(2a)</p>
          <p>顶点坐标：(−b/(2a), f(−b/(2a)))</p>
          <p>a > 0 开口向上有最小值；a < 0 开口向下有最大值</p>
        </ConceptBlock>
      </div>
      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>配方时忘记提取 a — y=ax²+bx+c，第一步提取 a</li>
            <li>混淆顶点横坐标公式与求根公式</li>
            <li>Δ < 0 时不等于抛物线不存在</li>
            <li>开口方向和最值混淆 — a<0 是最大值</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>配方求顶点 — 最值问题的标准方法</li>
            <li>因式分解求根 — 交点式转换</li>
            <li>判别式判断交点数目</li>
            <li>配方法 vs 公式法灵活切换</li>
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
  '掌握二次函数的标准式、顶点式、交点式',
  '理解判别式 Δ 与根的个数关系',
  '熟练配方求顶点和最值',
  '能绘制抛物线的顶点、对称轴、交点',
  '掌握二次不等式与二次函数的几何关系'
]

const quadParams = reactive([
  { key: 'qa', label: 'a', value: 1, min: -3, max: 3, step: 0.1 },
  { key: 'qb', label: 'b', value: 0, min: -6, max: 6, step: 0.1 },
  { key: 'qc', label: 'c', value: 0, min: -5, max: 5, step: 0.1 }
])

const showRoots = ref(true)
const showVertex = ref(true)
const showSym = ref(true)
const showDelta = ref(true)
const quadProblem = ref('')
const infoHtml = ref('')

const dseProblems = [
  { key: 'findVertex', label: '求顶点坐标' },
  { key: 'findRoots', label: '求根' },
  { key: 'discriminant', label: '判断交点个数' },
  { key: 'maxmin', label: '求最值' }
]

function getQP() { return { a: quadParams[0].value, b: quadParams[1].value, c: quadParams[2].value } }

function resetParams() { quadParams[0].value = 1; quadParams[1].value = 0; quadParams[2].value = 0; updateDisplay() }

function updateDisplay() {
  const { a, b, c } = getQP()
  const delta = b * b - 4 * a * c
  const h = -b / (2 * a), k = a * h * h + b * h + c
  let html = `<b>y=${a.toFixed(1)}x²`
  html += b >= 0 ? `+${b.toFixed(1)}x` : `${b.toFixed(1)}x`
  html += c >= 0 ? `+${c.toFixed(1)}` : `${c.toFixed(1)}`
  html += `</b><br>`
  html += `<b>顶点式</b>：y=${a.toFixed(1)}(x${h>=0?'-':'+'}${Math.abs(h).toFixed(2)})²${k>=0?'+':''}${k.toFixed(2)}<br>`
  html += `<b>顶点</b>(${h.toFixed(2)},${k.toFixed(2)}) &nbsp; <b>对称轴</b> x=${h.toFixed(2)}<br>`
  html += `<b>Δ=${delta.toFixed(2)}</b> `
  if (delta > 0.01) {
    const sqrtD = Math.sqrt(delta)
    html += `(>0, 两实根)<br><b>x₁=${((-b-sqrtD)/(2*a)).toFixed(2)}</b>, <b>x₂=${((-b+sqrtD)/(2*a)).toFixed(2)}</b>`
  } else if (delta < -0.01) html += '(<0, 无实根)'
  else html += `(=0, 重根 x=${h.toFixed(2)})`
  html += `<br><b>开口</b>：${a>0?'↑ (a>0)':'↓ (a<0)'} &nbsp; <b>${a>0?'最小':'最大'}值</b>=${k.toFixed(2)}`
  infoHtml.value = html
}

function onProblem(key) {
  const scenes = {
    findVertex: { a:1, b:-4, c:3 }, findRoots: { a:1, b:-2, c:-3 },
    discriminant: { a:1, b:2, c:5 }, maxmin: { a:-2, b:8, c:-5 }
  }
  if (!key || !scenes[key]) return
  const s = scenes[key]
  quadParams[0].value = s.a; quadParams[1].value = s.b; quadParams[2].value = s.c
  updateDisplay()
}

const sketchFn = (p, container) => {
  p.setup = () => {
    const sz = Math.min(container.clientWidth - 20, 640, 640)
    p.createCanvas(sz, sz); p.frameRate(30); p.textFont('sans-serif')
  }
  p.draw = () => {
    const sz = Math.min(container.clientWidth - 20, 640, 640)
    if (p.width !== sz) p.resizeCanvas(sz, sz)
    p.background('#fafbfc')
    drawQuad(p)
  }
}

function drawQuad(p) {
  const { a, b, c } = getQP()
  const W = p.width, H = p.height, m = 55, ox = W/2, oy = H/2
  const xRange = 5, gs = (W - 2*m) / (2*xRange)

  // 网格
  p.stroke(220, 225, 235); p.strokeWeight(0.5)
  for (let i = -5; i <= 5; i++) {
    const x = m + (i+5) * gs; p.line(x, m, x, H - m)
    const y = m + (i+5) * gs; p.line(m, y, W - m, y)
  }

  // 坐标轴
  p.stroke('#94a3b8'); p.strokeWeight(1.5)
  p.line(ox, m, ox, H - m); p.line(m, oy, W - m, oy)
  p.fill('#94a3b8'); p.noStroke(); p.triangle(W-m-1, oy, W-m-9, oy-4, W-m-9, oy+4)
  p.triangle(ox, m-1, ox-4, m+8, ox+4, m+8)

  // 轴标签
  p.textSize(9)
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue
    p.textAlign(p.CENTER, p.TOP); p.text(i, ox+i*gs, oy+4)
    p.textAlign(p.RIGHT, p.CENTER); p.text(i, ox-6, oy-i*gs)
  }
  p.textAlign(p.RIGHT, p.TOP); p.text('O', ox-4, oy+4)

  // 对称轴
  if (showSym.value) {
    const hx = -b/(2*a), sx_ = ox + hx*gs
    if (sx_ > m && sx_ < W - m) {
      p.stroke('#e67e22'); p.strokeWeight(1.5); p.drawingContext.setLineDash([6, 3])
      p.line(sx_, m, sx_, H - m); p.drawingContext.setLineDash([])
      p.fill('#e67e22'); p.textSize(9); p.textAlign(p.CENTER, p.BOTTOM)
      p.text('x='+hx.toFixed(2), sx_, m+12)
    }
  }

  // 抛物线
  p.noFill(); p.stroke('#c0392b'); p.strokeWeight(2.5); p.beginShape()
  for (let x = -6; x <= 6; x += 0.02) {
    const y = a*x*x + b*x + c, spx = ox + x*gs, spy = oy - y*gs
    if (spy >= -50 && spy <= H+50) p.vertex(spx, spy)
  }
  p.endShape()

  // 顶点
  if (showVertex.value) {
    const hv = -b/(2*a), kv = a*hv*hv + b*hv + c
    const vx = ox + hv*gs, vy = oy - kv*gs
    p.fill('#c0392b'); p.noStroke(); p.circle(vx, vy, 8)
    p.textSize(10); p.textAlign(p.LEFT, p.BOTTOM)
    p.text(`顶点(${hv.toFixed(2)},${kv.toFixed(2)})`, vx+8, vy-4)
  }

  // 根
  if (showRoots.value) {
    const delta = b*b - 4*a*c
    if (delta >= -0.001) {
      const sqrtD = Math.sqrt(Math.max(0, delta))
      const roots = delta < 0.001 ? [(-b)/(2*a)] : [(-b-sqrtD)/(2*a), (-b+sqrtD)/(2*a)]
      roots.forEach((r, i) => {
        const rx = ox + r*gs
        if (rx > m && rx < W - m) {
          p.fill('#2d6a9f'); p.noStroke(); p.circle(rx, oy, 6)
          p.textSize(9); p.textAlign(p.CENTER, p.TOP)
          p.text(`x${roots.length>1?(i+1):''}=${r.toFixed(2)}`, rx, oy+8)
        }
      })
    }
  }

  // 判别式
  if (showDelta.value) {
    const delta2 = b*b - 4*a*c
    p.fill(0,0,0,140); p.noStroke(); p.rect(m+4, m+2, 185, 34, 3)
    p.fill('#fff'); p.textSize(10); p.textAlign(p.LEFT, p.TOP)
    p.text(`Δ=b²−4ac=${delta2.toFixed(2)}`, m+10, m+6)
    const status = delta2 > 0.01 ? '两不等实根' : delta2 < -0.01 ? '无实根' : '重根(相切)'
    p.text(`${status} · a=${a.toFixed(1)}${a>0?'>0开口↑':'<0开口↓'}`, m+10, m+20)
  }

  // y截距
  p.fill('#9b59b6'); p.noStroke(); p.circle(ox, oy - c*gs, 5)
  p.textSize(8); p.textAlign(p.LEFT, p.BOTTOM); p.text(`y截距=${c.toFixed(1)}`, ox+6, oy-c*gs-2)
}

onMounted(() => updateDisplay())
</script>

<style scoped>
.quad-controls { display:flex;flex-direction:column;gap:8px;padding:10px 16px;background:var(--card-bg);border:1px solid var(--border-lighter);border-radius:var(--radius-lg);margin-bottom:10px }
.control-row { display:flex;flex-wrap:wrap;align-items:center;gap:12px }
.param-item { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary) }
.param-item label { font-weight:600;min-width:16px }
.quad-info { padding:6px 14px;font-size:11px;color:var(--text-regular);background:var(--card-bg-warm);border-top:1px solid var(--border-lighter);line-height:1.8 }
.canvas-card { background:var(--card-bg);border-radius:var(--radius-lg);border:1px solid var(--border-lighter);box-shadow:0 2px 12px rgba(26,46,60,0.06);overflow:hidden;margin-bottom:14px }
</style>
