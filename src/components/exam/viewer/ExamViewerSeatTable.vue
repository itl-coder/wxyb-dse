<template>
  <div class="evs-wrap">
    <table class="evs-table">
      <thead>
        <tr>
          <th class="evs-corner"></th>
          <th v-for="c in cols" :key="c" class="evs-col-hd">{{ colLabel(c) }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in reversedRows"
          :key="r"
          :class="{ 'evs-row-first': r === 1 }"
        >
          <td class="evs-row-hd">{{ r }}</td>
          <td
            v-for="c in cols"
            :key="c"
            class="evs-cell"
            :class="cellClass(r, c)"
          >
            <span v-if="isDoor(r, c)" class="evs-dot"></span>

            <!-- 屏蔽 -->
            <template v-if="isBlocked(r, c)">
              <span class="evs-cross"></span>
            </template>

            <!-- 已占 -->
            <template v-else-if="getStudent(r, c)">
              <span class="evs-idx">{{ colLabel(c) }}{{ r }}</span>
              <span class="evs-name">{{ getStudent(r, c).name }}</span>
              <span class="evs-meta">{{ getStudentMeta(r, c) }}</span>
            </template>

            <!-- 空位 -->
            <template v-else>
              <span class="evs-idx-empty">{{ colLabel(c) }}{{ r }}</span>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Number, required: true },
  cols: { type: Number, required: true },
  assignments: { type: Array, default: () => [] },
  blockedSet: { type: Object, default: () => ({}) },
  studentMap: { type: Object, default: () => ({}) },
  doorSeatIndex: { type: Number, default: null },
  doorDir: { type: String, default: 'left' }
})

const reversedRows = computed(() => {
  const arr = []
  for (let i = props.rows; i >= 1; i--) arr.push(i)
  return arr
})

function seatIdx(r, c) {
  return (r - 1) * props.cols + c
}

function colLabel(n) {
  return String.fromCharCode(64 + n)
}

function getAssignment(r, c) {
  const si = seatIdx(r, c)
  return props.assignments.find(a => a.seatIndex === si) || null
}

function getStudent(r, c) {
  const a = getAssignment(r, c)
  if (!a) return null
  return props.studentMap[a.studentId] || null
}

function getStudentMeta(r, c) {
  const s = getStudent(r, c)
  if (!s) return ''
  const parts = []
  if (s.className) parts.push(s.className)
  if (s.electives?.length) parts.push(s.electives.slice(0, 2).join(' / '))
  return parts.join(' · ')
}

function isBlocked(r, c) {
  return props.blockedSet.has(seatIdx(r, c))
}

function isDoor(r, c) {
  if (props.doorSeatIndex !== null && props.doorSeatIndex !== undefined) {
    return seatIdx(r, c) === props.doorSeatIndex
  }
  if (r !== 1) return false
  if (props.doorDir === 'left') return c === 1
  return c === props.cols
}

function cellClass(r, c) {
  if (isBlocked(r, c)) return 'evs-blocked'
  const s = getStudent(r, c)
  if (!s) return 'evs-empty'
  if (s.status === 'absent') return 'evs-absent'
  if (s.status === 'special') return 'evs-special'
  return 'evs-occupied'
}
</script>

<style>
.evs-wrap {
  overflow: visible;
}
.evs-table {
  margin: 0 auto;
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
}

/* 列头 */
.evs-corner {
  background: #f0f0f0;
  border: 1px solid #666;
  width: 18px;
  min-width: 18px;
}
.evs-col-hd {
  background: #f0f0f0;
  border: 1px solid #666;
  font-size: 7px;
  font-weight: 700;
  text-align: center;
  padding: 1px 0;
  font-family: "Courier New", monospace;
  color: #555;
}

/* 行头 */
.evs-row-hd {
  background: #f0f0f0;
  border: 1px solid #666;
  font-size: 7px;
  font-weight: 700;
  text-align: center;
  font-family: "Courier New", monospace;
  color: #555;
  width: 18px;
}

/* 第一行加粗边框 */
.evs-row-first .evs-cell {
  border-top: 2px solid #000;
}

/* 单元格 */
.evs-cell {
  border: 1px solid #666;
  text-align: center;
  vertical-align: middle;
  padding: 1px 3px;
  height: 24px;
  position: relative;
  background: #fff;
}

/* ---- 状态 ---- */
.evs-occupied {
  background: #fff;
}
.evs-empty {
  background: #fafafa;
  border: 1px dashed #bbb;
}
.evs-blocked {
  background: #eee;
}
.evs-absent {
  border-left: 2px solid #000;
}
.evs-special {
  border-left: 2px solid #000;
}

/* 座号角标 */
.evs-idx {
  position: absolute;
  top: 1px;
  right: 2px;
  font-size: 5px;
  font-family: "Courier New", monospace;
  color: #aaa;
  line-height: 1;
}
.evs-idx-empty {
  font-size: 7px;
  font-family: "Courier New", monospace;
  color: #ccc;
}

/* 姓名 */
.evs-name {
  display: block;
  font-size: 8px;
  font-weight: 700;
  color: #000;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.evs-meta {
  display: block;
  font-size: 6px;
  color: #888;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 屏蔽叉 */
.evs-cross {
  display: inline-block;
  width: 10px;
  height: 10px;
  position: relative;
  opacity: 0.2;
}
.evs-cross::before,
.evs-cross::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 1px;
  background: #000;
}
.evs-cross::before { transform: translate(-50%, -50%) rotate(45deg); }
.evs-cross::after  { transform: translate(-50%, -50%) rotate(-45deg); }

/* 门口圆点 */
.evs-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #000;
}
</style>
