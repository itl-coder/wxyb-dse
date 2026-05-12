import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { studentService, userService, roleService, MENU_DEFINITIONS, MENU_GROUP_ORDER } from '@/services/dataService'

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

  // ==================== Favorites & Recent Menus ====================
  const favoriteMenus = ref(loadFavoritesFromStorage())
  const recentMenus = ref(loadRecentFromStorage())

  function loadFavoritesFromStorage() {
    try {
      const raw = localStorage.getItem('dse_favorite_menus')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  function loadRecentFromStorage() {
    try {
      const raw = localStorage.getItem('dse_recent_menus')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  function toggleFavorite(menuKey) {
    const idx = favoriteMenus.value.indexOf(menuKey)
    if (idx >= 0) {
      favoriteMenus.value.splice(idx, 1)
    } else {
      favoriteMenus.value.push(menuKey)
    }
    localStorage.setItem('dse_favorite_menus', JSON.stringify(favoriteMenus.value))
  }

  function isFavorite(menuKey) {
    return favoriteMenus.value.includes(menuKey)
  }

  function addRecentAccess(menuKey) {
    if (!menuKey) return
    recentMenus.value = recentMenus.value.filter(r => r.menuKey !== menuKey)
    recentMenus.value.unshift({ menuKey, accessedAt: Date.now() })
    if (recentMenus.value.length > 5) recentMenus.value = recentMenus.value.slice(0, 5)
    localStorage.setItem('dse_recent_menus', JSON.stringify(recentMenus.value))
  }

  // Helper to find menu item by key across flat items and children
  function findMenuItem(menuKey) {
    for (const m of MENU_DEFINITIONS) {
      if (m.menuKey === menuKey) return m
      if (m.children) {
        const found = m.children.find(c => c.menuKey === menuKey)
        if (found) return found
      }
    }
    return null
  }

  function getFavoriteMenuItems() {
    return favoriteMenus.value
      .map(key => findMenuItem(key))
      .filter(Boolean)
  }

  function getRecentMenuItems() {
    return recentMenus.value
      .map(r => findMenuItem(r.menuKey))
      .filter(Boolean)
  }

  // ==================== Auth State ====================
  const currentUser = ref(loadUserFromStorage())
  const isAuthenticated = computed(() => !!currentUser.value)
  const currentRole = computed(() => {
    if (!currentUser.value) return null
    return roleService.getById(currentUser.value.roleId)
  })

  function loadUserFromStorage() {
    try {
      // New key first
      const raw = localStorage.getItem('dse_admin_user')
      if (raw) return JSON.parse(raw)
      // Fallback: migrate from old key
      const oldRaw = localStorage.getItem('admin_user')
      if (oldRaw) {
        const oldUser = JSON.parse(oldRaw)
        // Old format: { name, role, id } — convert to new format
        const migrated = {
          id: oldUser.id === 'admin' ? 1 : oldUser.id === 'teacher' ? 2 : oldUser.id === 'dean' ? 3 : 1,
          username: oldUser.id || 'admin',
          displayName: oldUser.name || '管理员',
          roleId: oldUser.id === 'admin' ? 1 : oldUser.id === 'teacher' ? 2 : oldUser.id === 'dean' ? 3 : 1,
          campus: '', class: '', active: true
        }
        // Save to new key
        localStorage.setItem('dse_admin_user', JSON.stringify(migrated))
        // Generate proper token
        localStorage.setItem('admin_token', 'authenticated_' + migrated.id)
        return migrated
      }
      return null
    } catch { return null }
  }

  function hasPermission(perm) {
    if (!currentRole.value) return false
    const perms = currentRole.value.permissions
    if (!perms || perms.length === 0) return false
    if (perms.includes('*')) return true
    if (perms.includes(perm)) return true
    // Check category wildcard: e.g. hasPermission('teaching.behavior.view') matches 'teaching.*'
    const parts = perm.split('.')
    if (parts.length >= 2) {
      const categoryWildcard = parts[0] + '.*'
      if (perms.includes(categoryWildcard)) return true
    }
    return false
  }

  function hasMenuAccess(menuKey) {
    if (!currentRole.value) return false
    const menuIds = currentRole.value.menuIds
    if (!menuIds || menuIds.length === 0) return true // empty = all menus
    return menuIds.includes(menuKey)
  }

  function getVisibleMenuItems() {
    if (!currentRole.value) return []
    const menuIds = currentRole.value.menuIds
    if (!menuIds || menuIds.length === 0) return MENU_DEFINITIONS
    // Flatten: if a parent menuKey is in menuIds, include it and all its children
    const result = []
    MENU_DEFINITIONS.forEach(m => {
      if (menuIds.includes(m.menuKey)) {
        result.push(m)
        if (m.children) result.push(...m.children)
      }
    })
    return result
  }

  function refreshPermissions() {
    // Re-read user and role from storage to force reactive update
    const user = loadUserFromStorage()
    if (user) {
      currentUser.value = user
    }
    // Force role recomputation by triggering a micro-change
    const role = currentRole.value
    if (role) {
      // Clone and reassign to trigger reactivity
      currentUser.value = { ...currentUser.value }
    }
  }

  // Named page -> menuKey mapping for recent access tracking
  const pageToMenuKey = {
    'Dashboard': 'dashboard', 'Timetable': 'timetable', 'Behavior': 'behavior',
    'Homework': 'homework', 'HomeworkAssign': 'homework-assign', 'ShiftHandover': 'handover',
    'Discipline': 'discipline', 'Phone': 'phone',
    'Attendance': 'attendance', 'Reports': 'reports', 'Exam': 'exam',
    'Questions': 'questions', 'QuestionBank': 'question-bank', 'ExamTips': 'exam-tips',
    'Counseling': 'counseling', 'Conference': 'conference', 'CourseFeedback': 'course-feedback',
    'ParentConference': 'parent-conference', 'Voice': 'voice',
    'StudentManagement': 'students', 'CourseManagement': 'courses',
    'Settings': 'settings', 'ConfigCenter': 'config',
    'UserManagement': 'users', 'RoleManagement': 'roles',
    'AISkills': 'ai-skills', 'AIFunctions': 'ai-excel', 'AITools': 'ai-tools',
    'AIQuotes': 'ai-quotes', 'AIPrompts': 'ai-prompts'
  }

  function trackPageAccess(pageName) {
    const menuKey = pageToMenuKey[pageName]
    if (menuKey) addRecentAccess(menuKey)
  }

  // Simple class-to-campus mapping (from seed data)
  function classBelongsToCampus(className, campus) {
    const map = { '5D': '九龙塘总校', '5C': '旺角分校', '6A': '铜锣湾分校' }
    return map[className] === campus
  }

  function login(username, password) {
    const user = userService.login(username, password)
    if (!user) return false
    currentUser.value = user
    localStorage.setItem('dse_admin_user', JSON.stringify(user))
    localStorage.setItem('admin_token', 'authenticated_' + user.id)
    return true
  }

  function logout() {
    currentUser.value = null
    localStorage.removeItem('dse_admin_user')
    localStorage.removeItem('admin_token')
  }

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
    setTheme, toggleSidebar, setSidebarCollapsed, setSchoolSettings, setCurrentStudentId,
    // Auth
    currentUser, isAuthenticated, currentRole,
    hasPermission, hasMenuAccess, getVisibleMenuItems, classBelongsToCampus,
    login, logout, refreshPermissions,
    // Favorites & Recent
    favoriteMenus, recentMenus,
    toggleFavorite, isFavorite, addRecentAccess, trackPageAccess,
    getFavoriteMenuItems, getRecentMenuItems
  }
})
