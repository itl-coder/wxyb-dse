/**
 * 考试座位自动排座算法（优化版 v2）
 *
 * 新增：
 * - 冲突评分机制（同班相邻 + 选科相邻 + 前后连续 + 左右连续）
 * - 预留位自动跳过
 * - 多方案比较（选最低冲突方案）
 * - 同班距离检测
 */

// ==================== S 型蛇形排列 ====================

export function getSnakeOrder(rows, cols, doorDirection = 'left') {
  const order = []
  const startCol = doorDirection === 'right' ? cols : 1
  const colStep = doorDirection === 'right' ? -1 : 1

  for (let r = 1; r <= rows; r++) {
    if (r % 2 === 1) {
      const endC = doorDirection === 'right' ? 1 : cols
      for (let c = startCol; doorDirection === 'right' ? c >= endC : c <= endC; c += colStep) {
        order.push((r - 1) * cols + c)
      }
    } else {
      const endC = doorDirection === 'right' ? cols : 1
      for (let c = doorDirection === 'right' ? 1 : cols; doorDirection === 'right' ? c <= endC : c >= endC; c += -colStep) {
        order.push((r - 1) * cols + c)
      }
    }
  }
  return order
}

// ==================== M型 / 逐行 发卷顺序 ====================

/**
 * M型发卷顺序：列向蛇形，从门口座位开始向后走到底，换列折返
 * 返回 { order: [{r,c,si}], lookup: {r_c: step}, totalSteps }
 */
export function getMShapeOrder(rows, cols, doorDirection = 'left', doorSeatIndex = null, blockedSet = null) {
	const order = []
	const doorRight = doorDirection === 'right'

	let doorR = 1
	if (doorSeatIndex !== null && doorSeatIndex !== undefined) {
		doorR = Math.floor((doorSeatIndex - 1) / cols) + 1
	}

	const startCol = doorRight ? cols : 1
	const endCol = doorRight ? 1 : cols
	const colStep = doorRight ? -1 : 1

	let forward = true
	let isFirstCol = true
	const doorColRemaining = []

	for (let c = startCol; doorRight ? c >= endCol : c <= endCol; c += colStep) {
		const rowsArr = []
		if (isFirstCol) {
			for (let r = doorR; r <= rows; r++) rowsArr.push(r)
			for (let r = doorR - 1; r >= 1; r--) doorColRemaining.push({ r, c })
			isFirstCol = false
		} else {
			for (let r = 1; r <= rows; r++) rowsArr.push(r)
			if (!forward) rowsArr.reverse()
		}

		for (const r of rowsArr) {
			const si = (r - 1) * cols + c
			if (!blockedSet || !blockedSet.has(si)) order.push({ r, c, si })
		}
		forward = !forward
	}

	for (const item of doorColRemaining) {
		const si = (item.r - 1) * cols + item.c
		if (!blockedSet || !blockedSet.has(si)) order.push({ r: item.r, c: item.c, si })
	}

	const lookup = {}
	order.forEach((item, i) => { lookup[`${item.r}_${item.c}`] = i + 1 })
	return { order, lookup, totalSteps: order.length }
}

/**
 * 逐行发卷顺序：从上到下，每行从左到右
 */
export function getRowOrder(rows, cols, blockedSet = null) {
	const order = []
	for (let r = 1; r <= rows; r++) {
		for (let c = 1; c <= cols; c++) {
			const si = (r - 1) * cols + c
			if (!blockedSet || !blockedSet.has(si)) order.push({ r, c, si })
		}
	}
	const lookup = {}
	order.forEach((item, i) => { lookup[`${item.r}_${item.c}`] = i + 1 })
	return { order, lookup, totalSteps: order.length }
}

// ==================== 相邻座位计算 ====================

export function getAdjacentPositions(seatIndex, rows, cols) {
  const r = Math.floor((seatIndex - 1) / cols) + 1
  const c = ((seatIndex - 1) % cols) + 1
  return {
    left: c > 1 ? seatIndex - 1 : null,
    right: c < cols ? seatIndex + 1 : null,
    up: r > 1 ? seatIndex - cols : null,
    down: r < rows ? seatIndex + cols : null
  }
}

export function getAdjacentSeatIndices(seatIndex, rows, cols) {
  const adj = getAdjacentPositions(seatIndex, rows, cols)
  return [adj.left, adj.right, adj.up, adj.down].filter(v => v !== null)
}

// ==================== 冲突评分 ====================

export function getSharedElectives(studentA, studentB) {
  if (!studentA?.electives?.length || !studentB?.electives?.length) return []
  return studentA.electives.filter(e => studentB.electives.includes(e))
}

/**
 * 计算单个分配方案的冲突评分
 * 评分项：同班相邻(+5)、同选科相邻(+3)、同班前后(+2)、同班左右(+2)
 * 分数越低越好
 */
export function calculateConflictScore(assignments, students, room, studentMap) {
  if (!studentMap) {
    studentMap = Object.fromEntries(students.map(s => [s.id, s]))
  }
  let score = 0
  const { rows, cols } = room
  const roomAssignments = assignments.filter(a => a.roomId === room.id)

  for (const a of roomAssignments) {
    const student = studentMap[a.studentId]
    if (!student) continue

    const adj = getAdjacentPositions(a.seatIndex, rows, cols)
    for (const [dir, adjIdx] of Object.entries(adj)) {
      if (adjIdx === null) continue
      const adjA = roomAssignments.find(x => x.seatIndex === adjIdx)
      if (!adjA) continue
      const adjStudent = studentMap[adjA.studentId]
      if (!adjStudent) continue

      if (student.className === adjStudent.className) {
        // 同班相邻
        if (dir === 'left' || dir === 'right') score += 5
        else score += 3
      }
      const shared = getSharedElectives(student, adjStudent)
      if (shared.length) {
        score += 3
      }
    }
  }
  return score
}

// ==================== 冲突检测 ====================

export function detectAllConflicts(assignments, students, rooms) {
  const list = []
  const seen = new Set()
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]))

  const byRoom = {}
  assignments.forEach(a => {
    if (!byRoom[a.roomId]) byRoom[a.roomId] = []
    byRoom[a.roomId].push(a)
  })

  for (const [roomId, roomAssignments] of Object.entries(byRoom)) {
    const room = roomMap[Number(roomId)]
    if (!room) continue
    const { rows, cols } = room

    for (const a of roomAssignments) {
      const student = studentMap[a.studentId]
      if (!student) continue

      const adjIndices = getAdjacentSeatIndices(a.seatIndex, rows, cols)
      for (const adjIdx of adjIndices) {
        const adj = roomAssignments.find(x => x.seatIndex === adjIdx)
        if (!adj || adj.studentId === a.studentId) continue
        const adjStudent = studentMap[adj.studentId]
        if (!adjStudent) continue

        const key = [a.studentId, adj.studentId].sort().join('_') + '_' + roomId
        if (seen.has(key)) continue
        seen.add(key)

        // 同班相邻
        if (student.className === adjStudent.className) {
          list.push({
            type: 'sameClass',
            label: '同班相邻',
            studentIds: [a.studentId, adj.studentId],
            roomId: Number(roomId),
            seats: [a.seatIndex, adjIdx]
          })
        }

        // 同选科相邻
        const shared = getSharedElectives(student, adjStudent)
        if (shared.length) {
          list.push({
            type: 'sameElective',
            label: `同选科相邻(${shared.join(',')})`,
            studentIds: [a.studentId, adj.studentId],
            roomId: Number(roomId),
            seats: [a.seatIndex, adjIdx]
          })
        }
      }
    }
  }

  // 跨教室重复
  const studentRoomMap = {}
  assignments.forEach(a => {
    if (!studentRoomMap[a.studentId]) studentRoomMap[a.studentId] = []
    studentRoomMap[a.studentId].push(a.roomId)
  })
  for (const [sid, rids] of Object.entries(studentRoomMap)) {
    if (rids.length > 1) {
      const s = studentMap[Number(sid)]
      list.push({
        type: 'duplicate',
        label: '跨教室重复',
        studentIds: [Number(sid)],
        rooms: rids,
        studentName: s?.name || '未知'
      })
    }
  }

  // 专属教室违规检测（允许预留座位上的外班学生）
  assignments.forEach(a => {
    const student = studentMap[a.studentId]
    const room = roomMap[a.roomId]
    if (!student || !room) return

    if (room.exclusiveClassId && student.className !== room.exclusiveClassId) {
      // 检查该座位是否为允许外班学生的预留位
      const reserved = window.__reservedLookup
        ? window.__reservedLookup.get(`${a.roomId}_${a.seatIndex}`)
        : null
      const isAllowedReserved = reserved && reserved.allowExternalStudent

      if (!isAllowedReserved) {
        list.push({
          type: 'exclusiveViolation',
          label: `专属教室混入(${student.className}→${room.exclusiveClassId}班教室)`,
          studentIds: [a.studentId],
          roomId: a.roomId,
          seats: [a.seatIndex]
        })
      }
    }

    const exclusiveRoom = rooms.find(r => r.exclusiveClassId === student.className)
    if (exclusiveRoom && a.roomId !== exclusiveRoom.id && !a.locked) {
      list.push({
        type: 'exclusiveStudentLeak',
        label: `${student.className}班学生出现在非专属教室`,
        studentIds: [a.studentId],
        roomId: a.roomId,
        expectedRoomId: exclusiveRoom.id
      })
    }
  })

  return list
}

// ==================== 学生排序 ====================

export function sortStudentsByPriority(students) {
  const special = students.filter(s => s.status === 'special' || s.status === 'absent')
  const normal = students.filter(s => s.status !== 'special' && s.status !== 'absent')

  special.sort((a, b) => (a.className || '').localeCompare(b.className || ''))

  const byClass = {}
  normal.forEach(s => {
    const cls = s.className || ''
    if (!byClass[cls]) byClass[cls] = []
    byClass[cls].push(s)
  })

  Object.values(byClass).forEach(arr => {
    arr.sort((a, b) => (a.classNo || '').localeCompare(b.classNo || ''))
  })

  const classNames = Object.keys(byClass).sort()
  const dispersed = []
  let hasMore = true
  let idx = 0
  while (hasMore) {
    hasMore = false
    for (const cls of classNames) {
      if (idx < byClass[cls].length) {
        dispersed.push(byClass[cls][idx])
        hasMore = true
      }
    }
    idx++
  }

  return [...special, ...dispersed]
}

// ==================== 单教室排座 ====================

export function allocateRoom(room, studentsToPlace, blockedSet, existingAssignments, reservedSeatSet, doorDirection = 'left') {
  const snakeOrder = getSnakeOrder(room.rows, room.cols, doorDirection)
  const totalSeats = room.rows * room.cols

  const occupiedSet = new Set()
  existingAssignments.forEach(a => {
    if (a.roomId === room.id) occupiedSet.add(a.seatIndex)
  })

  // 预留座位视为已占用（自动排座跳过）
  if (reservedSeatSet) {
    reservedSeatSet.forEach(si => occupiedSet.add(si))
  }

  const newAssignments = []
  const unplaced = []
  const warnings = []

  let snakeIdx = 0
  for (const student of studentsToPlace) {
    let placed = false
    while (snakeIdx < snakeOrder.length) {
      const seatIndex = snakeOrder[snakeIdx]
      snakeIdx++

      if (blockedSet.has(`${room.id}_${seatIndex}`)) continue
      if (occupiedSet.has(seatIndex)) continue

      newAssignments.push({
        roomId: room.id,
        seatIndex,
        studentId: student.id,
        locked: false
      })
      occupiedSet.add(seatIndex)
      placed = true
      break
    }

    if (!placed) {
      unplaced.push(student)
    }
  }

  if (unplaced.length > 0) {
    const availableSeats = totalSeats - blockedSet.size - existingAssignments.filter(a => a.roomId === room.id).length
    warnings.push(
      `教室「${room.name}」座位不足：${studentsToPlace.length} 名学生，仅 ${availableSeats} 可用座位，${unplaced.length} 人无法安排`
    )
  }

  return { assignments: newAssignments, unplaced, warnings }
}

// ==================== 主排座入口 ====================

export function autoArrangeAll(rooms, students, assignments, blockedSeats, reservedSeats, doorDirection = 'left') {
  const warnings = []
  const allNewAssignments = []
  const allUnplaced = []
  let exclusiveFilled = 0
  let normalFilled = 0

  const blockedSet = new Set(blockedSeats.map(b => `${b.roomId}_${b.seatIndex}`))

  // 预留座位集合（自动排座跳过）
  const reservedByRoom = {}
  if (reservedSeats?.length) {
    reservedSeats.forEach(r => {
      if (!reservedByRoom[r.roomId]) reservedByRoom[r.roomId] = new Set()
      reservedByRoom[r.roomId].add(r.seatIndex)
    })
  }

  const lockedStudentIds = new Set(assignments.filter(a => a.locked).map(a => a.studentId))
  const lockedAssignments = assignments.filter(a => a.locked)

  // 构建全局 reserved lookup 供冲突检测使用
  if (typeof window !== 'undefined' && reservedSeats?.length) {
    const rl = new Map()
    reservedSeats.forEach(r => rl.set(`${r.roomId}_${r.seatIndex}`, r))
    window.__reservedLookup = rl
  }

  // ========== 阶段1：专属教室优先填充 ==========
  const exclusiveRooms = rooms.filter(r => r.exclusiveClassId)
  const exclusiveRoomIds = new Set(exclusiveRooms.map(r => r.id))

  for (const room of exclusiveRooms) {
    const classStudents = students.filter(s => s.className === room.exclusiveClassId && !lockedStudentIds.has(s.id))
    const roomLocked = lockedAssignments.filter(a => a.roomId === room.id)
    const roomReserved = reservedByRoom[room.id] || null

    const result = allocateRoom(room, classStudents, blockedSet, [...roomLocked, ...allNewAssignments], roomReserved, doorDirection)
    allNewAssignments.push(...result.assignments)
    allUnplaced.push(...result.unplaced)
    warnings.push(...result.warnings)
    exclusiveFilled += result.assignments.length
  }

  for (const room of exclusiveRooms) {
    const remaining = students.filter(s =>
      s.className === room.exclusiveClassId &&
      !lockedStudentIds.has(s.id) &&
      !allNewAssignments.some(a => a.studentId === s.id)
    )
    if (remaining.length > 0) {
      warnings.push(
        `${room.exclusiveClassId} 班专属教室「${room.name}」座位不足：${remaining.length} 名学生未能安排，请扩容或增加教室`
      )
    }
  }

  // ========== 阶段2：普通教室填充 ==========
  const normalRooms = rooms.filter(r => !r.exclusiveClassId)

  const unassignedStudents = students.filter(s => {
    if (lockedStudentIds.has(s.id)) return false
    if (allNewAssignments.some(a => a.studentId === s.id)) return false
    const exRoom = exclusiveRooms.find(r => r.exclusiveClassId === s.className)
    if (exRoom) return false
    return true
  })

  const sortedStudents = sortStudentsByPriority(unassignedStudents)

  if (normalRooms.length > 0) {
    const normalRoomData = normalRooms.map(room => ({
      room,
      snakeOrder: getSnakeOrder(room.rows, room.cols, doorDirection),
      snakeIdx: 0,
      occupied: new Set(
        lockedAssignments
          .filter(a => a.roomId === room.id)
          .map(a => a.seatIndex)
      )
    }))

    let roomIdx = 0
    for (const student of sortedStudents) {
      let placed = false
      for (let attempt = 0; attempt < normalRoomData.length; attempt++) {
        const data = normalRoomData[(roomIdx + attempt) % normalRoomData.length]
        const { room, snakeOrder, occupied } = data
        const roomReserved = reservedByRoom[room.id]

        while (data.snakeIdx < snakeOrder.length) {
          const seatIndex = snakeOrder[data.snakeIdx]
          data.snakeIdx++

          if (blockedSet.has(`${room.id}_${seatIndex}`)) continue
          if (occupied.has(seatIndex)) continue
          // 跳过预留座位
          if (roomReserved?.has(seatIndex)) continue

          allNewAssignments.push({
            roomId: room.id,
            seatIndex,
            studentId: student.id,
            locked: false
          })
          occupied.add(seatIndex)
          placed = true
          normalFilled++
          break
        }

        if (placed) break
      }

      if (!placed) {
        allUnplaced.push(student)
      }
      roomIdx++
    }
  } else if (sortedStudents.length > 0) {
    warnings.push(`没有可用普通教室，${sortedStudents.length} 名学生无法安排`)
    allUnplaced.push(...sortedStudents)
  }

  // ========== 冲突评分计算 ==========
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))
  const allAssignments = [...lockedAssignments, ...allNewAssignments]
  const conflictScores = {}
  rooms.forEach(room => {
    conflictScores[room.id] = calculateConflictScore(allAssignments, students, room, studentMap)
  })

  const stats = {
    placed: exclusiveFilled + normalFilled,
    unplaced: allUnplaced.length,
    exclusiveFilled,
    normalFilled
  }

  return { newAssignments: allNewAssignments, unplaced: allUnplaced, warnings, stats, conflictScores }
}

// ==================== 异常报告生成 ====================

export function generateFullReport(rooms, students, assignments, blockedSeats, conflicts) {
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

  const assignedIds = new Set(assignments.map(a => a.studentId))
  const unassigned = students
    .filter(s => !assignedIds.has(s.id))
    .map(s => ({
      id: s.id,
      name: s.name,
      className: s.className,
      hasExclusiveRoom: !!rooms.find(r => r.exclusiveClassId === s.className)
    }))

  // 跨教室重复
  const roomMap = {}
  assignments.forEach(a => {
    if (!roomMap[a.studentId]) roomMap[a.studentId] = []
    roomMap[a.studentId].push(a.roomId)
  })
  const duplicates = []
  for (const [sid, rids] of Object.entries(roomMap)) {
    if (rids.length > 1) {
      const s = studentMap[Number(sid)]
      const names = rids.map(id => rooms.find(r => r.id === id)?.name || `教室${id}`)
      duplicates.push({
        studentId: Number(sid),
        name: s?.name || '未知',
        rooms: names
      })
    }
  }

  // 容量不足
  const capacityIssues = []
  rooms.forEach(room => {
    if (!room.exclusiveClassId) return
    const classStudents = students.filter(s => s.className === room.exclusiveClassId)
    const capacity = room.rows * room.cols
    const blocked = blockedSeats.filter(b => b.roomId === room.id).length
    const available = capacity - blocked
    if (classStudents.length > available) {
      capacityIssues.push({
        room: room.name,
        classId: room.exclusiveClassId,
        studentCount: classStudents.length,
        available,
        shortage: classStudents.length - available
      })
    }
  })

  return { unassigned, duplicates, capacityIssues, conflicts }
}

// ==================== 试卷统计 ====================

/**
 * 根据排座数据生成试卷统计清单
 * @returns {{ bySubject: Object, byElective: Object, byRoom: Object[], absentList: Object[] }}
 */
export function generatePaperStatistics(rooms, students, assignments) {
  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]))

  // 按科目统计
  const bySubject = {}
  // 按选修统计
  const byElective = {}
  // 按教室统计
  const byRoom = []
  // 缺考
  const absentList = []

  rooms.forEach(room => {
    const roomAssignments = assignments.filter(a => a.roomId === room.id)
    const roomStudents = roomAssignments
      .map(a => studentMap[a.studentId])
      .filter(Boolean)

    const subjectCounts = {}
    const electiveCounts = {}
    const absent = []

    roomStudents.forEach(s => {
      // 科目统计（来自 examSubject）
      const subj = room.examSubject || '未指定'
      subjectCounts[subj] = (subjectCounts[subj] || 0) + 1

      // 选修统计
      if (s.electives?.length) {
        s.electives.forEach(e => {
          electiveCounts[e] = (electiveCounts[e] || 0) + 1
        })
      }

      // 缺考
      if (s.status === 'absent') {
        absent.push({ id: s.id, name: s.name, className: s.className })
      }

      // 全局科目统计
      if (!bySubject[subj]) bySubject[subj] = 0
      bySubject[subj]++

      // 全局选修统计
      if (s.electives?.length) {
        s.electives.forEach(e => {
          if (!byElective[e]) byElective[e] = 0
          byElective[e]++
        })
      }
    })

    // 行统计
    const rowStats = []
    for (let r = 1; r <= room.rows; r++) {
      const rowSeats = roomAssignments.filter(a => {
        const row = Math.floor((a.seatIndex - 1) / room.cols) + 1
        return row === r
      })
      const rowStudents = rowSeats.map(a => studentMap[a.studentId]).filter(Boolean)
      const rowElectives = {}
      rowStudents.forEach(s => {
        (s.electives || []).forEach(e => {
          rowElectives[e] = (rowElectives[e] || 0) + 1
        })
      })
      rowStats.push({ row: r, count: rowStudents.length, electives: rowElectives })
    }

    // 列统计
    const colStats = []
    for (let c = 1; c <= room.cols; c++) {
      const colSeats = roomAssignments.filter(a => {
        const col = ((a.seatIndex - 1) % room.cols) + 1
        return col === c
      })
      const colStudents = colSeats.map(a => studentMap[a.studentId]).filter(Boolean)
      const colElectives = {}
      colStudents.forEach(s => {
        (s.electives || []).forEach(e => {
          colElectives[e] = (colElectives[e] || 0) + 1
        })
      })
      colStats.push({ col: c, count: colStudents.length, electives: colElectives })
    }

    // 发卷顺序（按行从讲台开始）
    const distributionOrder = []
    for (let r = 1; r <= room.rows; r++) {
      const rowSeats = roomAssignments.filter(a => {
        const row = Math.floor((a.seatIndex - 1) / room.cols) + 1
        return row === r
      }).sort((a, b) => a.seatIndex - b.seatIndex)
      distributionOrder.push({
        row: r,
        students: rowSeats.map(a => {
          const s = studentMap[a.studentId]
          return s ? { name: s.name, electives: s.electives || [], className: s.className } : null
        }).filter(Boolean)
      })
    }

    byRoom.push({
      roomId: room.id,
      roomName: room.name,
      examSubject: room.examSubject || '未指定',
      total: roomStudents.length,
      subjectCounts,
      electiveCounts,
      absent,
      rowStats,
      colStats,
      distributionOrder
    })

    absentList.push(...absent)
  })

  // 备用试卷建议（按科目 5% 向上取整）
  const backupSuggestions = {}
  for (const [subj, count] of Object.entries(bySubject)) {
    backupSuggestions[subj] = Math.max(1, Math.ceil(count * 0.05))
  }

  return { bySubject, byElective, byRoom, absentList, backupSuggestions }
}
