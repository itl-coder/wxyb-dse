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
  { id: 1, title: '陈小明家长面谈', scene: '家长面谈', duration: '15:32', speakers: '张老师、陈妈妈', date: '2026-05-07', audioUrl: null, transcript: [
    { speaker: '张老师', text: '小明妈妈您好，今天请您来是想沟通一下小明最近的学习状态。', time: '00:12' },
    { speaker: '陈妈妈', text: '张老师您好，我也注意到了，他最近回家后不太爱说话。', time: '00:25' },
    { speaker: '张老师', text: '是的，这次月考数学成绩从88分下滑到了72分，我分析主要是二次函数综合应用这块有漏洞。', time: '00:42' },
    { speaker: '陈妈妈', text: '他在家里也确实不怎么练数学题了，说太难了。', time: '00:58' },
    { speaker: '张老师', text: '我建议可以从这几方面入手：每天固定20分钟专项练习，另外他上课还是很积极的。', time: '01:20' },
    { speaker: '陈妈妈', text: '好的，谢谢张老师！我们家长一定配合。', time: '01:40' }
  ] },
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
  previewTheme: 'default',
  showTeacherSign: true,
  showParentSign: true
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
const iconPool = ['📝','📋','✓','📄','🎯','📊','💬','🎙️','📚','🏠','📅','👥','⚖️','📱','🔔','⭐','💡','🔧','📌','🎓','🏆','📖','✏️','🔍','💊','🌐','📈','🗂️','💻','🎵']

// ==================== 新增默认数据 ====================
const defaultErrorBook = [
  { id:1, question:'已知二次函数 f(x)=x²−4x+3，求顶点坐标和对称轴方程', subject:'数学', topic:'二次函数', errorType:'calc', count:3, lastDate:'2026-05-07', studentNames:'陈小明、张伟豪', studentIds:[1,3], source:'2026年5月月考', sourceType:'exam', correctAnswer:'顶点(2,−1)，对称轴x=2', analysis:'配方：f(x)=(x−2)²−1', inBank:false, assignedTo:'', assignedClass:'5D', createdAt:'2026-05-07' },
  { id:2, question:'求不等式 |2x−3| > 5 的解集', subject:'数学', topic:'不等式', errorType:'concept', count:2, lastDate:'2026-05-06', studentNames:'李美玲', studentIds:[2], source:'课堂测验', sourceType:'test', correctAnswer:'x<−1或x>4', analysis:'|2x−3|>5 ⇒ 2x−3>5 或 2x−3<−5', inBank:true, assignedTo:'李美玲', assignedClass:'5D', createdAt:'2026-05-06' },
  { id:3, question:'已知 sinθ=3/5，θ在第二象限，求 cosθ 和 tanθ', subject:'数学', topic:'三角函数', errorType:'reading', count:1, lastDate:'2026-05-05', studentNames:'陈小明', studentIds:[1], source:'5月7日作业', sourceType:'homework', correctAnswer:'cosθ=−4/5，tanθ=−3/4', analysis:'利用sin²θ+cos²θ=1，注意第二象限cos为负', inBank:false, assignedTo:'', assignedClass:'5D', createdAt:'2026-05-05' },
  { id:4, question:'阅读下面的文言文，翻译画线句子', subject:'中国语文', topic:'文言翻译', errorType:'comprehensive', count:2, lastDate:'2026-05-04', studentNames:'李美玲、黄小燕', studentIds:[2,4], source:'期中考试', sourceType:'exam', correctAnswer:'你愚蠢到了极点，自己都快要死了，还要钱做什么呢？', analysis:'逐字翻译，注意"蔽"为"昏聩、糊涂"义', inBank:false, assignedTo:'', assignedClass:'5D', createdAt:'2026-05-04' },
  { id:5, question:'求函数 y=log₂(x−1)+log₂(3−x) 的定义域', subject:'数学', topic:'对数函数', errorType:'careless', count:4, lastDate:'2026-05-07', studentNames:'陈小明、李美玲、王芳芳', studentIds:[1,2,6], source:'2026年5月月考', sourceType:'exam', correctAnswer:'1<x<3', analysis:'对数的真数>0，即x−1>0且3−x>0，解得1<x<3', inBank:true, assignedTo:'', assignedClass:'5D', createdAt:'2026-05-07' }
]

const defaultQuestionBank = [
  // === 数学 ===
  { id:1, subject:'数学', topic:'二次函数', type:'mc', difficulty:'easy', score:4, suggestedTime:3, text:'二次函数 f(x)=x²−4x+3 的顶点坐标是：', options:'A. (2,−1)\nB. (2,1)\nC. (−2,−1)\nD. (−1,2)', answer:'A', steps:'f(x)=x²−4x+3=(x−2)²−1\n顶点坐标为(2,−1)', knowledgePoint:'二次函数顶点式 f(x)=a(x−h)²+k', commonMistakes:'配方后常数项计算错误，忘记除a', estimatedRate:85, source:'manual' },
  { id:2, subject:'数学', topic:'三角函数', type:'mc', difficulty:'easy', score:4, suggestedTime:3, text:'已知 sinθ=3/5，θ在第一象限，则 cosθ =', options:'A. 3/5\nB. 4/5\nC. −4/5\nD. 5/4', answer:'B', steps:'sin²θ+cos²θ=1\ncos²θ=1−9/25=16/25\nθ在第一象限，cosθ=4/5', knowledgePoint:'同角三角函数基本关系 sin²θ+cos²θ=1', commonMistakes:'忽略象限对符号的影响', estimatedRate:90, source:'manual' },
  { id:3, subject:'数学', topic:'对数指数', type:'calc', difficulty:'easy', score:6, suggestedTime:5, text:'解方程：3ˣ⁺¹ = 81', answer:'x=3', steps:'81=3⁴\n3ˣ⁺¹=3⁴\nx+1=4\nx=3', knowledgePoint:'指数方程求解，将两边化为同底指数', commonMistakes:'指数运算不熟练，无法将数字转换为指数形式', estimatedRate:80, source:'manual' },
  { id:4, subject:'数学', topic:'二次函数', type:'calc', difficulty:'medium', score:8, suggestedTime:6, text:'已知二次函数 f(x) = 2x² − 8x + 5，求：（a）f(x) 的顶点坐标；（b）f(x) 的最小值；（c）方程 f(x) = 0 的解（精确到0.01）。', answer:'（a）顶点(2,−3) （b）最小值为−3 （c）x≈0.78 或 x≈3.22', steps:'配方：f(x)=2(x²−4x)+5=2(x−2)²−8+5=2(x−2)²−3\n顶点(2,−3)，最小值=−3\n2x²−8x+5=0，Δ=64−40=24，x=(8±√24)/4', knowledgePoint:'二次函数配方、顶点公式、求根公式综合应用', commonMistakes:'配方时系数2的处理容易出错，需要先提取公因子', estimatedRate:72, source:'manual' },
  { id:5, subject:'数学', topic:'二次函数', type:'calc', difficulty:'medium', score:8, suggestedTime:7, text:'抛物线 y = x² + bx + c 与 x 轴交于 A(−1,0) 和 B(3,0)，求 b 和 c 的值，并写出顶点坐标。', answer:'b=−2, c=−3，顶点(1,−4)', steps:'交点式：y=(x+1)(x−3)=x²−2x−3\n比较得 b=−2, c=−3\n顶点：x=−b/2a=1, y=f(1)=1−2−3=−4', knowledgePoint:'二次函数交点式与一般式的转换', commonMistakes:'交点式展开时符号处理不仔细', estimatedRate:65, source:'manual' },
  { id:6, subject:'数学', topic:'三角函数', type:'calc', difficulty:'medium', score:8, suggestedTime:8, text:'在ΔABC中，已知 a=8, b=6, ∠C=60°，求 c 边的长度和ΔABC的面积。', answer:'c=√52≈7.21，面积=12√3≈20.78', steps:'余弦定理：c²=a²+b²−2ab·cosC=64+36−2·8·6·1/2=52\nc=√52=2√13≈7.21\n面积=1/2·ab·sinC=1/2·8·6·√3/2=12√3', knowledgePoint:'余弦定理、三角形面积公式', commonMistakes:'cos60° 和 sin60° 的值混淆', estimatedRate:68, source:'manual' },
  { id:7, subject:'数学', topic:'不等式', type:'calc', difficulty:'medium', score:6, suggestedTime:5, text:'解不等式 |2x−3| > 5，并将解集在数轴上表示。', answer:'x < −1 或 x > 4', steps:'|2x−3|>5 等价于 2x−3>5 或 2x−3<−5\n2x>8 → x>4\n2x<−2 → x<−1\n解集：x∈(−∞,−1)∪(4,+∞)', knowledgePoint:'绝对值不等式的等价转化', commonMistakes:'忘记分两种情况讨论，或不等号方向搞反', estimatedRate:70, source:'manual' },
  { id:8, subject:'数学', topic:'二次函数', type:'app', difficulty:'hard', score:10, suggestedTime:10, text:'某商场将每件成本为20元的商品按每件35元出售，每天可卖出100件。若每降价1元，每天可多卖10件。设降价x元，求：（a）日利润L(x)的表达式；（b）日利润最大值及对应售价。', answer:'（a）L(x)=(15−x)(100+10x)=−10x²+50x+1500 （b）当x=2.5时最大利润=1562.5元，售价=32.5元', steps:'日利润=(售价−成本)×销量\n售价=35−x，成本=20，每件利润=15−x\n销量=100+10x\nL(x)=(15−x)(100+10x)=−10x²+50x+1500\nx=−b/2a=50/20=2.5\nL(2.5)=(15−2.5)(100+25)=12.5×125=1562.5', knowledgePoint:'二次函数建模及最值问题', commonMistakes:'建模时混淆价格、成本、利润的关系，忘记考虑定义域', estimatedRate:45, source:'manual' },
  // === 中国语文 ===
  { id:9, subject:'中国语文', topic:'文言翻译', type:'reading', difficulty:'medium', score:8, suggestedTime:10, text:'阅读下面文言文，回答问题：\n\n永之氓咸善游。一日，水暴甚，有五六氓乘小船绝湘水。中济，船破，皆游。其一氓尽力而不能寻常。其侣曰："汝善游最也，今何后为？"曰："吾腰千钱，重，是以后。"曰："何不去之？"不应，摇其首。有顷，益怠。已济者立岸上呼且号曰："汝愚之甚，蔽之甚！身且死，何以货为？"又摇其首，遂溺死。\n\n（1）解释"咸"、"绝"、"寻常"的含义。（2）翻译画线句子"汝愚之甚，蔽之甚！身且死，何以货为？"', answer:'（1）咸：都；绝：横渡；寻常：古代长度单位，这里指"很短的距离"。（2）你愚蠢到了极点，糊涂到了极点！自己都快要死了，还要钱做什么呢？', steps:'理解文言文中"咸"为副词"都"\n"绝"作"横渡"讲\n"寻常"此处为量词引申\n画线句逐字翻译并调整语序', knowledgePoint:'文言实词释义、文言句子翻译', commonMistakes:'忽略上下文导致词义误判', estimatedRate:65, source:'manual' },
  { id:10, subject:'中国语文', topic:'议论文写作', type:'writing', difficulty:'medium', score:20, suggestedTime:30, text:'以"科技发展与人情温度"为题，写一篇不少于600字的议论文。要求：观点明确，论证充分，结构清晰。', answer:'【评分标准】论点明确（5分）、论据充分（5分）、结构清晰（5分）、语言表达（5分）。言之成理即可。', steps:'确定立场（科技不必然降低人情温度）\n拟定分论点（科技拓展沟通、科技创造共情新方式）\n准备论据（社交媒体连接、AI辅助医疗关怀）\n安排结构（引言-正面论述-反驳对立-总结）', knowledgePoint:'议论文写作：立论、论证、结构', commonMistakes:'论证单一角度，缺乏正反对比', estimatedRate:60, source:'manual' },
  // === 物理 ===
  { id:11, subject:'物理', topic:'力学', type:'calc', difficulty:'medium', score:8, suggestedTime:8, text:'一个质量为2kg的物体静止在光滑水平面上。受到一个水平方向的恒力F=10N作用，求：（a）物体的加速度；（b）4秒末物体的速度；（c）4秒内物体的位移。', answer:'（a）a=5 m/s² （b）v=20 m/s （c）s=40 m', steps:'牛顿第二定律：F=ma → a=F/m=10/2=5 m/s²\nv=v₀+at=0+5×4=20 m/s\ns=v₀t+½at²=0+½×5×16=40 m', knowledgePoint:'牛顿第二定律、匀变速直线运动公式', commonMistakes:'混淆速度公式和位移公式', estimatedRate:75, source:'manual' },
  // === 化学 ===
  { id:12, subject:'化学', topic:'化学计量', type:'calc', difficulty:'medium', score:6, suggestedTime:6, text:'将5.3g Na₂CO₃ 溶于水配成250mL溶液，求该溶液的物质的量浓度。（Na₂CO₃ 摩尔质量 = 106 g/mol）', answer:'0.2 mol/L', steps:'n(Na₂CO₃) = 5.3/106 = 0.05 mol\nc = n/V = 0.05/0.25 = 0.2 mol/L', knowledgePoint:'物质的量浓度计算 c=n/V', commonMistakes:'单位换算（mL转L）遗漏', estimatedRate:78, source:'manual' },
  // === 经济 ===
  { id:13, subject:'经济', topic:'供需理论', type:'analysis', difficulty:'medium', score:10, suggestedTime:12, text:'分析香港实施"最低工资条例"对劳动市场的影响，结合供需理论说明可能产生的后果。', answer:'最低工资高于均衡工资时：（1）劳动供给增加（更多人愿意工作）；（2）劳动需求减少（企业减少雇工）；（3）产生过剩供给（失业）；（4）部分低技能工人获益（保留工作且工资提高）。', steps:'画出劳动市场供需图\n标明均衡工资和最低工资线\n分析最低工资>均衡工资的情况\n讨论供给量>需求量的结果\n辩证分析受益和受损群体', knowledgePoint:'价格下限（price floor）对市场的影响', commonMistakes:'只分析负面影响，忽略受益群体', estimatedRate:55, source:'manual' }
]

const defaultCourseFeedback = [
  { id:1, class:'5D', date:'2026-05-07', subject:'数学', teacher:'张老师', period:'19:30-21:05', content:'段落拓展（1）+文化类题目练习', performanceNotes:'【准时度】优秀\n【专注度】大部分学生认真听讲\n【掌握情况】二次函数顶点式转换基本掌握\n【待加强】综合应用题拆解能力', topics:['二次函数','综合应用'], createdAt:'2026-05-07 21:30' }
]

const defaultParentConferences = [
  { id:1, studentId:1, studentName:'陈小明', class:'5D', time:'2026-05-10 14:00', parentCount:2, saAttend:true, ccAttend:true, mode:'offline', room:'教学楼302会议室', status:'pending', notes:'关注数学成绩波动和选科规划', createdAt:'2026-05-05' },
  { id:2, studentId:4, studentName:'黄小燕', class:'5D', time:'2026-05-03 15:30', parentCount:1, saAttend:false, ccAttend:true, mode:'online', room:'', status:'completed', notes:'已沟通家庭因素对学习状态的影响，家长表示配合关注', createdAt:'2026-04-28' }
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
  initIfEmpty('parentConferences', defaultParentConferences)
  initIfEmpty('examPapers', defaultExamPapers)
  initIfEmpty('weeklySchedule', defaultWeeklySchedule)
  initCourses()
  if (!localStorage.getItem(STORAGE_PREFIX + 'schoolSettings')) {
    localStorage.setItem(STORAGE_PREFIX + 'schoolSettings', JSON.stringify(defaultSchoolSettings))
  }
}

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
