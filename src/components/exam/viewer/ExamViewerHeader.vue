<template>
  <header class="evh-root">
    <h1 class="evh-title">{{ title }}</h1>
    <div class="evh-meta">
      <span>{{ roomName }}</span>
      <span class="evh-sep">·</span>
      <span>{{ studentCount }} 人</span>
      <span class="evh-sep">·</span>
      <span>NO. {{ roomIndex }}</span>
      <span class="evh-sep">·</span>
      <span>{{ rows }}行 x {{ cols }}列</span>
    </div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, default: '考试座位表' },
  roomName: { type: String, default: '' },
  studentCount: { type: Number, default: 0 },
  roomIndex: { type: Number, default: 1 },
  rows: { type: Number, default: 0 },
  cols: { type: Number, default: 0 }
})
</script>

<style>
.evh-root {
  text-align: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 2px solid #000;
}
.evh-title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 3px;
  color: #000;
  font-family: "Noto Serif SC", "STSong", "SimSun", serif;
}
.evh-meta {
  font-size: 9px;
  color: #444;
}
.evh-sep {
  margin: 0 4px;
  color: #bbb;
}
</style>
