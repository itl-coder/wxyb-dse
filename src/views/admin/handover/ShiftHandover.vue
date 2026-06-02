<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">🤝 早晚班交接 — 数据配置</div>
          <div class="admin-card-subtitle">配置本周交接内容 · 前台将以此为数据源展示 · <el-button size="small" text
              style="color:var(--admin-accent-light)" @click="$router.push('/handover')">查看前台效果 →</el-button></div>
        </div>
        <div class="hoa-actions">
          <el-button size="small" @click="goToday" text>📍 回到本周</el-button>
          <el-button size="small" type="primary" @click="saveAll" :loading="savingAll">💾 保存全部</el-button>
        </div>
      </div>
    </div>

    <!-- 周导航 -->
    <div class="admin-card hoa-week-card">
      <div class="hoa-week-top">
        <button class="hoa-arr" @click="prevWeek">◂</button>
        <span class="hoa-week-label">{{ weekLabel }}</span>
        <button class="hoa-arr" @click="nextWeek">▸</button>
      </div>
      <div class="hoa-week-grid">
        <button v-for="d in weekDays" :key="d.key" class="hoa-day-btn"
          :class="{ today: d.isToday, active: activeDay === d.key, saved: d.hasRecord }" @click="switchDay(d.key)">
          <span class="hoa-dn">{{ d.label }} {{ d.dateStr }}</span>
          <span v-if="d.shift" class="hoa-ds" :class="d.shift === 'L' ? 'sl' : d.shift === 'M' ? 'sm' : 'sa'">{{ d.shift
            === 'L' ? '早班' : d.shift === 'M' ? '晚班' : 'A班' }}</span>
          <span v-else class="hoa-ds so">休</span>
          <span v-if="d.hasRecord" class="hoa-dot">●</span>
        </button>
      </div>
    </div>

    <!-- 当前天表单 -->
    <div class="hoa-main-grid">
      <div class="hoa-form-col">
        <div class="admin-card hoa-day-head">
          <div class="hoa-class-tabs">
            <button v-for="cn in classNames" :key="cn" class="hoa-class-tab" :class="{ active: activeClass === cn }"
              @click="switchClass(cn)">{{ cn }}</button>
          </div>
          <div class="hoa-dh-inner">
            <h3>{{ activeDayLabel }} · {{ activeClass }}</h3>
            <span v-if="activeShift" class="hoa-shift-badge"
              :class="activeShift === 'L' ? 'sl' : activeShift === 'M' ? 'sm' : 'sa'">
              {{
                activeShift === 'L'
                  ? '🌅 早班 7:30-16:30'
                  : activeShift === 'M'
                    ? '🌇 晚班 13:00-22:00'
                    : '☀️ A班 9:00-18:00'
              }}
            </span>
            <span v-else class="hoa-shift-badge so">💤 休息日 — 无需配置</span>
            <el-button v-if="activeShift" size="small" type="primary" @click="saveCurrentDay" :loading="saving">💾
              保存当天</el-button>
          </div>
        </div>

        <template v-if="activeShift">
          <!-- 作业收集 -->
          <div class="admin-card hoa-sec">
            <div class="hoa-sec-hd" @click="toggleSec('hw')">
              <span>📝 作业收集 <em class="hoa-badge">{{ form.homeworkItems.length }}科</em></span>
              <span style="display:flex;align-items:center;gap:8px">
                <el-switch v-model="form.sections.homework" size="small" @click.stop />
                <span class="hoa-arr">{{ sec.hw ? '▾' : '▸' }}</span>
              </span>
            </div>
            <div v-show="sec.hw" class="hoa-sec-bd">
              <div v-if="form.homeworkItems.length === 0" class="hoa-empty">暂无，点击下方添加</div>

              <div v-for="(item, idx) in form.homeworkItems" :key="idx" class="hw-card" :class="{ folded: isCollapsed(idx) }">
                <div class="hw-bar" @click="toggleCollapse(idx)">
                  <span class="hw-bar-icon">{{ getSubjectIcon(item.subject) }}</span>
                  <div class="hw-bar-main">
                    <el-select v-if="!item.subject" v-model="item.subject" size="small" style="width:150px" placeholder="选择科目" @click.stop>
                      <el-option v-for="s in subjects" :key="s" :label="s" :value="s" /></el-select>
                    <span v-else class="hw-bar-name" @dblclick.stop="item.subject = ''" title="双击换科目">{{ item.subject }}</span>
                    <span v-if="item.homeworkContent && isCollapsed(idx)" class="hw-bar-desc">{{ item.homeworkContent }}</span>
                  </div>
                  <el-select v-model="item.graded" size="small" style="width:100px" @click.stop>
                    <el-option label="未批改" :value="false" /><el-option label="已批改" :value="true" /><el-option label="部分批改" value="partial" /></el-select>
                  <span class="hw-bar-arrow">{{ isCollapsed(idx) ? '▸' : '▾' }}</span>
                  <button class="hw-bar-del" @click.stop="form.homeworkItems.splice(idx, 1)">✕</button>
                </div>

                <div v-show="!isCollapsed(idx)" class="hw-body">
                  <el-input v-model="item.homeworkContent" size="small" placeholder="作业内容（练习册页码、作文题目…）" />

                  <div class="hw-stats">
                    <div class="hw-stat">
                      <span class="hw-stat-num" @dblclick.stop="startEdit(idx,'totalCount')">
                        <input v-if="isEditing(idx,'totalCount')" type="number" min="0" :value="item.totalCount" @input="e=>item.totalCount=Number(e.target.value)" @blur="stopEdit(idx)" @keydown.enter="stopEdit(idx)" class="hw-stat-input" />
                        <span v-else>{{ item.totalCount || 0 }}</span>
                      </span>
                      <span class="hw-stat-lbl">应交</span>
                    </div>
                    <div class="hw-stat ok">
                      <span class="hw-stat-num" @dblclick.stop="startEdit(idx,'submittedCount')">
                        <input v-if="isEditing(idx,'submittedCount')" type="number" min="0" :value="item.submittedCount" @input="e=>item.submittedCount=Number(e.target.value)" @blur="stopEdit(idx)" @keydown.enter="stopEdit(idx)" class="hw-stat-input" />
                        <span v-else>{{ item.submittedCount || 0 }}</span>
                      </span>
                      <span class="hw-stat-lbl">实交</span>
                    </div>
                    <div class="hw-stat bad">
                      <span class="hw-stat-num" @dblclick.stop="startEdit(idx,'missingCount')">
                        <input v-if="isEditing(idx,'missingCount')" type="number" min="0" :value="item.missingCount" @input="e=>item.missingCount=Number(e.target.value)" @blur="stopEdit(idx)" @keydown.enter="stopEdit(idx)" class="hw-stat-input" />
                        <span v-else>{{ item.missingCount || 0 }}</span>
                      </span>
                      <span class="hw-stat-lbl">缺交</span>
                    </div>
                  </div>

                  <div class="hw-names">
                    <div class="hw-name-row"><span class="hw-name-tag ok">已交</span><el-input v-model="item.submittedNames" size="small" placeholder="已交学生，逗号分隔" /></div>
                    <div class="hw-name-row"><span class="hw-name-tag bad">缺交</span><el-input v-model="item.missingNames" size="small" placeholder="缺交学生，逗号分隔" /></div>
                  </div>

                  <div class="hw-late" :class="{ on: item.hasLateSubmission }">
                    <label class="hw-late-bar" @click.stop><el-switch v-model="item.hasLateSubmission" size="small" /><span>补交作业</span></label>
                    <div v-if="item.hasLateSubmission" class="hw-late-form">
                      <div class="hw-late-row">
                        <el-input-number v-model="item.lateCount" size="small" :min="0" placeholder="份数" style="width:80px" />
                        <el-input v-model="item.lateNames" size="small" placeholder="补交学生" style="flex:1" />
                      </div>
                      <div class="hw-late-row">
                        <el-input v-model="item.lateContent" size="small" placeholder="补交内容" style="flex:1" />
                        <el-input v-model="item.lateReason" size="small" placeholder="补交原因" style="flex:1" />
                      </div>
                    </div>
                  </div>

                  <div class="hw-foot">
                    <el-input v-model="item.location" size="small" placeholder="放置位置" style="flex:1" />
                    <el-input v-model="item.notes" size="small" placeholder="补充说明…" style="flex:2" />
                  </div>
                </div>
              </div>

              <button class="hoa-add" @click="addHomework">+ 添加科目作业</button>
            </div>
          </div>

          <!-- 会议纪要 -->
          <div class="admin-card hoa-sec">
            <div class="hoa-sec-hd" @click="toggleSec('mt')">
              <span>📋 会议纪要 <em class="hoa-badge" :class="{ on: form.meetingNotes.hasMeeting }">{{
                form.meetingNotes.hasMeeting ? '有' : '无' }}</em></span>
              <span style="display:flex;align-items:center;gap:8px"><el-switch v-model="form.sections.meeting"
                  size="small" @click.stop /> <span class="hoa-arr">{{ sec.mt ? '▾' : '▸' }}</span></span>
            </div>
            <div v-show="sec.mt" class="hoa-sec-bd">
              <div class="hoa-sw-row"><span>当日有会议</span><el-switch v-model="form.meetingNotes.hasMeeting"
                  size="small" /></div>
              <template v-if="form.meetingNotes.hasMeeting">
                <div class="admin-form-group"><label>主题</label><el-input v-model="form.meetingNotes.title" size="small"
                    placeholder="会议主题" /></div>
                <div class="admin-form-group"><label>纪要</label><el-input v-model="form.meetingNotes.content"
                    size="small" type="textarea" :rows="4" placeholder="讨论内容、决议、待办…" /></div>
                <div class="admin-form-group"><label>录音</label>
                  <div class="hoa-rec">
                    <div v-if="!form.meetingNotes.recordingUrl">
                      <button v-if="!recording" class="hoa-rec-btn" @click="startRecord">🎙️ 录音</button>
                      <button v-else class="hoa-rec-btn recing" @click="stopRecord">⏹️ 停止 ({{ fmtDur(recDur)
                      }})</button>
                    </div>
                    <div v-else>
                      <audio :src="form.meetingNotes.recordingUrl" controls style="width:100%;height:30px" />
                      <button class="hoa-rec-clr" @click="clearRec">删除</button>
                    </div>
                    <p class="hoa-rec-hint">录音仅保存在本地浏览器</p>
                  </div>
                </div>
                <div class="admin-form-group"><label>转文字</label><el-input v-model="form.meetingNotes.transcription"
                    size="small" type="textarea" :rows="3" placeholder="粘贴语音转文字结果…" /></div>
              </template>
            </div>
          </div>

          <!-- 学生情况 -->
          <div class="admin-card hoa-sec">
            <div class="hoa-sec-hd" @click="toggleSec('stu')">
              <span>👥 学生特殊情况 <em class="hoa-badge">{{ form.studentSituations.length }}条</em></span>
              <span style="display:flex;align-items:center;gap:8px"><el-switch v-model="form.sections.students"
                  size="small" @click.stop /> <span class="hoa-arr">{{ sec.stu ? '▾' : '▸' }}</span></span>
            </div>
            <div v-show="sec.stu" class="hoa-sec-bd">
              <div v-if="form.studentSituations.length === 0" class="hoa-empty">暂无，点击下方添加</div>
              <div v-for="(item, idx) in form.studentSituations" :key="idx" class="hoa-item">
                <div class="hoa-item-row">
                  <el-input v-model="item.studentName" size="small" style="width:100px" placeholder="姓名" />
                  <el-select v-model="item.type" size="small" style="width:115px"><el-option v-for="t in stuTypes"
                      :key="t" :label="t" :value="t" /></el-select>
                  <el-switch v-model="item.handled" size="small" active-text="已处理" inactive-text="待跟进" />
                  <button class="hoa-rm" @click="form.studentSituations.splice(idx, 1)">✕</button>
                </div>
                <div class="hoa-item-fields">
                  <el-input v-model="item.description" size="small" type="textarea" :rows="2" placeholder="详细描述…"
                    style="margin-bottom:6px" />
                  <el-input v-model="item.followUp" size="small" placeholder="接班同事需注意什么" />
                </div>
              </div>
              <button class="hoa-add" @click="addStudent">+ 添加学生情况</button>
            </div>
          </div>

          <!-- 手机管理 -->
          <div class="admin-card hoa-sec">
            <div class="hoa-sec-hd" @click="toggleSec('phone')">
              <span>📱 班级手机管理 <em class="hoa-badge" :class="{ on: form.sections.phones }">{{ form.sections.phones ? '开'
                : '关'
                  }}</em></span>
              <span style="display:flex;align-items:center;gap:8px"><el-switch v-model="form.sections.phones"
                  size="small" @click.stop /> <span class="hoa-arr">{{ sec.phone ? '▾' : '▸' }}</span></span>
            </div>
            <div v-show="sec.phone" class="hoa-sec-bd">
              <div class="hoa-phone-grid">
                <div class="admin-form-group"><label>班级手机总数</label><el-input-number
                    v-model="form.phoneManagement.totalPhones" size="small" :min="0" style="width:100%" /></div>
                <div class="admin-form-group"><label>实际收到数量</label><el-input-number
                    v-model="form.phoneManagement.receivedPhones" size="small" :min="0" style="width:100%" /></div>
              </div>
              <div class="admin-form-group"><label>未交原因</label><el-input v-model="form.phoneManagement.unreceivedReason"
                  size="small" placeholder="如：A同学请假未交、B同学家长未同意…" />
              </div>
              <p class="hoa-rec-hint">学生请假时手机会直接发放，不计入实收数量</p>
            </div>
          </div>

          <!-- 请假记录 -->
          <div class="admin-card hoa-sec">
            <div class="hoa-sec-hd" @click="toggleSec('leave')">
              <span>🏥 请假情况 <em class="hoa-badge">{{ form.leaveRecords.length }}人</em></span>
              <span style="display:flex;align-items:center;gap:8px"><el-switch v-model="form.sections.leave"
                  size="small" @click.stop /> <span class="hoa-arr">{{ sec.leave ? '▾' : '▸' }}</span></span>
            </div>
            <div v-show="sec.leave" class="hoa-sec-bd">
              <div v-if="form.leaveRecords.length === 0" class="hoa-empty">暂无请假记录，点击下方添加</div>
              <div v-for="(item, idx) in form.leaveRecords" :key="idx" class="hoa-item">
                <div class="hoa-item-row">
                  <el-input v-model="item.studentName" size="small"
                    style="width:90px;border: 1px solid #fff; border-radius: 2px;" placeholder="学生姓名" />
                  <el-select v-model="item.reason" size="small" style="width:100px" placeholder="事由"><el-option
                      v-for="r in leaveReasons" :key="r" :label="r" :value="r" /></el-select>
                  <el-switch v-model="item.parentNotified" size="small" active-text="家长知晓" inactive-text="待通知" />
                  <button class="hoa-rm" @click="form.leaveRecords.splice(idx, 1)">✕</button>
                </div>
                <div class="hoa-item-fields">
                  <div class="hoa-leave-grid">
                    <div><label class="hoa-mini-label">离校时间</label><el-input v-model="item.leaveTime" size="small"
                        style="border: 1px solid #fff; border-radius: 2px;" placeholder="如：14:30" /></div>
                    <div class="hoa-leave-phone"><label class="hoa-mini-label">手机发放</label><el-switch
                        v-model="item.phoneGiven" size="small" active-text="已给" inactive-text="未给" /></div>
                  </div>
                </div>
              </div>
              <button class="hoa-add" @click="addLeaveRecord">+ 添加请假记录</button>
            </div>
          </div>

          <!-- 备注 -->
          <div class="admin-card hoa-sec">
            <div class="hoa-sec-hd" @click="toggleSec('note')">
              <span>📌 其他备注</span>
              <span style="display:flex;align-items:center;gap:8px"><el-switch v-model="form.sections.notes"
                  size="small" @click.stop /> <span class="hoa-arr">{{ sec.note ? '▾' : '▸' }}</span></span>
            </div>
            <div v-show="sec.note" class="hoa-sec-bd">
              <el-input v-model="form.generalNotes" size="small" type="textarea" :rows="4"
                placeholder="物品借用、设备问题、临时通知…" />
            </div>
          </div>
        </template>
        <div v-else class="admin-card hoa-rest">☕ 该日为休息日，无需配置交接内容。</div>
      </div>

      <!-- 右侧：班次配置 + 导出 -->
      <div class="hoa-side-col">
        <div class="admin-card">
          <div class="admin-card-title" style="font-size:13px;margin-bottom:10px">⚙️ 本周班次</div>
          <div class="hoa-sc-list">
            <div v-for="d in weekDays" :key="'sc-' + d.key" class="hoa-sc-row">
              <span class="hoa-sc-day">{{ d.label }} {{ d.dateStr }}</span>
              <el-select v-model="shiftConfig[d.key]" size="small" style="width:80px" @change="saveShiftCfg">
                <el-option label="早 L" value="L" /><el-option label="晚 M" value="M" /><el-option label="A班 A"
                  value="A" /><el-option label="休" value="" />
              </el-select>
            </div>
          </div>
          <p class="hoa-sc-legend">L=7:30-16:30 / M=13:00-22:00 / A=9:00-18:00</p>
        </div>

        <div class="admin-card">
          <div class="admin-card-title" style="font-size:13px;margin-bottom:10px">🏫 班级名称</div>
          <div class="hoa-cn-list">
            <div v-for="(cn, i) in classNames" :key="i" class="hoa-cn-row">
              <span class="hoa-sc-day">班级{{ i + 1 }}</span>
              <el-input v-model="classNames[i]" size="small" style="width:100px" @change="saveClassNames"
                placeholder="如：A1 班" />
            </div>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-title" style="font-size:13px;margin-bottom:10px">📋 本周预览</div>
          <div v-for="d in weekDays" :key="'pv-' + d.key" class="hoa-pv-row">
            <span class="hoa-pv-day">{{ d.label }}</span>
            <span v-if="!d.shift" class="hoa-pv-status off">休</span>
            <span v-else-if="d.hasRecord" class="hoa-pv-status ok">✓ 已配置</span>
            <span v-else class="hoa-pv-status no">○ 待配置</span>
          </div>
          <el-button size="small" style="width:100%;margin-top:10px" @click="$router.push('/handover')">👁️
            预览前台展示</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 页面：早晚班交接数据配置
 * 功能：按周、按班级配置早晚班交接内容（作业收集、会议纪要、学生情况、手机管理、请假记录等）
 * 路由：/admin/shift-handover
 */
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { dseApi } from '@/api/dse'
import { shiftConfigService } from '@/services/dataService'

const handoverApi = dseApi('handover')

// 缓存所有交接记录
let allHandoverRecords = []

async function loadAllRecords() {
  try { const r = await handoverApi.getAll(); allHandoverRecords = r.data || [] } catch { allHandoverRecords = [] }
}
function hasForDate(ds) { return allHandoverRecords.some(r => r.date === ds) }
function getByDate(ds) { return allHandoverRecords.filter(r => r.date === ds) }

// ===== 班次 =====
const shiftConfig = ref(shiftConfigService.get())
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const subjects = ['中国语文', '英语阅读', '英语写作', '英语听力', '英语口语', '数学', '公民与社会发展', '物理', '化学', '生物', '经济', '历史', '地理', '中国历史', '资讯及通讯科技', '企业、会计与财务概论', '视觉艺术', '数学延伸M1', '数学延伸M2']
const stuTypes = ['情绪波动', '身体不适', '学习问题', '行为问题', '家庭情况', '请假离校', '进步表扬', '家长请假', '其他事项']
const leaveReasons = ['病假', '事假', '家庭原因', '校外活动', '其他']

function saveShiftCfg() { shiftConfigService.save(shiftConfig.value); ElMessage.success('班次已保存') }

function getMonday(d) { const dd = new Date(d); const day = dd.getDay(); dd.setDate(dd.getDate() - day + (day === 0 ? -6 : 1)); return dd }
const weekStart = ref(getMonday(new Date()))
function dateKeyToISO(dk, ws) { const idx = dayKeys.indexOf(dk); const d = new Date(ws); d.setDate(d.getDate() + idx); return d.toISOString().split('T')[0] }
const weekLabel = computed(() => { const m = new Date(weekStart.value); const s = new Date(weekStart.value); s.setDate(s.getDate() + 6); return `${m.getFullYear()}.${m.getMonth() + 1}.${m.getDate()} – ${s.getMonth() + 1}.${s.getDate()}` })
function prevWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() - 7); weekStart.value = d }
function nextWeek() { const d = new Date(weekStart.value); d.setDate(d.getDate() + 7); weekStart.value = d }
function goToday() { weekStart.value = getMonday(new Date()); activeDay.value = getTodayKey(); loadDay() }
function getTodayKey() { const t = new Date(); const day = t.getDay(); return dayKeys[day === 0 ? 6 : day - 1] }
function fmtDateShort(d) { const dd = new Date(d); return `${dd.getMonth() + 1}/${dd.getDate()}` }

const weekDays = computed(() => dayKeys.map((k, i) => {
  const d = new Date(weekStart.value); d.setDate(d.getDate() + i); const ds = d.toISOString().split('T')[0]
  return { key: k, label: dayLabels[i], dateStr: fmtDateShort(d), shift: shiftConfig.value[k] || '', isToday: d.toDateString() === new Date().toDateString(), hasRecord: hasForDate(ds) }
}))

// ===== 选中天 =====
const activeDay = ref(getTodayKey())
const activeDayLabel = computed(() => { const w = weekDays.value.find(d => d.key === activeDay.value); return w ? `${w.label} ${w.dateStr}` : '' })
const activeShift = computed(() => shiftConfig.value[activeDay.value] || '')

const sec = reactive({ hw: true, mt: false, stu: false, phone: false, leave: false, note: false })
function toggleSec(k) { sec[k] = !sec[k] }

// ===== 班级 =====
const CLASS_NAMES_KEY = 'dse_handover_classNames'
const defaultClassNames = ['A1 班', '港大班']
function loadClassNames() { try { const v = localStorage.getItem(CLASS_NAMES_KEY); return v ? JSON.parse(v) : [...defaultClassNames] } catch { return [...defaultClassNames] } }
function saveClassNames() { localStorage.setItem(CLASS_NAMES_KEY, JSON.stringify(classNames.value)) }
const classNames = ref(loadClassNames())
const activeClass = ref(classNames.value[0] || 'A1 班')

// ===== 表单 =====
const emptyForm = () => ({ date: '', shift: '', className: activeClass.value, sections: { homework: true, meeting: true, students: true, phones: false, leave: false, notes: true }, homeworkItems: [], meetingNotes: { hasMeeting: false, title: '', content: '', recordingUrl: '', transcription: '' }, studentSituations: [], phoneManagement: { enabled: false, totalPhones: 0, receivedPhones: 0, unreceivedReason: '' }, leaveRecords: [], generalNotes: '' })
const form = reactive(emptyForm())
const editingId = ref(null)
const saving = ref(false)
const savingAll = ref(false)

const subjectIcons = {
  '中国语文': '📖', '英语阅读': '📰', '英语写作': '✍️', '英语听力': '🎧', '英语口语': '🗣️', '数学': '🔢',
  '公民与社会发展': '🏛️', '物理': '⚡', '化学': '🧪', '生物': '🧬', '经济': '💰', '历史': '📜',
  '地理': '🌍', '中国历史': '🏯', '资讯及通讯科技': '💻', '企业、会计与财务概论': '📊',
  '视觉艺术': '🎨', '数学延伸M1': '📐', '数学延伸M2': '📏'
}
function getSubjectIcon(subject) { return subjectIcons[subject] || '📝' }

function addHomework() {
  form.homeworkItems.push({
    subject: '', homeworkContent: '', totalCount: 0, submittedCount: 0, missingCount: 0,
    submittedNames: '', missingNames: '',
    showSubmitted: true, showMissing: true,
    hasLateSubmission: false, lateCount: 0, lateNames: '', lateContent: '', lateReason: '',
    location: '', graded: false, notes: ''
  })
}

// 折叠状态
const collapsedItems = ref(new Set())
function isCollapsed(idx) { return collapsedItems.value.has(idx) }
function toggleCollapse(idx) { collapsedItems.value.has(idx) ? collapsedItems.value.delete(idx) : collapsedItems.value.add(idx) }

// 双击编辑数值
const editingKey = ref(null) // `${idx}-${field}`
function isEditing(idx, field) { return editingKey.value === `${idx}-${field}` }
function startEdit(idx, field) { editingKey.value = `${idx}-${field}` }
function stopEdit() { editingKey.value = null }

function gradedLabel(v) { return v === true ? '已批改' : v === 'partial' ? '部分批改' : '未批改' }
function addStudent() { form.studentSituations.push({ studentName: '', type: '其他事项', description: '', handled: false, followUp: '' }) }
function addLeaveRecord() { form.leaveRecords.push({ studentName: '', reason: '', parentNotified: false, leaveTime: '', phoneGiven: false }) }

function switchDay(dk) { if (activeDay.value === dk) return; activeDay.value = dk; loadDay() }
function switchClass(cls) { if (activeClass.value === cls) return; activeClass.value = cls; loadDay() }
async function loadDay() {
  await loadAllRecords()
  const ds = dateKeyToISO(activeDay.value, weekStart.value)
  const records = getByDate(ds)
  const shift = activeShift.value
  const cls = activeClass.value
  if (records.length > 0) { const m = records.find(r => r.shift === shift && r.className === cls) || records.find(r => r.className === cls) || null; if (m) loadRecord(m); else { resetForm(); form.date = ds; form.shift = shift; form.className = cls } }
  else { resetForm(); form.date = ds; form.shift = shift; form.className = cls }
}
function resetForm() { editingId.value = null; const e = emptyForm(); Object.keys(e).forEach(k => { if (k === 'homeworkItems' || k === 'studentSituations' || k === 'leaveRecords') form[k] = []; else if (k === 'meetingNotes') form.meetingNotes = { hasMeeting: false, title: '', content: '', recordingUrl: '', transcription: '' }; else if (k === 'phoneManagement') form.phoneManagement = { enabled: false, totalPhones: 0, receivedPhones: 0, unreceivedReason: '' }; else if (k === 'sections') form.sections = { homework: true, meeting: true, students: true, phones: false, leave: false, notes: true }; else if (k === 'className') form.className = activeClass.value; else form[k] = e[k] }) }
function loadRecord(rec) {
  editingId.value = rec.id; form.date = rec.date; form.shift = rec.shift || ''; form.className = rec.className || ''
  form.homeworkItems = rec.homeworkItems ? JSON.parse(JSON.stringify(rec.homeworkItems)).map(h => ({
    subject: h.subject || '', homeworkContent: h.homeworkContent || '', totalCount: h.totalCount || 0, submittedCount: h.submittedCount || h.count || 0,
    submittedNames: h.submittedNames || '', missingNames: h.missingNames || h.studentNames || '',
    missingCount: h.missingCount || 0,
    showSubmitted: h.showSubmitted !== undefined ? h.showSubmitted : true, showMissing: h.showMissing !== undefined ? h.showMissing : true,
    hasLateSubmission: h.hasLateSubmission || false, lateCount: h.lateCount || 0, lateNames: h.lateNames || '', lateContent: h.lateContent || '', lateReason: h.lateReason || '',
    location: h.location || '', graded: h.graded || false, notes: h.notes || ''
  })) : []
  form.meetingNotes = rec.meetingNotes ? JSON.parse(JSON.stringify(rec.meetingNotes)) : { hasMeeting: false, title: '', content: '', recordingUrl: '', transcription: '' }
  form.studentSituations = rec.studentSituations ? JSON.parse(JSON.stringify(rec.studentSituations)) : []
  form.phoneManagement = rec.phoneManagement ? JSON.parse(JSON.stringify(rec.phoneManagement)) : { enabled: false, totalPhones: 0, receivedPhones: 0, unreceivedReason: '' }
  form.leaveRecords = rec.leaveRecords ? JSON.parse(JSON.stringify(rec.leaveRecords)) : []
  form.sections = rec.sections ? JSON.parse(JSON.stringify(rec.sections)) : { homework: true, meeting: true, students: true, phones: false, leave: false, notes: true }
  form.generalNotes = rec.generalNotes || ''
}

async function saveCurrentDay() {
  if (!form.date || !form.shift) return ElMessage.warning('请设置班次')
  saving.value = true
  try {
    const data = { date: form.date, shift: form.shift, className: form.className, sections: JSON.parse(JSON.stringify(form.sections)), homeworkItems: JSON.parse(JSON.stringify(form.homeworkItems.filter(h => h.subject))), meetingNotes: JSON.parse(JSON.stringify(form.meetingNotes)), studentSituations: JSON.parse(JSON.stringify(form.studentSituations.filter(s => s.studentName))), phoneManagement: JSON.parse(JSON.stringify(form.phoneManagement)), leaveRecords: JSON.parse(JSON.stringify(form.leaveRecords.filter(l => l.studentName))), generalNotes: form.generalNotes }
    if (editingId.value) { await handoverApi.update(editingId.value, data) } else { const c = await handoverApi.create(data); editingId.value = c.data?.id || c.id }
    ElMessage.success('已保存')
  } catch { ElMessage.error('保存失败') }
  finally { saving.value = false }
}

// 保存全部 (循环保存当前已加载的天 + 提示)
async function saveAll() {
  savingAll.value = true
  try {
    await saveCurrentDay()
    ElMessage.success('当前天已保存。切换至其他天继续配置。')
  } catch { ElMessage.error('保存失败') }
  finally { savingAll.value = false }
}

// ===== 录音 =====
const recording = ref(false); const recDur = ref(0)
let mr = null, chunks = [], recInt = null
async function startRecord() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mr = new MediaRecorder(stream, { mimeType: 'audio/webm' }); chunks = []
    mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    mr.onstop = () => { form.meetingNotes.recordingUrl = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' })); stream.getTracks().forEach(t => t.stop()); recording.value = false; clearInterval(recInt); ElMessage.success('录音已保存') }
    mr.start(); recording.value = true; recDur.value = 0; recInt = setInterval(() => { recDur.value++ }, 1000)
  } catch { ElMessage.error('无法访问麦克风') }
}
function stopRecord() { if (mr?.state === 'recording') mr.stop() }
function clearRec() { if (form.meetingNotes.recordingUrl) URL.revokeObjectURL(form.meetingNotes.recordingUrl); form.meetingNotes.recordingUrl = '' }
function fmtDur(s) { const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}` }

onMounted(loadDay)
watch(weekStart, () => { activeDay.value = 'monday'; loadDay() })
onUnmounted(() => { if (recInt) clearInterval(recInt); if (cdTimer) clearInterval(cdTimer) })
</script>

<style scoped>
.hoa-actions {
  display: flex;
  gap: 8px
}

.hoa-week-card {
  padding: 14px 18px;
  margin-bottom: 12px
}

.hoa-week-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px
}

.hoa-arr {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--admin-border);
  background: transparent;
  color: var(--admin-text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-family: var(--admin-font)
}

.hoa-arr:hover {
  background: var(--admin-surface-hover);
  color: var(--admin-text)
}

.hoa-week-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--admin-text)
}

.hoa-week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px
}

.hoa-day-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 8px 2px;
  border-radius: 8px;
  border: 1px solid var(--admin-border);
  background: var(--admin-bg-secondary);
  cursor: pointer;
  color: var(--admin-text-secondary);
  font-family: var(--admin-font);
  position: relative;
  transition: all .15s
}

.hoa-day-btn:hover {
  background: var(--admin-surface-hover)
}

.hoa-day-btn.active {
  border-color: var(--admin-accent);
  background: rgba(99, 102, 241, .08)
}

.hoa-day-btn.today {
  box-shadow: inset 0 0 0 1px var(--admin-accent-cyan)
}

.hoa-dn {
  font-size: 10px;
  font-weight: 600;
  color: var(--admin-text)
}

.hoa-ds {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px
}

.sl {
  background: rgba(245, 158, 11, .15);
  color: var(--admin-warning)
}

.sm {
  background: rgba(99, 102, 241, .15);
  color: var(--admin-accent-light)
}

.sa {
  background: rgba(16, 185, 129, .15);
  color: var(--admin-success)
}

.so {
  color: var(--admin-text-muted)
}

.hoa-dot {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: 6px;
  color: var(--admin-success)
}

.hoa-main-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 12px;
  align-items: start
}

.hoa-form-col {
  min-width: 0
}

.hoa-side-col {
  position: sticky;
  top: calc(var(--admin-header-height) + 20px)
}

.hoa-day-head {
  padding: 14px 16px;
  margin-bottom: 10px
}

.hoa-dh-inner {
  display: flex;
  align-items: center;
  gap: 10px
}

.hoa-dh-inner h3 {
  margin: 0;
  font-size: 15px;
  color: var(--admin-text);
  flex: 1
}

.hoa-shift-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 5px
}

.hoa-shift-badge.so {
  color: var(--admin-text-muted)
}

.hoa-sec {
  padding: 0;
  overflow: hidden;
  margin-bottom: 10px
}

.hoa-sec-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: var(--admin-text);
  font-weight: 500;
  transition: background .15s
}

.hoa-sec-hd:hover {
  background: var(--admin-surface-hover)
}

.hoa-badge {
  font-style: normal;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 8px;
  background: var(--admin-bg);
  color: var(--admin-text-muted);
  margin-left: 6px
}

.hoa-badge.on {
  background: rgba(245, 158, 11, .12);
  color: var(--admin-warning)
}

.hoa-arr {
  font-size: 12px;
  color: var(--admin-text-muted)
}

.hoa-sec-bd {
  padding: 0 14px 14px
}

.hoa-empty {
  text-align: center;
  padding: 18px;
  font-size: 11px;
  color: var(--admin-text-muted);
  background: var(--admin-bg);
  border-radius: 6px;
  margin-bottom: 8px
}

.hoa-item {
  background: var(--admin-bg);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px
}

.hoa-item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap
}

.hoa-item-fields {
  display: flex;
  flex-direction: column
}

.hoa-unit {
  font-size: 11px;
  color: var(--admin-text-muted)
}

.hoa-rm {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--admin-text-muted);
  cursor: pointer;
  font-size: 13px;
  margin-left: auto;
  font-family: var(--admin-font)
}

.hoa-rm:hover {
  background: rgba(248, 113, 113, .1);
  color: var(--admin-danger)
}

.hoa-add {
  width: 100%;
  padding: 9px;
  border: 1px dashed var(--admin-border);
  border-radius: 6px;
  background: transparent;
  color: var(--admin-text-muted);
  font-size: 11px;
  cursor: pointer;
  font-family: var(--admin-font);
  transition: all .15s
}

.hoa-add:hover {
  border-color: var(--admin-accent);
  color: var(--admin-accent-light)
}

.hoa-sw-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 12px;
  color: var(--admin-text-secondary)
}

.hoa-rec {
  background: var(--admin-bg);
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  padding: 12px;
  text-align: center
}

.hoa-rec-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: 1px solid var(--admin-border);
  background: transparent;
  color: var(--admin-accent-light);
  cursor: pointer;
  font-family: var(--admin-font);
  font-size: 13px
}

.hoa-rec-btn.recing {
  color: var(--admin-danger);
  border-color: rgba(248, 113, 113, .2);
  animation: pulse 1.5s infinite
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1
  }

  50% {
    opacity: .5
  }
}

.hoa-rec-clr {
  padding: 3px 8px;
  border-radius: 4px;
  border: none;
  background: rgba(248, 113, 113, .1);
  color: var(--admin-danger);
  font-size: 10px;
  cursor: pointer;
  margin-left: 6px;
  font-family: var(--admin-font)
}

.hoa-rec-hint {
  font-size: 10px;
  color: var(--admin-text-muted);
  margin: 6px 0 0
}

.hoa-rest {
  text-align: center;
  padding: 36px;
  font-size: 13px;
  color: var(--admin-text-muted)
}

.hoa-sc-list {
  display: flex;
  flex-direction: column;
  gap: 2px
}

.hoa-sc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  border-radius: 4px
}

.hoa-sc-day {
  font-size: 11px;
  color: var(--admin-text-secondary)
}

.hoa-sc-legend {
  font-size: 10px;
  color: var(--admin-text-muted);
  margin-top: 8px;
  text-align: center
}

.hoa-pv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 11px
}

.hoa-pv-day {
  color: var(--admin-text-secondary)
}

.hoa-pv-status.ok {
  color: var(--admin-success)
}

.hoa-pv-status.no {
  color: var(--admin-text-muted)
}

.hoa-pv-status.off {
  color: var(--admin-text-muted)
}

.hoa-class-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px
}

.hoa-class-tab {
  padding: 6px 18px;
  border-radius: 6px;
  border: 1px solid var(--admin-border);
  background: var(--admin-bg-secondary);
  color: var(--admin-text-secondary);
  font-size: 12px;
  cursor: pointer;
  font-family: var(--admin-font);
  transition: all .15s
}

.hoa-class-tab:hover {
  background: var(--admin-surface-hover)
}

.hoa-class-tab.active {
  background: var(--admin-accent);
  color: #fff;
  border-color: var(--admin-accent)
}

.hoa-cn-list {
  display: flex;
  flex-direction: column;
  gap: 6px
}

.hoa-cn-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px
}

.hoa-phone-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 6px
}

.hoa-leave-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px
}

.hoa-leave-phone {
  display: flex;
  flex-direction: column;
  gap: 4px
}

.hoa-mini-label {
  font-size: 10px;
  color: var(--admin-text-muted);
  display: block;
  margin-bottom: 4px
}

/* ==================== 作业收集 ==================== */
.hw-card {
  background: var(--admin-surface, #161E2E);
  border: 1px solid var(--admin-border, #1E2D4A);
  border-radius: 10px; margin-bottom: 8px; overflow: hidden;
}
.hw-card.folded { opacity: 0.85; }

/* 顶栏 */
.hw-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; cursor: pointer; user-select: none;
}
.hw-bar-icon {
  width: 30px; height: 30px; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; flex-shrink: 0;
  background: rgba(99,102,241,0.1);
}
.hw-bar-main { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; }
.hw-bar-name { font-size: 13px; font-weight: 600; color: var(--admin-text); white-space: nowrap; }
.hw-bar-desc {
  font-size: 11px; color: var(--admin-text-muted); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; max-width: 180px;
}
.hw-bar-arrow { font-size: 12px; color: var(--admin-text-muted); width: 16px; text-align: center; }
.hw-bar-del {
  width: 26px; height: 26px; border: none; border-radius: 6px;
  background: transparent; color: var(--admin-text-muted);
  cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;
}
.hw-bar-del:hover { background: rgba(239,68,68,0.12); color: #f87171; }

/* 展开体 */
.hw-body { padding: 0 14px 14px; display: flex; flex-direction: column; gap: 12px; }

/* 统计数字 — 双击编辑 */
.hw-stats {
  display: flex; border: 1px solid var(--admin-border); border-radius: 8px; overflow: hidden;
}
.hw-stat {
  flex: 1; text-align: center; padding: 10px 4px;
  background: var(--admin-bg); user-select: none;
}
.hw-stat + .hw-stat { border-left: 1px solid var(--admin-border); }
.hw-stat-num {
  display: block; font-size: 22px; font-weight: 700;
  font-family: 'JetBrains Mono', monospace; color: var(--admin-text-secondary);
  line-height: 1.2; cursor: default;
}
.hw-stat.ok .hw-stat-num { color: #4ade80; }
.hw-stat.bad .hw-stat-num { color: #f87171; }
.hw-stat-lbl { font-size: 10px; color: var(--admin-text-muted); display: block; margin-top: 3px; }
.hw-stat-input {
  width: 100%; text-align: center; font-size: 20px; font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  background: transparent; border: none; outline: none;
  color: var(--admin-text); padding: 2px 0;
}
.hw-stat.ok .hw-stat-input { color: #4ade80; }
.hw-stat.bad .hw-stat-input { color: #f87171; }

/* 名单 */
.hw-names { display: flex; flex-direction: column; gap: 6px; }
.hw-name-row { display: flex; align-items: center; gap: 8px; }
.hw-name-tag {
  font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px;
  white-space: nowrap; letter-spacing: 0.3px;
}
.hw-name-tag.ok { background: rgba(34,197,94,0.1); color: #4ade80; }
.hw-name-tag.bad { background: rgba(239,68,68,0.1); color: #f87171; }

/* 补交 */
.hw-late { border: 1px solid var(--admin-border); border-radius: 8px; }
.hw-late.on { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.03); }
.hw-late-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; cursor: pointer; margin: 0; }
.hw-late-bar span { font-size: 12px; color: var(--admin-text-muted); }
.hw-late.on .hw-late-bar span { color: #fbbf24; }
.hw-late-form { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 6px; }
.hw-late-row { display: flex; gap: 8px; }

/* 底部 */
.hw-foot { display: flex; gap: 8px; }

/* Light mode */
.admin-layout[data-theme="light"] .hw-card { background: #fff; border-color: #e2e8f0; }
.admin-layout[data-theme="light"] .hw-bar-name { color: #1e1b4b; }
.admin-layout[data-theme="light"] .hw-bar-desc { color: #94a3b8; }
.admin-layout[data-theme="light"] .hw-stats { border-color: #e2e8f0; }
.admin-layout[data-theme="light"] .hw-stat { background: #f8fafc; }
.admin-layout[data-theme="light"] .hw-stat + .hw-stat { border-left-color: #e2e8f0; }
.admin-layout[data-theme="light"] .hw-stat-num { color: #475569; }
.admin-layout[data-theme="light"] .hw-stat-input { color: #0f172a; }
.admin-layout[data-theme="light"] .hw-late { border-color: #e2e8f0; }
.admin-layout[data-theme="light"] .hw-late.on { background: #fffbeb; border-color: #fde68a; }

@media (max-width: 768px) {
  .hw-foot { flex-direction: column; }
  .hw-late-row { flex-wrap: wrap; }
}

@media (max-width:900px) {
  .hoa-main-grid {
    grid-template-columns: 1fr
  }

  .hoa-side-col {
    position: static
  }
}
</style>
