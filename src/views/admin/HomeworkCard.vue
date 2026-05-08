<template>
  <div class="hw-card" :class="{ expanded: isExpanded }">
    <div class="hw-card-strip" :style="{background: subjectColor(hw.subject)}"></div>
    <div class="hw-card-body">
      <div class="hw-card-top">
        <div class="hw-card-left">
          <span class="hw-card-subject-tag" :style="{background: subjectColor(hw.subject)}">{{ hw.subject }}</span>
          <span class="hw-card-title">{{ hw.title }}</span>
          <span v-if="hw.timeRange" class="hw-card-time">🕐 {{ hw.timeRange }}</span>
        </div>
        <div class="hw-card-right">
          <span class="admin-tag" :class="statusClass(hw.status)" style="font-size:11px">{{ hw.status }}</span>
          <span v-if="hw.score" class="hw-card-score">{{ hw.score }}</span>
        </div>
      </div>
      <div class="hw-card-meta">
        <span v-if="showStudent">{{ hw.studentName }} · </span>
        <span>{{ hw.class }}班</span>
        <span style="margin:0 6px;color:var(--admin-border)">|</span>
        <span>截止 {{ hw.dueDate }}</span>
        <span v-if="hw.submitTime" style="margin:0 6px;color:var(--admin-border)">|</span>
        <span v-if="hw.submitTime">提交于 {{ hw.submitTime }}</span>
      </div>
      <!-- Progress bar -->
      <div v-if="hw.totalCount > 0" class="hw-card-progress">
        <el-progress :percentage="Math.round((hw.completedCount || 0) / hw.totalCount * 100)" :stroke-width="6" :color="progressColor" :show-text="false" />
        <span style="font-size:10px;color:var(--admin-text-muted);margin-left:8px;white-space:nowrap">{{ hw.completedCount || 0 }}/{{ hw.totalCount }} 已提交</span>
      </div>
      <!-- Description (expandable) -->
      <div v-if="hw.description" class="hw-card-desc" :class="{ clamped: !isExpanded }" v-html="renderedDesc"></div>
      <div v-else-if="hw.content" class="hw-card-desc" style="color:var(--admin-text-muted)">{{ hw.content }}</div>
      <!-- Attachments -->
      <div v-if="hw.attachments && hw.attachments.length" class="hw-card-attachments">
        <img v-for="(att, i) in hw.attachments" :key="i" :src="att" class="hw-card-att-thumb" @click.stop="previewImage(att)" />
      </div>
      <!-- Actions -->
      <div class="hw-card-actions">
        <el-button v-if="hw.description && hw.description.length > 120" size="small" text @click.stop="isExpanded = !isExpanded">
          {{ isExpanded ? '收起 ▲' : '展开详情 ▼' }}
        </el-button>
        <span style="flex:1"></span>
        <el-button size="small" text type="primary" @click.stop="$emit('edit', hw)">编辑</el-button>
        <el-button size="small" text type="danger" @click.stop="$emit('delete', hw)">删除</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { renderRichContent } from '@/utils/renderContent'

const props = defineProps({
  hw: { type: Object, required: true },
  showStudent: { type: Boolean, default: false }
})

defineEmits(['edit', 'delete'])

const isExpanded = ref(false)

const subjectColorMap = { '数学':'#3b82f6', '中国语文':'#22c55e', '英国语文':'#8b5cf6', 'English Reading':'#8b5cf6', 'English Writing':'#a78bfa', 'English Listening':'#c4b5fd', 'English Speaking':'#ddd6fe', '物理':'#f59e0b', '化学':'#ef4444', '生物':'#10b981', '历史':'#78716c', '地理':'#06b6d4', '经济':'#f97316', '资讯及通讯科技':'#6366f1', '企业、会计与财务概论':'#14b8a6', '视觉艺术':'#ec4899', '体育':'#84cc16', '音乐':'#d946ef', '数学延伸M1':'#60a5fa', '数学延伸M2':'#93c5fd', '公民与社会发展':'#64748b' }
function subjectColor(s) { return subjectColorMap[s] || 'var(--admin-accent)' }
function statusClass(s) { return s === '已提交' ? 'success' : s === '迟交' ? 'warning' : 'danger' }

const progressColor = computed(() => {
  const pct = props.hw.totalCount > 0 ? (props.hw.completedCount || 0) / props.hw.totalCount * 100 : 0
  return pct >= 80 ? 'var(--admin-success)' : pct >= 50 ? 'var(--admin-warning)' : 'var(--admin-danger)'
})

const renderedDesc = computed(() => {
  if (!props.hw.description) return ''
  return renderRichContent(props.hw.description)
})

function previewImage(src) {
  const w = window.open('', '_blank')
  w.document.write(`<img src="${src}" style="max-width:100%;max-height:100vh;display:block;margin:auto">`)
  w.document.close()
}
</script>

<style scoped>
.hw-card {
  display: flex; background: var(--admin-surface); border: 1px solid var(--admin-border);
  border-radius: 8px; overflow: hidden; transition: all 0.15s; position: relative;
}
.hw-card:hover { border-color: var(--admin-accent); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.hw-card-strip { width: 4px; flex-shrink: 0; }
.hw-card-body { flex: 1; padding: 10px 14px; min-width: 0; }
.hw-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.hw-card-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
.hw-card-subject-tag { font-size: 10px; color: #fff; padding: 1px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
.hw-card-title { font-size: 13px; font-weight: 600; color: var(--admin-text); }
.hw-card-time { font-size: 11px; color: var(--admin-text-muted); white-space: nowrap; }
.hw-card-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.hw-card-score { font-size: 12px; font-weight: 700; color: var(--admin-accent); background: var(--admin-bg); padding: 1px 8px; border-radius: 10px; }
.hw-card-meta { font-size: 11px; color: var(--admin-text-muted); margin-top: 4px; }
.hw-card-progress { display: flex; align-items: center; margin-top: 8px; max-width: 300px; }
.hw-card-desc { font-size: 11px; line-height: 1.7; color: var(--admin-text-secondary); margin-top: 8px; }
.hw-card-desc.clamped { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hw-card-desc :deep(p) { margin: 2px 0; }
.hw-card-desc :deep(ul) { margin: 2px 0; padding-left: 1.5em; }
.hw-card-desc :deep(li) { margin: 1px 0; }
.hw-card-desc :deep(strong) { color: var(--admin-text); }
.hw-card-desc :deep(code) { background: var(--admin-bg); padding: 1px 5px; border-radius: 3px; font-size: 10px; }
.hw-card-attachments { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.hw-card-att-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid var(--admin-border); cursor: pointer; transition: transform 0.15s; }
.hw-card-att-thumb:hover { transform: scale(1.05); }
.hw-card-actions { display: flex; align-items: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--admin-border); gap: 4px; }
</style>
