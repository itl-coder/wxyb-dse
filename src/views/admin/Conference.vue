<template>
  <div class="conference-page">
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📋 家长会准备</div>
          <div class="admin-card-subtitle">按选修科目动态生成 · 多维度数据整合 · 面向家长的专业反馈</div>
        </div>
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

        <div class="admin-card" v-if="studentProfile">
          <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">📝 文稿模块</div>
          <div class="module-list">
            <div v-for="mod in contentModules" :key="mod.id" class="module-item" :class="{ active: mod.enabled }">
              <span class="cm-icon">{{ mod.icon }}</span>
              <span class="cm-name">{{ mod.name }}</span>
              <el-switch v-model="mod.enabled" size="small" @click.stop />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Preview -->
      <div class="conf-right">
        <div class="admin-card">
          <div class="admin-card-header">
            <div>
              <div class="admin-card-title">📄 家长会文稿预览</div>
              <div class="admin-card-subtitle">基于{{ studentProfile?.name || '学生' }}的实际数据生成</div>
            </div>
            <div style="display:flex;gap:8px">
              <el-button size="small" :type="editMode ? 'warning' : 'default'" @click="toggleEditMode">
                {{ editMode ? '👁️ 预览模式' : '✏️ 编辑模式' }}
              </el-button>
              <el-button size="small" @click="toggleFullscreen">{{ isFullScreen ? '退出全屏' : '全屏预览' }}</el-button>
              <el-button size="small" type="primary" @click="printDocument">🖨️ 打印</el-button>
            </div>
          </div>
          <div v-if="!studentProfile" class="admin-empty" style="padding:60px">
            <div class="empty-icon">👈</div>
            <p>请先选择班级和学生</p>
          </div>
          <div v-else class="preview-container" :class="{ fullscreen: isFullScreen }" ref="previewRef">
            <div v-if="isFullScreen" class="fs-bar">
              <span>家长会文稿预览</span>
              <div style="display:flex;gap:8px">
                <el-button size="small" @click="printDocument">🖨️ 打印</el-button>
                <el-button size="small" @click="toggleFullscreen">退出全屏</el-button>
              </div>
            </div>
            <div class="preview-paper">
              <!-- Header -->
              <div class="pp-header">
                <h1>{{ schoolName }} · 家长会交流材料</h1>
                <div class="pp-meta">
                  <span>学生：{{ studentProfile.name }}</span>
                  <span>班级：{{ studentProfile.class }}</span>
                  <span>日期：{{ today }}</span>
                  <span>班主任：{{ studentProfile.cc || '张老师' }}</span>
                </div>
              </div>

              <!-- Module 1: Praise -->
              <div v-if="getModule('praise')?.enabled" class="pp-section">
                <h2><span class="pp-num">一</span>成长亮点与进步肯定</h2>
                <div class="pp-content">
                  <div v-if="!editMode" v-html="renderMd(docEdits.praiseMarkdown)" class="pp-md-render"></div>
                  <textarea v-else class="pp-edit-full" v-model="docEdits.praiseMarkdown" rows="12" placeholder="使用 Markdown 格式编辑此部分内容...&#10;&#10;段落直接书写。&#10;- 列表项用 - 开头&#10;- **粗体**  *斜体*  `代码`&#10;&#10;支持 $LaTeX$ 公式"></textarea>
                  <div v-if="positiveBehaviors.length" class="pp-behavior-box">
                    <div class="pp-label-sm">近期积极表现</div>
                    <div v-for="b in positiveBehaviors" :key="b.id" class="pp-behavior-item">
                      <span class="pp-date">{{ b.time?.slice(0,10) || b.date }}</span>
                      <span>{{ b.behavior }} — {{ b.note || '' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Supplements Module -->
              <div v-if="supplements.length" class="pp-section">
                <h2><span class="pp-num">★</span>补充材料</h2>
                <div class="pp-content">
                  <div v-for="(sup, idx) in supplements" :key="idx" class="pp-supplement-card">
                    <h3>{{ sup.title }}</h3>
                    <p class="pp-supplement-text">{{ sup.content }}</p>
                    <div class="pp-supplement-date">{{ sup.date }}</div>
                  </div>
                </div>
              </div>

              <!-- Module 2: Daily -->
              <div v-if="getModule('daily')?.enabled" class="pp-section">
                <h2><span class="pp-num">二</span>日常学习表现</h2>
                <div class="pp-content">
                  <div class="pp-data-row">
                    <div class="ppd-item">
                      <span class="ppd-label">出勤率</span>
                      <span class="ppd-val" :class="attendanceRate >= 95 ? 'good' : 'warn'">{{ attendanceRate }}%</span>
                    </div>
                    <div class="ppd-item">
                      <span class="ppd-label">作业完成率</span>
                      <span class="ppd-val" :class="homeworkRate >= 90 ? 'good' : 'warn'">{{ homeworkRate }}%</span>
                    </div>
                    <div class="ppd-item">
                      <span class="ppd-label">迟到次数</span>
                      <span class="ppd-val" :class="lateCount === 0 ? 'good' : 'warn'">{{ lateCount }}次</span>
                    </div>
                    <div class="ppd-item">
                      <span class="ppd-label">手机违纪</span>
                      <span class="ppd-val" :class="phoneViolations === 0 ? 'good' : 'warn'">{{ phoneViolations }}次</span>
                    </div>
                  </div>
                  <div class="pp-data-row" v-if="positiveBehaviors.length || counselingRecords.length">
                    <div class="ppd-item">
                      <span class="ppd-label">积极表现</span>
                      <span class="ppd-val" style="color:#22c55e">{{ positiveBehaviors.length }}次</span>
                    </div>
                    <div class="ppd-item">
                      <span class="ppd-label">心理辅导</span>
                      <span class="ppd-val" :style="{color: counselingRecords.length > 0 ? '#3b82f6' : '#888'}">{{ counselingRecords.length }}次</span>
                    </div>
                  </div>
                  <div v-if="homeworks.length" class="pp-table-wrap">
                    <h4>近期作业情况</h4>
                    <table class="pp-table">
                      <thead><tr><th>科目</th><th>作业标题</th><th>状态</th><th>评分</th></tr></thead>
                      <tbody>
                        <tr v-for="h in homeworks" :key="h.id">
                          <td>{{ h.subject }}</td>
                          <td>{{ h.title }}</td>
                          <td>{{ h.status }}</td>
                          <td>{{ h.score || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Module 3: Subjects (by elective) -->
              <div v-if="getModule('subjects')?.enabled" class="pp-section">
                <h2><span class="pp-num">三</span>各科学情分析</h2>
                <div class="pp-content">
                  <div v-for="subj in detailedSubjectReports" :key="subj.subject" class="pp-subject-block">
                    <h3>{{ subj.icon }} {{ subj.subject }}
                      <span v-if="subj.isElective" class="pp-elective-badge">选修</span>
                      <span v-else class="pp-core-badge">核心</span>
                    </h3>
                    <div v-if="subj.latestExam">
                      <div class="pp-score-row">
                        最近考试：<b :style="{color: subj.scoreRate >= 0.9 ? '#22c55e' : subj.scoreRate >= 0.75 ? '#3b82f6' : subj.scoreRate >= 0.6 ? '#e67e22' : '#ef4444'}">{{ subj.latestExam.score }}/{{ subj.latestExam.total }}</b>
                        ({{ subj.latestExam.examType }} · {{ subj.latestExam.date }})
                        <span class="pp-rate-pct">得分率 {{ Math.round(subj.scoreRate * 100) }}%</span>
                      </div>
                      <!-- Rich Analysis -->
                      <div v-if="!editMode" v-html="renderMd(docEdits.subjectMarkdown[subj.subject] || docEdits.subjectAnalysis[subj.subject])" class="pp-md-render"></div>
                      <textarea v-else class="pp-edit-full" v-model="docEdits.subjectMarkdown[subj.subject]" rows="8" :placeholder="'编辑 ' + subj.subject + ' 学情分析（Markdown 格式）...'"></textarea>
                      <div v-if="subj.latestExam.teacherFeedback" class="pp-feedback">
                        <div class="pp-label-sm">教师反馈</div>
                        <p>{{ subj.latestExam.teacherFeedback }}</p>
                      </div>
                    </div>
                    <div v-else class="pp-no-data">暂无该科考试数据，建议关注该科学习进展</div>
                  </div>
                </div>
              </div>

              <!-- Module 4: Exam Analysis -->
              <div v-if="getModule('examAnalysis')?.enabled" class="pp-section">
                <h2><span class="pp-num">四</span>考试成绩分析</h2>
                <div class="pp-content">
                  <div v-for="subj in subjectAnalyses.filter(s => s.latestExam)" :key="subj.subject" class="pp-exam-block">
                    <h3>{{ subj.icon }} {{ subj.subject }}</h3>
                    <div class="pp-exam-bar-row">
                      <div class="pp-exam-bar-label">得分率</div>
                      <div class="pp-exam-bar-wrap">
                        <div class="pp-exam-bar" :style="{width: subj.scoreRate*100+'%', background: subj.scoreRate>=0.9?'#22c55e':subj.scoreRate>=0.75?'#3b82f6':subj.scoreRate>=0.6?'#e67e22':'#ef4444'}"></div>
                      </div>
                      <span class="pp-exam-bar-pct">{{ Math.round(subj.scoreRate*100) }}%</span>
                    </div>
                    <div class="pp-exam-bar-row">
                      <div class="pp-exam-bar-label">班级均分</div>
                      <div class="pp-exam-bar-wrap">
                        <div class="pp-exam-bar" :style="{width: getClassAvgForSubject(subj.subject)+'%', background:'#888'}"></div>
                      </div>
                      <span class="pp-exam-bar-pct">{{ getClassAvgForSubject(subj.subject) }}%</span>
                    </div>
                    <div class="pp-exam-delta" :class="subj.scoreRate*100 - getClassAvgForSubject(subj.subject) >= 0 ? 'above' : 'below'">
                      {{ subj.scoreRate*100 - getClassAvgForSubject(subj.subject) >= 0 ? '↑ 高于' : '↓ 低于' }}班级均分 {{ Math.abs(Math.round(subj.scoreRate*100 - getClassAvgForSubject(subj.subject))) }}%
                    </div>
                    <div v-if="subj.prevExam" class="pp-exam-compare">
                      <div class="pp-exam-compare-title">📈 与上次考试对比</div>
                      <div class="pp-exam-compare-row">
                        <span class="pp-exam-compare-label">上次</span>
                        <span class="pp-exam-compare-val">{{ subj.prevExam.score }}/{{ subj.prevExam.total }} ({{ Math.round(subj.prevScoreRate*100) }}%)</span>
                        <span style="font-size:10px;color:#888">{{ subj.prevExam.examType }} · {{ subj.prevExam.date }}</span>
                      </div>
                      <div class="pp-exam-compare-row">
                        <span class="pp-exam-compare-label">本次</span>
                        <span class="pp-exam-compare-val">{{ subj.latestExam.score }}/{{ subj.latestExam.total }} ({{ Math.round(subj.scoreRate*100) }}%)</span>
                        <span :style="{fontSize:'11px',fontWeight:600,color:subj.scoreChange >= 0 ? '#22c55e' : '#ef4444'}">
                          {{ subj.scoreChange >= 0 ? '↑' : '↓' }}{{ Math.abs(subj.scoreChange) }}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-if="!subjectAnalyses.filter(s => s.latestExam).length" class="pp-no-data">暂无考试对比数据</div>
                </div>
              </div>

              <!-- Module 5: Plan -->
              <div v-if="getModule('plan')?.enabled" class="pp-section">
                <h2><span class="pp-num">五</span>提升建议与规划</h2>
                <div class="pp-content">
                  <div v-if="!editMode" v-html="renderMd(docEdits.planMarkdown)" class="pp-md-render"></div>
                  <textarea v-else class="pp-edit-full" v-model="docEdits.planMarkdown" rows="20" placeholder="使用 Markdown 格式编辑提升建议与规划...&#10;&#10;## 短期（本周）&#10;- 短期计划项&#10;&#10;### 📐 数学（得分率 85%）&#10;- 学科策略&#10;&#10;## 中长期（本月·学期）&#10;- 长期计划项"></textarea>
                </div>
              </div>
              <div v-if="getModule('summary')?.enabled" class="pp-section">
                <h2><span class="pp-num">六</span>总结与家校共育</h2>
                <div class="pp-content">
                  <div class="pp-summary-box">
                    <div v-if="!editMode" v-html="renderMd(docEdits.summaryMarkdown)" class="pp-md-render"></div>
                    <textarea v-else class="pp-edit-full" v-model="docEdits.summaryMarkdown" rows="16" placeholder="使用 Markdown 格式编辑总结与家校共育...&#10;&#10;总结段落直接书写。&#10;&#10;- 关键要点用 - 开头&#10;- **粗体** 强调重点&#10;&#10;支持换行分段。"></textarea>
                    <div v-if="teacherSupplement" style="margin-top:16px;padding:14px;background:var(--admin-bg);border-left:3px solid var(--admin-warning);border-radius:0 8px 8px 0">
                      <p style="font-weight:700;font-size:12px;color:var(--admin-accent);margin:0 0 6px">📌 教师补充意见</p>
                      <p style="margin:0;font-size:12px;color:var(--admin-text-secondary);text-indent:0;white-space:pre-wrap">{{ teacherSupplement }}</p>
                    </div>
                  </div>
                  <div class="pp-footer">
                    <p class="pp-signature">班主任：{{ studentProfile.cc || '张老师' }}</p>
                    <p class="pp-signature">{{ today }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { studentService, examService, attendanceService, homeworkService, behaviorService, phoneRecordService, counselingService, settingsService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { renderRichContent } from '@/utils/renderContent'

function renderMd(text) {
  if (!text) return ''
  return renderRichContent(text)
}

const store = useAppStore()
const selectedClass = ref('')
const selectedStudentId = ref(null)
const studentProfile = ref(null)
const isFullScreen = ref(false)
const previewRef = ref(null)
const today = new Date().toISOString().split('T')[0]
const schoolName = ref('威学一百')
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

// Edit mode for document content
const editMode = ref(false)
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
}

function toggleEditMode() {
  if (!editMode.value) { composeAllMarkdown() }
  editMode.value = !editMode.value
}

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
function printDocument() { window.print() }

onMounted(() => {
  const s = settingsService.get()
  schoolName.value = s.schoolName || store.schoolName
})
</script>

<style scoped>
.conf-layout { display: grid; grid-template-columns: 340px 1fr; gap: 16px; align-items: start; }

/* Left Panel */
.conf-left { display: flex; flex-direction: column; gap: 16px; overflow-y: auto; max-height: calc(100vh - 140px); }
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

/* Preview */
.preview-container { background: #f5f0e8; padding: 24px; border-radius: 8px; max-height: 75vh; overflow-y: auto; }
.preview-container.fullscreen { position: fixed; inset: 0; z-index: 9999; background: #e8e2d8; max-height: none; padding: 0; border-radius: 0; overflow-y: auto; }
.fs-bar { position: sticky; top: 0; z-index: 10; background: #4a2c17; color: #f5f0e8; padding: 10px 24px; display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 600; }

.preview-paper { max-width: 800px; margin: 0 auto; background: #fff; padding: 48px 56px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); font-family: 'PingFang SC','Microsoft YaHei',serif; color: #2c2c2c; line-height: 1.8; font-size: 14px; }
.fullscreen .preview-paper { margin: 24px auto 48px; }

.pp-header { text-align: center; border-bottom: 2px solid #8b5e3c; padding-bottom: 20px; margin-bottom: 28px; }
.pp-header h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #4a2c17; letter-spacing: 2px; }
.pp-meta { display: flex; justify-content: center; gap: 24px; font-size: 13px; color: #666; flex-wrap: wrap; }
.pp-section { margin-bottom: 28px; page-break-inside: avoid; }
.pp-section h2 { font-size: 18px; font-weight: 700; color: #4a2c17; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid #ddd; display: flex; align-items: center; gap: 10px; }
.pp-num { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: #8b5e3c; color: #fff; border-radius: 50%; font-size: 14px; flex-shrink: 0; }
.pp-content { padding-left: 8px; }
.pp-content p { margin: 8px 0; text-indent: 2em; }
.pp-content ul { padding-left: 3em; }
.pp-content ul li { margin: 4px 0; }
.pp-data-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0 16px; }
.ppd-item { text-align: center; padding: 12px; background: #faf8f5; border-radius: 8px; border: 1px solid #eee; }
.ppd-label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
.ppd-val { display: block; font-size: 20px; font-weight: 700; }
.ppd-val.good { color: #22c55e; } .ppd-val.warn { color: #e67e22; }

.pp-behavior-box { margin-top: 12px; padding: 10px 14px; background: #faf8f5; border-radius: 6px; }
.pp-behavior-item { font-size: 12px; padding: 4px 0; display: flex; gap: 12px; border-bottom: 1px solid #eee; }
.pp-behavior-item:last-child { border-bottom: none; }
.pp-date { color: #999; white-space: nowrap; font-size: 11px; }

.pp-table-wrap { margin-top: 14px; }
.pp-table-wrap h4 { font-size: 13px; color: #4a2c17; margin-bottom: 8px; }
.pp-table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
.pp-table th { text-align: left; padding: 6px 10px; background: #faf8f5; border-bottom: 2px solid #ddd; font-weight: 600; color: #4a2c17; }
.pp-table td { padding: 6px 10px; border-bottom: 1px solid #eee; }

.pp-subject-block { margin-bottom: 20px; padding: 14px; border: 1px solid #eee; border-radius: 8px; }
.pp-subject-block h3 { font-size: 15px; font-weight: 700; color: #4a2c17; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
.pp-elective-badge { font-size: 10px; background: #fdf6ec; color: #b1740e; padding: 1px 8px; border-radius: 4px; font-weight: 500; }
.pp-core-badge { font-size: 10px; background: #ecf5ff; color: #3b82f6; padding: 1px 8px; border-radius: 4px; font-weight: 500; }
.pp-score-row { font-size: 13px; color: #555; margin-bottom: 8px; }
.pp-feedback { padding: 10px 14px; background: #f3f0fa; border-left: 3px solid #7c3aed; border-radius: 0 6px 6px 0; margin: 10px 0; }
.pp-feedback p { font-size: 12px; color: #555; text-indent: 0; margin: 4px 0; }
.pp-no-data { font-size: 12px; color: #999; text-align: center; padding: 10px; }
.pp-label-sm { font-size: 12px; font-weight: 700; color: #7c3aed; margin-bottom: 4px; }

.pp-plan-item { padding: 10px 14px; margin-bottom: 10px; background: #faf8f5; border-radius: 0 8px 8px 0; border-left: 3px solid #8b5e3c; }
.pp-plan-subject { font-size: 13px; font-weight: 600; color: #8b5e3c; margin-bottom: 4px; }

.pp-rate-pct { font-size: 11px; color: #888; margin-left: 8px; }
.pp-analysis-text { padding: 10px 14px; background: #faf8f5; border-radius: 6px; margin: 8px 0; }
.pp-analysis-text p { font-size: 13px; color: #555; text-indent: 0; margin: 0; line-height: 1.9; }
.pp-point-box { padding: 10px 14px; border-radius: 6px; margin: 8px 0; }
.pp-point-box.strengths { background: #f0faf3; border-left: 3px solid #22c55e; }
.pp-point-box.weaknesses { background: #fef9e7; border-left: 3px solid #e67e22; }
.pp-point-title { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
.pp-point-box.strengths .pp-point-title { color: #22c55e; }
.pp-point-box.weaknesses .pp-point-title { color: #e67e22; }
.pp-point-box ul { padding-left: 1.5em; margin: 4px 0; }
.pp-point-box li { font-size: 12px; color: #555; margin: 3px 0; }
.pp-plan-item ul { font-size: 12px; padding-left: 2em; }

.pp-summary-box { padding: 16px 20px; background: linear-gradient(135deg, #fdf8f3, #faf8f5); border: 1px solid #eee; border-radius: 10px; margin-bottom: 16px; }
.pp-footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 13px; }
.pp-signature { text-align: right; margin-top: 8px; font-size: 13px; color: #555; }

/* Exam analysis styles */
.pp-exam-block { margin-bottom: 14px; padding: 12px; background: #faf8f5; border-radius: 8px; }
.pp-exam-block h3 { font-size: 13px; font-weight: 600; color: #4a2c17; margin: 0 0 6px; }
.pp-exam-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 11px; }
.pp-exam-bar-label { width: 64px; color: #888; flex-shrink: 0; }
.pp-exam-bar-wrap { flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
.pp-exam-bar { height: 100%; border-radius: 4px; transition: width 0.5s; }
.pp-exam-bar-pct { width: 36px; text-align: right; color: #555; font-weight: 500; flex-shrink: 0; }
.pp-exam-delta { font-size: 10px; margin-top: 2px; padding-left: 72px; }
.pp-exam-delta.above { color: #22c55e; }
.pp-exam-delta.below { color: #ef4444; }
.pp-exam-compare { margin-top: 8px; padding: 8px 10px; background: #f0f9ff; border-radius: 6px; border: 1px solid #e0f0ff; }
.pp-exam-compare-title { font-size: 11px; font-weight: 600; color: #3b82f6; margin-bottom: 6px; }
.pp-exam-compare-row { display: flex; align-items: center; gap: 10px; font-size: 11px; margin-bottom: 2px; }
.pp-exam-compare-label { width: 32px; color: #888; }
.pp-exam-compare-val { color: #333; font-weight: 500; }

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

@media (max-width: 768px) {
  .conf-layout { grid-template-columns: 1fr; }
  .pp-data-row { grid-template-columns: repeat(2, 1fr); }
  .preview-paper { padding: 24px; }
  .pp-meta { flex-direction: column; gap: 4px; align-items: center; }
}

/* Edit Mode — full-width markdown textarea */
.pp-edit-full {
  width: 100%;
  border: 2px solid var(--admin-accent);
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 14px;
  line-height: 1.9;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Consolas', monospace;
  background: var(--admin-bg);
  color: var(--admin-text);
  resize: vertical;
  white-space: pre-wrap;
  tab-size: 2;
  min-height: 120px;
}
.pp-edit-full:focus { outline: none; border-color: var(--admin-primary); box-shadow: 0 0 0 3px rgba(201,160,80,0.15); }

.pp-md-render { line-height: 1.9; }
.pp-md-render :deep(p) { margin: 8px 0; }
.pp-md-render :deep(ul) { padding-left: 2em; margin: 8px 0; }
.pp-md-render :deep(li) { margin: 4px 0; }
.pp-md-render :deep(strong) { color: var(--admin-accent); }
.pp-md-render :deep(h2) { font-size: 16px; font-weight: 700; color: #4a2c17; margin: 14px 0 8px; }
.pp-md-render :deep(h3) { font-size: 14px; font-weight: 600; color: #4a2c17; margin: 10px 0 6px; }

/* Edit Mode */
.pp-edit-textarea {
  width: 100%;
  border: 1px solid var(--admin-accent);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.8;
  font-family: inherit;
  background: var(--admin-bg);
  color: var(--admin-text);
  resize: vertical;
  margin: 4px 0;
}
.pp-edit-list { display: flex; flex-direction: column; gap: 6px; }
.pp-edit-list-item { display: flex; align-items: flex-start; gap: 6px; }
.pp-edit-list-textarea {
  flex: 1;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1.6;
  font-family: inherit;
  background: var(--admin-bg);
  color: var(--admin-text);
  resize: vertical;
}
.pp-edit-list-textarea:focus { border-color: var(--admin-accent); }

@media print {
  body * { visibility: hidden; }
  .preview-container, .preview-container * { visibility: visible; }
  .preview-container { position: absolute; left: 0; top: 0; width: 100%; background: #fff; padding: 0; max-height: none; overflow: visible; }
  .fs-bar { display: none; }
  .preview-paper { box-shadow: none; padding: 20px 32px; max-width: 100%; }
  .pp-edit-textarea, .pp-edit-list, .pp-edit-list-item .el-button { display: none !important; }
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

/* Preview supplement cards */
.pp-supplement-card { padding: 14px 18px; margin-bottom: 12px; background: #fef9e7; border-left: 3px solid #e67e22; border-radius: 0 8px 8px 0; }
.pp-supplement-card h3 { font-size: 14px; font-weight: 700; color: #8b5e3c; margin: 0 0 8px; }
.pp-supplement-text { font-size: 13px; color: #555; line-height: 1.8; white-space: pre-wrap; text-indent: 0; }
.pp-supplement-date { font-size: 10px; color: #aaa; text-align: right; margin-top: 8px; }
</style>
