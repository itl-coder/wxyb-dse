<template>
  <div class="teaching-wrap">
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 动点与参数方程</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <div class="mov-controls">
      <div class="control-row">
        <el-radio-group v-model="movType" size="small" @change="onTypeChange">
          <el-radio-button v-for="(n,i) in movNames" :key="i" :value="i">{{ n }}</el-radio-button>
        </el-radio-group>
      </div>
      <div class="control-row">
        <el-button size="small" :type="playing?'warning':''" @click="playing=!playing">{{ playing ? '⏸️ 暂停' : '▶️ 播放' }}</el-button>
        <el-button size="small" @click="resetPlay">↺ 重置</el-button>
        <el-button size="small" @click="clearTrail">清轨迹</el-button>
        <el-button size="small" @click="addMark">📍 标记</el-button>
        <el-button size="small" @click="marks=[]">清标记</el-button>
        <span class="param-item">
          <label>速度</label>
          <el-slider v-model="speed" :min="0.2" :max="3" :step="0.1" style="width:100px" show-input size="small" />
        </span>
      </div>
      <div class="control-row">
        <el-checkbox v-model="showV" size="small">速度向量</el-checkbox>
        <el-checkbox v-model="showA" size="small">加速度</el-checkbox>
        <el-checkbox v-model="showGround" size="small">参考轨迹</el-checkbox>
      </div>
      <div class="param-row" v-if="currentParamKeys.length">
        <span v-for="(k,i) in currentParamKeys" :key="k" class="param-item">
          <label>{{ paramLabels[i] }}</label>
          <el-slider v-model="movParams[i]" :min="paramMins[i]" :max="paramMaxs[i]" :step="paramSteps[i]" style="width:100px" @input="clearTrail" show-input size="small" />
        </span>
      </div>
    </div>

    <div class="canvas-card">
      <P5Canvas :sketch="sketchFn" />
      <div class="mov-info" v-html="infoHtml"></div>
    </div>

    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、参数方程思想">
          <p>用参数 t 表示点的坐标 (x(t), y(t))。t 可以是时间、角度等几何量。消除参数 t 可得直角坐标方程。</p>
          <FormulaBox>圆：x=r·cos θ, y=r·sin θ<br>椭圆：x=a·cos θ, y=b·sin θ<br>抛物线：x=t, y=at²<br>摆线：x=r(θ−sinθ), y=r(1−cosθ)</FormulaBox>
        </ConceptBlock>
        <ConceptBlock title="二、速度与加速度" tag="★ DSE">
          <p>速度向量：v⃗ = (dx/dt, dy/dt)</p>
          <p>加速度向量：a⃗ = (d²x/dt², d²y/dt²)</p>
          <p>速率 = |v⃗| = √((dx/dt)² + (dy/dt)²)</p>
        </ConceptBlock>
      </div>
      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>混淆参数方程与函数 — 参数方程允许多值</li>
            <li>消参数时的定义域变化</li>
            <li>摆线一拱的周期计算</li>
            <li>速度方向与轨迹切线的关系</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>先确定参数范围</li>
            <li>消参数求直角坐标方程</li>
            <li>利用导数求速度/加速度</li>
            <li>关注参数的实际物理意义</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import P5Canvas from '@/components/common/P5Canvas.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '理解参数方程表示动点轨迹的方法',
  '掌握圆、椭圆、抛物线、摆线等常见参数方程',
  '能计算动点的速度向量和加速度向量',
  '能从参数方程消去参数得到直角坐标方程',
  '掌握DSE动点问题的分析和解答方法'
]

const movType = ref(0)
const playing = ref(true)
const speed = ref(1)
const showV = ref(true)
const showA = ref(false)
const showGround = ref(true)
const infoHtml = ref('')
let t = 0, trail = [], marks = []

const movNames = ['圆上动点', '椭圆上动点', '直线往返', '抛物线动点', '摆线', '阿基米德螺线']

const movParams = reactive([2, 1, 2.5, 1.5, 2, 1, 0.5, 1, 2, 1, 0.3, 0.15])

const paramConfigs = [
  [{ label: '半径 r', min: 0.5, max: 4, step: 0.1 }, { label: 'ω', min: 0.2, max: 3, step: 0.1 }],
  [{ label: '长轴 a', min: 1, max: 5, step: 0.1 }, { label: '短轴 b', min: 0.5, max: 4, step: 0.1 }],
  [{ label: '振幅', min: 0.5, max: 5, step: 0.1 }, { label: '频率', min: 0.2, max: 3, step: 0.1 }],
  [{ label: '系数', min: 0.1, max: 1, step: 0.05 }, { label: '速度', min: 0.5, max: 3, step: 0.1 }],
  [{ label: '半径 r', min: 0.5, max: 3, step: 0.1 }, { label: 'ω', min: 0.2, max: 3, step: 0.1 }],
  [{ label: 'a', min: 0.1, max: 1, step: 0.05 }, { label: 'b', min: 0.1, max: 1, step: 0.05 }]
]

const currentParamKeys = computed(() => paramConfigs[movType.value].map((_, i) => `p${i}`))
const paramLabels = computed(() => paramConfigs[movType.value].map(c => c.label))
const paramMins = computed(() => paramConfigs[movType.value].map(c => c.min))
const paramMaxs = computed(() => paramConfigs[movType.value].map(c => c.max))
const paramSteps = computed(() => paramConfigs[movType.value].map(c => c.step))

function getMP() {
  const off = movType.value * 2
  return [movParams[off], movParams[off + 1]]
}

function movPosition(tt) {
  const p = getMP()
  switch (movType.value) {
    case 0: return { x: p[0] * Math.cos(tt), y: p[0] * Math.sin(tt) }
    case 1: return { x: p[0] * Math.cos(tt), y: p[1] * Math.sin(tt) }
    case 2: { const x = p[0] * Math.sin(p[1] * tt); return { x, y: 0.5 * x + 0.3 * Math.sin(x) } }
    case 3: { const x = (tt * p[1]) % 6 - 3; return { x, y: p[0] * x * x } }
    case 4: { const th = tt * p[1]; return { x: p[0] * (th - Math.sin(th)), y: p[0] * (1 - Math.cos(th)) } }
    default: { const th = tt * 0.8, rv = p[0] + p[1] * th; return { x: rv * Math.cos(th), y: rv * Math.sin(th) } }
  }
}

function movVelocity(tt) {
  const dt = 0.001
  const p1 = movPosition(tt - dt), p2 = movPosition(tt + dt)
  return { vx: (p2.x - p1.x) / (2 * dt), vy: (p2.y - p1.y) / (2 * dt) }
}

function movAccel(tt) {
  const dt = 0.001
  const v1 = movVelocity(tt - dt), v2 = movVelocity(tt + dt)
  return { ax: (v2.vx - v1.vx) / (2 * dt), ay: (v2.vy - v1.vy) / (2 * dt) }
}

function onTypeChange() { trail = []; t = 0; marks = []; updateInfo() }
function resetPlay() { t = 0; trail = []; marks = [] }
function clearTrail() { trail = [] }
function addMark() { const pos = movPosition(t); marks.push({ x: pos.x, y: pos.y, t }) }

function updateInfo() {
  const p = getMP(), pos = movPosition(t)
  const eqs = [
    `参数方程：x=${p[0].toFixed(1)}cosθ, y=${p[0].toFixed(1)}sinθ<br>向心加速度：a=rω²=${(p[0]*p[1]*p[1]).toFixed(2)}`,
    `参数方程：x=${p[0].toFixed(1)}cosθ, y=${p[1].toFixed(1)}sinθ<br>2a=${(2*p[0]).toFixed(1)} 2b=${(2*p[1]).toFixed(1)}`,
    `参数方程：x=A·sin(ωt), y=kx+ε<br>振幅=${p[0].toFixed(1)} 频率=${p[1].toFixed(1)}`,
    `参数方程：x=t, y=${p[0].toFixed(2)}x²<br>焦点(0,${(1/(4*p[0])).toFixed(2)})`,
    `参数方程：x=r(θ−sinθ), y=r(1−cosθ)<br>一拱高=${(2*p[0]).toFixed(1)} 宽=${(2*Math.PI*p[0]).toFixed(1)}`,
    `极坐标：r=${p[0].toFixed(2)}+${p[1].toFixed(2)}θ`
  ]
  infoHtml.value = eqs[movType.value] + `<br><b>当前</b>：t=${t.toFixed(2)} (${pos.x.toFixed(3)}, ${pos.y.toFixed(3)})`
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
    drawMov(p)
  }
}

function drawMov(p) {
  const W = p.width, H = p.height, m = 45
  const gs = (W - 2 * m) / 8, ox = m + 4 * gs, oy = m + 4 * gs
  const toS = (x, y) => [ox + x * gs, oy - y * gs]
  if (playing.value) t += 0.02 * speed.value
  const pNow = getMP()

  // 网格
  p.stroke(220, 225, 235); p.strokeWeight(0.5)
  for (let i = 0; i <= 8; i++) { p.line(m + i * gs, m, m + i * gs, H - m); p.line(m, m + i * gs, W - m, m + i * gs) }

  // 坐标轴
  p.stroke('#94a3b8'); p.strokeWeight(1.5)
  p.line(ox, m, ox, H - m); p.line(m, oy, W - m, oy)

  // 参考轨迹
  if (showGround.value) {
    p.noFill(); p.stroke('#1a4a7a', 80); p.strokeWeight(1.5)
    if (movType.value === 0) { const [cx, cy] = toS(0, 0); p.ellipse(cx, cy, pNow[0] * 2 * gs) }
    else if (movType.value === 1) { const [cx, cy] = toS(0, 0); p.ellipse(cx, cy, 2 * pNow[0] * gs, 2 * pNow[1] * gs) }
    else if (movType.value === 2) {
      p.beginShape()
      for (let x = -4; x <= 4; x += 0.05) { const [sx, sy] = toS(x, 0.5 * x + 0.3 * Math.sin(x)); p.vertex(sx, sy) }
      p.endShape()
    } else if (movType.value === 3) {
      p.beginShape()
      for (let x = -4; x <= 4; x += 0.05) { const [sx, sy] = toS(x, pNow[0] * x * x); if (sy > m && sy < H - m) p.vertex(sx, sy) }
      p.endShape()
    }
  }

  // 轨迹
  if (trail.length > 1) {
    p.noFill(); p.stroke('#1a4a7a', 120); p.strokeWeight(1.5)
    p.beginShape()
    for (let i = 0; i < trail.length; i++) {
      const [sx, sy] = toS(trail[i].x, trail[i].y)
      if (sx > m && sx < W - m && sy > m && sy < H - m) p.vertex(sx, sy)
    }
    p.endShape()
  }

  const pos = movPosition(t)
  trail.push({ x: pos.x, y: pos.y })
  if (trail.length > 500) trail.shift()

  // 速度/加速度向量
  const [spx, spy] = toS(pos.x, pos.y)
  const v = movVelocity(t)
  if (showV.value) {
    const sc = Math.min(gs, 20)
    const [vx2, vy2] = toS(pos.x + v.vx * 0.3, pos.y + v.vy * 0.3)
    p.stroke('#c0392b'); p.strokeWeight(2); p.line(spx, spy, vx2, vy2)
    const ang = Math.atan2(-(vy2 - spy), vx2 - spx)
    p.fill('#c0392b'); p.noStroke()
    p.triangle(vx2, vy2, vx2 - 7 * Math.cos(ang - 0.4), vy2 + 7 * Math.sin(ang - 0.4), vx2 - 7 * Math.cos(ang + 0.4), vy2 + 7 * Math.sin(ang + 0.4))
    p.textSize(8); p.textAlign(p.LEFT); p.text('v', vx2 + 4, vy2 - 4)
  }
  if (showA.value) {
    const a = movAccel(t)
    const [ax2, ay2] = toS(pos.x + a.ax * 0.3, pos.y + a.ay * 0.3)
    p.stroke('#2d6a9f'); p.strokeWeight(2); p.line(spx, spy, ax2, ay2)
    const ang2 = Math.atan2(-(ay2 - spy), ax2 - spx)
    p.fill('#2d6a9f'); p.noStroke()
    p.triangle(ax2, ay2, ax2 - 7 * Math.cos(ang2 - 0.4), ay2 + 7 * Math.sin(ang2 - 0.4), ax2 - 7 * Math.cos(ang2 + 0.4), ay2 + 7 * Math.sin(ang2 + 0.4))
    p.textSize(8); p.textAlign(p.LEFT); p.text('a', ax2 + 4, ay2 - 4)
  }

  // 动点
  p.fill('#c0392b'); p.noStroke(); p.circle(spx, spy, 8)
  p.textAlign(p.LEFT, p.BOTTOM); p.textSize(10)
  p.text(`(${pos.x.toFixed(2)},${pos.y.toFixed(2)})`, spx + 8, spy - 4)

  // 标记
  marks.forEach(mk => {
    const [mx, my] = toS(mk.x, mk.y)
    p.fill('#e67e22'); p.noStroke(); p.circle(mx, my, 5)
    p.textSize(7); p.text(`t=${mk.t.toFixed(1)}`, mx + 6, my - 4)
  })
}

onMounted(() => updateInfo())
</script>

<style scoped>
.mov-controls { display:flex;flex-direction:column;gap:8px;padding:10px 16px;background:var(--card-bg);border:1px solid var(--border-lighter);border-radius:var(--radius-lg);margin-bottom:10px }
.control-row { display:flex;flex-wrap:wrap;align-items:center;gap:8px }
.param-row { display:flex;flex-wrap:wrap;gap:8px 16px }
.param-item { display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-secondary) }
.param-item label { font-weight:600;min-width:28px }
.mov-info { padding:6px 14px;font-size:11px;color:var(--text-regular);background:var(--card-bg-warm);border-top:1px solid var(--border-lighter);line-height:1.8 }
.canvas-card { background:var(--card-bg);border-radius:var(--radius-lg);border:1px solid var(--border-lighter);box-shadow:0 2px 12px rgba(26,46,60,0.06);overflow:hidden;margin-bottom:14px }
</style>
