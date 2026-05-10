<template>
  <div class="pp-bg" ref="bgRef">
    <div class="pp-grid"></div>
    <div class="pp-orb pp-orb-1"></div>
    <div class="pp-orb pp-orb-2"></div>
    <canvas ref="canvasRef" class="pp-canvas"></canvas>
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

const dots = []
const DOT_COUNT = 60
const lines = []

function initDots(w, h) {
  dots.length = 0
  for (let i = 0; i < DOT_COUNT; i++) {
    dots.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.3
    })
  }
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width = canvas.offsetWidth
  const h = canvas.height = canvas.offsetHeight

  if (dots.length === 0) initDots(w, h)

  targetX += (mouseX - targetX) * 0.05
  targetY += (mouseY - targetY) * 0.05

  ctx.clearRect(0, 0, w, h)

  // Update & draw dots
  dots.forEach(d => {
    d.x += d.vx + (targetX - 0.5) * 0.4
    d.y += d.vy + (targetY - 0.5) * 0.4
    if (d.x < 0) d.x = w
    if (d.x > w) d.x = 0
    if (d.y < 0) d.y = h
    if (d.y > h) d.y = 0

    ctx.beginPath()
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(99, 144, 255, ${d.alpha})`
    ctx.fill()
  })

  // Draw connection lines between nearby dots
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx = dots[i].x - dots[j].x
      const dy = dots[i].y - dots[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 120) {
        const alpha = (1 - dist / 120) * 0.12
        ctx.beginPath()
        ctx.moveTo(dots[i].x, dots[i].y)
        ctx.lineTo(dots[j].x, dots[j].y)
        ctx.strokeStyle = `rgba(99, 144, 255, ${alpha})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }
    }
  }

  animId = requestAnimationFrame(draw)
}

function onMouseMove(e) {
  mouseX = e.clientX / window.innerWidth
  mouseY = e.clientY / window.innerHeight

  if (bgRef.value) {
    const ox = (mouseX - 0.5) * 20
    const oy = (mouseY - 0.5) * 20
    bgRef.value.style.setProperty('--pp-ox', ox + 'px')
    bgRef.value.style.setProperty('--pp-oy', oy + 'px')
  }
}

onMounted(() => {
  draw()
  window.addEventListener('mousemove', onMouseMove)
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<style scoped>
.pp-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.pp-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%);
}

.pp-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  opacity: 0.12;
}

.pp-orb-1 {
  width: 700px; height: 700px;
  background: #3b82f6;
  top: -250px; left: -150px;
  animation: orb1 18s ease-in-out infinite;
}

.pp-orb-2 {
  width: 550px; height: 550px;
  background: #8b5cf6;
  bottom: -200px; right: -120px;
  animation: orb2 15s ease-in-out infinite;
}

@keyframes orb1 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(100px, 60px); }
  50% { transform: translate(30px, -30px); }
  75% { transform: translate(-50px, 40px); }
}

@keyframes orb2 {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-80px, -40px); }
  50% { transform: translate(60px, 30px); }
  75% { transform: translate(-20px, -50px); }
}

.pp-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
