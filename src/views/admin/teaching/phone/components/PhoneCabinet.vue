<template>
  <div class="phcab-root">
    <!-- Class tabs -->
    <div class="phcab-tabs">
      <button
        v-for="cls in data.classList.value" :key="cls"
        class="phcab-tab" :class="{ active: data.cabinetClass.value === cls }"
        @click="data.cabinetClass.value = cls"
      >
        {{ cls }}班
        <span class="phcab-rate">{{ data.cabinetClassRate(cls) }}%</span>
      </button>
    </div>

    <div class="phcab-body" v-if="cabinetStudents.length && cabinetSlots.length">
      <!-- Legend -->
      <div class="phcab-legend">
        <span class="phcab-lg-item"><span class="phcab-lg-dot submitted"></span>已上交</span>
        <span class="phcab-lg-item"><span class="phcab-lg-dot not-submitted"></span>未上交</span>
        <span class="phcab-lg-item"><span class="phcab-lg-dot returned"></span>已领取</span>
        <span class="phcab-lg-item"><span class="phcab-lg-dot violation"></span>违纪</span>
        <span class="phcab-lg-item"><span class="phcab-lg-dot empty"></span>空位</span>
      </div>

      <!-- Grid -->
      <div class="phcab-grid">
        <div
          v-for="slot in cabinetSlots" :key="slot.index"
          class="phcab-cell"
          :class="'phcab-' + (slot.student ? data.cabinetStatus(slot.student.id) : 'empty')"
          @click="slot.student ? $emit('select', slot.student.id) : null"
          :title="slot.student ? (slot.student.name + ' — ' + data.cabinetStatusLabel(slot.student.id)) : ('空位 #' + slot.index)"
        >
          <span class="phcab-slot-num">{{ slot.index }}</span>
          <span v-if="slot.student" class="phcab-name">{{ slot.student.name }}</span>
          <span v-else class="phcab-empty-label">空</span>
        </div>
      </div>
    </div>

    <div v-else class="phcab-empty-state">
      {{ cabinetStudents.length ? '无可用柜位' : '请选择班级' }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ data: { type: Object, required: true } })
defineEmits(['select'])

const CABINET_SLOTS = 48

const cabinetStudents = computed(() => {
  const cls = props.data.cabinetClass.value
  if (!cls) return []
  return props.data.students.value
    .filter(s => s.class === cls)
    .sort((a, b) => a.name.localeCompare(b.name))
})

const cabinetSlots = computed(() => {
  const cls = props.data.cabinetClass.value
  if (!cls) return []
  const slots = []
  for (let i = 1; i <= CABINET_SLOTS; i++) {
    slots.push({ index: i, student: cabinetStudents.value[i - 1] || null })
  }
  return slots
})
</script>

<style scoped>
.phcab-root {
  display: flex; flex-direction: column; gap: 8px; height: 100%;
}

.phcab-tabs {
  display: flex; gap: 4px; flex-wrap: wrap; flex-shrink: 0;
}
.phcab-tab {
  padding: 5px 12px; border: 1px solid var(--admin-border);
  background: var(--admin-surface); border-radius: 6px;
  font-size: 11px; cursor: pointer; color: var(--admin-text-muted);
  transition: all 0.15s; font-family: var(--admin-font);
}
.phcab-tab:hover { border-color: var(--admin-accent); }
.phcab-tab.active { background: var(--admin-accent); color: #fff; border-color: var(--admin-accent); }
.phcab-rate { font-size: 10px; opacity: 0.7; margin-left: 4px; }

.phcab-body {
  flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
  background: var(--admin-surface); border: 1px solid var(--admin-border);
  border-radius: 10px; padding: 12px;
}

/* Legend */
.phcab-legend { display: flex; gap: 12px; flex-wrap: wrap; flex-shrink: 0; }
.phcab-lg-item { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--admin-text-muted); }
.phcab-lg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.phcab-lg-dot.submitted { background: var(--admin-success); }
.phcab-lg-dot.not-submitted { background: var(--admin-danger); }
.phcab-lg-dot.returned { background: var(--admin-primary); }
.phcab-lg-dot.violation { background: var(--admin-warning); }
.phcab-lg-dot.empty { background: var(--admin-border); }

/* Grid */
.phcab-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px; align-content: start;
}
.phcab-cell {
  padding: 5px 2px; border-radius: 7px; cursor: pointer;
  text-align: center; transition: all 0.15s;
  border: 2px solid transparent; display: flex;
  flex-direction: column; align-items: center; gap: 1px;
  min-height: 48px; justify-content: center;
  position: relative;
}
.phcab-cell:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
.phcab-submitted { background: rgba(16,185,129,0.1); border-color: var(--admin-success); }
.phcab-not-submitted { background: rgba(239,68,68,0.06); border-color: var(--admin-danger); }
.phcab-returned { background: rgba(59,130,246,0.06); border-color: var(--admin-primary); }
.phcab-violation { background: rgba(245,158,11,0.08); border-color: var(--admin-warning); }
.phcab-no-reg { background: var(--admin-bg); border-color: var(--admin-border); opacity: 0.6; }
.phcab-empty { background: var(--admin-bg); border-color: var(--admin-border); opacity: 0.35; cursor: default; }
.phcab-empty:hover { opacity: 0.45; transform: none; box-shadow: none; }

.phcab-slot-num {
  position: absolute; top: 1px; left: 4px;
  font-size: 8px; color: var(--admin-text-muted); font-family: monospace;
}
.phcab-name { font-size: 11px; font-weight: 600; color: var(--admin-text); line-height: 1.2; }
.phcab-empty-label { font-size: 10px; color: var(--admin-text-muted); }

.phcab-empty-state {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--admin-text-muted);
  background: var(--admin-surface); border: 1px solid var(--admin-border);
  border-radius: 10px;
}
</style>
