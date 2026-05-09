// Watermark utility — tiled scattered pattern for print/export
// Unified config stored in localStorage.dse_watermark

const DEFAULT_CONFIG = {
  enabled: true,
  text: '内部资料·仅供家长会使用',
  rotation: -22,
  opacity: 0.06,
  fontSize: 16,
  gapX: 120,
  gapY: 80,
  color: 'rgba(0,0,0,0.06)',
  showTimestamp: true
}

export function getWatermarkConfig() {
  const saved = localStorage.getItem('dse_watermark')
  if (saved) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
    } catch { /* fall through */ }
  }
  return { ...DEFAULT_CONFIG }
}

export function saveWatermarkConfig(config) {
  localStorage.setItem('dse_watermark', JSON.stringify(config))
}

export function getWatermarkStyle() {
  const config = getWatermarkConfig()
  if (!config.enabled) return ''
  return `
    .wm-container {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 9999; overflow: hidden;
    }
    .wm-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      width: 120%; height: 120%; margin: -5% 0 0 -5%;
      transform: rotate(${config.rotation}deg);
    }
    .wm-cell {
      display: flex; align-items: center; justify-content: center;
      opacity: ${config.opacity};
    }
    .wm-cell span {
      font-size: ${config.fontSize}px; color: ${config.color}; font-weight: 500;
      white-space: nowrap; user-select: none;
    }
    .wm-meta {
      position: fixed; bottom: 12px; right: 16px;
      font-size: 10px; color: #999; z-index: 10000;
      pointer-events: none; font-family: monospace;
    }
    @media print {
      .wm-container { position: fixed; }
    }
  `
}

export function getWatermarkHTML() {
  const config = getWatermarkConfig()
  if (!config.enabled) return ''
  const now = new Date().toLocaleString('zh-CN')
  const username = localStorage.getItem('dse_username') || '管理员'
  const cells = Array.from({ length: 16 }, () => `<div class="wm-cell"><span>${config.text}</span></div>`).join('')
  const meta = config.showTimestamp ? `<div class="wm-meta">${username} · ${now}</div>` : ''
  return `<div class="wm-container"><div class="wm-grid">${cells}</div></div>${meta}`
}

/**
 * Generate watermark overlay HTML for html2canvas export containers.
 * Uses absolutely positioned spans tiled across the container.
 */
export function getWatermarkOverlayHTML() {
  const config = getWatermarkConfig()
  if (!config.enabled) return ''
  const rows = 6
  const cols = 5
  const spans = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const top = (r / rows) * 100
      const left = (c / cols) * 100
      spans.push(
        `<span style="position:absolute;top:${top}%;left:${left}%;` +
        `transform:rotate(${config.rotation}deg);font-size:${config.fontSize}px;` +
        `color:${config.color};opacity:${config.opacity * 100 / 0.06 * 0.06};` +
        `pointer-events:none;user-select:none;white-space:nowrap;font-weight:500;">` +
        `${config.text}</span>`
      )
    }
  }
  const meta = config.showTimestamp
    ? `<span style="position:absolute;bottom:8px;right:12px;font-size:10px;color:#999;pointer-events:none;font-family:monospace;">${new Date().toLocaleString('zh-CN')}</span>`
    : ''
  return `<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:10;">${spans.join('')}${meta}</div>`
}

export function injectWatermarkCSS(html) {
  const style = getWatermarkStyle()
  if (!style) return html
  return html.replace('</style>', `\n${style}\n</style>`)
}

export function injectWatermarkHTML(html) {
  const wmHtml = getWatermarkHTML()
  if (!wmHtml) return html
  return html.replace('</body>', `${wmHtml}\n</body>`)
}

export function buildExportHTML(title, bodyContent, extraCSS = '') {
  const config = getWatermarkConfig()
  const watermarkStyle = config.enabled ? getWatermarkStyle() : ''
  const watermarkHTML = config.enabled ? getWatermarkHTML() : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; color: #333; padding: 20px; position: relative; }
    ${watermarkStyle}
    ${extraCSS}
  </style></head><body>
    ${bodyContent}
    ${watermarkHTML}
  </body></html>`
}
