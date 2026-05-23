/**
 * 智能排座算法 v2
 * Fisher-Yates 洗牌 + 贪心分配 + 同班≤4限制 + 同选修打散 + 相邻分离
 */

/**
 * Fisher-Yates shuffle
 */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 按选修科目打乱顺序：确保同选修的学生分散排列
 */
function shuffleByElectives(students) {
  // 按选修分组
  const electiveGroups = new Map()
  const noElective = []

  students.forEach(s => {
    if (!s.electives || s.electives.length === 0) {
      noElective.push(s)
      return
    }
    // 用第一个选修作为主分组依据
    const key = s.electives[0]
    if (!electiveGroups.has(key)) electiveGroups.set(key, [])
    electiveGroups.get(key).push(s)
  })

  // 每个选修组内洗牌
  const result = []
  const groups = [...electiveGroups.values()].map(g => shuffle(g))
  const maxLen = Math.max(...groups.map(g => g.length), 0)

  // 轮询取各组成员，确保同选修不聚集
  for (let i = 0; i < maxLen; i++) {
    for (const g of groups) {
      if (i < g.length) result.push(g[i])
    }
  }

  // 无选修学生随机插入
  const shuffledNoElec = shuffle(noElective)
  for (const s of shuffledNoElec) {
    const pos = Math.floor(Math.random() * (result.length + 1))
    result.splice(pos, 0, s)
  }

  return result
}

/**
 * 计算教室座位索引数组
 */
function getSeatSlots(rooms, blockedSeats = [], lockedAssignments = []) {
  const blockedSet = new Set(blockedSeats.map(b => `${b.roomId}_${b.seatIndex}`))
  const lockedSet = new Set(lockedAssignments.map(a => `${a.roomId}_${a.seatIndex}`))
  const slots = []
  rooms.forEach(room => {
    for (let r = 1; r <= room.rows; r++) {
      for (let c = 1; c <= room.cols; c++) {
        const seatIndex = (r - 1) * room.cols + c
        const key = `${room.id}_${seatIndex}`
        if (!blockedSet.has(key) && !lockedSet.has(key)) {
          slots.push({ roomId: room.id, seatIndex, row: r, col: c })
        }
      }
    }
  })
  return slots
}

function areAdjacent(a, b) {
  if (a.roomId !== b.roomId) return false
  return (
    (a.row === b.row && Math.abs(a.col - b.col) === 1) ||
    (a.col === b.col && Math.abs(a.row - b.row) === 1)
  )
}

function findConflicts(assignments, students, slots) {
  const conflicts = []
  const seatMap = {}
  assignments.forEach(a => {
    seatMap[`${a.roomId}_${a.seatIndex}`] = a
  })

  for (const a of assignments) {
    const slot = slots.find(s => s.roomId === a.roomId && s.seatIndex === a.seatIndex)
    if (!slot) continue
    const student = students.find(st => st.id === a.studentId)
    if (!student) continue

    const adjSlots = slots.filter(s =>
      s.roomId === a.roomId && areAdjacent(slot, s)
    )

    for (const adj of adjSlots) {
      const adjKey = `${adj.roomId}_${adj.seatIndex}`
      const adjAssignment = seatMap[adjKey]
      if (!adjAssignment) continue
      const adjStudent = students.find(st => st.id === adjAssignment.studentId)
      if (!adjStudent) continue

      if (student.className && adjStudent.className && student.className === adjStudent.className) {
        const dup = conflicts.find(c =>
          c.type === 'sameClass' &&
          c.studentIds.includes(student.id) &&
          c.studentIds.includes(adjStudent.id)
        )
        if (!dup) {
          conflicts.push({
            type: 'sameClass',
            label: `同班: ${student.className}`,
            studentIds: [student.id, adjStudent.id],
            roomId: a.roomId,
            seats: [a.seatIndex, adjAssignment.seatIndex]
          })
        }
      }

      const shared = (student.electives || []).filter(e => (adjStudent.electives || []).includes(e))
      for (const elective of shared) {
        const dup = conflicts.find(c =>
          c.type === 'sameElective' &&
          c.label === `同选修: ${elective}` &&
          c.studentIds.includes(student.id) &&
          c.studentIds.includes(adjStudent.id)
        )
        if (!dup) {
          conflicts.push({
            type: 'sameElective',
            label: `同选修: ${elective}`,
            studentIds: [student.id, adjStudent.id],
            roomId: a.roomId,
            seats: [a.seatIndex, adjAssignment.seatIndex]
          })
        }
      }
    }
  }

  return conflicts
}

/** 同班同教室最大人数 */
const MAX_SAME_CLASS_PER_ROOM = 4

/**
 * 主排座函数
 */
export function autoArrange(students, rooms, options = {}) {
  const {
    blockedSeats = [],
    lockedAssignments = [],
    targetRoomId = null,
    unassignedOnly = false
  } = options

  if (!students.length) return { assignments: [], unassigned: [], warnings: ['没有导入学生数据'], conflicts: [] }
  if (!rooms.length) return { assignments: [], unassigned: [...students], warnings: ['没有配置教室'], conflicts: [] }

  const targetRooms = targetRoomId ? rooms.filter(r => r.id === targetRoomId) : rooms
  if (targetRoomId && !targetRooms.length) return { assignments: [], unassigned: [...students], warnings: ['目标教室不存在'], conflicts: [] }

  const assignments = [...lockedAssignments]
  const warnings = []

  // 独立班级约束：有专属班级的教室容量必须足够，不足则直接返回错误
  const exclusiveRooms = targetRooms.filter(r => r.exclusiveClassId)
  for (const room of exclusiveRooms) {
    const classStudents = students.filter(s => s.className === room.exclusiveClassId)
    const roomSlotCount = getSeatSlots([room], blockedSeats, lockedAssignments).length
    if (classStudents.length > roomSlotCount) {
      return {
        assignments: [...lockedAssignments],
        unassigned: [...students],
        warnings: [`${room.name}（${room.exclusiveClassId}）容量不足：${classStudents.length}人 > ${roomSlotCount}座，无法排座`],
        conflicts: []
      }
    }
  }

  const allSlots = getSeatSlots(targetRooms, blockedSeats, lockedAssignments)

  // 按选修打乱学生顺序（确保同选修分散）
  const ordered = shuffleByElectives(students)

  // 每教室每班级已安排人数
  const classRoomCount = {} // { `${roomId}_${className}`: count }
  // 先从已锁定的分配中初始化计数
  for (const a of lockedAssignments) {
    const s = students.find(st => st.id === a.studentId)
    if (s && s.className) {
      const key = `${a.roomId}_${s.className}`
      classRoomCount[key] = (classRoomCount[key] || 0) + 1
    }
  }

  const roomSlots = {}
  targetRooms.forEach(r => {
    roomSlots[r.id] = allSlots.filter(s => s.roomId === r.id)
  })

  const unassigned = []

  // 排他性班级映射：班级名 → 专属教室ID
  const exclusiveClassRoomMap = {}
  targetRooms.forEach(r => {
    if (r.exclusiveClassId) {
      exclusiveClassRoomMap[r.exclusiveClassId] = r.id
    }
  })

  // 贪心轮询分配（默认模式）
  const roomOrder = [...targetRooms]
  let roomTurnIdx = 0

  for (const student of ordered) {
    let placed = false
    const startTurn = roomTurnIdx
    let triedAll = false

    while (!triedAll) {
      const room = roomOrder[roomTurnIdx % roomOrder.length]
      roomTurnIdx++

      if (roomTurnIdx % roomOrder.length === startTurn % roomOrder.length && roomTurnIdx > startTurn) {
        triedAll = true
      }

      // 检查专属班级限制
      if (room.exclusiveClassId && student.className !== room.exclusiveClassId) continue

      // 排他性班级学生只能去其专属教室
      const exclusiveRoomIdForStudent = exclusiveClassRoomMap[student.className]
      if (exclusiveRoomIdForStudent && room.id !== exclusiveRoomIdForStudent) continue

      // 检查同班限制
      if (student.className) {
        const classKey = `${room.id}_${student.className}`
        const currentCount = classRoomCount[classKey] || 0
        if (currentCount >= MAX_SAME_CLASS_PER_ROOM) continue
      }

      // 找该教室可用的最佳座位
      const slots = roomSlots[room.id] || []
      let bestSlot = null

      for (const slot of slots) {
        if (assignments.some(a => a.roomId === slot.roomId && a.seatIndex === slot.seatIndex)) continue

        // 检查相邻冲突
        const adjSlots = allSlots.filter(s =>
          s.roomId === slot.roomId && areAdjacent(slot, s)
        )
        let hasConflict = false
        for (const adj of adjSlots) {
          const adjA = assignments.find(a => a.roomId === adj.roomId && a.seatIndex === adj.seatIndex)
          if (!adjA) continue
          const adjS = students.find(s => s.id === adjA.studentId)
          if (!adjS) continue

          if (student.className && adjS.className && student.className === adjS.className) {
            hasConflict = true
            break
          }
          const shared = (student.electives || []).filter(e => (adjS.electives || []).includes(e))
          if (shared.length) {
            hasConflict = true
            break
          }
        }

        if (!hasConflict) {
          bestSlot = slot
          break
        }
      }

      // 如果没有无冲突座位，取第一个可用
      if (!bestSlot) {
        bestSlot = slots.find(s =>
          !assignments.some(a => a.roomId === s.roomId && a.seatIndex === s.seatIndex)
        )
      }

      if (bestSlot) {
        assignments.push({
          roomId: bestSlot.roomId,
          seatIndex: bestSlot.seatIndex,
          studentId: student.id,
          locked: true // 自动排座默认锁定
        })
        // 移除已用槽位
        roomSlots[bestSlot.roomId] = roomSlots[bestSlot.roomId].filter(s => s.seatIndex !== bestSlot.seatIndex)
        // 更新班级计数
        if (student.className) {
          const classKey = `${bestSlot.roomId}_${student.className}`
          classRoomCount[classKey] = (classRoomCount[classKey] || 0) + 1
        }
        placed = true
        break
      }
    }

    if (!placed) {
      // 放宽同班限制再试一次
      for (const room of roomOrder) {
        // 排他性检查
        if (room.exclusiveClassId && student.className !== room.exclusiveClassId) continue
        const exclusiveRoomIdForStudent = exclusiveClassRoomMap[student.className]
        if (exclusiveRoomIdForStudent && room.id !== exclusiveRoomIdForStudent) continue

        const slots = roomSlots[room.id] || []
        const slot = slots.find(s =>
          !assignments.some(a => a.roomId === s.roomId && a.seatIndex === s.seatIndex)
        )
        if (slot) {
          assignments.push({
            roomId: slot.roomId,
            seatIndex: slot.seatIndex,
            studentId: student.id,
            locked: true
          })
          roomSlots[slot.roomId] = roomSlots[slot.roomId].filter(s => s.seatIndex !== slot.seatIndex)
          if (student.className) {
            const classKey = `${slot.roomId}_${student.className}`
            classRoomCount[classKey] = (classRoomCount[classKey] || 0) + 1
          }
          placed = true
          break
        }
      }
    }

    if (!placed) {
      unassigned.push(student)
    }
  }

  if (unassigned.length > 0) {
    warnings.push(`容量不足：${unassigned.length} 名学生无座位可安排`)
  }

  const conflicts = findConflicts(assignments, students, allSlots)
  return { assignments, unassigned, warnings, conflicts }
}

/**
 * 重新检测冲突
 */
export function detectConflicts(assignments, students, rooms, blockedSeats = []) {
  const slots = getSeatSlots(rooms, blockedSeats, [])
  return findConflicts(assignments, students, slots)
}
