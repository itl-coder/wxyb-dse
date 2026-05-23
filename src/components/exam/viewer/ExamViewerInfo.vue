<template>
  <div class="evi-root">
    <div class="evi-row">
      <span class="evi-item"><b>科目</b> {{ examSubject }}</span>
      <span class="evi-sep">|</span>
      <span class="evi-item"><b>日期</b> {{ examDate }}</span>
      <span class="evi-sep">|</span>
      <span class="evi-item"><b>时间</b> {{ examTime }}</span>
    </div>
    <div class="evi-row">
      <span class="evi-item"><b>教室</b> {{ roomName }}</span>
      <span class="evi-sep">|</span>
      <span class="evi-item"><b>监考</b> {{ proctor }}</span>
      <span class="evi-sep">|</span>
      <span class="evi-item"><b>类型</b> {{ roomType }}</span>
    </div>
    <div class="evi-status">
      <span class="evi-badge">{{ statusText }}</span>
      <span class="evi-badge evi-badge-door">{{ doorArrow }} 前门进场</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  examSubject: { type: String, default: '—' },
  examDate: { type: String, default: '—' },
  examTime: { type: String, default: '—' },
  roomName: { type: String, default: '—' },
  proctor: { type: String, default: '—' },
  roomType: { type: String, default: '混合编排' },
  statusText: { type: String, default: '未开始' },
  doorArrow: { type: String, default: '→' }
})
</script>

<style>
.evi-root {
  margin-bottom: 6px;
}
.evi-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  font-size: 9px;
  color: #444;
  line-height: 1.7;
}
.evi-row b {
  color: #000;
  font-weight: 600;
}
.evi-sep {
  color: #ccc;
  margin: 0 6px;
}
.evi-item {
  white-space: nowrap;
}
.evi-status {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 2px;
}
.evi-badge {
  display: inline-block;
  padding: 1px 8px;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1px solid #999;
  color: #444;
}
.evi-badge-door {
  border-style: dashed;
  font-weight: 400;
}
</style>
