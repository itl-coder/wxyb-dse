// Watermark utility — tiled scattered pattern for print/export
// Uses canvas-based tiled background for even distribution

const DEFAULT_TEXT = '仅供参考'

export function getWatermarkConfig() {
  const saved = localStorage.getItem('dse_watermark')
  return saved ? JSON.parse(saved) : { text: DEFAULT_TEXT, enabled: true }
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
      transform: rotate(-20deg);
    }
    .wm-cell {
      display: flex; align-items: center; justify-content: center;
      opacity: 0.08;
    }
    .wm-cell span {
      font-size: 28px; color: #666; font-weight: 500;
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
  return `<div class="wm-container"><div class="wm-grid">${cells}</div></div><div class="wm-meta">${username} · ${now}</div>`
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
