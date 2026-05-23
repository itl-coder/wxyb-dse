/**
 * 导出/打印工具
 * 生成 A4 横版座位表打印模板、门贴模板
 * 支持 html2canvas 高清截图导出（iframe 隔离渲染）
 */
import { getWatermarkConfig, drawWatermarkOnCanvas } from '@/composables/useWatermark'

/**
 * 获取打印水印 CSS（内联到导出 HTML）
 */
function getExportWatermarkCSS() {
  const c = getWatermarkConfig()
  if (!c.enabled) return ''
  return `
    .wm-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 9999; overflow: hidden;
      opacity: ${c.opacity};
    }
    .wm-overlay span {
      position: absolute; font-size: ${c.fontSize}px; color: ${c.color};
      font-weight: 500; white-space: nowrap; user-select: none;
      transform: rotate(${c.rotation}deg);
    }`
}

/**
 * 获取打印水印 HTML 片段（6x5 网格覆盖）
 */
function getExportWatermarkHTML() {
  const c = getWatermarkConfig()
  if (!c.enabled) return ''
  const rows = 5; const cols = 4
  let spans = ''
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      const top = (r / rows) * 100
      const left = (i / cols) * 100
      spans += `<span style="top:${top}%;left:${left}%">${c.text}</span>`
    }
  }
  const ts = c.showTimestamp
    ? `<span style="bottom:10px;right:14px;font-size:10px;color:#999;position:fixed">${new Date().toLocaleString('zh-CN')}</span>`
    : ''
  return `<div class="wm-overlay">${spans}${ts}</div>`
}

/**
 * 生成教室座位表 HTML（A4 横版打印优化）
 * @param {Object} room 教室
 * @param {Array} students 学生列表
 * @param {Array} assignments 座位分配
 * @param {Object} opts.orientation 'landscape' | 'portrait'
 */
export function buildSeatChartHTML(room, students, assignments, opts = {}) {
  const { orientation = 'landscape', blockedSeats = [] } = opts
  const studentMap = {}
  students.forEach(s => { studentMap[s.id] = s })

  const seatMap = {}
  assignments.forEach(a => {
    seatMap[`${a.roomId}_${a.seatIndex}`] = a
  })

  const blockedSet = new Set(blockedSeats.filter(b => b.roomId === room.id).map(b => b.seatIndex))

  let rows = ''
  for (let r = 1; r <= room.rows; r++) {
    let cells = ''
    for (let c = 1; c <= room.cols; c++) {
      const seatIndex = (r - 1) * room.cols + c
      const key = `${room.id}_${seatIndex}`
      const a = seatMap[key]
      const s = a ? studentMap[a.studentId] : null
      const blocked = blockedSet.has(seatIndex)
      const name = blocked ? '—' : (s ? s.name : '')
      const cls = !blocked && s ? (s.className || '') : ''
      const cellClass = blocked ? 'blocked' : (s ? 'occupied' : 'empty')
      cells += `<td class="seat-cell ${cellClass}">
        <div class="seat-name">${name}</div>
        ${cls ? `<div class="seat-cls">${cls}</div>` : ''}
      </td>`
    }
    rows += `<tr>${cells}</tr>`
  }


  const isLandscape = orientation === 'landscape'
  const cellWidth = room.cols > 10 ? 52 : room.cols > 8 ? 58 : 66
  const fontSize = room.cols > 10 ? 11 : 13
  const pageW = isLandscape ? '297mm' : '210mm'
  const pageH = isLandscape ? '210mm' : '297mm'
  const wmCSS = getExportWatermarkCSS()
  const wmHTML = getExportWatermarkHTML()

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${room.name} - 座位表</title>
<style>
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
    padding:16px 20px;color:#1a1a1a;background:#fff;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
    width:1240px;
  }
  .header{text-align:center;margin-bottom:12px}
  .header h1{font-size:20px;font-weight:700;margin-bottom:4px;color:#111;letter-spacing:1px}
  .header .meta{font-size:11px;color:#555}
  .header .meta span{margin:0 8px}
  .podium{
    text-align:center;padding:10px;margin:0 40px 14px;
    background:#f7f7f7;border:1px solid #ddd;border-radius:4px;
    font-size:13px;color:#777;letter-spacing:6px;font-weight:600
  }
  table{margin:0 auto;border-collapse:collapse}
  td{
    border:1px solid #bbb;min-width:${cellWidth}px;height:46px;
    text-align:center;vertical-align:middle;padding:2px 3px;position:relative
  }
  .seat-cell.empty{background:#fdfdfd}
  .seat-cell.occupied{background:#fff}
  .seat-cell.blocked{background:#eee;color:#bbb}
  .seat-name{
    font-size:${fontSize}px;font-weight:700;color:#111;
    line-height:1.3;max-width:${cellWidth - 4}px;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0 auto
  }
  .seat-cls{font-size:9px;color:#555;margin-top:1px}
  .footer{text-align:center;margin-top:12px;font-size:9px;color:#ccc}
  .wm-overlay{
    position:fixed;top:0;left:0;width:100%;height:100%;
    pointer-events:none;z-index:9999;overflow:hidden;
  }
  ${wmCSS.replace(/\.wm-overlay\{[^}]+\}/g, '').replace(/<\/?style>/g, '')}
  @media print{
    body{padding:4mm 6mm}
    .footer{display:none}
    @page{size:${pageW} ${pageH};margin:3mm}
  }
</style></head><body>
<div class="header">
  <h1>${room.name} 座位表</h1>
  <div class="meta">
    ${room.examSubject ? `<span>科目: ${room.examSubject}</span>` : ''}
    ${room.examTime ? `<span>时间: ${room.examTime}</span>` : ''}
    <span>${room.rows}行×${room.cols}列 · ${room.rows * room.cols}座${blockedSet.size ? ` · 屏蔽${blockedSet.size}座` : ''}</span>
  </div>
</div>
<div class="podium">讲 台</div>
<table>${rows}</table>
<div class="footer">DSE AI 智能学情分析 · ${new Date().toLocaleDateString('zh-CN')}</div>
${wmHTML}
</body></html>`
}

/**
 * 生成门贴 HTML（教室门用，含考生名单与座位号）
 */
export function buildDoorTagHTML(room, students, assignments) {
  const roomAssignments = assignments.filter(a => a.roomId === room.id)
  const studentMap = {}
  students.forEach(s => { studentMap[s.id] = s })

  const rows = roomAssignments.map((a, idx) => {
    const s = studentMap[a.studentId]
    const row = Math.floor((a.seatIndex - 1) / room.cols) + 1
    const col = (a.seatIndex - 1) % room.cols + 1
    const colLetter = String.fromCharCode(64 + col)
    return `<tr>
      <td class="num">${idx + 1}</td>
      <td class="name">${s ? s.name : '—'}</td>
      <td class="class-col">${s ? s.className || '' : ''}</td>
      <td class="seat-col">${colLetter}${row}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${room.name} - 门贴</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
    padding: 28px 24px; color: #1a1a1a; background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .header { text-align: center; margin-bottom: 18px; border-bottom: 2px solid #444; padding-bottom: 10px; }
  .header h1 { font-size: 22px; font-weight: 700; color: #111; letter-spacing: 1px; }
  .header .info { font-size: 12px; color: #555; margin-top: 5px; }
  .header .info span { margin: 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f5f5f5; border-bottom: 2px solid #999; padding: 9px 8px; text-align: left; font-weight: 700; color: #333; }
  td { padding: 7px 8px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #fafafa; }
  .num { width: 36px; color: #888; text-align: center; font-family: "SF Mono", "Cascadia Code", monospace; }
  .name { font-weight: 700; color: #111; font-size: 14px; }
  .class-col { color: #555; }
  .seat-col { color: #666; font-family: "SF Mono", "Cascadia Code", "Consolas", monospace; font-size: 12px; width: 56px; text-align: center; }
  .footer { text-align: center; margin-top: 18px; font-size: 10px; color: #ccc; }
  @media print {
    body { padding: 5mm 7mm; }
    .footer { display: none; }
    @page { size: A4 portrait; margin: 4mm; }
  }
</style></head><body>
<div class="header">
  <h1>${room.name}</h1>
  <div class="info">
    ${room.examSubject ? `<span>${room.examSubject}</span>` : ''}
    ${room.examTime ? `<span>${room.examTime}</span>` : ''}
    <span>考生 ${roomAssignments.length} 人</span>
  </div>
</div>
<table>
  <thead><tr><th class="num">序号</th><th class="name">姓名</th><th class="class-col">班级</th><th class="seat-col">座位</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">DSE AI 智能学情分析 · ${new Date().toLocaleDateString('zh-CN')}</div>
</body></html>`
}

/**
 * 在新窗口中打开预览
 */
export function openPreview(html) {
  const win = window.open('', '_blank', 'width=1100,height=800')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

/**
 * 在新窗口中打开并打印
 */
export function openForPrint(html) {
  const win = window.open('', '_blank', 'width=1100,height=800')
  if (win) {
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 800)
  }
}

/**
 * 使用 iframe 隔离渲染后通过 html2canvas 截图
 * 避免页面样式污染和 off-screen 渲染问题
 * @param {string} html - 完整 HTML 文档字符串
 * @param {Object} opts - { format: 'png'|'jpeg', quality: 0.92, scale: 3 }
 * @returns {Promise<string>} dataURL
 */
/**
 * 使用离屏 DOM + html2canvas 高清截图，叠加 Canvas 水印
 * cloneNode 方式避免 iframe 字体/样式加载时序问题
 * @param {string} html - 完整 HTML 文档字符串
 * @param {Object} opts - { format, quality, scale, containerWidth }
 * @returns {Promise<string>} dataURL
 */
async function captureHTMLToImage(html, opts = {}) {
  const { format = 'png', quality = 0.92, scale = 4, containerWidth = 1240 } = opts

  // 移除 CSS 水印 DOM 片段（改用 Canvas 水印确保在导出图片中可见）
  const cleanHTML = html.replace(/<div class="wm-overlay">[\s\S]*?<\/div>/g, '')

  const wrapper = document.createElement('div')
  wrapper.style.cssText = `position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;display:inline-block;`
  wrapper.innerHTML = cleanHTML
  document.body.appendChild(wrapper)

  try {
    // 等待布局完成
    await new Promise(r => setTimeout(r, 250))

    const bodyEl = wrapper.querySelector('body')
    const contentW = bodyEl ? Math.min(bodyEl.scrollWidth, 2480) : containerWidth
    const contentH = bodyEl ? Math.min(bodyEl.scrollHeight, 3508) : 1588

    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(wrapper, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: false,
      width: contentW,
      height: contentH,
      windowWidth: contentW,
      windowHeight: contentH
    })

    // 叠加 Canvas 水印（保证在导出的图片中可见）
    drawWatermarkOnCanvas(canvas)

    if (format === 'jpeg') {
      return canvas.toDataURL('image/jpeg', quality)
    }
    return canvas.toDataURL('image/png')
  } finally {
    document.body.removeChild(wrapper)
  }
}

/**
 * 导出 A4 横版高清图片（使用 iframe + html2canvas）
 * @returns {Promise<string>} dataURL
 */
export async function captureChartImage(room, students, assignments, blockedSeats = []) {
  const html = buildSeatChartHTML(room, students, assignments, { orientation: 'landscape', blockedSeats })
  return captureHTMLToImage(html, { format: 'png', scale: 3 })
}

/**
 * 导出 A4 横版 JPG 图片（体积更小，适合分发）
 * @returns {Promise<string>} dataURL
 */
export async function captureChartJPG(room, students, assignments, blockedSeats = []) {
  const html = buildSeatChartHTML(room, students, assignments, { orientation: 'landscape', blockedSeats })
  return captureHTMLToImage(html, { format: 'jpeg', quality: 0.92, scale: 3 })
}

/**
 * 导出所有教室座位表（逐间打印）
 */
export function exportAllCharts(rooms, students, assignments, blockedSeats = []) {
  rooms.forEach(room => {
    const html = buildSeatChartHTML(room, students, assignments, { blockedSeats })
    openForPrint(html)
  })
}

/**
 * 合并所有教室为单个 HTML 文档（每教室一页，page-break-after）
 */
export function buildAllChartsHTML(rooms, students, assignments, blockedSeats = []) {
  const charts = rooms.map(room => {
    const html = buildSeatChartHTML(room, students, assignments, { blockedSeats })
    // Extract body content from full HTML
    const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/)
    const styleMatch = html.match(/<style>([\s\S]*)<\/style>/)
    return {
      style: styleMatch ? styleMatch[1] : '',
      body: bodyMatch ? bodyMatch[1] : ''
    }
  })

  const combinedStyle = charts[0]?.style || ''
  const combinedBody = charts.map((c, i) =>
    `<div class="chart-page" style="${i < charts.length - 1 ? 'page-break-after:always;' : ''}">${c.body}</div>`
  ).join('\n')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>全部教室座位表</title>
<style>${combinedStyle}
.chart-page{padding:16px 20px}
@media print{
  .chart-page{padding:4mm 6mm}
  @page{size:A4 landscape;margin:3mm}
}
</style></head><body>${combinedBody}</body></html>`
}

/**
 * 打印全部教室（合并为单个文档，一次打印）
 */
export function printAllCharts(rooms, students, assignments, blockedSeats = []) {
  if (!rooms.length) return
  const html = buildAllChartsHTML(rooms, students, assignments, blockedSeats)
  openForPrint(html)
}

/**
 * 为所有教室生成 A4 横版高清图片并触发下载
 */
export async function downloadAllChartImages(rooms, students, assignments, blockedSeats = []) {
  for (const room of rooms) {
    const dataUrl = await captureChartImage(room, students, assignments, blockedSeats)
    const link = document.createElement('a')
    link.download = `${room.name}_座位表_A4横版.png`
    link.href = dataUrl
    link.click()
    await new Promise(r => setTimeout(r, 500))
  }
}
