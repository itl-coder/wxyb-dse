/**
 * 确定性颜色哈希函数
 * 同一班级名称始终产生同一颜色，用于座位表和名单中的班级色条
 * 替代 SeatGrid.vue 和 StudentPool.vue 中两个不同的 classColor() 实现
 */
const PALETTE = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#3b82f6', '#2563eb', '#1d4ed8'
]

/**
 * @param {string} className - 班级名称，如 "5D"、"3班"
 * @returns {string} 16 进制颜色值
 */
export function classColor(className) {
  if (!className) return PALETTE[0]
  let hash = 0
  for (let i = 0; i < className.length; i++) {
    hash = className.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32bit integer
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

/** 6 种座位状态对应的颜色（用于座位表） */
export const SEAT_STATUS_COLORS = {
  normal: '#ffffff',
  empty: '#f0f0f0',
  blocked: '#999999',
  absent: '#ffcccc',
  special: '#ffffcc',
  exclusive: '#ccffcc'
}
