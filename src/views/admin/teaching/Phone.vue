<template>
  <div class="phone-page">
    <!-- Top: Date Navigator + Stats -->
    <div class="phone-top">
      <div class="phone-date-nav">
        <button class="phone-date-btn" @click="data.shiftDate(-1)" title="前一天">◀</button>
        <el-date-picker
          v-model="data.currentDate.value" type="date" value-format="YYYY-MM-DD"
          placeholder="选择日期" size="small" style="width:150px"
        />
        <button class="phone-date-btn" @click="data.shiftDate(1)" title="后一天">▶</button>
        <button class="phone-date-today" @click="data.goToday()">今天</button>
        <button
          v-if="canCopyYesterday" class="phone-copy-btn"
          @click="handleCopyYesterday"
        >
          从昨天复制
        </button>
      </div>
      <div class="phone-stats">
        <div class="phone-stat-card total">
          <div class="psc-num">{{ stats.total }}</div>
          <div class="psc-label">应上交</div>
        </div>
        <div class="phone-stat-card deposited">
          <div class="psc-num">{{ stats.deposited }}</div>
          <div class="psc-label">已上交</div>
        </div>
        <div class="phone-stat-card not-deposited">
          <div class="psc-num">{{ stats.notDeposited }}</div>
          <div class="psc-label">未上交</div>
        </div>
        <div class="phone-stat-card returned">
          <div class="psc-num">{{ stats.returned }}</div>
          <div class="psc-label">已领取</div>
        </div>
        <div class="phone-stat-card violation">
          <div class="psc-num">{{ stats.violations }}</div>
          <div class="psc-label">违纪扣留</div>
        </div>
      </div>
    </div>

    <!-- Body: 3-column -->
    <div class="phone-body">
      <!-- Left: Timeline -->
      <div class="phone-left">
        <div class="admin-card" style="height:100%;display:flex;flex-direction:column">
          <div class="admin-card-header">
            <div class="admin-card-title" style="font-size:12px">今日操作记录</div>
            <span style="font-size:10px;color:var(--admin-text-muted)">
              {{ todayAllRecords.length }} 条
            </span>
          </div>
          <div v-if="todayAllRecords.length" class="phone-timeline-list">
            <div v-for="rec in todayAllRecords.slice(0, 30)" :key="rec.id" class="ptl-item">
              <div class="ptl-dot" :class="dotClass(rec.status)"></div>
              <div class="ptl-info">
                <span class="ptl-name">{{ rec.studentName }}</span>
                <span class="ptl-status" :class="tagClass(rec.status)">{{ rec.status }}</span>
              </div>
              <div class="ptl-time">{{ rec.submitTime || rec.returnTime || '—' }}</div>
            </div>
          </div>
          <div v-else class="ph-empty" style="flex:1">今日暂无操作</div>
        </div>
      </div>

      <!-- Center: Cabinet -->
      <div class="phone-center">
        <PhoneCabinet :data="data" @select="onCabinetSelect" />
      </div>

      <!-- Right: Detail -->
      <div class="phone-right">
        <PhoneStudentDetail
          :data="data"
          @batch="openBatchDialog"
          @reg-dialog="openRegDialog"
          @delete-reg="handleDeleteReg"
        />
      </div>
    </div>

    <!-- Registration Dialog -->
    <el-dialog v-model="regVisible" title="手机登记" width="460px" :close-on-click-modal="false">
      <div style="display:flex;gap:12px;margin-bottom:12px">
        <div class="admin-form-group" style="flex:1">
          <label>手机型号 <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="regForm.phoneModel" placeholder="如：iPhone 15 Pro" />
        </div>
        <div class="admin-form-group" style="flex:1">
          <label>IMEI <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="regForm.imei" placeholder="IMEI编号" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>登记日期</label>
        <el-date-picker v-model="regForm.registeredAt" type="date" value-format="YYYY-MM-DD" style="width:100%" />
      </div>
      <template #footer>
        <el-button @click="regVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveReg">{{ regEditingId ? '保存修改' : '登记' }}</el-button>
      </template>
    </el-dialog>

    <!-- Batch Dialog -->
    <el-dialog v-model="batchVisible" title="批量手机登记" width="720px" :close-on-click-modal="false">
      <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;align-items:flex-end">
        <div class="admin-form-group" style="margin-bottom:0">
          <label>选择班级</label>
          <el-select v-model="batchClass" size="small" style="width:110px" @change="loadBatchStudents">
            <el-option v-for="c in data.classList.value" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="admin-form-group" style="margin-bottom:0">
          <label>日期</label>
          <el-date-picker v-model="batchDate" size="small" type="date" value-format="YYYY-MM-DD" style="width:140px" />
        </div>
        <el-button size="small" type="success" @click="batchSetStatus('已上交')">全部已上交</el-button>
        <el-button size="small" type="warning" @click="batchSetStatus('未上交')">全部未上交</el-button>
        <span style="font-size:11px;color:var(--admin-text-muted)">{{ batchList.length }} 名学生</span>
      </div>
      <div class="batch-student-table">
        <table class="admin-table">
          <thead><tr><th>姓名</th><th>状态</th><th>上交时间</th><th>领取时间</th><th>备注</th></tr></thead>
          <tbody>
            <tr v-for="(bs, i) in batchList" :key="i">
              <td style="font-weight:500;min-width:70px">{{ bs.name }}</td>
              <td>
                <el-select v-model="bs.status" size="small" style="width:100px">
                  <el-option label="已上交" value="已上交" />
                  <el-option label="未上交" value="未上交" />
                  <el-option label="已领取" value="已领取" />
                  <el-option label="违纪扣留" value="违纪扣留" />
                </el-select>
              </td>
              <td><el-input v-model="bs.submitTime" size="small" style="width:130px" placeholder="如：07:45" /></td>
              <td><el-input v-model="bs.returnTime" size="small" style="width:130px" placeholder="如：17:30" /></td>
              <td><el-input v-model="bs.notes" size="small" style="width:100px" placeholder="备注" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveBatch">保存全部 ({{ batchList.length }} 条)</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 页面：手机管理（重构版 — Phase 4）
 * 功能：3栏布局(操作时间轴+手机柜+学生详情)，新增扣留追溯+家长通知
 * 路由：/admin/phone
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { phoneRecordService } from '@/services/dataService'
import { usePhoneData } from './phone/usePhoneData'
import PhoneCabinet from './phone/components/PhoneCabinet.vue'
import PhoneStudentDetail from './phone/components/PhoneStudentDetail.vue'

const data = usePhoneData()

onMounted(() => {
  data.loadAll()
  if (data.classList.value.length) data.cabinetClass.value = data.classList.value[0]
})

const stats = computed(() => data.todayStats.value)

// Copy from yesterday
const canCopyYesterday = computed(() => {
  const yRecs = data.records.value.filter(r => r.date === data.yesterday.value)
  const tRecs = data.records.value.filter(r => r.date === data.currentDate.value)
  return yRecs.length > 0 && tRecs.length === 0
})

function handleCopyYesterday() {
  const count = data.copyFromYesterday()
  if (count) {
    ElMessage.success(`已从 ${data.yesterday.value} 复制 ${count} 条记录到 ${data.currentDate.value}`)
  } else {
    ElMessage.warning('昨天没有记录可复制')
  }
}

// Cabinet click → select student
function onCabinetSelect(studentId) {
  data.selectedStudentId.value = studentId
  // Auto-toggle status
  const s = data.selectedStudent.value
  const reg = data.getRegistration(studentId)
  if (!s || !reg) return
  const rec = data.getTodayRecord(studentId)
  const next = !rec || rec.status === '未上交' ? '已上交'
    : rec.status === '已上交' ? '已领取'
    : rec.status === '已领取' ? '未上交'
    : '已上交'
  data.setStudentStatus(studentId, reg.id, s.name, s.class, next)
}

// Today all records for timeline
const todayAllRecords = computed(() =>
  data.records.value.filter(r => r.date === data.currentDate.value)
    .sort((a, b) => (b.submitTime || b.returnTime || '').localeCompare(a.submitTime || a.returnTime || ''))
)

function dotClass(s) { return { '已上交':'sdot-sub','未上交':'sdot-not','已领取':'sdot-ret','违纪扣留':'sdot-vio' }[s]||'' }
function tagClass(s) { return { '已上交':'success','未上交':'warning','已领取':'info','违纪扣留':'danger' }[s]||'info' }

// Registration dialog
const regVisible = ref(false)
const regEditingId = ref(null)
const regForm = ref({ studentId: null, studentName: '', class: '', phoneModel: '', imei: '', registeredAt: '' })

function openRegDialog() {
  const existing = data.currentRegistration.value
  if (existing) {
    regEditingId.value = existing.id
    regForm.value = { ...existing }
  } else {
    regEditingId.value = null
    const s = data.selectedStudent.value
    regForm.value = {
      studentId: data.selectedStudentId.value,
      studentName: s?.name || '', class: s?.class || '',
      phoneModel: '', imei: '', registeredAt: data.currentDate.value
    }
  }
  regVisible.value = true
}

function handleSaveReg() {
  if (!regForm.value.phoneModel) { ElMessage.warning('请输入手机型号'); return }
  if (!regForm.value.imei) { ElMessage.warning('请输入IMEI'); return }
  data.saveRegistration(regForm.value, regEditingId.value)
  regVisible.value = false
  ElMessage.success(regEditingId.value ? '已更新' : '已登记')
}

async function handleDeleteReg() {
  if (!data.currentRegistration.value) return
  try {
    await ElMessageBox.confirm(
      `确定删除「${data.selectedStudent.value?.name}」的手机登记信息吗？`,
      '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    data.deleteRegistration(data.currentRegistration.value.id)
    ElMessage.success('已删除')
  } catch {}
}

// Batch dialog
const batchVisible = ref(false)
const batchClass = ref('')
const batchDate = ref(new Date().toISOString().split('T')[0])
const batchList = ref([])

function openBatchDialog() {
  batchClass.value = data.cabinetClass.value || data.classList.value[0] || ''
  batchDate.value = data.currentDate.value
  loadBatchStudents()
  batchVisible.value = true
}

function loadBatchStudents() {
  if (!batchClass.value) { batchList.value = []; return }
  const clsStudents = data.students.value.filter(s => s.class === batchClass.value)
  batchList.value = clsStudents.map(s => {
    const reg = data.getRegistration(s.id)
    const rec = data.records.value.find(r => r.studentId === s.id && r.date === batchDate.value)
    return {
      studentId: s.id, name: s.name, class: s.class,
      registrationId: reg?.id || null,
      status: rec?.status || '已上交',
      submitTime: rec?.submitTime || '',
      returnTime: rec?.returnTime || '',
      notes: rec?.remark || ''
    }
  })
}

function batchSetStatus(status) {
  batchList.value.forEach(bs => { bs.status = status })
}

function handleSaveBatch() {
  if (!batchList.value.length) { ElMessage.warning('没有学生数据'); return }
  let count = 0
  batchList.value.forEach(bs => {
    const existing = data.records.value.find(r => r.studentId === bs.studentId && r.date === batchDate.value)
    if (existing) {
      phoneRecordService.update(existing.id, {
        ...existing, status: bs.status, submitTime: bs.submitTime, returnTime: bs.returnTime, remark: bs.notes
      })
    } else {
      phoneRecordService.create({
        registrationId: bs.registrationId, studentId: bs.studentId,
        studentName: bs.name, class: bs.class, date: batchDate.value,
        status: bs.status, submitTime: bs.submitTime, returnTime: bs.returnTime,
        detentionReason: '', notifyParent: false, notifyType: '', notifyContent: '',
        operatorName: '', remark: bs.notes
      })
    }
    count++
  })
  data.records.value = phoneRecordService.getAll()
  batchVisible.value = false
  ElMessage.success(`已为 ${batchClass.value} 班批量登记 ${count} 条记录`)
}
</script>

<style scoped>
.phone-page { display: flex; flex-direction: column; gap: 10px; height: 100%; }

/* ====== Top ====== */
.phone-top {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; flex-shrink: 0;
}
.phone-date-nav { display: flex; align-items: center; gap: 6px; }
.phone-date-btn {
  width: 28px; height: 28px; border: 1px solid var(--admin-border);
  background: var(--admin-surface); border-radius: 6px; cursor: pointer;
  font-size: 11px; color: var(--admin-text-muted); display: flex;
  align-items: center; justify-content: center; transition: all 0.15s;
}
.phone-date-btn:hover { border-color: var(--admin-accent); color: var(--admin-accent); }
.phone-date-today {
  padding: 3px 10px; border: 1px solid var(--admin-accent);
  background: var(--admin-accent); color: #fff; border-radius: 6px;
  font-size: 11px; cursor: pointer; font-weight: 500;
}
.phone-date-today:hover { opacity: 0.85; }
.phone-copy-btn {
  padding: 4px 12px; border: 1px dashed var(--admin-accent);
  background: rgba(201,160,80,0.08); color: var(--admin-accent);
  border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: 500;
  transition: all 0.15s; font-family: var(--admin-font); margin-left: 8px;
}
.phone-copy-btn:hover { background: rgba(201,160,80,0.15); }

/* Stats cards */
.phone-stats { display: flex; gap: 8px; flex-shrink: 0; }
.phone-stat-card {
  text-align: center; padding: 8px 14px; border-radius: 8px;
  background: var(--admin-surface); border: 1px solid var(--admin-border);
  min-width: 60px;
}
.phone-stat-card.total { border-left: 3px solid var(--admin-text-muted); }
.phone-stat-card.deposited { border-left: 3px solid var(--admin-success); }
.phone-stat-card.not-deposited { border-left: 3px solid var(--admin-danger); }
.phone-stat-card.returned { border-left: 3px solid var(--admin-primary); }
.phone-stat-card.violation { border-left: 3px solid var(--admin-warning); }
.psc-num { font-size: 20px; font-weight: 700; color: var(--admin-text); line-height: 1.1; }
.psc-label { font-size: 10px; color: var(--admin-text-muted); margin-top: 2px; }

/* ====== Body: 3 columns ====== */
.phone-body { display: flex; gap: 10px; flex: 1; min-height: 0; }

/* Left: Timeline */
.phone-left { width: 200px; flex-shrink: 0; min-height: 0; }
.phone-timeline-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.ptl-item { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 6px; transition: background 0.12s; }
.ptl-item:hover { background: var(--admin-surface-hover); }
.ptl-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ptl-dot.sdot-sub { background: var(--admin-success); }
.ptl-dot.sdot-not { background: var(--admin-danger); }
.ptl-dot.sdot-ret { background: var(--admin-primary); }
.ptl-dot.sdot-vio { background: var(--admin-warning); }
.ptl-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 4px; }
.ptl-name { font-size: 11px; font-weight: 500; color: var(--admin-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ptl-status { padding: 0 4px; border-radius: 3px; font-size: 9px; font-weight: 600; flex-shrink: 0; }
.ptl-status.success { background: rgba(16,185,129,0.12); color: var(--admin-success); }
.ptl-status.warning { background: rgba(239,68,68,0.08); color: var(--admin-danger); }
.ptl-status.info { background: rgba(59,130,246,0.08); color: var(--admin-primary); }
.ptl-status.danger { background: rgba(245,158,11,0.1); color: var(--admin-warning); }
.ptl-time { font-size: 10px; color: var(--admin-text-muted); font-family: monospace; flex-shrink: 0; }

/* Center: Cabinet */
.phone-center { flex: 1; min-width: 0; display: flex; flex-direction: column; }

/* Right: Detail */
.phone-right { width: 290px; flex-shrink: 0; overflow-y: auto; }

.ph-empty { font-size: 11px; color: var(--admin-text-muted); text-align: center; padding: 20px 0; }

@media (max-width: 900px) {
  .phone-body { flex-direction: column; }
  .phone-left { width: 100%; max-height: 140px; }
  .phone-right { width: 100%; }
  .phone-stats { width: 100%; justify-content: space-between; }
  .phone-stat-card { min-width: 0; flex: 1; padding: 8px 4px; }
  .psc-num { font-size: 17px; }
}
</style>
