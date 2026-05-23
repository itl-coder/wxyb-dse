<template>
  <div
    class="esc-root"
    :class="statusClass"
  >
    <!-- 屏蔽座位 -->
    <template v-if="isBlocked">
      <span class="esc-blocked-x"></span>
      <div class="esc-popup" v-if="blockedReason">
        <div class="esc-popup-row">
          <span class="esc-popup-label">屏蔽原因</span>
          <span class="esc-popup-val">{{ blockedReason }}</span>
        </div>
      </div>
    </template>

    <!-- 预留座位（空） -->
    <template v-else-if="isReserved && !student">
      <span class="esc-seatno">{{ colLabel }}{{ row }}</span>
      <span class="esc-reserved-tag">预留</span>
      <span class="esc-ext-tag" v-if="reservedInfo?.allowExternalStudent">可外班</span>
      <div class="esc-popup" v-if="reservedReason">
        <div class="esc-popup-row">
          <span class="esc-popup-label">预留原因</span>
          <span class="esc-popup-val">{{ reservedReason }}</span>
        </div>
      </div>
    </template>

    <!-- 空位 -->
    <template v-else-if="!student">
      <span class="esc-seatno">{{ colLabel }}{{ row }}</span>
    </template>

    <!-- 已占座位 -->
    <template v-else>
      <!-- 锁定/解锁图标（可点击切换） -->
      <span class="esc-lock-icon" v-if="isLocked" title="已锁定 · 点击解锁" @click.stop="onToggleLock">
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><rect x="1" y="4" width="8" height="7" rx="1" fill="currentColor"/><path d="M2.5 4V2.5a2.5 2.5 0 0 1 5 0V4" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
      </span>
      <span class="esc-lock-icon esc-unlock-icon" v-else title="未锁定 · 点击锁定" @click.stop="onToggleLock">
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><rect x="1" y="4" width="8" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="0.8"/><path d="M2.5 4V2.5a2.5 2.5 0 0 1 5 0V4" stroke="currentColor" stroke-width="0.8" fill="none"/></svg>
      </span>
      <span class="esc-ext-indicator" v-if="isExternalInReserved" title="外班学生（预留位允许）">⇌</span>
      <span class="esc-name">{{ student.name }}</span>
      <span class="esc-meta" v-if="student.className || electivesText">{{ [student.className, electivesText].filter(Boolean).join(' · ') }}</span>
      <span class="esc-seatno">{{ colLabel }}{{ row }}</span>
      <!-- 悬浮详情弹窗 -->
      <div class="esc-popup">
        <div class="esc-popup-row" v-if="student.className">
          <span class="esc-popup-label">班级</span>
          <span class="esc-popup-val">{{ student.className }}</span>
        </div>
        <div class="esc-popup-row" v-if="student.classNo">
          <span class="esc-popup-label">学号</span>
          <span class="esc-popup-val">{{ student.classNo }}</span>
        </div>
        <div class="esc-popup-row" v-if="electivesText">
          <span class="esc-popup-label">选修</span>
          <span class="esc-popup-val">{{ electivesText }}</span>
        </div>
        <div class="esc-popup-row" v-if="seatStatus !== 'normal'">
          <span class="esc-popup-label">状态</span>
          <span class="esc-popup-val esc-popup-status">{{ statusLabel }}</span>
        </div>
        <div class="esc-popup-row" v-if="isExternalInReserved">
          <span class="esc-popup-label">备注</span>
          <span class="esc-popup-val" style="color: #f97316">外班学生（预留位）</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import { useExamSeat2Store } from '../store/examSeat2Store'

const store = useExamSeat2Store()

const props = defineProps({
  roomId: { type: Number, required: true },
  seatIndex: { type: Number, required: true },
  row: { type: Number, required: true },
  col: { type: Number, required: true },
  student: { type: Object, default: null },
  isBlocked: { type: Boolean, default: false },
  isReserved: { type: Boolean, default: false },
  isSelected: { type: Boolean, default: false },
  isBatchSelected: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  hasConflict: { type: Boolean, default: false },
  isExclusive: { type: Boolean, default: false },
  seatStatus: { type: String, default: 'normal' },
  blockedReason: { type: String, default: '' },
  reservedReason: { type: String, default: '' },
  reservedInfo: { type: Object, default: null }
})

function onToggleLock() {
  if (!props.student) return
  store.toggleLock(props.roomId, props.seatIndex)
}

const colLabel = computed(() => String.fromCharCode(64 + props.col))

const electivesText = computed(() => {
  if (!props.student?.electives?.length) return ''
  return props.student.electives.join(' / ')
})

const statusLabel = computed(() => {
  const map = { absent: '缺考', special: '特殊', normal: '' }
  return map[props.seatStatus] || ''
})

// 检测是否为外班学生坐在预留位上
const isExternalInReserved = computed(() => {
  if (!props.student || !props.reservedInfo) return false
  return props.reservedInfo.allowExternalStudent
})

const statusClass = computed(() => {
  if (props.isBlocked) return 'esc-blocked'
  if (props.isBatchSelected) return 'esc-batch-selected'
  if (props.isSelected) return 'esc-selected'
  if (props.hasConflict) return 'esc-conflict'
  if (props.isLocked) return 'esc-locked'
  if (!props.student) {
    if (props.isReserved) {
      if (props.reservedInfo?.allowExternalStudent) return 'esc-reserved-ext'
      return 'esc-reserved'
    }
    if (props.isExclusive) return 'esc-exclusive'
    return 'esc-empty'
  }
  if (isExternalInReserved.value) return 'esc-external-reserved'
  if (props.seatStatus === 'absent') return 'esc-absent'
  if (props.seatStatus === 'special') return 'esc-special'
  return 'esc-occupied'
})
</script>

<style scoped>
.esc-root {
  width: 100%;
  height: 100%;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 8px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  transition: all 0.18s ease;
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 2px rgba(0,0,0,0.08);
  border: 1px solid var(--admin-border);
}

/* ---- 座号 ---- */
.esc-seatno {
  position: absolute;
  top: 2px;
  right: 3px;
  font-size: 8px;
  font-weight: 400;
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
  color: var(--admin-text-muted);
  opacity: 0.55;
  line-height: 1;
}

/* ---- 锁定图标 ---- */
.esc-lock-icon {
  position: absolute;
  top: 3px;
  left: 4px;
  color: #818cf8;
  opacity: 0.85;
  line-height: 1;
  z-index: 2;
  cursor: pointer;
  transition: opacity 0.15s;
}
.esc-lock-icon:hover { opacity: 1; }
.esc-unlock-icon { color: var(--admin-text-muted); opacity: 0.35; }
.esc-unlock-icon:hover { opacity: 0.7; color: var(--admin-accent-light); }

/* ---- 外班标记 ---- */
.esc-ext-indicator {
  position: absolute;
  top: 3px;
  left: 20px;
  font-size: 8px;
  color: #f97316;
  opacity: 0.85;
  z-index: 2;
}
.esc-ext-tag {
  font-size: 8px;
  color: #f97316;
  background: rgba(251,146,60,0.12);
  padding: 0 4px;
  border-radius: 2px;
  margin-top: 1px;
}

/* ---- 姓名 ---- */
.esc-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--admin-text);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

/* ---- 班级·选修 ---- */
.esc-meta {
  font-size: 9px;
  color: var(--admin-text-muted);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

/* ---- 空位 ---- */
.esc-empty {
  background: linear-gradient(180deg, rgba(255,255,255,0.012) 0%, rgba(0,0,0,0.01) 100%);
  border: 1px dashed var(--admin-border);
  box-shadow: none;
}
.esc-empty .esc-seatno {
  position: static;
  color: var(--admin-text-muted);
  font-size: 10px;
  font-weight: 700;
  opacity: 1;
}

/* ---- 已占 ---- */
.esc-occupied {
  background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%);
  border: 1px solid var(--admin-border-light);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 4px rgba(0,0,0,0.12);
}

/* ---- 屏蔽 ---- */
.esc-blocked {
  background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 100%);
  border: 1px solid var(--admin-border);
  box-shadow: none;
  cursor: not-allowed;
}
.esc-blocked-x {
  width: 14px; height: 14px;
  position: relative;
  opacity: 0.4;
}
.esc-blocked-x::before,
.esc-blocked-x::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 12px; height: 1.5px;
  background: #8899b4;
}
.esc-blocked-x::before { transform: translate(-50%, -50%) rotate(45deg); }
.esc-blocked-x::after { transform: translate(-50%, -50%) rotate(-45deg); }

/* ---- 缺考 ---- */
.esc-absent {
  background: linear-gradient(180deg, rgba(239,68,68,0.07) 0%, rgba(239,68,68,0.02) 100%);
  border: 1px solid rgba(239,68,68,0.2);
  border-left: 3px solid #ef4444;
}

/* ---- 特殊考生 ---- */
.esc-special {
  background: linear-gradient(180deg, rgba(245,158,11,0.07) 0%, rgba(245,158,11,0.02) 100%);
  border: 1px solid rgba(245,158,11,0.2);
  border-left: 3px solid #f59e0b;
}

/* ---- 预留座位（普通 · 浅橙色） ---- */
.esc-reserved {
  background: linear-gradient(180deg, rgba(251,146,60,0.08) 0%, rgba(251,146,60,0.03) 100%);
  border: 1px solid rgba(251,146,60,0.2);
  border-left: 3px solid #f97316;
}
.esc-reserved .esc-seatno {
  position: static;
  opacity: 1;
  font-weight: 700;
}
.esc-reserved-tag {
  font-size: 9px;
  color: #f97316;
  background: rgba(251,146,60,0.15);
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 500;
}

/* ---- 预留座位（允许外班 · 深橙色） ---- */
.esc-reserved-ext {
  background: linear-gradient(180deg, rgba(251,146,60,0.1) 0%, rgba(234,88,12,0.05) 100%);
  border: 1px solid rgba(251,146,60,0.3);
  border-left: 3px solid #ea580c;
}
.esc-reserved-ext .esc-seatno {
  position: static;
  opacity: 1;
  font-weight: 700;
}

/* ---- 外班学生坐预留位 · 橙色底 + 深橙边框 ---- */
.esc-external-reserved {
  background: linear-gradient(180deg, rgba(251,146,60,0.1) 0%, rgba(251,146,60,0.04) 100%);
  border: 1px solid rgba(251,146,60,0.25);
  border-left: 3px solid #ea580c;
}

/* ---- 专属班空位 ---- */
.esc-exclusive {
  background: linear-gradient(180deg, rgba(16,185,129,0.04) 0%, rgba(16,185,129,0.01) 100%);
  border: 1px solid rgba(16,185,129,0.12);
  border-left: 3px solid #10b981;
}

/* ---- 锁定 ---- */
.esc-locked {
  background: linear-gradient(180deg, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0.02) 100%);
  border: 1px solid rgba(99,102,241,0.18);
  border-left: 3px solid #6366f1;
}

/* ---- 冲突 ---- */
.esc-conflict {
  background: linear-gradient(180deg, rgba(239,68,68,0.05) 0%, rgba(239,68,68,0.01) 100%);
  border: 1px solid rgba(239,68,68,0.25);
  border-left: 3px solid #ef4444;
  animation: conflict-pulse 2s ease-in-out infinite;
}
@keyframes conflict-pulse {
  0%, 100% { border-left-color: #ef4444; }
  50% { border-left-color: rgba(239,68,68,0.25); }
}

/* ---- 选中（点击） ---- */
.esc-selected {
  background: linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.03) 100%);
  border: 1px solid #6366f1;
  outline: 2px solid var(--admin-accent-light);
  outline-offset: -2px;
  z-index: 1;
}

/* ---- 批量选中 ---- */
.esc-batch-selected {
  background: linear-gradient(180deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.02) 100%);
  border: 1px solid rgba(99,102,241,0.3);
  outline: 2px dashed var(--admin-accent-light);
  outline-offset: -2px;
  z-index: 1;
}

/* ---- 悬浮详情弹窗 ---- */
.esc-popup {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--admin-surface, #1e293b);
  border: 1px solid var(--admin-border, #334155);
  border-radius: 6px;
  padding: 8px 10px;
  min-width: 120px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.18s, visibility 0.18s;
  pointer-events: none;
}
.esc-root:hover .esc-popup {
  opacity: 1;
  visibility: visible;
}
.esc-popup-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 10px;
  padding: 2px 0;
}
.esc-popup-label { color: var(--admin-text-muted, #64748b); white-space: nowrap; }
.esc-popup-val { color: var(--admin-text, #e2e8f0); font-weight: 500; text-align: right; }
.esc-popup-status { color: var(--admin-warning, #f59e0b); }
</style>
