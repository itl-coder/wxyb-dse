<template>
  <div class="phone-layout">
    <!-- Left: Student Tree Panel -->
    <div class="admin-card phone-left-panel">
      <div class="admin-card-header">
        <div class="admin-card-title" style="font-size:14px">👥 学生列表</div>
        <span class="phone-unreg-badge" v-if="unregisteredTodayCount" @click="quickFilterUnregistered">{{ unregisteredTodayCount }}人未登记</span>
      </div>
      <div style="padding:0 4px">
        <el-input v-model="searchText" size="small" placeholder="搜索学生姓名..." clearable style="margin-bottom:8px" />
        <div style="display:flex;gap:4px;margin-bottom:8px">
          <button
            v-for="tab in leftTabs" :key="tab.key"
            class="phone-mode-tab"
            :class="{ active: leftMode === tab.key }"
            @click="leftMode = tab.key"
          >{{ tab.label }}</button>
        </div>
      </div>
      <div class="phone-student-list">
        <!-- Quick filter bar -->
        <div v-if="leftMode === 'status'" style="display:flex;gap:4px;padding:0 4px 8px;flex-wrap:wrap">
          <button class="phone-quick-btn" :class="{ active: quickStatusFilter === '' }" @click="quickStatusFilter = ''">全部</button>
          <button class="phone-quick-btn unsubmitted" :class="{ active: quickStatusFilter === '未上交' }" @click="quickStatusFilter = '未上交'">未上交</button>
          <button class="phone-quick-btn submitted" :class="{ active: quickStatusFilter === '已上交' }" @click="quickStatusFilter = '已上交'">已上交</button>
          <button class="phone-quick-btn returned" :class="{ active: quickStatusFilter === '已领取' }" @click="quickStatusFilter = '已领取'">已领取</button>
          <button class="phone-quick-btn violation" :class="{ active: quickStatusFilter === '违纪扣留' }" @click="quickStatusFilter = '违纪扣留'">违纪</button>
        </div>

        <!-- Class mode -->
        <template v-if="leftMode === 'class'">
          <div v-for="cls in groupedStudents" :key="cls.className" class="phone-class-group">
            <div class="phone-class-title" @click="cls.expanded = !cls.expanded">
              <span>{{ cls.expanded ? '▼' : '▶' }}</span> {{ cls.className }}
              <span class="phone-class-count">{{ cls.students.length }}人</span>
              <span class="phone-class-stat reg">{{ cls.registeredCount }}登记</span>
              <span v-if="cls.unregisteredCount" class="phone-class-stat unreg">{{ cls.unregisteredCount }}未登</span>
            </div>
            <div v-if="cls.expanded" class="phone-student-items">
              <div
                v-for="s in cls.students" :key="s.id"
                class="phone-student-row"
                :class="{ active: selectedStudentId === s.id }"
                @click="selectStudent(s.id)"
              >
                <div class="phone-student-avatar" :class="{ unreg: !getRegistration(s.id) }">{{ s.name.charAt(0) }}</div>
                <div class="phone-student-info">
                  <div class="phone-student-name">{{ s.name }}</div>
                  <div class="phone-student-meta">
                    <span v-if="getRegistration(s.id)" class="phone-reg-badge">
                      {{ getTodayStatusIcon(s.id) }} {{ getTodayStatus(s.id) || '已登记' }}
                    </span>
                    <span v-else class="phone-reg-badge unreg">未登记</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Status mode -->
        <template v-if="leftMode === 'status'">
          <div v-for="group in statusGroupedStudents" :key="group.status" class="phone-status-group">
            <div class="phone-status-header" @click="group.expanded = !group.expanded">
              <span class="phone-status-dot" :class="statusDotClass(group.status)"></span>
              <span>{{ group.status }}</span>
              <span class="phone-class-count">{{ group.students.length }}人</span>
            </div>
            <div v-if="group.expanded" class="phone-student-items">
              <div
                v-for="s in group.students" :key="s.id"
                class="phone-student-row"
                :class="{ active: selectedStudentId === s.id }"
                @click="selectStudent(s.id)"
              >
                <div class="phone-student-avatar" :class="{ unreg: !getRegistration(s.id) }">{{ s.name.charAt(0) }}</div>
                <div class="phone-student-info">
                  <div class="phone-student-name">{{ s.name }}</div>
                  <div class="phone-student-meta" style="font-size:10px;color:var(--admin-text-muted)">
                    {{ s.class }}班 · {{ getTodayStatus(s.id) || '无记录' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-if="(leftMode==='class' && groupedStudents.length===0) || (leftMode==='status' && statusGroupedStudents.length===0)" class="ph-empty">无匹配学生</div>
      </div>
    </div>

    <!-- Batch Registration Button -->
    <div style="padding:8px">
      <el-button size="small" type="primary" style="width:100%" @click="openBatchDialog">📋 批量登记</el-button>
    </div>

    <!-- Right: Detail Panel -->
    <div class="phone-right-panel">
      <!-- No student selected: Summary -->
      <div v-if="!selectedStudentId">
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="admin-card-title">📊 今日手机管理概况</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="background:var(--admin-bg);border-radius:8px;padding:14px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:var(--admin-success)">{{ todayStats.deposited }}</div>
              <div style="font-size:11px;color:var(--admin-text-muted)">已上交</div>
            </div>
            <div style="background:var(--admin-bg);border-radius:8px;padding:14px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:var(--admin-warning)">{{ todayStats.notDeposited }}</div>
              <div style="font-size:11px;color:var(--admin-text-muted)">未上交</div>
            </div>
            <div style="background:var(--admin-bg);border-radius:8px;padding:14px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:var(--admin-primary)">{{ todayStats.returned }}</div>
              <div style="font-size:11px;color:var(--admin-text-muted)">已领取</div>
            </div>
            <div style="background:var(--admin-bg);border-radius:8px;padding:14px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:var(--admin-danger)">{{ todayStats.violations }}</div>
              <div style="font-size:11px;color:var(--admin-text-muted)">违纪扣留</div>
            </div>
          </div>
        </div>
        <div class="admin-card" style="margin-top:16px">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📋 手机管理办法</div>
          <div style="font-size:12px;line-height:2;color:var(--admin-text-secondary)">
            <p>1. 入校即存：学生到校后将手机存入班级手机柜</p>
            <p>2. 放学领取：放学后凭学生证领取手机</p>
            <p>3. 违规处理：上课期间使用手机 → 没收+通知家长</p>
            <p>4. 特殊情况：需经班主任批准方可临时使用</p>
            <p>5. 学期统计：违规≥3次记入学期操行评定</p>
          </div>
        </div>
      </div>

      <!-- Student selected -->
      <div v-else>
        <!-- Phone Base Info Card -->
        <div class="admin-card phone-reg-card">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title" style="font-size:14px">
                📱 {{ selectedStudent?.name }} 的手机信息
              </div>
              <div class="admin-card-subtitle">{{ selectedStudent?.class }}班</div>
            </div>
            <div style="display:flex;gap:8px">
              <el-button v-if="!currentRegistration" size="small" type="primary" @click="openRegDialog">登记手机</el-button>
              <el-button v-else size="small" @click="openRegDialog">编辑</el-button>
              <el-button v-if="currentRegistration" size="small" type="danger" @click="deleteRegistration">删除</el-button>
            </div>
          </div>
          <div v-if="currentRegistration" class="phone-info-grid">
            <div class="phone-info-item">
              <div class="phone-info-label">手机型号</div>
              <div class="phone-info-value">{{ currentRegistration.phoneModel }}</div>
            </div>
            <div class="phone-info-item">
              <div class="phone-info-label">IMEI</div>
              <div class="phone-info-value imei">{{ currentRegistration.imei }}</div>
            </div>
            <div class="phone-info-item">
              <div class="phone-info-label">登记日期</div>
              <div class="phone-info-value">{{ currentRegistration.registeredAt }}</div>
            </div>
            <div class="phone-info-item">
              <div class="phone-info-label">设备照片</div>
              <div class="phone-info-value">
                <img v-if="currentRegistration.deviceImage" :src="currentRegistration.deviceImage" class="phone-device-img" @click="previewImage(currentRegistration)" title="点击查看大图" />
                <span v-else style="color:var(--admin-text-muted);font-size:12px">未上传</span>
              </div>
            </div>
          </div>
          <div v-else class="ph-empty" style="padding:20px">该学生尚未登记手机信息，点击上方按钮进行登记</div>
        </div>

        <!-- Daily Records Time-Axis -->
        <div class="admin-card" style="margin-top:16px">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title" style="font-size:14px">📅 每日存取记录</div>
              <div class="admin-card-subtitle">共 {{ studentRecords.length }} 条记录</div>
            </div>
            <el-button v-if="currentRegistration" size="small" type="primary" @click="openRecordDialog">+ 今日登记</el-button>
          </div>
          <div v-if="studentRecords.length" class="phone-timeline">
            <div v-for="(rec, idx) in studentRecords" :key="rec.id" class="phone-tl-item">
              <div class="phone-tl-dot" :class="rec.status === '违纪扣留' ? 'danger' : rec.status === '已领取' ? 'done' : 'active'"></div>
              <div v-if="idx < studentRecords.length - 1" class="phone-tl-line"></div>
              <div class="phone-tl-card">
                <div class="phone-tl-card-top">
                  <span class="phone-tl-date">{{ rec.date }}</span>
                  <span class="admin-tag" :class="rec.status === '已上交' ? 'success' : rec.status === '违纪扣留' ? 'danger' : rec.status === '已领取' ? 'info' : 'warning'">{{ rec.status }}</span>
                </div>
                <div class="phone-tl-card-body">
                  <div class="phone-tl-row"><span class="phone-tl-label">上交时间</span><span>{{ rec.submitTime || '—' }}</span></div>
                  <div class="phone-tl-row"><span class="phone-tl-label">领取时间</span><span>{{ rec.returnTime || '—' }}</span></div>
                  <div v-if="rec.notes" class="phone-tl-row"><span class="phone-tl-label">备注</span><span>{{ rec.notes }}</span></div>
                </div>
                <div class="phone-tl-actions">
                  <el-button size="small" text @click="openRecordDialog(rec)">编辑</el-button>
                  <el-button size="small" text type="danger" @click="deleteRecord(rec)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="ph-empty">暂无存取记录</div>
        </div>
      </div>
    </div>

    <!-- Registration Dialog -->
    <el-dialog v-model="regDialogVisible" title="手机登记" width="480px" :close-on-click-modal="false">
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>手机型号 <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="regForm.phoneModel" placeholder="如：iPhone 15 Pro" />
        </div>
        <div class="admin-form-group">
          <label>IMEI <span style="color:var(--admin-danger)">*</span></label>
          <el-input v-model="regForm.imei" placeholder="IMEI编号" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>登记日期</label>
        <el-date-picker v-model="regForm.registeredAt" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
      </div>
      <div class="admin-form-group">
        <label>设备照片</label>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="image-upload-area" @click="triggerRegImageUpload">
            <input ref="regImageInput" type="file" accept="image/*" style="display:none" @change="handleRegImageUpload" />
            <img v-if="regForm.deviceImage" :src="regForm.deviceImage" class="image-preview" />
            <div v-else class="image-placeholder">
              <span style="font-size:28px">📷</span>
              <span style="font-size:11px;color:var(--admin-text-muted)">点击上传</span>
            </div>
          </div>
          <el-button v-if="regForm.deviceImage" size="small" type="danger" @click="regForm.deviceImage = null">移除</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="regDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRegistration">{{ regEditingId ? '保存修改' : '登记' }}</el-button>
      </template>
    </el-dialog>

    <!-- Daily Record Dialog -->
    <el-dialog v-model="recordDialogVisible" :title="recordEditingId ? '编辑记录' : '今日存取登记'" width="440px" :close-on-click-modal="false">
      <div class="admin-form-group">
        <label>日期</label>
        <el-date-picker v-model="recordForm.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
      </div>
      <div class="admin-form-group">
        <label>状态</label>
        <el-select v-model="recordForm.status" style="width:100%">
          <el-option label="已上交" value="已上交" />
          <el-option label="已领取" value="已领取" />
          <el-option label="未上交" value="未上交" />
          <el-option label="违纪扣留" value="违纪扣留" />
        </el-select>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>上交时间</label>
          <el-date-picker v-model="recordForm.submitTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择时间" style="width:100%" />
        </div>
        <div class="admin-form-group">
          <label>领取时间</label>
          <el-date-picker v-model="recordForm.returnTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="选择时间" style="width:100%" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>备注</label>
        <el-input v-model="recordForm.notes" placeholder="备注信息..." />
        <div v-if="!currentRegistration" style="font-size:10px;color:var(--admin-danger);margin-top:4px">⚠ 该学生尚未登记手机信息，请先在左侧面板登记</div>
      </div>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">{{ recordEditingId ? '保存修改' : '登记' }}</el-button>
      </template>
    </el-dialog>

    <!-- Batch Dialog -->
    <el-dialog v-model="batchDialogVisible" title="📋 批量手机登记" width="700px" :close-on-click-modal="false">
      <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;align-items:flex-end">
        <div class="admin-form-group" style="margin-bottom:0">
          <label>选择班级</label>
          <el-select v-model="batchClass" size="small" style="width:110px" @change="loadBatchStudents">
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="admin-form-group" style="margin-bottom:0">
          <label>日期</label>
          <el-date-picker v-model="batchDate" size="small" type="date" value-format="YYYY-MM-DD" style="width:140px" />
        </div>
        <el-button size="small" type="success" @click="batchSetAllStatus('已上交')">全部已上交</el-button>
        <el-button size="small" type="warning" @click="batchSetAllStatus('未上交')">全部未上交</el-button>
        <span style="font-size:11px;color:var(--admin-text-muted)">{{ batchPhoneStudents.length }} 名学生</span>
      </div>
      <div class="batch-student-table">
        <table class="admin-table">
          <thead><tr><th>姓名</th><th>状态</th><th>上交时间</th><th>领取时间</th><th>备注</th></tr></thead>
          <tbody>
            <tr v-for="(bs, i) in batchPhoneStudents" :key="i">
              <td style="color:var(--admin-text);font-weight:500;min-width:70px">{{ bs.name }}</td>
              <td>
                <el-select v-model="bs.status" size="small" style="width:100px">
                  <el-option label="已上交" value="已上交" />
                  <el-option label="未上交" value="未上交" />
                  <el-option label="已领取" value="已领取" />
                  <el-option label="违纪扣留" value="违纪扣留" />
                </el-select>
              </td>
              <td>
                <el-input v-model="bs.submitTime" size="small" style="width:140px" placeholder="如：07:45" />
              </td>
              <td>
                <el-input v-model="bs.returnTime" size="small" style="width:140px" placeholder="如：17:30" />
              </td>
              <td>
                <el-input v-model="bs.notes" size="small" style="width:120px" placeholder="备注" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatch">保存全部 ({{ batchPhoneStudents.length }} 条)</el-button>
      </template>
    </el-dialog>

    <!-- Image Preview -->
    <el-dialog v-model="imagePreviewVisible" title="设备照片" width="500px">
      <div style="text-align:center">
        <img v-if="previewImageUrl" :src="previewImageUrl" style="max-width:100%;max-height:60vh;border-radius:8px" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { phoneRegistrationService, phoneRecordService, studentService } from '@/services/dataService'

const students = ref([])
const registrations = ref([])
const records = ref([])
const selectedStudentId = ref(null)
const searchText = ref('')
const filterClass = ref('')
const regDialogVisible = ref(false)
const regEditingId = ref(null)
const recordDialogVisible = ref(false)
const recordEditingId = ref(null)
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')
const regImageInput = ref(null)
const batchDialogVisible = ref(false)
const batchClass = ref('')
const batchDate = ref(new Date().toISOString().split('T')[0])
const batchPhoneStudents = ref([])

// Left panel mode
const leftMode = ref('class')
const leftTabs = [
  { key: 'class', label: '按班级' },
  { key: 'status', label: '按状态' }
]
const quickStatusFilter = ref('')

function triggerRegImageUpload() {
  regImageInput.value?.click()
}

const classList = computed(() => studentService.getClasses())

const regForm = ref({
  studentId: null, studentName: '', class: '', phoneModel: '', imei: '', deviceImage: null, registeredAt: ''
})

const recordForm = ref({
  registrationId: null, studentId: null, studentName: '', class: '', status: '已上交',
  submitTime: '', returnTime: '', date: '', notes: ''
})

onMounted(() => {
  students.value = studentService.getAll()
  registrations.value = phoneRegistrationService.getAll()
  records.value = phoneRecordService.getAll()
})

const groupedStudents = computed(() => {
  let list = students.value
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(kw))
  }
  if (filterClass.value) {
    list = list.filter(s => s.class === filterClass.value)
  }
  const groups = {}
  list.forEach(s => {
    if (!groups[s.class]) groups[s.class] = []
    groups[s.class].push(s)
  })
  return Object.entries(groups).map(([className, students]) => {
    const registeredCount = students.filter(s => getRegistration(s.id)).length
    return {
      className, students, expanded: true,
      registeredCount,
      unregisteredCount: students.length - registeredCount
    }
  })
})

// Status mode: group students by today's phone record status
const statusGroupedStudents = computed(() => {
  let list = students.value
  if (searchText.value) {
    const kw = searchText.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(kw))
  }
  if (filterClass.value) {
    list = list.filter(s => s.class === filterClass.value)
  }
  const today = new Date().toISOString().split('T')[0]
  const statuses = ['未上交', '已上交', '已领取', '违纪扣留']
  const groups = statuses.map(status => {
    const matched = list.filter(s => {
      const rec = records.value.find(r => r.studentId === s.id && r.date === today)
      const st = rec ? rec.status : '未上交'
      return st === status
    })
    return { status, students: matched, expanded: true }
  }).filter(g => {
    if (quickStatusFilter.value) return g.status === quickStatusFilter.value
    return g.students.length > 0
  })
  return groups
})

function getTodayStatus(studentId) {
  const today = new Date().toISOString().split('T')[0]
  const rec = records.value.find(r => r.studentId === studentId && r.date === today)
  return rec ? rec.status : null
}

function getTodayStatusIcon(studentId) {
  const s = getTodayStatus(studentId)
  return { '已上交': '✓', '未上交': '✗', '已领取': '←', '违纪扣留': '⚠' }[s] || ''
}

function statusDotClass(status) {
  return { '未上交': 'danger', '已上交': 'success', '已领取': 'info', '违纪扣留': 'warning' }[status] || ''
}

const unregisteredTodayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return students.value.filter(s => {
    const hasReg = getRegistration(s.id)
    if (!hasReg) return false
    return !records.value.find(r => r.studentId === s.id && r.date === today)
  }).length
})

function quickFilterUnregistered() {
  leftMode.value = 'status'
  quickStatusFilter.value = ''
}

const selectedStudent = computed(() => students.value.find(s => s.id === selectedStudentId.value) || null)

const currentRegistration = computed(() => {
  if (!selectedStudentId.value) return null
  return registrations.value.find(r => r.studentId === selectedStudentId.value) || null
})

const studentRecords = computed(() => {
  if (!selectedStudentId.value) return []
  return records.value
    .filter(r => r.studentId === selectedStudentId.value)
    .sort((a, b) => b.date.localeCompare(a.date))
})

const todayStats = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const todayRecs = records.value.filter(r => r.date === today)
  return {
    deposited: todayRecs.filter(r => r.status === '已上交').length,
    notDeposited: todayRecs.filter(r => r.status === '未上交').length,
    returned: todayRecs.filter(r => r.status === '已领取').length,
    violations: todayRecs.filter(r => r.status === '违纪扣留').length
  }
})

function getRegistration(studentId) {
  return registrations.value.find(r => r.studentId === studentId) || null
}

function selectStudent(id) {
  selectedStudentId.value = id
}

// --- Registration ---
function openRegDialog() {
  const existing = currentRegistration.value
  if (existing) {
    regEditingId.value = existing.id
    regForm.value = { ...existing }
  } else {
    regEditingId.value = null
    regForm.value = {
      studentId: selectedStudentId.value,
      studentName: selectedStudent.value?.name || '',
      class: selectedStudent.value?.class || '',
      phoneModel: '', imei: '', deviceImage: null,
      registeredAt: new Date().toISOString().split('T')[0]
    }
  }
  regDialogVisible.value = true
}

function handleRegImageUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { ElMessage.warning('图片大小不能超过5MB'); return }
  const reader = new FileReader()
  reader.onload = () => { regForm.value.deviceImage = reader.result }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function saveRegistration() {
  if (!regForm.value.phoneModel) { ElMessage.warning('请输入手机型号'); return }
  if (!regForm.value.imei) { ElMessage.warning('请输入IMEI'); return }
  if (regEditingId.value) {
    phoneRegistrationService.update(regEditingId.value, { ...regForm.value })
    ElMessage.success('手机信息已更新')
  } else {
    phoneRegistrationService.create({ ...regForm.value })
    ElMessage.success('手机已登记')
  }
  regDialogVisible.value = false
  registrations.value = phoneRegistrationService.getAll()
}

async function deleteRegistration() {
  if (!currentRegistration.value) return
  try {
    await ElMessageBox.confirm(`确定删除「${selectedStudent.value?.name}」的手机登记信息吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    phoneRegistrationService.delete(currentRegistration.value.id)
    registrations.value = phoneRegistrationService.getAll()
    ElMessage.success('已删除')
  } catch {}
}

// --- Daily Records ---
function openRecordDialog(rec) {
  if (!currentRegistration.value) {
    ElMessage.warning('请先在左侧面板为学生登记手机信息')
    return
  }
  if (rec) {
    recordEditingId.value = rec.id
    recordForm.value = { ...rec }
  } else {
    recordEditingId.value = null
    const reg = currentRegistration.value
    recordForm.value = {
      registrationId: reg.id, studentId: reg.studentId,
      studentName: reg.studentName, class: reg.class,
      status: '已上交', submitTime: '', returnTime: '',
      date: new Date().toISOString().split('T')[0], notes: ''
    }
  }
  recordDialogVisible.value = true
}

function saveRecord() {
  if (recordEditingId.value) {
    phoneRecordService.update(recordEditingId.value, { ...recordForm.value })
    ElMessage.success('记录已更新')
  } else {
    phoneRecordService.create({ ...recordForm.value })
    ElMessage.success('记录已添加')
  }
  recordDialogVisible.value = false
  records.value = phoneRecordService.getAll()
}

async function deleteRecord(rec) {
  try {
    await ElMessageBox.confirm('确定删除此条存取记录吗？', '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    phoneRecordService.delete(rec.id)
    records.value = phoneRecordService.getAll()
    ElMessage.success('已删除')
  } catch {}
}

function previewImage(reg) {
  previewImageUrl.value = reg.deviceImage
  imagePreviewVisible.value = true
}

// --- Batch Operations ---
function openBatchDialog() {
  batchClass.value = filterClass.value || classList.value[0] || ''
  batchDate.value = new Date().toISOString().split('T')[0]
  loadBatchStudents()
  batchDialogVisible.value = true
}

function loadBatchStudents() {
  if (!batchClass.value) { batchPhoneStudents.value = []; return }
  const studentsInClass = students.value.filter(s => s.class === batchClass.value)
  batchPhoneStudents.value = studentsInClass.map(s => {
    const reg = registrations.value.find(r => r.studentId === s.id)
    const today = batchDate.value
    const todayRecord = records.value.find(r => r.studentId === s.id && r.date === today)
    return {
      studentId: s.id,
      name: s.name,
      class: s.class,
      registrationId: reg?.id || null,
      status: todayRecord?.status || '已上交',
      submitTime: todayRecord?.submitTime || '',
      returnTime: todayRecord?.returnTime || '',
      notes: todayRecord?.notes || ''
    }
  })
}

function batchSetAllStatus(status) {
  batchPhoneStudents.value.forEach(bs => { bs.status = status })
}

function saveBatch() {
  if (batchPhoneStudents.value.length === 0) { ElMessage.warning('没有学生数据'); return }
  let created = 0
  batchPhoneStudents.value.forEach(bs => {
    phoneRecordService.create({
      registrationId: bs.registrationId,
      studentId: bs.studentId,
      studentName: bs.name,
      class: bs.class,
      date: batchDate.value,
      status: bs.status,
      submitTime: bs.submitTime,
      returnTime: bs.returnTime,
      notes: bs.notes
    })
    created++
  })
  records.value = phoneRecordService.getAll()
  batchDialogVisible.value = false
  ElMessage.success(`已为 ${batchClass.value} 班批量登记 ${created} 条手机存取记录`)
}
</script>

<style scoped>
.phone-layout { display: flex; gap: 16px; align-items: flex-start; }

.phone-left-panel { width: 300px; flex-shrink: 0; }
.phone-left-panel .admin-card-header { margin-bottom: 0; }

.phone-right-panel { flex: 1; min-width: 0; }

.phone-student-list { max-height: calc(100vh - 320px); overflow-y: auto; }

.phone-class-group { margin-bottom: 2px; }
.phone-class-title {
  font-size: 11px; color: var(--admin-text-muted); font-weight: 600;
  padding: 6px 8px; cursor: pointer; user-select: none;
  display: flex; align-items: center; gap: 4px;
  border-radius: 6px;
}
.phone-class-title:hover { background: var(--admin-bg); }
.phone-class-count { font-size: 10px; font-weight: 400; opacity: 0.6; }

.phone-student-items { padding-left: 4px; }
.phone-student-row {
  display: flex; align-items: center; gap: 10px; padding: 7px 8px;
  border-radius: 8px; cursor: pointer; transition: all 0.15s;
}
.phone-student-row:hover { background: var(--admin-bg); }
.phone-student-row.active { background: rgba(201,160,80,0.12); border: 1px solid var(--admin-accent); }

.phone-student-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--admin-accent); color: #1a2e3c;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 13px; flex-shrink: 0;
}

.phone-student-name { font-size: 13px; font-weight: 500; color: var(--admin-text); }
.phone-student-meta { font-size: 10px; margin-top: 1px; }
.phone-reg-badge { color: var(--admin-success); }
.phone-reg-badge.unreg { color: var(--admin-text-muted); }

/* Phone Info Card */
.phone-reg-card { }
.phone-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.phone-info-item { }
.phone-info-label { font-size: 10px; color: var(--admin-text-muted); margin-bottom: 2px; }
.phone-info-value { font-size: 13px; color: var(--admin-text); }
.phone-info-value.imei { font-size: 11px; font-family: monospace; color: var(--admin-text-secondary); }

.phone-device-img {
  width: 60px; height: 60px; object-fit: cover; border-radius: 8px;
  cursor: pointer; border: 1px solid var(--admin-border);
}
.phone-device-img:hover { border-color: var(--admin-accent); }

/* Timeline */
.phone-timeline { position: relative; padding-left: 24px; }
.phone-tl-item { position: relative; padding-bottom: 16px; }
.phone-tl-dot {
  position: absolute; left: -24px; top: 16px; width: 10px; height: 10px;
  border-radius: 50%; z-index: 1; border: 2px solid var(--admin-bg);
}
.phone-tl-dot.active { background: var(--admin-success); }
.phone-tl-dot.danger { background: var(--admin-danger); }
.phone-tl-dot.done { background: var(--admin-text-muted); }
.phone-tl-line {
  position: absolute; left: -20px; top: 26px; bottom: 0;
  width: 2px; background: var(--admin-border);
}
.phone-tl-card {
  background: var(--admin-bg); border-radius: 10px; padding: 12px;
  border: 1px solid var(--admin-border);
}
.phone-tl-card-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px;
}
.phone-tl-date { font-size: 12px; font-weight: 600; color: var(--admin-text); }
.phone-tl-card-body { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
.phone-tl-row { display: flex; gap: 12px; }
.phone-tl-label { color: var(--admin-text-muted); min-width: 56px; }
.phone-tl-actions { display: flex; gap: 4px; justify-content: flex-end; margin-top: 8px; border-top: 1px solid var(--admin-border); padding-top: 8px; }

.ph-empty { font-size: 12px; color: var(--admin-text-muted); padding: 24px 0; text-align: center; }

/* Left panel mode tabs */
.phone-mode-tab {
  flex: 1; padding: 4px 0; border: 1px solid var(--admin-border);
  background: var(--admin-bg); border-radius: var(--admin-radius-sm);
  font-size: 11px; cursor: pointer; color: var(--admin-text-muted);
  transition: all 0.2s; font-family: var(--admin-font);
}
.phone-mode-tab.active { background: var(--admin-accent); color: #fff; border-color: var(--admin-accent); }

/* Quick filter buttons */
.phone-quick-btn {
  padding: 2px 8px; border: 1px solid var(--admin-border);
  background: var(--admin-bg); border-radius: 10px; font-size: 10px;
  cursor: pointer; color: var(--admin-text-muted); font-family: var(--admin-font);
  transition: all 0.15s;
}
.phone-quick-btn:hover { border-color: var(--admin-accent); color: var(--admin-text); }
.phone-quick-btn.active { background: var(--admin-accent); color: #fff; border-color: var(--admin-accent); }
.phone-quick-btn.unsubmitted.active { background: var(--admin-danger); border-color: var(--admin-danger); }
.phone-quick-btn.submitted.active { background: var(--admin-success); border-color: var(--admin-success); }
.phone-quick-btn.returned.active { background: var(--admin-primary); border-color: var(--admin-primary); }
.phone-quick-btn.violation.active { background: var(--admin-warning); border-color: var(--admin-warning); color: #1a2e3c; }

/* Unregistered badge in header */
.phone-unreg-badge {
  background: var(--admin-danger); color: #fff; font-size: 10px;
  padding: 2px 8px; border-radius: 10px; cursor: pointer; font-weight: 500;
}

/* Enhanced class stats */
.phone-class-stat {
  font-size: 9px; padding: 0 4px; border-radius: 4px; font-weight: 500;
}
.phone-class-stat.reg { color: var(--admin-success); }
.phone-class-stat.unreg { color: var(--admin-danger); }

/* Avatar unregistered */
.phone-student-avatar.unreg { background: var(--admin-text-muted); }

/* Status groups */
.phone-status-group { margin-bottom: 2px; }
.phone-status-header {
  display: flex; align-items: center; gap: 8px; padding: 8px;
  cursor: pointer; border-radius: var(--admin-radius-sm); font-size: 12px;
  font-weight: 500; color: var(--admin-text); user-select: none;
}
.phone-status-header:hover { background: var(--admin-bg); }
.phone-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.phone-status-dot.success { background: var(--admin-success); }
.phone-status-dot.danger { background: var(--admin-danger); }
.phone-status-dot.info { background: var(--admin-primary); }
.phone-status-dot.warning { background: var(--admin-warning); }

/* Image upload */
.image-upload-area {
  width: 100px; height: 100px; border: 2px dashed var(--admin-border);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden; transition: border-color 0.2s;
}
.image-upload-area:hover { border-color: var(--admin-accent); }
.image-preview { width: 100%; height: 100%; object-fit: cover; }
.image-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; }

@media (max-width: 900px) {
  .phone-layout { flex-direction: column; }
  .phone-left-panel { width: 100%; }
  .phone-student-list { max-height: 220px; }
}
</style>
