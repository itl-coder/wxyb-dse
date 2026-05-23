/**
 * 考试座位安排管理 — Pinia Store
 * v2: 屏蔽座位、撤销、点击换位、智能排座、筛选、批量操作
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  loadRooms, saveRooms,
  loadStudents, saveStudents,
  loadAssignments, saveAssignments,
  loadBlockedSeats, saveBlockedSeats,
  resetToDefaults
} from '@/views/admin/exams/exam-seat/utils/localCache.js'
import { autoArrange, detectConflicts as runDetection } from '@/views/admin/exams/exam-seat/utils/seatAllocator.js'

export const useExamSeatStore = defineStore('examSeat', () => {
  // ==================== 状态 ====================
  const rooms = ref(loadRooms())
  const students = ref(loadStudents())
  const assignments = ref(loadAssignments())
  const blockedSeats = ref(loadBlockedSeats())
  const doorSeats = ref({}) // { [roomId]: seatIndex }
  const selectedRoomId = ref(null)
  const searchKeyword = ref('')
  const warnings = ref([])
  const conflicts = ref([])

  // 点击选座
  const selectedSeat = ref(null) // { roomId, seatIndex } | null

  // 学生池筛选
  const poolFilterClass = ref('')
  const poolFilterElective = ref('')
  const poolSortBy = ref('name')
  const poolSortOrder = ref('asc')

  // 批量选择
  const selectedPoolStudentIds = ref(new Set())

  // 撤销
  const undoStack = ref([])
  const MAX_UNDO = 30

  // ==================== 撤销 ====================
  function pushUndoSnapshot() {
    undoStack.value.push({
      assignments: JSON.parse(JSON.stringify(assignments.value)),
      blockedSeats: JSON.parse(JSON.stringify(blockedSeats.value))
    })
    if (undoStack.value.length > MAX_UNDO) undoStack.value.shift()
  }

  const canUndo = computed(() => undoStack.value.length > 0)

  function undo() {
    if (!undoStack.value.length) return false
    const snap = undoStack.value.pop()
    assignments.value = snap.assignments
    blockedSeats.value = snap.blockedSeats
    persistAssignments()
    persistBlockedSeats()
    detectConflicts()
    return true
  }

  // ==================== 计算属性 ====================
  const totalStudents = computed(() => students.value.length)
  const assignedCount = computed(() => {
    const ids = new Set(assignments.value.map(a => a.studentId))
    return ids.size
  })
  const unassignedCount = computed(() => totalStudents.value - assignedCount.value)
  const totalBlockedCount = computed(() => blockedSeats.value.length)

  const selectedRoom = computed(() =>
    rooms.value.find(r => r.id === selectedRoomId.value) || null
  )

  const unassignedStudents = computed(() => {
    const assignedIds = new Set(assignments.value.map(a => a.studentId))
    return students.value.filter(s => !assignedIds.has(s.id))
  })

  const studentsInSelectedRoom = computed(() => {
    if (!selectedRoomId.value) return []
    const roomAssignments = assignments.value.filter(a => a.roomId === selectedRoomId.value)
    const studentMap = {}
    students.value.forEach(s => { studentMap[s.id] = s })
    return roomAssignments.map(a => ({
      ...a,
      student: studentMap[a.studentId] || null
    }))
  })

  const roomStats = computed(() => {
    return rooms.value.map(room => {
      const roomAssigns = assignments.value.filter(a => a.roomId === room.id)
      const assignedIds = new Set(roomAssigns.map(a => a.studentId))
      const blockedCount = blockedSeats.value.filter(b => b.roomId === room.id).length
      return {
        ...room,
        totalCapacity: room.rows * room.cols,
        assignedCount: assignedIds.size,
        blockedCount,
        emptyCount: room.rows * room.cols - assignedIds.size - blockedCount
      }
    })
  })

  const availableClasses = computed(() => {
    const classes = new Set()
    students.value.forEach(s => { if (s.className) classes.add(s.className) })
    return [...classes].sort()
  })

  const availableElectives = computed(() => {
    const set = new Set()
    students.value.forEach(s => { (s.electives || []).forEach(e => set.add(e)) })
    return [...set].sort()
  })

  const filteredUnassigned = computed(() => {
    let list = [...unassignedStudents.value]

    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(kw) ||
        (s.className || '').toLowerCase().includes(kw) ||
        (s.classNo || '').toLowerCase().includes(kw)
      )
    }
    if (poolFilterClass.value) {
      list = list.filter(s => s.className === poolFilterClass.value)
    }
    if (poolFilterElective.value) {
      list = list.filter(s => (s.electives || []).includes(poolFilterElective.value))
    }

    list.sort((a, b) => {
      let cmp = 0
      if (poolSortBy.value === 'name') {
        cmp = a.name.localeCompare(b.name, 'zh')
      } else if (poolSortBy.value === 'class') {
        cmp = (a.className || '').localeCompare(b.className || '', 'zh') || a.name.localeCompare(b.name, 'zh')
      } else if (poolSortBy.value === 'electiveCount') {
        cmp = (a.electives?.length || 0) - (b.electives?.length || 0) || a.name.localeCompare(b.name, 'zh')
      }
      return poolSortOrder.value === 'desc' ? -cmp : cmp
    })
    return list
  })

  const isAllPoolSelected = computed(() => {
    if (filteredUnassigned.value.length === 0) return false
    return filteredUnassigned.value.every(s => selectedPoolStudentIds.value.has(s.id))
  })

  const conflictMap = computed(() => {
    const map = {}
    conflicts.value.forEach(c => {
      c.studentIds.forEach(sid => {
        if (!map[sid]) map[sid] = []
        map[sid].push(c)
      })
    })
    return map
  })

  // 获取指定教室的屏蔽座位集合
  function isSeatBlocked(roomId, seatIndex) {
    return blockedSeats.value.some(b => b.roomId === roomId && b.seatIndex === seatIndex)
  }

  /**
   * 排他性教室约束验证（统一入口）
   * 规则1: 排他性教室只接受该班学生
   * 规则2: 排他性班级学生只能去其专属教室
   * @param {number} studentId
   * @param {number} targetRoomId
   * @returns {{ valid: boolean, reason?: string }}
   */
  function validateExclusiveRules(studentId, targetRoomId) {
    const student = students.value.find(s => s.id === studentId)
    if (!student) return { valid: false, reason: '学生不存在' }

    const targetRoom = rooms.value.find(r => r.id === targetRoomId)
    if (!targetRoom) return { valid: false, reason: '教室不存在' }

    // 规则1: 排他性教室只接受该班学生
    if (targetRoom.exclusiveClassId && student.className !== targetRoom.exclusiveClassId) {
      return { valid: false, reason: `该教室仅限 ${targetRoom.exclusiveClassId} 班学生` }
    }

    // 规则2: 排他性班级学生只能去其专属教室
    const exclusiveRoom = rooms.value.find(r => r.exclusiveClassId === student.className)
    if (exclusiveRoom && targetRoom.id !== exclusiveRoom.id) {
      return { valid: false, reason: `${student.className} 班专属教室为 ${exclusiveRoom.name}，不可分配至其他教室` }
    }

    return { valid: true }
  }

  /**
   * 集中座位修改权限检查
   * @param {number} roomId
   * @param {number} seatIndex
   * @returns {boolean}
   */
  function canModifySeat(roomId, seatIndex) {
    if (isSeatBlocked(roomId, seatIndex)) return false
    const a = assignments.value.find(a => a.roomId === roomId && a.seatIndex === seatIndex)
    if (a?.locked) return false
    return true
  }

  // ==================== 动作 ====================

  // 教室管理
  function addRoom(room) {
    pushUndoSnapshot()
    const maxId = rooms.value.reduce((max, r) => Math.max(max, r.id), 0)
    const newRoom = { ...room, id: maxId + 1 }
    rooms.value.push(newRoom)
    persistRooms()
    return newRoom
  }

  function updateRoom(id, data) {
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
    persistRooms()
    persistAssignments()
    persistBlockedSeats()
  }

  function selectRoom(id) {
    selectedRoomId.value = id
    selectedSeat.value = null
  }

  // 学生管理
  function importStudents(newStudents) {
    pushUndoSnapshot()
    let nextId = students.value.reduce((max, s) => Math.max(max, s.id), 0)
    const added = []

    newStudents.forEach(s => {
      const dup = students.value.find(e => e.classNo === s.classNo && e.className === s.className)
      if (dup) {
        Object.assign(dup, s)
        return
      }
      const student = { ...s, id: ++nextId, imported: Date.now() }
      students.value.push(student)
      added.push(student)
    })

    persistStudents()
    return { added, total: students.value.length }
  }

  function removeStudent(id) {
    pushUndoSnapshot()
    students.value = students.value.filter(s => s.id !== id)
    assignments.value = assignments.value.filter(a => a.studentId !== id)
    persistStudents()
    persistAssignments()
  }

  function updateStudent(id, data) {
    const idx = students.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      students.value[idx] = { ...students.value[idx], ...data }
      persistStudents()
    }
  }

  function clearStudents() {
    pushUndoSnapshot()
    students.value = []
    assignments.value = []
    persistStudents()
    persistAssignments()
  }

  // 排座
  function runAutoArrange() {
    pushUndoSnapshot()
    const result = autoArrange(students.value, rooms.value, {
      blockedSeats: blockedSeats.value,
      lockedAssignments: assignments.value.filter(a => a.locked)
    })

    assignments.value = result.assignments

    warnings.value = result.warnings
    conflicts.value = result.conflicts || []
    persistAssignments()
    return result
  }

  function detectConflicts() {
    conflicts.value = runDetection(assignments.value, students.value, rooms.value, blockedSeats.value)
    return conflicts.value
  }

  // 手动分配
  function assignStudent(studentId, roomId, seatIndex) {
    const vr = validateExclusiveRules(studentId, roomId)
    if (!vr.valid) {
      warnings.value = [vr.reason]
      return false
    }
    if (isSeatBlocked(roomId, seatIndex)) {
      warnings.value = ['该座位已被屏蔽']
      return false
    }
    pushUndoSnapshot()
    assignments.value = assignments.value.filter(a => a.studentId !== studentId)
    assignments.value = assignments.value.filter(a => !(a.roomId === roomId && a.seatIndex === seatIndex))
    assignments.value.push({ roomId, seatIndex, studentId, locked: false })
    persistAssignments()
    detectConflicts()
    return true
  }

  function unassignStudent(studentId) {
    pushUndoSnapshot()
    assignments.value = assignments.value.filter(a => a.studentId !== studentId)
    persistAssignments()
    detectConflicts()
  }

  /** 原子操作：移动/交换座位，含完整校验 */
  function moveStudent(fromRoomId, fromSeat, toRoomId, toSeat) {
    const a = assignments.value.find(a => a.roomId === fromRoomId && a.seatIndex === fromSeat)
    if (!a) return false
    if (a.locked) {
      warnings.value = ['源座位已锁定，无法移动']
      return false
    }
    if (isSeatBlocked(toRoomId, toSeat)) {
      warnings.value = ['目标座位已被屏蔽']
      return false
    }
    const targetAssignment = assignments.value.find(a => a.roomId === toRoomId && a.seatIndex === toSeat)
    if (targetAssignment?.locked) {
      warnings.value = ['目标座位已锁定']
      return false
    }
    const vr = validateExclusiveRules(a.studentId, toRoomId)
    if (!vr.valid) { warnings.value = [vr.reason]; return false }
    return swapSeats(fromRoomId, fromSeat, toRoomId, toSeat)
  }

  function swapSeats(roomIdA, seatIndexA, roomIdB, seatIndexB) {
    const a = assignments.value.find(a => a.roomId === roomIdA && a.seatIndex === seatIndexA)
    const b = assignments.value.find(a => a.roomId === roomIdB && a.seatIndex === seatIndexB)

    // 检查屏蔽座位
    if (isSeatBlocked(roomIdB, seatIndexB)) {
      warnings.value = ['目标座位已被屏蔽']
      return false
    }

    // 锁定检查：两个座位都必须未锁定才能交换
    if ((a && a.locked) || (b && b.locked)) {
      warnings.value = ['两个座位都必须解锁后才能交换']
      return false
    }

    // 排他性验证：移动座位A的学生到座位B
    if (a) {
      const vr = validateExclusiveRules(a.studentId, roomIdB)
      if (!vr.valid) { warnings.value = [vr.reason]; return false }
    }
    // 排他性验证：如果是交换，移动座位B的学生到座位A
    if (b) {
      const vr = validateExclusiveRules(b.studentId, roomIdA)
      if (!vr.valid) { warnings.value = [vr.reason]; return false }
    }

    pushUndoSnapshot()

    if (a && b) {
      const tempSid = a.studentId
      a.studentId = b.studentId
      b.studentId = tempSid
      // 锁定状态留在原座位，不跟随学生交换
    } else if (a && !b) {
      a.roomId = roomIdB
      a.seatIndex = seatIndexB
    } else if (!a && b) {
      b.roomId = roomIdA
      b.seatIndex = seatIndexA
    }
    persistAssignments()
    detectConflicts()
    return true
  }

  function toggleLock(roomId, seatIndex) {
    pushUndoSnapshot()
    const a = assignments.value.find(a => a.roomId === roomId && a.seatIndex === seatIndex)
    if (a) {
      a.locked = !a.locked
      persistAssignments()
    }
  }

  // 屏蔽座位
  function blockSeat(roomId, seatIndex) {
    pushUndoSnapshot()
    if (blockedSeats.value.some(b => b.roomId === roomId && b.seatIndex === seatIndex)) return
    // 如果座位上有学生，先取消分配
    assignments.value = assignments.value.filter(a => !(a.roomId === roomId && a.seatIndex === seatIndex))
    blockedSeats.value.push({ roomId, seatIndex })
    persistBlockedSeats()
    persistAssignments()
  }

  function unblockSeat(roomId, seatIndex) {
    pushUndoSnapshot()
    blockedSeats.value = blockedSeats.value.filter(
      b => !(b.roomId === roomId && b.seatIndex === seatIndex)
    )
    persistBlockedSeats()
  }

  // 点击选座
  function selectSeat(roomId, seatIndex) {
    if (selectedSeat.value && selectedSeat.value.roomId === roomId && selectedSeat.value.seatIndex === seatIndex) {
      selectedSeat.value = null
      return
    }
    selectedSeat.value = { roomId, seatIndex }
  }

  function deselectSeat() {
    selectedSeat.value = null
  }

  function handleSeatClick(roomId, seatIndex) {
    const clickedAssignment = assignments.value.find(a => a.roomId === roomId && a.seatIndex === seatIndex)
    const clickedStudent = clickedAssignment ? students.value.find(s => s.id === clickedAssignment.studentId) : null

    if (!selectedSeat.value) {
      if (clickedStudent && !clickedAssignment.locked) {
        selectSeat(roomId, seatIndex)
      }
      return
    }

    const sel = selectedSeat.value
    const selAssignment = assignments.value.find(a => a.roomId === sel.roomId && a.seatIndex === sel.seatIndex)
    const selStudent = selAssignment ? students.value.find(s => s.id === selAssignment.studentId) : null

    // 点击同一座位 → 取消选中
    if (sel.roomId === roomId && sel.seatIndex === seatIndex) {
      deselectSeat()
      return
    }

    // 两个都有学生 → 交换（需要两个座位都未锁定）
    if (clickedStudent && selStudent) {
      if (selAssignment?.locked || clickedAssignment?.locked) {
        warnings.value = ['两个座位都必须解锁后才能交换']
        deselectSeat()
        return
      }
      swapSeats(sel.roomId, sel.seatIndex, roomId, seatIndex)
      deselectSeat()
      return
    }

    // 选中座位有学生，点击空位 → 移动
    if (!clickedStudent && selStudent && !clickedAssignment?.locked) {
      assignStudent(selAssignment.studentId, roomId, seatIndex)
      deselectSeat()
      return
    }

    // 其他情况 → 取消选中
    deselectSeat()
  }

  // 批量选择（学生池）
  function togglePoolStudentSelection(studentId) {
    const newSet = new Set(selectedPoolStudentIds.value)
    if (newSet.has(studentId)) newSet.delete(studentId)
    else newSet.add(studentId)
    selectedPoolStudentIds.value = newSet
  }

  function selectAllPoolStudents() {
    if (isAllPoolSelected.value) {
      selectedPoolStudentIds.value = new Set()
    } else {
      selectedPoolStudentIds.value = new Set(filteredUnassigned.value.map(s => s.id))
    }
  }

  function assignSelectedToRoom(roomId) {
    if (!roomId || selectedPoolStudentIds.value.size === 0) return 0
    const room = rooms.value.find(r => r.id === roomId)
    if (!room) return 0

    pushUndoSnapshot()
    const ids = [...selectedPoolStudentIds.value]
    let placed = 0
    const failedReasons = []
    for (const studentId of ids) {
      const vr = validateExclusiveRules(studentId, roomId)
      if (!vr.valid) { failedReasons.push(vr.reason); continue }
      let found = false
      for (let seatIndex = 1; seatIndex <= room.rows * room.cols; seatIndex++) {
        const occupied = assignments.value.some(a => a.roomId === roomId && a.seatIndex === seatIndex)
        const blocked = isSeatBlocked(roomId, seatIndex)
        if (!occupied && !blocked) {
          assignments.value = assignments.value.filter(a => a.studentId !== studentId)
          assignments.value.push({ roomId, seatIndex, studentId, locked: false })
          placed++
          found = true
          break
        }
      }
      if (!found) break
    }
    if (failedReasons.length) {
      warnings.value = failedReasons
    }
    selectedPoolStudentIds.value = new Set()
    persistAssignments()
    detectConflicts()
    return placed
  }

  function clearRoom(roomId) {
    pushUndoSnapshot()
    assignments.value = assignments.value.filter(a => {
      if (a.roomId !== roomId) return true
      return a.locked
    })
    persistAssignments()
    detectConflicts()
  }

  function lockAllInRoom(roomId) {
    pushUndoSnapshot()
    assignments.value.forEach(a => {
      if (a.roomId === roomId) a.locked = true
    })
    persistAssignments()
  }

  function unlockAllInRoom(roomId) {
    pushUndoSnapshot()
    assignments.value.forEach(a => {
      if (a.roomId === roomId) a.locked = false
    })
    persistAssignments()
  }

  function resetAssignments() {
    pushUndoSnapshot()
    assignments.value = []
    warnings.value = []
    conflicts.value = []
    persistAssignments()
  }

  function resetAll() {
    pushUndoSnapshot()
    const data = resetToDefaults()
    rooms.value = data.rooms
    students.value = data.students
    assignments.value = data.assignments
    blockedSeats.value = data.blockedSeats || []
    selectedRoomId.value = null
    selectedSeat.value = null
    warnings.value = []
    conflicts.value = []
    undoStack.value = []
  }

  // 门口座位（每教室唯一）
  function getDoorSeatIndex(roomId) { return doorSeats.value[roomId] ?? null }
  function isDoorSeat(roomId, seatIndex) { return doorSeats.value[roomId] === seatIndex }
  function setDoorSeat(roomId, seatIndex) { doorSeats.value = { ...doorSeats.value, [roomId]: seatIndex } }
  function removeDoorSeat(roomId) { const n = { ...doorSeats.value }; delete n[roomId]; doorSeats.value = n }

  // 搜索和筛选
  function setSearchKeyword(kw) { searchKeyword.value = kw }
  function setPoolFilterClass(cls) { poolFilterClass.value = cls || '' }
  function setPoolFilterElective(e) { poolFilterElective.value = e || '' }
  function setPoolSortBy(s) { poolSortBy.value = s }
  function togglePoolSortOrder() { poolSortOrder.value = poolSortOrder.value === 'asc' ? 'desc' : 'asc' }

  // 持久化
  function persistRooms() { saveRooms(rooms.value) }
  function persistStudents() { saveStudents(students.value) }
  function persistAssignments() { saveAssignments(assignments.value) }
  function persistBlockedSeats() { saveBlockedSeats(blockedSeats.value) }

  return {
    // state
    rooms, students, assignments, blockedSeats, selectedRoomId, searchKeyword, warnings, conflicts,
    selectedSeat, poolFilterClass, poolFilterElective, poolSortBy, poolSortOrder,
    selectedPoolStudentIds, undoStack,
    // computed
    totalStudents, assignedCount, unassignedCount, totalBlockedCount,
    selectedRoom, unassignedStudents, studentsInSelectedRoom,
    roomStats, availableClasses, availableElectives,
    filteredUnassigned, isAllPoolSelected, conflictMap, canUndo,
    // actions
    addRoom, updateRoom, deleteRoom, selectRoom,
    importStudents, removeStudent, updateStudent, clearStudents,
    runAutoArrange, detectConflicts,
    assignStudent, unassignStudent, moveStudent, swapSeats, toggleLock,
    blockSeat, unblockSeat, isSeatBlocked,
    selectSeat, deselectSeat, handleSeatClick,
    togglePoolStudentSelection, selectAllPoolStudents, assignSelectedToRoom,
    clearRoom, lockAllInRoom, unlockAllInRoom,
    resetAssignments, resetAll, setSearchKeyword,
    setPoolFilterClass, setPoolFilterElective, setPoolSortBy, togglePoolSortOrder,
    undo, pushUndoSnapshot,
    validateExclusiveRules, canModifySeat,
    getDoorSeatIndex, isDoorSeat, setDoorSeat, removeDoorSeat
  }
})
