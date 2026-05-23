/**
 * 考试座位表统一导出管线
 *
 * 高清导出：buildSVG → Canvas(2x) → toBlob → download / jsPDF
 * 打印：buildHTML → mountPrintOverlay → window.print()
 * Excel：xlsx grid layout / roster / summary
 *
 * 依赖：jspdf + xlsx + useWatermark (html2canvas 仅保留兼容旧调用)
 */
import { generateTiledWatermarkCanvas } from '@/composables/useWatermark'

// ==================== HTML 构建 ====================

/**
 * 构建教室座位表 HTML（干净风格，无行列标号，无 A/B/C 表头）
 * @param {Object} room - 教室对象
 * @param {Array} students - 学生列表
 * @param {Array} assignments - 座位分配
 * @param {Array} blockedSeats - 屏蔽座位列表
 * @param {Object} opts
 * @param {string} [opts.examName] - 考试名称
 * @param {string} [opts.examDate] - 考试日期
 * @param {string} [opts.examTime] - 考试时间
 * @param {boolean} [opts.forPrint] - 是否为打印优化（@page + @media print）
 */
export function buildSeatChartHTML(room, students, assignments, blockedSeats = [], opts = {}) {
  const { examName = '', examDate = '', examTime = '', forPrint = false, doorDirection = 'left', doorSeatIndex = null } = opts

  const sMap = {}
  students.forEach(s => { sMap[s.id] = s })

  const aMap = {}
  assignments.forEach(a => { aMap[`${a.roomId}_${a.seatIndex}`] = a })

  const blockedSet = new Set((blockedSeats || []).filter(b => b.roomId === room.id).map(b => b.seatIndex))

  const exportW = 1200
  const cellW = Math.floor((exportW - 60) / room.cols)
  const cellH = Math.floor(cellW * 0.76)
  const fSize = room.cols > 10 ? 11 : 12

  // 构建座位行（顶部=最后一排，底部=第一排靠近讲台）
  let rowsHTML = ''
  for (let r = room.rows; r >= 1; r--) {
    let cells = ''
    for (let c = 1; c <= room.cols; c++) {
      const si = (r - 1) * room.cols + c
      const key = `${room.id}_${si}`
      const a = aMap[key]
      const s = a ? sMap[a.studentId] : null
      const blocked = blockedSet.has(si)

      let cellClass = 'sc-empty'
      let name = ''
      let clsName = ''
      let electives = ''

      if (blocked) {
        cellClass = 'sc-blocked'
        name = '—'
      } else if (s) {
        cellClass = 'sc-occupied'
        name = s.name
        clsName = s.className || ''
        electives = (s.electives || []).slice(0, 2).join(' / ')
      } else {
        // 专属教室空位
        if (room.exclusiveClassId) cellClass = 'sc-exclusive'
      }

      // 门口标记（优先使用指定门口座位，否则第一排按doorDirection定左/右）
      const isDoor = doorSeatIndex !== null && doorSeatIndex !== undefined
        ? si === doorSeatIndex
        : (r === 1 && (
            (doorDirection === 'right' && c === room.cols) ||
            (doorDirection !== 'right' && c === 1)
          ))

      cells += `<td class="${cellClass}${isDoor ? ' sc-door' : ''}">
        
        <div class="sn">${name}</div>
        ${clsName ? `<div class="scls">${clsName}</div>` : ''}
        ${electives ? `<div class="sel">${electives}</div>` : ''}
      </td>`
    }
    rowsHTML += `<tr>${cells}</tr>`
  }

  const title = examName || (room.examSubject || '考试座位表')
  const subtitle = [examDate, examTime].filter(Boolean).join(' ')

  const printCSS = forPrint ? `
    @page{size:A4 landscape;margin:6mm 8mm 10mm 8mm}
    @media print{
      body{padding:2mm 4mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .ft{display:none}
    }` : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${room.name} - 座位表</title>
<style>
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
    padding:10px 14px;color:#1a1a1a;background:#fff;
    width:${exportW}px;
    min-width:800px;
  }
  .hdr{text-align:center;margin-bottom:6px}
  .hdr h1{font-size:18px;font-weight:700;color:#111;letter-spacing:1px;margin-bottom:2px}
  .hdr .sub{font-size:10px;color:#666}
  table{width:100%;border-collapse:collapse;table-layout:fixed}
  td{
    border:1px solid #bbb;height:${cellH}px;
    text-align:center;vertical-align:middle;padding:2px 3px;position:relative
  }
  .sc-empty{background:#fdfdfd}
  .sc-occupied{background:#fff}
  .sc-blocked{background:#eee;color:#bbb}
  .sc-exclusive{background:#f6fff6}
  .dd{position:absolute;top:0;left:2px;font-size:9px;line-height:1;opacity:0.6}
  .sn{font-size:${fSize}px;font-weight:700;color:#111;line-height:1.3;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:0 auto}
  .scls{font-size:8px;color:#666;line-height:1.2}
  .sel{font-size:7px;color:#999;line-height:1.2}
  .ft{text-align:center;margin-top:6px;font-size:9px;color:#ccc}
  ${printCSS}
</style></head><body>
<div class="hdr">
  <h1>${room.name} · ${title}</h1>
  ${subtitle ? `<div class="sub">${subtitle}</div>` : ''}
</div>


<table>${rowsHTML}</table>
<div class="ft">共 ${room.rows * room.cols} 座 · ${new Date().toLocaleDateString('zh-CN')}</div>
</body></html>`
}

/**
 * 构建门贴 HTML（教室门用，含考生名单与座位号）
 */
export function buildDoorTagHTML(room, students, assignments) {
  const sMap = {}
  students.forEach(s => { sMap[s.id] = s })

  const roomAssignments = assignments.filter(a => a.roomId === room.id)

  const rows = roomAssignments.map((a, idx) => {
    const s = sMap[a.studentId]
    const row = Math.floor((a.seatIndex - 1) / room.cols) + 1
    const col = ((a.seatIndex - 1) % room.cols) + 1
    const colLetter = String.fromCharCode(64 + col)
    return `<tr>
      <td class="num">${idx + 1}</td>
      <td class="name">${s ? s.name : '—'}</td>
      <td class="cname">${s ? s.className || '' : ''}</td>
      <td class="seat">${colLetter}${row}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${room.name} - 门贴</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;padding:24px 20px;color:#1a1a1a;background:#fff}
  .hdr{text-align:center;margin-bottom:16px;border-bottom:2px solid #444;padding-bottom:8px}
  .hdr h1{font-size:22px;font-weight:700;letter-spacing:1px;margin-bottom:4px}
  .hdr .info{font-size:12px;color:#555}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f5f5f5;border-bottom:2px solid #999;padding:9px 8px;text-align:left;font-weight:700}
  td{padding:7px 8px;border-bottom:1px solid #e0e0e0}
  tr:nth-child(even) td{background:#fafafa}
  .num{width:36px;color:#888;text-align:center;font-family:monospace}
  .name{font-weight:700;font-size:14px}
  .cname{color:#555}
  .seat{color:#666;font-family:monospace;font-size:12px;width:56px;text-align:center}
  @media print{body{padding:5mm 7mm}@page{size:A4 portrait;margin:4mm}}
</style></head><body>
<div class="hdr"><h1>${room.name}</h1>
<div class="info">${room.examSubject||''} ${room.examTime||''} · 考生 ${roomAssignments.length} 人</div></div>
<table><thead><tr><th class="num">#</th><th class="name">姓名</th><th class="cname">班级</th><th class="seat">座位</th></tr></thead>
<tbody>${rows}</tbody></table></body></html>`
}

// ==================== 导出管线核心 ====================

/**
 * 离屏渲染 HTML → html2canvas 高清截图 → Canvas 水印 → dataURL
 * @param {string} html - 完整 HTML 文档字符串
 * @param {Object} opts
 * @param {string} [opts.format='png'] - png | jpeg
 * @param {number} [opts.quality=0.92] - JPEG 质量
 * @param {number} [opts.scale=4] - 渲染缩放
 * @param {number} [opts.width] - 容器宽度
 * @returns {Promise<string>} dataURL
 */
async function captureHTML(html, opts = {}) {
  const { format = 'png', quality = 0.92, scale = 4, width = 1240 } = opts

  // 清除旧 HTML 中的水印 DOM（改用 Canvas 水印确保可见）
  const cleanHTML = html.replace(/<div class="wm-overlay">[\s\S]*?<\/div>/g, '')

  const wrapper = document.createElement('div')
  wrapper.style.cssText = `position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;display:inline-block;`
  wrapper.innerHTML = cleanHTML
  document.body.appendChild(wrapper)

  try {
    await new Promise(r => setTimeout(r, 300))

    // 包裹元素的真实内容尺寸
    const bodyEl = wrapper.querySelector('body')
    const contentW = bodyEl ? Math.min(bodyEl.scrollWidth, 2480) : width
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

    // Canvas 水印叠加
    const wmCanvas = generateTiledWatermarkCanvas(canvas.width, canvas.height)
    if (wmCanvas) {
      const ctx = canvas.getContext('2d')
      ctx.drawImage(wmCanvas, 0, 0)
    }

    if (format === 'jpeg') {
      return canvas.toDataURL('image/jpeg', quality)
    }
    return canvas.toDataURL('image/png')
  } finally {
    if (wrapper.parentNode) document.body.removeChild(wrapper)
  }
}

/**
 * 导出并下载单教室图片
 * @param {Object} room
 * @param {Array} students
 * @param {Array} assignments
 * @param {Array} blockedSeats
 * @param {string} format - 'png' | 'jpg'
 * @param {Object} htmlOpts
 */
export async function downloadRoomImage(room, students, assignments, blockedSeats = [], format = 'png', htmlOpts = {}) {
  const html = buildSeatChartHTML(room, students, assignments, blockedSeats, htmlOpts)
  const dataUrl = await captureHTML(html, { format: format === 'jpg' ? 'jpeg' : 'png', quality: 0.92, scale: 4 })
  const ext = format === 'jpg' ? 'jpg' : 'png'
  const link = document.createElement('a')
  link.download = `${room.name}_座位表.${ext}`
  link.href = dataUrl
  link.click()
  return dataUrl
}

/**
 * 导出并下载全部教室图片
 */
export async function downloadAllRoomImages(rooms, students, assignments, blockedSeats = [], format = 'png', htmlOpts = {}) {
  for (const room of rooms) {
    await downloadRoomImage(room, students, assignments, blockedSeats, format, htmlOpts)
    await new Promise(r => setTimeout(r, 400))
  }
}

/**
 * 导出为 PDF（jsPDF）
 */
export async function downloadRoomPDF(room, students, assignments, blockedSeats = [], htmlOpts = {}) {
  const html = buildSeatChartHTML(room, students, assignments, blockedSeats, { ...htmlOpts, forPrint: true })
  const dataUrl = await captureHTML(html, { format: 'png', scale: 3 })

  const { default: jsPDF } = await import('jspdf')
  const img = new Image()
  img.src = dataUrl
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const pdfW = 297 // A4 横版 mm
  const pdfH = 210
  const imgRatio = img.width / img.height
  let w = pdfW - 20
  let h = w / imgRatio
  if (h > pdfH - 20) {
    h = pdfH - 20
    w = h * imgRatio
  }

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  pdf.addImage(img, 'PNG', (pdfW - w) / 2, (pdfH - h) / 2, w, h)
  pdf.save(`${room.name}_座位表.pdf`)
}

// ==================== 打印（全屏覆盖层方案，无 iframe / 无 window.open） ====================

/**
 * 创建全屏打印覆盖层并挂载 HTML
 * @param {string} html - 完整 HTML 文档字符串
 * @param {string} [extraPrintCSS] - 额外 @media print CSS
 * @returns {HTMLElement} 打印根节点
 */
function mountPrintOverlay(html, extraPrintCSS = '') {
  const old = document.getElementById('print-root')
  if (old) old.remove()

  const root = document.createElement('div')
  root.id = 'print-root'
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;'

  const styleMatch = html.match(/<style>([\s\S]*)<\/style>/)
  const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/)

  if (styleMatch) {
    const styleEl = document.createElement('style')
    styleEl.textContent = styleMatch[1]
    root.appendChild(styleEl)
  }

  const printStyle = document.createElement('style')
  printStyle.textContent = `
    @page { size: A4 landscape; margin: 6mm 8mm 10mm 8mm; }
    @media print {
      html, body, #print-root { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .ft { display: none; }
    }
    ${extraPrintCSS}
  `
  root.appendChild(printStyle)

  if (bodyMatch) {
    const content = document.createElement('div')
    content.innerHTML = bodyMatch[1]
    root.appendChild(content)
  }

  document.body.appendChild(root)
  return root
}

/**
 * 打印单教室座位表（全屏覆盖层 → window.print() → 自动清理）
 */
export function printRoom(room, students, assignments, blockedSeats = [], htmlOpts = {}) {
  const html = buildSeatChartHTML(room, students, assignments, blockedSeats, { ...htmlOpts, forPrint: true })
  const root = mountPrintOverlay(html)
  setTimeout(() => {
    window.print()
    setTimeout(() => { if (root.parentNode) root.remove() }, 500)
  }, 400)
}

/**
 * 合并全部教室为单文档并打印（每教室一页）
 */
export function printAllRooms(rooms, students, assignments, blockedSeats = [], htmlOpts = {}) {
  if (!rooms.length) return
  const charts = rooms.map((room, i) => {
    const html = buildSeatChartHTML(room, students, assignments, blockedSeats, { ...htmlOpts, forPrint: true, doorSeatIndex: htmlOpts.doorSeatIndex })
    const bodyMatch = html.match(/<body>([\s\S]*)<\/body>/)
    const styleMatch = html.match(/<style>([\s\S]*)<\/style>/)
    return {
      style: styleMatch?.[1] || '',
      body: bodyMatch?.[1] || '',
      pageBreak: i < rooms.length - 1 ? 'page-break-after:always' : ''
    }
  })

  const combinedBody = charts.map(c =>
    `<div style="${c.pageBreak};padding:10px 14px">${c.body}</div>`
  ).join('\n')

  const combinedHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${charts[0]?.style||''}</style></head><body>${combinedBody}</body></html>`
  const root = mountPrintOverlay(combinedHTML)
  setTimeout(() => {
    window.print()
    setTimeout(() => { if (root.parentNode) root.remove() }, 500)
  }, 500)
}

/**
 * 预览 HTML（在新窗口打开，用于调试；生产环境优先使用组件内 DOM 预览）
 */
export function previewRoom(room, students, assignments, blockedSeats = [], htmlOpts = {}) {
  const html = buildSeatChartHTML(room, students, assignments, blockedSeats, htmlOpts)
  const w = window.open('', '_blank', 'width=1100,height=800')
  if (!w) return
  w.document.write(html)
  w.document.close()
}

// ==================== Excel 导出 ====================

/**
 * 全部教室座位汇总 Excel（选修科目使用换行符分隔，单列显示）
 */
async function loadXLSX() {
  const mod = await import('xlsx')
  return mod.default || mod
}

export async function exportAllRoomsExcel(rooms, students, assignments, blockedSeats = []) {
  const XLSX = await loadXLSX()

  const sMap = {}
  students.forEach(s => { sMap[s.id] = s })

  const allData = []
  rooms.forEach(room => {
    const ra = assignments.filter(a => a.roomId === room.id)
    const blockedSet = new Set((blockedSeats || []).filter(b => b.roomId === room.id).map(b => b.seatIndex))

    ra.forEach(a => {
      const s = sMap[a.studentId]
      const rowNum = Math.floor((a.seatIndex - 1) / room.cols) + 1
      const colNum = ((a.seatIndex - 1) % room.cols) + 1
      allData.push({
        '教室': room.name,
        '座位号': `${String.fromCharCode(64 + colNum)}${rowNum}`,
        '姓名': s?.name || '',
        '学号': s?.classNo || '',
        '班级': s?.className || '',
        '选修科目': (s?.electives || []).join('\n'),
        '锁定': a.locked ? '是' : ''
      })
    })

    // 空/屏蔽座位
    for (let si = 1; si <= room.rows * room.cols; si++) {
      if (ra.some(a => a.seatIndex === si)) continue
      const rowNum = Math.floor((si - 1) / room.cols) + 1
      const colNum = ((si - 1) % room.cols) + 1
      allData.push({
        '教室': room.name,
        '座位号': `${String.fromCharCode(64 + colNum)}${rowNum}`,
        '姓名': blockedSet.has(si) ? '[屏蔽]' : '',
        '学号': '',
        '班级': '',
        '选修科目': '',
        '锁定': blockedSet.has(si) ? '屏蔽' : ''
      })
    }
  })

  const ws = XLSX.utils.json_to_sheet(allData)
  ws['!cols'] = [
    { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 8 }
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '全部座位安排')
  XLSX.writeFile(wb, `全部教室座位安排_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/**
 * 完整学生名单 Excel（已安排 + 未安排）
 */
export async function exportRoster(rooms, students, assignments) {
  const XLSX = await loadXLSX()
  const sMap = {}
  students.forEach(s => { sMap[s.id] = s })

  const data = assignments.map(a => {
    const s = sMap[a.studentId]
    const room = rooms.find(r => r.id === a.roomId)
    const rowNum = Math.floor((a.seatIndex - 1) / (room?.cols || 5)) + 1
    const colNum = ((a.seatIndex - 1) % (room?.cols || 5)) + 1
    return {
      '教室': room?.name || '',
      '座位号': `${String.fromCharCode(64 + colNum)}${rowNum}`,
      '姓名': s?.name || '',
      '学号': s?.classNo || '',
      '班级': s?.className || '',
      '选修科目': (s?.electives || []).join('\n'),
      '锁定': a.locked ? '是' : ''
    }
  })

  const assignedIds = new Set(assignments.map(a => a.studentId))
  students.filter(s => !assignedIds.has(s.id)).forEach(s => {
    data.push({
      '教室': '未安排',
      '座位号': '',
      '姓名': s.name,
      '学号': s.classNo || '',
      '班级': s.className || '',
      '选修科目': (s.electives || []).join('\n'),
      '锁定': ''
    })
  })

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 8 }
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '座位安排名单')
  XLSX.writeFile(wb, `考试座位安排_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/**
 * 教室汇总统计 Excel
 */
export async function exportRoomSummary(roomStats) {
  const XLSX = await loadXLSX()
  const data = roomStats.map(r => ({
    '教室': r.name,
    '行数': r.rows,
    '列数': r.cols,
    '总容量': r.totalCapacity,
    '已安排': r.assignedCount,
    '屏蔽': r.blockedCount,
    '空余': r.emptyCount,
    '使用率': r.totalCapacity > 0 ? Math.round(r.assignedCount / Math.max(1, r.totalCapacity - r.blockedCount) * 100) + '%' : '0%'
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 16 }, { wch: 8 }, { wch: 8 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '教室统计')
  XLSX.writeFile(wb, `教室汇总统计_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ==================== 考场网格布局 Excel 导出 ====================

/**
 * 按考场实际分布样式导出 Excel — 每个教室一个 Sheet，座位按行列排布
 */
export async function exportGridExcel(rooms, students, assignments, blockedSeats = []) {
  const XLSX = await loadXLSX()

  const sMap = {}
  students.forEach(s => { sMap[s.id] = s })

  const aMap = {}
  assignments.forEach(a => { aMap[`${a.roomId}_${a.seatIndex}`] = a })

  const blockedMap = {}
  blockedSeats.forEach(b => {
    if (!blockedMap[b.roomId]) blockedMap[b.roomId] = new Set()
    blockedMap[b.roomId].add(b.seatIndex)
  })

  const wb = XLSX.utils.book_new()

  rooms.forEach((room, ri) => {
    const sheetName = room.name.length > 28 ? room.name.slice(0, 28) : room.name
    // 构建网格数据：行=座位行(从后往前)，列=座位列 + 元数据
    const gridData = []

    // 标题行
    const titleRow = [`${room.name} · 座位表`]
    // 填充合并单元格占位
    for (let c = 1; c < room.cols; c++) titleRow.push('')
    gridData.push(titleRow)

    // 列标行
    const headerRow = ['']
    for (let c = 1; c <= room.cols; c++) {
      headerRow.push(String.fromCharCode(64 + c))
    }
    gridData.push(headerRow)

    // 座位行（从最后一排到第一排）
    for (let r = room.rows; r >= 1; r--) {
      const row = [String(r)]
      for (let c = 1; c <= room.cols; c++) {
        const si = (r - 1) * room.cols + c
        const key = `${room.id}_${si}`
        const a = aMap[key]
        const s = a ? sMap[a.studentId] : null
        const blocked = blockedMap[room.id]?.has(si)

        if (blocked) {
          row.push('✕ 屏蔽')
        } else if (s) {
          const electives = (s.electives || []).slice(0, 2).join('/')
          row.push(`${s.name}\n${s.className || ''}${electives ? ' · ' + electives : ''}`)
        } else {
          row.push('')
        }
      }
      gridData.push(row)
    }

    // 底部统计行
    const count = assignments.filter(a => a.roomId === room.id).length
    gridData.push([`共 ${count} 人 / ${room.rows * room.cols} 座`])

    const ws = XLSX.utils.aoa_to_sheet(gridData)

    // 列宽设置
    const colWidths = [{ wch: 4 }] // 行号列
    for (let c = 1; c <= room.cols; c++) {
      colWidths.push({ wch: 16 }) // 座位列
    }
    ws['!cols'] = colWidths

    // 合并标题行
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: room.cols } },
      { s: { r: gridData.length - 1, c: 0 }, e: { r: gridData.length - 1, c: room.cols } }
    ]

    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  // 额外：汇总 Sheet
  const summaryData = [['教室', '行', '列', '总容量', '已安排', '屏蔽', '空余', '使用率']]
  rooms.forEach(room => {
    const assigned = assignments.filter(a => a.roomId === room.id).length
    const blocked = (blockedSeats || []).filter(b => b.roomId === room.id).length
    const capacity = room.rows * room.cols
    const empty = capacity - assigned - blocked
    const rate = capacity > 0 ? Math.round(assigned / Math.max(1, capacity - blocked) * 100) + '%' : '0%'
    summaryData.push([room.name, room.rows, room.cols, capacity, assigned, blocked, empty, rate])
  })

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  summaryWs['!cols'] = [{ wch: 16 }, { wch: 6 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, summaryWs, '汇总统计')

  XLSX.writeFile(wb, `考场座位布局_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ==================== SVG 高清导出（替代 html2canvas） ====================

/**
 * 构建教室座位表 SVG（高分辨率，适合打印/导出）
 * @param {Object} room
 * @param {Array} students
 * @param {Array} assignments
 * @param {Array} blockedSeats
 * @param {Object} opts
 */
export function buildSeatChartSVG(room, students, assignments, blockedSeats = [], opts = {}) {
  const { examName = '', doorDirection = 'left', doorSeatIndex = null, scale = 2, padding = 26 } = opts

  const sMap = {}
  students.forEach(s => { sMap[s.id] = s })

  const aMap = {}
  assignments.forEach(a => { aMap[`${a.roomId}_${a.seatIndex}`] = a })

  const blockedSet = new Set((blockedSeats || []).filter(b => b.roomId === room.id).map(b => b.seatIndex))

  const pad = padding * scale
  const cellW = 100 * scale, cellH = 72 * scale
  const rowLabelW = 32 * scale, colLabelH = 28 * scale
  const podiumH = 36 * scale
  const marginTop = 20 * scale
  const titleH = 40 * scale
  const contentW = rowLabelW + room.cols * cellW
  const contentH = titleH + marginTop + colLabelH + room.rows * cellH + podiumH
  const totalW = contentW + pad * 2
  const totalH = contentH + pad * 2

  const colLabel = (n) => String.fromCharCode(64 + n)

  let cells = ''
  for (let r = 1; r <= room.rows; r++) {
    const displayRow = room.rows - r + 1
    for (let c = 1; c <= room.cols; c++) {
      const x = pad + rowLabelW + (c - 1) * cellW
      const y = pad + titleH + marginTop + colLabelH + (displayRow - 1) * cellH
      const si = (r - 1) * room.cols + c
      const key = `${room.id}_${si}`
      const a = aMap[key]
      const s = a ? sMap[a.studentId] : null
      const blocked = blockedSet.has(si)

      const isDoor = doorSeatIndex !== null && doorSeatIndex !== undefined
        ? si === doorSeatIndex
        : (r === 1 && ((doorDirection === 'right' && c === room.cols) || (doorDirection !== 'right' && c === 1)))

      // 背景 + 3D阴影
      const shadowOff = 3 * scale
      let fill = '#fdfdfd', stroke = '#e0e0e0', strokeDash = ''
      if (blocked) {
        fill = '#f0f0f0'
        stroke = '#e5e5e5'
      } else if (s) {
        fill = '#ffffff'
        stroke = '#d0d0d0'
      } else {
        strokeDash = `stroke-dasharray="${3*scale},${3*scale}"`
      }

      const fs = 12 * scale
      const fsMeta = 8 * scale
      const fsSeat = 7 * scale

      cells += `<g>
        <rect x="${x + shadowOff}" y="${y + shadowOff}" width="${cellW}" height="${cellH}" rx="${2*scale}" fill="#e0e0e0" opacity="0.4"/>
        <rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="${2*scale}" fill="${fill}" stroke="${stroke}" stroke-width="${1*scale}" ${strokeDash}/>`

      if (isDoor) {
        cells += `<circle cx="${x + 6*scale}" cy="${y + 4*scale}" r="${3*scale}" fill="#6366f1"/>`
      }

      if (blocked) {
        const cx = x + cellW / 2, cy = y + cellH / 2, half = 6 * scale
        cells += `<line x1="${cx - half}" y1="${cy - half}" x2="${cx + half}" y2="${cy + half}" stroke="#bbb" stroke-width="${1.5*scale}"/>
          <line x1="${cx + half}" y1="${cy - half}" x2="${cx - half}" y2="${cy + half}" stroke="#bbb" stroke-width="${1.5*scale}"/>`
      } else if (s) {
        const name = s.name.length > 5 ? s.name.slice(0, 5) + '…' : s.name
        const metaParts = []
        if (s.className) metaParts.push(s.className)
        if (s.electives?.length) metaParts.push(s.electives.slice(0, 2).join('/'))
        const meta = metaParts.join(' · ')
        const seatLabel = `${colLabel(c)}${r}`

        cells += `<text x="${x + cellW/2}" y="${y + cellH/2 - (6*scale)}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#1a1a1a" font-family="'PingFang SC','Microsoft YaHei',sans-serif">${escapeXml(name)}</text>`
        if (meta) {
          cells += `<text x="${x + cellW/2}" y="${y + cellH/2 + (6*scale)}" text-anchor="middle" font-size="${fsMeta}" fill="#999" font-family="'PingFang SC','Microsoft YaHei',sans-serif">${escapeXml(meta)}</text>`
        }
        cells += `<text x="${x + cellW - 4*scale}" y="${y + 3*scale}" text-anchor="end" font-size="${fsSeat}" fill="#c0c0c0" font-family="monospace">${seatLabel}</text>`
      } else {
        const seatLabel = `${colLabel(c)}${r}`
        cells += `<text x="${x + cellW/2}" y="${y + cellH/2 + 2*scale}" text-anchor="middle" font-size="${10*scale}" fill="#d5d5d5" font-family="monospace">${seatLabel}</text>`
      }
      cells += `</g>`
    }
  }

  // 列标题
  let colHeaders = ''
  for (let c = 1; c <= room.cols; c++) {
    const x = pad + rowLabelW + (c - 1) * cellW + cellW / 2
    colHeaders += `<text x="${x}" y="${pad + titleH + marginTop + colLabelH - 6*scale}" text-anchor="middle" font-size="${10*scale}" font-weight="700" fill="#999" font-family="monospace">${colLabel(c)}</text>`
  }

  // 行标题
  let rowHeaders = ''
  for (let r = room.rows; r >= 1; r--) {
    const displayRow = room.rows - r + 1
    const y = pad + titleH + marginTop + colLabelH + (displayRow - 1) * cellH + cellH / 2
    rowHeaders += `<text x="${pad + rowLabelW/2}" y="${y + 2*scale}" text-anchor="middle" font-size="${10*scale}" font-weight="700" fill="#999" font-family="monospace">${r}</text>`
  }

  const title = examName || room.examSubject || '考试座位表'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
    <defs>
      <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.03"/>
      </linearGradient>
    </defs>
    <rect width="${totalW}" height="${totalH}" fill="#ffffff"/>
    <text x="${totalW/2}" y="${pad + titleH - 20*scale}" text-anchor="middle" font-size="${14*scale}" font-weight="700" fill="#1a1a1a" font-family="'Noto Serif SC',serif">${escapeXml(room.name)} · ${escapeXml(title)}</text>
    ${colHeaders}
    ${rowHeaders}
    ${cells}
    <rect x="${pad}" y="${pad + contentH - podiumH}" width="${contentW}" height="${podiumH - 4*scale}" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1"/>
    <text x="${totalW/2}" y="${pad + contentH - 10*scale}" text-anchor="middle" font-size="${10*scale}" font-weight="600" fill="#888" font-family="'Noto Serif SC',serif" letter-spacing="6">讲 台</text>
  </svg>`
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * SVG → Canvas → PNG/JPG 高清导出
 */
export async function downloadRoomImageSVG(room, students, assignments, blockedSeats = [], format = 'png', opts = {}) {
  const svg = buildSeatChartSVG(room, students, assignments, blockedSeats, { ...opts, scale: 2 })
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const mimeType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png'
    const quality = format === 'jpg' || format === 'jpeg' ? 0.92 : undefined

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        const a = document.createElement('a')
        const ext = format === 'jpg' ? 'jpg' : 'png'
        a.download = `${room.name}_座位表.${ext}`
        a.href = URL.createObjectURL(blob)
        a.click()
        URL.revokeObjectURL(a.href)
        resolve(a.href)
      }, mimeType, quality)
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * SVG → Canvas → PDF 导出
 */
export async function downloadRoomPDFSVG(room, students, assignments, blockedSeats = [], opts = {}) {
  const svg = buildSeatChartSVG(room, students, assignments, blockedSeats, { ...opts, scale: 2 })
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    const { default: jsPDF } = await import('jspdf')
    const dataUrl = canvas.toDataURL('image/png')

    const pdfW = 297, pdfH = 210
    const imgRatio = img.width / img.height
    let w = pdfW - 20, h = w / imgRatio
    if (h > pdfH - 20) { h = pdfH - 20; w = h * imgRatio }

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    pdf.addImage(dataUrl, 'PNG', (pdfW - w) / 2, (pdfH - h) / 2, w, h)
    pdf.save(`${room.name}_座位表.pdf`)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * SVG → 打印（新窗口）
 */
export function printRoomSVG(room, students, assignments, blockedSeats = [], opts = {}) {
  const svg = buildSeatChartSVG(room, students, assignments, blockedSeats, { ...opts, scale: 2 })
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${room.name} - 座位表</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}
  svg{max-width:100%;height:auto}
  @media print{@page{size:A4 landscape;margin:6mm}body{background:#fff}}
</style></head><body>${svg}</body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  setTimeout(() => { w.print(); setTimeout(() => w.close(), 500) }, 400)
}
