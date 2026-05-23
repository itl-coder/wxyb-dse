/**
 * useWatermark — 统一水印配置中心
 * 供 AppWatermark.vue / exportHelper / printTemplate 使用
 * 所有水印配置读取自此单一入口，避免散落重复
 */
import { settingsService } from '@/services/dataService'

const WM_FALLBACK = {
  enabled: true,
  text: '内部资料·仅供教学使用',
  rotation: -22,
  opacity: 0.06,
  fontSize: 16,
  gapX: 120,
  gapY: 80,
  color: 'rgba(0,0,0,0.06)',
  showTimestamp: true
}

/**
 * 创建独立的平铺水印 Canvas（用于导出管线叠加）
 * 供 P2/P3 exportPipeline 使用
 * @param {number} width - 目标画布宽度
 * @param {number} height - 目标画布高度
 * @param {object} [overrides] - 可覆盖的配置项
 * @param {string} [overrides.text] - 水印文字
 * @param {string} [overrides.operatorName] - 操作人姓名
 * @returns {HTMLCanvasElement|null} 水印画布，水印禁用时返回 null
 */
export function generateTiledWatermarkCanvas(width, height, overrides = {}) {
  const c = getWatermarkConfig()
  if (!c.enabled) return null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const angle = (c.rotation * Math.PI) / 180
  const text = overrides.text || c.text
  const fontSize = c.fontSize
  const gapX = c.gapX
  const gapY = c.gapY

  ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const metrics = ctx.measureText(text)
  const tw = metrics.width + gapX
  const th = fontSize + gapY

  // 以画布中心旋转
  const cx = width / 2
  const cy = height / 2
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.translate(-cx, -cy)

  // 平铺水印文字
  ctx.fillStyle = c.color || 'rgba(0,0,0,0.06)'
  ctx.globalAlpha = Math.min(c.opacity * 5, 0.5)
  const margin = Math.max(tw, th) * 2
  for (let y = -margin; y < height + margin; y += th) {
    for (let x = -margin; x < width + margin; x += tw) {
      ctx.fillText(text, x, y)
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)

  // 时间戳
  if (c.showTimestamp) {
    ctx.fillStyle = '#999999'
    ctx.globalAlpha = 0.45
    ctx.font = '10px "SF Mono", "Cascadia Code", monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    const ts = new Date().toLocaleString('zh-CN')
    ctx.fillText(ts, width - 14, height - 8)
  }

  // 操作人标识
  if (overrides.operatorName) {
    ctx.fillStyle = '#999999'
    ctx.globalAlpha = 0.35
    ctx.font = '9px "SF Mono", "Cascadia Code", monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`操作人: ${overrides.operatorName}`, 10, height - 8)
  }

  return canvas
}

/** 同步读取水印配置（非响应式，供工具函数使用） */
export function getWatermarkConfig() {
  const s = settingsService.get()
  return {
    enabled: s.watermarkEnabled !== false,
    text: s.watermarkText || WM_FALLBACK.text,
    rotation: s.watermarkRotation ?? WM_FALLBACK.rotation,
    opacity: s.watermarkOpacity ?? WM_FALLBACK.opacity,
    fontSize: s.watermarkFontSize ?? WM_FALLBACK.fontSize,
    gapX: s.watermarkGapX ?? WM_FALLBACK.gapX,
    gapY: s.watermarkGapY ?? WM_FALLBACK.gapY,
    color: s.watermarkColor || WM_FALLBACK.color,
    showTimestamp: s.watermarkShowTimestamp !== false
  }
}

/**
 * 生成用于 html2canvas 导出的覆盖水印 HTML
 * 使用绝对定位 span 平铺，确保被 html2canvas 捕获
 */
export function getOverlayWatermarkHTML() {
  const c = getWatermarkConfig()
  if (!c.enabled) return ''
  const rows = 5
  const cols = 4
  const spans = []
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      const top = (r / rows) * 100
      const left = (i / cols) * 100
      spans.push(
        `<span style="position:absolute;top:${top}%;left:${left}%;` +
        `transform:rotate(${c.rotation}deg);font-size:${c.fontSize}px;` +
        `color:${c.color};pointer-events:none;user-select:none;` +
        `white-space:nowrap;font-weight:500;">${c.text}</span>`
      )
    }
  }
  const meta = c.showTimestamp
    ? `<span style="position:absolute;bottom:8px;right:12px;font-size:10px;color:#999;pointer-events:none;font-family:monospace;">${new Date().toLocaleString('zh-CN')}</span>`
    : ''
  return `<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:10;opacity:${c.opacity};">${spans.join('')}${meta}</div>`
}

/**
 * 在 Canvas 上绘制平铺水印（用于 html2canvas 导出后叠加，确保水印可见）
 * @param {HTMLCanvasElement} canvas
 */
export function drawWatermarkOnCanvas(canvas) {
  const c = getWatermarkConfig()
  if (!c.enabled) return

  const ctx = canvas.getContext('2d')
  ctx.save()

  const angle = (c.rotation * Math.PI) / 180
  const text = c.text
  const fontSize = c.fontSize
  ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const metrics = ctx.measureText(text)
  const tw = metrics.width + c.gapX
  const th = fontSize + c.gapY

  // 以画布中心旋转
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.translate(-cx, -cy)

  // 平铺文字
  ctx.fillStyle = '#000000'
  ctx.globalAlpha = c.opacity * 5
  const margin = Math.max(tw, th) * 2
  for (let y = -margin; y < canvas.height + margin; y += th) {
    for (let x = -margin; x < canvas.width + margin; x += tw) {
      ctx.fillText(text, x, y)
    }
  }

  ctx.restore()

  // 时间戳
  if (c.showTimestamp) {
    ctx.save()
    ctx.fillStyle = '#999999'
    ctx.globalAlpha = 0.45
    ctx.font = '10px "SF Mono", "Cascadia Code", monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(new Date().toLocaleString('zh-CN'), canvas.width - 14, canvas.height - 8)
    ctx.restore()
  }
}

/**
 * 生成打印水印 CSS（@media print 内使用）
 */
export function getPrintWatermarkCSS() {
  const c = getWatermarkConfig()
  if (!c.enabled) return ''
  return `
    .wm-print-overlay{
      position:fixed;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:9999;overflow:hidden;
      opacity:${c.opacity};
    }
    .wm-print-overlay span{
      position:absolute;font-size:${c.fontSize}px;color:${c.color};
      font-weight:500;white-space:nowrap;user-select:none;
      transform:rotate(${c.rotation}deg);
    }
    @media print{
      .wm-print-overlay{position:fixed}
    }`
}

/**
 * 生成打印水印 HTML（4x4 网格）
 */
export function getPrintWatermarkHTML() {
  const c = getWatermarkConfig()
  if (!c.enabled) return ''
  const rows = 4; const cols = 4
  let spans = ''
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      const top = (r / rows) * 100
      const left = (i / cols) * 100
      spans += `<span style="top:${top}%;left:${left}%">${c.text}</span>`
    }
  }
  const meta = c.showTimestamp
    ? `<div style="position:fixed;bottom:12px;right:16px;font-size:10px;color:#999;z-index:10000;pointer-events:none;font-family:monospace;">${new Date().toLocaleString('zh-CN')}</div>`
    : ''
  return `<div class="wm-print-overlay">${spans}</div>${meta}`
}
