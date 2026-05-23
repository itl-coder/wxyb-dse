/**
 * 考试座位安排 Store（重构版）
 *
 * 新增字段：examStartTime / examEndTime / examDate / invigilators / doorDirection / examStatus / layoutMode
 * 保留：房间CRUD / 学生CRUD / 分配 / 交换 / 撤销 / 排座 / 冲突检测 / 屏蔽
 * 移除：poolFilterClass/poolFilterElective/poolSortBy/poolSortOrder（下沉至 StudentPool 组件本地管理）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { detectAllConflicts, generateFullReport, generatePaperStatistics } from '../utils/seatAllocator'

// ---- localStorage 持久化 ----
const LS_PREFIX = 'dse_es2_'

function lsLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
function lsSave(key, data) {
  localStorage.setItem(LS_PREFIX + key, JSON.stringify(data))
}

// ---- 默认教室 ----
function defaultRooms() {
  return [
    { id: 1, name: '选修大课室', rows: 7, cols: 5, location: '3F走廊东', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
    { id: 2, name: '选修一室', rows: 4, cols: 3, location: '3F-301', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
    { id: 3, name: '选修二室', rows: 5, cols: 5, location: '3F-302', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
    { id: 4, name: '选修三室', rows: 5, cols: 5, location: '3F-303', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
    { id: 5, name: '选修四室', rows: 5, cols: 5, location: '3F-304', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
    { id: 6, name: '选修五室', rows: 3, cols: 4, location: '3F-305', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' }
  ]
}

export const useExamSeat2Store = defineStore('examSeat2', () => {
  // ==================== 状态 ====================
  const rooms = ref(lsLoad('rooms', defaultRooms()))
  const students = ref(lsLoad('students', []))
  /** @type {import('vue').Ref<{roomId:number,seatIndex:number,studentId:number,locked:boolean}[]>} */
  const assignments = ref(lsLoad('assignments', []))
  /** @type {import('vue').Ref<{roomId:number,seatIndex:number,reason:string}[]>} */
  const blockedSeats = ref(lsLoad('blocked', []))
  /** @type {import('vue').Ref<{roomId:number,seatIndex:number,reservedStudentId:string,reservedReason:string}[]>} */
  const reservedSeats = ref(lsLoad('reserved', []))
  const selectedRoomId = ref(null)
  const warnings = ref([])
  const conflicts = ref([])
  const conflictScores = ref({}) // { [roomId]: score }
  const selectedSeat = ref(null) // { roomId, seatIndex } | null
  const undoStack = ref([])
  const MAX_UNDO = 30

  // ---- 新增字段 ----
  const examName = ref(lsLoad('examName', ''))
  const examDate = ref(lsLoad('examDate', new Date().toISOString().split('T')[0]))
  const examStartTime = ref(lsLoad('examStart', '08:30'))
  const examEndTime = ref(lsLoad('examEnd', '10:30'))
  const invigilators = ref(lsLoad('invigilators', ['张老师', '李老师']))
  const doorDirection = ref(lsLoad('doorDir', 'left')) // 'left' | 'right'
  const doorSeats = ref(lsLoad('doorSeats', {})) // { [roomId]: seatIndex } — 每间教室唯一的门口座位
  const layoutMode = ref(lsLoad('layoutMode', 'horizontal')) // horizontal | vertical | flip | compact

  // ---- 前台展示控制 ----
  const publicShowNames = ref(lsLoad('pubShowNames', true))
  const publicShowClass = ref(lsLoad('pubShowClass', true))
  const publicShowElectives = ref(lsLoad('pubShowElectives', true))

  function savePublicShowNames(v) { publicShowNames.value = v; lsSave('pubShowNames', v) }
  function savePublicShowClass(v) { publicShowClass.value = v; lsSave('pubShowClass', v) }
  function savePublicShowElectives(v) { publicShowElectives.value = v; lsSave('pubShowElectives', v) }

  // ==================== 调度 ====================
  function pushUndoSnapshot() {
    undoStack.value.push({
      assignments: JSON.parse(JSON.stringify(assignments.value)),
      blockedSeats: JSON.parse(JSON.stringify(blockedSeats.value)),
      reservedSeats: JSON.parse(JSON.stringify(reservedSeats.value))
    })
    if (undoStack.value.length > MAX_UNDO) undoStack.value.shift()
  }

  const canUndo = computed(() => undoStack.value.length > 0)

  function undo() {
    if (!undoStack.value.length) return false
    const snap = undoStack.value.pop()
    assignments.value = snap.assignments
    blockedSeats.value = snap.blockedSeats
    reservedSeats.value = snap.reservedSeats
    persistAssignments(); persistBlockedSeats(); persistReservedSeats(); detectConflicts()
    return true
  }

  // ==================== 计算属性 ====================
  const totalStudents = computed(() => students.value.length)
  const assignedCount = computed(() => new Set(assignments.value.map(a => a.studentId)).size)
  const unassignedCount = computed(() => totalStudents.value - assignedCount.value)
  const totalBlockedCount = computed(() => blockedSeats.value.length)

  const selectedRoom = computed(() => rooms.value.find(r => r.id === selectedRoomId.value) || null)

  const unassignedStudents = computed(() => {
    const ids = new Set(assignments.value.map(a => a.studentId))
    return students.value.filter(s => !ids.has(s.id))
  })

  const studentsInSelectedRoom = computed(() => {
    if (!selectedRoomId.value) return []
    const map = {}
    students.value.forEach(s => { map[s.id] = s })
    return assignments.value
      .filter(a => a.roomId === selectedRoomId.value)
      .map(a => ({ ...a, student: map[a.studentId] || null }))
  })

  const roomStats = computed(() => rooms.value.map(room => {
    const ra = assignments.value.filter(a => a.roomId === room.id)
    const assigned = new Set(ra.map(a => a.studentId)).size
    const blocked = blockedSeats.value.filter(b => b.roomId === room.id).length
    return { ...room, totalCapacity: room.rows * room.cols, assignedCount: assigned, blockedCount: blocked, emptyCount: room.rows * room.cols - assigned - blocked }
  }))

  const availableClasses = computed(() => {
    const s = new Set()
    students.value.forEach(v => { if (v.className) s.add(v.className) })
    return [...s].sort()
  })

  const availableElectives = computed(() => {
    const s = new Set()
    students.value.forEach(v => { (v.electives || []).forEach(e => s.add(e)) })
    return [...s].sort()
  })

  // 试卷统计（供 ExamPaperStatistics 使用）
  const paperStatistics = computed(() => {
    return generatePaperStatistics(rooms.value, students.value, assignments.value)
  })

  // ---- 考试状态推算 ----
  const examStatus = computed(() => {
    if (!examDate.value) return '未开始'
    const now = new Date()
    const start = new Date(examDate.value + 'T' + examStartTime.value)
    const end = new Date(examDate.value + 'T' + examEndTime.value)
    if (now < start) return '未开始'
    if (now > end) return '已结束'
    return '进行中'
  })

  // ==================== 辅助函数 ====================
  function isSeatBlocked(roomId, seatIndex) {
    return blockedSeats.value.some(b => b.roomId === roomId && b.seatIndex === seatIndex)
  }

  function isSeatReserved(roomId, seatIndex) {
    return reservedSeats.value.some(r => r.roomId === roomId && r.seatIndex === seatIndex)
  }

  function getReservedInfo(roomId, seatIndex) {
    return reservedSeats.value.find(r => r.roomId === roomId && r.seatIndex === seatIndex) || null
  }

  function validateExclusiveRules(studentId, targetRoomId, targetSeatIndex = null) {
    const student = students.value.find(s => s.id === studentId)
    if (!student) return { valid: false, reason: '学生不存在' }
    const room = rooms.value.find(r => r.id === targetRoomId)
    if (!room) return { valid: false, reason: '教室不存在' }

    // 专属教室：外班学生只能进入 allowExternalStudent=true 的预留位
    if (room.exclusiveClassId && student.className !== room.exclusiveClassId) {
      if (targetSeatIndex != null) {
        const rsv = reservedSeats.value.find(r => r.roomId === targetRoomId && r.seatIndex === targetSeatIndex)
        if (!rsv || !rsv.allowExternalStudent) {
          return { valid: false, reason: `该教室仅限 ${room.exclusiveClassId} 班学生（预留位可允许外班）` }
        }
        // 允许外班学生进入该预留位
        return { valid: true }
      }
      return { valid: false, reason: `该教室仅限 ${room.exclusiveClassId} 班学生（预留位可允许外班）` }
    }

    // 专属班学生必须在专属教室
    const exRoom = rooms.value.find(r => r.exclusiveClassId === student.className)
    if (exRoom && targetRoomId !== exRoom.id)
      return { valid: false, reason: `${student.className} 班专属教室为 ${exRoom.name}，不可分配至其他教室` }
    return { valid: true }
  }

  /**
   * 检测学生是否在多个教室重复出现
   * @returns {{ studentId: number, name: string, rooms: string[] }[]}
   */
  function detectDuplicateAssignments() {
    const map = {}
    assignments.value.forEach(a => {
      if (!map[a.studentId]) map[a.studentId] = []
      map[a.studentId].push(a.roomId)
    })
    const dups = []
    for (const [sid, rids] of Object.entries(map)) {
      if (rids.length > 1) {
        const s = students.value.find(v => v.id === Number(sid))
        const names = rids.map(id => rooms.value.find(r => r.id === id)?.name || '教室' + id)
        dups.push({ studentId: Number(sid), name: s?.name || '未知', rooms: names })
      }
    }
    return dups
  }

  /**
   * 生成排座异常报告
   * @returns {{ unassigned: Object[], duplicates: Object[], capacityIssues: Object[] }}
   */
  function generateArrangeReport() {
    return generateFullReport(rooms.value, students.value, assignments.value, blockedSeats.value, conflicts.value)
  }

  function canModifySeat(roomId, seatIndex) {
    if (isSeatBlocked(roomId, seatIndex)) return false
    if (isSeatReserved(roomId, seatIndex)) return false
    const a = assignments.value.find(x => x.roomId === roomId && x.seatIndex === seatIndex)
    return !a?.locked
  }

  function getAssignment(roomId, seatIndex) {
    return assignments.value.find(a => a.roomId === roomId && a.seatIndex === seatIndex) || null
  }

  // ==================== 预留座位 ====================
  function reserveSeat(roomId, seatIndex, reservedStudentId = '', reservedReason = '', allowExternalStudent = false) {
    if (isSeatBlocked(roomId, seatIndex)) return false
    if (isSeatReserved(roomId, seatIndex)) return false
    pushUndoSnapshot()
    reservedSeats.value.push({ roomId, seatIndex, reservedStudentId, reservedReason, allowExternalStudent })
    persistReservedSeats()
    return true
  }
  function unreserveSeat(roomId, seatIndex) {
    pushUndoSnapshot()
    reservedSeats.value = reservedSeats.value.filter(r => !(r.roomId === roomId && r.seatIndex === seatIndex))
    persistReservedSeats()
  }
  function toggleReserved(roomId, seatIndex) {
    isSeatReserved(roomId, seatIndex) ? unreserveSeat(roomId, seatIndex) : reserveSeat(roomId, seatIndex)
  }

  /** 批量设置预留位 */
  function batchReserveSeats(items) {
    pushUndoSnapshot()
    items.forEach(({ roomId, seatIndex, reservedReason, allowExternalStudent }) => {
      if (!isSeatBlocked(roomId, seatIndex) && !isSeatReserved(roomId, seatIndex)) {
        reservedSeats.value.push({ roomId, seatIndex, reservedStudentId: '', reservedReason: reservedReason || '', allowExternalStudent: !!allowExternalStudent })
      }
    })
    persistReservedSeats()
  }

  /** 批量取消预留位 */
  function batchUnreserveSeats(items) {
    pushUndoSnapshot()
    const keys = new Set(items.map(({ roomId, seatIndex }) => `${roomId}_${seatIndex}`))
    reservedSeats.value = reservedSeats.value.filter(r => !keys.has(`${r.roomId}_${r.seatIndex}`))
    persistReservedSeats()
  }

  // ==================== 房间 CRUD ====================
  function addRoom(room) {
    const id = Math.max(0, ...rooms.value.map(r => r.id)) + 1
    rooms.value.push({ ...room, id })
    persistRooms()
    return room
  }
  function updateRoom(id, data) {
    // 专属教室唯一性：如果设置了 exclusiveClassId，清除其他教室的相同专属设置
    if (data.exclusiveClassId) {
      rooms.value.forEach(r => {
        if (r.id !== id && r.exclusiveClassId === data.exclusiveClassId) {
          r.exclusiveClassId = ''
        }
      })
    }
    const idx = rooms.value.findIndex(r => r.id === id)
    if (idx === -1) return
    rooms.value[idx] = { ...rooms.value[idx], ...data }
    persistRooms()
  }
  function deleteRoom(id) {
    pushUndoSnapshot()
    rooms.value = rooms.value.filter(r => r.id !== id)
    assignments.value = assignments.value.filter(a => a.roomId !== id)
    blockedSeats.value = blockedSeats.value.filter(b => b.roomId !== id)
    if (selectedRoomId.value === id) selectedRoomId.value = null
    persistRooms(); persistAssignments(); persistBlockedSeats()
  }
  function selectRoom(id) { selectedRoomId.value = id; selectedSeat.value = null }
  function clearRoom(roomId) {
    pushUndoSnapshot()
    assignments.value = assignments.value.filter(a => a.roomId !== roomId || a.locked)
    persistAssignments()
  }

  // ==================== 学生管理 ====================
  function importStudents(newStudents) {
    pushUndoSnapshot()
    let nextId = Math.max(0, ...students.value.map(s => s.id))
    const added = []
    newStudents.forEach(s => {
      const dup = students.value.find(e => e.classNo === s.classNo && e.className === s.className)
      if (dup) { Object.assign(dup, s); return }
      added.push({ ...s, id: ++nextId, imported: Date.now() })
    })
    students.value.push(...added)
    persistStudents()
    return { added, total: students.value.length }
  }
  function removeStudent(id) {
    pushUndoSnapshot()
    students.value = students.value.filter(s => s.id !== id)
    assignments.value = assignments.value.filter(a => a.studentId !== id)
    persistStudents(); persistAssignments()
  }

  // ==================== 座位操作 ====================
  function assignStudent(studentId, roomId, seatIndex) {
    if (isSeatBlocked(roomId, seatIndex)) return false
    // 预留位优先级 > 专属教室限制：必须传入 seatIndex 以检查 allowExternalStudent
    const vr = validateExclusiveRules(studentId, roomId, seatIndex)
    if (!vr.valid) { warnings.value.push(vr.reason); return false }
    pushUndoSnapshot()
    // 移除该生旧分配
    assignments.value = assignments.value.filter(a => a.studentId !== studentId)
    // 移除目标座位旧分配
    assignments.value = assignments.value.filter(a => !(a.roomId === roomId && a.seatIndex === seatIndex))
    assignments.value.push({ roomId, seatIndex, studentId, locked: false })
    persistAssignments()
    detectConflicts()
    return true
  }

  function unassignStudent(studentId) {
    pushUndoSnapshot()
    assignments.value = assignments.value.filter(a => a.studentId !== studentId)
    persistAssignments(); detectConflicts()
  }

  function swapSeats(roomIdA, seatA, roomIdB, seatB) {
    if (roomIdA === roomIdB && seatA === seatB) return false
    const a = getAssignment(roomIdA, seatA)
    const b = getAssignment(roomIdB, seatB)
    // 双向锁定检查
    if ((a?.locked && b) || (b?.locked && a)) return false
    if (a?.locked || b?.locked) return false
    // 屏蔽检查
    if (isSeatBlocked(roomIdA, seatA) || isSeatBlocked(roomIdB, seatB)) return false
    // 排他性检查：同教室内部换座不再校验原班级（学生已属于当前考场）
    // 只有跨教室移动时才校验专属/预留位规则
    if (a && b && roomIdA !== roomIdB) {
      const v1 = validateExclusiveRules(a.studentId, roomIdB, seatB)
      const v2 = validateExclusiveRules(b.studentId, roomIdA, seatA)
      if (!v1.valid || !v2.valid) return false
    }
    pushUndoSnapshot()
    // 移除两个座位的分配
    assignments.value = assignments.value.filter(x =>
      !(x.roomId === roomIdA && x.seatIndex === seatA) &&
      !(x.roomId === roomIdB && x.seatIndex === seatB)
    )
    // 重新分配（保留锁定状态在原座位）
    if (a) assignments.value.push({ ...a, roomId: roomIdB, seatIndex: seatB })
    if (b) assignments.value.push({ ...b, roomId: roomIdA, seatIndex: seatA })
    persistAssignments(); detectConflicts()
    return true
  }

  function handleSeatClick(roomId, seatIndex) {
    // 屏蔽座位不可操作
    if (isSeatBlocked(roomId, seatIndex)) {
      selectedSeat.value = null
      return
    }
    const a = getAssignment(roomId, seatIndex)
    // 空位 + 已选中座位 → 移动
    if (!a && selectedSeat.value) {
      const sel = getAssignment(selectedSeat.value.roomId, selectedSeat.value.seatIndex)
      if (!sel || sel.locked) { selectedSeat.value = null; return }
      swapSeats(selectedSeat.value.roomId, selectedSeat.value.seatIndex, roomId, seatIndex)
      selectedSeat.value = null
      return
    }
    // 已占 + 已选中座位 → 交换
    if (a && selectedSeat.value) {
      if (selectedSeat.value.roomId === roomId && selectedSeat.value.seatIndex === seatIndex) {
        selectedSeat.value = null; return
      }
      if (a.locked) { selectedSeat.value = null; return }
      swapSeats(selectedSeat.value.roomId, selectedSeat.value.seatIndex, roomId, seatIndex)
      selectedSeat.value = null
      return
    }
    // 已占 + 无选中 → 选中
    if (a && !a.locked) {
      selectedSeat.value = { roomId, seatIndex }
    }
  }

  // ==================== 屏蔽 ====================
  function blockSeat(roomId, seatIndex, reason = '') {
    if (isSeatBlocked(roomId, seatIndex)) return
    pushUndoSnapshot()
    assignments.value = assignments.value.filter(a => !(a.roomId === roomId && a.seatIndex === seatIndex))
    blockedSeats.value.push({ roomId, seatIndex, reason })
    persistBlockedSeats(); persistAssignments()
  }
  function unblockSeat(roomId, seatIndex) {
    pushUndoSnapshot()
    blockedSeats.value = blockedSeats.value.filter(b => !(b.roomId === roomId && b.seatIndex === seatIndex))
    persistBlockedSeats()
  }
  function toggleBlock(roomId, seatIndex) {
    isSeatBlocked(roomId, seatIndex) ? unblockSeat(roomId, seatIndex) : blockSeat(roomId, seatIndex)
  }

  // ==================== 锁定 ====================
  function toggleLock(roomId, seatIndex) {
    const a = getAssignment(roomId, seatIndex)
    if (!a) return
    pushUndoSnapshot()
    a.locked = !a.locked
    if (a.locked) {
      a.lockedBy = '手动'
      a.lockedTime = new Date().toISOString()
    } else {
      delete a.lockedBy
      delete a.lockedTime
    }
    persistAssignments()
  }
  function lockAllInRoom(roomId) {
    pushUndoSnapshot()
    const now = new Date().toISOString()
    assignments.value.filter(a => a.roomId === roomId).forEach(a => {
      a.locked = true
      a.lockedBy = '批量锁定'
      a.lockedTime = now
    })
    persistAssignments()
  }
  function unlockAllInRoom(roomId) {
    pushUndoSnapshot()
    assignments.value.filter(a => a.roomId === roomId).forEach(a => {
      a.locked = false
      delete a.lockedBy
      delete a.lockedTime
    })
    persistAssignments()
  }
  /** 批量锁定指定座位 */
  function batchLockSeats(items) {
    pushUndoSnapshot()
    const now = new Date().toISOString()
    items.forEach(({ roomId, seatIndex }) => {
      const a = getAssignment(roomId, seatIndex)
      if (a) {
        a.locked = true
        a.lockedBy = '批量锁定'
        a.lockedTime = now
      }
    })
    persistAssignments()
  }
  /** 批量解锁指定座位 */
  function batchUnlockSeats(items) {
    pushUndoSnapshot()
    items.forEach(({ roomId, seatIndex }) => {
      const a = getAssignment(roomId, seatIndex)
      if (a) {
        a.locked = false
        delete a.lockedBy
        delete a.lockedTime
      }
    })
    persistAssignments()
  }
  /** 锁定所有新分配（自动排座后调用） */
  function lockAllNewAssignments(newAssignments) {
    const now = new Date().toISOString()
    newAssignments.forEach(a => {
      const existing = assignments.value.find(x => x.roomId === a.roomId && x.seatIndex === a.seatIndex && x.studentId === a.studentId)
      if (existing) {
        existing.locked = true
        existing.lockedBy = '自动排座'
        existing.lockedTime = now
      }
    })
    persistAssignments()
  }

  // ==================== 冲突检测（委托 seatAllocator） ====================
  function detectConflicts() {
    conflicts.value = detectAllConflicts(assignments.value, students.value, rooms.value)
  }

  // ==================== 批量分配学生到教室 ====================
  /**
   * 将指定学生批量分配到目标教室的空位中
   * 优先填入预留座位（如果学生匹配预留条件），再按顺序填入空位
   * @param {number[]} studentIds - 要分配的学生 ID 列表
   * @param {number} roomId - 目标教室 ID
   * @returns {{ placed: number, failed: {studentId:number,reason:string}[] }}
   */
  function bulkAssignStudents(studentIds, roomId) {
    const room = rooms.value.find(r => r.id === roomId)
    if (!room) return { placed: 0, failed: studentIds.map(id => ({ studentId: id, reason: '教室不存在' })) }

    pushUndoSnapshot()
    const placed = []
    const failed = []

    // 收集该教室所有可用座位（未被屏蔽、未被占用、未被锁定占用）
    const occupiedSet = new Set(
      assignments.value
        .filter(a => a.roomId === roomId)
        .map(a => a.seatIndex)
    )
    const blockedSet = new Set(
      blockedSeats.value
        .filter(b => b.roomId === roomId)
        .map(b => b.seatIndex)
    )

    // 找到该教室的预留座位（未被占用且未被屏蔽）
    const roomReserved = reservedSeats.value
      .filter(r => r.roomId === roomId && !occupiedSet.has(r.seatIndex) && !blockedSet.has(r.seatIndex))

    // 可用空位（未被占用、未被屏蔽、非预留）
    const totalSeats = room.rows * room.cols
    const availableSeats = []
    for (let si = 1; si <= totalSeats; si++) {
      if (!occupiedSet.has(si) && !blockedSet.has(si)) {
        availableSeats.push(si)
      }
    }

    // 对每个学生，优先匹配预留座位，否则用可用空位
    for (const sid of studentIds) {
      const student = students.value.find(s => s.id === sid)
      if (!student) {
        failed.push({ studentId: sid, reason: '学生不存在' })
        continue
      }

      // 移除该生旧分配
      assignments.value = assignments.value.filter(a => a.studentId !== sid)

      // 尝试匹配预留座位（先找匹配的预留位）
      let seatIndex = null
      const matchedReserved = roomReserved.find(r => {
        if (r.reservedStudentId) {
          return String(r.reservedStudentId) === String(sid)
        }
        return true
      })

      if (matchedReserved) {
        seatIndex = matchedReserved.seatIndex
        const rIdx = roomReserved.indexOf(matchedReserved)
        if (rIdx > -1) roomReserved.splice(rIdx, 1)
        const aIdx = availableSeats.indexOf(seatIndex)
        if (aIdx > -1) availableSeats.splice(aIdx, 1)
      } else {
        seatIndex = availableSeats.shift()
      }

      if (seatIndex == null) {
        failed.push({ studentId: sid, reason: '教室已满，无可用座位' })
        continue
      }

      // 校验专属规则（传入具体座位索引，以便检查预留位 allowExternalStudent）
      const vr = validateExclusiveRules(sid, roomId, seatIndex)
      if (!vr.valid) {
        failed.push({ studentId: sid, reason: vr.reason })
        continue
      }

      assignments.value.push({ roomId, seatIndex, studentId: sid, locked: false })
      placed.push(sid)
    }

    persistAssignments()
    detectConflicts()
    return { placed: placed.length, failed }
  }

  // ==================== 持久化 ====================
  function persistRooms() { lsSave('rooms', rooms.value) }
  function persistStudents() { lsSave('students', students.value) }
  function persistAssignments() { lsSave('assignments', assignments.value) }
  function persistBlockedSeats() { lsSave('blocked', blockedSeats.value) }
  function persistReservedSeats() { lsSave('reserved', reservedSeats.value) }

  // ==================== 重置全部 ====================
  function resetAllToDefaults() {
    pushUndoSnapshot()
    students.value = []
    assignments.value = []
    blockedSeats.value = []
    reservedSeats.value = []
    warnings.value = []
    conflicts.value = []
    selectedSeat.value = null
    selectedRoomId.value = null
    rooms.value = [
      { id: 1, name: '选修大课室', rows: 7, cols: 5, location: '3F走廊东', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
      { id: 2, name: '选修一室', rows: 4, cols: 3, location: '3F-301', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
      { id: 3, name: '选修二室', rows: 5, cols: 5, location: '3F-302', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
      { id: 4, name: '选修三室', rows: 5, cols: 5, location: '3F-303', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
      { id: 5, name: '选修四室', rows: 5, cols: 5, location: '3F-304', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' },
      { id: 6, name: '选修五室', rows: 3, cols: 4, location: '3F-305', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' }
    ]
    persistRooms(); persistStudents(); persistAssignments(); persistBlockedSeats(); persistReservedSeats()
  }

  // ---- 门口座位（每教室唯一） ----
  function getDoorSeatIndex(roomId) {
    return doorSeats.value[roomId] ?? null
  }
  function isDoorSeat(roomId, seatIndex) {
    return doorSeats.value[roomId] === seatIndex
  }
  function setDoorSeat(roomId, seatIndex) {
    doorSeats.value = { ...doorSeats.value, [roomId]: seatIndex }
    lsSave('doorSeats', doorSeats.value)
  }
  function removeDoorSeat(roomId) {
    const next = { ...doorSeats.value }
    delete next[roomId]
    doorSeats.value = next
    lsSave('doorSeats', doorSeats.value)
  }

  // ---- 新增字段持久化 ----
  function saveDoorDirection(dir) { doorDirection.value = dir; lsSave('doorDir', dir) }
  function saveLayoutMode(mode) { layoutMode.value = mode; lsSave('layoutMode', mode) }
  function saveExamName(name) { examName.value = name; lsSave('examName', name) }
  function saveExamDate(date) { examDate.value = date; lsSave('examDate', date) }
  function saveExamTime(start, end) { examStartTime.value = start; examEndTime.value = end; lsSave('examStart', start); lsSave('examEnd', end) }
  function saveInvigilators(list) { invigilators.value = list; lsSave('invigilators', list) }

  // ==================== API ====================
  return {
    // 状态
    rooms, students, assignments, blockedSeats, reservedSeats, selectedRoomId, warnings, conflicts, conflictScores, selectedSeat, undoStack,
    examName, examDate, examStartTime, examEndTime, invigilators, doorDirection, doorSeats, layoutMode,
    publicShowNames, publicShowClass, publicShowElectives,
    // 计算属性
    canUndo, totalStudents, assignedCount, unassignedCount, totalBlockedCount, selectedRoom, unassignedStudents,
    studentsInSelectedRoom, roomStats, availableClasses, availableElectives, examStatus, paperStatistics,
    // 方法
    undo, pushUndoSnapshot,
    addRoom, updateRoom, deleteRoom, selectRoom, clearRoom,
    importStudents, removeStudent,
    assignStudent, unassignStudent, swapSeats, handleSeatClick, bulkAssignStudents,
    blockSeat, unblockSeat, toggleBlock, isSeatBlocked,
    reserveSeat, unreserveSeat, toggleReserved, isSeatReserved, getReservedInfo, batchReserveSeats, batchUnreserveSeats,
    toggleLock, lockAllInRoom, unlockAllInRoom, batchLockSeats, batchUnlockSeats, lockAllNewAssignments,
    getAssignment, canModifySeat, validateExclusiveRules,
    detectConflicts, detectDuplicateAssignments, generateArrangeReport,
    persistRooms, persistStudents, persistAssignments, persistBlockedSeats, persistReservedSeats,
    resetAllToDefaults,
    getDoorSeatIndex, isDoorSeat, setDoorSeat, removeDoorSeat,
    saveDoorDirection, saveLayoutMode, saveExamName, saveExamDate, saveExamTime, saveInvigilators,
    savePublicShowNames, savePublicShowClass, savePublicShowElectives
  }
})
