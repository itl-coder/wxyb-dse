<template>
  <div class="fpl" :class="{ 'fpl-mobile': isMobile }">
    <aside class="fpl-left" :style="{ width: isMobile ? '100%' : leftWidth + 'px' }">
      <div v-if="isMobile" class="fpl-toggle" @click="showNav = !showNav">
        {{ showNav ? '✕ 关闭导航' : '☰ 公式导航' }}
      </div>
      <div v-if="!isMobile || showNav" class="fpl-left-inner">
        <slot name="left" />
      </div>
    </aside>

    <div
      v-if="!isMobile"
      class="fpl-resizer fpl-resizer-l"
      @mousedown.prevent="startResize('left', $event)"
    ></div>

    <main class="fpl-center">
      <slot name="center" />
    </main>

    <div
      v-if="!isMobile"
      class="fpl-resizer fpl-resizer-r"
      @mousedown.prevent="startResize('right', $event)"
    ></div>

    <aside class="fpl-right" :style="{ width: isMobile ? '100%' : rightWidth + 'px' }">
      <div v-if="isMobile" class="fpl-toggle" @click="showSidebar = !showSidebar">
        {{ showSidebar ? '✕ 关闭详情' : '📋 公式详情' }}
      </div>
      <div v-if="!isMobile || showSidebar" class="fpl-right-inner">
        <slot name="right" />
      </div>
    </aside>
  </div>
</template>

<script setup>
/**
 * 模块：FormulaPageLayout
 * 功能：公式页面三段式布局（左导航 / 中主内容 / 右详情），支持拖拽调整面板宽度和移动端折叠适配
 * 使用位置：公式库、知识点等需要左侧导航 + 右侧详情辅助的内容展示页面
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  leftInitialWidth: { type: Number, default: 240 },
  rightInitialWidth: { type: Number, default: 280 }
})

const leftWidth = ref(props.leftInitialWidth)
const rightWidth = ref(props.rightInitialWidth)
const isMobile = ref(false)
const showNav = ref(false)
const showSidebar = ref(false)

let resizeType = null
let startX = 0
let startW = 0

function checkMobile() {
  isMobile.value = window.innerWidth < 900
}

function startResize(type, e) {
  resizeType = type
  startX = e.clientX
  startW = type === 'left' ? leftWidth.value : rightWidth.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

function onResize(e) {
  const delta = e.clientX - startX
  if (resizeType === 'left') {
    leftWidth.value = Math.max(180, Math.min(400, startW + delta))
  } else {
    rightWidth.value = Math.max(200, Math.min(450, startW - delta))
  }
}

function stopResize() {
  resizeType = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.fpl {
  display: flex;
  gap: 0;
  height: 100%;
  min-height: 400px;
}

.fpl-left {
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid var(--admin-border);
  background: var(--admin-surface);
}

.fpl-left-inner,
.fpl-right-inner {
  padding: 12px;
}

.fpl-center {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  min-width: 0;
}

.fpl-right {
  flex-shrink: 0;
  overflow-y: auto;
  border-left: 1px solid var(--admin-border);
  background: var(--admin-surface);
}

.fpl-resizer {
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.fpl-resizer:hover {
  background: var(--admin-accent, #6366f1);
}

.fpl-toggle {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  color: var(--admin-accent, #6366f1);
  font-weight: 600;
  border-bottom: 1px solid var(--admin-border);
  user-select: none;
}

.fpl-toggle:hover {
  background: var(--admin-surface-hover);
}

/* Mobile */
@media (max-width: 900px) {
  .fpl.fpl-mobile {
    flex-direction: column;
  }

  .fpl-mobile .fpl-left,
  .fpl-mobile .fpl-right {
    width: 100% !important;
    border: none;
    border-bottom: 1px solid var(--admin-border);
  }

  .fpl-mobile .fpl-center {
    order: 1;
  }

  .fpl-mobile .fpl-left {
    order: 0;
  }

  .fpl-mobile .fpl-right {
    order: 2;
  }
}
</style>
