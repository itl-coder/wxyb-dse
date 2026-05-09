import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { studentService } from '@/services/dataService'

export const useAppStore = defineStore('app', () => {
  const theme = ref(localStorage.getItem('dse_theme') || 'dark')
  const sidebarCollapsed = ref(localStorage.getItem('dse_sidebar_collapsed') === 'true')
  const schoolName = ref('威学一百')
  const schoolFullName = ref('威学一百国际教育')
  const schoolSubtitle = ref('DSE 学习管理系统 · 个性化学习报告')
  const semesterStart = ref('2025-09-01')
  const semesterEnd = ref('2026-07-15')
  const homeroomTeacher = ref('张老师')
  const reportFooter = ref('用心陪伴每一位学生的成长')
  const watermarkEnabled = ref(true)
  const watermarkText = ref('内部资料·仅供家长会使用')
  const previewTheme = ref('default')
  const showTeacherSign = ref(true)
  const showParentSign = ref(true)
  const currentStudentId = ref(Number(localStorage.getItem('dse_portal_student')) || null)
  const currentStudent = computed(() => {
    if (!currentStudentId.value) return null
    return studentService.getById(currentStudentId.value)
  })

  function setTheme(t) {
    theme.value = t
    localStorage.setItem('dse_theme', t)
    applyTheme(t)
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('dse_sidebar_collapsed', String(sidebarCollapsed.value))
  }

  function setSidebarCollapsed(v) {
    sidebarCollapsed.value = v
    localStorage.setItem('dse_sidebar_collapsed', String(v))
  }

  function setSchoolSettings(s) {
    if (s.schoolName !== undefined) schoolName.value = s.schoolName
    if (s.schoolFullName !== undefined) schoolFullName.value = s.schoolFullName
    if (s.schoolSubtitle !== undefined) schoolSubtitle.value = s.schoolSubtitle
    if (s.semesterStart !== undefined) semesterStart.value = s.semesterStart
    if (s.semesterEnd !== undefined) semesterEnd.value = s.semesterEnd
    if (s.homeroomTeacher !== undefined) homeroomTeacher.value = s.homeroomTeacher
    if (s.reportFooter !== undefined) reportFooter.value = s.reportFooter
    if (s.watermarkEnabled !== undefined) watermarkEnabled.value = s.watermarkEnabled
    if (s.watermarkText !== undefined) watermarkText.value = s.watermarkText
    if (s.previewTheme !== undefined) previewTheme.value = s.previewTheme
    if (s.showTeacherSign !== undefined) showTeacherSign.value = s.showTeacherSign
    if (s.showParentSign !== undefined) showParentSign.value = s.showParentSign
  }

  function setCurrentStudentId(id) {
    currentStudentId.value = id
    if (id) {
      localStorage.setItem('dse_portal_student', String(id))
    } else {
      localStorage.removeItem('dse_portal_student')
    }
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t)
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Apply on init
  applyTheme(theme.value)

  return {
    theme, sidebarCollapsed, schoolName, schoolFullName, schoolSubtitle, semesterStart, semesterEnd,
    homeroomTeacher, reportFooter, watermarkEnabled, watermarkText, previewTheme,
    showTeacherSign, showParentSign,
    currentStudentId, currentStudent,
    setTheme, toggleSidebar, setSidebarCollapsed, setSchoolSettings, setCurrentStudentId
  }
})
