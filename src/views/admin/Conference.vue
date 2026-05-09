<template>
  <div class="conference-page">
    <!-- Page Header -->
    <div class="conf-page-hero">
      <div class="conf-hero-left">
        <div class="conf-hero-icon">
          <span>📋</span>
        </div>
        <div class="conf-hero-text">
          <h1>家长会准备</h1>
          <p>按选修科目动态生成 · 多维度数据整合 · 面向家长的专业反馈</p>
        </div>
      </div>
      <div class="conf-hero-right">
        <div class="conf-hero-accent"></div>
      </div>
    </div>

    <div class="conf-layout">
      <!-- Left Panel: Selection -->
      <div class="conf-left">
        <div class="admin-card">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">👨‍🎓 选择学生</div>
          <div class="admin-form-group">
            <label>选择班级</label>
            <el-select v-model="selectedClass" style="width:100%" @change="onClassChange" clearable>
              <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
            </el-select>
          </div>
          <div class="admin-form-group" v-if="classStudents.length">
            <label>选择学生</label>
            <el-select v-model="selectedStudentId" style="width:100%" filterable @change="loadStudentData">
              <el-option v-for="s in classStudents" :key="s.id" :label="`${s.name}`" :value="s.id" />
            </el-select>
          </div>
          <div v-if="studentProfile" class="student-card">
            <div class="sc-avatar">{{ studentProfile.name[0] }}</div>
            <div class="sc-info">
              <div class="sc-name">{{ studentProfile.name }} <span class="sc-class">{{ studentProfile.class }}</span></div>
              <div class="sc-meta">目标：{{ studentProfile.targetUniversity || '—' }} · 留学：{{ studentProfile.studyAbroadPlanning ? '是' : '否' }}</div>
              <div class="sc-elective">选修：{{ [studentProfile.elective1, studentProfile.elective2, studentProfile.elective3].filter(Boolean).join('、') }}</div>
            </div>
          </div>
        </div>

        <div class="admin-card" v-if="studentProfile">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📊 数据总览</div>
          <div class="quick-stats">
            <div class="qs-item">
              <div class="qs-val" :style="{color: attendanceRate >= 95 ? 'var(--admin-success)' : 'var(--admin-warning)'}">{{ attendanceRate }}%</div>
              <div class="qs-label">出勤率</div>
            </div>
            <div class="qs-item">
              <div class="qs-val" :style="{color: homeworkRate >= 90 ? 'var(--admin-success)' : 'var(--admin-warning)'}">{{ homeworkRate }}%</div>
              <div class="qs-label">作业完成率</div>
            </div>
            <div class="qs-item">
              <div class="qs-val">{{ behaviorRecords.length }}</div>
              <div class="qs-label">行为记录</div>
            </div>
            <div class="qs-item">
              <div class="qs-val">{{ examRecords.length }}</div>
              <div class="qs-label">考试次数</div>
            </div>
          </div>
        </div>

        <div class="admin-card" v-if="studentProfile">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📊 数据筛选</div>
          <div class="admin-form-group">
            <label>考试月份</label>
            <el-select v-model="examMonthFilter" style="width:100%" clearable @change="loadStudentData">
              <el-option v-for="m in examMonthOptions" :key="m" :label="m" :value="m" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>考试类型</label>
            <el-select v-model="examTypeFilter" style="width:100%" clearable>
              <el-option v-for="t in examTypeOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </div>
          <div class="admin-form-group">
            <label>作业时间范围</label>
            <div style="display:flex;gap:6px;align-items:center">
              <el-date-picker v-model="hwDateFrom" type="date" value-format="YYYY-MM-DD" placeholder="从" size="small" style="flex:1" />
              <span>至</span>
              <el-date-picker v-model="hwDateTo" type="date" value-format="YYYY-MM-DD" placeholder="到" size="small" style="flex:1" />
            </div>
          </div>
        </div>

        <div class="admin-card" v-if="studentProfile">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📝 补充材料</div>
          <div class="admin-card-subtitle" style="margin-top:-8px;margin-bottom:10px">添加个性化评语、亮点、或特定话题</div>
          <div class="admin-form-group">
            <label>标题</label>
            <el-input v-model="newSupplementTitle" size="small" placeholder="如：课堂专注度提升明显" />
          </div>
          <div class="admin-form-group">
            <label>内容</label>
            <el-input v-model="newSupplementContent" type="textarea" :rows="3" placeholder="老师最想对家长说的话..." />
            <div style="font-size:10px;color:var(--admin-text-muted);margin-top:4px">
              💡 支持 Emoji 表情，输入 : 可触发表情选择
            </div>
          </div>
          <div class="emoji-bar">
            <button v-for="e in quickEmojis" :key="e" class="emoji-chip" @click="insertEmoji(e)" type="button">{{ e }}</button>
            <el-popover placement="bottom" :width="280" trigger="click">
              <template #reference>
                <button class="emoji-chip more" type="button">+ 更多</button>
              </template>
              <div class="emoji-grid">
                <button v-for="e in fullEmojis" :key="e" class="emoji-cell" @click="insertEmoji(e); $refs.emojiPopover?.hide?.()" type="button">{{ e }}</button>
              </div>
            </el-popover>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <el-button size="small" type="primary" @click="addSupplement" :disabled="!newSupplementTitle.trim()">+ 添加材料</el-button>
            <el-button v-if="editingSupplementIdx !== null" size="small" @click="cancelEditSupplement">取消编辑</el-button>
          </div>
          <div v-if="supplements.length" class="supplement-list">
            <div v-for="(sup, idx) in supplements" :key="idx" class="supplement-item">
              <div class="supplement-item-content">
                <div class="supplement-item-title">{{ sup.title }}</div>
                <div class="supplement-item-text">{{ sup.content.slice(0, 80) }}{{ sup.content.length > 80 ? '...' : '' }}</div>
              </div>
              <div class="supplement-item-actions">
                <el-button size="small" text @click="editSupplement(idx)">✏️</el-button>
                <el-button size="small" text type="danger" @click="removeSupplement(idx)">🗑</el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="admin-card" v-if="studentProfile">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">✏️ 教师补充意见</div>
          <div class="admin-form-group">
            <el-input v-model="teacherSupplement" type="textarea" :rows="4" placeholder="请填写您对该生的补充观察与建议，这些内容将整合到家长会文稿中...&#10;例如：近期课堂专注度有所提升、建议加强XX科目练习、与家长沟通要点..." />
          </div>
        </div>

        <div class="admin-card" v-if="studentProfile">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">🔬 学情诊断</div>
          <div class="admin-card-subtitle" style="margin-top:-8px;margin-bottom:10px">基于学生全维度数据生成诊断报告 · 可对接后端智能分析</div>
          <div style="display:flex;gap:8px">
            <el-button size="small" type="primary" @click="startAiDiagnosis" :loading="aiDiagnosing" style="flex:1">
              {{ aiDiagnosing ? '诊断中...' : '🔍 开始诊断' }}
            </el-button>
            <el-button size="small" @click="showJsonPayload = !showJsonPayload" :type="showJsonPayload ? 'warning' : 'default'">📋 JSON</el-button>
          </div>
          <div v-if="showJsonPayload" class="json-payload-box">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:11px;font-weight:600;color:var(--admin-text)">📦 后端请求体 (SpringBoot AI)</span>
              <el-button size="small" text @click="copyJsonPayload">📋 复制</el-button>
            </div>
            <pre class="json-payload-pre">{{ formatJsonPayload() }}</pre>
          </div>
          <div v-if="aiDiagnosing" style="margin-top:10px">
            <el-progress :percentage="aiProgress" :stroke-width="6" :color="'var(--admin-accent)'" />
            <div style="font-size:10px;color:var(--admin-text-muted);margin-top:4px;text-align:center">{{ aiStatusText }}</div>
          </div>
          <div v-if="aiDiagnosisResult" class="ai-result-card">
            <div class="ai-result-header">
              <span>📋 {{ studentProfile.name }} 诊断报告</span>
              <el-button size="small" text type="danger" @click="aiDiagnosisResult = null">✕</el-button>
            </div>
            <div v-for="item in aiDiagnosisResult" :key="item.subject" class="ai-diagnosis-card">
              <div class="ai-dc-header">
                <span class="ai-dc-subject">{{ item.icon }} {{ item.subject }}</span>
                <span class="ai-dc-level" :style="{background: item.levelColor}">{{ item.level }}</span>
              </div>
              <div class="ai-dc-detail">{{ item.detail }}</div>
              <div class="ai-dc-tip">💡 {{ item.tip }}</div>
            </div>
          </div>
        </div>

        <!-- Template Selector -->
        <div class="admin-card" v-if="studentProfile">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📋 文稿模板</div>
          <div class="admin-card-subtitle" style="margin-top:-8px;margin-bottom:10px">选择适合学生当前水平的模板，自动调整文稿语气和内容重点</div>
          <div class="template-selector">
            <div v-for="t in templateOptions" :key="t.value" class="template-option" :class="{ active: selectedTemplate === t.value }" @click="applyTemplate(t.value)">
              <div class="template-option-header">
                <span class="template-option-icon">{{ t.icon }}</span>
                <span class="template-option-label">{{ t.label }}</span>
                <el-icon v-if="selectedTemplate === t.value" class="template-check"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></el-icon>
              </div>
              <div class="template-option-desc">{{ t.desc }}</div>
              <div class="template-option-tone">语气风格：{{ t.tone }}</div>
            </div>
          </div>
        </div>

        <!-- Draggable Module List -->
        <div class="admin-card" v-if="studentProfile">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:4px">📝 文稿模块</div>
          <div class="admin-card-subtitle" style="margin-bottom:10px">拖拽调整模块顺序 · 开关控制显示</div>
          <div class="module-list">
            <div v-for="(mod, idx) in contentModules" :key="mod.id" class="module-item" :class="{ active: mod.enabled, dragging: dragSourceIdx === idx }"
              draggable="true"
              @dragstart="onDragStart(idx)"
              @dragover="onDragOver"
              @drop="onDrop(idx)"
              @dragend="onDragEnd"
            >
              <span class="cm-drag-handle">⋮⋮</span>
              <span class="cm-icon">{{ mod.icon }}</span>
              <span class="cm-name">{{ mod.name }}</span>
              <el-switch v-model="mod.enabled" size="small" @click.stop />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Preview -->
      <div class="conf-right">
        <div class="admin-card conf-right-card">
          <div class="conf-right-header">
            <div class="conf-right-header-left">
              <span class="conf-right-header-icon">📄</span>
              <div>
                <div class="conf-right-header-title">家长会文稿编辑</div>
                <div class="conf-right-header-sub" v-if="studentProfile">
                  {{ studentProfile.name }} · {{ studentProfile.class }} · {{ today }}
                </div>
                <div class="conf-right-header-sub" v-else>选择学生后自动生成个性化文稿</div>
              </div>
            </div>
            <div class="conf-right-header-actions">
              <el-button size="small" @click="togglePreviewOnly" class="conf-mode-toggle-btn" :type="previewOnly ? 'warning' : 'default'">
                {{ previewOnly ? '✏️ 编辑模式' : '👁️ 仅预览' }}
              </el-button>
              <el-button size="small" text @click="toggleFullscreen" class="conf-action-btn">
                {{ isFullScreen ? '退出全屏' : '⛶ 全屏' }}
              </el-button>
              <el-button size="small" text type="primary" @click="exportDocument" :loading="exporting" class="conf-action-btn">
                {{ exporting ? '导出中...' : '📸 导出图片' }}
              </el-button>
              <el-button size="small" text type="primary" @click="exportPDF" class="conf-action-btn">📑 导出PDF</el-button>
            </div>
          </div>
          <div v-if="!studentProfile" class="conf-empty-state">
            <div class="conf-empty-icon">👈</div>
            <div class="conf-empty-title">选择学生开始</div>
            <div class="conf-empty-desc">在左侧面板中选择班级和学生<br/>系统将自动整合多维数据生成个性化家长会文稿</div>
          </div>
          <div v-else class="conf-md-editor-wrap" :class="{ fullscreen: isFullScreen }">
            <div v-if="isFullScreen" class="fs-bar">
              <span>{{ studentProfile?.name }} · 家长会文稿</span>
              <div style="display:flex;gap:8px;align-items:center">
                <!-- <el-button size="small" @click="togglePreviewOnly">{{ previewOnly ? '编辑' : '仅预览' }}</el-button> -->
                <el-button size="small" type="primary" @click="exportDocument" :loading="exporting">📸 导出图片</el-button>
                <!-- <el-button size="small" @click="printDocument">🖨️ 打印</el-button> -->
                <el-button size="small" type="primary" @click="exportPDF">📑 导出PDF</el-button>
                <el-button size="small" @click="toggleFullscreen">退出全屏</el-button>
              </div>
            </div>

            <!-- Editor Mode (Edit + Preview) -->
            <div v-if="!previewOnly" class="conf-editor-pane">
              <MdEditor
                v-model="fullConfDocument"
                :theme="store.theme"
                language="zh-CN"
                :previewTheme="previewTheme"
                :toolbars="mdToolbarsEx"
                :noPrettier="true"
                :noMermaid="true"
                :footers="mdFooters"
                placeholder="正在生成家长会文稿..."
                @onSave="handleEditorSave"
              />
            </div>

            <!-- Preview-Only Mode -->
            <div v-else class="conf-preview-pane">
              <MdPreview :editorId="previewId" :modelValue="fullConfDocument" :previewTheme="previewTheme" />
              <div class="conf-catalog-wrap">
                <MdCatalog :editorId="previewId" :scrollElement="previewScrollEl" />
              </div>
            </div>
          </div>

          <!-- Hidden Export Container for html2canvas / Print -->
          <div class="hw-export-hidden" aria-hidden="true" v-if="studentProfile">
            <template v-if="watermarkEnabled">
              <el-watermark :content="watermarkText" :font="{ fontSize: 16, color: 'rgba(0,0,0,0.06)' }" :rotate="-22" :gap="[120, 80]" :z-index="1">
                <div id="confExportContainer" class="conf-export-inner">
              <!-- Document Header -->
              <table class="pp-doc-head">
                <tr>
                  <td class="pp-doc-head-left">
                    <div class="pp-doc-no">No. {{ today.replace(/-/g, '') }}</div>
                    <div class="pp-doc-type">家长会交流材料</div>
                  </td>
                  <td class="pp-doc-head-center">
                    <div class="pp-school-name">{{ schoolFullName }}</div>
                    <div class="pp-school-sub">{{ schoolSubtitle }}</div>
                  </td>
                  <td class="pp-doc-head-right">
                    <div class="pp-doc-stamp">内部资料</div>
                    <div class="pp-doc-stamp-sub">请妥善保管</div>
                  </td>
                </tr>
              </table>

              <!-- Header Divider -->
              <div class="pp-hdiv">
                <div class="pp-hdiv-line"></div>
                <div class="pp-hdiv-diamond">◆</div>
                <div class="pp-hdiv-line"></div>
              </div>

              <!-- Student Profile Card -->
              <div class="pp-student-card">
                <div class="pp-student-card-title">{{ studentProfile.name }} 同学 · 学情档案</div>
                <table class="pp-info-table">
                  <tr>
                    <td class="pp-info-cell"><span class="pp-info-label">所在班级</span><span class="pp-info-text">{{ studentProfile.class }}</span></td>
                    <td class="pp-info-cell"><span class="pp-info-label">文件日期</span><span class="pp-info-text">{{ today }}</span></td>
                    <td class="pp-info-cell"><span class="pp-info-label">班主任</span><span class="pp-info-text">{{ studentProfile.cc || homeroomTeacher }}</span></td>
                  </tr>
                  <tr>
                    <td class="pp-info-cell"><span class="pp-info-label">选修科目</span><span class="pp-info-text">{{ [studentProfile.elective1, studentProfile.elective2, studentProfile.elective3].filter(Boolean).join('、') || '暂无' }}</span></td>
                    <td class="pp-info-cell"><span class="pp-info-label">目标院校</span><span class="pp-info-text">{{ studentProfile.targetUniversity || '暂无' }}</span></td>
                    <td class="pp-info-cell"><span class="pp-info-label">留学规划</span><span class="pp-info-text">{{ studentProfile.studyAbroadPlanning ? '有计划' : '暂无' }}</span></td>
                  </tr>
                  <tr>
                    <td class="pp-info-cell"><span class="pp-info-label">出勤率</span><span class="pp-info-text">{{ attendanceRate }}%</span></td>
                    <td class="pp-info-cell"><span class="pp-info-label">作业完成率</span><span class="pp-info-text">{{ homeworkRate }}%</span></td>
                  </tr>
                </table>
              </div>

              <!-- Section Separator -->
              <div class="pp-hdiv">
                <div class="pp-hdiv-line"></div>
                <div class="pp-hdiv-star">✦</div>
                <div class="pp-hdiv-line"></div>
              </div>

              <!-- Body Content -->
              <div v-html="renderedConfDocument" class="pp-md-body"></div>

              <!-- Footer Separator -->
              <div class="pp-hdiv" style="margin-top:36px">
                <div class="pp-hdiv-line"></div>
                <div class="pp-hdiv-star">❧</div>
                <div class="pp-hdiv-line"></div>
              </div>

              <!-- Signature Footer -->
            
                </div>
              </el-watermark>
            </template>
            <div v-else id="confExportContainer" class="conf-export-inner">
              <table class="pp-doc-head">
                <tr>
                  <td class="pp-doc-head-left"><div class="pp-doc-no">No. {{ today.replace(/-/g, '') }}</div><div class="pp-doc-type">家长会交流材料</div></td>
                  <td class="pp-doc-head-center"><div class="pp-school-name">{{ schoolFullName }}</div><div class="pp-school-sub">{{ schoolSubtitle }}</div></td>
                  <td class="pp-doc-head-right"><div class="pp-doc-stamp">内部资料</div><div class="pp-doc-stamp-sub">请妥善保管</div></td>
                </tr>
              </table>
              <div class="pp-hdiv"><div class="pp-hdiv-line"></div><div class="pp-hdiv-diamond">◆</div><div class="pp-hdiv-line"></div></div>
              <div class="pp-student-card">
                <div class="pp-student-card-title">{{ studentProfile.name }} 同学 · 学情档案</div>
                <table class="pp-info-table">
                  <tr><td class="pp-info-cell"><span class="pp-info-label">所在班级</span><span class="pp-info-text">{{ studentProfile.class }}</span></td><td class="pp-info-cell"><span class="pp-info-label">文件日期</span><span class="pp-info-text">{{ today }}</span></td><td class="pp-info-cell"><span class="pp-info-label">班主任</span><span class="pp-info-text">{{ studentProfile.cc || homeroomTeacher }}</span></td></tr>
                  <tr><td class="pp-info-cell"><span class="pp-info-label">选修科目</span><span class="pp-info-text">{{ [studentProfile.elective1, studentProfile.elective2, studentProfile.elective3].filter(Boolean).join('、') || '暂无' }}</span></td><td class="pp-info-cell"><span class="pp-info-label">目标院校</span><span class="pp-info-text">{{ studentProfile.targetUniversity || '暂无' }}</span></td><td class="pp-info-cell"><span class="pp-info-label">留学规划</span><span class="pp-info-text">{{ studentProfile.studyAbroadPlanning ? '有计划' : '暂无' }}</span></td></tr>
                  <tr><td class="pp-info-cell"><span class="pp-info-label">出勤率</span><span class="pp-info-text">{{ attendanceRate }}%</span></td><td class="pp-info-cell"><span class="pp-info-label">作业完成率</span><span class="pp-info-text">{{ homeworkRate }}%</span></td><td class="pp-info-cell">
                    <span class="pp-info-label">考试次数</span><span class="pp-info-text">{{ examRecords.length }} 次</span></td></tr>
                </table>
              </div>
              <div class="pp-hdiv"><div class="pp-hdiv-line"></div><div class="pp-hdiv-star">✦</div><div class="pp-hdiv-line"></div></div>
              <div v-html="renderedConfDocument" class="pp-md-body"></div>
              <div class="pp-hdiv" style="margin-top:36px"><div class="pp-hdiv-line"></div><div class="pp-hdiv-star">❧</div><div class="pp-hdiv-line"></div></div>
              <table v-if="showTeacherSign || showParentSign" class="pp-sign-table">
                <tr v-if="showTeacherSign"><td class="pp-sign-cell">班主任签字：_______________</td><td class="pp-sign-cell" style="text-align:right">日期：{{ today }}</td></tr>
                <tr v-if="showParentSign"><td class="pp-sign-cell">家长签字：_______________</td><td class="pp-sign-cell" style="text-align:right">{{ schoolName }} · {{ reportFooter }}</td></tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import { MdEditor, MdPreview, MdCatalog } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import 'md-editor-v3/lib/preview.css'
import { marked } from 'marked'
import { studentService, examService, attendanceService, homeworkService, behaviorService, phoneRecordService, counselingService, settingsService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { buildPrintHTML } from '@/utils/printTemplate'
import { getWatermarkStyle, getWatermarkHTML } from '@/utils/watermark'

// Configure marked for document rendering
marked.setOptions({ breaks: true, gfm: true })

const previewId = 'conf-preview-only'
const previewScrollEl = computed(() => document.documentElement)

const mdToolbarsEx = [
  // ✏️ 基础文本
  'bold', 'italic', 'underline', 'strikeThrough', 'title', 'sub', 'sup', '-',

  // 📚 结构与列表
  'quote', 'unorderedList', 'orderedList', 'task', 'codeRow', 'code', '-',

  // 🧩 插入能力（增强：补 mermaid）
  'link', 'image', 'table', 'katex', '-',

  // ↩️ 操作
  'revoke', 'next', 'save', '-',

  // 👁️ 视图（增强：补 previewOnly）
  'preview', 'htmlPreview', 'catalog', 'mermaid','previewOnly','-',

  // 🖥️ 全屏
  'fullscreen', 'pageFullscreen', 'github'
]

const mdFooters = ['markdownTotal', 'scrollSwitch']

const store = useAppStore()
const selectedClass = ref('')
const selectedStudentId = ref(null)
const studentProfile = ref(null)
const isFullScreen = ref(false)
const previewOnly = ref(false)
const today = new Date().toISOString().split('T')[0]
const schoolName = ref('威学一百')
const schoolFullName = ref('威学一百国际教育')
const schoolSubtitle = ref('DSE 学习智能分析系统 · 个性化专属学习报告')
const homeroomTeacher = ref('张老师')
const reportFooter = ref('用心陪伴每一位学生的成长')
const watermarkEnabled = ref(true)
const watermarkText = ref('内部资料·仅供家长会使用')
const previewTheme = ref('default')
const showTeacherSign = ref(true)
const showParentSign = ref(true)
const examMonthFilter = ref('')
const examTypeFilter = ref('')
const hwDateFrom = ref('')
const hwDateTo = ref('')
const teacherSupplement = ref('')

// Supplements
const supplements = ref([])
const newSupplementTitle = ref('')
const newSupplementContent = ref('')
const editingSupplementIdx = ref(null)

const quickEmojis = ['😊','👍','💪','🌟','⭐','🎯','📈','📚','✏️','❤️','💡','🔥']
const fullEmojis = [
  '😊','😃','😁','😄','🙂','🤗','😌','😎','🥰','😍','😇','🤩',
  '👍','👏','💪','🙌','✌️','🤝','💯','✅','✨','🌟','⭐','🔥',
  '💡','🎯','📈','📚','✏️','📝','🎓','🏆','💎','🌈','❤️','💙',
  '😢','😰','😤','🤔','😴','😷','🙏','💔','⚠️','⏰','📅','📋',
  '🏠','👨‍👩‍👧','👩‍🏫','🧑‍🎓','💼','🗣️','📖','🔍','💊','🧠','🏃','🎵'
]

function insertEmoji(emoji) {
  newSupplementContent.value += emoji
}

function addSupplement() {
  if (!newSupplementTitle.value.trim()) return
  if (editingSupplementIdx.value !== null) {
    supplements.value[editingSupplementIdx.value] = {
      ...supplements.value[editingSupplementIdx.value],
      title: newSupplementTitle.value.trim(),
      content: newSupplementContent.value.trim()
    }
    editingSupplementIdx.value = null
  } else {
    supplements.value.push({
      title: newSupplementTitle.value.trim(),
      content: newSupplementContent.value.trim(),
      date: new Date().toISOString().split('T')[0]
    })
  }
  newSupplementTitle.value = ''
  newSupplementContent.value = ''
}

function editSupplement(idx) {
  editingSupplementIdx.value = idx
  newSupplementTitle.value = supplements.value[idx].title
  newSupplementContent.value = supplements.value[idx].content
}

function cancelEditSupplement() {
  editingSupplementIdx.value = null
  newSupplementTitle.value = ''
  newSupplementContent.value = ''
}

function removeSupplement(idx) {
  supplements.value.splice(idx, 1)
  if (editingSupplementIdx.value === idx) cancelEditSupplement()
}

const contentModules = ref([
  { id: 'praise', icon: '⭐', name: '成长亮点与肯定', enabled: true },
  { id: 'daily', icon: '📊', name: '日常学习表现', enabled: true },
  { id: 'subjects', icon: '📚', name: '各科学情分析', enabled: true },
  { id: 'examAnalysis', icon: '📈', name: '考试成绩分析', enabled: true },
  { id: 'plan', icon: '🎯', name: '提升建议与规划', enabled: true },
  { id: 'summary', icon: '💬', name: '总结与家校共育', enabled: true }
])

// Template system
const selectedTemplate = ref('steady') // 'foundation' | 'steady' | 'excellence'
const templateOptions = [
  { value: 'foundation', label: '基础巩固型', desc: '适合需要夯实基础、逐步建立信心的学生', tone: '温暖鼓励、小步前进', icon: '🌱' },
  { value: 'steady', label: '稳步提升型', desc: '适合基础尚可、需要系统提升的学生', tone: '肯定进步、精准突破', icon: '📈' },
  { value: 'excellence', label: '拔尖突破型', desc: '适合基础扎实、追求更高目标的学生', tone: '挑战激励、拓宽视野', icon: '🏆' }
]

const templateContent = {
  foundation: {
    praiseTone: '每一个微小的进步都值得被看见、被肯定。基础阶段的每一步踏实积累，都是未来飞跃的坚实跳板。',
    praiseExtra: ['课堂参与度逐步提升，能够主动跟随教学节奏', '作业完成意识不断增强，课后学习习惯正在养成', '面对困难时表现出可贵的坚持精神'],
    analysisApproach: '当前阶段的首要任务是回归课本、夯实基础。不必焦虑于暂时的不理想——很多学生在打牢基础后，成绩会出现明显的跃升。',
    planShortTerm: ['整理本周所有作业中的错题，逐题重新独立完成', '每天安排20-30分钟复习当天所学内容', '标记理解困难的知识点，主动寻求老师帮助'],
    planLongTerm: ['建立个人错题本，每周回顾一次', '针对薄弱科目，每周增加2-3次专项练习', '培养"先复习、再作业"的规范学习流程', '逐步建立自主学习的习惯和信心'],
    summaryCore: '正处于打基础的关键阶段。现阶段最重要的事情不是追求高难度题目的突破，而是把每一个基础知识点理解透彻、把每一道基础题做对做稳。请家长多关注孩子的学习习惯养成，多给予正面鼓励——在这个阶段，信心比黄金更珍贵。',
    closingNote: '每一个稳步前进的日子，都在为未来的突破积蓄力量。'
  },
  steady: {
    praiseTone: '整体学习状态良好，具备了进一步突破的基础条件。现在的关键是——从"听懂"走向"独立做对"，从"会做"走向"做得又快又准"。',
    praiseExtra: ['学习态度端正，能够按时完成各项学习任务', '具备一定的自主学习意识，课堂互动较为积极', '在部分学科上已展现出较好的理解能力'],
    analysisApproach: '当前处于稳步上升期，需要在巩固优势的同时，精准定位薄弱环节进行针对性突破。建议将精力集中在"跳一跳能够到"的中档题型上。',
    planShortTerm: ['分析本次考试失分点，区分"粗心丢分"和"不会丢分"', '针对薄弱知识点，每天额外安排15-20分钟专项训练', '建立"看到题型→判断考点→选择解法"的解题流程'],
    planLongTerm: ['每科建立错题本，标注错因类型和掌握状态', '每周做一次限时训练，提升解题速度和准确度', '适当接触DSE真题，了解命题思路和评分标准', '保持与各科老师的沟通，及时反馈学习困惑'],
    summaryCore: '正处于稳步提升的关键期。这个阶段最需要的是——精准的努力和持续的习惯。不是刷题越多越好，而是每做一道题都有收获。请家长关注孩子的学习方法和效率，帮助孩子建立合理的时间规划，避免"假努力"陷阱。',
    closingNote: '精准的努力，比盲目的勤奋更有力量。'
  },
  excellence: {
    praiseTone: '学术表现优秀，展现了出色的学习能力和自律精神。在此基础上，我们更关注——如何从优秀走向卓越，如何培养深层思维和创新能力。',
    praiseExtra: ['学术成绩稳定在较高水平，具备冲击顶尖高校的潜力', '学习方法较为成熟，具备良好的自我管理能力', '在课堂上能够举一反三，展现出较强的思维能力'],
    analysisApproach: '当前各科基础扎实，提升空间主要在：压轴题突破、跨知识点综合应用、解题速度和准确度的极致优化。建议将视野放宽，不只盯着分数，更要关注学科思维的深度和广度。',
    planShortTerm: ['逐题分析失分原因——即使是1分的失分也要深究根源', '每天安排30分钟挑战1-2道DSE压轴题或竞赛题', '建立"最优解法"意识——不只做对，还要思考是否有更优解'],
    planLongTerm: ['建立学科知识网络图，将零散知识点系统化、结构化', '定期进行全真模拟训练，严格限时、严格评分', '尝试给同学讲解难题——教别人的过程是最好的深度学习', '关注学科前沿和实际应用，将知识从课本延伸到现实'],
    summaryCore: '已经站在了一个较高的起点上。接下来的挑战不是"和别人比"，而是"和自己的潜力比"。请家长在肯定成绩的同时，引导孩子树立更高的目标——不只是分数，更是思维品质和综合能力的全面提升。避免满足于现状，保持对知识的敬畏和好奇心。',
    closingNote: '卓越不是一个目标，而是一种习惯。'
  }
}

function applyTemplate(type) {
  selectedTemplate.value = type
  const t = templateContent[type]
  if (!t || !studentProfile.value) return

  // Rebuild praise markdown
  const pLines = [`${studentProfile.value.name}同学在本阶段展现了积极的学习态度，以下方面值得肯定：`, '']
  docEdits.value.praises.filter(x => x).forEach(p => { pLines.push('- ' + p) })
  pLines.push('', t.praiseTone, '')
  t.praiseExtra.forEach(e => { pLines.push('- ' + e) })
  docEdits.value.praiseMarkdown = pLines.join('\n')

  // Rebuild plan markdown
  const planLines = ['## 短期（本周）', '']
  t.planShortTerm.forEach(s => { planLines.push('- ' + s) })
  planLines.push('')
  detailedSubjectReports.value.filter(s => s.latestExam).forEach(subj => {
    planLines.push(`### ${subj.icon} ${subj.subject}（得分率 ${Math.round(subj.scoreRate * 100)}%）`)
    const strategies = docEdits.value.subjectEdits[subj.subject]?.strategies || subj.strategies || []
    strategies.filter(x => x).forEach(s => { planLines.push('- ' + s) })
    planLines.push('')
  })
  planLines.push('## 中长期（本月·学期）', '')
  t.planLongTerm.forEach(s => { planLines.push('- ' + s) })
  docEdits.value.planMarkdown = planLines.join('\n')

  // Rebuild summary markdown
  const sumLines = [docEdits.value.summaryP1, '', t.summaryCore, '']
  docEdits.value.summaryKeyPoints.filter(x => x).forEach(kp => { sumLines.push('- ' + kp) })
  sumLines.push('', docEdits.value.summaryP2, '', docEdits.value.summaryP3, '', `> *"${t.closingNote}"*`)
  docEdits.value.summaryMarkdown = sumLines.join('\n')

  // Update subject analysis tone
  docEdits.value.subjectMarkdown = {}
  detailedSubjectReports.value.forEach(sa => {
    const edits = docEdits.value.subjectEdits[sa.subject]
    const subjLines = [(docEdits.value.subjectAnalysis[sa.subject] || sa.analysisText || ''), '']
    subjLines.push(t.analysisApproach)
    subjLines.push('')
    if (edits) {
      const strengths = edits.strengths?.filter(x => x) || []
      if (strengths.length) { subjLines.push('**优势方面：**'); strengths.forEach(s => { subjLines.push('- ' + s) }); subjLines.push('') }
      const weaknesses = edits.weaknesses?.filter(x => x) || []
      if (weaknesses.length) { subjLines.push('**需要关注：**'); weaknesses.forEach(w => { subjLines.push('- ' + w) }); subjLines.push('') }
    }
    docEdits.value.subjectMarkdown[sa.subject] = subjLines.join('\n')
  })

  buildFullDocument()
  ElMessage.success(`已应用「${templateOptions.find(o => o.value === type)?.label}」模板`)
}

// Drag reorder for content modules
const dragSourceIdx = ref(null)
function onDragStart(idx) { dragSourceIdx.value = idx }
function onDragOver(e) { e.preventDefault() }
function onDrop(idx) {
  if (dragSourceIdx.value === null || dragSourceIdx.value === idx) return
  const items = [...contentModules.value]
  const [moved] = items.splice(dragSourceIdx.value, 1)
  items.splice(idx, 0, moved)
  contentModules.value = items
  dragSourceIdx.value = null
}
function onDragEnd() { dragSourceIdx.value = null }

const classList = computed(() => studentService.getClasses())
const classStudents = computed(() => selectedClass.value ? studentService.getAll().filter(s => s.class === selectedClass.value) : [])
const examMonthOptions = computed(() => {
  const months = new Set()
  examService.getAll().forEach(e => { if (e.date) months.add(e.date.substring(0, 7)) })
  return [...months].sort().reverse()
})
const examTypeOptions = ['月考', '期中', '期末', '模考', 'DSE真题', '课堂测验']

// Data from services
const examRecords = ref([])
const attendanceRecords = ref([])
const homeworks = ref([])
const behaviorRecords = ref([])
const phoneRecords = ref([])
const counselingRecords = ref([])

const attendanceRate = computed(() => {
  if (!attendanceRecords.value.length) return 100
  const onTime = attendanceRecords.value.filter(a => a.status === '正常').length
  return Math.round(onTime / attendanceRecords.value.length * 100)
})

const homeworkRate = computed(() => {
  if (!homeworks.value.length) return 100
  const done = homeworks.value.filter(h => h.status === '已提交').length
  return Math.round(done / homeworks.value.length * 100)
})

const lateCount = computed(() => attendanceRecords.value.filter(a => a.status === '迟到').length)
const phoneViolations = computed(() => phoneRecords.value.filter(p => p.status === '违纪扣留').length)

const positiveBehaviors = computed(() => behaviorRecords.value.filter(b => b.type === 'success'))
const praises = computed(() => {
  const list = []
  const name = studentProfile.value?.name || '同学'

  // Detailed behavioral analysis
  if (positiveBehaviors.value.length > 0) {
    const types = [...new Set(positiveBehaviors.value.map(b => b.behavior || b.note).filter(Boolean))]
    if (types.length) list.push(`课堂表现积极，${types.slice(0, 3).join('、')}等方面多次获得肯定，展现了良好的学习主动性`)
  }
  if (homeworkRate.value >= 90) list.push(`作业完成率保持在${homeworkRate.value}%，说明课后学习习惯较为规范，能够按时完成老师布置的学习任务`)
  else if (homeworkRate.value >= 70) list.push(`作业完成率约${homeworkRate.value}%，基本能跟上学习节奏，但在完成度上仍有提升空间`)
  if (attendanceRate.value >= 95) list.push(`出勤情况优秀（${attendanceRate.value}%），展现了良好的时间管理和自律能力`)
  if (examRecords.value.length > 0) {
    const strongExams = examRecords.value.filter(e => e.score / e.total >= 0.85)
    if (strongExams.length > 0) {
      const subjects = [...new Set(strongExams.map(e => e.subject))]
      list.push(`${subjects.slice(0, 3).join('、')}等科目表现突出，得分率超过85%，说明在这些学科上具备扎实的基础`)
    }
    const improved = examRecords.value.filter(e => e.score / e.total >= 0.7 && e.score / e.total < 0.85)
    if (improved.length > 0) list.push(`多数科目处于中上水平，具备冲击高分的潜力，现在需要的是从\"听懂\"到\"独立做对\"的转化`)
  }
  if (counselingRecords.value.length > 0) {
    list.push('能够主动与老师沟通学习困惑，心态积极开放，愿意接受建议并尝试调整')
  }

  if (list.length === 0) list.push('正在逐步适应学习节奏，各科基础仍有待夯实，但学习态度端正，有持续进步的空间')
  return list
})

const subjectAnalyses = computed(() => {
  if (!studentProfile.value) return []
  let filteredExams = examRecords.value
  if (examTypeFilter.value) filteredExams = filteredExams.filter(e => e.examType === examTypeFilter.value)
  const electives = [studentProfile.value.elective1, studentProfile.value.elective2, studentProfile.value.elective3].filter(Boolean)
  const coreSubjects = ['数学', '中文', '英文', '公民与社会发展']
  const allSubjects = [...new Set([...coreSubjects, ...electives])]
  const iconMap = { '数学':'📐', '中文':'📝', '英文':'🔤', '公民与社会发展':'🏛️', '物理':'⚡', '化学':'🧪', '生物':'🧬', '经济':'📈', '历史':'📜', '地理':'🌍', '中国历史':'🏯', '资讯及通讯科技':'💻', '企业、会计与财务概论':'💼', '视觉艺术':'🎨', '体育':'🏃', '音乐':'🎵' }
  return allSubjects.map(subject => {
    const subjectExams = filteredExams.filter(e => e.subject === subject).sort((a, b) => b.date.localeCompare(a.date))
    const latest = subjectExams.length > 0 ? subjectExams[0] : null
    const prev = subjectExams.length > 1 ? subjectExams[1] : null
    return {
      subject,
      icon: iconMap[subject] || '📚',
      isElective: electives.includes(subject),
      isCore: coreSubjects.includes(subject),
      latestExam: latest,
      prevExam: prev,
      scoreRate: latest ? latest.score / latest.total : 0,
      prevScoreRate: prev ? prev.score / prev.total : null,
      scoreChange: prev ? Math.round((latest.score / latest.total - prev.score / prev.total) * 100) : null
    }
  })
})

// Detailed subject reports with rich analysis (like 文字稿参考 patterns)
const detailedSubjectReports = computed(() => {
  return subjectAnalyses.value.map(sa => {
    const report = { ...sa, analysisText: '', strengths: [], weaknesses: [], strategies: [] }
    const exam = sa.latestExam
    if (!exam) {
      report.analysisText = `暂未收录${sa.subject}考试数据，建议后续关注该科学习进展。`
      return report
    }
    const rate = sa.scoreRate
    const topics = exam.topics || []
    const feedback = exam.teacherFeedback || ''

    // Generate rich analysis text based on score rate and subject
    if (rate >= 0.9) {
      report.analysisText = `${sa.subject}目前处于优秀水平（得分率${Math.round(rate * 100)}%），基础知识掌握扎实，综合应用能力较强。`
      report.strengths.push('基础知识扎实，常规题型得分稳定', '综合应用能力较强')
      report.strategies.push('保持当前学习节奏，适当接触DSE真题提升解题视野', '重点关注压轴题和综合性难题的思维训练')
    } else if (rate >= 0.75) {
      report.analysisText = `${sa.subject}处于中上水平（得分率${Math.round(rate * 100)}%），基础部分掌握尚可，但综合应用和难题突破上仍有提升空间。`
      report.strengths.push('基础题型得分较为稳定', '具备进一步提升的基础')
      if (exam.mistakes > 0) {
        report.weaknesses.push(`本次考试错${exam.mistakes}题，建议逐题分析错因（粗心/概念不清/审题偏差/计算失误/综合能力不足）`)
      }
      if (topics.length) {
        report.weaknesses.push(`涉及知识点：${topics.join('、')}，建议针对性强化这些板块的专题训练`)
      }
      report.strategies.push('重点进行错题重做和同类题强化，建立\"看到题型→判断考点→选择解法\"的决策流程', '每周安排2-3次专项练习（每次20-30分钟），重点突破薄弱知识点')
    } else if (rate >= 0.6) {
      report.analysisText = `${sa.subject}当前得分率约${Math.round(rate * 100)}%，基础部分存在一定程度的知识漏洞，需要系统性地夯实基础。现阶段不宜盲目刷难题，应优先把基础题型练熟。`
      report.weaknesses.push('基础知识存在漏洞，部分概念理解不够深入', '面对综合题时拆解能力不足，容易出现\"听懂但不会做\"的情况')
      report.strengths.push('仍有较大提升空间，只要方法得当，进步会比较明显')
      report.strategies.push('优先回归课本和讲义，重新独立完成所有例题（不是看答案，而是真正重新计算）', '建立错题本，每道错题标注：①错因分类 ②对应知识点 ③正确解题步骤', '每周做一次专题小测，检验基础知识的掌握程度')
    } else {
      report.analysisText = `${sa.subject}目前面临较大困难（得分率${Math.round(rate * 100)}%），需要从最基础的概念和公式重新构建理解。但这不代表学不会——很多学生在建立正确的学习方法和信心后，成绩会出现明显跃升。`
      report.weaknesses.push('基础概念和公式掌握不牢固', '缺乏系统的解题训练和方法指导')
      report.strengths.push('只要找到正确的学习方法，进步空间巨大')
      report.strategies.push('从最基础的例题开始，每天只攻克1-2个知识点，确保完全理解后再前进', '寻求老师或同学的帮助，不要害怕提问', '使用\"三步法\"：①复述概念 → ②模仿例题 → ③独立完成变式题')
    }

    // Add teacher feedback integration
    if (feedback) {
      report.analysisText += ` 教师反馈：${feedback}`
    }

    return report
  })
})

function getModule(id) { return contentModules.value.find(m => m.id === id) }

function getClassAvgForSubject(subject) {
  if (!studentProfile.value) return 70
  const classExams = examService.getAll().filter(e => e.subject === subject && e.studentName && studentService.getAll().some(s => s.class === studentProfile.value.class && s.name === e.studentName))
  if (classExams.length === 0) return 70
  return Math.round(classExams.reduce((s, e) => s + e.score / e.total * 100, 0) / classExams.length)
}

function onClassChange() {
  selectedStudentId.value = null
  studentProfile.value = null
}

function loadStudentData() {
  const s = studentService.getAll().find(s => s.id === selectedStudentId.value)
  if (!s) { studentProfile.value = null; return }
  studentProfile.value = { ...s }
  let rawExams = examService.getByStudent(s.id)
  if (examMonthFilter.value) rawExams = rawExams.filter(e => e.date && e.date.startsWith(examMonthFilter.value))
  examRecords.value = rawExams
  attendanceRecords.value = attendanceService.getByStudent(s.id)
  let rawHw = homeworkService.getByStudent(s.id)
  if (hwDateFrom.value) rawHw = rawHw.filter(h => h.dueDate >= hwDateFrom.value)
  if (hwDateTo.value) rawHw = rawHw.filter(h => h.dueDate <= hwDateTo.value)
  homeworks.value = rawHw
  behaviorRecords.value = behaviorService.getAll().filter(b => b.studentId === s.id)
  phoneRecords.value = phoneRecordService.getAll().filter(p => p.studentId === s.id)
  counselingRecords.value = counselingService.getAll().filter(c => c.studentId === s.id)
  // Initialize editable document content
  setTimeout(() => initDocEdits(), 0)
}

// Document content edits
const docEdits = ref({
  praiseIntro: '',
  praises: [],
  shortTermPlan: [],
  longTermPlan: [],
  summaryP1: '',
  summaryP2: '',
  summaryP3: '',
  summaryKeyPoints: [],
  subjectAnalysis: {},
  subjectEdits: {},
  // Compiled markdown for single-textarea edit mode
  praiseMarkdown: '',
  planMarkdown: '',
  summaryMarkdown: '',
  subjectMarkdown: {}
})

function getSubjectEdit(subject) {
  if (!docEdits.value.subjectEdits[subject]) {
    docEdits.value.subjectEdits[subject] = { strengths: [''], weaknesses: [''], strategies: [''] }
  }
  return docEdits.value.subjectEdits[subject]
}

function initDocEdits() {
  const name = studentProfile.value?.name || ''
  docEdits.value.praiseIntro = `${name}同学在本阶段展现了积极的学习态度，以下方面值得肯定：`
  docEdits.value.praises = praises.value.length ? [...praises.value] : ['']
  docEdits.value.shortTermPlan = [
    '整理本次考试所有错题，逐题标注错因类型（粗心/概念不清/审题偏差/计算失误/综合能力不足）',
    '每道错题重新独立完成一遍，不看答案，完整写出解题过程',
    '根据错因类型统计，找到最频繁出现的错误类型，优先解决'
  ]
  docEdits.value.longTermPlan = [
    '建立每科错题本，每周回顾一次，标记"已掌握"/"需二刷"/"需三刷"状态',
    '每次考试后做一次全面的试卷分析，不只是看分数，而是分析每道题的得分点和失分原因',
    '培养"看到题目 → 判断题型和考点 → 选择解题策略 → 分步骤解答"的规范答题习惯，减少空白题',
    '与老师保持沟通，及时反馈学习中的困惑，避免问题积累'
  ]
  docEdits.value.summaryP1 = `${name}同学在本阶段的学习中展现出了积极进取的态度和明确的学习目标。从整体情况来看，${attendanceRate.value >= 95 ? '出勤稳定、' : ''}${homeworkRate.value >= 90 ? '作业完成规范、' : ''}具备持续进步的基础条件。`
  docEdits.value.summaryP2 = '成绩提升的关键往往不在于"会不会"，而在于"是否愿意写、是否敢拆步骤"。只要把该拿的分数守住，逐步突破中档题和综合题，成绩提升会更加稳定和持久。'
  docEdits.value.summaryP3 = `我们相信，在家校密切配合下，${name}一定能在接下来的学习中踏踏实实走好每一步。如有任何疑问或需要帮助，请随时与班主任联系。`
  docEdits.value.summaryKeyPoints = [
    '把基础分数稳定下来：回归课本和讲义，确保基础题型能够稳定得分',
    '建立错题复盘习惯：每道错题都要真正重做、重写过程，不只停留在"看懂了"',
    '培养步骤意识：面对综合题时敢于拆解、敢于写步骤，争取每一分步骤分'
  ]
  docEdits.value.subjectAnalysis = {}
  docEdits.value.subjectEdits = {}
  detailedSubjectReports.value.forEach(sa => {
    docEdits.value.subjectAnalysis[sa.subject] = sa.analysisText || ''
    docEdits.value.subjectEdits[sa.subject] = {
      strengths: sa.strengths.length ? [...sa.strengths] : [''],
      weaknesses: sa.weaknesses.length ? [...sa.weaknesses] : [''],
      strategies: (sa.strategies || []).length ? [...sa.strategies] : ['']
    }
  })
  composeAllMarkdown()
  buildFullDocument()
}

function composeAllMarkdown() {
  const pLines = [docEdits.value.praiseIntro, '']
  docEdits.value.praises.filter(x => x).forEach(p => { pLines.push('- ' + p) })
  docEdits.value.praiseMarkdown = pLines.join('\n')

  const planLines = ['## 短期（本周）', '']
  docEdits.value.shortTermPlan.filter(x => x).forEach(s => { planLines.push('- ' + s) })
  planLines.push('')
  detailedSubjectReports.value.filter(s => s.latestExam).forEach(subj => {
    planLines.push(`### ${subj.icon} ${subj.subject}（得分率 ${Math.round(subj.scoreRate * 100)}%）`)
    const strategies = docEdits.value.subjectEdits[subj.subject]?.strategies || subj.strategies || []
    strategies.filter(x => x).forEach(s => { planLines.push('- ' + s) })
    planLines.push('')
  })
  planLines.push('## 中长期（本月·学期）', '')
  docEdits.value.longTermPlan.filter(x => x).forEach(s => { planLines.push('- ' + s) })
  docEdits.value.planMarkdown = planLines.join('\n')

  const sumLines = [docEdits.value.summaryP1, '', '现阶段最关键的不是追求难题突破，而是——', '']
  docEdits.value.summaryKeyPoints.filter(x => x).forEach(kp => { sumLines.push('- ' + kp) })
  sumLines.push('', docEdits.value.summaryP2, '', docEdits.value.summaryP3)
  docEdits.value.summaryMarkdown = sumLines.join('\n')

  docEdits.value.subjectMarkdown = {}
  detailedSubjectReports.value.forEach(sa => {
    const edits = docEdits.value.subjectEdits[sa.subject]
    const subjLines = [(docEdits.value.subjectAnalysis[sa.subject] || sa.analysisText || ''), '']
    if (edits) {
      const strengths = edits.strengths?.filter(x => x) || []
      if (strengths.length) { subjLines.push('**优势方面：**'); strengths.forEach(s => { subjLines.push('- ' + s) }); subjLines.push('') }
      const weaknesses = edits.weaknesses?.filter(x => x) || []
      if (weaknesses.length) { subjLines.push('**需要关注：**'); weaknesses.forEach(w => { subjLines.push('- ' + w) }); subjLines.push('') }
    }
    docEdits.value.subjectMarkdown[sa.subject] = subjLines.join('\n')
  })
  buildFullDocument()
}

// Watch module toggles to rebuild editor content
watch(contentModules, () => { composeAllMarkdown() }, { deep: true })

function handleEditorSave() {
  ElMessage.success('文稿已保存')
}

// Full-document markdown ref (mutable, for MdEditor v-model)
const fullConfDocument = ref('')

function buildFullDocument() {
  const sections = []
  const push = (header, md) => { if (md && md.trim()) sections.push(header, '', md, '') }

  if (getModule('praise')?.enabled) push('# 一、成长亮点与进步肯定', docEdits.value.praiseMarkdown)
  if (getModule('daily')?.enabled) sections.push('# 二、日常学习表现', '', '(数据由系统自动生成)', '')
  if (getModule('subjects')?.enabled) {
    sections.push('# 三、各科学情分析', '')
    detailedSubjectReports.value.forEach(sa => {
      sections.push(`## ${sa.icon} ${sa.subject}`)
      const md = docEdits.value.subjectMarkdown[sa.subject] || ''
      if (md.trim()) sections.push('', md, '')
      else sections.push('', '(暂无分析)', '')
    })
  }
  if (getModule('examAnalysis')?.enabled) sections.push('# 四、考试成绩分析', '', '(数据由系统自动生成)', '')
  if (getModule('plan')?.enabled) push('# 五、提升建议与规划', docEdits.value.planMarkdown)
  if (getModule('summary')?.enabled) push('# 六、总结与家校共育', docEdits.value.summaryMarkdown)

  fullConfDocument.value = sections.join('\n') || '# 请先生成文稿'
}

const renderedConfDocument = computed(() => {
  if (!fullConfDocument.value) return '<p style="color:#999;text-align:center">暂无内容</p>'
  return marked.parse(fullConfDocument.value)
})

// AI Diagnosis
const aiDiagnosing = ref(false)
const aiProgress = ref(0)
const aiStatusText = ref('')
const aiDiagnosisResult = ref(null)
const showJsonPayload = ref(false)

function getDiagnosisPayload() {
  if (!studentProfile.value) return {}
  const profile = studentProfile.value
  return {
    systemPrompt: '你是一位资深DSE教育分析师，请基于以下学生数据生成学情诊断报告。报告需包含：各科水平评估、薄弱知识点识别、个性化提升建议。使用中文输出，语气专业温暖。',
    student: {
      name: profile.name,
      class: profile.class,
      campus: profile.campus,
      gender: profile.gender,
      identity: profile.identity,
      targetUniversity: profile.targetUniversity,
      studyAbroadPlanning: profile.studyAbroadPlanning,
      electives: [profile.elective1, profile.elective2, profile.elective3].filter(Boolean),
      boarding: profile.boarding
    },
    metrics: {
      attendanceRate: attendanceRate.value,
      homeworkRate: homeworkRate.value,
      lateCount: lateCount.value,
      phoneViolations: phoneViolations.value,
      positiveBehaviors: positiveBehaviors.value.length,
      counselingSessions: counselingRecords.value.length
    },
    examRecords: examRecords.value.map(e => ({
      subject: e.subject,
      examType: e.examType,
      date: e.date,
      score: e.score,
      total: e.total,
      scoreRate: Math.round(e.score / e.total * 100) / 100,
      topics: e.topics || [],
      mistakes: e.mistakes || 0,
      teacherFeedback: e.teacherFeedback || ''
    })),
    homeworkRecords: homeworks.value.map(h => ({
      subject: h.subject,
      title: h.title,
      status: h.status,
      dueDate: h.dueDate,
      score: h.score || null
    })),
    behaviorRecords: behaviorRecords.value.map(b => ({
      type: b.type,
      behavior: b.behavior,
      note: b.note || '',
      date: b.time?.slice(0, 10) || b.date || ''
    })),
    attendanceRecords: attendanceRecords.value.map(a => ({
      date: a.date,
      status: a.status,
      remark: a.remark || ''
    }))
  }
}

function formatJsonPayload() {
  return JSON.stringify(getDiagnosisPayload(), null, 2)
}

function copyJsonPayload() {
  const json = formatJsonPayload()
  navigator.clipboard.writeText(json).then(() => {
    ElMessage.success('JSON 已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动复制')
  })
}

async function startAiDiagnosis() {
  aiDiagnosing.value = true
  aiProgress.value = 0
  aiDiagnosisResult.value = null
  const steps = ['读取学生档案数据...', '分析考试成绩趋势...', '评估作业完成质量...', '比对班级平均水平...', '识别薄弱知识点...', '生成个性化建议...']
  for (let i = 0; i < steps.length; i++) {
    aiStatusText.value = steps[i]
    aiProgress.value = Math.round((i + 1) / steps.length * 100)
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400))
  }
  const iconMap = { '数学':'📐', '中文':'📝', '英文':'🔤', '物理':'⚡', '化学':'🧪', '生物':'🧬', '经济':'📈', '历史':'📜', '地理':'🌍', '资讯及通讯科技':'💻' }
  const detailMap = { '优秀':'基础知识扎实，解题规范，综合应用能力强，在班级中处于领先水平。','良好':'基础掌握较好，常规题型得分稳定，综合题和难题仍有提升空间。','待提升':'基础知识存在一定漏洞，需要系统性回顾和专题训练来巩固。','需关注':'基础概念需要重新构建，建议从最基础的例题开始逐步建立信心。','数据不足':'暂未收录该科考试数据，建议安排一次测评以建立分析基准。' }
  const result = detailedSubjectReports.value.map(sa => {
    const rate = sa.scoreRate
    let level, levelColor, tip, detail
    if (rate >= 0.9) { level = '优秀'; levelColor = '#22c55e'; tip = '保持当前节奏，可适当挑战DSE真题拓展解题视野'; detail = detailMap['优秀'] }
    else if (rate >= 0.75) { level = '良好'; levelColor = '#3b82f6'; tip = '巩固基础同时加强综合题型训练，重点突破薄弱知识点'; detail = detailMap['良好'] }
    else if (rate >= 0.6) { level = '待提升'; levelColor = '#e67e22'; tip = '回归课本夯实基础，建立错题本并每周复盘'; detail = detailMap['待提升'] }
    else if (rate > 0) { level = '需关注'; levelColor = '#ef4444'; tip = '从基础概念重新构建理解，每天攻克1-2个知识点'; detail = detailMap['需关注'] }
    else { level = '数据不足'; levelColor = '#888'; tip = '暂无考试数据，建议参加一次测评以建立基准'; detail = detailMap['数据不足'] }
    return { subject: sa.subject, icon: iconMap[sa.subject] || '📚', level, levelColor, tip, detail }
  })
  aiDiagnosisResult.value = result
  aiDiagnosing.value = false
}

function toggleFullscreen() { isFullScreen.value = !isFullScreen.value }
function togglePreviewOnly() { previewOnly.value = !previewOnly.value }
function exportPDF() {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { ElMessage.warning('请允许弹出窗口以导出PDF'); return }
  const sp = studentProfile.value
  const html = buildPrintHTML({
    title: sp?.name ? sp.name + '_家长会文稿' : '家长会文稿',
    docNo: 'No. ' + today.replace(/-/g, ''),
    name: sp?.name || '',
    cls: sp?.class || '',
    cc: sp?.cc || homeroomTeacher.value,
    electives: [sp?.elective1, sp?.elective2, sp?.elective3].filter(Boolean).join('、') || '暂无',
    targetUni: sp?.targetUniversity || '暂无',
    abroad: sp?.studyAbroadPlanning ? '有计划' : '暂无',
    attRate: attendanceRate.value,
    hwRate: homeworkRate.value,
    examCount: examRecords.value.length,
    schName: schoolName.value,
    schFull: schoolFullName.value,
    schSub: schoolSubtitle.value,
    footer: reportFooter.value,
    today,
    bodyHTML: renderedConfDocument.value,
    showTeacherSign: showTeacherSign.value,
    showParentSign: showParentSign.value,
    watermarkStyle: getWatermarkStyle(),
    watermarkHTML: getWatermarkHTML()
  })
  w.document.write(html)
  w.document.close()
}
function printDocument() { window.print() }

const exporting = ref(false)
async function exportDocument() {
  exporting.value = true
  try {
    await new Promise(r => setTimeout(r, 300))
    const el = document.getElementById('confExportContainer')
    if (!el) { ElMessage.warning('导出容器未找到'); exporting.value = false; return }
    const canvas = await html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight
    })
    const link = document.createElement('a')
    link.download = `${studentProfile.value?.name || '学生'}_家长会文稿_${today}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success('文稿已导出为高清A4图片')
  } catch (e) {
    ElMessage.error('导出失败，请重试')
  }
  exporting.value = false
}

onMounted(() => {
  const s = settingsService.get()
  schoolName.value = s.schoolName || store.schoolName
  schoolFullName.value = s.schoolFullName || store.schoolFullName
  schoolSubtitle.value = s.schoolSubtitle || store.schoolSubtitle
  homeroomTeacher.value = s.homeroomTeacher || store.homeroomTeacher
  reportFooter.value = s.reportFooter || store.reportFooter
  watermarkEnabled.value = s.watermarkEnabled !== undefined ? s.watermarkEnabled : store.watermarkEnabled
  watermarkText.value = s.watermarkText || store.watermarkText
  previewTheme.value = s.previewTheme || 'default'
  showTeacherSign.value = s.showTeacherSign !== undefined ? s.showTeacherSign : true
  showParentSign.value = s.showParentSign !== undefined ? s.showParentSign : true
})
</script>

<style scoped>
/* === Page Hero === */
.conf-page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  margin-bottom: 16px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-lg);
  position: relative;
  overflow: hidden;
}

.conf-page-hero::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--admin-accent), transparent);
  border-radius: 0 2px 2px 0;
}

.conf-hero-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.conf-hero-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(212,168,83,0.15), rgba(212,168,83,0.05));
  border-radius: 12px;
  font-size: 22px;
  border: 1px solid rgba(212,168,83,0.2);
}

.conf-hero-text h1 {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 700;
  color: var(--admin-text);
  letter-spacing: 0.5px;
}

.conf-hero-text p {
  margin: 0;
  font-size: 12px;
  color: var(--admin-text-muted);
  letter-spacing: 0.3px;
}

/* === Layout === */
.conf-layout { display: grid; grid-template-columns: 340px 1fr; gap: 16px; align-items: start; }

/* Left Panel */
.conf-left { display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: calc(100vh - 200px); }
.student-card { display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--admin-bg); border-radius: 10px; }
.sc-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--admin-accent), var(--admin-accent-dark)); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #fff; font-weight: 700; flex-shrink: 0; }
.sc-info { flex: 1; }
.sc-name { font-size: 14px; font-weight: 600; color: var(--admin-text); }
.sc-class { font-size: 11px; color: var(--admin-text-muted); font-weight: 400; margin-left: 6px; }
.sc-meta { font-size: 11px; color: var(--admin-text-muted); margin-top: 2px; }
.sc-elective { font-size: 11px; color: var(--admin-accent); margin-top: 2px; font-weight: 500; }
.quick-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.qs-item { text-align: center; padding: 10px; background: var(--admin-bg); border-radius: 8px; }
.qs-val { font-size: 20px; font-weight: 700; line-height: 1; margin-bottom: 2px; }
.qs-label { font-size: 10px; color: var(--admin-text-muted); }

.module-list { display: flex; flex-direction: column; gap: 6px; }
.module-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--admin-bg); border: 1.5px solid var(--admin-border); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.module-item:hover { border-color: var(--admin-border-light); }
.module-item.active { border-color: var(--admin-accent); }
.cm-icon { font-size: 16px; }
.cm-name { flex: 1; font-size: 13px; color: var(--admin-text); }

/* === Right Panel === */
.conf-right-card {
  position: relative;
}

.conf-right-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--admin-border);
  background: var(--admin-bg-secondary);
  border-radius: var(--admin-radius) var(--admin-radius) 0 0;
  gap: 12px;
  flex-wrap: wrap;
}

.conf-right-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conf-right-header-icon {
  font-size: 22px;
  line-height: 1;
}

.conf-right-header-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--admin-text);
  letter-spacing: 0.4px;
}

.conf-right-header-sub {
  font-size: 11px;
  color: var(--admin-text-muted);
  margin-top: 2px;
}

.conf-right-header-actions {
  display: flex;
  gap: 2px;
  align-items: center;
}

.conf-action-btn {
  font-size: 12px !important;
  color: var(--admin-text-secondary) !important;
  padding: 4px 17px !important;
  border-radius: 6px !important;
  transition: all 0.2s;
}

.conf-action-btn:hover {
  background: var(--admin-surface-hover) !important;
  color: var(--admin-text) !important;
}

.conf-mode-toggle-btn {
  font-size: 12px !important;
  border-radius: 6px !important;
  padding: 4px 12px !important;
  font-weight: 600 !important;
}

/* === Editor Pane === */
.conf-editor-pane {
  height: 100%;
}

.conf-editor-pane :deep(.md-editor) {
  height: 100%;
  border: none !important;
  border-radius: 0 !important;
}

/* === Preview-Only Pane === */
.conf-preview-pane {
  display: grid;
  grid-template-columns: 1fr 220px;
  height: 100%;
  z-index: 1;
  overflow: hidden;
  background: #e8e4db;
  padding: 20px;
  box-sizing: border-box;
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) {
  padding: 48px 56px;
  max-width: 794px;
  margin: 20px auto;
  overflow-y: auto;
  height: auto;
  min-height: 1123px;
  line-height: 1.9;
  font-size: 14px;
  color: #2d2d2d;
  background: #fffef9;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04);
  border-radius: 3px;
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) h1 {
  font-size: 22px;
  font-weight: 700;
  border-bottom: 2px solid var(--admin-accent);
  padding-bottom: 8px;
  margin: 20px 0 12px;
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 16px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--admin-border);
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 12px 0 8px;
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--admin-border);
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) th {
  background: var(--admin-bg-secondary);
  padding: 8px 12px;
  border: 1px solid var(--admin-border);
  font-weight: 600;
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) td {
  padding: 6px 12px;
  border: 1px solid var(--admin-border);
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) blockquote {
  border-left: 3px solid var(--admin-accent);
  padding: 8px 16px;
  margin: 12px 0;
  background: var(--admin-bg);
  font-style: italic;
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) code {
  background: var(--admin-bg);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.conf-preview-pane :deep(.md-editor-preview-wrapper) pre {
  background: var(--admin-bg);
  padding: 12px 16px;
  border-radius: 6px;
  overflow-x: auto;
}

.conf-catalog-wrap {
  border-left: 1px solid var(--admin-border);
  padding: 16px 12px;
  overflow-y: auto;
  height: 100%;
  background: var(--admin-bg);
}

.conf-catalog-wrap :deep(.md-editor-catalog) {
  font-size: 12px;
}

.conf-catalog-wrap :deep(.md-editor-catalog a) {
  color: var(--admin-text-secondary);
  text-decoration: none;
}

.conf-catalog-wrap :deep(.md-editor-catalog a:hover) {
  color: var(--admin-accent);
}

/* === Empty State === */
.conf-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  min-height: 400px;
}

.conf-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.conf-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--admin-text);
  margin-bottom: 8px;
}

.conf-empty-desc {
  font-size: 12px;
  color: var(--admin-text-muted);
  text-align: center;
  line-height: 1.8;
}

/* === md-editor-v3 Wrapper === */
.conf-md-editor-wrap {
  height: calc(100vh - 220px);
  min-height: 600px;
  overflow: hidden;
  border-radius: 0 0 var(--admin-radius) var(--admin-radius);
}

.conf-md-editor-wrap.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  height: 100vh;
  border-radius: 0;
  border: none;
}

.conf-md-editor-wrap :deep(.md-editor) {
  height: 100%;
  border: none !important;
  border-radius: 0 !important;
  padding: 65px;
}

.conf-md-editor-wrap :deep(.md-editor-content) {
  height: 100%;
}

.conf-md-editor-wrap :deep(.md-editor-toolbar) {
  border-top: none !important;
}

.fs-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(135deg, var(--admin-bg-secondary), var(--admin-surface));
  color: var(--admin-text);
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--admin-border);
  letter-spacing: 0.4px;
}

/* === Hidden Export Container === */
.hw-export-hidden {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 860px;
  z-index: -1;
}

/* Outer container — html2canvas-safe: solid colors, borders, no pseudo-elements for critical visuals */
.conf-export-inner {
  position: relative;
  background: #fffef9;
  padding: 44px 48px 40px;
  font-family: 'Noto Serif SC', 'PingFang SC', 'STSong', 'SimSun', 'Microsoft YaHei', serif;
  color: #2d2d2d;
  line-height: 1.9;
  font-size: 14px;
  border: 3px double #b8943e;
  margin: 4px;
  box-shadow: 0 0 0 2px #f5f0e3, 0 0 0 5px #b8943e;
}

/* === Document Head (3-column table) === */
.pp-doc-head {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
.pp-doc-head td { vertical-align: middle; padding: 0; }
.pp-doc-head-left { width: 28%; text-align: left; }
.pp-doc-head-center { width: 44%; text-align: center; }
.pp-doc-head-right { width: 28%; text-align: right; }

.pp-doc-no {
  font-size: 11px;
  color: #999;
  letter-spacing: 1px;
  margin-bottom: 4px;
  font-family: 'Consolas', 'Courier New', monospace;
}
.pp-doc-type {
  font-size: 13px;
  font-weight: 700;
  color: #b8943e;
  letter-spacing: 3px;
  border: 1px solid #b8943e;
  display: inline-block;
  padding: 3px 14px;
}
.pp-school-name {
  font-size: 24px;
  font-weight: 700;
  color: #3d2200;
  letter-spacing: 5px;
}
.pp-school-sub {
  font-size: 10px;
  color: #999;
  letter-spacing: 1.5px;
  margin-top: 2px;
}
.pp-doc-stamp {
  font-size: 11px;
  color: #c0392b;
  font-weight: 700;
  letter-spacing: 2px;
  border: 1px solid #c0392b;
  display: inline-block;
  padding: 2px 10px;
  border-radius: 2px;
  opacity: 0.75;
}
.pp-doc-stamp-sub {
  font-size: 9px;
  color: #aaa;
  letter-spacing: 1px;
  margin-top: 2px;
}

/* === Header Divider === */
.pp-hdiv {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 18px 0 20px;
}
.pp-hdiv-line {
  flex: 1;
  height: 0;
  border-bottom: 1px dotted #c8a04e;
}
.pp-hdiv-diamond {
  color: #c8a04e;
  font-size: 10px;
  flex-shrink: 0;
}
.pp-hdiv-star {
  color: #c8a04e;
  font-size: 16px;
  flex-shrink: 0;
}

/* === Student Profile Card === */
.pp-student-card {
  border: 1px solid #e0d5b8;
  background: #fdfaf3;
  padding: 14px 18px 8px;
  margin-bottom: 4px;
}
.pp-student-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #5c3d20;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0d5b8;
  letter-spacing: 1px;
}
.pp-info-table {
  width: 100%;
  border-collapse: collapse;
}
.pp-info-table td { padding: 4px 0; }
.pp-info-cell {
  font-size: 12px;
  padding: 3px 8px 3px 0 !important;
}
.pp-info-label {
  color: #8b692e;
  font-weight: 600;
  margin-right: 6px;
  font-size: 11px;
  letter-spacing: 0.5px;
}
.pp-info-label::after { content: '：'; }
.pp-info-text {
  color: #2d2d2d;
  font-size: 12px;
}

/* === Export Body (Rendered Markdown) === */
.pp-md-body {
  min-height: 180px;
}
.pp-md-body :deep(h1) {
  font-size: 20px;
  font-weight: 700;
  color: #3d2200;
  margin: 28px 0 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid #b8943e;
  letter-spacing: 1.5px;
}
.pp-md-body :deep(h2) {
  font-size: 17px;
  font-weight: 700;
  color: #4a2c17;
  margin: 22px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #d5c8a0;
  letter-spacing: 0.5px;
}
.pp-md-body :deep(h3) {
  font-size: 14px;
  font-weight: 600;
  color: #5c3d20;
  margin: 16px 0 8px;
}
.pp-md-body :deep(p) {
  margin: 10px 0;
  text-indent: 2em;
}
.pp-md-body :deep(ul), .pp-md-body :deep(ol) {
  padding-left: 2em;
  margin: 10px 0;
}
.pp-md-body :deep(li) { margin: 4px 0; }
.pp-md-body :deep(strong) { color: #3d2200; }
.pp-md-body :deep(blockquote) {
  border-left: 3px solid #b8943e;
  margin: 14px 0;
  padding: 10px 18px;
  background: #fdfaf3;
  font-style: italic;
  color: #5c3d20;
}
.pp-md-body :deep(blockquote p) { text-indent: 0; }
.pp-md-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
  font-size: 12px;
}
.pp-md-body :deep(th) {
  background: #f7f4ed;
  padding: 9px 12px;
  border: 1px solid #ccc;
  font-weight: 700;
  color: #111;
}
.pp-md-body :deep(td) {
  padding: 7px 12px;
  border: 1px solid #ccc;
  color: #333;
}
.pp-md-body :deep(hr) {
  border: none;
  border-top: 1px dotted #c8a04e;
  margin: 24px 0;
}
.pp-md-body :deep(code) {
  background: #f5f2eb;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Consolas', 'Courier New', monospace;
}
.pp-md-body :deep(pre) {
  background: #f5f2eb;
  padding: 14px 18px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.7;
}
.pp-md-body :deep(pre code) { background: none; padding: 0; }

/* === Signature Footer === */
.pp-sign-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 4px;
}
.pp-sign-cell {
  font-size: 13px;
  color: #555;
  padding: 6px 0;
  letter-spacing: 0.5px;
}

/* === Print styles === */
@media print {
  @page { size: A4; margin: 14mm 16mm 16mm; }
  body { background: #fefcf6 !important; }
  .conf-left,
  .conf-right-header,
  .conf-page-hero,
  .conf-md-editor-wrap,
  .conf-preview-pane,
  .conf-catalog-wrap,
  .fs-bar {
    display: none !important;
  }
  .hw-export-hidden {
    position: static !important;
    left: auto !important;
    width: 100% !important;
    z-index: auto !important;
    overflow: visible !important;
    height: auto !important;
  }
  .conf-export-inner {
    margin: 0 auto !important;
    padding: 30px 40px 28px !important;
    border: none !important;
    box-shadow: none !important;
    background: #fefcf6 !important;
    max-width: 760px !important;
    font-family: 'PingFang SC','Microsoft YaHei',sans-serif !important;
    color: #2c1810 !important;
    font-size: 13px !important;
    line-height: 1.85 !important;
  }
  .pp-doc-head { margin-bottom: 14px !important; }
  .pp-school-name {
    font-family: 'Noto Serif SC','STSong',serif !important;
    font-size: 26px !important;
    font-weight: 700 !important;
    letter-spacing: 6px !important;
    color: #3b2314 !important;
  }
  .pp-school-sub { color: #8b7355 !important; font-size: 10px !important; letter-spacing: 3px !important; }
  .pp-doc-no { color: #8b7355 !important; font-size: 10px !important; }
  .pp-doc-type { color: #8b6914 !important; border-color: #c4a85c !important; font-size: 11px !important; letter-spacing: 4px !important; }
  .pp-doc-stamp, .pp-doc-stamp-sub { color: #a04030 !important; border-color: #c08070 !important; opacity: 0.8 !important; }
  .pp-student-card {
    border-color: #e0d3b4 !important;
    background: #faf7ee !important;
  }
  .pp-student-card-title { color: #5c3d1e !important; border-bottom-color: #e0d3b4 !important; }
  .pp-info-label { color: #8b6914 !important; }
  .pp-info-text { color: #2c1810 !important; }
  .pp-hdiv { color: #c4a85c !important; }
  .pp-hdiv-line { border-bottom-color: #d9cba8 !important; }
  .pp-hdiv-star { color: #c4a85c !important; }
  .pp-hdiv-diamond { color: #8b6914 !important; }
  .pp-sign-cell { color: #5c4a3a !important; font-size: 12px !important; }
  .pp-md-body h1 {
    font-family: 'Noto Serif SC','STSong',serif !important;
    color: #3b2314 !important;
    border-bottom-color: #c4a85c !important;
  }
  .pp-md-body h2 { color: #4a2c17 !important; border-bottom-color: #d9cba8 !important; }
  .pp-md-body h3 { color: #5c3d1e !important; }
  .pp-md-body blockquote { background: #faf7ee !important; border-left-color: #c4a85c !important; color: #5c3d1e !important; }
  .pp-md-body th { background: #f7f3e8 !important; color: #3b2314 !important; border-color: #d5cbb0 !important; }
  .pp-md-body td { border-color: #e0d5b8 !important; }
  .pp-md-body code { background: #f5f0e5 !important; color: #6b5530 !important; }
  .pp-md-body pre { background: #f5f0e5 !important; border-color: #e0d5b8 !important; }
  .pp-md-body strong { color: #3b2314 !important; }
}

/* AI Diagnosis */

/* AI Diagnosis */
.ai-result-card { margin-top: 12px; }
.ai-result-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: var(--admin-accent); margin-bottom: 8px; }
.ai-diagnosis-card { padding: 10px 12px; margin-bottom: 8px; background: var(--admin-bg); border-radius: 8px; border: 1px solid var(--admin-border); }
.ai-dc-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.ai-dc-subject { font-weight: 600; color: var(--admin-text); font-size: 12px; }
.ai-dc-level { font-size: 10px; color: #fff; padding: 1px 8px; border-radius: 10px; font-weight: 600; }
.ai-dc-detail { font-size: 11px; color: var(--admin-text-secondary); line-height: 1.6; margin-bottom: 6px; }
.ai-dc-tip { font-size: 10px; color: var(--admin-accent); }

/* JSON Payload */
.json-payload-box { margin-top: 10px; padding: 10px; background: var(--admin-bg); border-radius: 8px; border: 1px solid var(--admin-border); }
.json-payload-pre { font-size: 10px; color: var(--admin-text-secondary); background: var(--admin-surface); padding: 10px; border-radius: 6px; max-height: 260px; overflow: auto; white-space: pre; font-family: 'Consolas','Courier New',monospace; line-height: 1.5; }

/* Template Selector */
.template-selector { display: flex; flex-direction: column; gap: 8px; }
.template-option { padding: 12px; border: 2px solid var(--admin-border); border-radius: 10px; cursor: pointer; transition: all 0.2s; background: var(--admin-surface); }
.template-option:hover { border-color: var(--admin-accent); background: var(--admin-bg); }
.template-option.active { border-color: var(--admin-accent); background: rgba(201,160,80,0.06); box-shadow: 0 0 0 3px rgba(201,160,80,0.1); }
.template-option-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.template-option-icon { font-size: 18px; }
.template-option-label { font-size: 13px; font-weight: 700; color: var(--admin-text); }
.template-check { color: var(--admin-accent); margin-left: auto; }
.template-option-desc { font-size: 11px; color: var(--admin-text-secondary); margin-bottom: 2px; padding-left: 26px; }
.template-option-tone { font-size: 10px; color: var(--admin-text-muted); padding-left: 26px; }

/* Drag styles */
.cm-drag-handle { cursor: grab; color: var(--admin-text-muted); font-size: 12px; letter-spacing: 2px; user-select: none; margin-right: 2px; }
.cm-drag-handle:active { cursor: grabbing; }
.module-item.dragging { opacity: 0.5; border-color: var(--admin-accent); background: rgba(201,160,80,0.08); }

@media (max-width: 768px) {
  .conf-layout { grid-template-columns: 1fr; }
  .conf-md-editor-wrap { height: 60vh; min-height: 400px; }
}

/* Supplement / Emoji */
.emoji-bar { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
.emoji-chip { padding: 2px 8px; border: 1px solid var(--admin-border); border-radius: 14px; background: var(--admin-surface); cursor: pointer; font-size: 14px; font-family: var(--admin-font); transition: all 0.15s; }
.emoji-chip:hover { border-color: var(--admin-accent); background: rgba(201,160,80,0.08); }
.emoji-chip.more { font-size: 11px; color: var(--admin-text-muted); }
.emoji-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; max-height: 240px; overflow-y: auto; }
.emoji-cell { padding: 4px; border: 1px solid transparent; border-radius: 4px; background: transparent; cursor: pointer; font-size: 16px; text-align: center; }
.emoji-cell:hover { border-color: var(--admin-accent); background: var(--admin-bg); }

.supplement-list { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
.supplement-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: var(--admin-bg); border: 1px solid var(--admin-border); border-radius: 8px; }
.supplement-item-content { flex: 1; min-width: 0; }
.supplement-item-title { font-size: 12px; font-weight: 600; color: var(--admin-text); }
.supplement-item-text { font-size: 10px; color: var(--admin-text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.supplement-item-actions { display: flex; gap: 2px; flex-shrink: 0; margin-left: 8px; }

</style>
