/**
 * 冲突检测工具
 * 检测座位安排中的相邻冲突（同班、同选修）
 */

/**
 * 两个座位是否在教室网格中相邻（上下左右）
 */
function areAdjacent(a, b) {
  if (a.roomId !== b.roomId) return false
  return (
    (a.row === b.row && Math.abs(a.col - b.col) === 1) ||
    (a.col === b.col && Math.abs(a.row - b.row) === 1)
  )
}

/**
 * 构建座位坐标索引
 */
function buildSlotIndex(rooms) {
  const map = {}
  rooms.forEach(room => {
    for (let r = 1; r <= room.rows; r++) {
      for (let c = 1; c <= room.cols; c++) {
        const seatIndex = (r - 1) * room.cols + c
        map[`${room.id}_${seatIndex}`] = { roomId: room.id, seatIndex, row: r, col: c }
      }
    }
  })
  return map
}

/**
 * 获取座位的相邻座位 key 列表
 */
function getAdjacentKeys(roomId, seatIndex, slotIndex) {
  const slot = slotIndex[`${roomId}_${seatIndex}`]
  if (!slot) return []
  const adj = []
  for (const key in slotIndex) {
    const s = slotIndex[key]
    if (areAdjacent(slot, s)) adj.push(key)
  }
  return adj
}

/**
 * 完整冲突检测
 * @returns {Array} [{ type, label, studentIds, roomId, seats }]
 */
export function detectConflicts(assignments, students, rooms) {
  if (!assignments.length || !students.length) return []

  const slotIndex = buildSlotIndex(rooms)
  const studentMap = {}
  students.forEach(s => { studentMap[s.id] = s })

  // 座位 → 学生映射
  const seatMap = {}
  assignments.forEach(a => {
    seatMap[`${a.roomId}_${a.seatIndex}`] = a
  })

  const conflicts = []
  const seen = new Set()

  for (const a of assignments) {
    const slot = slotIndex[`${a.roomId}_${a.seatIndex}`]
    if (!slot) continue
    const student = studentMap[a.studentId]
    if (!student) continue

    const adjKeys = getAdjacentKeys(a.roomId, a.seatIndex, slotIndex)

    for (const adjKey of adjKeys) {
      const adjAssign = seatMap[adjKey]
      if (!adjAssign || adjAssign.studentId === a.studentId) continue
      const adjStudent = studentMap[adjAssign.studentId]
      if (!adjStudent) continue

      const pairKey = [a.studentId, adjAssign.studentId].sort().join('_')

      // 同班冲突
      if (student.className && adjStudent.className && student.className === adjStudent.className) {
        const conflictKey = `sameClass_${pairKey}`
        if (!seen.has(conflictKey)) {
          seen.add(conflictKey)
          conflicts.push({
            type: 'sameClass',
            label: `同班相邻: ${student.className}`,
            studentIds: [a.studentId, adjAssign.studentId],
            roomId: a.roomId,
            seats: [a.seatIndex, adjAssign.seatIndex]
          })
        }
      }

      // 同选修冲突
      const sharedElectives = (student.electives || []).filter(e => (adjStudent.electives || []).includes(e))
      for (const elective of sharedElectives) {
        const conflictKey = `sameElective_${elective}_${pairKey}`
        if (!seen.has(conflictKey)) {
          seen.add(conflictKey)
          conflicts.push({
            type: 'sameElective',
            label: `同选修相邻: ${elective}`,
            studentIds: [a.studentId, adjAssign.studentId],
            roomId: a.roomId,
            seats: [a.seatIndex, adjAssign.seatIndex]
          })
        }
      }
    }
  }

  return conflicts
}

/**
 * 获取单个学生的冲突
 */
export function getStudentConflicts(studentId, allConflicts) {
  return allConflicts.filter(c => c.studentIds.includes(studentId))
}
