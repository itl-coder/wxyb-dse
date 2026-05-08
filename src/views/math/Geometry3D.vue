<template>
  <div class="teaching-wrap">
    <!-- 教学目标 -->
    <div class="obj-section">
      <div class="sec-title">📐 学习目标 · 3D 交互几何</div>
      <ul class="obj-grid">
        <li v-for="o in objectives" :key="o">{{ o }}</li>
      </ul>
    </div>

    <!-- 工具栏 -->
    <div class="geo-toolbar">
      <div class="geo-tool-group">
        <span class="geo-tool-label">工具</span>
        <el-radio-group v-model="geoTool" size="small" @change="onToolChange">
          <el-radio-button value="point">✏️ 点</el-radio-button>
          <el-radio-button value="select">👆 选择</el-radio-button>
          <el-radio-button value="edge">📏 连线</el-radio-button>
          <el-radio-button value="face">△ 面</el-radio-button>
          <el-radio-button value="label">🏷️ 标注</el-radio-button>
          <el-radio-button value="color">🎨 着色</el-radio-button>
          <el-radio-button value="delete">🗑️ 删除</el-radio-button>
          <el-radio-button value="rotate">🔄 旋转</el-radio-button>
        </el-radio-group>
      </div>

      <div class="geo-tool-group">
        <span class="geo-tool-label">预设</span>
        <el-button-group size="small">
          <el-button v-for="p in presets" :key="p.key" @click="loadPreset(p.key)" :type="currentPreset===p.key?'primary':''">{{ p.label }}</el-button>
        </el-button-group>
      </div>

      <div class="geo-tool-group">
        <el-button size="small" @click="resetView">🔄 重置视角</el-button>
        <el-button size="small" @click="toggleGrid">📐 网格{{ showGrid?'(开)':'(关)' }}</el-button>
        <el-button size="small" type="danger" @click="resetScene">清空场景</el-button>
        <el-switch v-model="dashMode" active-text="虚线" size="small" style="margin-left:8px" />
      </div>
    </div>

    <div class="geo-settings">
      <span>Z平面 <el-slider v-model="zPlane" :min="-5" :max="5" :step="0.1" style="width:120px" show-input :format-tooltip="v=>v.toFixed(1)" /></span>
      <span>透明度 <el-slider v-model="faceAlpha" :min="0.05" :max="0.9" :step="0.05" style="width:100px" show-input /></span>
      <span>面颜色 <el-color-picker v-model="fillColor" size="small" /></span>
      <span>线颜色 <el-color-picker v-model="strokeColor" size="small" /></span>
      <span>点颜色 <el-color-picker v-model="pointColor" size="small" /></span>
      <span>编号 <el-input v-model="labelInput" size="small" placeholder="A,B,C..." style="width:140px" clearable /></span>
    </div>

    <!-- 交互画布 -->
    <div class="canvas-card">
      <P5Canvas ref="canvasRef" :sketch="sketchFn" @ready="onCanvasReady" />
      <div class="geo-info" v-html="infoMsg"></div>
    </div>

    <!-- 教学概念 -->
    <div class="teaching-main">
      <div class="concept-section">
        <div class="sec-title">📖 核心概念</div>
        <ConceptBlock title="一、线面角（直线与平面的夹角）" tag="★ 高频">
          <p><b>几何定义</b>：直线 <i>l</i> 与它在平面 α 上的投影 <i>l'</i> 所成的锐角 θ，取值范围 0° ≤ θ ≤ 90°。</p>
          <FormulaBox>\(\sin\theta = |\cos\langle\vec{l},\vec{n}\rangle| = \dfrac{|\vec{l}\cdot\vec{n}|}{|\vec{l}|\cdot|\vec{n}|}\)</FormulaBox>
          <ExampleBox>
            <b>DSE示例</b>：长方体 ABCD-A₁B₁C₁D₁ 中，AB=3, AD=4, AA₁=5，求对角线 A₁C 与底面 ABCD 所成角的正弦值。<br>
            思路：A₁C 在底面的投影为 AC，AC=√(3²+4²)=5，A₁C=√(5²+5²)=5√2，sinθ = 5/(5√2)=√2/2，θ=45°。
          </ExampleBox>
        </ConceptBlock>

        <ConceptBlock title="二、二面角与面面角" tag="★ 高频">
          <p><b>定义</b>：两个半平面沿交线形成的夹角，取值范围 0° ≤ θ ≤ 180°。</p>
          <FormulaBox>\(\cos\theta = \dfrac{|\vec{n}_1\cdot\vec{n}_2|}{|\vec{n}_1|\cdot|\vec{n}_2|}\)</FormulaBox>
          <p>其中 \(\vec{n}_1, \vec{n}_2\) 分别是两个平面的法向量。</p>
          <ExampleBox>
            <b>求二面角步骤</b>：① 找出交线 → ② 在两个面内分别作交线的垂线 → ③ 两条垂线的夹角即为二面角 → ④ 或在交线上取点，用向量法求解
          </ExampleBox>
        </ConceptBlock>

        <ConceptBlock title="三、立体图形的面积与体积" tag="核心">
          <FormulaBox>柱体体积 \(V = A_{\text{底}} \times h\) &nbsp;|&nbsp; 锥体体积 \(V = \dfrac{1}{3}A_{\text{底}} \times h\)</FormulaBox>
          <p>球体表面积 \(S = 4\pi r^2\)，球体体积 \(V = \dfrac{4}{3}\pi r^3\)</p>
        </ConceptBlock>
      </div>

      <div class="teaching-sidebar">
        <div class="mis-section">
          <div class="sec-title">⚠️ 常见误解</div>
          <ul>
            <li>混淆线面角与线线角 — 线面角看投影</li>
            <li>误以为点到平面距离必须垂直 — 等体积法更简洁</li>
            <li>忽视二面角的钝角可能性 — DSE需判断锐角/钝角</li>
            <li>混淆棱锥与棱柱体积公式（系数1/3）</li>
          </ul>
        </div>
        <div class="strategy-section">
          <div class="sec-title">▶ 解题策略</div>
          <ul>
            <li>建立坐标系，用向量法统一处理</li>
            <li>等体积法求高：\(V = \frac{1}{3}Sh\)</li>
            <li>三垂线定理找投影</li>
            <li>截面法转化空间问题为平面问题</li>
            <li>坐标法 + 向量法是DSE通用解法</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onBeforeUnmount } from 'vue'
import P5Canvas from '@/components/common/P5Canvas.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'
import ExampleBox from '@/components/common/ExampleBox.vue'

const objectives = [
  '理解空间直线与平面、平面与平面的位置关系',
  '掌握线面角、二面角的定义与计算方法',
  '熟练运用向量法求解空间角与距离',
  '掌握柱体、锥体、球体的表面积与体积计算',
  '能用手绘工具创建3D几何体，培养空间想象能力'
]

// ===== 几何状态 =====
const GEOM_SCALE = 50
const labelChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
let p5Inst = null
let geoPoints = [], geoEdges = [], geoFaces = []
let geoNextLabel = 0
let geoViewT = 0.6, geoViewP = 0.5, geoZoom = 1
let geoSelected = null, geoHovered = null
let geoTempFacePts = [], geoEdgeFirst = null
let geoDrag = false, geoDragSel = false, geoLMX = 0, geoLMY = 0
let geoDragBase = null

// ===== Vue 绑定状态 =====
const geoTool = ref('point')
const showGrid = ref(true)
const dashMode = ref(false)
const zPlane = ref(0)
const faceAlpha = ref(0.35)
const fillColor = ref('#4a90d9')
const strokeColor = ref('#1a1a2e')
const pointColor = ref('#c0392b')
const labelInput = ref('')
const infoMsg = ref('选择工具开始绘制。✏️点工具：点击网格放置点')
const currentPreset = ref('')
const canvasRef = ref(null)

const presets = [
  { key: 'cube', label: '正方体' }, { key: 'pyramid', label: '四棱锥' },
  { key: 'tetra', label: '正四面体' }, { key: 'prism', label: '三棱柱' },
  { key: 'hexprism', label: '正六棱柱' }, { key: 'octa', label: '正八面体' },
  { key: 'cone', label: '圆锥' }, { key: 'cylinder', label: '圆柱' }
]

function geoLabel() {
  const n = geoNextLabel++
  if (n < 26) return labelChars[n]
  return labelChars[n % 26] + Math.floor(n / 26)
}

// ===== 3D 数学 =====
function geoRotate(p, t, phi) {
  const ct = Math.cos(t), st = Math.sin(t)
  const cp = Math.cos(phi), sp = Math.sin(phi)
  const x1 = p.x * ct + p.z * st
  const z1 = -p.x * st + p.z * ct
  const y1 = p.y * cp - z1 * sp
  const z2 = p.y * sp + z1 * cp
  return { x: x1, y: y1, z: z2 }
}

function geoProject(p, ox, oy) {
  const r = geoRotate(p, geoViewT, geoViewP)
  return { sx: ox + r.x * GEOM_SCALE * geoZoom, sy: oy - r.y * GEOM_SCALE * geoZoom, depth: r.z }
}

function geoUnproject(mx, my, ox, oy, yPlane) {
  const ct = Math.cos(geoViewT), st = Math.sin(geoViewT)
  const cp = Math.cos(geoViewP), sp = Math.sin(geoViewP)
  const x1 = (mx - ox) / (GEOM_SCALE * geoZoom)
  const y1 = -(my - oy) / (GEOM_SCALE * geoZoom)
  if (Math.abs(sp) < 0.001) return { x: x1 / ct, y: yPlane, z: 0 }
  const z2 = (yPlane - y1 * cp) / sp
  const z1 = -y1 * sp + z2 * cp
  return { x: x1 * ct - z1 * st, y: yPlane, z: x1 * st + z1 * ct }
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
  return Math.sqrt((px - (x1 + t * dx)) ** 2 + (py - (y1 + t * dy)) ** 2)
}

function pointInPolygon(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// ===== 预设图形生成器 =====
const presetBuilders = {
  cube: () => ({
    pts: [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],
    edges: [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],
    faces: [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]
  }),
  pyramid: () => ({
    pts: [[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0],[0,0,2]],
    edges: [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]],
    faces: [[0,1,2,3],[0,1,4],[1,2,4],[2,3,4],[3,0,4]]
  }),
  tetra: () => ({
    pts: [[0,0,0],[1,0,0],[0.5,0.866,0],[0.5,0.289,0.816]],
    edges: [[0,1],[1,2],[2,0],[0,3],[1,3],[2,3]],
    faces: [[0,1,2],[0,1,3],[1,2,3],[2,0,3]]
  }),
  prism: () => ({
    pts: [[0,0,0],[1,0,0],[0.5,0.866,0],[0,0,1.5],[1,0,1.5],[0.5,0.866,1.5]],
    edges: [[0,1],[1,2],[2,0],[3,4],[4,5],[5,3],[0,3],[1,4],[2,5]],
    faces: [[0,1,2],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]]
  }),
  hexprism: () => {
    const n = 6, r = 1.2, h = 2
    const pts = [], edges = [], faces = [], bot = [], top = []
    for (let i = 0; i < n; i++) {
      const a = i / n * 2 * Math.PI
      pts.push([r * Math.cos(a), 0, r * Math.sin(a)])
      pts.push([r * Math.cos(a), h, r * Math.sin(a)])
      bot.push(i * 2); top.push(i * 2 + 1)
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      edges.push([i * 2, j * 2], [i * 2 + 1, j * 2 + 1], [i * 2, i * 2 + 1])
    }
    faces.push(bot, top)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      faces.push([i * 2, j * 2, j * 2 + 1, i * 2 + 1])
    }
    return { pts, edges, faces }
  },
  octa: () => ({
    pts: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1.414],[0,0,-1.414]],
    edges: [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[3,4],[2,5],[3,5]],
    faces: [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[0,5,2],[2,5,1],[1,5,3],[3,5,0]]
  }),
  cone: () => {
    const seg = 24, r = 1.2, h = 2.2
    const pts = [[0, h, 0]], edges = [], faces = [], base = []
    for (let i = 0; i < seg; i++) {
      const a = i / seg * 2 * Math.PI
      pts.push([r * Math.cos(a), 0, r * Math.sin(a)])
      base.push(i + 1)
      edges.push([0, i + 1])
      if (i < seg - 1) edges.push([i + 1, i + 2])
    }
    edges.push([seg, 1])
    faces.push(base)
    for (let i = 1; i <= seg; i++) {
      const j = i === seg ? 1 : i + 1
      faces.push([0, i, j])
    }
    return { pts, edges, faces }
  },
  cylinder: () => {
    const seg = 20, r = 1, h = 2
    const pts = [], edges = [], faces = [], bot = [], top = []
    for (let i = 0; i < seg; i++) {
      const a = i / seg * 2 * Math.PI
      pts.push([r * Math.cos(a), 0, r * Math.sin(a)])
      pts.push([r * Math.cos(a), h, r * Math.sin(a)])
      bot.push(i * 2); top.push(i * 2 + 1)
    }
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg
      edges.push([i * 2, j * 2], [i * 2 + 1, j * 2 + 1], [i * 2, i * 2 + 1])
    }
    faces.push(bot, top)
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg
      faces.push([i * 2, j * 2, j * 2 + 1, i * 2 + 1])
    }
    return { pts, edges, faces }
  }
}

// ===== 场景操作 =====
function resetScene() {
  geoPoints = []; geoEdges = []; geoFaces = []
  geoNextLabel = 0; geoSelected = null; geoTempFacePts = []; geoEdgeFirst = null
  currentPreset.value = ''
  updateInfo('场景已清空。选择工具开始绘制。')
}

function resetView() {
  geoViewT = 0.6; geoViewP = 0.5; geoZoom = 1
  updateInfo('视角已重置')
}

function toggleGrid() {
  showGrid.value = !showGrid.value
}

function loadPreset(key) {
  const builder = presetBuilders[key]
  if (!builder) return
  const preset = builder()
  resetScene()
  geoNextLabel = 0
  preset.pts.forEach(pt => geoPoints.push({ x: pt[0] - 0.5, y: pt[1] - 0.5, z: pt[2], label: geoLabel(), color: pointColor.value }))
  preset.edges.forEach(e => geoEdges.push({ a: e[0], b: e[1], color: strokeColor.value, dash: false }))
  preset.faces.forEach(f => geoFaces.push({ pts: f, color: fillColor.value }))
  currentPreset.value = key
  const names = { cube: '正方体', pyramid: '四棱锥', tetra: '正四面体', prism: '三棱柱', hexprism: '正六棱柱', octa: '正八面体', cone: '圆锥', cylinder: '圆柱' }
  updateInfo(`已加载预设：${names[key]} (${geoPoints.length}点 ${geoEdges.length}边 ${geoFaces.length}面)`)
}

function updateInfo(msg) {
  infoMsg.value = msg + `<br><span style="font-size:10px;color:#94a3b8">点${geoPoints.length} · 边${geoEdges.length} · 面${geoFaces.length}</span>`
}

function onToolChange() {
  geoSelected = null; geoTempFacePts = []; geoEdgeFirst = null
  const names = { point: '点工具：点击网格放置点', select: '选择工具：点击选择点/边/面', edge: '边工具：依次点击两个点连线', face: '面工具：点击点创建多边形，点击首点闭合', label: '标注工具：点击点为它命名', color: '着色工具：点击元素改变颜色', delete: '删除工具：点击删除元素', rotate: '旋转工具：拖拽旋转视角' }
  updateInfo(names[geoTool.value] || '')
}

// ===== P5 Sketch =====
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
    p.background('#fafbfc')
    drawGeo(p)
  }

  p.mousePressed = function () {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return
    geoLMX = p.mouseX; geoLMY = p.mouseY
    if (geoTool.value === 'rotate') { geoDrag = true; return }
    if (geoTool.value === 'select' && geoSelected && geoSelected.type === 'point') {
      if (geoPoints[geoSelected.id]) geoDragBase = { ...geoPoints[geoSelected.id] }
    }
    handleClick(p)
    geoDragSel = true
  }

  p.mouseDragged = function () {
    if (geoTool.value === 'rotate' && geoDrag) {
      geoViewT += (p.mouseX - geoLMX) * 0.01
      geoViewP = p.constrain(geoViewP + (p.mouseY - geoLMY) * 0.01, 0.05, Math.PI * 0.45)
      geoLMX = p.mouseX; geoLMY = p.mouseY
      return
    }
    if (geoSelected && geoSelected.type === 'point' && geoDragSel && geoTool.value === 'select' && geoDragBase) {
      const pt = geoPoints[geoSelected.id]
      if (pt) {
        const s = 1 / (GEOM_SCALE * geoZoom)
        const dx = (p.mouseX - geoLMX) * s
        const dy = -(p.mouseY - geoLMY) * s
        const ct = Math.cos(geoViewT), st = Math.sin(geoViewT)
        const cp = Math.cos(geoViewP), sp = Math.sin(geoViewP)
        pt.x = p.constrain(geoDragBase.x + dx * ct + dy * st * sp, -5, 5)
        pt.y = p.constrain(geoDragBase.y + dy * cp, -5, 5)
        pt.z = p.constrain(geoDragBase.z + dx * st - dy * ct * sp, -5, 5)
      }
    }
  }

  p.mouseReleased = () => { geoDrag = false; geoDragSel = false }

  p.mouseWheel = (e) => {
    if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      geoZoom = p.constrain(geoZoom + e.delta * 0.002, 0.3, 3)
      e.preventDefault()
    }
  }
}

function drawGeo(p) {
  const W = p.width, H = p.height, ox = W / 2, oy = H / 2

  // 网格
  if (showGrid.value) {
    p.stroke(210, 215, 225); p.strokeWeight(0.5)
    for (let i = -5; i <= 5; i++) {
      const a = geoProject({ x: i, y: 0, z: -5 }, ox, oy), b = geoProject({ x: i, y: 0, z: 5 }, ox, oy)
      const c = geoProject({ x: -5, y: 0, z: i }, ox, oy), d = geoProject({ x: 5, y: 0, z: i }, ox, oy)
      p.line(a.sx, a.sy, b.sx, b.sy); p.line(c.sx, c.sy, d.sx, d.sy)
    }
    // 地面淡色
    p.noStroke(); p.fill(235, 240, 248, 80); p.beginShape()
    const gp = [geoProject({ x: -5, y: 0, z: -5 }, ox, oy), geoProject({ x: 5, y: 0, z: -5 }, ox, oy), geoProject({ x: 5, y: 0, z: 5 }, ox, oy), geoProject({ x: -5, y: 0, z: 5 }, ox, oy)]
    for (const pt of gp) p.vertex(pt.sx, pt.sy)
    p.endShape(p.CLOSE)
  }

  // 坐标轴
  const axisLen = 5.5, o = geoProject({ x: 0, y: 0, z: 0 }, ox, oy)
  drawAxis(p, ox, oy, axisLen, '#c0392b', 'X', 1, 0, 0)
  drawAxis(p, ox, oy, axisLen, '#27ae60', 'Y', 0, 1, 0)
  drawAxis(p, ox, oy, axisLen, '#2980b9', 'Z', 0, 0, 1)
  p.fill('#1a1a2e'); p.noStroke(); p.circle(o.sx, o.sy, 5)
  p.textSize(10); p.textAlign(p.RIGHT, p.TOP); p.text('O', o.sx - 5, o.sy + 4)

  // 排序面 (画家算法)
  const allFaces = geoFaces.map((f, i) => {
    const pts = f.pts.map(id => geoPoints[id]).filter(Boolean)
    if (pts.length < 3) return null
    let sumZ = 0
    for (const pt of pts) sumZ += geoRotate(pt, geoViewT, geoViewP).z
    return { idx: i, face: f, pts, avgZ: sumZ / pts.length }
  }).filter(Boolean)
  allFaces.sort((a, b) => a.avgZ - b.avgZ)

  // 画面
  allFaces.forEach(item => {
    if (item.pts.length < 3) return
    const fc = p.color(item.face.color || fillColor.value)
    fc.setAlpha(Math.round(faceAlpha.value * 255))
    p.fill(fc); p.stroke(item.face.color || fillColor.value); p.strokeWeight(0.8)
    p.beginShape()
    for (const pt of item.pts) { const s = geoProject(pt, ox, oy); p.vertex(s.sx, s.sy) }
    p.endShape(p.CLOSE)
  })

  // 隐藏线算法
  const faceFront = geoFaces.map(f => {
    if (f.pts.length < 3) return true
    const p0 = geoPoints[f.pts[0]], p1 = geoPoints[f.pts[1]], p2 = geoPoints[f.pts[2]]
    if (!p0 || !p1 || !p2) return true
    const ux = p1.x - p0.x, uy = p1.y - p0.y, uz = p1.z - p0.z
    const vx = p2.x - p0.x, vy = p2.y - p0.y, vz = p2.z - p0.z
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    const rn = geoRotate({ x: nx, y: ny, z: nz }, geoViewT, geoViewP)
    return rn.z < 0
  })

  const edgeFaceMap = {}
  geoFaces.forEach((f, fi) => {
    for (let k = 0; k < f.pts.length; k++) {
      const a = f.pts[k], b = f.pts[(k + 1) % f.pts.length]
      const key = Math.min(a, b) + '_' + Math.max(a, b)
      if (!edgeFaceMap[key]) edgeFaceMap[key] = []
      if (!edgeFaceMap[key].includes(fi)) edgeFaceMap[key].push(fi)
    }
  })

  geoEdges.forEach(e => {
    const key = Math.min(e.a, e.b) + '_' + Math.max(e.a, e.b)
    const adj = edgeFaceMap[key] || []
    if (e._userDash === undefined) e._autoDash = (adj.length > 0 && adj.every(fi => !faceFront[fi]))
  })

  // 画边（实线）
  p.strokeWeight(2)
  geoEdges.forEach(e => {
    const isDash = (e._userDash !== undefined) ? e._userDash : e._autoDash
    if (isDash) return
    const p1 = geoPoints[e.a], p2 = geoPoints[e.b]
    if (!p1 || !p2) return
    const s1 = geoProject(p1, ox, oy), s2 = geoProject(p2, ox, oy)
    p.stroke(e.color || strokeColor.value)
    p.line(s1.sx, s1.sy, s2.sx, s2.sy)
  })
  // 虚线边
  p.drawingContext.setLineDash([5, 3])
  geoEdges.forEach(e => {
    const isDash = (e._userDash !== undefined) ? e._userDash : e._autoDash
    if (!isDash) return
    const p1 = geoPoints[e.a], p2 = geoPoints[e.b]
    if (!p1 || !p2) return
    const s1 = geoProject(p1, ox, oy), s2 = geoProject(p2, ox, oy)
    p.stroke(e.color || strokeColor.value)
    p.line(s1.sx, s1.sy, s2.sx, s2.sy)
  })
  p.drawingContext.setLineDash([])

  // 画点
  geoPoints.forEach((pt, i) => {
    const s = geoProject(pt, ox, oy)
    const isSel = geoSelected && geoSelected.type === 'point' && geoSelected.id === i
    p.fill(pt.color || pointColor.value)
    p.noStroke(); p.circle(s.sx, s.sy, isSel ? 9 : 6)
    if (isSel) { p.noFill(); p.stroke('#e67e22'); p.strokeWeight(2); p.circle(s.sx, s.sy, 11) }
    if (pt.label) { p.fill('#1a1a2e'); p.noStroke(); p.textSize(11); p.textAlign(p.LEFT, p.BOTTOM); p.text(pt.label, s.sx + 7, s.sy - 4) }
  })

  // 选择高亮
  if (geoSelected && geoSelected.type === 'edge') {
    const e = geoEdges[geoSelected.id]
    if (e) {
      const p1 = geoPoints[e.a], p2 = geoPoints[e.b]
      if (p1 && p2) {
        const s1 = geoProject(p1, ox, oy), s2 = geoProject(p2, ox, oy)
        if (e.dash) p.drawingContext.setLineDash([5, 3])
        p.stroke('#e67e22'); p.strokeWeight(3); p.line(s1.sx, s1.sy, s2.sx, s2.sy)
        p.drawingContext.setLineDash([])
      }
    }
  }
  if (geoSelected && geoSelected.type === 'face') {
    const f = geoFaces[geoSelected.id]
    if (f && f.pts.length >= 3) {
      const fpts = f.pts.map(id => geoPoints[id]).filter(Boolean)
      p.noFill(); p.stroke('#e67e22'); p.strokeWeight(2.5); p.drawingContext.setLineDash([5, 3])
      p.beginShape()
      for (const pt of fpts) { const s = geoProject(pt, ox, oy); p.vertex(s.sx, s.sy) }
      p.endShape(p.CLOSE)
      p.drawingContext.setLineDash([])
    }
  }

  // 面工具临时预览
  if (geoTool.value === 'face' && geoTempFacePts.length > 0) {
    const tpts = geoTempFacePts.map(id => geoPoints[id]).filter(Boolean)
    p.noFill(); p.stroke('#e67e22'); p.strokeWeight(2); p.drawingContext.setLineDash([4, 3])
    p.beginShape()
    for (const pt of tpts) { const s = geoProject(pt, ox, oy); p.vertex(s.sx, s.sy) }
    p.endShape()
    p.drawingContext.setLineDash([])
    p.fill('#e67e22'); p.noStroke(); p.textSize(10)
    tpts.forEach((pt, i) => { const s = geoProject(pt, ox, oy); p.text('' + (i + 1), s.sx + 5, s.sy - 5) })
  }

  // 边工具起点高亮
  if (geoTool.value === 'edge' && geoEdgeFirst !== null) {
    const fp = geoPoints[geoEdgeFirst]
    if (fp) {
      const fs = geoProject(fp, ox, oy)
      p.noFill(); p.stroke('#e67e22'); p.strokeWeight(2.5); p.drawingContext.setLineDash([5, 3]); p.circle(fs.sx, fs.sy, 12); p.drawingContext.setLineDash([])
      p.fill('#e67e22'); p.noStroke(); p.textSize(10); p.text('起点', fs.sx + 10, fs.sy - 8)
    }
  }

  // 顶栏
  p.fill(0, 0, 0, 150); p.noStroke(); p.rect(4, 2, Math.min(p.width - 8, 300), 18, 3)
  p.fill('#fff'); p.textSize(10); p.textAlign(p.LEFT, p.TOP)
  const n = { point: '✏️点', select: '👆选择', edge: '📏边', face: '△面', label: '🏷️标注', color: '🎨着色', delete: '🗑️删除', rotate: '🔄旋转' }
  p.text(`${n[geoTool.value] || geoTool.value} · 点${geoPoints.length} 边${geoEdges.length} 面${geoFaces.length}`, 8, 5)
}

function drawAxis(p, ox, oy, len, color, label, dx, dy, dz) {
  const pos = geoProject({ x: dx * len, y: dy * len, z: dz * len }, ox, oy)
  const neg = geoProject({ x: -dx * len, y: -dy * len, z: -dz * len }, ox, oy)
  p.stroke(color); p.strokeWeight(2)
  p.line(neg.sx, neg.sy, pos.sx, pos.sy)
  p.fill(color); p.noStroke()
  p.triangle(pos.sx, pos.sy, pos.sx - 8, pos.sy - 3, pos.sx - 8, pos.sy + 3)
  p.textSize(12); p.textAlign(p.LEFT, p.BOTTOM); p.text(label, pos.sx + 2, pos.sy - 2)
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue
    const t = geoProject({ x: dx * i, y: dy * i, z: dz * i }, ox, oy)
    p.stroke(color); p.strokeWeight(1)
    p.line(t.sx - 4, t.sy - 4, t.sx + 4, t.sy + 4)
    p.fill(color); p.noStroke()
    p.textSize(8); p.textAlign(p.RIGHT, p.CENTER); p.text(i, t.sx - 5, t.sy)
  }
}

// ===== 点击处理 =====
function handleClick(p) {
  const ox = p.width / 2, oy = p.height / 2

  function nearestPoint() {
    let best = null, bestD = 20 / (GEOM_SCALE * geoZoom)
    for (let i = 0; i < geoPoints.length; i++) {
      const s = geoProject(geoPoints[i], ox, oy)
      const d = Math.hypot(p.mouseX - s.sx, p.mouseY - s.sy)
      if (d < 15 && (!best || d < bestD)) { best = i; bestD = d }
    }
    return best
  }

  function nearestEdge() {
    for (let i = 0; i < geoEdges.length; i++) {
      const p1 = geoPoints[geoEdges[i].a], p2 = geoPoints[geoEdges[i].b]
      if (!p1 || !p2) continue
      const s1 = geoProject(p1, ox, oy), s2 = geoProject(p2, ox, oy)
      if (distToSegment(p.mouseX, p.mouseY, s1.sx, s1.sy, s2.sx, s2.sy) < 10) return i
    }
    return null
  }

  const tool = geoTool.value

  if (tool === 'point') {
    const r = geoUnproject(p.mouseX, p.mouseY, ox, oy, zPlane.value)
    let lbl = ''
    if (labelInput.value.trim()) {
      const parts = labelInput.value.split(/[,，\s]+/).filter(Boolean)
      if (parts.length > 0) { lbl = parts.shift(); labelInput.value = parts.join(',') }
    }
    if (!lbl) lbl = geoLabel()
    geoPoints.push({ x: r.x, y: r.y, z: r.z, label: lbl, color: pointColor.value })
    geoSelected = { type: 'point', id: geoPoints.length - 1 }
    updateInfo(`已放置点 ${lbl} (${r.x.toFixed(1)}, ${r.y.toFixed(1)}, ${r.z.toFixed(1)})`)
    return
  }

  if (tool === 'select') {
    const np = nearestPoint()
    if (np !== null) { geoSelected = { type: 'point', id: np }; updateInfo('已选中点 ' + geoPoints[np].label); return }
    const ne = nearestEdge()
    if (ne !== null) {
      if (geoSelected && geoSelected.type === 'edge' && geoSelected.id === ne) {
        // Toggle dash
        geoEdges[ne].dash = !geoEdges[ne].dash
        geoEdges[ne]._userDash = geoEdges[ne].dash
        updateInfo(geoEdges[ne].dash ? '已切换为虚线' : '已切换为实线')
        return
      }
      geoSelected = { type: 'edge', id: ne }
      updateInfo(`已选中边（${geoEdges[ne].dash ? '虚线' : '实线'}，再次点击切换）`)
      return
    }
    geoSelected = null; updateInfo('未选中元素')
    return
  }

  if (tool === 'edge') {
    const np2 = nearestPoint()
    if (np2 === null) return
    if (geoEdgeFirst === null) { geoEdgeFirst = np2; updateInfo('已选起点 ' + geoPoints[np2].label + '，请点第二个点'); return }
    if (geoEdgeFirst === np2) { geoEdgeFirst = null; updateInfo('已取消'); return }
    geoEdges.push({ a: geoEdgeFirst, b: np2, color: strokeColor.value, dash: dashMode.value })
    if (dashMode.value) geoEdges[geoEdges.length - 1]._userDash = true
    updateInfo(`已连线 ${geoPoints[geoEdgeFirst].label}-${geoPoints[np2].label}${dashMode.value ? ' [虚线]' : ''}`)
    geoEdgeFirst = null
    return
  }

  if (tool === 'face') {
    const np3 = nearestPoint()
    if (np3 === null) return
    if (geoTempFacePts.length >= 3 && np3 === geoTempFacePts[0]) {
      geoFaces.push({ pts: geoTempFacePts.slice(), color: fillColor.value })
      updateInfo(`已创建面（${geoTempFacePts.length}边形）`)
      geoTempFacePts = []
      return
    }
    if (geoTempFacePts.includes(np3)) {
      geoTempFacePts = geoTempFacePts.filter(id => id !== np3)
      updateInfo('移除点，当前: ' + geoTempFacePts.map(id => geoPoints[id].label).join(', '))
      return
    }
    geoTempFacePts.push(np3)
    updateInfo('面点: ' + geoTempFacePts.map(id => geoPoints[id].label).join(', ') + (geoTempFacePts.length >= 3 ? ' → 点击首点闭合' : ''))
    return
  }

  if (tool === 'label') {
    const np4 = nearestPoint()
    if (np4 === null) return
    const newLabel = prompt('输入标签（如 A, B, C）：', geoPoints[np4].label || '')
    if (newLabel) { geoPoints[np4].label = newLabel; updateInfo('点标签已设为 ' + newLabel) }
    return
  }

  if (tool === 'color') {
    const np5 = nearestPoint()
    if (np5 !== null) { geoPoints[np5].color = pointColor.value; updateInfo('已更新点颜色'); return }
    const ne2 = nearestEdge()
    if (ne2 !== null) { geoEdges[ne2].color = strokeColor.value; updateInfo('已更新边颜色'); return }
    for (let fi = geoFaces.length - 1; fi >= 0; fi--) {
      const f = geoFaces[fi]
      if (f.pts.length < 3) continue
      const poly = f.pts.map(id => { const s = geoProject(geoPoints[id], ox, oy); return [s.sx, s.sy] })
      if (pointInPolygon(p.mouseX, p.mouseY, poly)) { f.color = fillColor.value; updateInfo('已更新面颜色'); return }
    }
    updateInfo('未选中可着色元素')
    return
  }

  if (tool === 'delete') {
    const np6 = nearestPoint()
    if (np6 !== null) {
      geoEdges = geoEdges.filter(e => e.a !== np6 && e.b !== np6)
      geoFaces = geoFaces.filter(f => !f.pts.includes(np6))
      geoEdges.forEach(e => { if (e.a > np6) e.a--; if (e.b > np6) e.b-- })
      geoFaces.forEach(f => { for (let k = 0; k < f.pts.length; k++) if (f.pts[k] > np6) f.pts[k]-- })
      geoPoints.splice(np6, 1)
      updateInfo('已删除点')
      return
    }
    const ne3 = nearestEdge()
    if (ne3 !== null) { geoEdges.splice(ne3, 1); updateInfo('已删除边'); return }
    for (let fi2 = geoFaces.length - 1; fi2 >= 0; fi2--) {
      const f2 = geoFaces[fi2]
      const poly2 = f2.pts.map(id => { const s = geoProject(geoPoints[id], ox, oy); return [s.sx, s.sy] })
      if (pointInPolygon(p.mouseX, p.mouseY, poly2)) { geoFaces.splice(fi2, 1); updateInfo('已删除面'); return }
    }
  }
}

function onCanvasReady(inst) {
  p5Inst = inst
}

// Watch dashMode
watch(dashMode, (v) => {
  geoEdges.forEach(e => {
    e.dash = v
    if (v) e._userDash = true; else { delete e._userDash; delete e._autoDash }
  })
  updateInfo(v ? '全部边已切换为虚线' : '全部边已切换为实线')
})

onBeforeUnmount(() => {
  if (p5Inst) { p5Inst.remove(); p5Inst = null }
})
</script>

<style scoped>
.geo-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 10px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-lighter);
  border-radius: var(--radius-lg);
  align-items: center;
  margin-bottom: 10px;
}
.geo-tool-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.geo-tool-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
  min-width: 28px;
}
.geo-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  padding: 6px 16px;
  background: var(--card-bg-warm);
  border: 1px solid var(--border-lighter);
  border-radius: var(--radius);
  margin-bottom: 10px;
  font-size: 11px;
  color: var(--text-secondary);
}
.geo-settings span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.geo-info {
  padding: 6px 14px;
  font-size: 11px;
  color: var(--text-regular);
  background: var(--card-bg-warm);
  border-top: 1px solid var(--border-lighter);
  line-height: 1.6;
}
.canvas-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-lighter);
  box-shadow: 0 2px 12px rgba(26,46,60,0.06);
  overflow: hidden;
  margin-bottom: 14px;
}
</style>
