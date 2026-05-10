<template>
  <div class="tp-bg" ref="bgRef">
    <canvas ref="canvasRef" class="tp-canvas"></canvas>
    <div class="tp-overlay"></div>
    <div class="tp-vignette"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const bgRef = ref(null)
const canvasRef = ref(null)
let animId = null
let mouseX = 0.5
let mouseY = 0.5
let targetX = 0.5
let targetY = 0.5

const nodes = []
const NODE_COUNT = 45
const mathFormulas = ['f(x)', '∑', '∫', 'lim', 'π', 'd/dx', 'eˣ', '√', 'Δ', '∞', '∂', '∏', 'sin', 'cos', 'log', '∈', '∀', '∃']

function initNodes(w, h) {
  nodes.length = 0
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      formula: mathFormulas[Math.floor(Math.random() * mathFormulas.length)]
    })
  }
}

// Scanning lines
const scanLines = []
const SCAN_COUNT = 3

function initScanLines(w, h) {
  scanLines.length = 0
  for (let i = 0; i < SCAN_COUNT; i++) {
    scanLines.push({
      y: Math.random() * h,
      speed: 0.3 + Math.random() * 0.5,
      alpha: 0.03 + Math.random() * 0.04,
      x: Math.random() * w * 0.6 + w * 0.2,
      width: 60 + Math.random() * 120
    })
  }
}

function draw(timestamp) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width = canvas.offsetWidth
  const h = canvas.height = canvas.offsetHeight

  if (nodes.length === 0) {
    initNodes(w, h)
    initScanLines(w, h)
  }

  targetX += (mouseX - targetX) * 0.03
  targetY += (mouseY - targetY) * 0.03

  ctx.clearRect(0, 0, w, h)

  // Tech grid
  const gridSize = 70
  const gridOffsetX = (targetX - 0.5) * 20
  const gridOffsetY = (targetY - 0.5) * 20
  ctx.strokeStyle = 'rgba(99, 120, 220, 0.03)'
  ctx.lineWidth = 0.5
  for (let x = gridOffsetX % gridSize; x < w; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = gridOffsetY % gridSize; y < h; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Scanning lines
  scanLines.forEach(sl => {
    sl.y += sl.speed
    if (sl.y > h + 10) sl.y = -10
    const gradient = ctx.createLinearGradient(sl.x - sl.width / 2, 0, sl.x + sl.width / 2, 0)
    gradient.addColorStop(0, 'rgba(99, 144, 255, 0)')
    gradient.addColorStop(0.5, `rgba(99, 144, 255, ${sl.alpha})`)
    gradient.addColorStop(1, 'rgba(99, 144, 255, 0)')
    ctx.strokeStyle = gradient
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(sl.x - sl.width / 2, sl.y)
    ctx.lineTo(sl.x + sl.width / 2, sl.y)
    ctx.stroke()
  })

  // Update & draw nodes
  nodes.forEach(n => {
    n.x += n.vx + (targetX - 0.5) * 0.3
    n.y += n.vy + (targetY - 0.5) * 0.3
    if (n.x < -20) n.x = w + 20
    if (n.x > w + 20) n.x = -20
    if (n.y < -20) n.y = h + 20
    if (n.y > h + 20) n.y = -20

    n.pulse += n.pulseSpeed
    const pulseAlpha = n.alpha * (0.7 + 0.3 * Math.sin(n.pulse))

    // Glow
    const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4)
    glow.addColorStop(0, `rgba(129, 140, 248, ${pulseAlpha})`)
    glow.addColorStop(0.5, `rgba(99, 102, 241, ${pulseAlpha * 0.4})`)
    glow.addColorStop(1, 'rgba(99, 102, 241, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2)
    ctx.fill()

    // Core dot
    ctx.fillStyle = `rgba(199, 210, 254, ${pulseAlpha})`
    ctx.beginPath()
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
    ctx.fill()

    // Formula label (occasional)
    if (Math.sin(n.pulse * 3) > 0.7) {
      ctx.fillStyle = `rgba(165, 180, 252, ${pulseAlpha * 0.5})`
      ctx.font = `${9 + n.r}px "Cascadia Code", "SF Mono", monospace`
      ctx.fillText(n.formula, n.x + n.r * 2 + 4, n.y + 3)
    }
  })

  // Connection lines between nearby nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 140) {
        const alpha = (1 - dist / 140) * 0.08
        ctx.beginPath()
        ctx.moveTo(nodes[i].x, nodes[i].y)
        ctx.lineTo(nodes[j].x, nodes[j].y)
        ctx.strokeStyle = `rgba(99, 130, 240, ${alpha})`
        ctx.lineWidth = 0.4
        ctx.stroke()
      }
    }
  }

  // Large data flow arcs
  const t = timestamp * 0.0003
  for (let k = 0; k < 2; k++) {
    const cx = w * (0.3 + k * 0.4)
    const cy = h * 0.5
    const rx = 120 + k * 40
    const ry = 80 + k * 20
    ctx.strokeStyle = `rgba(99, 140, 255, ${0.03 - k * 0.01})`
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, t + k * 1.5, 0, Math.PI * 1.5)
    ctx.stroke()
  }

  animId = requestAnimationFrame(draw)
}

function onMouseMove(e) {
  mouseX = e.clientX / window.innerWidth
  mouseY = e.clientY / window.innerHeight
  if (bgRef.value) {
    bgRef.value.style.setProperty('--tp-ox', ((mouseX - 0.5) * 30) + 'px')
    bgRef.value.style.setProperty('--tp-oy', ((mouseY - 0.5) * 30) + 'px')
  }
}

onMounted(() => {
  animId = requestAnimationFrame(draw)
  window.addEventListener('mousemove', onMouseMove)
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<style scoped>
.tp-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.tp-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.tp-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 30% 50%, rgba(99, 102, 241, 0.04) 0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 70% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 60%);
}

.tp-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(3, 5, 16, 0.5) 100%);
}
</style>
