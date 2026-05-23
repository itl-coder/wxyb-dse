/**
 * useHomeworkTable — 作业表格配置（密度/列可见性/卡片模式）
 * 偏好持久化到 localStorage key: dse_homework_layout
 */
import { ref, watch } from 'vue'

const STORAGE_KEY = 'dse_homework_layout'

const DENSITY_MAP = {
  compact: { rowHeight: 28, fontSize: 10 },
  comfortable: { rowHeight: 40, fontSize: 12 },
  loose: { rowHeight: 52, fontSize: 13 }
}

export const ALL_COLUMNS = [
  { key: 'subject', label: '科目', defaultVisible: true, required: true },
  { key: 'studentName', label: '姓名', defaultVisible: true, required: true },
  { key: 'title', label: '作业内容', defaultVisible: true },
  { key: 'submitStatus', label: '提交', defaultVisible: true },
  { key: 'quality', label: '质量', defaultVisible: true },
  { key: 'accuracy', label: '正确率', defaultVisible: true },
  { key: 'status', label: '状态', defaultVisible: true },
  { key: 'errorSummary', label: '错题总结', defaultVisible: false },
  { key: 'teacherComment', label: '点评', defaultVisible: false }
]

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {}
}

export function useHomeworkTable() {
  const saved = loadPrefs()

  const density = ref(saved.density || 'comfortable')
  const cardMode = ref(saved.cardMode || false)
  const visibleColumns = ref(
    saved.visibleColumns ||
    ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key)
  )

  const densityConfig = () => DENSITY_MAP[density.value] || DENSITY_MAP.comfortable

  function toggleColumn(key) {
    const col = ALL_COLUMNS.find(c => c.key === key)
    if (col?.required) return
    const idx = visibleColumns.value.indexOf(key)
    if (idx >= 0) {
      visibleColumns.value = visibleColumns.value.filter(k => k !== key)
    } else {
      visibleColumns.value = [...visibleColumns.value, key]
    }
  }

  function isColumnVisible(key) {
    return visibleColumns.value.includes(key)
  }

  // 持久化
  watch([density, cardMode, visibleColumns], () => {
    savePrefs({
      density: density.value,
      cardMode: cardMode.value,
      visibleColumns: visibleColumns.value
    })
  }, { deep: true })

  return {
    density,
    cardMode,
    visibleColumns,
    densityConfig,
    toggleColumn,
    isColumnVisible,
    ALL_COLUMNS,
    DENSITY_MAP
  }
}
