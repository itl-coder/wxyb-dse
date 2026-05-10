import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/stores/app'

const routes = [
  // === 公共学习系统 (Warm Academia 浅色主题) ===
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      { path: '', name: 'Home', component: () => import('@/views/HomePage.vue') },
      // 数学专题
      { path: '3d-geometry', name: 'Geometry3D', component: () => import('@/views/math/Geometry3D.vue') },
      { path: 'trigonometry', name: 'Trigonometry', component: () => import('@/views/math/Trigonometry.vue') },
      { path: 'log-exp', name: 'LogExp', component: () => import('@/views/math/LogExp.vue') },
      { path: 'circle-line', name: 'CircleLine', component: () => import('@/views/math/CircleLine.vue') },
      { path: 'composite', name: 'Composite', component: () => import('@/views/math/Composite.vue') },
      { path: 'locus', name: 'Locus', component: () => import('@/views/math/Locus.vue') },
      { path: 'triangle-center', name: 'TriangleCenter', component: () => import('@/views/math/TriangleCenter.vue') },

      { path: 'quadratic', name: 'Quadratic', component: () => import('@/views/math/Quadratic.vue') },
      { path: 'sequence', name: 'Sequence', component: () => import('@/views/math/Sequence.vue') },
      { path: 'probability', name: 'Probability', component: () => import('@/views/math/Probability.vue') },
      { path: 'statistics', name: 'Statistics', component: () => import('@/views/math/Statistics.vue') },
      { path: 'polynomial', name: 'Polynomial', component: () => import('@/views/math/Polynomial.vue') },
      { path: 'inequality', name: 'Inequality', component: () => import('@/views/math/Inequality.vue') },
      { path: 'numbers', name: 'Numbers', component: () => import('@/views/math/Numbers.vue') },
      // 辅助页面
      { path: 'practice', name: 'Practice', component: () => import('@/views/Practice.vue') },
      { path: 'mistakes', name: 'Mistakes', component: () => import('@/views/Mistakes.vue') },
      { path: 'knowledge', name: 'Knowledge', component: () => import('@/views/Knowledge.vue') },
      // 其他学科
      { path: 'chinese', name: 'Chinese', component: () => import('@/views/subjects/Chinese.vue') },
      { path: 'physics', name: 'Physics', component: () => import('@/views/subjects/Physics.vue') },
      { path: 'chemistry', name: 'Chemistry', component: () => import('@/views/subjects/Chemistry.vue') }
    ]
  },

  // === 管理后台 (深色商务主题) ===
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/admin/Login.vue')
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'timetable', name: 'Timetable', component: () => import('@/views/admin/Timetable.vue') },
      { path: 'behavior', name: 'Behavior', component: () => import('@/views/admin/Behavior.vue') },
      { path: 'homework', name: 'Homework', component: () => import('@/views/admin/Homework.vue') },
      { path: 'homework-assign', name: 'HomeworkAssign', component: () => import('@/views/admin/HomeworkAssign.vue'), meta: { permission: 'homework.assign' } },
      { path: 'discipline', name: 'Discipline', component: () => import('@/views/admin/Discipline.vue') },
      { path: 'phone', name: 'Phone', component: () => import('@/views/admin/Phone.vue') },
      { path: 'attendance', name: 'Attendance', component: () => import('@/views/admin/Attendance.vue') },
      { path: 'reports', name: 'Reports', component: () => import('@/views/admin/Reports.vue') },
      { path: 'exam', name: 'Exam', component: () => import('@/views/admin/Exam.vue') },
      { path: 'questions', name: 'Questions', component: () => import('@/views/admin/Questions.vue') },
      { path: 'question-bank', name: 'QuestionBank', component: () => import('@/views/admin/QuestionBank.vue') },
      { path: 'exam-tips', name: 'ExamTips', component: () => import('@/views/admin/ExamTips.vue') },
      { path: 'counseling', name: 'Counseling', component: () => import('@/views/admin/Counseling.vue') },
      { path: 'conference', name: 'Conference', component: () => import('@/views/admin/Conference.vue') },
      { path: 'course-feedback', name: 'CourseFeedback', component: () => import('@/views/admin/CourseFeedback.vue') },
      { path: 'parent-conference', name: 'ParentConference', component: () => import('@/views/admin/ParentConference.vue') },
      { path: 'voice', name: 'Voice', component: () => import('@/views/admin/Voice.vue') },
      { path: 'students', name: 'StudentManagement', component: () => import('@/views/admin/StudentManagement.vue') },
      { path: 'courses', name: 'CourseManagement', component: () => import('@/views/admin/CourseManagement.vue') },
      { path: 'settings', name: 'Settings', component: () => import('@/views/admin/Settings.vue') },
      { path: 'config', name: 'ConfigCenter', component: () => import('@/views/admin/ConfigCenter.vue') },
      { path: 'users', name: 'UserManagement', component: () => import('@/views/admin/UserManagement.vue') },
      { path: 'roles', name: 'RoleManagement', component: () => import('@/views/admin/RoleManagement.vue') },
      { path: 'ai-skills', name: 'AISkills', component: () => import('@/views/admin/AISkills.vue'), meta: { menuKey: 'ai-skills', permission: 'aiData.skills.view' } },
      { path: 'ai-excel', name: 'AIFunctions', component: () => import('@/views/admin/AIFunctions.vue'), meta: { menuKey: 'ai-excel', permission: 'aiData.excel.view' } },
      { path: 'ai-tools', name: 'AITools', component: () => import('@/views/admin/AITools.vue'), meta: { menuKey: 'ai-tools', permission: 'aiData.tools.view' } },
      { path: 'ai-quotes', name: 'AIQuotes', component: () => import('@/views/admin/AIQuotes.vue'), meta: { menuKey: 'ai-quotes', permission: 'aiData.quotes.view' } },
      { path: 'ai-prompts', name: 'AIPrompts', component: () => import('@/views/admin/AIPrompts.vue'), meta: { menuKey: 'ai-prompts', permission: 'aiData.prompts.view' } }
    ]
  },

  // === 学生/家长门户 (浅色主题) ===
  {
    path: '/portal/login',
    name: 'PortalLogin',
    component: () => import('@/views/portal/PortalLogin.vue')
  },
  {
    path: '/portal',
    component: () => import('@/layouts/PortalLayout.vue'),
    meta: { requiresPortalAuth: true },
    children: [
      { path: '', name: 'PortalHome', component: () => import('@/views/portal/PortalHome.vue') },
      { path: 'my-performance', name: 'MyPerformance', component: () => import('@/views/portal/MyPerformance.vue') },
      { path: 'my-homework', name: 'MyHomework', component: () => import('@/views/portal/MyHomework.vue') },
      { path: 'my-exams', name: 'MyExams', component: () => import('@/views/portal/MyExams.vue') },
      { path: 'my-mistakes', name: 'MyMistakes', component: () => import('@/views/portal/MyMistakes.vue') },
      { path: 'my-tips', name: 'MyTips', component: () => import('@/views/portal/MyTips.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// 路由守卫：管理后台需要登录
router.beforeEach((to, from, next) => {
  // Admin auth guard
  if (to.matched.some(r => r.meta?.requiresAuth)) {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    // Check that user data still exists in store
    const store = useAppStore()
    if (!store.currentUser) {
      // Stale token without user data — clean up and redirect to login
      localStorage.removeItem('admin_token')
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    // Role-based menu access check for admin routes
    if (to.meta?.menuKey) {
      if (!store.hasMenuAccess(to.meta.menuKey)) {
        next({ name: 'Dashboard' })
        return
      }
    }
    // Fine-grained permission check (optional per-route)
    if (to.meta?.permission) {
      if (!store.hasPermission(to.meta.permission)) {
        next({ name: 'Dashboard' })
        return
      }
    }
  }

  // Portal auth guard
  if (to.matched.some(r => r.meta?.requiresPortalAuth)) {
    const token = localStorage.getItem('portal_token')
    if (!token) {
      next({ name: 'PortalLogin', query: { redirect: to.fullPath } })
      return
    }
  }

  // Redirect to portal home if already logged in and visiting login page
  if (to.name === 'PortalLogin' && localStorage.getItem('portal_token')) {
    next({ path: '/portal' })
    return
  }

  // Redirect to admin if already logged in and visiting login page
  if (to.name === 'Login' && localStorage.getItem('admin_token')) {
    const store = useAppStore()
    if (store.isAuthenticated) {
      next({ path: '/admin' })
      return
    }
  }

  next()
})

export default router
