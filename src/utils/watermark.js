/**
 * Unified Watermark Utility
 * Provides tiled watermark patterns for:
 *  - Screen display (CSS overlay)
 *  - Canvas export (html2canvas)
 *  - Print/CSS @media print
 *  - PDF/window.print() export
 *
 * Content: school name, username, timestamp, anti-leak tag
 */

import { useAppStore } from '@/stores/app'

const DEFAULT_CONFIG = {
  enabled: true,
  text: '内部资料·仅供教学使用',
  fontSize: 14,
  opacity: 0.06,
  color: '#000000',
  rotate: -25,
  gapX: 240,
  gapY: 140,
  antiLeak: true
}

export function createWatermarkCanvas(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  if (!cfg.enabled) return null

  const store = useAppStore()
  const schoolName = store.schoolName || '威学一百'
  const userName = store.currentUser?.displayName || ''
  const timestamp = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Measure text
  const fontSize = cfg.fontSize
  ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`

  const lines = [schoolName]
  if (userName) lines.push(userName)
  lines.push(timestamp)
  if (cfg.antiLeak) lines.push('禁止外传 · CONFIDENTIAL')

  const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width))
  const lineHeight = fontSize * 1.4
  const totalHeight = lines.length * lineHeight

  canvas.width = cfg.gapX
  canvas.height = cfg.gapY

  // Center the text block
  const startX = (cfg.gapX - maxWidth) / 2
  const startY = (cfg.gapY - totalHeight) / 2

  ctx.save()
  ctx.globalAlpha = cfg.opacity
  ctx.fillStyle = cfg.color

  // Main diagonal text
  ctx.translate(cfg.gapX / 2, cfg.gapY / 2)
  ctx.rotate((cfg.rotate * Math.PI) / 180)

  lines.forEach((line, i) => {
    const x = -maxWidth / 2
    const y = -totalHeight / 2 + (i + 1) * lineHeight
    ctx.fillText(line, x, y)
  })

  // Additional offset copies for density
  ctx.translate(40, 0)
  ctx.globalAlpha = cfg.opacity * 0.5
  lines.forEach((line, i) => {
    const x = -maxWidth / 2
    const y = -totalHeight / 2 + (i + 1) * lineHeight
    ctx.fillText(line, x, y)
  })

  ctx.restore()
  return canvas
}

export function applyWatermarkToStyle(container, config = {}) {
  const canvas = createWatermarkCanvas(config)
  if (!canvas) return

  const url = canvas.toDataURL('image/png')
  container.style.backgroundImage = `url(${url})`
  container.style.backgroundRepeat = 'repeat'
  container.style.backgroundPosition = 'center'
}

export function getWatermarkStyle(config = {}) {
  const canvas = createWatermarkCanvas(config)
  if (!canvas) return ''
  const url = canvas.toDataURL('image/png')
  return `background-image:url(${url});background-repeat:repeat;background-position:center;`
}

export function injectPrintWatermark(config = {}) {
  const styleId = 'dse-watermark-print-style'
  if (document.getElementById(styleId)) return

  const canvas = createWatermarkCanvas({ ...config, opacity: 0.04, color: '#333333' })
  if (!canvas) return

  const url = canvas.toDataURL('image/png')
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @media print {
      body::after {
        content: '';
        position: fixed;
        inset: 0;
        background-image: url(${url});
        background-repeat: repeat;
        background-position: center;
        pointer-events: none;
        z-index: 9999;
      }
    }
  `
  document.head.appendChild(style)
}

export function removePrintWatermark() {
  const style = document.getElementById('dse-watermark-print-style')
  if (style) style.remove()
}
