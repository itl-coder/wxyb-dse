<template>
  <div
    class="seat-card"
    :class="{
      occupied: !!student,
      empty: !student,
      locked: assignment?.locked,
      conflict: hasConflict,
      blocked: isBlocked,
      selected: isSelected
    }"
    :data-room-id="roomId"
    :data-seat-index="seatIndex"
    :title="isBlocked ? '已屏蔽座位' : student ? `${student.name} · ${student.className || ''} · ${colLabel}${row}` : `${colLabel}${row}`"
    @click.stop="$emit('clickSeat', roomId, seatIndex)"
    @contextmenu.prevent="$emit('contextmenu', $event, roomId, seatIndex)"
  >
    <!-- 屏蔽座位 -->
    <template v-if="isBlocked">
      <span class="seat-blocked-x">✕</span>
    </template>

    <!-- 空位：坐标号 -->
    <template v-else-if="!student">
      <span class="seat-coord">{{ colLabel }}{{ row }}</span>
    </template>

    <!-- 已占：考生桌位 -->
    <template v-else>
      <div class="seat-top-bar" :class="{ locked: assignment?.locked }"></div>
      <span class="seat-name">{{ student.name }}</span>
      <span class="seat-class">{{ student.className }}{{ student.classNo ? '·' + student.classNo : '' }}</span>
      <div class="seat-elective-row" v-if="student.electives?.length">
        <span class="seat-elective-tag" v-for="e in student.electives" :key="e">{{ e }}</span>
      </div>
      <!-- 悬浮信息卡 -->
      <div class="seat-tooltip">
        <div class="stt-name">{{ student.name }}</div>
        <div class="stt-row"><span class="stt-label">班级</span><span>{{ student.className || '—' }}</span></div>
        <div class="stt-row" v-if="student.classNo"><span class="stt-label">学号</span><span>{{ student.classNo }}</span></div>
        <div class="stt-row" v-if="student.electives?.length"><span class="stt-label">选修</span><span>{{ student.electives.join('、') }}</span></div>
      </div>
      <!-- 操作 -->
      <div class="seat-actions">
        <button class="seat-act-btn" @click.stop="$emit('toggleLock')" :title="assignment?.locked ? '解锁' : '锁定'">
          {{ assignment?.locked ? '🔒' : '🔓' }}
        </button>
        <button v-if="!assignment?.locked" class="seat-act-btn seat-act-remove" @click.stop="$emit('remove')" title="移除">
          ✕
        </button>
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
  isSelected: { type: Boolean, default: false }
})

defineEmits(['toggleLock', 'remove', 'clickSeat', 'contextmenu'])

const colLabel = computed(() => String.fromCharCode(64 + props.col))
</script>

<style scoped>
.seat-card {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 7px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  user-select: none;
  overflow: hidden;
}

/* 空位 */
.seat-card.empty {
  background: rgba(255,255,255,0.025);
  border: 1px dashed rgba(255,255,255,0.1);
}
.seat-card.empty:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.18);
}
.seat-coord {
  font-size: 10px;
  font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
  color: rgba(255,255,255,0.22);
  letter-spacing: 1px;
}

/* 已占座位 — 玉色桌位 */
.seat-card.occupied {
  background: linear-gradient(160deg, rgba(45,138,78,0.08) 0%, rgba(45,138,78,0.03) 100%);
  border: 1px solid rgba(45,138,78,0.22);
  cursor: grab;
}
.seat-card.occupied:hover {
  border-color: rgba(45,138,78,0.5);
  background: linear-gradient(160deg, rgba(45,138,78,0.14) 0%, rgba(45,138,78,0.06) 100%);
  box-shadow: 0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02);
}

/* 顶部横条 — 模拟桌沿 */
.seat-top-bar {
  position: absolute;
  top: 0; left: 8px; right: 8px;
  height: 2px;
  border-radius: 0 0 2px 2px;
  background: rgba(45,138,78,0.3);
  transition: background 0.2s;
}
.seat-top-bar.locked { background: rgba(91,91,206,0.5); }

/* 锁定态 */
.seat-card.locked {
  border-color: rgba(91,91,206,0.45);
  background: linear-gradient(160deg, rgba(91,91,206,0.08) 0%, rgba(91,91,206,0.03) 100%);
  cursor: default;
}
.seat-card.locked:hover {
  border-color: rgba(91,91,206,0.6);
}

/* 冲突态 — 朱砂脉动 */
.seat-card.conflict {
  border-color: var(--es-vermillion);
  background: linear-gradient(160deg, rgba(196,30,58,0.12) 0%, rgba(196,30,58,0.04) 100%);
  animation: es-pulse-conflict 2s ease-in-out infinite;
}
.seat-card.conflict .seat-top-bar { background: var(--es-vermillion); }

/* 内容排版 */
.seat-name {
  font-weight: 600;
  font-size: 12px;
  color: var(--es-text);
  line-height: 1.3;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  z-index: 1;
}
.seat-class {
  font-size: 9px;
  color: var(--es-text-secondary);
  margin-top: 1px;
  z-index: 1;
}
.seat-elective-row {
  display: flex;
  gap: 2px;
  margin-top: 2px;
  flex-wrap: wrap;
  justify-content: center;
  z-index: 1;
}
.seat-elective-tag {
  font-size: 8px;
  padding: 0 3px;
  border-radius: 2px;
  background: rgba(201,168,76,0.1);
  color: var(--es-gold);
  line-height: 1.6;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮 */
.seat-actions {
  position: absolute;
  top: 3px;
  right: 3px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 2;
}
.seat-card:hover .seat-actions { opacity: 1; }
.seat-act-btn {
  width: 17px;
  height: 17px;
  border: none;
  background: rgba(0,0,0,0.45);
  color: rgba(255,255,255,0.7);
  border-radius: 3px;
  cursor: pointer;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  backdrop-filter: blur(2px);
}
.seat-act-btn:hover { background: rgba(0,0,0,0.7); color: #fff; }
.seat-act-remove:hover { background: rgba(196,30,58,0.8); }

/* 屏蔽座位 */
.seat-card.blocked {
  background: rgba(196,30,58,0.06);
  border: 1px dashed rgba(196,30,58,0.25);
  cursor: not-allowed;
  pointer-events: auto;
}
.seat-card.blocked:hover {
  background: rgba(196,30,58,0.1);
  border-color: rgba(196,30,58,0.35);
}
.seat-blocked-x {
  font-size: 18px;
  color: rgba(196,30,58,0.45);
  font-weight: 700;
  line-height: 1;
}

/* 选中态 — 金色发光边框 */
.seat-card.selected {
  border-color: var(--es-gold);
  box-shadow: 0 0 0 2px rgba(201,168,76,0.35), 0 0 14px rgba(201,168,76,0.18);
  z-index: 5;
  position: relative;
}
.seat-card.selected.occupied {
  background: linear-gradient(160deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.03) 100%);
}

/* 悬浮信息卡 */
.seat-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #0d1020;
  border: 1px solid rgba(201,168,76,0.25);
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 140px;
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.18s, visibility 0.18s;
  pointer-events: none;
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
}
.seat-card:hover .seat-tooltip {
  opacity: 1;
  visibility: visible;
}
.seat-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(201,168,76,0.25);
}
.stt-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--es-gold);
  margin-bottom: 6px;
  text-align: center;
  letter-spacing: 0.5px;
}
.stt-row {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--es-text-secondary);
  margin-bottom: 2px;
  align-items: baseline;
}
.stt-label {
  color: var(--es-text-muted);
  font-size: 10px;
  min-width: 28px;
  flex-shrink: 0;
}
</style>
