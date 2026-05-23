<template>
  <Teleport to="body">
    <div class="epp-overlay" @click.self="$emit('close')">
      <div class="epp-dialog">
        <div class="epp-dialog-header">
          <h3 class="epp-dialog-title">试卷分发清单打印预览</h3>
          <button class="epp-dialog-close" @click="$emit('close')">×</button>
        </div>

        <div class="epp-toolbar">
          <button class="epp-btn epp-btn-print" @click="onPrint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 12H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            打印
          </button>
        </div>

        <!-- 打印内容区域 -->
        <div class="epp-content" ref="printRef">
          <div class="epp-page" v-for="room in stats?.rooms || []" :key="room.roomId">
            <div class="epp-page-head">
              <h2 class="epp-ph-title">{{ room.roomName }} — 试卷分发清单</h2>
              <div class="epp-ph-meta">
                <span>{{ room.rows }}行 × {{ room.cols }}列</span>
                <span>{{ room.totalPapers }} 份试卷</span>
              </div>
            </div>

            <table class="epp-table">
              <thead>
                <tr>
                  <th>座号</th>
                  <th>姓名</th>
                  <th>班级</th>
                  <th>科目</th>
                  <th>选修</th>
                  <th class="epp-th-chk">✓</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="entry in room.seats"
                  :key="entry.seatIndex"
                  :class="{ 'epp-row-header': entry.isSectionHeader }"
                >
                  <td class="epp-td-seatno">{{ entry.seatLabel }}</td>
                  <td class="epp-td-name">{{ entry.studentName || '—' }}</td>
                  <td class="epp-td-class">{{ entry.className || '—' }}</td>
                  <td class="epp-td-subject">{{ entry.subject || '—' }}</td>
                  <td class="epp-td-elective">{{ entry.electives || '—' }}</td>
                  <td class="epp-td-chk"></td>
                </tr>
              </tbody>
            </table>

            <!-- 按科目汇总 -->
            <div class="epp-summary">
              <div class="epp-sum-item" v-for="s in room.bySubject" :key="s.subject">
                <span class="epp-sum-label">{{ s.subject }}</span>
                <span class="epp-sum-count">{{ s.count }} 份</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'

defineEmits(['close'])

const store = useExamSeat2Store()
const printRef = ref(null)

const stats = computed(() => {
  const ps = store.paperStatistics
  if (!ps?.rooms?.length) return null

  // 为每个教室生成完整的行数据
  return {
    ...ps,
    rooms: ps.rooms.map(room => {
      const roomObj = store.rooms.find(r => r.id === room.roomId)
      const rows = roomObj?.rows || 1
      const cols = roomObj?.cols || 1
      const seats = []
      for (let si = 1; si <= rows * cols; si++) {
        const r = Math.floor((si - 1) / cols) + 1
        const c = ((si - 1) % cols) + 1
        const colLabel = String.fromCharCode(64 + c)
        const entry = room.seats?.find(s => s.seatIndex === si)
        seats.push({
          seatIndex: si,
          seatLabel: colLabel + r,
          studentName: entry?.studentName || '',
          className: entry?.className || '',
          subject: entry?.subject || '',
          electives: entry?.electives?.join(' / ') || ''
        })
      }
      return { ...room, rows, cols, seats }
    })
  }
})

function onPrint() {
  if (!printRef.value) return
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return

  const styles = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; font-size: 12px; color: #1e293b; background: #fff; }
    .epp-page { padding: 8mm 10mm; page-break-after: always; }
    .epp-page:last-child { page-break-after: auto; }
    .epp-page-head { margin-bottom: 4mm; border-bottom: 2px solid #6366f1; padding-bottom: 2mm; }
    .epp-ph-title { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
    .epp-ph-meta { font-size: 10px; color: #64748b; display: flex; gap: 12px; }
    .epp-table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
    .epp-table th { font-size: 10px; font-weight: 600; padding: 3px 4px; border-bottom: 1.5px solid #cbd5e1; text-align: left; color: #475569; }
    .epp-table td { font-size: 10px; padding: 2px 4px; border-bottom: 1px solid #e2e8f0; }
    .epp-td-seatno { font-family: "SF Mono", "Consolas", monospace; width: 36px; color: #64748b; }
    .epp-td-name { font-weight: 600; width: 64px; }
    .epp-td-chk { width: 24px; text-align: center; }
    .epp-th-chk { width: 24px; text-align: center; }
    .epp-summary { display: flex; flex-wrap: wrap; gap: 4px; }
    .epp-sum-item { display: flex; align-items: center; gap: 4px; padding: 2px 8px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 9px; }
    .epp-sum-label { color: #475569; }
    .epp-sum-count { font-weight: 700; color: #6366f1; }
    @page { size: A4; margin: 6mm; }
  `

  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>试卷分发清单</title><style>${styles}</style></head><body>${printRef.value.innerHTML}</body></html>`)
  win.document.close()
  setTimeout(() => { win.print(); win.close() }, 300)
}
</script>

<style scoped>
.epp-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.epp-dialog {
  width: 760px;
  max-height: 85vh;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
}
.epp-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--admin-border);
  flex-shrink: 0;
}
.epp-dialog-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--admin-text);
  margin: 0;
}
.epp-dialog-close {
  width: 26px; height: 26px;
  border: 1px solid var(--admin-border);
  border-radius: 5px;
  background: transparent;
  color: var(--admin-text-muted);
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.epp-dialog-close:hover { border-color: var(--admin-danger); color: var(--admin-danger); }

.epp-toolbar {
  display: flex;
  gap: 6px;
  padding: 8px 18px;
  border-bottom: 1px solid var(--admin-border);
  flex-shrink: 0;
}
.epp-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  background: var(--admin-surface);
  color: var(--admin-text);
  cursor: pointer;
  font-size: 12px;
  font-family: var(--admin-font);
  font-weight: 500;
  transition: all 0.15s;
}
.epp-btn:hover { border-color: var(--admin-border-light); background: var(--admin-surface-hover); }
.epp-btn-print {
  background: var(--admin-accent);
  border-color: var(--admin-accent);
  color: #fff;
}
.epp-btn-print:hover { background: var(--admin-accent-dark); border-color: var(--admin-accent-dark); }

.epp-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #fff;
}
.epp-page {
  background: #fff;
  color: #1e293b;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}
.epp-page:last-child { border-bottom: none; margin-bottom: 0; }
.epp-page-head {
  margin-bottom: 12px;
  border-bottom: 2px solid #6366f1;
  padding-bottom: 6px;
}
.epp-ph-title { font-size: 15px; font-weight: 700; margin: 0 0 4px; color: #1e293b; }
.epp-ph-meta { font-size: 11px; color: #64748b; display: flex; gap: 16px; }

.epp-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 14px;
}
.epp-table th {
  font-size: 10px;
  font-weight: 600;
  padding: 5px 6px;
  border-bottom: 2px solid #cbd5e1;
  text-align: left;
  color: #475569;
}
.epp-table td {
  font-size: 11px;
  padding: 4px 6px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
}
.epp-td-seatno { font-family: "SF Mono", "Consolas", monospace; color: #64748b !important; }
.epp-td-name { font-weight: 600; color: #1e293b !important; }
.epp-td-chk { text-align: center; }
.epp-th-chk { width: 28px; text-align: center; }

.epp-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.epp-sum-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  font-size: 10px;
}
.epp-sum-label { color: #475569; }
.epp-sum-count { font-weight: 700; color: #6366f1; }
</style>
