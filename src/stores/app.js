import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { studentService } from '@/services/dataService'

export const useAppStore = defineStore('app', () => {
  const theme = ref(localStorage.getItem('dse_theme') || 'dark')
  const sidebarCollapsed = ref(localStorage.getItem('dse_sidebar_collapsed') === 'true')
  const schoolName = ref('威学一百')
  const semesterStart = ref('2025-09-01')
  const semesterEnd = ref('2026-07-15')
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
    if (s.semesterStart !== undefined) semesterStart.value = s.semesterStart
    if (s.semesterEnd !== undefined) semesterEnd.value = s.semesterEnd
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
    theme, sidebarCollapsed, schoolName, semesterStart, semesterEnd,
    currentStudentId, currentStudent,
    setTheme, toggleSidebar, setSidebarCollapsed, setSchoolSettings, setCurrentStudentId
  }
})
