<template>
  <div class="phsd-root">
    <!-- No selection: quick actions -->
    <template v-if="!data.selectedStudentId.value">
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title">快速操作</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <el-button size="small" type="primary" @click="$emit('batch')">批量登记</el-button>
          <el-button size="small" @click="handleBatchSubmit">一键全班已上交</el-button>
          <el-button size="small" @click="handleBatchReturn">一键全班已领取</el-button>
        </div>
      </div>
      <div class="admin-card" style="margin-top:10px">
        <div class="admin-card-title" style="font-size:12px;margin-bottom:8px">手机管理办法</div>
        <div class="phsd-rules">
          <p>1. 入校即存：学生到校后将手机存入班级手机柜</p>
          <p>2. 放学领取：放学后凭学生证领取手机</p>
          <p>3. 违规处理：上课期间使用手机时没收+通知家长</p>
          <p>4. 特殊情况：需经班主任批准方可临时使用</p>
          <p>5. 学期统计：违规≥3次记入学期操行评定</p>
        </div>
      </div>
    </template>

    <!-- Student selected -->
    <template v-else>
      <!-- Student info card -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div>
            <div class="admin-card-title" style="font-size:14px">
              {{ data.selectedStudent.value?.name }}
            </div>
            <div class="admin-card-subtitle">{{ data.selectedStudent.value?.class }}班</div>
          </div>
          <el-button size="small" @click="data.selectedStudentId.value = null">关闭</el-button>
        </div>

        <!-- Phone registration info -->
        <div v-if="data.currentRegistration.value" class="phsd-info-grid">
          <div class="phsd-info-item">
            <div class="phsd-info-label">手机型号</div>
            <div class="phsd-info-value">{{ data.currentRegistration.value.phoneModel || '未填写' }}</div>
          </div>
          <div class="phsd-info-item">
            <div class="phsd-info-label">IMEI</div>
            <div class="phsd-info-value imei">{{ data.currentRegistration.value.imei || '未填写' }}</div>
          </div>
          <div class="phsd-info-item">
            <div class="phsd-info-label">登记日期</div>
            <div class="phsd-info-value">{{ data.currentRegistration.value.registeredAt || '—' }}</div>
          </div>
        </div>
        <div v-else class="phsd-empty" style="padding:14px">
          尚未登记手机信息
          <el-button size="small" type="primary" style="margin-top:8px;width:100%" @click="$emit('reg-dialog')">登记手机</el-button>
        </div>

        <!-- Quick status switch -->
        <div v-if="data.currentRegistration.value" class="phsd-quick-switch">
          <div class="phsd-qs-label">今日状态</div>
          <div class="phsd-qs-buttons">
            <button
              v-for="st in ['已上交','未上交','已领取','违纪扣留']" :key="st"
              class="phsd-qs-btn"
              :class="{ active: data.todayRecord.value?.status === st, [statusClass(st)]: true }"
              @click="quickSetStatus(st)"
            >{{ st }}</button>
          </div>
        </div>

        <!-- Detention detail (for 违纪扣留) -->
        <div v-if="data.todayRecord.value?.status === '违纪扣留'" class="phsd-detention">
          <div class="phsd-det-title">扣留详情</div>
          <div class="phsd-det-row">
            <span class="phsd-det-label">扣留原因</span>
            <el-input v-model="detentionForm.detentionReason" size="small" placeholder="如：上课玩手机" />
          </div>
          <div class="phsd-det-row">
            <span class="phsd-det-label">操作教师</span>
            <el-input v-model="detentionForm.operatorName" size="small" placeholder="操作人姓名" />
          </div>
          <div class="phsd-det-row">
            <span class="phsd-det-label">备注</span>
            <el-input v-model="detentionForm.remark" size="small" placeholder="备注信息" />
          </div>
          <div class="phsd-det-row">
            <el-checkbox v-model="detentionForm.notifyParent" size="small" style="font-size:11px">通知家长</el-checkbox>
          </div>
          <template v-if="detentionForm.notifyParent">
            <div class="phsd-det-row">
              <span class="phsd-det-label">通知方式</span>
              <el-radio-group v-model="detentionForm.notifyType" size="small">
                <el-radio value="电话">电话</el-radio>
                <el-radio value="短信">短信</el-radio>
                <el-radio value="微信">微信</el-radio>
              </el-radio-group>
            </div>
            <div class="phsd-det-row">
              <span class="phsd-det-label">通知内容</span>
              <el-input v-model="detentionForm.notifyContent" type="textarea" size="small" rows="2" placeholder="通知家长的内容..." />
            </div>
          </template>
          <el-button size="small" type="primary" @click="saveDetention" style="margin-top:6px;width:100%">
            保存扣留信息
          </el-button>
        </div>

        <!-- Edit / Delete registration -->
        <div v-if="data.currentRegistration.value" style="display:flex;gap:6px;margin-top:10px">
          <el-button size="small" @click="$emit('reg-dialog')" style="flex:1">编辑信息</el-button>
          <el-button size="small" type="danger" @click="$emit('delete-reg')" style="flex:1">删除登记</el-button>
        </div>
      </div>

      <!-- Records timeline -->
      <div class="admin-card" style="margin-top:10px">
        <div class="admin-card-header">
          <div class="admin-card-title" style="font-size:12px">存取记录</div>
          <span style="font-size:10px;color:var(--admin-text-muted)">{{ data.studentRecords.value.length }} 条</span>
        </div>
        <div v-if="data.studentRecords.value.length" class="phsd-timeline">
          <div v-for="(rec, idx) in data.studentRecords.value.slice(0, 15)" :key="rec.id" class="phsd-tl-item">
            <div class="phsd-tl-dot" :class="statusDot(rec.status)"></div>
            <div v-if="idx < Math.min(data.studentRecords.value.length, 15) - 1" class="phsd-tl-line"></div>
            <div class="phsd-tl-card">
              <div class="phsd-tl-top">
                <span class="phsd-tl-date">{{ rec.date }}</span>
                <span class="admin-tag" :class="statusTag(rec.status)">{{ rec.status }}</span>
              </div>
              <div class="phsd-tl-body">
                <div class="phsd-tl-row"><span class="phsd-tl-k">上交</span><span>{{ rec.submitTime || '—' }}</span></div>
                <div class="phsd-tl-row"><span class="phsd-tl-k">领取</span><span>{{ rec.returnTime || '—' }}</span></div>
                <div v-if="rec.detentionReason" class="phsd-tl-row"><span class="phsd-tl-k">扣留原因</span><span>{{ rec.detentionReason }}</span></div>
                <div v-if="rec.operatorName" class="phsd-tl-row"><span class="phsd-tl-k">操作人</span><span>{{ rec.operatorName }}</span></div>
                <div v-if="rec.remark" class="phsd-tl-row"><span class="phsd-tl-k">备注</span><span>{{ rec.remark }}</span></div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="phsd-empty">暂无记录</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({ data: { type: Object, required: true } })
const emit = defineEmits(['batch', 'reg-dialog', 'delete-reg'])

const detentionForm = ref({
  detentionReason: '',
  operatorName: '',
  remark: '',
  notifyParent: false,
  notifyType: '电话',
  notifyContent: ''
})

// 同步已有扣留数据
watch(() => props.data.todayRecord.value, (rec) => {
  if (rec && rec.status === '违纪扣留') {
    detentionForm.value = {
      detentionReason: rec.detentionReason || '',
      operatorName: rec.operatorName || '',
      remark: rec.remark || '',
      notifyParent: rec.notifyParent || false,
      notifyType: rec.notifyType || '电话',
      notifyContent: rec.notifyContent || ''
    }
  }
}, { immediate: true })

function quickSetStatus(status) {
  const sid = props.data.selectedStudentId.value
  const reg = props.data.currentRegistration.value
  const s = props.data.selectedStudent.value
  if (!sid || !reg) return
  if (status === '违纪扣留') {
    props.data.setStudentStatus(sid, reg.id, s.name, s.class, status, { ...detentionForm.value })
  } else {
    props.data.setStudentStatus(sid, reg.id, s.name, s.class, status)
  }
}

function saveDetention() {
  const sid = props.data.selectedStudentId.value
  const reg = props.data.currentRegistration.value
  const s = props.data.selectedStudent.value
  if (!sid || !reg) return
  props.data.setStudentStatus(sid, reg.id, s.name, s.class, '违纪扣留', { ...detentionForm.value })
  ElMessage.success('扣留信息已保存')
}

function handleBatchSubmit() {
  const cls = props.data.cabinetClass.value
  if (!cls) { ElMessage.warning('请先选择班级'); return }
  props.data.batchSetClassStatus(cls, '已上交')
  ElMessage.success(`${cls} 班已设为全部已上交`)
}

function handleBatchReturn() {
  const cls = props.data.cabinetClass.value
  if (!cls) { ElMessage.warning('请先选择班级'); return }
  props.data.batchSetClassStatus(cls, '已领取')
  ElMessage.success(`${cls} 班已设为全部已领取`)
}

function statusDot(s) {
  return { '已上交': 's-dot-sub', '未上交': 's-dot-not', '已领取': 's-dot-ret', '违纪扣留': 's-dot-vio' }[s] || ''
}
function statusTag(s) {
  return { '已上交': 'success', '未上交': 'warning', '已领取': 'info', '违纪扣留': 'danger' }[s] || 'info'
}
function statusClass(s) {
  return { '已上交': 'sqs-sub', '未上交': 'sqs-not', '已领取': 'sqs-ret', '违纪扣留': 'sqs-vio' }[s] || ''
}
</script>

<style scoped>
.phsd-root { display: flex; flex-direction: column; gap: 0; }

/* Info grid */
.phsd-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
.phsd-info-item {}
.phsd-info-label { font-size: 10px; color: var(--admin-text-muted); margin-bottom: 2px; }
.phsd-info-value { font-size: 12px; color: var(--admin-text); font-weight: 500; }
.phsd-info-value.imei { font-size: 10px; font-family: monospace; color: var(--admin-text-secondary); }

/* Quick switch */
.phsd-quick-switch { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--admin-border); }
.phsd-qs-label { font-size: 10px; color: var(--admin-text-muted); margin-bottom: 6px; font-weight: 600; }
.phsd-qs-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.phsd-qs-btn {
  padding: 6px 4px; border: 1px solid var(--admin-border);
  background: var(--admin-bg); border-radius: 6px; font-size: 11px;
  cursor: pointer; transition: all 0.15s; font-family: var(--admin-font);
  color: var(--admin-text-muted);
}
.phsd-qs-btn:hover { border-color: var(--admin-accent); }
.phsd-qs-btn.active.sqs-sub { background: var(--admin-success); border-color: var(--admin-success); color: #fff; }
.phsd-qs-btn.active.sqs-not { background: var(--admin-danger); border-color: var(--admin-danger); color: #fff; }
.phsd-qs-btn.active.sqs-ret { background: var(--admin-primary); border-color: var(--admin-primary); color: #fff; }
.phsd-qs-btn.active.sqs-vio { background: var(--admin-warning); border-color: var(--admin-warning); color: #1a2e3c; }

/* Detention form */
.phsd-detention {
  margin-top: 10px; padding: 10px; border: 1px solid rgba(245,158,11,0.3);
  background: rgba(245,158,11,0.04); border-radius: 8px;
}
.phsd-det-title { font-size: 11px; font-weight: 700; color: var(--admin-warning); margin-bottom: 8px; }
.phsd-det-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.phsd-det-label { font-size: 10px; color: var(--admin-text-muted); min-width: 56px; flex-shrink: 0; }

/* Rules */
.phsd-rules { font-size: 11px; line-height: 2; color: var(--admin-text-secondary); }
.phsd-rules p { margin: 0; }

/* Timeline */
.phsd-timeline { position: relative; padding-left: 18px; }
.phsd-tl-item { position: relative; padding-bottom: 10px; }
.phsd-tl-dot {
  position: absolute; left: -18px; top: 10px; width: 8px; height: 8px;
  border-radius: 50%; z-index: 1; border: 2px solid var(--admin-bg);
}
.phsd-tl-dot.s-dot-sub { background: var(--admin-success); }
.phsd-tl-dot.s-dot-not { background: var(--admin-danger); }
.phsd-tl-dot.s-dot-ret { background: var(--admin-primary); }
.phsd-tl-dot.s-dot-vio { background: var(--admin-warning); }
.phsd-tl-line {
  position: absolute; left: -15px; top: 18px; bottom: 0;
  width: 2px; background: var(--admin-border);
}
.phsd-tl-card {
  background: var(--admin-bg); border-radius: 8px; padding: 8px 10px;
  border: 1px solid var(--admin-border);
}
.phsd-tl-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 4px;
}
.phsd-tl-date { font-size: 11px; font-weight: 600; color: var(--admin-text); }
.phsd-tl-body { display: flex; flex-direction: column; gap: 2px; font-size: 10px; }
.phsd-tl-row { display: flex; gap: 8px; }
.phsd-tl-k { color: var(--admin-text-muted); min-width: 44px; }

.phsd-empty { font-size: 11px; color: var(--admin-text-muted); padding: 16px 0; text-align: center; }
</style>
