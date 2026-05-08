<template>
  <div v-if="student">
    <div class="p-card" style="margin-bottom:16px">
      <div class="p-card-title">📝 我的作业</div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <button v-for="tab in tabs" :key="tab.key" class="ph-tab" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">{{ tab.label }} <span v-if="tab.count !== null" class="ph-tab-count">{{ tab.count }}</span></button>
      </div>

      <div v-if="filteredHomeworks.length === 0" class="ph-empty">{{ activeTab === 'done' ? '暂无已提交的作业' : '暂无待提交作业 🎉' }}</div>

      <div class="hw-card-list">
        <div v-for="h in filteredHomeworks" :key="h.id" class="hw-card" :class="{ overdue: h.dueDate < today && h.status !== '已提交' }">
          <div class="hw-card-left">
            <span class="hw-card-icon">{{ subjectIcon(h.subject) }}</span>
          </div>
          <div class="hw-card-body">
            <div class="hw-card-title-row">
              <span class="hw-card-title">{{ h.title }}</span>
              <span class="admin-tag" :class="h.status==='已提交'?'success':h.status==='迟交'?'warning':'danger'">{{ h.status }}</span>
            </div>
            <div class="hw-card-meta">
              <span>{{ h.subject }}</span>
              <span v-if="h.content" class="hw-card-content" :class="{ expanded: expandedHw.has(h.id) }" @click="toggleExpand(h.id)">{{ h.content }}</span>
            </div>
            <div class="hw-card-footer">
              <span class="hw-due" :class="{ overdue: h.dueDate < today && h.status !== '已提交' }">截止 {{ h.dueDate }}</span>
              <span v-if="h.submitTime" style="font-size:10px;color:var(--text-light)">提交于 {{ h.submitTime }}</span>
              <span v-if="h.score" class="hw-score">评分 {{ h.score }}</span>
              <el-button v-if="h.status === '未提交'" size="small" type="primary" text @click="toggleSubmit(h)">标记已提交</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-quote">📖 "日积月累，水滴石穿。今天的每一份努力，都在为明天的突破积蓄力量。"</div>
  </div>
  <div v-else class="ph-empty" style="padding:60px;text-align:center">正在加载学生数据...</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { homeworkService } from '@/services/dataService'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const today = new Date().toISOString().split('T')[0]
const allHomeworks = ref([])
const activeTab = ref('all')
const expandedHw = ref(new Set())

const tabs = computed(() => [
  { key: 'all', label: '全部', count: allHomeworks.value.length },
  { key: 'pending', label: '待提交', count: allHomeworks.value.filter(h => h.status === '未提交').length },
  { key: 'done', label: '已提交', count: allHomeworks.value.filter(h => h.status !== '未提交').length }
])

const filteredHomeworks = computed(() => {
  if (activeTab.value === 'pending') return allHomeworks.value.filter(h => h.status === '未提交')
  if (activeTab.value === 'done') return allHomeworks.value.filter(h => h.status !== '未提交')
  return [...allHomeworks.value].sort((a, b) => {
    if (a.status === '未提交' && b.status !== '未提交') return -1
    if (a.status !== '未提交' && b.status === '未提交') return 1
    return b.dueDate.localeCompare(a.dueDate)
  })
})

const iconMap = { '数学':'📐', '中国语文':'📝', '英国语文':'🔤', 'English Reading':'📖', 'English Writing':'✍️', 'English Listening':'🎧', 'English Speaking':'🗣️', '物理':'⚡', '化学':'🧪', '生物':'🧬', '历史':'📜', '地理':'🌍', '经济':'📈', '资讯及通讯科技':'💻', '企业、会计与财务概论':'📊', '视觉艺术':'🎨', '体育':'⚽', '音乐':'🎵', '数学延伸M1':'📐', '数学延伸M2':'📐' }
function subjectIcon(s) { return iconMap[s] || '📖' }

onMounted(() => {
  if (!store.currentStudentId) return
  allHomeworks.value = homeworkService.getByStudent(store.currentStudentId)
})

function toggleSubmit(h) {
  const now = new Date().toLocaleString('zh-CN')
  homeworkService.update(h.id, { status: '已提交', submitTime: now })
  allHomeworks.value = homeworkService.getByStudent(store.currentStudentId)
  ElMessage.success('已标记为已提交')
}

function toggleExpand(id) {
  if (expandedHw.value.has(id)) {
    expandedHw.value.delete(id)
  } else {
    expandedHw.value.add(id)
  }
}
</script>

<style scoped>
.p-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
.p-card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
.ph-empty { font-size: 12px; color: var(--text-light); padding: 20px 0; text-align: center; }
.ph-tab { padding: 4px 14px; border: 1px solid var(--border); background: var(--card-bg); border-radius: 20px; font-size: 12px; cursor: pointer; color: var(--text-light); transition: all 0.2s; }
.ph-tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.ph-tab-count { margin-left: 2px; font-size: 10px; opacity: 0.7; }

.hw-card-list { display: flex; flex-direction: column; gap: 10px; }
.hw-card { display: flex; gap: 14px; background: var(--bg); border-radius: 10px; padding: 14px; border: 1px solid var(--border); transition: border-color 0.2s; }
.hw-card:hover { border-color: var(--accent); }
.hw-card.overdue { border-left: 3px solid var(--danger); }
.hw-card-left { display: flex; align-items: flex-start; padding-top: 2px; }
.hw-card-icon { font-size: 24px; }
.hw-card-body { flex: 1; min-width: 0; }
.hw-card-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.hw-card-title { font-size: 14px; font-weight: 600; color: var(--text); }
.hw-card-meta { display: flex; gap: 12px; font-size: 11px; color: var(--text-light); margin-bottom: 6px; align-items: center; }
.hw-card-content { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.hw-card-content.expanded { white-space: normal; overflow: visible; }
.hw-card-footer { display: flex; align-items: center; gap: 12px; }
.hw-due { font-size: 11px; color: var(--text-light); }
.hw-due.overdue { color: var(--danger); font-weight: 600; }
.hw-score { font-size: 11px; color: var(--success); font-weight: 500; }

.p-quote { text-align: center; font-size: 13px; color: var(--accent); padding: 20px; font-style: italic; line-height: 1.8; }
</style>
