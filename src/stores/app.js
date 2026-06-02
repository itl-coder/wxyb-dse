/**
 * 应用 Store — 主题 / 侧边栏 / 学校设置 / 用户认证 / 学生上下文
 *
 *  菜单逻辑已独立到 menuStore，后续继续按功能拆分
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginHandler, getUserInfoHandler } from '@/api/auth'
import { useMenuStore } from '@/stores/menu'
import { studentService } from '@/services/dataService'

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
  const currentStudent = computed(() =>
    currentStudentId.value ? studentService.getById(currentStudentId.value) : null
  )

  // ==================== Auth ====================
  const token = ref(localStorage.getItem('admin_token') || null)
  const currentUser = ref(loadUserFromStorage())
  const isAuthenticated = computed(() => !!token.value && !!currentUser.value)

  function loadUserFromStorage() {
    try { return JSON.parse(localStorage.getItem('dse_admin_user')) } catch { return null }
  }

  // ==================== 登录 ====================
  async function login(username, password, rememberMe = false) {
    console.log('[API] POST /login', { username })
    const res = await loginHandler({ username, password, rememberMe })
    console.log('[API] /login 响应:', res)
    const { accessToken, refreshToken, userId, username: uname, nickName, avatar } = res.data

    token.value = accessToken
    localStorage.setItem('admin_token', accessToken)
    if (refreshToken) localStorage.setItem('admin_refresh_token', refreshToken)

    currentUser.value = {
      id: userId, username: uname, displayName: nickName || uname,
      avatar: avatar || '', campus: '', class: '', active: true
    }
    localStorage.setItem('dse_admin_user', JSON.stringify(currentUser.value))

    try {
      console.log('[API] GET /user/info')
      const infoRes = await getUserInfoHandler()
      console.log('[API] /user/info 响应:', infoRes)
      if (infoRes.data) {
        Object.assign(currentUser.value, {
          email: infoRes.data.email, phoneNumber: infoRes.data.phoneNumber,
          sex: infoRes.data.sex, avatar: infoRes.data.avatar || avatar,
          loginMethod: infoRes.data.loginMethod
        })
        localStorage.setItem('dse_admin_user', JSON.stringify(currentUser.value))
      }
    } catch (e) { console.warn('[API] /user/info 失败:', e) }

    // 拉取菜单权限（委托 menuStore）
    const menuStore = useMenuStore()
    await menuStore.fetchMenuTree()

    return { success: true }
  }

  function logout() {
    token.value = null
    currentUser.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('dse_admin_user')
    useMenuStore().clear()
  }

  // ==================== 刷新恢复 ====================
  async function initAuth() {
    const savedToken = localStorage.getItem('admin_token')
    if (!savedToken) return false
    token.value = savedToken

    try {
      console.log('[API] GET /user/info (initAuth)')
      const infoRes = await getUserInfoHandler()
      console.log('[API] /user/info 响应:', infoRes)
      if (infoRes.data) {
        currentUser.value = {
          id: infoRes.data.userId, username: infoRes.data.username,
          displayName: infoRes.data.nickName || infoRes.data.username,
          avatar: infoRes.data.avatar || '',
          email: infoRes.data.email, phoneNumber: infoRes.data.phoneNumber,
          sex: infoRes.data.sex, campus: '', class: '', active: true
        }
        localStorage.setItem('dse_admin_user', JSON.stringify(currentUser.value))
      }
    } catch (e) {
      if (e?.response?.status === 401) { logout(); return false }
      const u = loadUserFromStorage()
      if (!u) { logout(); return false }
      currentUser.value = u
    }

    try { await useMenuStore().fetchMenuTree() } catch (e) { console.warn('[API] 菜单获取失败:', e) }
    return true
  }

  // ==================== Theme ====================
  function setTheme(t) {
    theme.value = t; localStorage.setItem('dse_theme', t); applyTheme(t)
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
    id ? localStorage.setItem('dse_portal_student', String(id)) : localStorage.removeItem('dse_portal_student')
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }
  applyTheme(theme.value)

  // ==================== Util ====================
  function classBelongsToCampus(className, campus) {
    return { '5D': '九龙塘总校', '5C': '旺角分校', '6A': '铜锣湾分校' }[className] === campus
  }

  // ==================== menuStore 透传（兼容旧组件） ====================
  function hasPermission(perm) { return useMenuStore().hasPermission(perm) }
  function hasMenuAccess(path) { return useMenuStore().hasMenuAccess(path) }

  return {
    theme, sidebarCollapsed, schoolName, schoolFullName, schoolSubtitle,
    semesterStart, semesterEnd, homeroomTeacher, reportFooter,
    watermarkEnabled, watermarkText, previewTheme, showTeacherSign, showParentSign,
    currentStudentId, currentStudent,
    setTheme, toggleSidebar, setSidebarCollapsed, setSchoolSettings, setCurrentStudentId,
    token, currentUser, isAuthenticated, login, logout, initAuth,
    hasPermission, hasMenuAccess,
    classBelongsToCampus
  }
})
