<template>
  <div class="eps-root">
    <div class="eps-header">
      <h4 class="eps-title">考生画像</h4>
      <span class="eps-total">{{ store.students.length }} 名考生</span>
    </div>

    <div class="eps-body" v-if="store.students.length">
      <!-- 概览卡片 -->
      <div class="eps-overview">
        <div class="eps-ov-card">
          <span class="eps-ov-num">{{ store.students.length }}</span>
          <span class="eps-ov-label">考生总数</span>
        </div>
        <div class="eps-ov-card eps-ov-ok">
          <span class="eps-ov-num">{{ store.assignedCount }}</span>
          <span class="eps-ov-label">已入座</span>
        </div>
        <div class="eps-ov-card eps-ov-warn">
          <span class="eps-ov-num">{{ store.unassignedCount }}</span>
          <span class="eps-ov-label">待安排</span>
        </div>
        <div class="eps-ov-card eps-ov-info">
          <span class="eps-ov-num">{{ classList.length }}</span>
          <span class="eps-ov-label">班级数</span>
        </div>
      </div>

      <!-- 班级分布 -->
      <div class="eps-section" v-if="classList.length">
        <div class="eps-section-title">班级分布</div>
        <div class="eps-bar-list">
          <div v-for="c in classList" :key="c.name" class="eps-bar-item">
            <span class="eps-bar-label">{{ c.name }}</span>
            <div class="eps-bar-track">
              <div class="eps-bar-fill" :style="{ width: c.percent + '%', background: c.color }"></div>
            </div>
            <span class="eps-bar-num">{{ c.count }}人</span>
          </div>
        </div>
      </div>

      <!-- 选修科目分布 -->
      <div class="eps-section" v-if="electiveList.length">
        <div class="eps-section-title">选修科目分布</div>
        <div class="eps-tag-cloud">
          <span
            v-for="e in electiveList"
            :key="e.name"
            class="eps-cloud-tag"
            :style="{ fontSize: (10 + e.ratio * 10) + 'px', opacity: 0.5 + e.ratio * 0.5 }"
          >
            {{ e.name }}
            <sup>{{ e.count }}</sup>
          </span>
        </div>
      </div>

      <!-- 教室分配概览 -->
      <div class="eps-section" v-if="store.rooms.length">
        <div class="eps-section-title">教室分配概览</div>
        <div class="eps-room-grid">
          <div
            v-for="room in store.rooms"
            :key="room.id"
            class="eps-room-tile"
            :class="{ 'eps-room-tile-active': room.id === store.selectedRoomId }"
            @click="store.selectRoom(room.id)"
          >
            <div class="ert-name">{{ room.name }}</div>
            <div class="ert-bar-wrap">
              <div class="ert-bar">
                <div
                  class="ert-bar-fill"
                  :style="{ width: roomUsage(room) + '%', background: roomColor(room) }"
                ></div>
              </div>
            </div>
            <div class="ert-stats">
              <span>{{ roomUsage(room) }}%</span>
              <span>{{ roomAssigned(room) }}/{{ room.rows * room.cols }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 学生状态一览 -->
      <div class="eps-section">
        <div class="eps-section-title">学生状态</div>
        <div class="eps-status-row">
          <div class="eps-status-chip eps-sc-normal">
            <span class="esc-dot"></span> 正常 {{ normalCount }}
          </div>
          <div class="eps-status-chip eps-sc-special">
            <span class="esc-dot"></span> 特殊 {{ specialCount }}
          </div>
          <div class="eps-status-chip eps-sc-absent">
            <span class="esc-dot"></span> 缺考 {{ absentCount }}
          </div>
          <div class="eps-status-chip eps-sc-locked">
            <span class="esc-dot"></span> 已锁定 {{ lockedCount }}
          </div>
        </div>
      </div>

      <!-- 最近操作提示 -->
      <div class="eps-section" v-if="store.warnings.length">
        <div class="eps-section-title">提醒</div>
        <div class="eps-warn-list">
          <div v-for="(w, i) in store.warnings" :key="i" class="eps-warn-item">{{ w }}</div>
        </div>
      </div>
    </div>

    <div class="eps-empty" v-else>
      <span class="eps-empty-glyph">—</span>
      <p>尚未导入考生数据</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'
import { classColor } from '@/utils/colorHash'

const store = useExamSeat2Store()

// 班级列表（按人数降序）
const classList = computed(() => {
  const map = {}
  store.students.forEach(s => {
    const cn = s.className || '未知'
    if (!map[cn]) map[cn] = { name: cn, count: 0 }
    map[cn].count++
  })
  const list = Object.values(map).sort((a, b) => b.count - a.count)
  const max = list[0]?.count || 1
  return list.map((c, i) => ({
    ...c,
    percent: Math.round((c.count / max) * 100),
    color: classColor(c.name)
  }))
})

// 选修科目列表
const electiveList = computed(() => {
  const map = {}
  let total = 0
  store.students.forEach(s => {
    (s.electives || []).forEach(e => {
      if (!map[e]) map[e] = 0
      map[e]++
      total++
    })
  })
  const list = Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  const max = list[0]?.count || 1
  return list.map(e => ({ ...e, ratio: e.count / max }))
})

// 学生状态统计
const normalCount = computed(() => store.students.filter(s => !s.status || s.status === 'normal').length)
const specialCount = computed(() => store.students.filter(s => s.status === 'special').length)
const absentCount = computed(() => store.students.filter(s => s.status === 'absent').length)
const lockedCount = computed(() => store.assignments.filter(a => a.locked).length)

// 教室辅助函数
function roomAssigned(room) {
  return store.assignments.filter(a => a.roomId === room.id).length
}
function roomUsage(room) {
  const total = room.rows * room.cols
  if (!total) return 0
  return Math.round((roomAssigned(room) / total) * 100)
}
function roomColor(room) {
  const u = roomUsage(room)
  if (u >= 90) return '#ef4444'
  if (u >= 70) return '#f59e0b'
  if (u >= 40) return '#6366f1'
  return '#10b981'
}
</script>

<style scoped>
.eps-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.eps-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--admin-border);
  margin-bottom: 8px;
  flex-shrink: 0;
}
.eps-title { font-size: 13px; font-weight: 600; color: var(--admin-text); margin: 0; }
.eps-total {
  font-size: 11px; font-weight: 700; color: var(--admin-accent-light);
  background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 10px;
}

.eps-body {
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px;
}
.eps-section { display: flex; flex-direction: column; gap: 6px; }
.eps-section-title {
  font-size: 10px; font-weight: 600; color: var(--admin-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px;
}

/* ---- 概览卡片 ---- */
.eps-overview {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
}
.eps-ov-card {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 14px 8px; background: var(--admin-surface);
  border: 1px solid var(--admin-border); border-radius: 8px;
}
.eps-ov-num {
  font-size: 24px; font-weight: 700; font-family: var(--font-mono, monospace);
  color: var(--admin-text);
}
.eps-ov-label { font-size: 10px; color: var(--admin-text-muted); }
.eps-ov-ok .eps-ov-num { color: var(--admin-success); }
.eps-ov-warn .eps-ov-num { color: var(--admin-warning); }
.eps-ov-info .eps-ov-num { color: var(--admin-accent-light); }

/* ---- 班级分布条 ---- */
.eps-bar-list { display: flex; flex-direction: column; gap: 3px; }
.eps-bar-item { display: flex; align-items: center; gap: 8px; }
.eps-bar-label {
  font-size: 11px; color: var(--admin-text-secondary);
  width: 56px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.eps-bar-track {
  flex: 1; height: 8px; background: rgba(255,255,255,0.04);
  border-radius: 4px; overflow: hidden;
}
.eps-bar-fill {
  height: 100%; border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 4px;
}
.eps-bar-num {
  font-size: 10px; font-weight: 600; color: var(--admin-text-muted);
  font-family: var(--font-mono, monospace); width: 32px;
}

/* ---- 选修标签云 ---- */
.eps-tag-cloud {
  display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline;
}
.eps-cloud-tag {
  font-weight: 600; color: var(--admin-accent-light);
  line-height: 1.4; white-space: nowrap;
}
.eps-cloud-tag sup {
  font-size: 0.7em; font-weight: 400;
  color: var(--admin-text-muted);
  margin-left: 1px;
}

/* ---- 教室分配 ---- */
.eps-room-grid { display: flex; flex-direction: column; gap: 4px; }
.eps-room-tile {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; background: var(--admin-surface);
  border: 1px solid var(--admin-border); border-radius: 6px;
  cursor: pointer; transition: all 0.15s;
}
.eps-room-tile:hover { border-color: var(--admin-border-light); background: var(--admin-surface-hover); }
.eps-room-tile-active { border-color: var(--admin-accent); background: rgba(99,102,241,0.06); }
.ert-name {
  font-size: 12px; font-weight: 600; color: var(--admin-text);
  width: 72px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-shrink: 0;
}
.ert-bar-wrap { flex: 1; }
.ert-bar {
  height: 6px; background: rgba(255,255,255,0.05);
  border-radius: 3px; overflow: hidden;
}
.ert-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s; min-width: 4px; }
.ert-stats {
  display: flex; gap: 8px; font-size: 10px; color: var(--admin-text-muted);
  font-family: var(--font-mono, monospace); flex-shrink: 0;
}

/* ---- 状态 ---- */
.eps-status-row { display: flex; gap: 8px; flex-wrap: wrap; }
.eps-status-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 500;
}
.esc-dot { width: 6px; height: 6px; border-radius: 50%; }
.eps-sc-normal { background: rgba(16,185,129,0.08); color: var(--admin-success); }
.eps-sc-normal .esc-dot { background: var(--admin-success); }
.eps-sc-special { background: rgba(245,158,11,0.08); color: var(--admin-warning); }
.eps-sc-special .esc-dot { background: var(--admin-warning); }
.eps-sc-absent { background: rgba(239,68,68,0.08); color: var(--admin-danger); }
.eps-sc-absent .esc-dot { background: var(--admin-danger); }
.eps-sc-locked { background: rgba(99,102,241,0.08); color: var(--admin-accent-light); }
.eps-sc-locked .esc-dot { background: var(--admin-accent-light); }

/* ---- 提醒 ---- */
.eps-warn-list { display: flex; flex-direction: column; gap: 2px; }
.eps-warn-item {
  font-size: 10px; color: var(--admin-warning); padding: 4px 8px;
  background: rgba(245,158,11,0.06); border-left: 2px solid var(--admin-warning);
  border-radius: 2px;
}

.eps-empty {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: var(--admin-text-muted); font-size: 12px;
}
.eps-empty-glyph { font-size: 28px; margin-bottom: 6px; opacity: 0.3; }
.eps-empty p { margin: 0; }
</style>
