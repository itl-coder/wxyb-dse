/**
 * 全局表格密度控制 composable
 * 提供紧凑/默认/宽松三种密度模式，localStorage 持久化
 * used by: TableDensityController, all admin table pages
 */
import { ref, computed, readonly } from 'vue'

const STORAGE_KEY = 'dse_table_density'

// 单例状态（模块级，跨组件共享）
const density = ref(localStorage.getItem(STORAGE_KEY) || 'comfortable')

const DENSITY_CONFIG = {
  compact: { rowHeight: 28, fontSize: 10, size: 'small' },
  comfortable: { rowHeight: 40, fontSize: 12, size: 'small' },
  loose: { rowHeight: 52, fontSize: 13, size: 'default' }
}

const DENSITY_LABELS = {
  compact: '紧凑',
  comfortable: '默认',
  loose: '宽松'
}

export function useTableDensity() {
  /** @type {import('vue').ComputedRef<keyof typeof DENSITY_CONFIG>} */
  const currentDensity = computed(() => density.value)

  /** @type {import('vue').ComputedRef<{rowHeight: number, fontSize: number, size: string}>} */
  const densityConfig = computed(() => DENSITY_CONFIG[density.value] || DENSITY_CONFIG.comfortable)

  function setDensity(value) {
    if (!DENSITY_CONFIG[value]) return
    density.value = value
    localStorage.setItem(STORAGE_KEY, value)
  }

  const densityOptions = Object.entries(DENSITY_LABELS).map(([value, label]) => ({
    value,
    label
  }))

  return {
    density: readonly(density),
    currentDensity,
    densityConfig,
    setDensity,
    densityOptions,
    DENSITY_CONFIG,
    DENSITY_LABELS
  }
}
