/**
 * useHomeworkShared — 作业模块共享常量、工具函数
 */
import { computed } from 'vue'
import { studentService, courseService } from '@/services/dataService'

export const coreSubjects = ['中国语文', '英国语文', '数学', '公民与社会发展']

export const subjectColorMap = {
  '数学': '#3b82f6', '中国语文': '#22c55e', '英国语文': '#8b5cf6',
  'English Reading': '#8b5cf6', 'English Writing': '#a78bfa',
  'English Listening': '#c4b5fd', 'English Speaking': '#ddd6fe',
  '物理': '#f59e0b', '化学': '#ef4444', '生物': '#10b981',
  '历史': '#78716c', '地理': '#06b6d4', '经济': '#f97316',
  '资讯及通讯科技': '#6366f1', '企业、会计与财务概论': '#14b8a6',
  '视觉艺术': '#ec4899', '体育': '#84cc16', '音乐': '#d946ef',
  '数学延伸M1': '#60a5fa', '数学延伸M2': '#93c5fd',
  '公民与社会发展': '#64748b'
}

export const allHwStatuses = [
  '已完成', '未完成', '部分完成', '未到截止时间',
  '已提交', '未提交', '已批改', '书籍/作业丢失'
]

export const statusTagTypes = {
  '已完成': 'success', '未完成': 'danger', '部分完成': 'warning',
  '未到截止时间': 'info', '已提交': 'success', '未提交': 'danger',
  '已批改': 'primary', '书籍/作业丢失': 'danger'
}

export function subjectColor(s) {
  return subjectColorMap[s] || 'var(--admin-accent)'
}

export function hwStatusTagType(status) {
  return statusTagTypes[status] || 'info'
}

export function useHomeworkShared() {
  const electiveSubjects = computed(() => {
    const all = courseService.getAllNamesFlat()
    return all.filter(s => !coreSubjects.includes(s))
  })

  const classList = computed(() => studentService.getClasses())

  const today = new Date().toISOString().split('T')[0]

  return {
    coreSubjects,
    electiveSubjects,
    classList,
    today,
    subjectColor,
    hwStatusTagType,
    allHwStatuses
  }
}
