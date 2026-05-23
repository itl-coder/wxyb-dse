<template>
  <div class="hw-detail" v-if="assignment">
    <!-- 头部 -->
    <div class="hw-detail-header">
      <div class="hw-detail-back" @click="$emit('close')">
        <span class="hw-detail-back-arrow">←</span> 返回列表
      </div>
      <div class="hw-detail-meta">
        <span class="hw-detail-subject" :style="{ color: shared.subjectColor(assignment.subject) }">
          {{ assignment.subject }}
        </span>
        <span class="hw-detail-class">{{ assignment.class }}班</span>
        <span class="hw-detail-date">{{ assignment.dueDate }}</span>
      </div>
      <h2 class="hw-detail-title">{{ assignment.title }}</h2>
      <div class="hw-detail-teacher">布置：{{ assignment.teacher }} · {{ assignment.timeRange || '全天' }}</div>
    </div>

    <!-- 内容区 -->
    <div class="hw-detail-body">
      <div class="hw-detail-section" v-if="assignment.content">
        <h3>作业内容</h3>
        <div class="hw-detail-content">{{ assignment.content }}</div>
      </div>
      <div class="hw-detail-section" v-if="assignment.description">
        <h3>详细描述</h3>
        <div class="hw-detail-content">{{ assignment.description }}</div>
      </div>
      <div class="hw-detail-section" v-if="assignment.notes">
        <h3>备注</h3>
        <div class="hw-detail-content">{{ assignment.notes }}</div>
      </div>
    </div>

    <!-- 提交统计 -->
    <div class="hw-detail-stats">
      <h3>提交统计</h3>
      <div class="hw-detail-stat-cards">
        <div class="hw-detail-stat">
          <div class="hw-detail-stat-val hw-ds-total">{{ stats.total }}</div>
          <div class="hw-detail-stat-lbl">应提交</div>
        </div>
        <div class="hw-detail-stat">
          <div class="hw-detail-stat-val hw-ds-done">{{ stats.submitted }}</div>
          <div class="hw-detail-stat-lbl">已提交</div>
        </div>
        <div class="hw-detail-stat">
          <div class="hw-detail-stat-val hw-ds-pending">{{ stats.pending }}</div>
          <div class="hw-detail-stat-lbl">未提交</div>
        </div>
        <div class="hw-detail-stat">
          <div class="hw-detail-stat-val hw-ds-rate">{{ stats.submitRate }}%</div>
          <div class="hw-detail-stat-lbl">提交率</div>
        </div>
        <div class="hw-detail-stat">
          <div class="hw-detail-stat-val hw-ds-avg">{{ stats.avgAccuracy }}%</div>
          <div class="hw-detail-stat-lbl">平均正确率</div>
        </div>
      </div>
    </div>

    <!-- 学生提交明细 -->
    <div class="hw-detail-section">
      <h3>学生提交明细</h3>
      <el-table :data="studentDetails" border stripe size="small" max-height="300" class="hw-detail-table">
        <el-table-column prop="studentName" label="姓名" width="80" />
        <el-table-column prop="submitStatus" label="提交" width="72" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.submitStatus === '已提交' || row.submitStatus === '已批改' ? 'var(--admin-success)' : 'var(--admin-danger)' }">
              {{ row.submitStatus || '—' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="quality" label="质量" width="72" align="center" />
        <el-table-column prop="accuracy" label="正确率" width="72" align="center">
          <template #default="{ row }">
            <span v-if="row.accuracy != null" :style="{ color: row.accuracy >= 80 ? 'var(--admin-success)' : row.accuracy >= 60 ? 'var(--admin-warning)' : 'var(--admin-danger)' }">
              {{ row.accuracy }}%
            </span>
            <span v-else style="color:var(--admin-text-muted)">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="errorSummary" label="错题总结" min-width="120" show-overflow-tooltip />
        <el-table-column prop="teacherComment" label="点评" min-width="120" show-overflow-tooltip />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { homeworkService } from '@/services/dataService'
import { useHomeworkShared } from '@/views/admin/homework/composables/useHomeworkShared'

const props = defineProps({
  assignment: { type: Object, default: null },
  homeworks: { type: Array, default: () => [] }
})

defineEmits(['close'])
const shared = useHomeworkShared()

const studentDetails = computed(() => {
  if (!props.assignment) return []
  return props.homeworks.filter(h => h.assignmentId === props.assignment.id)
})

const stats = computed(() => {
  const list = studentDetails.value
  const total = list.length
  const submitted = list.filter(h => h.submitStatus === '已提交' || h.submitStatus === '已批改').length
  const pending = total - submitted
  const submitRate = total ? Math.round((submitted / total) * 100) : 0
  const accVals = list.filter(h => h.accuracy != null).map(h => h.accuracy)
  const avgAccuracy = accVals.length ? Math.round(accVals.reduce((s, v) => s + v, 0) / accVals.length) : 0
  return { total, submitted, pending, submitRate, avgAccuracy }
})
</script>

<style scoped>
.hw-detail {
  display: flex; flex-direction: column; gap: 16px;
  padding: 4px 0 0;
  height: 100%; overflow-y: auto;
}

.hw-detail-header {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--admin-border);
}
.hw-detail-back {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--admin-accent); cursor: pointer;
  margin-bottom: 10px; user-select: none;
}
.hw-detail-back:hover { opacity: 0.8; }
.hw-detail-back-arrow { font-size: 14px; }

.hw-detail-meta {
  display: flex; gap: 10px; align-items: center;
  font-size: 11px; color: var(--admin-text-muted); margin-bottom: 6px;
}
.hw-detail-subject { font-weight: 700; font-size: 12px; }
.hw-detail-class { font-weight: 500; }
.hw-detail-title {
  font-size: 18px; font-weight: 700; color: var(--admin-text);
  margin: 4px 0;
}
.hw-detail-teacher { font-size: 11px; color: var(--admin-text-muted); }

/* Content */
.hw-detail-body { display: flex; flex-direction: column; gap: 12px; }
.hw-detail-section h3 {
  font-size: 12px; font-weight: 700; color: var(--admin-text);
  margin: 0 0 8px; padding-bottom: 6px;
  border-bottom: 1px solid var(--admin-border);
}
.hw-detail-content {
  font-size: 12px; color: var(--admin-text-secondary); line-height: 1.7;
  padding: 10px 14px; background: var(--admin-bg);
  border-radius: 8px; border: 1px solid var(--admin-border);
  white-space: pre-wrap;
}

/* Stats */
.hw-detail-stats h3 {
  font-size: 12px; font-weight: 700; color: var(--admin-text);
  margin: 0 0 8px;
}
.hw-detail-stat-cards {
  display: flex; gap: 10px; flex-wrap: wrap;
}
.hw-detail-stat {
  flex: 1; min-width: 80px;
  text-align: center; padding: 12px 8px;
  background: var(--admin-bg); border: 1px solid var(--admin-border);
  border-radius: 8px;
}
.hw-detail-stat-val { font-size: 22px; font-weight: 700; }
.hw-detail-stat-lbl { font-size: 10px; color: var(--admin-text-muted); margin-top: 4px; }

.hw-ds-total { color: var(--admin-accent); }
.hw-ds-done { color: var(--admin-success); }
.hw-ds-pending { color: var(--admin-danger); }
.hw-ds-rate { color: var(--admin-warning); }
.hw-ds-avg { color: var(--admin-accent-cyan); }

/* Table */
.hw-detail-table { width: 100%; }
</style>
