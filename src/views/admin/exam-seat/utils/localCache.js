/**
 * 考试座位安排模块 — 本地缓存管理
 * 所有数据通过 dataService.js 的 load/save 模式持久化到 localStorage
 * 此文件提供便捷的批量导入/导出辅助函数
 */

const STORAGE_PREFIX = 'dse_'

function load(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function save(key, data) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
}

// 默认 5 间教室（DSE 选修考场）
const DEFAULT_ROOMS = [
  { id: 1, name: '选修大教室', rows: 7, cols: 5, capacity: 35, location: '教学楼 1F', examTime: '', examSubject: '' },
  { id: 2, name: '选修一教室', rows: 4, cols: 3, capacity: 12, location: '教学楼 1F', examTime: '', examSubject: '' },
  { id: 3, name: '选修二教室', rows: 5, cols: 5, capacity: 25, location: '教学楼 2F', examTime: '', examSubject: '' },
  { id: 4, name: '选修三教室', rows: 5, cols: 5, capacity: 25, location: '教学楼 2F', examTime: '', examSubject: '' },
  { id: 5, name: '选修四教室', rows: 5, cols: 5, capacity: 25, location: '教学楼 3F', examTime: '', examSubject: '' }
]

export function loadRooms() {
  let rooms = load('exam_rooms')
  if (!rooms || rooms.length === 0) {
    rooms = DEFAULT_ROOMS
    save('exam_rooms', rooms)
  }
  return rooms
}

export function saveRooms(rooms) {
  save('exam_rooms', rooms)
}

export function loadStudents() {
  return load('exam_students') || []
}

export function saveStudents(students) {
  save('exam_students', students)
}

export function loadAssignments() {
  return load('exam_assignments') || []
}

export function saveAssignments(assignments) {
  save('exam_assignments', assignments)
}

export function loadBlockedSeats() {
  return load('exam_blocked_seats') || []
}

export function saveBlockedSeats(blocked) {
  save('exam_blocked_seats', blocked)
}

export function clearAllData() {
  save('exam_rooms', null)
  save('exam_students', null)
  save('exam_assignments', null)
  save('exam_blocked_seats', null)
}

export function resetToDefaults() {
  save('exam_rooms', DEFAULT_ROOMS)
  save('exam_students', [])
  save('exam_assignments', [])
  save('exam_blocked_seats', [])
  return { rooms: DEFAULT_ROOMS, students: [], assignments: [], blockedSeats: [] }
}
