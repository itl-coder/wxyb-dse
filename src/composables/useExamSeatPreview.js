/**
 * useExamSeatPreview — 考场座位预览逻辑
 * 用于门户端：构建预览HTML、SVG高清导出（无html2canvas）、打印、配置持久化
 */
import { ref, computed } from 'vue'
import { useExamSeat2Store } from '@/views/admin/exams/exam-seat2/store/examSeat2Store'
import { buildSeatChartSVG } from '@/views/admin/exams/exam-seat2/utils/exportPipeline'

const CFG_KEY = 'dse_exam_seat_preview_cfg'

const defaultCfg = {
  showRowColLabels: true,
  showBlockedSeats: false,
  watermarkEnabled: true,
  watermarkText: '内部资料·仅供学生使用'
}

function loadCfg() {
  try {
    const raw = localStorage.getItem(CFG_KEY)
    return raw ? { ...defaultCfg, ...JSON.parse(raw) } : { ...defaultCfg }
  } catch { return { ...defaultCfg } }
}

function saveCfg(cfg) {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg))
}

export function useExamSeatPreview() {
  const store = useExamSeat2Store()
  const cfg = ref(loadCfg())
  const currentRoomId = ref(store.rooms[0]?.id || null)

  const currentRoom = computed(() => store.rooms.find(r => r.id === currentRoomId.value))
  const rooms = computed(() => store.rooms)

  function saveConfig() { saveCfg(cfg.value) }

  /**
   * 构建预览用 HTML（简洁风格，用于屏幕预览和打印）
   */
  function buildPreviewHTML(room) {
    if (!room) return ''
    const students = store.students
    const assignments = store.assignments
    const blockedSeats = store.blockedSeats || []

    const sMap = {}
    students.forEach(s => { sMap[s.id] = s })

    const aMap = {}
    assignments.forEach(a => { aMap[`${a.roomId}_${a.seatIndex}`] = a })

    const blockedSet = new Set(blockedSeats.filter(b => b.roomId === room.id).map(b => b.seatIndex))

    const c = cfg.value

    let rowsHTML = ''
    for (let r = 1; r <= room.rows; r++) {
      let cells = ''
      for (let col = 1; col <= room.cols; col++) {
        const si = (r - 1) * room.cols + col
        const key = `${room.id}_${si}`
        const a = aMap[key]
        const s = a ? sMap[a.studentId] : null
        const blocked = blockedSet.has(si)

        if (blocked && !c.showBlockedSeats) {
          cells += `<td class="sc empty"></td>`
          continue
        }

        const name = blocked ? '—' : (s ? s.name : '')
        const cls = !blocked && s ? (s.className || '') : ''
        const electives = !blocked && s && s.electives?.length ? s.electives.slice(0, 2).join(' / ') : ''
        const cellClass = blocked ? 'blocked' : (s ? 'occupied' : 'empty')

        cells += `<td class="sc ${cellClass}">
          <div class="sn">${name}</div>
          ${cls ? `<div class="scls">${cls}</div>` : ''}
          ${electives ? `<div class="sel">${electives}</div>` : ''}
        </td>`
      }
      const rowLabel = c.showRowColLabels ? `<td class="rl">${r}</td>` : ''
      rowsHTML += `<tr>${rowLabel}${cells}</tr>`
    }

    let colLabels = ''
    if (c.showRowColLabels) {
      colLabels += '<td class="co"></td>'
      for (let col = 1; col <= room.cols; col++) {
        colLabels += `<td class="cl">${String.fromCharCode(64 + col)}</td>`
      }
    }

    const cellW = room.cols > 10 ? 52 : room.cols > 8 ? 58 : 66

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      @page{size:297mm 210mm;margin:10mm 12mm 12mm 12mm}
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;font-size:13px;color:#1a1a1a;width:1122px}
      .hdr{text-align:center;margin-bottom:6px}
      .hdr h1{font-size:18px;font-weight:700;letter-spacing:2px}
      table{margin:0 auto;border-collapse:collapse;table-layout:fixed;width:100%}
      td{border:1px solid #bbb;height:42px;text-align:center;vertical-align:middle;padding:2px 4px;position:relative}
      td.co,td.rl,td.cl{background:#f0f0f0;font-size:9px;font-weight:700;color:#666;border:none;min-width:22px;height:auto;font-family:monospace}
      td.rl{text-align:center;min-width:20px}
      td.co{border:none;min-width:0}
      .sc.empty{background:#fdfdfd}
      .sc.occupied{background:#fff;border-left:3px solid #6366f1}
      .sc.blocked{background:#eee;color:#bbb}
      .sn{font-size:12px;font-weight:600;line-height:1.3}
      .scls{font-size:8px;color:#555;line-height:1.2}
      .sel{font-size:7px;color:#888;line-height:1.2}
      .ft{text-align:center;margin-top:8px;font-size:9px;color:#aaa}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <div class="hdr"><h1>${room.name} — 考场座位表</h1></div>
    <table>${colLabels}${rowsHTML}</table>
    <div class="ft">共 ${room.rows * room.cols} 座 · DSE 智能学情分析</div>
    </body></html>`
  }

  /**
   * SVG → Canvas → PNG/JPG 高清导出（无html2canvas）
   */
  async function capturePreviewImage(room, format = 'png') {
    const svg = buildSeatChartSVG(room, store.students, store.assignments, store.blockedSeats, {
      examName: store.examName,
      doorDirection: store.doorDirection,
      doorSeatIndex: store.getDoorSeatIndex(room.id),
      scale: 2
    })

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
      ctx.fillStyle = '#faf8f5'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      // 水印叠加
      if (cfg.value.watermarkEnabled && cfg.value.watermarkText) {
        drawWatermark(canvas, cfg.value.watermarkText, 0.04)
      }

      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
      const quality = format === 'jpg' ? 0.92 : undefined
      const dataUrl = canvas.toDataURL(mime, quality)

      return { dataUrl, width: canvas.width, height: canvas.height }
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Canvas 水印绘制
   */
  function drawWatermark(canvas, text, opacity = 0.04) {
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.fillStyle = '#000'
    ctx.font = '14px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.translate(w / 2, h / 2)
    ctx.rotate(-22 * Math.PI / 180)
    const stepX = 220
    const stepY = 160
    for (let x = -w; x < w * 1.5; x += stepX) {
      for (let y = -h; y < h * 1.5; y += stepY) {
        ctx.fillText(text, x, y)
      }
    }
    ctx.restore()
  }

  /**
   * 下载图片
   */
  async function downloadImage(room, format = 'png') {
    const { dataUrl } = await capturePreviewImage(room, format)
    const ext = format === 'jpg' ? 'jpg' : 'png'
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${room.name}_考场座位表.${ext}`
    a.click()
  }

  /**
   * 打印座位表（SVG 新窗口）
   */
  function printPreview(room) {
    const svg = buildSeatChartSVG(room, store.students, store.assignments, store.blockedSeats, {
      examName: store.examName,
      doorDirection: store.doorDirection,
      doorSeatIndex: store.getDoorSeatIndex(room.id),
      scale: 2
    })
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

  return {
    cfg, currentRoomId, currentRoom, rooms,
    saveConfig, buildPreviewHTML, capturePreviewImage,
    downloadImage, printPreview
  }
}
