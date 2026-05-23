<template>
  <el-dialog
    v-model="visible"
    title="学生选修画像"
    width="680px"
    :close-on-click-modal="true"
    @close="emit('close')"
  >
    <div class="evp-root" v-if="store.students.length">
      <!-- 概览卡片 -->
      <div class="evp-overview">
        <div class="evp-ov-card">
          <span class="evp-ov-num">{{ store.students.length }}</span>
          <span class="evp-ov-label">考生</span>
        </div>
        <div class="evp-ov-card evp-ov-2">
          <span class="evp-ov-num">{{ electiveNames.length }}</span>
          <span class="evp-ov-label">选修科目</span>
        </div>
        <div class="evp-ov-card evp-ov-3">
          <span class="evp-ov-num">{{ avgElectives }}</span>
          <span class="evp-ov-label">人均选修</span>
        </div>
        <div class="evp-ov-card evp-ov-4">
          <span class="evp-ov-num">{{ topComboCount }}</span>
          <span class="evp-ov-label">热门组合数</span>
        </div>
      </div>

      <!-- 选修分布 水平条形图 -->
      <div class="evp-section">
        <div class="evp-section-hd">
          <span class="evp-section-title">科目分布</span>
          <span class="evp-section-hint">按选修人数排序</span>
        </div>
        <div class="evp-bar-list">
          <div v-for="e in electiveList" :key="e.name" class="evp-bar-row">
            <span class="evp-bar-label" :title="e.name">{{ e.name }}</span>
            <div class="evp-bar-track">
              <div
                class="evp-bar-fill"
                :style="{ width: e.percent + '%', background: e.color }"
              ></div>
            </div>
            <span class="evp-bar-num">{{ e.count }}人</span>
            <span class="evp-bar-pct">{{ e.percent }}%</span>
          </div>
        </div>
      </div>

      <!-- 选修组合 Top 12 -->
      <div class="evp-section" v-if="comboList.length">
        <div class="evp-section-hd">
          <span class="evp-section-title">热门选修组合</span>
          <span class="evp-section-hint">前 {{ Math.min(comboList.length, 12) }} 种</span>
        </div>
        <div class="evp-combo-grid">
          <div
            v-for="(c, i) in comboList.slice(0, 12)"
            :key="i"
            class="evp-combo-chip"
            :style="{ borderColor: comboBorderColor(i) }"
          >
            <span class="evp-combo-rank" :style="{ background: comboBorderColor(i) }">{{ i + 1 }}</span>
            <span class="evp-combo-text">{{ c.name }}</span>
            <span class="evp-combo-count">{{ c.count }}人</span>
          </div>
        </div>
      </div>

      <!-- 班级 × 选修矩阵 -->
      <div class="evp-section" v-if="classElectiveMatrix.length > 1">
        <div class="evp-section-hd">
          <span class="evp-section-title">班级选修偏好</span>
        </div>
        <div class="evp-matrix-wrap">
          <table class="evp-matrix">
            <thead>
              <tr>
                <th class="evp-mx-corner"></th>
                <th v-for="sn in topElectiveNames" :key="sn" class="evp-mx-th">{{ sn }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in classElectiveMatrix" :key="row.className">
                <td class="evp-mx-td-label">{{ row.className }}</td>
                <td
                  v-for="sn in topElectiveNames"
                  :key="sn"
                  class="evp-mx-td"
                  :style="{ background: matrixCellBg(row.values[sn] || 0, row.maxVal) }"
                >
                  <span>{{ row.values[sn] || 0 }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="evp-empty" v-else>
      <span class="evp-empty-glyph">—</span>
      <p>尚未导入考生数据</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'

const emit = defineEmits(['close'])
const store = useExamSeat2Store()
const visible = ref(true)

const palette = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#2563eb', '#7c3aed', '#be185d'
]

// 归一化选修名称：物理1/物理2 → 物理，化学1/化学2 → 化学
function normName(name) {
  return name.replace(/[12]$/, '')
}

// 选修科目列表（按人数排序）
const electiveList = computed(() => {
  const map = {}
  store.students.forEach(s => {
    (s.electives || []).forEach(e => {
      const n = normName(e)
      if (!map[n]) map[n] = 0
      map[n]++
    })
  })
  const total = store.students.length
  return Object.entries(map)
    .map(([name, count], i) => ({
      name, count,
      percent: Math.round((count / total) * 100),
      color: palette[i % palette.length]
    }))
    .sort((a, b) => b.count - a.count)
})

const electiveNames = computed(() => electiveList.value.map(e => e.name))

const avgElectives = computed(() => {
  const total = store.students.reduce((s, st) => s + (st.electives?.length || 0), 0)
  return store.students.length ? (total / store.students.length).toFixed(1) : '0'
})

// 选修组合
const comboList = computed(() => {
  const map = {}
  store.students.forEach(s => {
    const key = (s.electives || []).map(normName).slice().sort().join(' + ') || '无选修'
    if (!map[key]) map[key] = 0
    map[key]++
  })
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const topComboCount = computed(() => comboList.value.length)

const topElectiveNames = computed(() => electiveNames.value.slice(0, 8))

// 班级 × 选修矩阵
const classElectiveMatrix = computed(() => {
  const classMap = {}
  store.students.forEach(s => {
    const cn = s.className || '未知'
    if (!classMap[cn]) classMap[cn] = { className: cn, students: [] }
    classMap[cn].students.push(s)
  })
  const rows = Object.values(classMap).sort((a, b) => b.students.length - a.students.length)
  return rows.map(row => {
    const values = {}
    let maxVal = 0
    topElectiveNames.value.forEach(sn => {
      let count = 0
      row.students.forEach(st => {
        if ((st.electives || []).map(normName).includes(sn)) count++
      })
      values[sn] = count
      if (count > maxVal) maxVal = count
    })
    return { className: row.className, students: row.students.length, values, maxVal: maxVal || 1 }
  })
})

function comboBorderColor(i) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#d946ef', '#ef4444', '#06b6d4']
  return colors[i] || palette[i % palette.length]
}

function matrixCellBg(val, max) {
  if (!val) return 'transparent'
  const alpha = 0.12 + (val / max) * 0.55
  return `rgba(99,102,241,${alpha.toFixed(2)})`
}
</script>

<style scoped>
.evp-root {
  display: flex; flex-direction: column; gap: 20px;
  font-family: var(--admin-font);
}

/* ---- 概览 ---- */
.evp-overview {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
}
.evp-ov-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 18px 10px; border-radius: 10px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
}
.evp-ov-num {
  font-size: 28px; font-weight: 700; font-family: var(--font-mono, monospace);
  color: var(--admin-accent-light);
}
.evp-ov-label { font-size: 11px; color: var(--admin-text-muted); letter-spacing: 0.5px; }
.evp-ov-2 .evp-ov-num { color: #22c55e; }
.evp-ov-3 .evp-ov-num { color: #f59e0b; }
.evp-ov-4 .evp-ov-num { color: #ec4899; }

/* ---- 段落 ---- */
.evp-section { display: flex; flex-direction: column; gap: 8px; }
.evp-section-hd {
  display: flex; align-items: baseline; gap: 8px;
}
.evp-section-title {
  font-size: 13px; font-weight: 600; color: var(--admin-text);
}
.evp-section-hint {
  font-size: 10px; color: var(--admin-text-muted);
}

/* ---- 水平条 ---- */
.evp-bar-list { display: flex; flex-direction: column; gap: 5px; }
.evp-bar-row { display: flex; align-items: center; gap: 10px; }
.evp-bar-label {
  font-size: 12px; color: var(--admin-text-secondary);
  width: 80px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0;
}
.evp-bar-track {
  flex: 1; height: 10px; background: rgba(255,255,255,0.05);
  border-radius: 5px; overflow: hidden;
}
.evp-bar-fill {
  height: 100%; border-radius: 5px; transition: width 0.5s ease;
  min-width: 4px; position: relative;
}
.evp-bar-num {
  font-size: 11px; font-weight: 600; color: var(--admin-text-muted);
  font-family: var(--font-mono, monospace); min-width: 34px; text-align: right;
}
.evp-bar-pct {
  font-size: 10px; color: var(--admin-text-muted); min-width: 30px;
  font-family: var(--font-mono, monospace);
}

/* ---- 组合网格 ---- */
.evp-combo-grid {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.evp-combo-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; border: 1px solid;
  border-radius: 20px; font-size: 12px;
  background: var(--admin-surface);
  transition: all 0.15s;
}
.evp-combo-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.evp-combo-rank {
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; font-size: 10px; font-weight: 700; flex-shrink: 0;
  line-height: 1;
}
.evp-combo-text {
  color: var(--admin-text);
  font-weight: 500;
}
.evp-combo-count {
  color: var(--admin-text-muted);
  font-size: 11px;
  font-family: var(--font-mono, monospace);
}

/* ---- 班级×选修矩阵 ---- */
.evp-matrix-wrap { overflow-x: auto; }
.evp-matrix {
  border-collapse: collapse; width: 100%;
  font-size: 12px;
}
.evp-mx-corner { min-width: 56px; }
.evp-mx-th {
  font-weight: 600; color: var(--admin-text-secondary);
  padding: 6px 8px; text-align: center;
  white-space: nowrap; font-size: 11px;
  border-bottom: 1px solid var(--admin-border);
}
.evp-mx-td-label {
  font-weight: 600; color: var(--admin-text);
  padding: 8px 10px; white-space: nowrap;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.evp-mx-td {
  text-align: center; padding: 8px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-family: var(--font-mono, monospace);
  font-weight: 600; font-size: 12px;
  color: var(--admin-text);
  transition: background 0.3s;
}

/* ---- 空状态 ---- */
.evp-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 40px 0; color: var(--admin-text-muted);
}
.evp-empty-glyph { font-size: 36px; opacity: 0.25; margin-bottom: 8px; }
.evp-empty p { margin: 0; font-size: 13px; }
</style>
