<template>
  <div
    class="seat-card"
    :class="{
      occupied: !!student,
      empty: !student,
      locked: assignment?.locked,
      conflict: hasConflict,
      blocked: isBlocked,
      selected: isSelected,
      exclusive: isExclusive
    }"
    :data-room-id="roomId"
    :data-seat-index="seatIndex"
    :title="seatTooltip"
    @click.stop="$emit('clickSeat', roomId, seatIndex)"
    @contextmenu.prevent="$emit('contextmenu', $event, roomId, seatIndex)"
  >
    <!-- 屏蔽座位 -->
    <template v-if="isBlocked">
      <span class="seat-blocked-icon"></span>
    </template>

    <!-- 空位 -->
    <template v-else-if="!student">
      <span class="seat-coord">{{ colLabel }}{{ row }}</span>
    </template>

    <!-- 已占座位 -->
    <template v-else>
      <span class="seat-class-strip" :style="{ background: classColor }"></span>
      <span class="seat-name">{{ student.name }}</span>
      <span class="seat-coord-sm">{{ colLabel }}{{ row }}</span>
      <div class="seat-detail">
        <span v-if="student.className" class="seat-class">{{ student.className }}</span>
        <span v-if="student.electives?.length" class="seat-electives" :class="{ 'elec-compact': hasLongElectives(student.electives) }">
          {{ student.electives.slice(0, 2).join(' / ') }}
        </span>
      </div>
      <div class="seat-actions">
        <button
          class="seat-act-btn seat-act-lock"
          :class="{ locked: assignment?.locked }"
          @click.stop="$emit('toggleLock', roomId, seatIndex)"
          :title="assignment?.locked ? '点击解锁（锁定后不可拖拽/自动重排）' : '点击锁定（防止拖拽和自动重排）'"
        >{{ assignment?.locked ? '🔒' : '🔓' }}</button>
        <button v-if="!assignment?.locked" class="seat-act-btn seat-act-remove" @click.stop="$emit('remove')" title="移除">&#10005;</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  roomId: { type: Number, required: true },
  seatIndex: { type: Number, required: true },
  row: { type: Number, required: true },
  col: { type: Number, required: true },
  student: { type: Object, default: null },
  assignment: { type: Object, default: null },
  hasConflict: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isSelected: { type: Boolean, default: false },
  isExclusive: { type: Boolean, default: false },
  isDoorSeat: { type: Boolean, default: false },
  classColor: { type: String, default: 'transparent' }
})

defineEmits(['remove', 'clickSeat', 'contextmenu', 'toggleLock'])

const colLabel = computed(() => String.fromCharCode(64 + props.col))

function hasLongElectives(electives) {
  if (!electives?.length) return false
  const top2 = electives.slice(0, 2)
  return top2.some(e => e.length >= 4) || top2.join(' / ').length > 8
}

const seatTooltip = computed(() => {
  if (props.isBlocked) return '已屏蔽座位'
  if (!props.student) return `${colLabel.value}${props.row}（空位）`
  let tip = `${props.student.name} · ${colLabel.value}${props.row}`
  if (props.student.className) tip += ` · ${props.student.className}`
  if (props.student.classNo) tip += ` · 学号: ${props.student.classNo}`
  return tip
})
</script>

<style scoped>
.seat-card {
  width: 100%;
  height: 100%;
  min-height: 64px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  user-select: none;
  overflow: hidden;
  padding: 4px 6px;
  gap: 1px;
}

/* ---- 空位 ---- */
.seat-card.empty {
  background: var(--es-seat-empty-bg, rgba(255,255,255,0.015));
  border: 1px dashed var(--es-seat-empty-border, rgba(255,255,255,0.08));
}
.seat-card.empty:hover {
  background: var(--es-seat-hover-bg, rgba(255,255,255,0.04));
  border-color: var(--es-seat-empty-border-hover, rgba(255,255,255,0.16));
}
.seat-coord {
  font-size: 10px;
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
  color: var(--es-text-muted);
  opacity: 0.4;
  letter-spacing: 1px;
}

/* ---- 班级色条 ---- */
.seat-class-strip {
  position: absolute;
  left: 0; top: 4px; bottom: 4px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  opacity: 0.55;
  z-index: 1;
  transition: opacity 0.2s, top 0.15s, bottom 0.15s;
}
.seat-card:hover .seat-class-strip {
  opacity: 1;
}

/* ---- 已占 ---- */
.seat-card.occupied {
  background: var(--es-seat-occupied-bg, rgba(255,255,255,0.025));
  border: 1px solid var(--es-seat-occupied-border, rgba(255,255,255,0.09));
  cursor: grab;
}
.seat-card.occupied:hover {
  border-color: var(--es-seat-occupied-border-hover, rgba(255,255,255,0.22));
  box-shadow: 0 3px 14px rgba(0,0,0,0.35);
  z-index: 3;
}
.seat-card.occupied:active { cursor: grabbing; }

/* ---- 锁定 ---- */
.seat-card.locked {
  border-color: var(--es-seat-locked-border, rgba(91,91,206,0.3));
  background: var(--es-seat-locked-bg, rgba(91,91,206,0.04));
  cursor: default;
}
.seat-card.locked:hover { border-color: var(--es-seat-locked-border-hover, rgba(91,91,206,0.5)); }
.seat-card.locked .seat-class-strip { opacity: 0.35; }

/* ---- 冲突 ---- */
.seat-card.conflict {
  border-color: var(--es-seat-conflict-border, var(--es-vermillion));
  background: var(--es-seat-conflict-bg, rgba(196,30,58,0.06));
  animation: seat-pulse-conflict 2.2s ease-in-out infinite;
}
@keyframes seat-pulse-conflict {
  0%, 100% { box-shadow: 0 0 0 0 rgba(196,30,58,0); }
  50% { box-shadow: 0 0 0 4px rgba(196,30,58,0.15), 0 0 12px rgba(196,30,58,0.06); }
}

/* ---- 选中 ---- */
.seat-card.selected {
  border-color: var(--es-seat-selected-border, var(--es-gold)) !important;
  box-shadow: 0 0 0 3px var(--es-seat-selected-glow, rgba(201,168,76,0.25)), 0 0 18px var(--es-seat-selected-glow, rgba(201,168,76,0.08));
  z-index: 5;
  transform: translateY(-2px);
}
.seat-card.selected.occupied {
  background: var(--es-seat-selected-bg, rgba(201,168,76,0.06));
}

/* ---- 屏蔽 ---- */
.seat-card.blocked {
  background: var(--es-seat-blocked-bg, rgba(255,255,255,0.015));
  border: 1px dashed var(--es-seat-blocked-border, rgba(196,30,58,0.15));
  cursor: not-allowed;
}
.seat-blocked-icon {
  width: 14px; height: 14px;
  position: relative;
  opacity: 0.3;
}
.seat-blocked-icon::before,
.seat-blocked-icon::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 12px; height: 1.5px;
  background: var(--es-text-muted);
}
.seat-blocked-icon::before { transform: translate(-50%, -50%) rotate(45deg); }
.seat-blocked-icon::after { transform: translate(-50%, -50%) rotate(-45deg); }

/* ---- 专属班级座位 ---- */
.seat-card.exclusive {
  background: var(--es-seat-exclusive-bg, rgba(45,138,78,0.04));
  border-color: var(--es-seat-exclusive-border, rgba(45,138,78,0.12));
}

/* ---- 姓名（默认可见） ---- */
.seat-name {
  font-weight: 700;
  font-size: 12px;
  color: var(--es-text);
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 1;
}

/* ---- 座号（右下角，默认可见） ---- */
.seat-coord-sm {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 8px;
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
  color: var(--es-text-muted);
  opacity: 0.35;
  z-index: 1;
  letter-spacing: 0.5px;
}

/* ---- 详情行（始终可见） ---- */
.seat-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  max-height: 18px;
  opacity: 1;
  overflow: hidden;
  z-index: 1;
  margin-top: 1px;
  flex-shrink: 0;
}
.seat-class {
  font-size: 9px;
  color: var(--es-text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}
.seat-electives {
  font-size: 8px;
  color: var(--es-text-muted);
  white-space: nowrap;
  padding: 0 3px;
  background: var(--es-gold-dim);
  border-radius: 2px;
  line-height: 1.5;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.seat-electives.elec-compact {
  font-size: 7px;
  padding: 0 2px;
}

/* ---- 操作按钮（hover 显示） ---- */
.seat-actions {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  gap: 1px;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 2;
}
.seat-card:hover .seat-actions,
.seat-card.selected .seat-actions { opacity: 1; }
.seat-act-btn {
  width: 18px; height: 18px;
  border: none;
  background: rgba(0,0,0,0.45);
  color: rgba(255,255,255,0.7);
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  transition: background 0.12s;
}
.seat-act-btn:hover { background: rgba(0,0,0,0.75); color: #fff; }
.seat-act-lock { font-size: 12px; }
.seat-act-lock.locked { background: rgba(91,91,206,0.5); }
.seat-act-lock.locked:hover { background: rgba(91,91,206,0.8); }
.seat-act-remove:hover { background: rgba(220,38,38,0.8) !important; }
</style>
