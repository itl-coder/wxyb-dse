/**
 * 导出/打印工具
 * 生成 A4 座位表打印模板和门贴模板
 * 打印优化：高对比度黑色文字、清晰字号、适宜A4排版
 */

/**
 * 生成教室座位表 HTML（A4 打印优化）
 */
export function buildSeatChartHTML(room, students, assignments) {
  const studentMap = {}
  students.forEach(s => { studentMap[s.id] = s })

  const seatMap = {}
  assignments.forEach(a => {
    seatMap[`${a.roomId}_${a.seatIndex}`] = a
  })

  let rows = ''
  for (let r = 1; r <= room.rows; r++) {
    let cells = ''
    for (let c = 1; c <= room.cols; c++) {
      const seatIndex = (r - 1) * room.cols + c
      const key = `${room.id}_${seatIndex}`
      const a = seatMap[key]
      const s = a ? studentMap[a.studentId] : null
      const name = s ? s.name : ''
      const cls = s ? (s.className || '') : ''
      cells += `<td class="seat-cell ${s ? 'occupied' : 'empty'}">
        <div class="seat-name">${name}</div>
        ${cls ? `<div class="seat-cls">${cls}</div>` : ''}
      </td>`
    }
    rows += `<tr><td class="row-label">${r}</td>${cells}</tr>`
  }

  let colLabels = '<td class="corner"></td>'
  for (let c = 1; c <= room.cols; c++) {
    const colLetter = String.fromCharCode(64 + c)
    colLabels += `<td class="col-label">${colLetter}</td>`
  }

  // 自适应列宽：根据列数调整 min-width
  const cellWidth = room.cols > 10 ? 54 : room.cols > 8 ? 62 : 72
  const fontSize = room.cols > 10 ? 12 : 14

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${room.name} - 座位表</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif;
    padding: 28px 24px;
    color: #1a1a1a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header { text-align: center; margin-bottom: 18px; }
  .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 5px; color: #111; letter-spacing: 1px; }
  .header .meta { font-size: 12px; color: #555; }
  .header .meta span { margin: 0 8px; }
  .podium {
    text-align: center; padding: 12px; margin: 0 36px 18px;
    background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 5px;
    font-size: 14px; color: #777; letter-spacing: 4px; font-weight: 600;
  }
  table { margin: 0 auto; border-collapse: collapse; }
  td {
    border: 1px solid #ccc;
    min-width: ${cellWidth}px; height: 50px;
    text-align: center; vertical-align: middle; padding: 3px 4px;
  }
  td.corner { border: none; min-width: 0; }
  td.row-label, td.col-label {
    background: #f3f3f3; font-size: 10px; font-weight: 700;
    color: #666; border: none; min-width: 24px; height: auto;
    font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
    letter-spacing: 1px;
  }
  .seat-cell.empty { background: #fafafa; }
  .seat-cell.occupied { background: #fff; }
  .seat-name {
    font-size: ${fontSize}px; font-weight: 700; color: #111;
    line-height: 1.3; max-width: ${cellWidth - 4}px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    margin: 0 auto;
  }
  .seat-cls { font-size: 10px; color: #555; margin-top: 1px; }
  .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #ccc; }
  @media print {
    body { padding: 7mm 8mm; }
    .footer { display: none; }
    @page { size: A4 portrait; margin: 5mm; }
  }
</style></head><body>
<div class="header">
  <h1>${room.name} 座位表</h1>
  <div class="meta">
    ${room.examSubject ? `<span>科目: ${room.examSubject}</span>` : ''}
    ${room.examTime ? `<span>时间: ${room.examTime}</span>` : ''}
    <span>${room.rows}行×${room.cols}列 · ${room.rows * room.cols}座</span>
  </div>
</div>
<div class="podium">讲 台</div>
<table>${colLabels}${rows}</table>
<div class="footer">DSE AI 智能学情分析 · ${new Date().toLocaleDateString('zh-CN')}</div>
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
    padding: 32px 28px; color: #1a1a1a; background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #444; padding-bottom: 12px; }
  .header h1 { font-size: 24px; font-weight: 700; color: #111; letter-spacing: 1px; }
  .header .info { font-size: 13px; color: #555; margin-top: 6px; }
  .header .info span { margin: 0 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f5f5f5; border-bottom: 2px solid #999; padding: 10px 8px; text-align: left; font-weight: 700; color: #333; }
  td { padding: 8px 8px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #fafafa; }
  .num { width: 40px; color: #888; text-align: center; font-family: "SF Mono", "Cascadia Code", monospace; }
  .name { font-weight: 700; color: #111; font-size: 14px; }
  .class-col { color: #555; }
  .seat-col { color: #666; font-family: "SF Mono", "Cascadia Code", "Consolas", monospace; font-size: 12px; width: 60px; text-align: center; }
  .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #ccc; }
  @media print {
    body { padding: 6mm 8mm; }
    .footer { display: none; }
    @page { size: A4 portrait; margin: 5mm; }
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
 * 在新窗口中打开并打印
 */
export function openForPrint(html) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }
}

/**
 * 导出所有教室座位表
 */
export function exportAllCharts(rooms, students, assignments) {
  rooms.forEach(room => {
    const html = buildSeatChartHTML(room, students, assignments)
    openForPrint(html)
  })
}
