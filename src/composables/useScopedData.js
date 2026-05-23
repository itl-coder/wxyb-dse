/**
 * 模块：useScopedData
 * 功能：按校区/班级/个人三个维度过滤数据，实现数据权限范围隔离
 * 依赖：@/stores/app (useAppStore)
 */
import { useAppStore } from '@/stores/app'

export function useScopedData() {
  const store = useAppStore()

  function filterByScope(data, scope, user) {
    if (!scope || scope === 'all') return data
    const u = user || store.currentUser
    if (!u) return data

    if (scope === 'campus' && u.campus) {
      return data.filter(d => d.campus === u.campus || (d.class && store.classBelongsToCampus(d.class, u.campus)))
    }
    if (scope === 'class' && u.class) {
      return data.filter(d => d.class === u.class || d.studentClass === u.class)
    }
    if (scope === 'self') {
      return data.filter(d => d.teacher === u.displayName || d.handler === u.displayName || d.counselor === u.displayName || d.createdBy === u.displayName)
    }
    return data
  }

  return { filterByScope }
}
