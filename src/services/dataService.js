/**
 * DSE 学情问诊系统 — 中央数据服务（localStorage 模拟后端）
 * 所有模块的增删改查均通过此服务，数据持久化到 localStorage
 */
const STORAGE_PREFIX = 'dse_'

// ==================== 工具函数 ====================
function nextId(collection) {
  const items = load(collection)
  if (items.length === 0) return 1
  return Math.max(...items.map(i => i.id || 1)) + 1
}

function load(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(key, data) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
}

function initIfEmpty(key, defaultData) {
  const existing = load(key)
  if (existing.length === 0) {
    save(key, defaultData)
    return defaultData
  }
  return existing
}

// ==================== DSE 课程定义 ====================
export const DSE_COURSES = [
  // 核心科目
  { id: 'eng', name: '英国语文', category: 'core', parentId: null },
  { id: 'eng_reading', name: 'English Reading', category: 'core', parentId: 'eng' },
  { id: 'eng_writing', name: 'English Writing', category: 'core', parentId: 'eng' },
  { id: 'eng_listening', name: 'English Listening', category: 'core', parentId: 'eng' },
  { id: 'eng_speaking', name: 'English Speaking', category: 'core', parentId: 'eng' },
  { id: 'chi', name: '中国语文', category: 'core', parentId: null },
  { id: 'math', name: '数学', category: 'core', parentId: null },
  { id: 'csd', name: '公民与社会发展', category: 'core', parentId: null },
  // 选修科目
  { id: 'phy', name: '物理', category: 'elective', parentId: null },
  { id: 'chem', name: '化学', category: 'elective', parentId: null },
  { id: 'bio', name: '生物', category: 'elective', parentId: null },
  { id: 'econ', name: '经济', category: 'elective', parentId: null },
  { id: 'hist', name: '历史', category: 'elective', parentId: null },
  { id: 'geo', name: '地理', category: 'elective', parentId: null },
  { id: 'chist', name: '中国历史', category: 'elective', parentId: null },
  { id: 'ict', name: '资讯及通讯科技', category: 'elective', parentId: null },
  { id: 'bafs', name: '企业、会计与财务概论', category: 'elective', parentId: null },
  { id: 'va', name: '视觉艺术', category: 'elective', parentId: null },
  { id: 'pe', name: '体育', category: 'elective', parentId: null },
  { id: 'music', name: '音乐', category: 'elective', parentId: null },
  { id: 'math_m1', name: '数学延伸M1', category: 'elective', parentId: null },
  { id: 'math_m2', name: '数学延伸M2', category: 'elective', parentId: null }
]

// ==================== RBAC 权限与菜单定义 ====================
export const PERMISSIONS = [
  { key: 'dashboard.view', label: '查看数据看板', category: 'dashboard', categoryLabel: '数据看板' },
  { key: 'dashboard.export', label: '导出看板数据', category: 'dashboard', categoryLabel: '数据看板' },

  { key: 'teaching.view', label: '查看教学管理', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.behavior.view', label: '查看课堂表现', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.behavior.create', label: '记录课堂表现', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.behavior.delete', label: '删除课堂记录', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.discipline.view', label: '查看纪律台账', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.discipline.create', label: '新增纪律记录', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.discipline.delete', label: '删除纪律记录', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.phone.view', label: '查看手机管理', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.phone.manage', label: '管理手机收发', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.attendance.view', label: '查看考勤请假', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.attendance.create', label: '记录考勤', category: 'teaching', categoryLabel: '教学管理' },
  { key: 'teaching.attendance.delete', label: '删除考勤记录', category: 'teaching', categoryLabel: '教学管理' },

  { key: 'student.view', label: '查看学生管理', category: 'student', categoryLabel: '学生管理' },
  { key: 'student.create', label: '新增学生', category: 'student', categoryLabel: '学生管理' },
  { key: 'student.edit', label: '编辑学生信息', category: 'student', categoryLabel: '学生管理' },
  { key: 'student.delete', label: '删除学生', category: 'student', categoryLabel: '学生管理' },
  { key: 'student.reports.view', label: '查看成长日报', category: 'student', categoryLabel: '学生管理' },
  { key: 'student.reports.edit', label: '编辑成长日报', category: 'student', categoryLabel: '学生管理' },
  { key: 'student.counseling.view', label: '查看心理辅导', category: 'student', categoryLabel: '学生管理' },
  { key: 'student.counseling.create', label: '新增辅导记录', category: 'student', categoryLabel: '学生管理' },
  { key: 'student.counseling.delete', label: '删除辅导记录', category: 'student', categoryLabel: '学生管理' },

  { key: 'timetable.view', label: '查看课表', category: 'timetable', categoryLabel: '课程与课表' },
  { key: 'timetable.edit', label: '编辑课表', category: 'timetable', categoryLabel: '课程与课表' },
  { key: 'timetable.courses.view', label: '查看课程维护', category: 'timetable', categoryLabel: '课程与课表' },
  { key: 'timetable.courses.edit', label: '编辑课程', category: 'timetable', categoryLabel: '课程与课表' },

  { key: 'homework.view', label: '查看作业管理', category: 'homework', categoryLabel: '作业系统' },
  { key: 'homework.assign', label: '布置/编辑作业', category: 'homework', categoryLabel: '作业系统' },
  { key: 'homework.delete', label: '删除作业', category: 'homework', categoryLabel: '作业系统' },

  { key: 'conference.view', label: '查看家长会', category: 'conference', categoryLabel: '家长会' },
  { key: 'conference.parent.view', label: '查看家长会预约', category: 'conference', categoryLabel: '家长会' },
  { key: 'conference.parent.manage', label: '管理家长会预约', category: 'conference', categoryLabel: '家长会' },
  { key: 'conference.edit', label: '编辑家长会文稿', category: 'conference', categoryLabel: '家长会' },

  { key: 'exam.view', label: '查看试卷错题', category: 'exam', categoryLabel: '试卷与题库' },
  { key: 'exam.create', label: '录入试卷', category: 'exam', categoryLabel: '试卷与题库' },
  { key: 'exam.delete', label: '删除试卷', category: 'exam', categoryLabel: '试卷与题库' },
  { key: 'exam.qbank.view', label: '查看题库', category: 'exam', categoryLabel: '试卷与题库' },
  { key: 'exam.qbank.create', label: '新增试题', category: 'exam', categoryLabel: '试卷与题库' },
  { key: 'exam.qbank.delete', label: '删除试题', category: 'exam', categoryLabel: '试卷与题库' },
  { key: 'exam.tips.view', label: '查看做题技巧', category: 'exam', categoryLabel: '试卷与题库' },
  { key: 'exam.tips.manage', label: '管理做题技巧', category: 'exam', categoryLabel: '试卷与题库' },
  { key: 'exam.seat.view', label: '查看考试座位安排', category: 'exam', categoryLabel: '考试与题库' },
  { key: 'exam.seat.manage', label: '管理考试座位安排', category: 'exam', categoryLabel: '考试与题库' },

  { key: 'ai.view', label: '查看AI系统', category: 'ai', categoryLabel: 'AI智能系统' },
  { key: 'ai.feedback.view', label: '查看课堂反馈', category: 'ai', categoryLabel: 'AI智能系统' },
  { key: 'ai.feedback.create', label: '新增课堂反馈', category: 'ai', categoryLabel: 'AI智能系统' },
  { key: 'ai.questions.view', label: '查看智能出题', category: 'ai', categoryLabel: 'AI智能系统' },
  { key: 'ai.questions.create', label: '使用智能出题', category: 'ai', categoryLabel: 'AI智能系统' },
  { key: 'ai.voice.view', label: '查看语音记录', category: 'ai', categoryLabel: 'AI智能系统' },
  { key: 'ai.voice.create', label: '新建语音记录', category: 'ai', categoryLabel: 'AI智能系统' },
  { key: 'ai.voice.delete', label: '删除语音记录', category: 'ai', categoryLabel: 'AI智能系统' },

  { key: 'settings.view', label: '查看系统设置', category: 'settings', categoryLabel: '系统设置' },
  { key: 'settings.edit', label: '修改系统设置', category: 'settings', categoryLabel: '系统设置' },
  { key: 'settings.config.view', label: '查看配置中心', category: 'settings', categoryLabel: '系统设置' },
  { key: 'settings.config.edit', label: '修改系统配置', category: 'settings', categoryLabel: '系统设置' },

  { key: 'users.view', label: '查看用户管理', category: 'users', categoryLabel: '用户管理' },
  { key: 'users.create', label: '新增用户', category: 'users', categoryLabel: '用户管理' },
  { key: 'users.edit', label: '编辑用户', category: 'users', categoryLabel: '用户管理' },
  { key: 'users.delete', label: '删除用户', category: 'users', categoryLabel: '用户管理' },

  { key: 'roles.view', label: '查看角色管理', category: 'roles', categoryLabel: '角色管理' },
  { key: 'roles.create', label: '新增角色', category: 'roles', categoryLabel: '角色管理' },
  { key: 'roles.edit', label: '编辑角色', category: 'roles', categoryLabel: '角色管理' },
  { key: 'roles.delete', label: '删除角色', category: 'roles', categoryLabel: '角色管理' },

  // AI数据收录中心
  { key: 'aiData.view', label: '查看AI数据收录', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.skills.view', label: '查看Skills技能', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.skills.create', label: '新增Skills技能', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.skills.edit', label: '编辑Skills技能', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.skills.delete', label: '删除Skills技能', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.skills.import', label: '导入Skills技能', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.skills.export', label: '导出Skills技能', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.excel.view', label: '查看Excel公式', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.excel.create', label: '新增Excel公式', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.excel.edit', label: '编辑Excel公式', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.excel.delete', label: '删除Excel公式', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.excel.import', label: '导入Excel公式', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.excel.export', label: '导出Excel公式', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.tools.view', label: '查看软件工具', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.tools.create', label: '新增软件工具', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.tools.edit', label: '编辑软件工具', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.tools.delete', label: '删除软件工具', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.tools.import', label: '导入软件工具', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.tools.export', label: '导出软件工具', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.quotes.view', label: '查看名言语录', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.quotes.create', label: '新增名言语录', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.quotes.edit', label: '编辑名言语录', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.quotes.delete', label: '删除名言语录', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.quotes.import', label: '导入名言语录', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.quotes.export', label: '导出名言语录', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.prompts.view', label: '查看Prompt话术', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.prompts.create', label: '新增Prompt话术', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.prompts.edit', label: '编辑Prompt话术', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.prompts.delete', label: '删除Prompt话术', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.prompts.import', label: '导入Prompt话术', category: 'aiData', categoryLabel: 'AI数据收录' },
  { key: 'aiData.prompts.export', label: '导出Prompt话术', category: 'aiData', categoryLabel: 'AI数据收录' }
]

export const MENU_DEFINITIONS = [
  // 1. 常用功能 (High Frequency)
  { menuKey: 'dashboard', route: '/admin', icon: '📊', label: '数据看板', group: '常用功能', priority: 1, tags: ['daily'] },
  { menuKey: 'behavior', route: '/admin/behavior', icon: '👥', label: '课堂表现', group: '常用功能', priority: 2, tags: ['daily'] },
  { menuKey: 'attendance', route: '/admin/attendance', icon: '✓', label: '考勤请假', group: '常用功能', priority: 3, tags: ['daily'] },
  { menuKey: 'homework', route: '/admin/homework', icon: '📝', label: '作业管理', group: '常用功能', priority: 4, tags: ['daily'] },
  { menuKey: 'handover', route: '/admin/handover', icon: '🤝', label: '早晚班交接', group: '常用功能', priority: 6, tags: ['daily'] },
  // 2. 教学管理
  { menuKey: 'timetable', route: '/admin/timetable', icon: '📅', label: '课表管理', group: '教学管理', priority: 6 },
  { menuKey: 'discipline', route: '/admin/discipline', icon: '⚖️', label: '纪律台账', group: '教学管理', priority: 7 },
  { menuKey: 'phone', route: '/admin/phone', icon: '📱', label: '手机管理', group: '教学管理', priority: 8 },
  // 3. 学生管理
  { menuKey: 'students', route: '/admin/students', icon: '👨‍🎓', label: '学生信息', group: '学生管理', priority: 9 },
  { menuKey: 'reports', route: '/admin/reports', icon: '📋', label: '成长日报', group: '学生管理', priority: 10 },
  { menuKey: 'counseling', route: '/admin/counseling', icon: '💬', label: '心理辅导', group: '学生管理', priority: 11 },
  // 4. 考试与题库
  { menuKey: 'exam', route: '/admin/exam', icon: '📄', label: '试卷错题', group: '考试与题库', priority: 12 },
  { menuKey: 'question-bank', route: '/admin/question-bank', icon: '📚', label: '题库中心', group: '考试与题库', priority: 13 },
  { menuKey: 'exam-tips', route: '/admin/exam-tips', icon: '💡', label: '做题技巧', group: '考试与题库', priority: 14 },
  { menuKey: 'exam-seat', route: '/admin/exam-seat', icon: '🪑', label: '考试座位安排', group: '考试与题库', priority: 15 },
  // 5. 家校沟通
  { menuKey: 'parent-conference', route: '/admin/parent-conference', icon: '👨‍👩‍👧', label: '家长会预约', group: '家校沟通', priority: 15 },
  { menuKey: 'conference', route: '/admin/conference', icon: '📋', label: '家长会准备', group: '家校沟通', priority: 16 },
  // 6. AI智能系统
  { menuKey: 'course-feedback', route: '/admin/course-feedback', icon: '📝', label: '课堂反馈', group: 'AI智能系统', priority: 17 },
  { menuKey: 'questions', route: '/admin/questions', icon: '🎯', label: '智能出题', group: 'AI智能系统', priority: 18 },
  { menuKey: 'voice', route: '/admin/voice', icon: '🎙️', label: '语音记录', group: 'AI智能系统', priority: 19 },
  // 7. 课程维护
  { menuKey: 'courses', route: '/admin/courses', icon: '📖', label: '课程维护', group: '课程维护', priority: 20 },
  // 8. 系统设置
  { menuKey: 'settings', route: '/admin/settings', icon: '⚙️', label: '系统设置', group: '系统设置', priority: 21 },
  { menuKey: 'config', route: '/admin/config', icon: '🔧', label: '配置中心', group: '系统设置', priority: 22 },
  { menuKey: 'users', route: '/admin/users', icon: '👤', label: '用户管理', group: '系统设置', priority: 23 },
  { menuKey: 'roles', route: '/admin/roles', icon: '🛡️', label: '角色管理', group: '系统设置', priority: 24 },
  // 9. AI数据收录中心
  { menuKey: 'ai-skills', route: '/admin/ai-skills', icon: '🛠️', label: 'Skills技能收录', group: 'AI数据收录', priority: 25 },
  { menuKey: 'ai-excel', route: '/admin/ai-excel', icon: '📊', label: 'Excel公式收录', group: 'AI数据收录', priority: 26 },
  { menuKey: 'ai-tools', route: '/admin/ai-tools', icon: '💻', label: '软件工具收录', group: 'AI数据收录', priority: 27 },
  { menuKey: 'ai-quotes', route: '/admin/ai-quotes', icon: '💬', label: '名言语录收录', group: 'AI数据收录', priority: 28 },
  { menuKey: 'ai-prompts', route: '/admin/ai-prompts', icon: '📝', label: 'Prompt收录', group: 'AI数据收录', priority: 29 }
]

// Menu group display order
export const MENU_GROUP_ORDER = ['常用功能', '教学管理', '学生管理', '考试与题库', '家校沟通', 'AI智能系统', 'AI数据收录', '课程维护', '系统设置']

export const DATA_SCOPES = [
  { value: 'all', label: '全部数据', desc: '可查看所有校区、所有班级的数据', icon: '🌐' },
  { value: 'campus', label: '校区范围', desc: '仅可查看所属校区的数据', icon: '🏫' },
  { value: 'class', label: '班级范围', desc: '仅可查看所管理班级的数据', icon: '👥' },
  { value: 'self', label: '仅自己', desc: '仅可查看自己创建或负责的数据', icon: '🔒' }
]

// ==================== RBAC 默认数据 ====================
const defaultRoles = [
  {
    id: 1, name: '超级管理员', description: '拥有系统全部权限，可管理所有数据和配置',
    permissions: ['*'], menuIds: [], dataScope: 'all', isSystem: true,
    createdAt: '2025-09-01'
  },
  {
    id: 2, name: '班主任/教师', description: '日常教学管理权限，可管理班级学生、作业、考勤等',
    permissions: [
      'dashboard.view',
      'teaching.view', 'teaching.behavior.view', 'teaching.behavior.create',
      'teaching.discipline.view', 'teaching.discipline.create',
      'teaching.phone.view', 'teaching.phone.manage',
      'teaching.attendance.view', 'teaching.attendance.create',
      'student.view', 'student.reports.view', 'student.reports.edit',
      'student.counseling.view', 'student.counseling.create',
      'timetable.view', 'timetable.courses.view',
      'homework.view', 'homework.assign',
      'conference.view', 'conference.parent.view', 'conference.edit',
      'exam.view', 'exam.qbank.view', 'exam.tips.view', 'exam.seat.view',
      'ai.view', 'ai.feedback.view', 'ai.feedback.create',
      'ai.questions.view', 'ai.questions.create',
      'ai.voice.view', 'ai.voice.create',
      'settings.view'
    ],
    menuIds: ['dashboard', 'behavior', 'homework', 'handover', 'discipline', 'phone', 'attendance', 'students', 'reports', 'counseling', 'timetable', 'courses', 'parent-conference', 'conference', 'exam', 'question-bank', 'exam-tips', 'exam-seat', 'course-feedback', 'questions', 'voice', 'ai-skills', 'ai-excel', 'ai-tools', 'ai-quotes', 'ai-prompts', 'settings'],
    dataScope: 'class', isSystem: true,
    createdAt: '2025-09-01'
  },
  {
    id: 3, name: '教务主任', description: '教学管理 + 学生管理 + 试卷题库 + 家长会，不可修改系统设置',
    permissions: [
      'dashboard.view', 'dashboard.export',
      'teaching.view', 'teaching.behavior.view', 'teaching.behavior.create', 'teaching.behavior.delete',
      'teaching.discipline.view', 'teaching.discipline.create', 'teaching.discipline.delete',
      'teaching.phone.view', 'teaching.phone.manage',
      'teaching.attendance.view', 'teaching.attendance.create',
      'student.view', 'student.create', 'student.edit',
      'student.reports.view', 'student.reports.edit',
      'student.counseling.view', 'student.counseling.create', 'student.counseling.delete',
      'timetable.view', 'timetable.edit', 'timetable.courses.view', 'timetable.courses.edit',
      'homework.view', 'homework.assign', 'homework.delete',
      'conference.view', 'conference.parent.view', 'conference.parent.manage', 'conference.edit',
      'exam.view', 'exam.create', 'exam.qbank.view', 'exam.qbank.create',
      'exam.tips.view', 'exam.tips.manage', 'exam.seat.view', 'exam.seat.manage',
      'ai.view', 'ai.feedback.view', 'ai.questions.view', 'ai.voice.view',
      'settings.view', 'settings.config.view'
    ],
    menuIds: ['dashboard', 'behavior', 'homework', 'handover', 'discipline', 'phone', 'attendance', 'students', 'reports', 'counseling', 'timetable', 'courses', 'parent-conference', 'conference', 'exam', 'question-bank', 'exam-tips', 'exam-seat', 'course-feedback', 'questions', 'voice', 'ai-skills', 'ai-excel', 'ai-tools', 'ai-quotes', 'ai-prompts', 'settings', 'config'],
    dataScope: 'campus', isSystem: true,
    createdAt: '2025-09-01'
  }
]

const defaultUsers = [
  { id: 1, username: 'admin', password: 'admin123', displayName: '系统管理员', roleId: 1, campus: '', class: '', active: true, createdAt: '2025-09-01' },
  { id: 2, username: 'teacher', password: 'teacher123', displayName: '张老师', roleId: 2, campus: '九龙塘总校', class: '5D', active: true, createdAt: '2025-09-01' },
  { id: 3, username: 'dean', password: 'dean123', displayName: '李主任', roleId: 3, campus: '九龙塘总校', class: '', active: true, createdAt: '2025-09-01' }
]

// ==================== 默认数据 ====================
const defaultStudents = [
  { id: 1, name: '陈小明', campus: '九龙塘总校', class: '5D', gender: '男', boarding: true, targetUniversity: '香港大学', school: '威学一百', identity: 'DSE考生', cc: '张老师', sa: '李老师', studyAbroadPlanning: true, elective1: '物理', elective2: '化学', elective3: '经济', createdAt: '2025-09-01' },
  { id: 2, name: '李美玲', campus: '九龙塘总校', class: '5D', gender: '女', boarding: false, targetUniversity: '香港中文大学', school: '威学一百', identity: 'DSE考生', cc: '张老师', sa: '李老师', studyAbroadPlanning: false, elective1: '生物', elective2: '化学', elective3: '中国历史', createdAt: '2025-09-01' },
  { id: 3, name: '张伟豪', campus: '旺角分校', class: '5C', gender: '男', boarding: true, targetUniversity: '香港科技大学', school: '威学一百', identity: 'DSE考生', cc: '李老师', sa: '王老师', studyAbroadPlanning: true, elective1: '物理', elective2: '资讯及通讯科技', elective3: '经济', createdAt: '2025-09-01' },
  { id: 4, name: '黄小燕', campus: '九龙塘总校', class: '5D', gender: '女', boarding: false, targetUniversity: '香港城市大学', school: '威学一百', identity: 'DSE考生', cc: '张老师', sa: '李老师', studyAbroadPlanning: false, elective1: '视觉艺术', elective2: '历史', elective3: '中国历史', createdAt: '2025-09-01' },
  { id: 5, name: '林志远', campus: '铜锣湾分校', class: '5C', gender: '男', boarding: true, targetUniversity: '香港理工大学', school: '威学一百', identity: 'DSE考生', cc: '李老师', sa: '王老师', studyAbroadPlanning: true, elective1: '物理', elective2: '化学', elective3: '生物', createdAt: '2025-09-01' },
  { id: 6, name: '王芳芳', campus: '旺角分校', class: '5C', gender: '女', boarding: false, targetUniversity: '香港大学', school: '威学一百', identity: 'DSE考生', cc: '李老师', sa: '王老师', studyAbroadPlanning: false, elective1: '经济', elective2: '企业、会计与财务概论', elective3: '数学', createdAt: '2025-09-01' },
  { id: 7, name: '刘德华', campus: '九龙塘总校', class: '5D', gender: '男', boarding: true, targetUniversity: '香港中文大学', school: '威学一百', identity: 'DSE考生', cc: '张老师', sa: '李老师', studyAbroadPlanning: true, elective1: '资讯及通讯科技', elective2: '物理', elective3: '数学', createdAt: '2025-09-01' },
  { id: 8, name: '周小敏', campus: '铜锣湾分校', class: '6A', gender: '女', boarding: false, targetUniversity: '香港大学', school: '威学一百', identity: 'DSE考生', cc: '王老师', sa: '赵老师', studyAbroadPlanning: false, elective1: '生物', elective2: '化学', elective3: '经济', createdAt: '2025-09-01' }
]

const defaultCampuses = [
  { id: 1, name: '九龙塘总校', address: '九龙九龙塘达之路88号', phone: '2388-1234' },
  { id: 2, name: '旺角分校', address: '九龙旺角弥敦道688号', phone: '2788-5678' },
  { id: 3, name: '铜锣湾分校', address: '香港铜锣湾高士威道120号', phone: '2888-9012' }
]

const defaultClassrooms = [
  { id: 1, name: '5D', grade: '中五', advisor: '张老师', students: 42, room: '501', location: '教学楼5层501室', campus: '九龙塘总校' },
  { id: 2, name: '5C', grade: '中五', advisor: '李老师', students: 40, room: '502', location: '教学楼5层502室', campus: '旺角分校' },
  { id: 3, name: '6A', grade: '中六', advisor: '王老师', students: 38, room: '601', location: '教学楼6层601室', campus: '铜锣湾分校' }
]

const defaultTimetable = [
  { id: 1, class: '5D', day: '2026-05-04', period: 1, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 2, class: '5D', day: '2026-05-04', period: 2, subject: '中国语文', teacher: '李老师', room: '501', location: '教学楼5层501室' },
  { id: 3, class: '5D', day: '2026-05-04', period: 3, subject: 'English Reading', teacher: '王老师', room: '502', location: '教学楼5层502室' },
  { id: 4, class: '5D', day: '2026-05-04', period: 4, subject: '物理', teacher: '陈老师', room: '301', location: '实验楼3层物理实验室' },
  { id: 5, class: '5D', day: '2026-05-04', period: 5, subject: '化学', teacher: '刘老师', room: '201', location: '实验楼2层化学实验室' },
  { id: 6, class: '5D', day: '2026-05-05', period: 1, subject: 'English Writing', teacher: '王老师', room: '502', location: '教学楼5层502室' },
  { id: 7, class: '5D', day: '2026-05-05', period: 2, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 8, class: '5D', day: '2026-05-05', period: 3, subject: '中国语文', teacher: '李老师', room: '501', location: '教学楼5层501室' },
  { id: 9, class: '5D', day: '2026-05-05', period: 4, subject: '历史', teacher: '吴老师', room: '503', location: '教学楼5层503室' },
  { id: 10, class: '5D', day: '2026-05-06', period: 1, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 11, class: '5D', day: '2026-05-06', period: 2, subject: 'English Listening', teacher: '王老师', room: '502', location: '教学楼5层502室' },
  { id: 12, class: '5D', day: '2026-05-06', period: 3, subject: '物理', teacher: '陈老师', room: '301', location: '实验楼3层物理实验室' },
  { id: 13, class: '5D', day: '2026-05-07', period: 1, subject: 'English Speaking', teacher: '王老师', room: '502', location: '教学楼5层502室' },
  { id: 14, class: '5D', day: '2026-05-07', period: 2, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 15, class: '5D', day: '2026-05-07', period: 3, subject: '化学', teacher: '刘老师', room: '201', location: '实验楼2层化学实验室' },
  { id: 16, class: '5D', day: '2026-05-08', period: 1, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 17, class: '5D', day: '2026-05-08', period: 2, subject: '中国语文', teacher: '李老师', room: '501', location: '教学楼5层501室' },
  { id: 18, class: '5D', day: '2026-05-08', period: 3, subject: 'English Reading', teacher: '王老师', room: '502', location: '教学楼5层502室' }
]

const defaultExams = [
  { id: 1, studentId: 1, studentName: '陈小明', subject: '数学', examType: '月考', total: 100, score: 88, date: '2026-05-07', mistakes: 3, teacherFeedback: '陈小明数学思维敏捷，二次函数部分表现优秀。但计算环节偶尔出现符号错误，建议养成验算习惯。综合应用能力有提升空间。', topics: ['二次函数', '对数函数'], scanTime: '2026-05-07 15:30' },
  { id: 2, studentId: 1, studentName: '陈小明', subject: '中国语文', examType: '期中', total: 100, score: 79, date: '2026-04-25', mistakes: 5, teacherFeedback: '陈小明同学中文基础较好，文言文阅读有一定功底。议论文写作观点明确但论证深度不足，需要多积累事例素材，提升论证逻辑。', topics: ['文言翻译', '议论文写作'], scanTime: '2026-04-25 10:15' },
  { id: 3, studentId: 2, studentName: '李美玲', subject: '数学', examType: '期中', total: 100, score: 65, date: '2026-04-25', mistakes: 8, teacherFeedback: '李美玲同学数学是当前最需要提升的科目。基础知识点基本掌握，但二次函数、三角函数等核心板块综合应用时思路不清晰，需加强从概念到综合的过渡训练。', topics: ['二次函数', '三角函数', '概率统计'], scanTime: '2026-04-25 14:20' },
  { id: 4, studentId: 1, studentName: '陈小明', subject: '英国语文', examType: '月考', total: 100, score: 72, date: '2026-05-07', mistakes: 4, teacherFeedback: '英文在稳步提升中，阅读速度有了明显提高。阅读理解推理判断需加强，写作内容丰富度可进一步拓展。整体学习态度积极。', topics: ['阅读理解', '写作'], englishScores: { reading: 78, writing: 68, listening: 74, speaking: 70 }, scanTime: '2026-05-07 16:00' },
  { id: 5, studentId: 1, studentName: '陈小明', subject: '物理', examType: '月考', total: 100, score: 81, date: '2026-05-07', mistakes: 3, teacherFeedback: '物理学科力学部分概念掌握较好，实验题表现优秀。但电学部分的基础概念需要重新梳理，计算题易在代入环节出错。', topics: ['力学', '电学'], scanTime: '2026-05-07 16:30' },
  { id: 6, studentId: 1, studentName: '陈小明', subject: '化学', examType: '月考', total: 100, score: 75, date: '2026-05-07', mistakes: 4, teacherFeedback: '化学基础中等，实验操作题表现较好。化学计量部分的计算需要更细心，有机化学推断题是当前弱项，建议从官能团性质入手梳理。', topics: ['化学计量', '有机化学'], scanTime: '2026-05-07 17:00' },
  { id: 7, studentId: 2, studentName: '李美玲', subject: '中国语文', examType: '期中', total: 100, score: 89, date: '2026-04-25', mistakes: 2, teacherFeedback: '中文是李美玲的强项，写作能力强，文章有思想深度。文言文整体较好，部分虚词理解仍需加强。实用文格式基本掌握但需注意细节规范。', topics: ['文言虚词', '实用文写作'], scanTime: '2026-04-25 10:30' },
  { id: 8, studentId: 2, studentName: '李美玲', subject: '物理', examType: '期中', total: 100, score: 70, date: '2026-04-25', mistakes: 5, teacherFeedback: '物理学科基础尚可但波动较大。学习态度好但有效练习量不足。波动和光学部分概念需要加强，建议每周至少完成3道计算题。', topics: ['力学', '波动'], scanTime: '2026-04-25 14:40' }
]

const defaultAttendance = [
  { id: 1, studentId: 1, studentName: '陈小明', class: '5D', date: '2026-05-07', status: '正常', arrivalTime: '07:50' },
  { id: 2, studentId: 2, studentName: '李美玲', class: '5D', date: '2026-05-07', status: '迟到', arrivalTime: '08:15', reason: '交通堵塞' },
  { id: 3, studentId: 3, studentName: '张伟豪', class: '5C', date: '2026-05-07', status: '正常', arrivalTime: '07:45' },
  { id: 4, studentId: 4, studentName: '黄小燕', class: '5D', date: '2026-05-07', status: '请假', reason: '身体不适' },
  { id: 5, studentId: 5, studentName: '林志远', class: '5C', date: '2026-05-07', status: '正常', arrivalTime: '07:55' }
]

const defaultHomework = [
  { id: 1, studentId: 1, studentName: '陈小明', class: '5D', subject: '数学', title: '二次函数综合练习', dueDate: '2026-05-08', status: '已提交', score: 'A', submitTime: '2026-05-07 20:30', content: '完成练习卷1-10题', description: '1. 完成练习卷第1-10题，包含二次函数顶点式、交点式、一般式的互化\n2. 重点复习配方法求顶点坐标\n3. 应用题第8题需要画图辅助分析', timeRange: '19:30-21:05', attachments: [], completedCount: 35, totalCount: 42 },
  { id: 2, studentId: 2, studentName: '李美玲', class: '5D', subject: '数学', title: '二次函数综合练习', dueDate: '2026-05-08', status: '未提交', score: null, submitTime: null, content: '完成练习卷1-10题', description: '1. 完成练习卷第1-10题，包含二次函数顶点式、交点式、一般式的互化\n2. 重点复习配方法求顶点坐标\n3. 应用题第8题需要画图辅助分析', timeRange: '19:30-21:05', attachments: [], completedCount: 35, totalCount: 42 },
  { id: 3, studentId: 3, studentName: '张伟豪', class: '5C', subject: '物理', title: '力学实验报告', dueDate: '2026-05-09', status: '已提交', score: 'A+', submitTime: '2026-05-07 19:00', content: '实验报告：斜面摩擦力测量', description: '完成斜面摩擦力测量实验报告，包含：\n- 实验目的与原理\n- 数据记录表格\n- 摩擦力-正压力关系图\n- 误差分析', timeRange: '', attachments: [], completedCount: 38, totalCount: 40 },
  { id: 4, studentId: 1, studentName: '陈小明', class: '5D', subject: '中国语文', title: '议论文写作', dueDate: '2026-05-10', status: '已提交', score: 'B+', submitTime: '2026-05-06 21:00', content: '以"科技与人文"为题写议论文800字', description: '以"科技发展与人情温度"为题，写一篇不少于600字的议论文。\n要求：\n1. 观点明确，论证充分\n2. 至少使用2个具体事例\n3. 结构清晰：引言-正面论述-反驳对立-总结', timeRange: '', attachments: [], completedCount: 30, totalCount: 42 }
]

const defaultBehaviors = [
  { id: 1, studentId: 1, studentName: '陈小明', class: '5D', subject: '数学', behavior: '积极发言', type: 'success', score: 'A', time: '2026-05-07 09:30', note: '主动上台展示二次函数解题思路' },
  { id: 2, studentId: 2, studentName: '李美玲', class: '5D', subject: '中文', behavior: '走神', type: 'warning', score: 'C', time: '2026-05-07 10:15', note: '下午第一节课注意力不够集中' },
  { id: 3, studentId: 3, studentName: '张伟豪', class: '5C', subject: '英文', behavior: '优秀答题', type: 'success', score: 'A+', time: '2026-05-07 11:00', note: '阅读理解答题思路清晰' },
  { id: 4, studentId: 4, studentName: '黄小燕', class: '5D', subject: '物理', behavior: '迟到', type: 'danger', score: 'D', time: '2026-05-07 08:05', note: '迟到5分钟' },
  { id: 5, studentId: 5, studentName: '林志远', class: '5C', subject: '化学', behavior: '实验认真', type: 'success', score: 'A', time: '2026-05-07 14:20', note: '实验操作规范，数据记录完整' }
]

const defaultDiscipline = [
  { id: 1, studentId: 4, studentName: '黄小燕', class: '5D', violation: '手机违规使用', level: '警告', date: '2026-05-06', handler: '张老师', description: '自习课使用手机看视频', status: '已处理', punishment: '口头警告，写检讨500字' },
  { id: 2, studentId: 2, studentName: '李美玲', class: '5D', violation: '作业抄袭', level: '注意', date: '2026-05-05', handler: '李老师', description: '数学作业与其他同学高度相似', status: '已处理', punishment: '批评教育，重做作业' }
]

// Phone base info — registered once per student (model, IMEI, device image)
const defaultPhoneRegistrations = [
  { id: 1, studentId: 1, studentName: '陈小明', class: '5D', phoneModel: 'iPhone 15', imei: 'IMEI-DEMO-001', deviceImage: null, registeredAt: '2026-05-07' },
  { id: 2, studentId: 2, studentName: '李美玲', class: '5D', phoneModel: 'Samsung S24', imei: 'IMEI-DEMO-002', deviceImage: null, registeredAt: '2026-05-07' },
  { id: 3, studentId: 4, studentName: '黄小燕', class: '5D', phoneModel: 'iPhone 14', imei: 'IMEI-DEMO-004', deviceImage: null, registeredAt: '2026-05-06' }
]

// Daily phone check-in/out records — reference phone registration
const defaultPhoneRecords = [
  { id: 1, registrationId: 1, studentId: 1, studentName: '陈小明', class: '5D', status: '已上交', submitTime: '2026-05-07 07:50', returnTime: '2026-05-07 16:30', date: '2026-05-07', notes: '' },
  { id: 2, registrationId: 2, studentId: 2, studentName: '李美玲', class: '5D', status: '已上交', submitTime: '2026-05-07 07:55', returnTime: null, date: '2026-05-07', notes: '' },
  { id: 3, registrationId: 3, studentId: 4, studentName: '黄小燕', class: '5D', status: '违纪扣留', submitTime: '2026-05-06 14:00', returnTime: null, date: '2026-05-06', notes: '上课期间使用手机' }
]

const defaultCounseling = [
  { id: 1, studentId: 4, studentName: '黄小燕', class: '5D', date: '2026-05-06', type: '心理辅导', counselor: '张老师', mood: '低落', topic: '家庭因素影响学习状态', content: '近阶段因家庭环境变化，情绪波动较大。已安排每周一次心理辅导，与家长沟通后共同关注学生心理状态。', followUp: '下周一跟进' },
  { id: 2, studentId: 2, studentName: '李美玲', class: '5D', date: '2026-05-05', type: '学业指导', counselor: '张老师', mood: '稳定', topic: '数学学科提升方案', content: '讨论了数学成绩下滑原因，制定了针对性的提升计划。学生表示愿意配合执行，需要有阶段性反馈。', followUp: '两周后检查进度' }
]

const defaultVoiceRecordings = [
  {
    id: 1, title: '陈小明家长面谈', scene: '家长面谈', duration: '15:32', speakers: '张老师、陈妈妈', date: '2026-05-07', audioUrl: null, transcript: [
      { speaker: '张老师', text: '小明妈妈您好，今天请您来是想沟通一下小明最近的学习状态。', time: '00:12' },
      { speaker: '陈妈妈', text: '张老师您好，我也注意到了，他最近回家后不太爱说话。', time: '00:25' },
      { speaker: '张老师', text: '是的，这次月考数学成绩从88分下滑到了72分，我分析主要是二次函数综合应用这块有漏洞。', time: '00:42' },
      { speaker: '陈妈妈', text: '他在家里也确实不怎么练数学题了，说太难了。', time: '00:58' },
      { speaker: '张老师', text: '我建议可以从这几方面入手：每天固定20分钟专项练习，另外他上课还是很积极的。', time: '01:20' },
      { speaker: '陈妈妈', text: '好的，谢谢张老师！我们家长一定配合。', time: '01:40' }
    ]
  },
  { id: 2, title: '5D班班会记录', scene: '班会记录', duration: '28:15', speakers: '张老师、全班', date: '2026-05-06', audioUrl: null, transcript: [] },
  { id: 3, title: '数学教研会议', scene: '教研会议', duration: '45:08', speakers: '5人', date: '2026-05-05', audioUrl: null, transcript: [] },
  { id: 4, title: '李美玲心理谈话', scene: '学生谈话', duration: '22:40', speakers: '张老师、李美玲', date: '2026-05-05', audioUrl: null, transcript: [] }
]

const defaultSchoolSettings = {
  schoolName: '威学一百',
  schoolFullName: '威学一百国际教育',
  schoolSubtitle: 'DSE 学习管理系统 · 个性化学习报告',
  schoolLogo: '',
  semesterStart: '2025-09-01',
  semesterEnd: '2026-07-15',
  homeroomTeacher: '张老师',
  reportFooter: '用心陪伴每一位学生的成长',
  watermarkEnabled: true,
  watermarkText: '内部资料·仅供家长会使用',
  watermarkRotation: -22,
  watermarkOpacity: 0.06,
  watermarkFontSize: 16,
  watermarkGapX: 120,
  watermarkGapY: 80,
  watermarkColor: 'rgba(0,0,0,0.06)',
  watermarkShowTimestamp: true,
  previewTheme: 'default',
  showTeacherSign: true,
  showParentSign: true,
  seatShowClass: true,
  seatShowElectives: true
}

const defaultQuickActions = [
  { id: 1, icon: '📝', label: '记录课堂', path: '/admin/behavior' },
  { id: 2, icon: '📋', label: '布置作业', path: '/admin/homework' },
  { id: 3, icon: '✓', label: '考勤打卡', path: '/admin/attendance' },
  { id: 4, icon: '📄', label: '扫描试卷', path: '/admin/exam' },
  { id: 5, icon: '🎯', label: '生成练习', path: '/admin/questions' },
  { id: 6, icon: '📊', label: '生成日报', path: '/admin/reports' },
  { id: 7, icon: '💬', label: '心理记录', path: '/admin/counseling' },
  { id: 8, icon: '🎙️', label: '语音记录', path: '/admin/voice' }
]

// icon池 用于自定义快捷操作
const iconPool = ['📝', '📋', '✓', '📄', '🎯', '📊', '💬', '🎙️', '📚', '🏠', '📅', '👥', '⚖️', '📱', '🔔', '⭐', '💡', '🔧', '📌', '🎓', '🏆', '📖', '✏️', '🔍', '💊', '🌐', '📈', '🗂️', '💻', '🎵']

// ==================== 新增默认数据 ====================
const defaultErrorBook = [
  { id: 1, question: '已知二次函数 f(x)=x²−4x+3，求顶点坐标和对称轴方程', subject: '数学', topic: '二次函数', errorType: 'calc', count: 3, lastDate: '2026-05-07', studentNames: '陈小明、张伟豪', studentIds: [1, 3], source: '2026年5月月考', sourceType: 'exam', correctAnswer: '顶点(2,−1)，对称轴x=2', analysis: '配方：f(x)=(x−2)²−1', inBank: false, assignedTo: '', assignedClass: '5D', createdAt: '2026-05-07' },
  { id: 2, question: '求不等式 |2x−3| > 5 的解集', subject: '数学', topic: '不等式', errorType: 'concept', count: 2, lastDate: '2026-05-06', studentNames: '李美玲', studentIds: [2], source: '课堂测验', sourceType: 'test', correctAnswer: 'x<−1或x>4', analysis: '|2x−3|>5 ⇒ 2x−3>5 或 2x−3<−5', inBank: true, assignedTo: '李美玲', assignedClass: '5D', createdAt: '2026-05-06' },
  { id: 3, question: '已知 sinθ=3/5，θ在第二象限，求 cosθ 和 tanθ', subject: '数学', topic: '三角函数', errorType: 'reading', count: 1, lastDate: '2026-05-05', studentNames: '陈小明', studentIds: [1], source: '5月7日作业', sourceType: 'homework', correctAnswer: 'cosθ=−4/5，tanθ=−3/4', analysis: '利用sin²θ+cos²θ=1，注意第二象限cos为负', inBank: false, assignedTo: '', assignedClass: '5D', createdAt: '2026-05-05' },
  { id: 4, question: '阅读下面的文言文，翻译画线句子', subject: '中国语文', topic: '文言翻译', errorType: 'comprehensive', count: 2, lastDate: '2026-05-04', studentNames: '李美玲、黄小燕', studentIds: [2, 4], source: '期中考试', sourceType: 'exam', correctAnswer: '你愚蠢到了极点，自己都快要死了，还要钱做什么呢？', analysis: '逐字翻译，注意"蔽"为"昏聩、糊涂"义', inBank: false, assignedTo: '', assignedClass: '5D', createdAt: '2026-05-04' },
  { id: 5, question: '求函数 y=log₂(x−1)+log₂(3−x) 的定义域', subject: '数学', topic: '对数函数', errorType: 'careless', count: 4, lastDate: '2026-05-07', studentNames: '陈小明、李美玲、王芳芳', studentIds: [1, 2, 6], source: '2026年5月月考', sourceType: 'exam', correctAnswer: '1<x<3', analysis: '对数的真数>0，即x−1>0且3−x>0，解得1<x<3', inBank: true, assignedTo: '', assignedClass: '5D', createdAt: '2026-05-07' }
]

const defaultQuestionBank = [
  // === 数学 ===
  { id: 1, subject: '数学', topic: '二次函数', type: 'mc', difficulty: 'easy', score: 4, suggestedTime: 3, text: '二次函数 f(x)=x²−4x+3 的顶点坐标是：', options: 'A. (2,−1)\nB. (2,1)\nC. (−2,−1)\nD. (−1,2)', answer: 'A', steps: 'f(x)=x²−4x+3=(x−2)²−1\n顶点坐标为(2,−1)', knowledgePoint: '二次函数顶点式 f(x)=a(x−h)²+k', commonMistakes: '配方后常数项计算错误，忘记除a', estimatedRate: 85, source: 'manual' },
  { id: 2, subject: '数学', topic: '三角函数', type: 'mc', difficulty: 'easy', score: 4, suggestedTime: 3, text: '已知 sinθ=3/5，θ在第一象限，则 cosθ =', options: 'A. 3/5\nB. 4/5\nC. −4/5\nD. 5/4', answer: 'B', steps: 'sin²θ+cos²θ=1\ncos²θ=1−9/25=16/25\nθ在第一象限，cosθ=4/5', knowledgePoint: '同角三角函数基本关系 sin²θ+cos²θ=1', commonMistakes: '忽略象限对符号的影响', estimatedRate: 90, source: 'manual' },
  { id: 3, subject: '数学', topic: '对数指数', type: 'calc', difficulty: 'easy', score: 6, suggestedTime: 5, text: '解方程：3ˣ⁺¹ = 81', answer: 'x=3', steps: '81=3⁴\n3ˣ⁺¹=3⁴\nx+1=4\nx=3', knowledgePoint: '指数方程求解，将两边化为同底指数', commonMistakes: '指数运算不熟练，无法将数字转换为指数形式', estimatedRate: 80, source: 'manual' },
  { id: 4, subject: '数学', topic: '二次函数', type: 'calc', difficulty: 'medium', score: 8, suggestedTime: 6, text: '已知二次函数 f(x) = 2x² − 8x + 5，求：（a）f(x) 的顶点坐标；（b）f(x) 的最小值；（c）方程 f(x) = 0 的解（精确到0.01）。', answer: '（a）顶点(2,−3) （b）最小值为−3 （c）x≈0.78 或 x≈3.22', steps: '配方：f(x)=2(x²−4x)+5=2(x−2)²−8+5=2(x−2)²−3\n顶点(2,−3)，最小值=−3\n2x²−8x+5=0，Δ=64−40=24，x=(8±√24)/4', knowledgePoint: '二次函数配方、顶点公式、求根公式综合应用', commonMistakes: '配方时系数2的处理容易出错，需要先提取公因子', estimatedRate: 72, source: 'manual' },
  { id: 5, subject: '数学', topic: '二次函数', type: 'calc', difficulty: 'medium', score: 8, suggestedTime: 7, text: '抛物线 y = x² + bx + c 与 x 轴交于 A(−1,0) 和 B(3,0)，求 b 和 c 的值，并写出顶点坐标。', answer: 'b=−2, c=−3，顶点(1,−4)', steps: '交点式：y=(x+1)(x−3)=x²−2x−3\n比较得 b=−2, c=−3\n顶点：x=−b/2a=1, y=f(1)=1−2−3=−4', knowledgePoint: '二次函数交点式与一般式的转换', commonMistakes: '交点式展开时符号处理不仔细', estimatedRate: 65, source: 'manual' },
  { id: 6, subject: '数学', topic: '三角函数', type: 'calc', difficulty: 'medium', score: 8, suggestedTime: 8, text: '在ΔABC中，已知 a=8, b=6, ∠C=60°，求 c 边的长度和ΔABC的面积。', answer: 'c=√52≈7.21，面积=12√3≈20.78', steps: '余弦定理：c²=a²+b²−2ab·cosC=64+36−2·8·6·1/2=52\nc=√52=2√13≈7.21\n面积=1/2·ab·sinC=1/2·8·6·√3/2=12√3', knowledgePoint: '余弦定理、三角形面积公式', commonMistakes: 'cos60° 和 sin60° 的值混淆', estimatedRate: 68, source: 'manual' },
  { id: 7, subject: '数学', topic: '不等式', type: 'calc', difficulty: 'medium', score: 6, suggestedTime: 5, text: '解不等式 |2x−3| > 5，并将解集在数轴上表示。', answer: 'x < −1 或 x > 4', steps: '|2x−3|>5 等价于 2x−3>5 或 2x−3<−5\n2x>8 → x>4\n2x<−2 → x<−1\n解集：x∈(−∞,−1)∪(4,+∞)', knowledgePoint: '绝对值不等式的等价转化', commonMistakes: '忘记分两种情况讨论，或不等号方向搞反', estimatedRate: 70, source: 'manual' },
  { id: 8, subject: '数学', topic: '二次函数', type: 'app', difficulty: 'hard', score: 10, suggestedTime: 10, text: '某商场将每件成本为20元的商品按每件35元出售，每天可卖出100件。若每降价1元，每天可多卖10件。设降价x元，求：（a）日利润L(x)的表达式；（b）日利润最大值及对应售价。', answer: '（a）L(x)=(15−x)(100+10x)=−10x²+50x+1500 （b）当x=2.5时最大利润=1562.5元，售价=32.5元', steps: '日利润=(售价−成本)×销量\n售价=35−x，成本=20，每件利润=15−x\n销量=100+10x\nL(x)=(15−x)(100+10x)=−10x²+50x+1500\nx=−b/2a=50/20=2.5\nL(2.5)=(15−2.5)(100+25)=12.5×125=1562.5', knowledgePoint: '二次函数建模及最值问题', commonMistakes: '建模时混淆价格、成本、利润的关系，忘记考虑定义域', estimatedRate: 45, source: 'manual' },
  // === 中国语文 ===
  { id: 9, subject: '中国语文', topic: '文言翻译', type: 'reading', difficulty: 'medium', score: 8, suggestedTime: 10, text: '阅读下面文言文，回答问题：\n\n永之氓咸善游。一日，水暴甚，有五六氓乘小船绝湘水。中济，船破，皆游。其一氓尽力而不能寻常。其侣曰："汝善游最也，今何后为？"曰："吾腰千钱，重，是以后。"曰："何不去之？"不应，摇其首。有顷，益怠。已济者立岸上呼且号曰："汝愚之甚，蔽之甚！身且死，何以货为？"又摇其首，遂溺死。\n\n（1）解释"咸"、"绝"、"寻常"的含义。（2）翻译画线句子"汝愚之甚，蔽之甚！身且死，何以货为？"', answer: '（1）咸：都；绝：横渡；寻常：古代长度单位，这里指"很短的距离"。（2）你愚蠢到了极点，糊涂到了极点！自己都快要死了，还要钱做什么呢？', steps: '理解文言文中"咸"为副词"都"\n"绝"作"横渡"讲\n"寻常"此处为量词引申\n画线句逐字翻译并调整语序', knowledgePoint: '文言实词释义、文言句子翻译', commonMistakes: '忽略上下文导致词义误判', estimatedRate: 65, source: 'manual' },
  { id: 10, subject: '中国语文', topic: '议论文写作', type: 'writing', difficulty: 'medium', score: 20, suggestedTime: 30, text: '以"科技发展与人情温度"为题，写一篇不少于600字的议论文。要求：观点明确，论证充分，结构清晰。', answer: '【评分标准】论点明确（5分）、论据充分（5分）、结构清晰（5分）、语言表达（5分）。言之成理即可。', steps: '确定立场（科技不必然降低人情温度）\n拟定分论点（科技拓展沟通、科技创造共情新方式）\n准备论据（社交媒体连接、AI辅助医疗关怀）\n安排结构（引言-正面论述-反驳对立-总结）', knowledgePoint: '议论文写作：立论、论证、结构', commonMistakes: '论证单一角度，缺乏正反对比', estimatedRate: 60, source: 'manual' },
  // === 物理 ===
  { id: 11, subject: '物理', topic: '力学', type: 'calc', difficulty: 'medium', score: 8, suggestedTime: 8, text: '一个质量为2kg的物体静止在光滑水平面上。受到一个水平方向的恒力F=10N作用，求：（a）物体的加速度；（b）4秒末物体的速度；（c）4秒内物体的位移。', answer: '（a）a=5 m/s² （b）v=20 m/s （c）s=40 m', steps: '牛顿第二定律：F=ma → a=F/m=10/2=5 m/s²\nv=v₀+at=0+5×4=20 m/s\ns=v₀t+½at²=0+½×5×16=40 m', knowledgePoint: '牛顿第二定律、匀变速直线运动公式', commonMistakes: '混淆速度公式和位移公式', estimatedRate: 75, source: 'manual' },
  // === 化学 ===
  { id: 12, subject: '化学', topic: '化学计量', type: 'calc', difficulty: 'medium', score: 6, suggestedTime: 6, text: '将5.3g Na₂CO₃ 溶于水配成250mL溶液，求该溶液的物质的量浓度。（Na₂CO₃ 摩尔质量 = 106 g/mol）', answer: '0.2 mol/L', steps: 'n(Na₂CO₃) = 5.3/106 = 0.05 mol\nc = n/V = 0.05/0.25 = 0.2 mol/L', knowledgePoint: '物质的量浓度计算 c=n/V', commonMistakes: '单位换算（mL转L）遗漏', estimatedRate: 78, source: 'manual' },
  // === 经济 ===
  { id: 13, subject: '经济', topic: '供需理论', type: 'analysis', difficulty: 'medium', score: 10, suggestedTime: 12, text: '分析香港实施"最低工资条例"对劳动市场的影响，结合供需理论说明可能产生的后果。', answer: '最低工资高于均衡工资时：（1）劳动供给增加（更多人愿意工作）；（2）劳动需求减少（企业减少雇工）；（3）产生过剩供给（失业）；（4）部分低技能工人获益（保留工作且工资提高）。', steps: '画出劳动市场供需图\n标明均衡工资和最低工资线\n分析最低工资>均衡工资的情况\n讨论供给量>需求量的结果\n辩证分析受益和受损群体', knowledgePoint: '价格下限（price floor）对市场的影响', commonMistakes: '只分析负面影响，忽略受益群体', estimatedRate: 55, source: 'manual' }
]

const defaultCourseFeedback = [
  { id: 1, class: '5D', date: '2026-05-07', subject: '数学', teacher: '张老师', period: '19:30-21:05', content: '段落拓展（1）+文化类题目练习', performanceNotes: '【准时度】优秀\n【专注度】大部分学生认真听讲\n【掌握情况】二次函数顶点式转换基本掌握\n【待加强】综合应用题拆解能力', topics: ['二次函数', '综合应用'], createdAt: '2026-05-07 21:30' }
]

const defaultHomeworkAssignments = [
  {
    id: 1, subject: '数学', teacher: '张老师', title: '二次函数综合练习', content: '完成练习卷1-10题',
    description: '1. 完成练习卷第1-10题，包含二次函数顶点式、交点式、一般式的互化\n2. 重点复习配方法求顶点坐标\n3. 应用题第8题需要画图辅助分析',
    dueDate: '2026-05-08', timeRange: '19:30-21:05', class: '5D', courseType: 'core',
    attachments: [], notes: '', targetScope: 'all', targetStudentIds: [1, 2, 4, 7], targetCount: 4,
    createdAt: '2026-05-07 09:00'
  },
  {
    id: 2, subject: '物理', teacher: '陈老师', title: '力学实验报告', content: '实验报告：斜面摩擦力测量',
    description: '完成斜面摩擦力测量实验报告，包含：\n- 实验目的与原理\n- 数据记录表格\n- 摩擦力-正压力关系图\n- 误差分析',
    dueDate: '2026-05-09', timeRange: '', class: '5D', courseType: 'elective',
    attachments: [], notes: '仅选修物理的学生需要完成', targetScope: 'all',
    targetStudentIds: [1, 2, 5, 7], targetCount: 4,
    createdAt: '2026-05-06 14:00'
  },
  {
    id: 3, subject: '中国语文', teacher: '李老师', title: '议论文写作', content: '以"科技与人文"为题写议论文800字',
    description: '以"科技发展与人情温度"为题，写一篇不少于600字的议论文。\n要求：\n1. 观点明确，论证充分\n2. 至少使用2个具体事例\n3. 结构清晰：引言-正面论述-反驳对立-总结',
    dueDate: '2026-05-10', timeRange: '', class: '5D', courseType: 'core',
    attachments: [], notes: '', targetScope: 'all', targetStudentIds: [1, 2, 4, 7], targetCount: 4,
    createdAt: '2026-05-05 11:00'
  }
]

const defaultParentConferences = [
  { id: 1, studentId: 1, studentName: '陈小明', class: '5D', time: '2026-05-10 14:00', parentCount: 2, saAttend: true, ccAttend: true, mode: 'offline', room: '教学楼302会议室', status: 'pending', notes: '关注数学成绩波动和选科规划', createdAt: '2026-05-05' },
  { id: 2, studentId: 4, studentName: '黄小燕', class: '5D', time: '2026-05-03 15:30', parentCount: 1, saAttend: false, ccAttend: true, mode: 'online', room: '', status: 'completed', notes: '已沟通家庭因素对学习状态的影响，家长表示配合关注', createdAt: '2026-04-28' }
]

const defaultWeeklySchedule = [
  { id: 1, class: '5D', weekday: 1, period: 1, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 2, class: '5D', weekday: 1, period: 2, subject: '中国语文', teacher: '李老师', room: '501', location: '教学楼5层501室' },
  { id: 3, class: '5D', weekday: 1, period: 3, subject: 'English Reading', teacher: '王老师', room: '502', location: '教学楼5层502室' },
  { id: 4, class: '5D', weekday: 1, period: 4, subject: '物理', teacher: '陈老师', room: '301', location: '实验楼3层物理实验室' },
  { id: 5, class: '5D', weekday: 1, period: 5, subject: '化学', teacher: '刘老师', room: '201', location: '实验楼2层化学实验室' },
  { id: 6, class: '5D', weekday: 2, period: 1, subject: 'English Writing', teacher: '王老师', room: '502', location: '教学楼5层502室' },
  { id: 7, class: '5D', weekday: 2, period: 2, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 8, class: '5D', weekday: 2, period: 3, subject: '中国语文', teacher: '李老师', room: '501', location: '教学楼5层501室' },
  { id: 9, class: '5D', weekday: 2, period: 4, subject: '历史', teacher: '吴老师', room: '503', location: '教学楼5层503室' },
  { id: 10, class: '5D', weekday: 3, period: 1, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 11, class: '5D', weekday: 3, period: 2, subject: 'English Listening', teacher: '王老师', room: '502', location: '教学楼5层502室' },
  { id: 12, class: '5D', weekday: 3, period: 3, subject: '物理', teacher: '陈老师', room: '301', location: '实验楼3层物理实验室' },
  { id: 13, class: '5D', weekday: 4, period: 1, subject: 'English Speaking', teacher: '王老师', room: '502', location: '教学楼5层502室' },
  { id: 14, class: '5D', weekday: 4, period: 2, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 15, class: '5D', weekday: 4, period: 3, subject: '化学', teacher: '刘老师', room: '201', location: '实验楼2层化学实验室' },
  { id: 16, class: '5D', weekday: 5, period: 1, subject: '数学', teacher: '张老师', room: '501', location: '教学楼5层501室' },
  { id: 17, class: '5D', weekday: 5, period: 2, subject: '中国语文', teacher: '李老师', room: '501', location: '教学楼5层501室' },
  { id: 18, class: '5D', weekday: 5, period: 3, subject: 'English Reading', teacher: '王老师', room: '502', location: '教学楼5层502室' }
]

const defaultExamPapers = []

const defaultExamTips = [
  { id: 1, subject: '数学', questionType: '选择题', studentProblem: '粗心大意，忽略题干中的限制条件', techniqueTitle: '选择题"圈字法"——锁定关键词', content: '## 做题步骤\n\n1. **读题时圈出所有限定词**：如"不正确的是"、"一定成立"、"恰有"、"至少"等\n2. **标注已知条件**：用下划线标出题目给出的数值条件\n3. **逐项验证**：每个选项都要带回题目条件逐一验证\n4. **排除法优先**：先排除明显不符合的选项，缩小范围\n\n## 常见陷阱\n\n- "不一定"≠"一定不"\n- 注意定义域、值域的限制\n- 图形题要关注隐藏条件（如三角形内角和180°）\n\n## 示例\n\n> 已知函数 f(x) 在 R 上单调递增，下列一定成立的是？\n\nA. f(0) > 0 → 不一定，单调性不说明符号\nB. f(2) > f(1) → 一定成立，单调递增定义\nC. f(x) > f(x+1) → 一定不成立，与单调递增矛盾\n\n**关键**：紧扣定义，不要凭感觉选。', status: 'approved', reviewComment: '', createdBy: '张老师', createdAt: '2026-05-01', reviewedBy: '张老师', reviewedAt: '2026-05-02', sortOrder: 1 },
  { id: 2, subject: '英国语文', questionType: 'Reading Comprehension', studentProblem: '文章字面意思能看懂，但话里有话、藏起来的意思反应不过来，容易凭自己感觉猜，不是严格按原文找依据', techniqueTitle: '推断题四步法——别脑补，找证据', content: '## 做题步骤\n\n1. **看清题目问什么**：圈出题干关键词，明确问的是原因、态度、还是隐含意义\n2. **回原文找句子**：划定答题区间，找出与题目直接相关的1-3句话\n3. **排除瞎猜、太夸张的选项**：凡是原文没提到、过度引申、绝对化表述的选项直接排除\n4. **选有原文依据的答案**：正确的推断一定有原文支撑，能在文中找到对应词句\n\n## 核心原则\n\n> **别自己脑补，一切都要在文章里找证据。**\n\n现在要练的就是：别自己脑补，一切都要在文章里找证据。\n\n## 常见错误类型\n\n| 错误类型 | 示例 | 应对 |\n|---|---|---|\n| 过度推断 | 原文说 "she glanced at the clock" → 选项说 "she was angry" | glance at clock ≠ angry，可能只是赶时间 |\n| 张冠李戴 | 把人物A的想法说成人物B的 | 逐一核对主语，确认是谁的观点 |\n| 绝对化 | 包含 "must""never""all""none" 等词 | 回原文验证是否真的这么绝对 |\n| 凭常识答题 | 用自己的知识判断而不用原文 | 一切以原文为准，忘掉自己的预设 |\n\n## 练习建议\n\n每次做完推断题，用笔在旁边写出每个选项在原文中的对应句子。没有对应句子的选项就是错误的。坚持练习，养成"找证据"的习惯。', status: 'approved', reviewComment: '', createdBy: '张老师', createdAt: '2026-05-02', reviewedBy: '张老师', reviewedAt: '2026-05-03', sortOrder: 2 },
  { id: 3, subject: '英国语文', questionType: 'Reading Comprehension', studentProblem: '能读懂单词但抓不住段落主旨，答题时容易跑偏', techniqueTitle: 'Reading Comprehension — Topic Sentence 定位法', content: '## Steps\n\n1. **Read the question first** — know what you\'re looking for before reading the passage\n2. **Find the topic sentence** — usually the first or last sentence of each paragraph\n3. **Underline keywords** — names, numbers, contrast words (but, however, although)\n4. **Match, don\'t guess** — the correct answer is always a paraphrase of something in the text\n\n## Key Signals\n\n- **Contrast words** (but, however, yet, although) → the writer\'s real opinion comes after these\n- **Examples** (for instance, such as) → used to support the main point, not the main point itself\n- **Repeated words** → the topic of the paragraph\n\n## Common Mistakes\n\n| Mistake | Fix |\n|---|---|\n| Choosing an answer because "it sounds right" | Check: is it a paraphrase of the text? |\n| Using outside knowledge | Only use information from the passage |\n| Ignoring qualifying words | "some", "often", "tend to" ≠ "all", "always", "must" |', status: 'approved', reviewComment: '', createdBy: '张老师', createdAt: '2026-05-03', reviewedBy: '张老师', reviewedAt: '2026-05-04', sortOrder: 3 },
  { id: 4, subject: '数学', questionType: '计算题', studentProblem: '计算过程正确但最终答案出错，或者步骤不完整丢分', techniqueTitle: '计算题"分步检查法"——确保每一步都对', content: '## 做题步骤\n\n1. **写出已知量和未知量**：用字母表示，明确要求什么\n2. **选择公式**：写出要用到的公式，确认每个符号的含义\n3. **代入数值**：注意单位换算，保留分数而非小数（避免舍入误差）\n4. **分步计算**：每一步都写出来，不要跳步\n5. **验证答案**：代入原方程检验，或估算数量级是否合理\n\n## 步骤分策略\n\nDSE 计算题按步骤给分！即使最终答案错了，清晰的中间步骤也能拿到大部分分数。\n\n- **必须写**：公式 → 代入 → 中间结果 → 最终答案\n- **单位**：每步都带上单位，最后注明答案单位\n\n## 检查清单\n\n- [ ] 正负号是否正确？\n- [ ] 小数点位置对吗？\n- [ ] 有没有漏掉负号/根号？\n- [ ] 答案的精度是否符合题目要求（有效数字）？', status: 'approved', reviewComment: '', createdBy: '张老师', createdAt: '2026-05-04', reviewedBy: '张老师', reviewedAt: '2026-05-04', sortOrder: 4 },
  { id: 5, subject: '物理', questionType: '应用题', studentProblem: '看不懂题目情境，不知道应该用哪个公式', techniqueTitle: '应用题"建模三步法"——把文字变成物理模型', content: '## 做题步骤\n\n1. **画示意图**：把题目描述的情境画出来，标出已知量（力、速度、距离等）\n2. **确定物理模型**：判断属于哪类问题——运动学？力学？能量？电路？\n3. **列出相关公式**：根据模型选择公式，逐一检查每个物理量的值\n\n## 常见模型速查\n\n| 题目关键词 | 对应模型 | 核心公式 |\n|---|---|---|\n| 匀速直线、速度不变 | 匀速运动 | s = vt |\n| 加速、减速、从静止开始 | 匀加速运动 | v=u+at, s=ut+½at² |\n| 碰撞、爆炸 | 动量守恒 | m₁v₁=m₂v₂ |\n| 高度变化、斜面 | 能量守恒 | mgh=½mv² |\n| 串联/并联 | 电路分析 | V=IR |\n\n## 关键\n\n**画图是第一位的。** 不画图就做题，等于蒙着眼睛走路。', status: 'approved', reviewComment: '', createdBy: '张老师', createdAt: '2026-05-05', reviewedBy: '张老师', reviewedAt: '2026-05-05', sortOrder: 5 },
  { id: 6, subject: '化学', questionType: '实验题', studentProblem: '实验步骤和现象记混，不知道每个步骤的目的', techniqueTitle: '实验题"目的导向法"——每一步都有它的理由', content: '## 做题步骤\n\n1. **明确实验目的**：这个实验要验证什么？制备什么？测定什么？\n2. **理解每一步的目的**：加热是为了什么？加试剂是为了什么？\n3. **记住关键现象**：颜色变化、沉淀生成、气体产生分别对应什么反应\n4. **注意安全细节**：加热方式、试剂顺序、尾气处理\n\n## 常见实验考点\n\n| 实验 | 关键现象 | 易错点 |\n|---|---|---|\n| 酸碱滴定 | 指示剂变色（酚酞：无色→粉红） | 终点≠中和点 |\n| 离子检验 | 沉淀颜色（Cl⁻→白色AgCl） | 注意排除干扰离子 |\n| 金属活性 | 与酸反应剧烈程度 | 控制变量（浓度、温度、表面积） |\n| 电解 | 阳极产生什么/阴极产生什么 | 注意电极材料是否参与反应 |\n\n## 答题技巧\n\n- 描述现象时按"**先 → 后 → 最终**"顺序\n- 写方程式时先配平，再检查状态符号（s/l/g/aq）', status: 'approved', reviewComment: '', createdBy: '张老师', createdAt: '2026-05-06', reviewedBy: '张老师', reviewedAt: '2026-05-06', sortOrder: 6 },
  { id: 7, subject: '中国语文', questionType: '写作题', studentProblem: '作文结构松散，想到哪写到哪，缺乏清晰的框架', techniqueTitle: '议论文"五段式"结构——让文章立起来', content: '## 结构框架\n\n### 第一段：引论（~100字）\n- **引**：引用题目材料或社会现象\n- **提**：提出中心论点（一句话，立场鲜明）\n\n### 第二段：分论点一（~200字）\n- **点**：分论点一句话\n- **释**：解释分论点的含义\n- **例**：举一个具体例子（古今中外，真实具体）\n- **结**：回扣分论点\n\n### 第三段：分论点二（~200字）\n- 结构同上，从不同角度论证（如：个人→社会、正面→反面）\n\n### 第四段：分论点三 / 让步段（~150字）\n- 承认对方观点有一定道理，但指出其局限\n- 或从更深层次展开第三个分论点\n\n### 第五段：结论（~100字）\n- **总结**：重申中心论点\n- **升华**：联系现实、展望未来、发出号召\n\n## 关键提醒\n\n- 每个分论点只论证一件事，不要杂糅\n- 例子要具体：说"某位名人"不如说"苏轼"\n- 过渡自然：用"不仅如此""反观""进一步说"等过渡词', status: 'approved', reviewComment: '', createdBy: '张老师', createdAt: '2026-05-06', reviewedBy: '张老师', reviewedAt: '2026-05-06', sortOrder: 7 },
  { id: 8, subject: '经济', questionType: '分析题', studentProblem: '概念定义背出来了，但不会结合题目情境分析', techniqueTitle: '分析题"概念+应用"双轨法', content: '## 做题步骤\n\n1. **识别核心概念**：题目考查的是哪几个经济学概念？（如需求弹性、边际效用、机会成本）\n2. **写出定义**：用准确的经济学术语定义每个概念\n3. **结合情境分析**：将概念与题目中的具体情境对接，用"因为……所以……"的句式\n4. **画图辅助**：能画图的题一定要画供需曲线图，标注变化方向\n\n## 答题模板\n\n> "根据______（概念），在题目描述的情况下，______发生了变化，导致______。从供需图可以看出，______曲线向______移动，均衡价格______，均衡数量______。"\n\n## 常见失分点\n\n- 只写定义不分析 → 拿一半分\n- 分析不结合题目 → 空洞无物\n- 画图不标注 → 图表分全丢\n- 混淆"需求量变化"与"需求变化" → 概念性错误', status: 'approved', reviewComment: '', createdBy: '张老师', createdAt: '2026-05-07', reviewedBy: '张老师', reviewedAt: '2026-05-07', sortOrder: 8 }
]

// ==================== 初始化 ====================
function initCourses() {
  const existing = load('courses')
  if (existing.length === 0) {
    const coursesWithIds = DSE_COURSES.map((c, i) => ({ ...c, id: i + 1, enabled: true }))
    save('courses', coursesWithIds)
    return coursesWithIds
  }
  return existing
}

export function initAllData() {
  initRoles()
  initUsers()
  initIfEmpty('students', defaultStudents)
  initIfEmpty('campuses', defaultCampuses)
  initIfEmpty('classrooms', defaultClassrooms)
  initIfEmpty('exams', defaultExams)
  initIfEmpty('attendance', defaultAttendance)
  initIfEmpty('homework', defaultHomework)
  initIfEmpty('behaviors', defaultBehaviors)
  initIfEmpty('discipline', defaultDiscipline)
  initIfEmpty('phoneRegistrations', defaultPhoneRegistrations)
  initIfEmpty('phoneRecords', defaultPhoneRecords)
  initIfEmpty('counseling', defaultCounseling)
  initIfEmpty('voiceRecordings', defaultVoiceRecordings)
  initIfEmpty('quickActions', defaultQuickActions)
  initIfEmpty('timetable', defaultTimetable)
  initIfEmpty('errorBook', defaultErrorBook)
  initIfEmpty('questionBank', defaultQuestionBank)
  initIfEmpty('courseFeedback', defaultCourseFeedback)
  initIfEmpty('homeworkAssignments', defaultHomeworkAssignments)
  initIfEmpty('parentConferences', defaultParentConferences)
  initIfEmpty('examPapers', defaultExamPapers)
  initIfEmpty('examTips', defaultExamTips)
  initIfEmpty('weeklySchedule', defaultWeeklySchedule)
  initIfEmpty('ai_skills', [])
  initIfEmpty('ai_excel_functions', [])
  initIfEmpty('ai_tools', [])
  initIfEmpty('ai_quotes', [])
  initIfEmpty('ai_prompts', [])
  initIfEmpty('ai_operation_logs', [])
  initCourses()
  if (!localStorage.getItem(STORAGE_PREFIX + 'schoolSettings')) {
    localStorage.setItem(STORAGE_PREFIX + 'schoolSettings', JSON.stringify(defaultSchoolSettings))
  }
  if (!localStorage.getItem(STORAGE_PREFIX + 'portalConfig')) {
    localStorage.setItem(STORAGE_PREFIX + 'portalConfig', JSON.stringify(defaultPortalConfig))
  }
}

// ==================== 门户配置 ====================
const defaultPortalConfig = {
  showScores: true,
  showRanking: true,
  showTeacherFeedback: true,
  showExamRecords: true,
  showAttendance: true,
  showBehavior: true,
  showHomework: true,
  showTimetable: true,
  showExamTips: true,
  handoverEnabled: true,
  examSeatEnabled: true,
  examVisibility: {
    monthly: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true },
    midterm: { s5: true, s6: true },
    final: { s5: true, s6: true },
    mock: true,
    dse: true,
    quiz: true
  }
}

function deepMergeExamVisibility(stored) {
  const def = defaultPortalConfig.examVisibility
  if (!stored) return JSON.parse(JSON.stringify(def))
  return {
    monthly: { ...def.monthly, ...(stored.monthly || {}) },
    midterm: { ...def.midterm, ...(stored.midterm || {}) },
    final: { ...def.final, ...(stored.final || {}) },
    mock: stored.mock !== undefined ? stored.mock : def.mock,
    dse: stored.dse !== undefined ? stored.dse : def.dse,
    quiz: stored.quiz !== undefined ? stored.quiz : def.quiz
  }
}

export const portalConfigService = {
  get() {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + 'portalConfig')
      if (raw) {
        const stored = JSON.parse(raw)
        return { ...defaultPortalConfig, ...stored, examVisibility: deepMergeExamVisibility(stored.examVisibility) }
      }
      return JSON.parse(JSON.stringify(defaultPortalConfig))
    } catch { return JSON.parse(JSON.stringify(defaultPortalConfig)) }
  },
  update(data) {
    const current = this.get()
    const merged = { ...current, ...data }
    if (data.examVisibility) {
      merged.examVisibility = deepMergeExamVisibility({ ...current.examVisibility, ...data.examVisibility })
    }
    localStorage.setItem(STORAGE_PREFIX + 'portalConfig', JSON.stringify(merged))
    return merged
  },
  reset() {
    localStorage.setItem(STORAGE_PREFIX + 'portalConfig', JSON.stringify(defaultPortalConfig))
    return JSON.parse(JSON.stringify(defaultPortalConfig))
  }
}

// ==================== 早晚班交接服务 ====================
const defaultShiftConfig = {
  monday: 'L',
  tuesday: 'L',
  wednesday: 'M',
  thursday: 'M',
  friday: 'L',
  saturday: '',
  sunday: ''
}

export const shiftConfigService = {
  get() {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + 'shiftConfig')
      return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(defaultShiftConfig))
    } catch { return JSON.parse(JSON.stringify(defaultShiftConfig)) }
  },
  save(config) {
    localStorage.setItem(STORAGE_PREFIX + 'shiftConfig', JSON.stringify(config))
  },
  reset() {
    localStorage.setItem(STORAGE_PREFIX + 'shiftConfig', JSON.stringify(defaultShiftConfig))
    return JSON.parse(JSON.stringify(defaultShiftConfig))
  }
}

// Handover records — format: { id, date, shift, homeworkItems[], meetingNotes, studentSituations[], generalNotes, createdBy, createdAt, updatedAt }
export const handoverService = {
  getAll() {
    return load('handover').sort((a, b) => b.date.localeCompare(a.date))
  },
  getByDateRange(start, end) {
    return this.getAll().filter(r => r.date >= start && r.date <= end)
  },
  getByDate(date) {
    return load('handover').filter(r => r.date === date)
  },
  getById(id) {
    return readEntity('handover', id)
  },
  create(data) {
    return createEntity('handover', { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  },
  update(id, data) {
    return updateEntity('handover', id, { ...data, updatedAt: new Date().toISOString() })
  },
  delete(id) {
    return deleteEntity('handover', id)
  },
  // Check if handover exists for a given date
  hasForDate(date) {
    return load('handover').some(r => r.date === date)
  }
}

// Initialize empty handover records if not exists
initIfEmpty('handover', [])

// ==================== 通用 CRUD ====================
function createEntity(collection, data) {
  const items = load(collection)
  const newItem = { ...data, id: nextId(collection) }
  items.push(newItem)
  save(collection, items)
  return newItem
}

function readEntities(collection) {
  return load(collection)
}

function readEntity(collection, id) {
  const items = load(collection)
  return items.find(i => i.id === id) || null
}

function updateEntity(collection, id, data) {
  const items = load(collection)
  const index = items.findIndex(i => i.id === id)
  if (index === -1) return null
  items[index] = { ...items[index], ...data, id }
  save(collection, items)
  return items[index]
}

function deleteEntity(collection, id) {
  const items = load(collection)
  const filtered = items.filter(i => i.id !== id)
  if (filtered.length === items.length) return false
  save(collection, filtered)
  return true
}

// ==================== 导出 API ====================
// -- Students --
export const studentService = {
  getAll: () => readEntities('students'),
  getById: (id) => readEntity('students', id),
  getByClass: (className) => readEntities('students').filter(s => s.class === className),
  create: (data) => createEntity('students', data),
  update: (id, data) => updateEntity('students', id, data),
  delete: (id) => deleteEntity('students', id),
  getClasses: () => [...new Set(readEntities('students').map(s => s.class))],
  getCampuses: () => [...new Set(readEntities('students').map(s => s.campus))]
}

// -- Classrooms --
export const classroomService = {
  getAll: () => readEntities('classrooms'),
  getByCampus: (campus) => readEntities('classrooms').filter(c => c.campus === campus),
  getStudentCount: (className) => readEntities('students').filter(s => s.class === className).length,
  create: (data) => createEntity('classrooms', data),
  update: (id, data) => updateEntity('classrooms', id, data),
  delete: (id) => {
    const cls = readEntity('classrooms', id)
    if (!cls) return false
    const studentsInClass = readEntities('students').filter(s => s.class === cls.name)
    if (studentsInClass.length > 0) {
      return { error: `班级「${cls.name}」中仍有 ${studentsInClass.length} 名学生，请先将学生转移后再删除班级` }
    }
    return deleteEntity('classrooms', id)
  }
}

// -- Exams --
export const examService = {
  getAll: () => readEntities('exams'),
  getByStudent: (studentId) => readEntities('exams').filter(e => e.studentId === studentId),
  getBySubject: (subject) => readEntities('exams').filter(e => e.subject === subject),
  create: (data) => createEntity('exams', data),
  update: (id, data) => updateEntity('exams', id, data),
  delete: (id) => deleteEntity('exams', id)
}

// -- Attendance --
export const attendanceService = {
  getAll: () => readEntities('attendance'),
  getByStudent: (studentId) => readEntities('attendance').filter(a => a.studentId === studentId),
  getByDate: (date) => readEntities('attendance').filter(a => a.date === date),
  create: (data) => createEntity('attendance', data),
  update: (id, data) => updateEntity('attendance', id, data),
  delete: (id) => deleteEntity('attendance', id)
}

// -- Homework --
export const homeworkService = {
  getAll: () => readEntities('homework'),
  getByStudent: (studentId) => readEntities('homework').filter(h => h.studentId === studentId),
  create: (data) => createEntity('homework', data),
  update: (id, data) => updateEntity('homework', id, data),
  delete: (id) => deleteEntity('homework', id)
}

// -- Homework Assignments (布置作业) --
export const homeworkAssignmentService = {
  getAll: () => readEntities('homeworkAssignments'),
  getByClass: (cls) => readEntities('homeworkAssignments').filter(a => a.class === cls),
  getBySubject: (subject) => readEntities('homeworkAssignments').filter(a => a.subject === subject),
  getByTeacher: (teacher) => readEntities('homeworkAssignments').filter(a => a.teacher === teacher),
  create: (data) => createEntity('homeworkAssignments', data),
  update: (id, data) => updateEntity('homeworkAssignments', id, data),
  delete: (id) => deleteEntity('homeworkAssignments', id),
  /**
   * Assign homework: auto-distribute to students based on course type
   * - Core courses (必修) → all students in the class
   * - Elective courses (选修) → only students who selected that subject
   */
  assign: (assignmentData) => {
    const students = readEntities('students').filter(s => s.class === assignmentData.class)
    let targetStudents = []

    const course = readEntities('courses').find(c => c.name === assignmentData.subject && !c.parentId)
    const isCore = course?.category === 'core'

    if (isCore || assignmentData.targetScope === 'all') {
      targetStudents = [...students]
    } else if (assignmentData.targetScope === 'selected') {
      targetStudents = students.filter(s => assignmentData.targetStudentIds.includes(s.id))
    } else {
      // Elective scope: only students who selected this subject
      targetStudents = students.filter(s => {
        const electives = [s.elective1, s.elective2, s.elective3].filter(Boolean)
        return electives.includes(assignmentData.subject)
      })
    }

    const assignment = createEntity('homeworkAssignments', {
      ...assignmentData,
      courseType: isCore ? 'core' : 'elective',
      targetStudentIds: targetStudents.map(s => s.id),
      targetStudentNames: targetStudents.map(s => s.name),
      targetCount: targetStudents.length,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    })

    // Auto-generate per-student homework tracking entries
    targetStudents.forEach(s => {
      createEntity('homework', {
        studentId: s.id,
        studentName: s.name,
        class: assignmentData.class,
        subject: assignmentData.subject,
        title: assignmentData.title,
        content: assignmentData.content,
        description: assignmentData.description || '',
        dueDate: assignmentData.dueDate,
        status: '未提交',
        score: null,
        submitTime: null,
        timeRange: assignmentData.timeRange || '',
        attachments: assignmentData.attachments || [],
        completedCount: 0,
        totalCount: targetStudents.length,
        assignmentId: assignment.id
      })
    })

    return { assignment, distributedTo: targetStudents.length }
  },
  /**
   * Build merged table rows for assignment display.
   * Groups students by subject, then merges same-content columns.
   */
  buildTableRows: (assignments) => {
    const rows = []
    // Sort assignments: by subject, then by createdAt desc
    const sorted = [...assignments].sort((a, b) => {
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject)
      return (b.createdAt || '').localeCompare(a.createdAt || '')
    })
    sorted.forEach((a, ai) => {
      const studentIds = a.targetStudentIds || []
      const studentNames = a.targetStudentNames || studentIds.map(id => {
        const s = readEntities('students').find(st => st.id === id)
        return s ? s.name : `学生#${id}`
      })
      studentNames.forEach((name, si) => {
        rows.push({
          ...a,
          _rowKey: `${a.id}_${si}`,
          _assignIdx: ai,
          _studentIdx: si,
          _studentName: name,
          _studentId: studentIds[si] || null,
          _isFirstInSubject: ai === 0 || a.subject !== sorted[ai - 1].subject,
          _isFirstInGroup: si === 0,
          _subjectGroupSize: sorted.filter(x => x.subject === a.subject).reduce((sum, x) => sum + (x.targetStudentNames || x.targetStudentIds || []).length, 0),
          _assignStudentCount: studentNames.length
        })
      })
    })
    return rows
  }
}

// -- Behaviors --
export const behaviorService = {
  getAll: () => readEntities('behaviors'),
  create: (data) => createEntity('behaviors', data),
  update: (id, data) => updateEntity('behaviors', id, data),
  delete: (id) => deleteEntity('behaviors', id)
}

// -- Discipline --
export const disciplineService = {
  getAll: () => readEntities('discipline'),
  create: (data) => createEntity('discipline', data),
  update: (id, data) => updateEntity('discipline', id, data),
  delete: (id) => deleteEntity('discipline', id)
}

// -- Phone Registrations (base info, once per student) --
export const phoneRegistrationService = {
  getAll: () => readEntities('phoneRegistrations'),
  getByStudent: (studentId) => readEntities('phoneRegistrations').find(r => r.studentId === studentId) || null,
  create: (data) => createEntity('phoneRegistrations', data),
  update: (id, data) => updateEntity('phoneRegistrations', id, data),
  delete: (id) => deleteEntity('phoneRegistrations', id)
}

// -- Phone Records (daily check-in/out) --
export const phoneRecordService = {
  getAll: () => readEntities('phoneRecords'),
  create: (data) => createEntity('phoneRecords', data),
  update: (id, data) => updateEntity('phoneRecords', id, data),
  delete: (id) => deleteEntity('phoneRecords', id)
}

// -- Counseling --
export const counselingService = {
  getAll: () => readEntities('counseling'),
  create: (data) => createEntity('counseling', data),
  update: (id, data) => updateEntity('counseling', id, data),
  delete: (id) => deleteEntity('counseling', id)
}

// -- Voice Recordings --
export const voiceService = {
  getAll: () => readEntities('voiceRecordings'),
  create: (data) => createEntity('voiceRecordings', data),
  update: (id, data) => updateEntity('voiceRecordings', id, data),
  delete: (id) => deleteEntity('voiceRecordings', id)
}

// -- Quick Actions --
export const quickActionService = {
  getAll: () => readEntities('quickActions'),
  create: (data) => createEntity('quickActions', data),
  update: (id, data) => updateEntity('quickActions', id, data),
  delete: (id) => deleteEntity('quickActions', id),
  getIconPool: () => iconPool
}

// -- Campuses --
export const campusService = {
  getAll: () => readEntities('campuses'),
  getById: (id) => readEntity('campuses', id),
  create: (data) => createEntity('campuses', data),
  update: (id, data) => updateEntity('campuses', id, data),
  delete: (id) => {
    const campus = readEntity('campuses', id)
    if (!campus) return false
    const studentsInCampus = readEntities('students').filter(s => s.campus === campus.name)
    const classesInCampus = readEntities('classrooms').filter(c => c.campus === campus.name)
    if (studentsInCampus.length > 0 || classesInCampus.length > 0) {
      const parts = []
      if (studentsInCampus.length > 0) parts.push(`${studentsInCampus.length} 名学生`)
      if (classesInCampus.length > 0) parts.push(`${classesInCampus.length} 个班级`)
      return { error: `校区「${campus.name}」中仍有 ${parts.join('、')}，请先清理后再删除校区` }
    }
    return deleteEntity('campuses', id)
  }
}

// -- DSE Courses --
export const courseService = {
  getAll: () => readEntities('courses'),
  getEnabled: () => readEntities('courses').filter(c => c.enabled),
  getByCategory: (cat) => readEntities('courses').filter(c => c.category === cat),
  getTopLevel: () => readEntities('courses').filter(c => c.enabled && !c.parentId),
  getChildren: (parentId) => readEntities('courses').filter(c => c.enabled && c.parentId === parentId),
  isParent: (id) => readEntities('courses').some(c => c.parentId === id),
  getCoreNames: () => readEntities('courses').filter(c => c.enabled && c.category === 'core' && !c.parentId).map(c => c.name),
  getElectiveNames: () => readEntities('courses').filter(c => c.enabled && c.category === 'elective' && !c.parentId).map(c => c.name),
  getAllNames: () => readEntities('courses').filter(c => c.enabled && !c.parentId).map(c => c.name),
  getAllNamesFlat: () => readEntities('courses').filter(c => c.enabled).map(c => c.name),
  create: (data) => createEntity('courses', data),
  update: (id, data) => updateEntity('courses', id, data),
  toggleEnabled: (id) => {
    const course = readEntity('courses', id)
    if (!course) return null
    return updateEntity('courses', id, { enabled: !course.enabled })
  },
  delete: (id) => deleteEntity('courses', id)
}

// -- Timetable --
export const timetableService = {
  getAll: () => readEntities('timetable'),
  getByClass: (className) => readEntities('timetable').filter(t => t.class === className),
  getByClassAndMonth: (className, yearMonth) => {
    return readEntities('timetable').filter(t => t.class === className && t.day.startsWith(yearMonth))
  },
  getByDay: (day) => readEntities('timetable').filter(t => t.day === day),
  getTeacherClassroomForSubject: (className, subject) => {
    const records = readEntities('timetable').filter(t => t.class === className && t.subject === subject)
    if (records.length > 0) {
      const last = records[records.length - 1]
      return { teacher: last.teacher, room: last.room, location: last.location }
    }
    return null
  },
  create: (data) => createEntity('timetable', data),
  update: (id, data) => updateEntity('timetable', id, data),
  delete: (id) => deleteEntity('timetable', id),
  getClasses: () => [...new Set(readEntities('timetable').map(t => t.class))],
  getSubjectsForClass: (className) => [...new Set(readEntities('timetable').filter(t => t.class === className).map(t => t.subject))]
}

// -- Weekly Schedule (课表模板) --
export const weeklyScheduleService = {
  getAll: () => readEntities('weeklySchedule'),
  getByClass: (className) => readEntities('weeklySchedule').filter(w => w.class === className),
  getByClassWeekday: (className, weekday) => readEntities('weeklySchedule').filter(w => w.class === className && w.weekday === weekday),
  getTeacherSummary: (className) => {
    const schedules = className ? readEntities('weeklySchedule').filter(w => w.class === className) : readEntities('weeklySchedule')
    const map = new Map()
    schedules.forEach(w => {
      if (!map.has(w.teacher)) map.set(w.teacher, { teacher: w.teacher, subjects: new Map(), total: 0 })
      const t = map.get(w.teacher)
      if (!t.subjects.has(w.subject)) t.subjects.set(w.subject, 0)
      t.subjects.set(w.subject, t.subjects.get(w.subject) + 1)
      t.total++
    })
    return [...map.values()].map(t => ({
      teacher: t.teacher,
      subjects: [...t.subjects.entries()].map(([s, c]) => `${s}×${c}`).join('、'),
      total: t.total
    })).sort((a, b) => b.total - a.total)
  },
  create: (data) => createEntity('weeklySchedule', data),
  update: (id, data) => updateEntity('weeklySchedule', id, data),
  delete: (id) => deleteEntity('weeklySchedule', id),
  // Auto-generate timetable entries from weekly schedule for a given month
  generateMonth: (className, yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const schedule = readEntities('weeklySchedule').filter(w => w.class === className)
    // Clear existing entries for this class+month
    let timetable = readEntities('timetable')
    timetable = timetable.filter(t => !(t.class === className && t.day.startsWith(yearMonth)))
    let idCounter = timetable.length > 0 ? Math.max(...timetable.map(t => t.id)) : 0
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d)
      const weekday = date.getDay() === 0 ? 7 : date.getDay() // Sun=7
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      schedule.filter(w => w.weekday === weekday).forEach(w => {
        idCounter++
        timetable.push({
          id: idCounter, class: w.class, day: dateStr, period: w.period,
          subject: w.subject, teacher: w.teacher, room: w.room, location: w.location
        })
      })
    }
    save('timetable', timetable)
    return timetable.filter(t => t.class === className && t.day.startsWith(yearMonth))
  }
}

// -- Error Book --
export const errorBookService = {
  getAll: () => readEntities('errorBook'),
  getByStudent: (studentId) => readEntities('errorBook').filter(e => e.studentIds && e.studentIds.includes(studentId)),
  getBySubject: (subject) => readEntities('errorBook').filter(e => e.subject === subject),
  create: (data) => createEntity('errorBook', data),
  update: (id, data) => updateEntity('errorBook', id, data),
  delete: (id) => deleteEntity('errorBook', id)
}

// -- Question Bank --
export const questionBankService = {
  getAll: () => readEntities('questionBank'),
  getBySubject: (subject) => readEntities('questionBank').filter(q => q.subject === subject),
  getBySubjectAndTopics: (subject, topics) => readEntities('questionBank').filter(q => q.subject === subject && (!topics || topics.length === 0 || topics.includes(q.topic))),
  getBySubjectAndDifficulty: (subject, difficulty) => readEntities('questionBank').filter(q => q.subject === subject && q.difficulty === difficulty),
  getTopicsBySubject: (subject) => [...new Set(readEntities('questionBank').filter(q => q.subject === subject).map(q => q.topic))],
  create: (data) => createEntity('questionBank', data),
  update: (id, data) => updateEntity('questionBank', id, data),
  delete: (id) => deleteEntity('questionBank', id)
}

// -- Course Feedback --
export const courseFeedbackService = {
  getAll: () => readEntities('courseFeedback'),
  getByClass: (cls) => readEntities('courseFeedback').filter(f => f.class === cls),
  getBySubject: (subject) => readEntities('courseFeedback').filter(f => f.subject === subject),
  getByDate: (date) => readEntities('courseFeedback').filter(f => f.date === date),
  create: (data) => createEntity('courseFeedback', data),
  update: (id, data) => updateEntity('courseFeedback', id, data),
  delete: (id) => deleteEntity('courseFeedback', id)
}

// -- Parent Conferences --
export const parentConferenceService = {
  getAll: () => readEntities('parentConferences'),
  getByStudent: (studentId) => readEntities('parentConferences').filter(c => c.studentId === studentId),
  getByStatus: (status) => readEntities('parentConferences').filter(c => c.status === status),
  create: (data) => createEntity('parentConferences', data),
  update: (id, data) => updateEntity('parentConferences', id, data),
  delete: (id) => deleteEntity('parentConferences', id)
}

// -- Exam Papers (试卷分析) --
export const examPaperService = {
  getAll: () => readEntities('examPapers'),
  getByExam: (examId) => readEntities('examPapers').filter(p => p.examId === examId),
  getByStudent: (studentId) => readEntities('examPapers').filter(p => p.studentId === studentId),
  create: (data) => createEntity('examPapers', data),
  update: (id, data) => updateEntity('examPapers', id, data),
  delete: (id) => deleteEntity('examPapers', id)
}

// -- Exam Tips (做题技巧) --
export const examTipService = {
  getAll: () => readEntities('examTips'),
  getBySubject: (subject) => readEntities('examTips').filter(t => t.subject === subject),
  getApproved: () => readEntities('examTips').filter(t => t.status === 'approved'),
  getApprovedBySubject: (subject) => readEntities('examTips').filter(t => t.status === 'approved' && t.subject === subject),
  create: (data) => createEntity('examTips', data),
  update: (id, data) => updateEntity('examTips', id, data),
  delete: (id) => deleteEntity('examTips', id),
  getAllSubjects: () => [...new Set(readEntities('examTips').map(t => t.subject).filter(Boolean))],
  getQuestionTypes: (subject) => {
    let items = readEntities('examTips')
    if (subject) items = items.filter(t => t.subject === subject)
    return [...new Set(items.map(t => t.questionType).filter(Boolean))]
  },
  getStudentProblems: (subject) => {
    let items = readEntities('examTips')
    if (subject) items = items.filter(t => t.subject === subject)
    return [...new Set(items.map(t => t.studentProblem).filter(Boolean))]
  }
}

// -- AI Skills (Skills技能收录) --
export const aiSkillsService = {
  getAll: () => readEntities('ai_skills'),
  getById: (id) => readEntity('ai_skills', id),
  create: (data) => createEntity('ai_skills', data),
  update: (id, data) => updateEntity('ai_skills', id, data),
  delete: (id) => deleteEntity('ai_skills', id),
  batchDelete: (ids) => ids.forEach(id => deleteEntity('ai_skills', id)),
  importBatch: (items) => items.forEach(item => createEntity('ai_skills', { ...item, createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) })),
  getCategories: () => aiCategoryService.getByModule('ai_skills'),
  getAllTags: () => [...new Set(readEntities('ai_skills').flatMap(s => s.tags || []))]
}

// -- AI Excel Functions (Excel公式收录) --
export const aiExcelFunctionsService = {
  getAll: () => readEntities('ai_excel_functions'),
  getById: (id) => readEntity('ai_excel_functions', id),
  create: (data) => createEntity('ai_excel_functions', data),
  update: (id, data) => updateEntity('ai_excel_functions', id, data),
  delete: (id) => deleteEntity('ai_excel_functions', id),
  batchDelete: (ids) => ids.forEach(id => deleteEntity('ai_excel_functions', id)),
  importBatch: (items) => items.forEach(item => createEntity('ai_excel_functions', { ...item, createdAt: new Date().toISOString().slice(0, 10) })),
  getCategories: () => aiCategoryService.getByModule('ai_excel_functions'),
  getAllTags: () => [...new Set(readEntities('ai_excel_functions').flatMap(s => s.tags || []))]
}

// -- AI Tools (软件工具收录) --
export const aiToolsService = {
  getAll: () => readEntities('ai_tools'),
  getById: (id) => readEntity('ai_tools', id),
  create: (data) => createEntity('ai_tools', data),
  update: (id, data) => updateEntity('ai_tools', id, data),
  delete: (id) => deleteEntity('ai_tools', id),
  batchDelete: (ids) => ids.forEach(id => deleteEntity('ai_tools', id)),
  importBatch: (items) => items.forEach(item => createEntity('ai_tools', { ...item, createdAt: new Date().toISOString().slice(0, 10) })),
  getCategories: () => aiCategoryService.getByModule('ai_tools'),
  getAllTags: () => [...new Set(readEntities('ai_tools').flatMap(s => s.tags || []))]
}

// -- AI Quotes (名言语录收录) --
export const aiQuotesService = {
  getAll: () => readEntities('ai_quotes'),
  getById: (id) => readEntity('ai_quotes', id),
  create: (data) => createEntity('ai_quotes', data),
  update: (id, data) => updateEntity('ai_quotes', id, data),
  delete: (id) => deleteEntity('ai_quotes', id),
  batchDelete: (ids) => ids.forEach(id => deleteEntity('ai_quotes', id)),
  importBatch: (items) => items.forEach(item => createEntity('ai_quotes', { ...item, createdAt: new Date().toISOString().slice(0, 10) })),
  getCategories: () => aiCategoryService.getByModule('ai_quotes'),
  getScenes: () => [...new Set(readEntities('ai_quotes').map(s => s.usageScene).filter(Boolean))]
}

// -- AI Prompts (Prompt话术收录) --
export const aiPromptsService = {
  getAll: () => readEntities('ai_prompts'),
  getById: (id) => readEntity('ai_prompts', id),
  create: (data) => createEntity('ai_prompts', data),
  update: (id, data) => updateEntity('ai_prompts', id, data),
  delete: (id) => deleteEntity('ai_prompts', id),
  batchDelete: (ids) => ids.forEach(id => deleteEntity('ai_prompts', id)),
  importBatch: (items) => items.forEach(item => createEntity('ai_prompts', { ...item, createdAt: new Date().toISOString().slice(0, 10) })),
  getCategories: () => aiCategoryService.getByModule('ai_prompts'),
  getAllTags: () => [...new Set(readEntities('ai_prompts').flatMap(s => s.tags || []))]
}

// -- AI Category Service (分类管理) --
// Stores per-module category lists that users can maintain
const defaultAiCategories = {
  ai_skills: ['AI编程', 'AI绘图', 'AI写作', 'AI视频', 'AI音频', 'AI办公', 'AI研究', '通用工具'],
  ai_excel_functions: ['查找引用', '文本处理', '日期时间', '数学统计', '逻辑判断', '数组公式', '财务函数'],
  ai_tools: ['AI编程', 'AI绘图', 'AI写作', 'AI视频', 'AI音频', 'AI办公', '浏览器扩展', '桌面应用'],
  ai_quotes: ['激励', '学习方法', '成长心态', '时间管理', '团队协作', '创新思维'],
  ai_prompts: ['代码', '写作', '翻译', '分析', '创意', '教学', '办公效率']
}

export const aiCategoryService = {
  _all: () => {
    const raw = localStorage.getItem(STORAGE_PREFIX + 'ai_categories')
    return raw ? JSON.parse(raw) : { ...defaultAiCategories }
  },
  _save: (data) => localStorage.setItem(STORAGE_PREFIX + 'ai_categories', JSON.stringify(data)),

  getByModule: (moduleKey) => {
    const all = aiCategoryService._all()
    return all[moduleKey] || []
  },

  add: (moduleKey, name) => {
    const all = aiCategoryService._all()
    if (!all[moduleKey]) all[moduleKey] = []
    if (!all[moduleKey].includes(name)) {
      all[moduleKey].push(name)
      aiCategoryService._save(all)
    }
  },

  remove: (moduleKey, name) => {
    const all = aiCategoryService._all()
    if (all[moduleKey]) {
      all[moduleKey] = all[moduleKey].filter(c => c !== name)
      aiCategoryService._save(all)
    }
  },

  update: (moduleKey, oldName, newName) => {
    const all = aiCategoryService._all()
    if (all[moduleKey]) {
      const idx = all[moduleKey].indexOf(oldName)
      if (idx >= 0) all[moduleKey][idx] = newName
      aiCategoryService._save(all)
    }
  },

  reorder: (moduleKey, categories) => {
    const all = aiCategoryService._all()
    all[moduleKey] = [...categories]
    aiCategoryService._save(all)
  }
}

// -- Operation Log (操作日志) --
export const operationLogService = {
  getAll: () => readEntities('ai_operation_logs'),
  getByModule: (moduleKey) => readEntities('ai_operation_logs').filter(l => l.moduleKey === moduleKey),
  log: (moduleKey, action, entityId, entityLabel, details) => createEntity('ai_operation_logs', {
    moduleKey, action, entityId, entityLabel,
    timestamp: new Date().toISOString(),
    operator: (() => { try { return JSON.parse(localStorage.getItem('dse_admin_user') || '{}').displayName || '未知' } catch { return '未知' } })(),
    details
  }),
  clear: () => save('ai_operation_logs', [])
}

// -- School Settings --
export const settingsService = {
  get: () => {
    const raw = localStorage.getItem(STORAGE_PREFIX + 'schoolSettings')
    return raw ? JSON.parse(raw) : defaultSchoolSettings
  },
  save: (data) => {
    const current = settingsService.get()
    localStorage.setItem(STORAGE_PREFIX + 'schoolSettings', JSON.stringify({ ...current, ...data }))
    return settingsService.get()
  }
}

// -- Users --
export const userService = {
  getAll: () => readEntities('users'),
  getById: (id) => readEntity('users', id),
  getByUsername: (username) => readEntities('users').find(u => u.username === username) || null,
  create: (data) => createEntity('users', data),
  update: (id, data) => updateEntity('users', id, data),
  delete: (id) => deleteEntity('users', id),
  login: (username, password) => {
    const user = readEntities('users').find(u => u.username === username && u.password === password && u.active)
    if (!user) return null
    const { password: _, ...safeUser } = user
    return safeUser
  }
}

// -- Roles --
export const roleService = {
  getAll: () => readEntities('roles'),
  getById: (id) => readEntity('roles', id),
  create: (data) => createEntity('roles', data),
  update: (id, data) => updateEntity('roles', id, data),
  delete: (id) => {
    const role = readEntity('roles', id)
    if (!role) return false
    if (role.isSystem) return { error: '系统默认角色不可删除' }
    const usersWithRole = readEntities('users').filter(u => u.roleId === id)
    if (usersWithRole.length > 0) {
      return { error: `该角色下仍有 ${usersWithRole.length} 名用户，请先转移用户后再删除` }
    }
    return deleteEntity('roles', id)
  },
  getUserCount: (roleId) => readEntities('users').filter(u => u.roleId === roleId).length
}

// -- Exam Seat Arrangement (考试座位安排) --
export const examRoomService = {
  getAll: () => readEntities('exam_rooms'),
  getById: (id) => readEntity('exam_rooms', id),
  create: (data) => createEntity('exam_rooms', data),
  update: (id, data) => updateEntity('exam_rooms', id, data),
  delete: (id) => deleteEntity('exam_rooms', id),
  saveAll: (data) => save('exam_rooms', data)
}

export const examSeatService = {
  getAllStudents: () => readEntities('exam_students'),
  getStudentById: (id) => readEntity('exam_students', id),
  importStudents: (data) => {
    const existing = readEntities('exam_students')
    let nextId = existing.reduce((max, s) => Math.max(max, s.id), 0)
    const added = []
    data.forEach(s => {
      const dup = existing.find(e => e.classNo === s.classNo && e.className === s.className)
      if (dup) { Object.assign(dup, s); return }
      const student = { ...s, id: ++nextId, imported: Date.now() }
      existing.push(student)
      added.push(student)
    })
    save('exam_students', existing)
    return { added, total: existing.length, all: existing }
  },
  addStudent: (data) => createEntity('exam_students', data),
  updateStudent: (id, data) => updateEntity('exam_students', id, data),
  deleteStudent: (id) => deleteEntity('exam_students', id),
  clearAll: () => save('exam_students', []),

  getAssignments: () => readEntities('exam_assignments'),
  saveAssignments: (data) => save('exam_assignments', data),
  clearAssignments: () => save('exam_assignments', [])
}

// -- RBAC Init --
export function initRoles() {
  const stored = load('roles')
  // 首次使用：写入默认角色
  if (!stored || stored.length === 0) {
    save('roles', defaultRoles)
    return JSON.parse(JSON.stringify(defaultRoles))
  }
  // 每次启动：用最新默认值同步系统角色（保留自定义角色不变）
  let changed = false
  const merged = stored.map(role => {
    if (!role.isSystem) return role
    const def = defaultRoles.find(d => d.id === role.id)
    if (!def) return role
    // 检查是否有需要合并的字段
    const needMenuMerge = Array.isArray(def.menuIds) && def.menuIds.some(m => !(role.menuIds || []).includes(m))
    const needPermMerge = Array.isArray(def.permissions) && def.permissions.some(p => !(role.permissions || []).includes(p))
    if (!needMenuMerge && !needPermMerge) return role
    changed = true
    return {
      ...role,
      menuIds: [...new Set([...(role.menuIds || []), ...(def.menuIds || [])])],
      permissions: [...new Set([...(role.permissions || []), ...(def.permissions || [])])]
    }
  })
  if (changed) {
    save('roles', merged)
  }
  return merged
}
export function initUsers() { return initIfEmpty('users', defaultUsers) }
