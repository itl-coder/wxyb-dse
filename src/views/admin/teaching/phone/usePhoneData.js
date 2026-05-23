/**
 * usePhoneData — 手机管理数据层
 * 提供：学生/登记/记录的加载与操作，统计数据，柜位映射
 */
import { ref, computed } from 'vue'
import { phoneRegistrationService, phoneRecordService, studentService } from '@/services/dataService'

export function usePhoneData() {
  const students = ref([])
  const registrations = ref([])
  const records = ref([])
  const currentDate = ref(new Date().toISOString().split('T')[0])
  const cabinetClass = ref('')
  const selectedStudentId = ref(null)

  function loadAll() {
    students.value = studentService.getAll()
    registrations.value = phoneRegistrationService.getAll()
    records.value = phoneRecordService.getAll()
  }

  const classList = computed(() => {
    const s = new Set()
    students.value.forEach(v => { if (v.class) s.add(v.class) })
    return [...s].sort()
  })

  // 日期导航
  const yesterday = computed(() => {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  })

  function shiftDate(delta) {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() + delta)
    currentDate.value = d.toISOString().split('T')[0]
  }
  function goToday() { currentDate.value = new Date().toISOString().split('T')[0] }

  // 登记操作
  function getRegistration(studentId) {
    return registrations.value.find(r => r.studentId === studentId) || null
  }

  function saveRegistration(form, editingId) {
    if (editingId) {
      phoneRegistrationService.update(editingId, { ...form })
    } else {
      phoneRegistrationService.create({ ...form })
    }
    registrations.value = phoneRegistrationService.getAll()
  }

  function deleteRegistration(id) {
    phoneRegistrationService.delete(id)
    registrations.value = phoneRegistrationService.getAll()
  }

  // 当日记录操作
  function getTodayRecord(studentId) {
    return records.value.find(r => r.studentId === studentId && r.date === currentDate.value) || null
  }

  function setStudentStatus(studentId, regId, name, cls, status, extra = {}) {
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    const existing = records.value.find(r => r.studentId === studentId && r.date === currentDate.value)
    if (existing) {
      phoneRecordService.update(existing.id, {
        ...existing, status,
        submitTime: status === '已上交' ? now : existing.submitTime,
        returnTime: status === '已领取' ? now : existing.returnTime,
        detentionReason: extra.detentionReason || existing.detentionReason || '',
        notifyParent: extra.notifyParent !== undefined ? extra.notifyParent : existing.notifyParent,
        notifyType: extra.notifyType || existing.notifyType || '',
        notifyContent: extra.notifyContent || existing.notifyContent || '',
        operatorName: extra.operatorName || existing.operatorName || '',
        remark: extra.remark || existing.remark || ''
      })
    } else {
      phoneRecordService.create({
        registrationId: regId, studentId, studentName: name, class: cls,
        date: currentDate.value, status,
        submitTime: status === '已上交' ? now : '',
        returnTime: status === '已领取' ? now : '',
        detentionReason: extra.detentionReason || '',
        notifyParent: extra.notifyParent !== undefined ? extra.notifyParent : false,
        notifyType: extra.notifyType || '',
        notifyContent: extra.notifyContent || '',
        notifyTime: extra.notifyParent ? new Date().toLocaleString('zh-CN') : '',
        operatorName: extra.operatorName || '',
        remark: extra.remark || ''
      })
    }
    records.value = phoneRecordService.getAll()
  }

  function batchSetClassStatus(cls, status) {
    const clsStudents = students.value.filter(s => s.class === cls)
    clsStudents.forEach(s => {
      const reg = getRegistration(s.id)
      if (!reg) return
      const rec = records.value.find(r => r.studentId === s.id && r.date === currentDate.value)
      if (rec) {
        phoneRecordService.update(rec.id, { ...rec, status })
      } else {
        phoneRecordService.create({
          registrationId: reg.id, studentId: s.id, studentName: s.name, class: s.class,
          date: currentDate.value, status,
          submitTime: '', returnTime: '', detentionReason: '',
          notifyParent: false, notifyType: '', notifyContent: '', operatorName: '', remark: ''
        })
      }
    })
    records.value = phoneRecordService.getAll()
  }

  function copyFromYesterday() {
    const yRecs = records.value.filter(r => r.date === yesterday.value)
    if (!yRecs.length) return 0
    let copied = 0
    yRecs.forEach(r => {
      const exists = records.value.find(t => t.studentId === r.studentId && t.date === currentDate.value)
      if (!exists) {
        phoneRecordService.create({
          ...r, id: undefined, date: currentDate.value,
          status: '已上交', returnTime: '', detentionReason: '',
          notifyParent: false, notifyType: '', notifyContent: '', notifyTime: '',
          operatorName: '', remark: ''
        })
        copied++
      }
    })
    records.value = phoneRecordService.getAll()
    return copied
  }

  // 统计数据
  const todayStats = computed(() => {
    const clsStudents = cabinetClass.value
      ? students.value.filter(s => s.class === cabinetClass.value)
      : students.value
    const todayRecs = records.value.filter(r => r.date === currentDate.value)
    const total = clsStudents.filter(s => getRegistration(s.id)).length
    const deposited = todayRecs.filter(r => r.status === '已上交').length
    const returned = todayRecs.filter(r => r.status === '已领取').length
    const violations = todayRecs.filter(r => r.status === '违纪扣留').length
    const notDeposited = total - deposited - returned - violations
    return { total, deposited, notDeposited: Math.max(0, notDeposited), returned, violations }
  })

  // 柜位状态
  function cabinetStatus(studentId) {
    const rec = getTodayRecord(studentId)
    if (!rec) return getRegistration(studentId) ? 'not-submitted' : 'no-reg'
    const map = { '已上交': 'submitted', '未上交': 'not-submitted', '已领取': 'returned', '违纪扣留': 'violation' }
    return map[rec.status] || 'not-submitted'
  }

  function cabinetStatusLabel(studentId) {
    const rec = getTodayRecord(studentId)
    return rec ? rec.status : (getRegistration(studentId) ? '未上交' : '未登记')
  }

  function cabinetClassRate(cls) {
    const clsStudents = students.value.filter(s => s.class === cls)
    if (!clsStudents.length) return 0
    const withReg = clsStudents.filter(s => getRegistration(s.id)).length
    if (!withReg) return 0
    const deposited = clsStudents.filter(s => {
      const rec = getTodayRecord(s.id)
      return rec && rec.status === '已上交'
    }).length
    return Math.round((deposited / withReg) * 100)
  }

  // 已选学生
  const selectedStudent = computed(() =>
    students.value.find(s => s.id === selectedStudentId.value) || null
  )
  const currentRegistration = computed(() =>
    selectedStudentId.value ? getRegistration(selectedStudentId.value) : null
  )
  const todayRecord = computed(() =>
    selectedStudentId.value ? getTodayRecord(selectedStudentId.value) : null
  )
  const studentRecords = computed(() => {
    if (!selectedStudentId.value) return []
    return records.value
      .filter(r => r.studentId === selectedStudentId.value)
      .sort((a, b) => b.date.localeCompare(a.date))
  })

  return {
    students, registrations, records,
    currentDate, cabinetClass, selectedStudentId,
    classList, yesterday,
    loadAll, shiftDate, goToday,
    getRegistration, saveRegistration, deleteRegistration,
    getTodayRecord, setStudentStatus,
    batchSetClassStatus, copyFromYesterday,
    todayStats, cabinetStatus, cabinetStatusLabel, cabinetClassRate,
    selectedStudent, currentRegistration, todayRecord, studentRecords
  }
}
