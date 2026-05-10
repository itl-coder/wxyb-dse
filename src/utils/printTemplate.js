import { settingsService } from '@/services/dataService'

// === Watermark helpers — config read from settingsService ===

const WM_FALLBACK = {
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

function getWmConfig() {
  const s = settingsService.get()
  return {
    enabled: s.watermarkEnabled !== undefined ? s.watermarkEnabled : WM_FALLBACK.enabled,
    text: s.watermarkText || WM_FALLBACK.text,
    rotation: s.watermarkRotation ?? WM_FALLBACK.rotation,
    opacity: s.watermarkOpacity ?? WM_FALLBACK.opacity,
    fontSize: s.watermarkFontSize ?? WM_FALLBACK.fontSize,
    gapX: s.watermarkGapX ?? WM_FALLBACK.gapX,
    gapY: s.watermarkGapY ?? WM_FALLBACK.gapY,
    color: s.watermarkColor || WM_FALLBACK.color,
    showTimestamp: s.watermarkShowTimestamp !== undefined ? s.watermarkShowTimestamp : WM_FALLBACK.showTimestamp
  }
}

/** Returns CSS for a fixed-position print watermark overlay. Empty string if disabled. */
export function getPrintWatermarkStyle() {
  const c = getWmConfig()
  if (!c.enabled) return ''
  return `
    .wm-container {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 9999; overflow: hidden;
      opacity: ${c.opacity};
    }
    .wm-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(4, 1fr);
      width: 120%; height: 120%; margin: -5% 0 0 -5%;
      transform: rotate(${c.rotation}deg);
    }
    .wm-cell {
      display: flex; align-items: center; justify-content: center;
    }
    .wm-cell span {
      font-size: ${c.fontSize}px; color: ${c.color}; font-weight: 500;
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

/** Returns HTML overlay for print watermarks (4x4 grid). Empty string if disabled. */
export function getPrintWatermarkHTML() {
  const c = getWmConfig()
  if (!c.enabled) return ''
  const now = new Date().toLocaleString('zh-CN')
  const username = localStorage.getItem('dse_username') || '管理员'
  const cells = Array.from({ length: 16 }, () => `<div class="wm-cell"><span>${c.text}</span></div>`).join('')
  const meta = c.showTimestamp ? `<div class="wm-meta">${username} · ${now}</div>` : ''
  return `<div class="wm-container"><div class="wm-grid">${cells}</div></div>${meta}`
}

/**
 * Returns DOM overlay HTML for html2canvas export containers.
 * Uses absolutely-positioned spans (6x5 grid) so they are descendants of the container.
 * Empty string if disabled.
 */
export function getOverlayWatermarkHTML() {
  const c = getWmConfig()
  if (!c.enabled) return ''
  const rows = 6
  const cols = 5
  const spans = []
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      const top = (r / rows) * 100
      const left = (i / cols) * 100
      spans.push(
        `<span style="position:absolute;top:${top}%;left:${left}%;` +
        `transform:rotate(${c.rotation}deg);font-size:${c.fontSize}px;` +
        `color:${c.color};` +
        `pointer-events:none;user-select:none;white-space:nowrap;font-weight:500;">` +
        `${c.text}</span>`
      )
    }
  }
  const meta = c.showTimestamp
    ? `<span style="position:absolute;bottom:8px;right:12px;font-size:10px;color:#999;pointer-events:none;font-family:monospace;">${new Date().toLocaleString('zh-CN')}</span>`
    : ''
  return `<div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:10;opacity:${c.opacity};">${spans.join('')}${meta}</div>`
}

/**
 * Build props for Element Plus <el-watermark> component.
 * Returns null if watermark is disabled.
 */
export function getElWatermarkProps() {
  const c = getWmConfig()
  if (!c.enabled) return null
  return {
    content: c.text,
    font: { fontSize: c.fontSize, color: c.color },
    gap: [c.gapX, c.gapY],
    rotate: c.rotation,
    zIndex: 1
  }
}

/** Builds a complete HTML document (style + body) with embedded watermark, for print popup windows. */
export function buildExportHTML(title, bodyContent, extraCSS = '') {
  const wmStyle = getPrintWatermarkStyle()
  const wmHTML = getPrintWatermarkHTML()
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; color: #333; padding: 20px; position: relative; }
    ${wmStyle}
    ${extraCSS}
  </style></head><body>
    ${bodyContent}
    ${wmHTML}
  </body></html>`
}

/** Injects watermark CSS into an existing HTML string before the first </style> tag. */
export function injectPrintWatermarkCSS(html) {
  const style = getPrintWatermarkStyle()
  if (!style) return html
  return html.replace('</style>', `\n${style}\n</style>`)
}

/** Injects watermark HTML into an existing HTML string before the first </body> tag. */
export function injectPrintWatermarkHTML(html) {
  const wmHTML = getPrintWatermarkHTML()
  if (!wmHTML) return html
  return html.replace('</body>', `${wmHTML}\n</body>`)
}

// === Parent conference print template ===

/**
 * Build a full HTML document string for print/PDF export of the parent conference document.
 * "Scholarly Refinement" aesthetic — warm ivory paper, burnished gold accents, editorial typography.
 */
export function buildPrintHTML(data) {
  const {
    title, docNo, name, cls, cc, electives, targetUni, abroad,
    attRate, hwRate, examCount, schName, schFull, schSub, footer, today, bodyHTML,
    showTeacherSign, showParentSign
  } = data

  const sigHTML = []
  if (showTeacherSign) {
    sigHTML.push('<div>班主任签字：_______________</div><div class="right">日期：' + today + '</div>')
  }
  if (showParentSign) {
    sigHTML.push('<div>家长签字：_______________</div><div class="right">' + schName + ' · ' + footer + '</div>')
  }
  const signatures = sigHTML.length
    ? '\n  <div class="ph-signatures">\n    ' + sigHTML.join('\n    ') + '\n  </div>'
    : ''

  return `<!DOCTYPE html>
<html lang="zh-HK">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  /* === Reset & Page === */
  @page { size: A4; margin: 14mm 16mm 16mm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* === Paper & Body === */
  body {
    font-family: 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'Noto Sans SC', sans-serif;
    color: #2c1810;
    font-size: 13px;
    line-height: 1.85;
    background: #fefcf6;
    background-image:
      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(180,160,120,0.015) 2px, rgba(180,160,120,0.015) 4px);
    max-width: 760px;
    margin: 0 auto;
    padding: 42px 50px 36px;
    position: relative;
  }

  /* === Top Ornamental Border === */
  body::before {
    content: '';
    position: absolute;
    top: 18px; left: 50px; right: 50px;
    height: 3px;
    background: linear-gradient(90deg, #c4a85c, #8b6914 15%, #c4a85c 50%, #8b6914 85%, #c4a85c);
    border-radius: 2px;
    opacity: 0.55;
  }

  /* === Letterhead === */
  .ph-head { text-align: center; padding: 20px 0 10px; }
  .ph-school {
    font-family: 'Noto Serif SC', 'STSong', 'SimSun', 'Songti SC', serif;
    font-size: 26px; font-weight: 700; letter-spacing: 6px;
    color: #3b2314; margin-bottom: 4px;
  }
  .ph-subtitle { font-size: 10px; letter-spacing: 3px; color: #8b7355; text-transform: uppercase; }

  /* === Meta Bar === */
  .ph-meta { display: flex; justify-content: space-between; align-items: flex-end; margin: 16px 0 10px; font-size: 10px; color: #8b7355; letter-spacing: 1px; }
  .ph-meta-left { text-align: left; }
  .ph-meta-right { text-align: right; }
  .ph-doc-type {
    display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: 4px;
    color: #8b6914; border: 1px solid #c4a85c; padding: 2px 14px; border-radius: 1px;
  }
  .ph-stamp {
    display: inline-block; font-size: 10px; font-weight: 700; color: #a04030;
    border: 1px solid #c08070; padding: 1px 8px; border-radius: 1px; letter-spacing: 2px; opacity: 0.8;
  }
  .ph-stamp-sub { font-size: 8px; color: #aa9080; letter-spacing: 1px; margin-top: 2px; }

  /* === Dividers === */
  .ph-divider { display: flex; align-items: center; gap: 16px; margin: 16px 0; color: #c4a85c; font-size: 11px; user-select: none; }
  .ph-divider-line { flex: 1; height: 0; border-bottom: 1px solid #d9cba8; }
  .ph-divider.thin .ph-divider-line { border-bottom-style: dotted; }
  .ph-divider.diamond { font-size: 9px; color: #8b6914; }

  /* === Student Card === */
  .ph-card {
    border: 1px solid #e0d3b4; background: #faf7ee; padding: 14px 20px 10px; margin: 4px 0; border-radius: 1px;
  }
  .ph-card-title {
    font-family: 'Noto Serif SC', 'STSong', serif; font-size: 14px; font-weight: 700;
    color: #5c3d1e; margin-bottom: 10px; padding-bottom: 8px;
    border-bottom: 1px solid #e0d3b4; letter-spacing: 1px;
  }
  .ph-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 12px; }
  .ph-info-item { font-size: 11px; padding: 3px 0; }
  .ph-info-label { color: #8b6914; font-weight: 600; margin-right: 4px; font-size: 10px; letter-spacing: 0.5px; }
  .ph-info-label::after { content: '：'; }
  .ph-info-value { color: #2c1810; }

  /* === Body Typography === */
  .ph-body { margin-top: 4px; }
  .ph-body h1 {
    font-family: 'Noto Serif SC', 'STSong', serif; font-size: 20px; font-weight: 700;
    color: #3b2314; letter-spacing: 2px; margin: 28px 0 14px;
    padding-bottom: 10px; border-bottom: 2px solid #c4a85c;
  }
  .ph-body h2 {
    font-family: 'Noto Serif SC', 'STSong', serif; font-size: 16px; font-weight: 700;
    color: #4a2c17; letter-spacing: 0.5px; margin: 22px 0 10px;
    padding-bottom: 7px; border-bottom: 1px solid #d9cba8;
  }
  .ph-body h3 { font-size: 13px; font-weight: 600; color: #5c3d1e; margin: 14px 0 8px; }
  .ph-body p { margin: 8px 0; text-indent: 2em; }
  .ph-body ul, .ph-body ol { padding-left: 2em; margin: 8px 0; }
  .ph-body li { margin: 3px 0; }
  .ph-body strong { color: #3b2314; font-weight: 700; }
  .ph-body em { color: #5c4a3a; }
  .ph-body blockquote {
    border-left: 3px solid #c4a85c; margin: 14px 0; padding: 10px 18px;
    background: #faf7ee; font-style: italic; color: #5c3d1e;
  }
  .ph-body blockquote p { text-indent: 0; }
  .ph-body table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 11px; }
  .ph-body th {
    background: #f7f3e8; padding: 8px 10px; border: 1px solid #d5cbb0;
    font-weight: 700; color: #3b2314; text-align: left;
  }
  .ph-body td { padding: 7px 10px; border: 1px solid #e0d5b8; color: #2c1810; }
  .ph-body tr:nth-child(even) td { background: #fdfaf3; }
  .ph-body hr { border: none; border-top: 1px dotted #c4a85c; margin: 20px 0; }
  .ph-body code {
    background: #f5f0e5; padding: 2px 6px; border-radius: 2px; font-size: 0.88em;
    font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #6b5530;
  }
  .ph-body pre {
    background: #f5f0e5; padding: 12px 16px; border-radius: 2px; overflow-x: auto;
    font-size: 11px; line-height: 1.7; border: 1px solid #e0d5b8;
  }
  .ph-body pre code { background: none; padding: 0; border: none; }
  .ph-body a { color: #8b6914; text-decoration: underline; }

  /* === Footer === */
  .ph-footer-rule { display: flex; align-items: center; gap: 14px; margin: 32px 0 16px; color: #c4a85c; font-size: 18px; user-select: none; }
  .ph-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 12px; color: #5c4a3a; letter-spacing: 0.5px; }
  .ph-signatures .right { text-align: right; }
  .ph-footer-motto {
    grid-column: 1 / -1; text-align: center; font-size: 10px; color: #aa9080;
    letter-spacing: 2px; margin-top: 10px; padding-top: 10px; border-top: 1px dotted #d9cba8;
  }

  /* === Print Overrides === */
  @media print {
    body { background: #fff; background-image: none; padding: 0; max-width: none; }
    body::before { display: none; }
    .ph-card { background: #fff; }
    .ph-body blockquote { background: #fff; }
    .ph-body th { background: #f9f6f0; }
    .ph-body tr:nth-child(even) td { background: #fdfcf9; }
  }
  ${data.watermarkStyle || ''}
</style>
</head>
<body>
  <div class="ph-head">
    <div class="ph-school">${schFull}</div>
    <div class="ph-subtitle">${schSub}</div>
  </div>
  <div class="ph-meta">
    <div class="ph-meta-left">
      <div style="font-family:monospace;font-size:10px;margin-bottom:2px">${docNo}</div>
      <div class="ph-doc-type">家长会交流材料</div>
    </div>
    <div class="ph-meta-right">
      <div class="ph-stamp">内部资料</div>
      <div class="ph-stamp-sub">请妥善保管</div>
    </div>
  </div>
  <div class="ph-divider diamond">
    <div class="ph-divider-line"></div><span>◆</span><div class="ph-divider-line"></div>
  </div>
  <div class="ph-card">
    <div class="ph-card-title">${name} 同学 · 学情档案</div>
    <div class="ph-info-grid">
      <div class="ph-info-item"><span class="ph-info-label">所在班级</span><span class="ph-info-value">${cls}</span></div>
      <div class="ph-info-item"><span class="ph-info-label">文件日期</span><span class="ph-info-value">${today}</span></div>
      <div class="ph-info-item"><span class="ph-info-label">班主任</span><span class="ph-info-value">${cc}</span></div>
      <div class="ph-info-item"><span class="ph-info-label">选修科目</span><span class="ph-info-value">${electives}</span></div>
      <div class="ph-info-item"><span class="ph-info-label">目标院校</span><span class="ph-info-value">${targetUni}</span></div>
      <div class="ph-info-item"><span class="ph-info-label">留学规划</span><span class="ph-info-value">${abroad}</span></div>
      <div class="ph-info-item"><span class="ph-info-label">出勤率</span><span class="ph-info-value">${attRate}%</span></div>
      <div class="ph-info-item"><span class="ph-info-label">作业完成率</span><span class="ph-info-value">${hwRate}%</span></div>
      <div class="ph-info-item"><span class="ph-info-label">考试次数</span><span class="ph-info-value">${examCount} 次</span></div>
    </div>
  </div>
  <div class="ph-divider thin">
    <div class="ph-divider-line"></div><span>✦</span><div class="ph-divider-line"></div>
  </div>
  <div class="ph-body">${bodyHTML}</div>
  <div class="ph-footer-rule">
    <div class="ph-divider-line" style="flex:1;border-bottom:1px solid #d9cba8"></div>
    <span>❧</span>
    <div class="ph-divider-line" style="flex:1;border-bottom:1px solid #d9cba8"></div>
  </div>${signatures}
  <div class="ph-footer-motto">${footer}</div>
  ${data.watermarkHTML || ''}
  <script>setTimeout(function(){ window.print(); }, 500);<\/script>
</body>
</html>`
}
