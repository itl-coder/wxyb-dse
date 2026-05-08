<template>
  <div v-if="student">
    <div class="p-card" style="margin-bottom:16px">
      <div class="p-card-title">📕 我的错题本</div>
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
        <el-select v-model="filterSubject" size="small" placeholder="科目筛选" style="width:110px" clearable>
          <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select v-model="filterErrorType" size="small" placeholder="错因筛选" style="width:120px" clearable>
          <el-option v-for="e in errorTypeOptions" :key="e.value" :label="e.label" :value="e.value" />
        </el-select>
        <el-button size="small" type="primary" @click="printMistakes">🖨️ 打印错题卷</el-button>
      </div>

      <div v-if="filteredMistakes.length === 0" class="ph-empty">暂无错题记录 🎉</div>

      <div class="mistake-card-list">
        <div v-for="e in filteredMistakes" :key="e.id" class="m-card">
          <div class="m-card-header">
            <span class="m-topic-tag">{{ e.topic }}</span>
            <span class="admin-tag" :class="errorTagClass(e.errorType)">{{ errorTypeLabel(e.errorType) }}</span>
            <span style="font-size:10px;color:var(--text-light);margin-left:auto">错{{ e.count }}次</span>
          </div>
          <div class="m-question">{{ e.question }}</div>
          <div class="m-meta">
            <span>{{ e.subject }}</span>
            <span>最近：{{ e.lastDate }}</span>
          </div>
          <div class="m-actions">
            <el-button size="small" text type="primary" @click="openRedo(e)">✏️ 重做</el-button>
            <el-button size="small" text type="success" @click="e.showAnswer = !e.showAnswer">{{ e.showAnswer ? '隐藏答案' : '📖 查看答案' }}</el-button>
          </div>
          <div v-if="e.showAnswer" class="m-answer">
            <div class="m-answer-row"><b>标准答案：</b>{{ e.correctAnswer || '（参考教材详解）' }}</div>
            <div class="m-answer-row"><b>解题思路：</b>{{ e.solution || '回顾相关知识点，重点排查"' + errorTypeLabel(e.errorType) + '"类错误' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Redo dialog with answer comparison -->
    <el-dialog v-model="redoVisible" title="错题重做 · 答案对比" width="580px">
      <div v-if="redoItem" style="line-height:1.8">
        <div class="redo-question">{{ redoItem.question }}</div>
        <div style="font-size:11px;color:var(--text-light);margin-bottom:14px;display:flex;gap:12px">
          <span>科目：{{ redoItem.subject }}</span>
          <span>知识点：{{ redoItem.topic }}</span>
          <span>错因：{{ errorTypeLabel(redoItem.errorType) }}</span>
        </div>

        <div class="redo-section">
          <div class="redo-section-title">✏️ 你的答案</div>
          <textarea v-model="redoAnswer" class="admin-input" rows="3" placeholder="请在此重新作答..."></textarea>
        </div>

        <div style="display:flex;gap:8px;margin-top:12px">
          <el-button type="primary" size="small" @click="submitRedoAnswer">提交答案</el-button>
        </div>

        <div v-if="redoSubmitted" class="redo-compare" style="margin-top:16px">
          <div class="redo-section-title">📖 答案对比</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
            <div class="redo-ans-box your">
              <div class="redo-ans-label">你的答案</div>
              <div class="redo-ans-text">{{ redoAnswer }}</div>
            </div>
            <div class="redo-ans-box correct">
              <div class="redo-ans-label">标准答案</div>
              <div class="redo-ans-text">{{ redoItem.correctAnswer || '请参阅教师提供的标准答案' }}</div>
            </div>
          </div>
          <div style="margin-top:12px;padding:10px;background:#fff3cd;border-radius:8px;font-size:12px;color:#856404">
            💡 <b>提升建议：</b>重点回顾"{{ redoItem.topic }}"相关概念，注意排查"{{ errorTypeLabel(redoItem.errorType) }}"类错误。建议同类题目再练2-3道以巩固。
          </div>
        </div>
      </div>
    </el-dialog>

    <div class="p-quote">💪 "错误是最好的老师。每一道错题，都是通向满分的阶梯。"</div>
  </div>
  <div v-else class="ph-empty" style="padding:60px;text-align:center">正在加载学生数据...</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { errorBookService } from '@/services/dataService'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const student = computed(() => store.currentStudent)
const allMistakes = ref([])
const filterSubject = ref('')
const filterErrorType = ref('')
const redoVisible = ref(false)
const redoItem = ref(null)
const redoAnswer = ref('')
const redoSubmitted = ref(false)

const errorTypeMap = { calc: '计算失误', concept: '概念不清', reading: '审题偏差', careless: '粗心', comprehensive: '综合能力不足' }
function errorTypeLabel(t) { return errorTypeMap[t] || t }
const errorTypeOptions = Object.entries(errorTypeMap).map(([value, label]) => ({ value, label }))

const subjectList = computed(() => {
  const sids = allMistakes.value.map(e => e.subject)
  return [...new Set(sids)]
})

const filteredMistakes = computed(() => {
  return allMistakes.value.filter(e => {
    if (filterSubject.value && e.subject !== filterSubject.value) return false
    if (filterErrorType.value && e.errorType !== filterErrorType.value) return false
    return true
  })
})

onMounted(() => {
  if (!store.currentStudentId) return
  allMistakes.value = errorBookService.getByStudent(store.currentStudentId)
})

function errorTagClass(type) {
  return { calc: 'warning', concept: 'primary', reading: 'info', careless: 'warning', comprehensive: 'danger' }[type] || 'info'
}

function openRedo(e) {
  redoItem.value = e
  redoAnswer.value = ''
  redoSubmitted.value = false
  redoVisible.value = true
}

function submitRedoAnswer() {
  if (!redoAnswer.value.trim()) { ElMessage.warning('请输入你的答案'); return }
  redoSubmitted.value = true
  ElMessage.success('已提交，请查看答案对比')
}

function printMistakes() {
  window.print()
}
</script>

<style scoped>
.p-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
.p-card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
.ph-empty { font-size: 12px; color: var(--text-light); padding: 20px 0; text-align: center; }

.mistake-card-list { display: flex; flex-direction: column; gap: 8px; }
.m-card { background: var(--bg); border-radius: 10px; padding: 14px; border: 1px solid var(--border); }
.m-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.m-topic-tag { font-size: 10px; background: var(--accent); color: #1a2e3c; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.m-question { font-size: 13px; color: var(--text); line-height: 1.6; margin-bottom: 6px; }
.m-meta { display: flex; gap: 12px; font-size: 10px; color: var(--text-light); margin-bottom: 8px; }
.m-actions { display: flex; gap: 8px; }
.m-answer { margin-top: 10px; padding: 12px; background: #e8f5e9; border-radius: 8px; border-left: 3px solid var(--success); }
.m-answer-row { font-size: 12px; line-height: 1.8; color: #2e7d32; margin-bottom: 4px; }

.redo-question { font-size: 14px; font-weight: 600; color: var(--text); padding: 12px; background: var(--bg); border-radius: 8px; margin-bottom: 10px; }
.redo-section { margin-bottom: 8px; }
.redo-section-title { font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
.redo-ans-box { padding: 12px; border-radius: 8px; }
.redo-ans-box.your { background: #fff3cd; border: 1px solid #ffc107; }
.redo-ans-box.correct { background: #e8f5e9; border: 1px solid #4caf50; }
.redo-ans-label { font-size: 10px; font-weight: 600; margin-bottom: 4px; }
.redo-ans-label .your { color: #856404; }
.redo-ans-label .correct { color: #2e7d32; }
.redo-ans-text { font-size: 12px; line-height: 1.6; }

.p-quote { text-align: center; font-size: 13px; color: var(--accent); padding: 20px; font-style: italic; line-height: 1.8; }
</style>
