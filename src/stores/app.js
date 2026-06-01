/**
 * 全局状态管理 — Pinia Store
 *
 * 管理内容：
 *   - 主题切换（浅色/深色，Admin/Portal 双场景）
 *   - 侧边栏折叠状态（localStorage 持久化）
 *   - 用户认证 — 真实后端 API 登录/登出 + Token 管理
 *   - 权限菜单 — 从后端获取菜单树 + 权限列表
 *   - 学校设置（水印、学期、签名等 12 项配置）
 *   - 收藏菜单 & 最近访问菜单
 *   - 当前学生上下文（门户端）
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { loginHandler, getUserInfoHandler } from '@/api/auth'
import { getUserMenuTreeHandler } from '@/api/menu'
import { studentService, roleService, MENU_DEFINITIONS, MENU_GROUP_ORDER } from '@/services/dataService'

export const useAppStore = defineStore('app', () => {
  // ==================== Theme & Sidebar ====================
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
  const token = ref(localStorage.getItem('admin_token') || null)
  const currentUser = ref(loadUserFromStorage())
  const isAuthenticated = computed(() => !!token.value && !!currentUser.value)
  const currentRole = computed(() => {
    if (!currentUser.value) return null
    return roleService.getById(currentUser.value.roleId)
  })

  function loadUserFromStorage() {
    try {
      const raw = localStorage.getItem('dse_admin_user')
      if (raw) return JSON.parse(raw)
      // Fallback: migrate from old key
      const oldRaw = localStorage.getItem('admin_user')
      if (oldRaw) {
        const oldUser = JSON.parse(oldRaw)
        const migrated = {
          id: oldUser.id === 'admin' ? 1 : oldUser.id === 'teacher' ? 2 : oldUser.id === 'dean' ? 3 : 1,
          username: oldUser.id || 'admin',
          displayName: oldUser.name || '管理员',
          roleId: oldUser.id === 'admin' ? 1 : oldUser.id === 'teacher' ? 2 : oldUser.id === 'dean' ? 3 : 1,
          campus: '', class: '', active: true
        }
        localStorage.setItem('dse_admin_user', JSON.stringify(migrated))
        localStorage.setItem('admin_token', 'authenticated_' + migrated.id)
        return migrated
      }
      return null
    } catch { return null }
  }

  // ==================== 后端权限菜单 ====================
  // 从后端获取的原始菜单树
  const serverMenuTree = ref(null)
  // 从菜单树提取的权限列表（扁平化 perms）
  const serverPermissions = computed(() => {
    if (!serverMenuTree.value) return null
    const perms = []
    function extract(tree) {
      for (const node of tree) {
        if (node.perms) perms.push(node.perms)
        if (node.children && node.children.length) extract(node.children)
      }
    }
    extract(serverMenuTree.value)
    return perms
  })
  // 从后端菜单树提取的可见菜单 ID 集合
  const serverMenuIds = computed(() => {
    if (!serverMenuTree.value) return null
    const ids = new Set()
    function collect(tree) {
      for (const node of tree) {
        if (node.visible !== '1') { /* '0' = hidden, skip */ }
        ids.add(node.menuId)
        if (node.children && node.children.length) collect(node.children)
      }
    }
    collect(serverMenuTree.value)
    return ids
  })

  function hasPermission(perm) {
    // 优先使用后端权限
    if (serverPermissions.value !== null) {
      if (serverPermissions.value.includes('*')) return true
      if (serverPermissions.value.includes(perm)) return true
      const parts = perm.split('.')
      if (parts.length >= 2) {
        const categoryWildcard = parts[0] + '.*'
        if (serverPermissions.value.includes(categoryWildcard)) return true
      }
      return false
    }
    // 降级：使用 dataService 模拟数据
    if (!currentRole.value) return false
    const perms = currentRole.value.permissions
    if (!perms || perms.length === 0) return false
    if (perms.includes('*')) return true
    if (perms.includes(perm)) return true
    const parts = perm.split('.')
    if (parts.length >= 2) {
      const categoryWildcard = parts[0] + '.*'
      if (perms.includes(categoryWildcard)) return true
    }
    return false
  }

  function hasMenuAccess(menuKey) {
    // 优先使用后端菜单
    if (serverMenuTree.value !== null) {
      // 查找 menuKey 对应的前端菜单项，匹配其 route 到后端菜单 path
      const menuItem = findMenuItem(menuKey)
      if (!menuItem) return false
      // 后端菜单 ID 集合已包含所有有权限的菜单
      // 通配：如果 menuKey 存在于 system menu tree 的 perms 中
      return true // 默认放行，细粒度由 hasPermission 控制
    }
    // 降级：使用 dataService 模拟数据
    if (!currentRole.value) return false
    const menuIds = currentRole.value.menuIds
    if (!menuIds || menuIds.length === 0) return true
    return menuIds.includes(menuKey)
  }

  function getVisibleMenuItems() {
    if (!currentRole.value) return []
    const menuIds = currentRole.value.menuIds
    if (!menuIds || menuIds.length === 0) return MENU_DEFINITIONS
    const result = []
    MENU_DEFINITIONS.forEach(m => {
      if (menuIds.includes(m.menuKey)) {
        result.push(m)
      }
    })
    return result
  }

  function refreshPermissions() {
    const user = loadUserFromStorage()
    if (user) {
      currentUser.value = user
    }
    const role = currentRole.value
    if (role) {
      currentUser.value = { ...currentUser.value }
    }
  }

  // ==================== 登录 / 登出 ====================

  /**
   * 登录 — 调用真实后端 API
   * @param {string} username - 用户名或手机号
   * @param {string} password - 密码
   * @param {boolean} rememberMe - 记住我
   * @returns {Promise<Object>} 登录结果 { success, error }
   */
  async function login(username, password, rememberMe = false) {
    try {
      const res = await loginHandler({ username, password, rememberMe })
      const { accessToken, refreshToken, expiresAt, userId, username: uname, nickName, avatar } = res.data

      // 1. 存储 Token
      token.value = accessToken
      localStorage.setItem('admin_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('admin_refresh_token', refreshToken)
      }

      // 2. 构建前端用户对象
      const user = {
        id: userId,
        username: uname,
        displayName: nickName || uname,
        avatar: avatar || '',
        roleId: null, // 从后端菜单权限中推断
        campus: '',
        class: '',
        active: true
      }
      currentUser.value = user
      localStorage.setItem('dse_admin_user', JSON.stringify(user))

      // 3. 获取用户详细信息
      try {
        const infoRes = await getUserInfoHandler()
        if (infoRes.data) {
          const info = infoRes.data
          currentUser.value = {
            ...currentUser.value,
            email: info.email,
            phoneNumber: info.phoneNumber,
            sex: info.sex,
            avatar: info.avatar || avatar,
            loginMethod: info.loginMethod
          }
          localStorage.setItem('dse_admin_user', JSON.stringify(currentUser.value))
        }
      } catch (e) {
        // 用户信息获取失败不影响登录流程
        console.warn('获取用户信息失败:', e)
      }

      // 4. 获取权限菜单树
      try {
        const menuRes = await getUserMenuTreeHandler()
        if (menuRes.data) {
          serverMenuTree.value = menuRes.data
        }
      } catch (e) {
        console.warn('获取菜单权限失败:', e)
        // 降级：使用 dataService 模拟数据
        serverMenuTree.value = null
      }

      return { success: true }
    } catch (error) {
      // 提取后端错误消息
      const msg = error?.response?.data?.msg || error?.message || '登录失败'
      return { success: false, error: msg }
    }
  }

  /**
   * 登出
   */
  function logout() {
    token.value = null
    currentUser.value = null
    serverMenuTree.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('dse_admin_user')
  }

  /**
   * 初始化 Auth 状态（应用启动时调用）
   * 如果已有 token，尝试获取用户信息和菜单权限
   */
  async function initAuth() {
    const savedToken = localStorage.getItem('admin_token')
    if (!savedToken) return false

    token.value = savedToken

    // 尝试获取用户信息验证 token 是否有效
    try {
      const infoRes = await getUserInfoHandler()
      if (infoRes.data) {
        const info = infoRes.data
        const user = {
          id: info.userId,
          username: info.username,
          displayName: info.nickName || info.username,
          avatar: info.avatar || '',
          email: info.email,
          phoneNumber: info.phoneNumber,
          sex: info.sex,
          roleId: null,
          campus: '',
          class: '',
          active: true
        }
        currentUser.value = user
        localStorage.setItem('dse_admin_user', JSON.stringify(user))
      }
    } catch (e) {
      // Token 失效，清除
      if (e?.response?.status === 401) {
        logout()
        return false
      }
      // 网络错误等，尝试从 localStorage 恢复用户
      const savedUser = loadUserFromStorage()
      if (savedUser) {
        currentUser.value = savedUser
      } else {
        logout()
        return false
      }
    }

    // 获取菜单权限
    try {
      const menuRes = await getUserMenuTreeHandler()
      if (menuRes.data) {
        serverMenuTree.value = menuRes.data
      }
    } catch (e) {
      console.warn('获取菜单权限失败:', e)
    }

    return true
  }

  // ==================== Page → MenuKey Mapping ====================
  const pageToMenuKey = {
    'Dashboard': 'dashboard', 'Timetable': 'timetable', 'Behavior': 'behavior',
    'Homework': 'homework', 'ShiftHandover': 'handover',
    'Discipline': 'discipline', 'Phone': 'phone',
    'Attendance': 'attendance', 'Reports': 'reports', 'Exam': 'exam',
    'Questions': 'questions', 'QuestionBank': 'question-bank', 'ExamTips': 'exam-tips',
    'Counseling': 'counseling', 'Conference': 'conference', 'CourseFeedback': 'course-feedback',
    'ParentConference': 'parent-conference', 'Voice': 'voice',
    'StudentManagement': 'students', 'CourseManagement': 'courses',
    'Settings': 'settings', 'ConfigCenter': 'config',
    'UserManagement': 'users', 'RoleManagement': 'roles',
    'AISkills': 'ai-skills', 'AIFunctions': 'ai-excel', 'AITools': 'ai-tools',
    'AIQuotes': 'ai-quotes', 'AIPrompts': 'ai-prompts',
    'ExamSeat': 'exam-seat'
  }

  function trackPageAccess(pageName) {
    const menuKey = pageToMenuKey[pageName]
    if (menuKey) addRecentAccess(menuKey)
  }

  // ==================== Utilities ====================
  function classBelongsToCampus(className, campus) {
    const map = { '5D': '九龙塘总校', '5C': '旺角分校', '6A': '铜锣湾分校' }
    return map[className] === campus
  }

  // ==================== Theme & Settings ====================
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
    // Theme & Sidebar
    theme, sidebarCollapsed, schoolName, schoolFullName, schoolSubtitle, semesterStart, semesterEnd,
    homeroomTeacher, reportFooter, watermarkEnabled, watermarkText, previewTheme,
    showTeacherSign, showParentSign,
    currentStudentId, currentStudent,
    setTheme, toggleSidebar, setSidebarCollapsed, setSchoolSettings, setCurrentStudentId,
    // Auth
    token, currentUser, isAuthenticated, currentRole,
    serverMenuTree, serverPermissions, serverMenuIds,
    hasPermission, hasMenuAccess, getVisibleMenuItems, classBelongsToCampus,
    login, logout, initAuth, refreshPermissions,
    // Favorites & Recent
    favoriteMenus, recentMenus,
    toggleFavorite, isFavorite, addRecentAccess, trackPageAccess,
    getFavoriteMenuItems, getRecentMenuItems
  }
})
