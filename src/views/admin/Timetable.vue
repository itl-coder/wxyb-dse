<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">📅 课表管理</div>
          <div class="admin-card-subtitle">教师周课时分配 · 自动生成月课表 · 支持周六日</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <el-select v-model="currentClass" size="small" style="width:100px" @change="loadAll">
            <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
          </el-select>
          <el-select v-model="currentMonth" size="small" style="width:130px" @change="onMonthChange">
            <el-option v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
          <el-switch v-model="showWeekend" size="small" active-text="周六日" inactive-text="仅工作日" />
          <el-button size="small" type="primary" @click="openBatchDialog">📋 批量分配</el-button>
          <el-button size="small" @click="applyToCurrentMonth">🔄 应用到本月</el-button>
          <el-button size="small" @click="showPrintDialog = true">🖨️ 打印课表</el-button>
          <el-button size="small" @click="showTimeDialog = true">⏰ 时间设置</el-button>
        </div>
      </div>

      <!-- View Tabs -->
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <button v-for="tab in viewTabs" :key="tab.key" class="tt-view-tab" :class="{ active: activeView === tab.key }" @click="activeView = tab.key">{{ tab.label }}</button>
      </div>

      <!-- === WEEK VIEW (Schedule Editor) === -->
      <div v-if="activeView === 'week'" class="tt-week-layout">
        <!-- Teacher Overview Panel -->
        <div class="tt-teacher-panel">
          <div class="tt-panel-title">👨‍🏫 教师周课时</div>
          <div v-for="t in teacherSummary" :key="t.teacher" class="tt-teacher-row" @click="highlightTeacher = highlightTeacher === t.teacher ? null : t.teacher" :class="{ active: highlightTeacher === t.teacher }">
            <div class="tt-teacher-name">{{ t.teacher }}</div>
            <div class="tt-teacher-subjects">{{ t.subjects }}</div>
            <div class="tt-teacher-total">{{ t.total }}节/周</div>
          </div>
          <div v-if="teacherSummary.length === 0" style="font-size:11px;color:var(--admin-text-muted);text-align:center;padding:12px">暂无教师数据</div>
        </div>

        <!-- Weekly Grid -->
        <div class="tt-grid-wrap">
          <div style="font-size:13px;font-weight:600;color:var(--admin-text);margin-bottom:8px;text-align:center">
            {{ currentClass }}班 · 周课表 · {{ currentMonthLabel }}
            <el-tag v-if="isCurrentMonth" size="small" type="success" style="margin-left:6px">当月</el-tag>
          </div>
          <div class="tt-grid">
            <div class="tt-grid-header">
              <div class="tt-corner">节次</div>
              <div v-for="d in activeWeekdays" :key="d.value" class="tt-day-header" :class="{ weekend: d.value >= 6 }">
                <div>{{ d.label }}</div>
              </div>
            </div>
            <div v-for="p in periods" :key="p.id" class="tt-grid-row">
              <div class="tt-period-cell">
                <div>{{ p.label }}</div>
                <div class="tt-period-time">{{ p.time }}</div>
              </div>
              <div v-for="d in activeWeekdays" :key="d.value" class="tt-lesson-cell" :class="{
                weekend: d.value >= 6,
                'has-lesson': getSchedule(d.value, p.id),
                highlighted: highlightTeacher && getSchedule(d.value, p.id)?.teacher === highlightTeacher
              }" :style="cellBackgroundStyle(getSchedule(d.value, p.id))" @click="editCell(d.value, p.id)">
                <template v-if="getSchedule(d.value, p.id)">
                  <div class="tt-cell-subject" :style="cellTextStyle(getSchedule(d.value, p.id))">{{ getSchedule(d.value, p.id).subject }}</div>
                  <div class="tt-cell-teacher" :style="cellTextStyle(getSchedule(d.value, p.id))">{{ getSchedule(d.value, p.id).teacher }}</div>
                  <div class="tt-cell-room" :style="cellTextStyle(getSchedule(d.value, p.id))">{{ getSchedule(d.value, p.id).room }}</div>
                </template>
                <div v-else class="tt-cell-empty">+</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- === MONTH VIEW (Calendar) === -->
      <div v-if="activeView === 'month'" class="tt-month-view">
        <div class="tt-month-header">
          <div class="tt-month-nav">
            <el-button size="small" text @click="changeMonth(-1)">◀</el-button>
            <span class="tt-month-title">{{ monthYear }}</span>
            <el-button size="small" text @click="changeMonth(1)">▶</el-button>
            <el-button size="small" @click="monthOffset = 0" style="margin-left:8px">本月</el-button>
          </div>
          <div class="tt-month-legend">
            <span class="tt-legend-dot" style="background:var(--admin-primary)"></span> 主科
            <span class="tt-legend-dot" style="background:var(--admin-success)"></span> 选修
            <span class="tt-legend-dot" style="background:var(--admin-accent)"></span> 其他
            <span style="margin-left:8px;font-size:10px;color:var(--admin-text-muted)">{{ currentClass }}班</span>
          </div>
        </div>

        <div class="tt-calendar-new">
          <div v-for="dh in dayHeaders" :key="dh" class="tt-caln-header">{{ dh }}</div>
          <div v-for="cell in monthCells" :key="cell.key" class="tt-caln-cell"
            :class="{ today: cell.date === today, other: !cell.inMonth, weekend: cell.isWeekend }"
            @click="cell.date && cell.lessons.length && openDayDetail(cell)">
            <div class="tt-caln-date">
              <span v-if="cell.date === today" class="tt-caln-today-badge">今</span>
              {{ cell.label }}
            </div>
            <div v-if="cell.date && cell.lessons.length" class="tt-caln-subjects">
              <div v-for="l in cell.lessons.slice(0, 5)" :key="l.period" class="tt-caln-subject-row"
                :style="{ borderLeftColor: subjectColor(l.subject) }">
                <span class="tt-caln-period">{{ l.period }}</span>
                <span class="tt-caln-subj">{{ l.subject.length > 4 ? l.subject.slice(0,4)+'…' : l.subject }}</span>
              </div>
              <div v-if="cell.lessons.length > 5" class="tt-caln-more">+{{ cell.lessons.length - 5 }}节</div>
            </div>
            <div v-else-if="cell.date && !cell.isWeekend" class="tt-caln-empty">休</div>
          </div>
        </div>

        <!-- Day Detail Popover -->
        <el-dialog v-model="dayDetailVisible" :title="`${dayDetailDate} · ${currentClass}班课表`" width="460px">
          <div v-if="dayDetailLessons.length" class="tt-day-detail-list">
            <div v-for="l in dayDetailLessons" :key="l.period" class="tt-day-detail-item">
              <span class="tt-day-detail-period" :style="{background: subjectColor(l.subject)}">{{ l.period }}</span>
              <div style="flex:1">
                <div style="font-weight:600;color:var(--admin-text);font-size:13px">{{ l.subject }}</div>
                <div style="font-size:11px;color:var(--admin-text-muted)">{{ l.teacher || '—' }} · {{ l.room || '—' }}</div>
              </div>
              <el-button size="small" text type="primary" @click="editCellFromDayDetail(l)">编辑</el-button>
            </div>
          </div>
          <div v-else style="text-align:center;padding:20px;color:var(--admin-text-muted)">当日无课程安排</div>
        </el-dialog>
      </div>
    </div>

    <!-- === IMAGE IMPORT VIEW === -->
      <div v-if="activeView === 'import'" class="tt-import-container">
        <!-- Step Indicator -->
        <div class="tt-import-steps">
          <div class="tt-import-step" :class="{ active: importStep === 1, done: importStep > 1 }">
            <span class="tt-step-num">1</span>
            <span class="tt-step-label">上传照片</span>
          </div>
          <div class="tt-step-line" :class="{ filled: importStep > 1 }"></div>
          <div class="tt-import-step" :class="{ active: importStep === 2, done: importStep > 2 }">
            <span class="tt-step-num">2</span>
            <span class="tt-step-label">调整网格</span>
          </div>
          <div class="tt-step-line" :class="{ filled: importStep > 2 }"></div>
          <div class="tt-import-step" :class="{ active: importStep === 3, done: importStep > 3 }">
            <span class="tt-step-num">3</span>
            <span class="tt-step-label">填写课程</span>
          </div>
          <div class="tt-step-line" :class="{ filled: importStep > 3 }"></div>
          <div class="tt-import-step" :class="{ active: importStep === 4 }">
            <span class="tt-step-num">4</span>
            <span class="tt-step-label">同步课表</span>
          </div>
        </div>

        <!-- Step 1: Upload Image -->
        <div v-if="importStep === 1" class="tt-import-upload">
          <div class="tt-upload-zone" :class="{ 'has-file': uploadedImage, dragging: isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput">
            <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="handleFileSelect" />
            <template v-if="!uploadedImage">
              <div class="tt-upload-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M4 34l10-8 6 5 10-12 14 15" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
                  <circle cx="16" cy="18" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
              </div>
              <div class="tt-upload-text">拖放课表照片到此处，或<span class="tt-upload-link">点击选择文件</span></div>
              <div class="tt-upload-hint">支持 JPG、PNG 格式，建议拍摄清晰的纸质课表</div>
            </template>
            <template v-else>
              <img :src="uploadedImage" class="tt-upload-preview" />
              <div class="tt-upload-overlay">
                <div class="tt-upload-change">点击更换照片</div>
              </div>
            </template>
          </div>
          <div v-if="uploadedImage" style="display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap">
            <el-button @click="clearImage">重新选择</el-button>
            <el-button type="warning" @click="runOCR" :loading="ocrLoading" :disabled="ocrLoading">
              {{ ocrLoading ? `识别中… ${ocrProgress}%` : '🤖 智能识别填充' }}
            </el-button>
            <el-button type="primary" @click="importStep = 2">下一步：调整网格 →</el-button>
          </div>
          <div v-if="ocrResult" style="margin-top:12px;padding:10px 14px;background:var(--admin-bg);border-radius:8px;font-size:11px;color:var(--admin-text-secondary);line-height:1.7">
            <strong>识别结果：</strong>检测到 <strong>{{ ocrResult.wordCount }}</strong> 个文字块。
            已自动匹配科目：<span v-for="s in ocrResult.matchedSubjects" :key="s" style="display:inline-block;margin:2px 4px;padding:1px 8px;background:var(--admin-surface);border-radius:4px;font-size:10px;color:var(--admin-accent)">{{ s }}</span>
            <div style="margin-top:6px;color:var(--admin-text-muted)">💡 点击下一步可调整匹配结果，手动微调后同步</div>
          </div>
        </div>

        <!-- Step 2: Configure Grid -->
        <div v-if="importStep === 2" class="tt-import-configure">
          <div class="tt-config-layout">
            <div class="tt-config-panel">
              <div class="tt-config-title">网格设置</div>
              <div class="admin-form-group">
                <label>包含星期</label>
                <div class="tt-weekday-toggles">
                  <button v-for="d in allWeekdays" :key="d.value"
                    class="tt-wd-toggle"
                    :class="{ active: importWeekdays.includes(d.value) }"
                    @click="toggleImportWeekday(d.value)">{{ d.label }}</button>
                </div>
              </div>
              <div class="admin-form-group">
                <label>每天节次数</label>
                <el-input-number v-model="importPeriodCount" :min="1" :max="10" size="small" style="width:100%" />
              </div>
              <div class="admin-form-group">
                <label>预览网格 ({{ importWeekdays.length }}天 × {{ importPeriodCount }}节)</label>
                <div class="tt-mini-grid">
                  <div v-for="p in importPeriodCount" :key="p" class="tt-mini-row">
                    <div class="tt-mini-period">{{ p }}</div>
                    <div v-for="d in importWeekdays" :key="d" class="tt-mini-cell"></div>
                  </div>
                </div>
              </div>
              <div class="admin-form-group">
                <label>🤖 智能模板自动填充</label>
                <el-select v-model="selectedTemplate" style="width:100%" size="small" placeholder="选择预设模板快速填充…" @change="applyTemplate" clearable>
                  <el-option v-for="t in timetableTemplates" :key="t.name" :label="`${t.name} (${t.cells}格)`" :value="t.name" />
                </el-select>
                <div style="font-size:10px;color:var(--admin-text-muted);margin-top:4px">选择模板后进入填写步骤，格子将自动预填科目</div>
              </div>
              <div style="display:flex;gap:10px;margin-top:16px">
                <el-button @click="importStep = 1">← 返回</el-button>
                <el-button type="primary" @click="startAssigning">下一步：填写课程 →</el-button>
              </div>
            </div>
            <div class="tt-config-preview">
              <div class="tt-config-title">课表照片</div>
              <div class="tt-image-viewer">
                <img :src="uploadedImage" class="tt-viewer-img" />
                <div class="tt-viewer-grid" v-if="importWeekdays.length > 0">
                  <div class="tt-viewer-grid-inner" :style="viewerGridStyle">
                    <div v-for="p in importPeriodCount" :key="p" class="tt-viewer-row">
                      <div v-for="d in importWeekdays" :key="d" class="tt-viewer-cell"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Assign Cells -->
        <div v-if="importStep === 3" class="tt-import-assign">
          <!-- Quick-Fill Bar -->
          <div class="tt-quickfill-bar">
            <div class="tt-qf-label">快速填充：</div>
            <div class="tt-qf-subject" :class="{ active: quickFillMode && quickFillSubject === s }"
              v-for="s in quickFillSubjects" :key="s"
              @click="toggleQuickFill(s)"
              :style="{ '--qf-color': subjectColor(s) }">
              {{ s.length > 4 ? s.slice(0,4) : s }}
            </div>
            <div class="tt-qf-sep"></div>
            <el-input v-model="quickFillTeacher" size="small" placeholder="教师" style="width:80px" />
            <el-input v-model="quickFillRoom" size="small" placeholder="教室" style="width:70px" />
            <el-button v-if="quickFillMode" size="small" type="warning" @click="quickFillMode = false">退出填充</el-button>
            <el-tooltip placement="bottom" effect="dark" :show-after="300">
              <template #content>
                <div style="font-size:12px;line-height:1.7;max-width:300px">
                  <strong>印章填充：</strong>选科目→点格子填入→再点清除<br/>
                  <strong>逐格编辑：</strong>退出填充后点击格子手动输入
                </div>
              </template>
              <span class="tt-qf-help">❓ 怎么用</span>
            </el-tooltip>
            <el-button v-if="quickFillMode" size="small" type="danger" @click="clearAllCells">全部清空</el-button>
            <div class="tt-qf-hint" v-if="quickFillMode">
              🖐️ 点击左侧图上格子即可填入 <strong>{{ quickFillSubject }}</strong>（再点同一格可清除）
            </div>
            <div class="tt-qf-hint" v-else>🖐️ 选科目色块激活印章模式，或点 ❓ 查看教程</div>
          </div>

          <div class="tt-assign-layout">
            <!-- Image with Interactive Grid -->
            <div class="tt-assign-image-panel">
              <div class="tt-config-title" style="margin-bottom:8px;display:flex;align-items:center;gap:8px">
                <span>📷 对照原图分配</span>
                <el-switch v-model="dimImage" size="small" active-text="淡化" inactive-text="显示" style="--el-switch-on-color:var(--admin-text-muted)" />
              </div>
              <div class="tt-image-viewer tt-image-viewer--interactive" :class="{ dimmed: dimImage }">
                <img :src="uploadedImage" class="tt-viewer-img tt-viewer-img--compact" />
                <div v-if="dimImage" class="tt-img-dim-overlay"></div>
                <div class="tt-viewer-grid">
                  <div class="tt-viewer-grid-inner" :style="viewerGridStyle">
                    <div v-for="(row, ri) in importPeriodCount" :key="ri" class="tt-viewer-row">
                      <div v-for="(col, ci) in importWeekdays.length" :key="ci"
                        class="tt-viewer-cell tt-assign-cell"
                        :class="{ filled: importCells[ri]?.[ci]?.subject, hoverable: quickFillMode }"
                        :style="importCells[ri]?.[ci]?.subject ? { '--cell-color': subjectColor(importCells[ri][ci].subject), background: subjectColor(importCells[ri][ci].subject) + '33', borderColor: subjectColor(importCells[ri][ci].subject) } : {}"
                        @click="handleCellClick(ri, ci)">
                        <template v-if="importCells[ri]?.[ci]?.subject">
                          <span class="tt-ac-subject">{{ importCells[ri][ci].subject.length > 3 ? importCells[ri][ci].subject.slice(0,3) : importCells[ri][ci].subject }}</span>
                          <span class="tt-ac-teacher">{{ importCells[ri][ci].teacher || '—' }}</span>
                        </template>
                        <span v-else class="tt-ac-empty">{{ quickFillMode ? '' : '+' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timetable Preview -->
            <div class="tt-assign-preview-panel">
              <div class="tt-config-title" style="margin-bottom:10px">📋 课表预览</div>
              <div class="tt-preview-table">
                <div class="tt-pt-header">
                  <div class="tt-pt-corner">节次</div>
                  <div v-for="d in importWeekdays" :key="d" class="tt-pt-day">
                    {{ allWeekdays.find(w => w.value === d)?.label }}
                  </div>
                </div>
                <div v-for="(row, ri) in importPeriodCount" :key="ri" class="tt-pt-row">
                  <div class="tt-pt-period">第{{ ri + 1 }}节</div>
                  <div v-for="(col, ci) in importWeekdays.length" :key="ci"
                    class="tt-pt-cell"
                    :class="{ filled: importCells[ri]?.[ci]?.subject }"
                    :style="importCells[ri]?.[ci]?.subject ? { '--cell-color': subjectColor(importCells[ri][ci].subject) } : {}">
                    <template v-if="importCells[ri]?.[ci]?.subject">
                      <span class="tt-pt-subject">{{ importCells[ri][ci].subject }}</span>
                      <span class="tt-pt-teacher">{{ importCells[ri][ci].teacher || '' }}</span>
                    </template>
                    <span v-else class="tt-pt-empty">—</span>
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:10px;margin-top:14px">
                <el-button @click="importStep = 2">← 返回调整</el-button>
                <el-button type="primary" @click="importStep = 4" :disabled="filledCellCount === 0">
                  预览并同步 ({{ filledCellCount }}/{{ importWeekdays.length * importPeriodCount }})
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Review & Sync -->
        <div v-if="importStep === 4" class="tt-import-sync">
          <div class="tt-sync-layout">
            <div class="tt-sync-main">
              <div class="tt-config-title">✅ 最终确认 · {{ currentClass }}班 周课表</div>
              <!-- Full timetable preview -->
              <div class="tt-grid" style="margin-top:12px">
                <div class="tt-grid-header">
                  <div class="tt-corner">节次</div>
                  <div v-for="d in importWeekdays" :key="d" class="tt-day-header">{{ allWeekdays.find(w => w.value === d)?.label }}</div>
                </div>
                <div v-for="(row, ri) in importPeriodCount" :key="ri" class="tt-grid-row">
                  <div class="tt-period-cell">
                    <div>第{{ ri + 1 }}节</div>
                  </div>
                  <div v-for="(col, ci) in importWeekdays.length" :key="ci"
                    class="tt-lesson-cell"
                    :class="{ 'has-lesson': importCells[ri]?.[ci]?.subject }"
                    :style="importCells[ri]?.[ci]?.subject ? { '--cell-color': subjectColor(importCells[ri][ci].subject) } : {}">
                    <template v-if="importCells[ri]?.[ci]?.subject">
                      <div class="tt-cell-subject">{{ importCells[ri][ci].subject }}</div>
                      <div class="tt-cell-teacher">{{ importCells[ri][ci].teacher || '—' }}</div>
                      <div class="tt-cell-room">{{ importCells[ri][ci].room || '' }}</div>
                    </template>
                    <div v-else class="tt-cell-empty">—</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="tt-sync-sidebar">
              <div class="tt-config-title">同步选项</div>
              <div class="admin-form-group">
                <label>目标班级</label>
                <el-select v-model="syncTargetClass" style="width:100%" size="small">
                  <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
                </el-select>
              </div>
              <div class="tt-sync-strategy">
                <label style="font-size:12px;font-weight:600;color:var(--admin-text);display:block;margin-bottom:8px">同步策略</label>
                <el-radio-group v-model="syncStrategy" size="small" style="display:flex;flex-direction:column;gap:6px">
                  <el-radio value="replace" border>替换 — 清空旧课表后写入新课表</el-radio>
                  <el-radio value="merge" border>合并 — 覆盖冲突时段，保留其余课程</el-radio>
                </el-radio-group>
              </div>
              <div class="tt-sync-summary">
                <div class="tt-sync-stat">
                  <span class="tt-sync-num">{{ filledCellCount }}</span>
                  <span class="tt-sync-label">已填课程</span>
                </div>
                <div class="tt-sync-stat">
                  <span class="tt-sync-num">{{ importWeekdays.length * importPeriodCount - filledCellCount }}</span>
                  <span class="tt-sync-label">空格时段</span>
                </div>
              </div>
              <div style="display:flex;gap:10px;margin-top:14px">
                <el-button @click="importStep = 3" size="small">← 返回修改</el-button>
                <el-button type="primary" size="small" @click="syncToTimetable" :disabled="filledCellCount === 0">
                  🔄 同步到电子课表
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Add/Edit Lesson Dialog -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑课程' : '添加课程'" width="480px">
      <div class="admin-form-group">
        <label>星期 <span style="color:var(--admin-danger)">*</span></label>
        <el-select v-model="lessonForm.weekday" style="width:100%">
          <el-option v-for="d in allWeekdays" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>节次 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="lessonForm.period" style="width:100%">
            <el-option v-for="p in periods" :key="p.id" :label="p.label" :value="p.id" />
          </el-select>
        </div>
        <div class="admin-form-group">
          <label>科目 <span style="color:var(--admin-danger)">*</span></label>
          <el-select v-model="lessonForm.subject" style="width:100%">
            <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
      </div>
      <div class="admin-two-col" style="margin-bottom:0">
        <div class="admin-form-group">
          <label>教师</label>
          <el-input v-model="lessonForm.teacher" placeholder="教师姓名" />
        </div>
        <div class="admin-form-group">
          <label>教室</label>
          <el-input v-model="lessonForm.room" placeholder="教室编号" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>教室位置</label>
        <el-input v-model="lessonForm.location" placeholder="如：教学楼5层501室" />
      </div>
      <div class="admin-form-group">
        <label>格子背景色</label>
        <div style="display:flex;gap:8px;align-items:center">
          <el-color-picker v-model="lessonForm.bgColor" size="small" show-alpha />
          <el-input v-model="lessonForm.bgColor" placeholder="#hex 或 transparent" size="small" style="flex:1" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>格子背景图URL</label>
        <el-input v-model="lessonForm.bgImage" placeholder="https://... 或留空" size="small" />
        <div style="font-size:10px;color:var(--admin-text-muted);margin-top:4px">设置背景后文字会自动适配对比度，确保清晰可读</div>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="editingId" size="small" type="danger" @click="deleteLesson" style="margin-right:auto">删除</el-button>
        <el-button type="primary" @click="saveLesson">{{ editingId ? '保存修改' : '添加课程' }}</el-button>
      </template>
    </el-dialog>

    <!-- Batch Assign Dialog -->
    <el-dialog v-model="batchDialogVisible" title="📋 批量分配课表" width="560px">
      <div class="admin-form-group">
        <label>选择教师</label>
        <el-input v-model="batchForm.teacher" placeholder="教师姓名" />
      </div>
      <div class="admin-form-group">
        <label>选择科目 <span style="color:var(--admin-danger)">*</span></label>
        <el-select v-model="batchForm.subject" style="width:100%">
          <el-option v-for="s in subjectList" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
      <div class="admin-form-group">
        <label>选择教室</label>
        <el-input v-model="batchForm.room" placeholder="教室编号" />
      </div>
      <div class="admin-form-group">
        <label>教室位置</label>
        <el-input v-model="batchForm.location" placeholder="如：教学楼5层501室" />
      </div>
      <div class="admin-form-group">
        <label>点击格子选择要分配的节次（可多选）</label>
        <div class="tt-batch-grid">
          <div class="tt-batch-header">
            <div></div>
            <div v-for="d in activeWeekdays" :key="d.value" class="tt-batch-day">{{ d.label }}</div>
          </div>
          <div v-for="p in periods" :key="p.id" class="tt-batch-row">
            <div class="tt-batch-period">{{ p.label }}</div>
            <div v-for="d in activeWeekdays" :key="d.value" class="tt-batch-cell" :class="{ selected: isBatchSelected(d.value, p.id), occupied: getSchedule(d.value, p.id) }" @click="toggleBatchCell(d.value, p.id)"></div>
          </div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--admin-text-muted);background:var(--admin-bg);padding:8px;border-radius:6px">
        💡 已选 {{ batchForm.cells.length }} 个时段。已有课程的格子将跳过，不会覆盖。
      </div>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatch">批量创建（{{ batchForm.cells.length }}个）</el-button>
      </template>
    </el-dialog>

    <!-- Print Dialog -->
    <el-dialog v-model="showPrintDialog" title="打印课表" width="460px">
      <div class="admin-form-group">
        <label>打印标题</label>
        <el-input v-model="printTitle" placeholder="如：威学一百 · 5D班课表" />
      </div>
      <div class="admin-form-group">
        <label>打印班级</label>
        <el-select v-model="printClass" style="width:100%">
          <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
        </el-select>
      </div>
      <div class="admin-form-group">
        <label>打印月份</label>
        <el-select v-model="printMonth" style="width:100%">
          <el-option v-for="m in monthOptions" :key="m.value" :label="m.label" :value="m.value" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="showPrintDialog = false">取消</el-button>
        <el-button type="primary" @click="doPrint">🖨️ 打印</el-button>
      </template>
    </el-dialog>

    <!-- Time Settings Dialog -->
    <el-dialog v-model="showTimeDialog" title="⏰ 节次时间设置" width="520px">
      <div style="font-size:12px;color:var(--admin-text-muted);margin-bottom:12px">自定义每节课的起止时间，修改后课表和打印均使用新时间</div>
      <div v-for="(p, idx) in customPeriods" :key="idx" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <span style="width:70px;font-size:12px;color:var(--admin-text);white-space:nowrap">第{{ idx + 1 }}节</span>
        <el-time-picker v-model="p.start" format="HH:mm" value-format="HH:mm" placeholder="开始" size="small" style="flex:1" />
        <span style="color:var(--admin-text-muted)">—</span>
        <el-time-picker v-model="p.end" format="HH:mm" value-format="HH:mm" placeholder="结束" size="small" style="flex:1" />
        <el-input v-model="p.label" placeholder="标签" size="small" style="width:100px" />
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <el-button size="small" @click="addPeriod">+ 增加节次</el-button>
        <el-button size="small" @click="removePeriod" :disabled="customPeriods.length <= 1">- 移除末节</el-button>
        <el-button size="small" @click="resetPeriods" style="margin-left:auto">恢复默认</el-button>
      </div>
      <template #footer>
        <el-button @click="showTimeDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTimeSettings">保存时间设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { timetableService, weeklyScheduleService, courseService, studentService } from '@/services/dataService'
import { useAppStore } from '@/stores/app'
import { getWatermarkHTML, getWatermarkStyle, buildExportHTML } from '@/utils/watermark'
import { createWorker } from 'tesseract.js'

const store = useAppStore()
const currentClass = ref('5D')
const currentMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
const activeView = ref('week')
const showWeekend = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const batchDialogVisible = ref(false)
const showPrintDialog = ref(false)
const printTitle = ref('')
const printClass = ref('5D')
const printMonth = ref('2026-05')
const highlightTeacher = ref(null)
const monthOffset = ref(0)

// --- Image Import State ---
const importStep = ref(1)
const fileInput = ref(null)
const uploadedImage = ref(null)
const isDragging = ref(false)
const importWeekdays = ref([1, 2, 3, 4, 5])
const importPeriodCount = ref(7)
const importCells = ref([])       // importCells[row][col] = { subject, teacher, room }
const quickFillMode = ref(false)
const quickFillSubject = ref('')
const quickFillTeacher = ref('')
const quickFillRoom = ref('')
const syncTargetClass = ref('')
const syncStrategy = ref('replace')
const selectedTemplate = ref('')
const dimImage = ref(false)

// --- OCR State ---
const ocrLoading = ref(false)
const ocrProgress = ref(0)
const ocrResult = ref(null)
const ocrMatchedCells = ref([]) // [{rowIdx, colIdx, subject}] from OCR

// --- Smart Timetable Templates ---
const timetableTemplates = [
  {
    name: 'DSE理科标准',
    cells: 25,
    pattern: {
      // weekday -> { period -> subject }
      1: { 1: '数学', 2: '中国语文', 3: '英国语文', 4: '物理', 5: '化学', 6: '公民与社会发展' },
      2: { 1: '数学', 2: '英国语文', 3: '中国语文', 4: '化学', 5: '物理', 6: '体育' },
      3: { 1: '英国语文', 2: '数学', 3: '物理', 4: '中国语文', 5: '经济', 6: '资讯及通讯科技' },
      4: { 1: '中国语文', 2: '数学', 3: '英国语文', 4: '物理', 5: '化学', 6: '视觉艺术' },
      5: { 1: '英国语文', 2: '中国语文', 3: '数学', 4: '经济', 5: '体育', 6: '化学' }
    }
  },
  {
    name: 'DSE文科标准',
    cells: 25,
    pattern: {
      1: { 1: '中国语文', 2: '英国语文', 3: '数学', 4: '历史', 5: '地理', 6: '公民与社会发展' },
      2: { 1: '英国语文', 2: '中国语文', 3: '数学', 4: '地理', 5: '历史', 6: '体育' },
      3: { 1: '数学', 2: '英国语文', 3: '中国语文', 4: '经济', 5: '企业、会计与财务概论', 6: '资讯及通讯科技' },
      4: { 1: '中国语文', 2: '数学', 3: '英国语文', 4: '历史', 5: '地理', 6: '视觉艺术' },
      5: { 1: '英国语文', 2: '中国语文', 3: '数学', 4: '经济', 5: '体育', 6: '音乐' }
    }
  },
  {
    name: '英语强化班',
    cells: 20,
    pattern: {
      1: { 1: 'English Reading', 2: '数学', 3: '中国语文', 4: 'English Writing', 5: '物理', 6: '公民与社会发展' },
      2: { 1: 'English Listening', 2: 'English Speaking', 3: '数学', 4: '中国语文', 5: '化学', 6: '体育' },
      3: { 1: 'English Reading', 2: '数学', 3: 'English Writing', 4: '中国语文', 5: '经济', 6: '资讯及通讯科技' },
      4: { 1: 'English Listening', 2: '数学', 3: '中国语文', 4: 'English Reading', 5: '化学', 6: '视觉艺术' },
      5: { 1: 'English Speaking', 2: '中国语文', 3: '数学', 4: 'English Writing', 5: '体育', 6: '物理' }
    }
  }
]

// --- Time Settings ---
const showTimeDialog = ref(false)
const defaultPeriods = [
  { start: '08:00', end: '08:45', label: '第一节' },
  { start: '08:55', end: '09:40', label: '第二节' },
  { start: '10:00', end: '10:45', label: '第三节' },
  { start: '10:55', end: '11:40', label: '第四节' },
  { start: '13:30', end: '14:15', label: '第五节' },
  { start: '14:25', end: '15:10', label: '第六节' },
  { start: '15:20', end: '16:05', label: '第七节' }
]
const customPeriods = ref(JSON.parse(JSON.stringify(defaultPeriods)))

function addPeriod() {
  const last = customPeriods.value[customPeriods.value.length - 1]
  customPeriods.value.push({
    start: last?.end || '16:00',
    end: last?.end ? addMinutes(last.end, 45) : '16:45',
    label: `第${customPeriods.value.length + 1}节`
  })
}

function removePeriod() {
  if (customPeriods.value.length > 1) customPeriods.value.pop()
}

function resetPeriods() {
  customPeriods.value = JSON.parse(JSON.stringify(defaultPeriods))
}

function saveTimeSettings() {
  showTimeDialog.value = false
  loadAll()
  ElMessage.success('节次时间已保存')
}

function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(2024, 0, 1, h, m + mins)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const today = new Date().toISOString().split('T')[0]
const allWeekdays = [
  { label: '周一', value: 1 }, { label: '周二', value: 2 }, { label: '周三', value: 3 },
  { label: '周四', value: 4 }, { label: '周五', value: 5 },
  { label: '周六', value: 6 }, { label: '周日', value: 7 }
]

const periods = computed(() => customPeriods.value.map((p, i) => ({
  id: i + 1,
  label: p.label || `第${i + 1}节`,
  time: `${p.start || '08:00'}-${p.end || '08:45'}`
})))

const viewTabs = [
  { key: 'week', label: '📅 周课表' },
  { key: 'month', label: '🗓️ 月视图' },
  { key: 'import', label: '📷 图片导入' }
]

// Subject colors
const subjectColors = {
  '数学': '#3b82f6', '中国语文': '#22c55e', '英国语文': '#8b5cf6',
  'English Reading': '#8b5cf6', 'English Writing': '#8b5cf6', 'English Listening': '#8b5cf6', 'English Speaking': '#8b5cf6',
  '物理': '#f59e0b', '化学': '#ef4444', '生物': '#10b981', '历史': '#78716c',
  '地理': '#06b6d4', '经济': '#f97316', '资讯及通讯科技': '#6366f1',
  '企业、会计与财务概论': '#14b8a6', '视觉艺术': '#ec4899', '体育': '#84cc16', '音乐': '#a855f7',
  '公民与社会发展': '#64748b'
}
function subjectColor(s) { return subjectColors[s] || 'var(--admin-accent)' }

const weeklySchedules = ref([])
const monthLessons = ref([])
const classList = computed(() => studentService.getClasses())
const subjectList = computed(() => courseService.getEnabled().map(c => c.name))

const currentMonthLabel = computed(() => {
  const [y, m] = currentMonth.value.split('-')
  return `${y}年${parseInt(m)}月`
})

const isCurrentMonth = computed(() => {
  const now = new Date()
  const [y, m] = currentMonth.value.split('-').map(Number)
  return y === now.getFullYear() && m === now.getMonth() + 1
})

const monthOptions = computed(() => {
  const now = new Date()
  const options = []
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`
    options.push({ value, label })
  }
  return options
})

const activeWeekdays = computed(() => {
  if (showWeekend.value) return allWeekdays
  return allWeekdays.filter(d => d.value <= 5)
})

const teacherSummary = computed(() => weeklyScheduleService.getTeacherSummary(currentClass.value))

const lessonForm = ref({ weekday: 1, period: 1, subject: '数学', teacher: '', room: '', location: '', bgColor: '', bgImage: '' })

const batchForm = ref({ teacher: '', subject: '数学', room: '', location: '', cells: [] })

function getSchedule(weekday, period) {
  return weeklySchedules.value.find(w => w.weekday === weekday && w.period === period) || null
}

function cellBackgroundStyle(sched) {
  if (!sched) return {}
  const style = {}
  if (sched.bgImage) {
    style.backgroundImage = `url(${sched.bgImage})`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
  }
  if (sched.bgColor) {
    style.backgroundColor = sched.bgColor
  }
  return style
}

function cellTextStyle(sched) {
  if (!sched) return {}
  const bg = sched.bgColor || ''
  const img = sched.bgImage || ''
  // If there's a background image or dark color, add text-shadow for readability
  if (img || (bg && isDarkColor(bg))) {
    return {
      textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 0 6px rgba(0,0,0,0.5)',
      color: '#fff'
    }
  }
  if (bg && !isDarkColor(bg)) {
    return { color: '#1e180e' }
  }
  return {}
}

function isDarkColor(hex) {
  if (!hex || hex === 'transparent') return false
  const c = hex.replace('#', '')
  if (c.length < 6) return false
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  // Weighted luminance
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128
}

function loadAll() {
  weeklySchedules.value = weeklyScheduleService.getByClass(currentClass.value)
  loadMonthLessons()
}

function loadMonthLessons() {
  monthLessons.value = timetableService.getByClassAndMonth(currentClass.value, currentMonth.value)
}

function onMonthChange() {
  loadMonthLessons()
}

function editCell(weekday, period) {
  const existing = getSchedule(weekday, period)
  if (existing) {
    editingId.value = existing.id
    lessonForm.value = { weekday: existing.weekday, period: existing.period, subject: existing.subject, teacher: existing.teacher || '', room: existing.room || '', location: existing.location || '', bgColor: existing.bgColor || '', bgImage: existing.bgImage || '' }
  } else {
    editingId.value = null
    lessonForm.value = { weekday, period, subject: '数学', teacher: '', room: '', location: '', bgColor: '', bgImage: '' }
  }
  dialogVisible.value = true
}

function saveLesson() {
  if (!lessonForm.value.subject) { ElMessage.warning('请选择科目'); return }
  const data = { ...lessonForm.value, class: currentClass.value }
  // Persist bgColor / bgImage as part of the weekly schedule data
  if (editingId.value) {
    weeklyScheduleService.update(editingId.value, data)
    ElMessage.success('课程已更新')
  } else {
    weeklyScheduleService.create(data)
    ElMessage.success('课程已添加')
  }
  dialogVisible.value = false
  loadAll()
}

async function deleteLesson() {
  try {
    await ElMessageBox.confirm('确定删除此课程吗？', '确认删除', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    weeklyScheduleService.delete(editingId.value)
    dialogVisible.value = false
    loadAll()
    ElMessage.success('课程已删除')
  } catch {}
}

// Batch assign
function openBatchDialog() {
  batchForm.value = { teacher: '', subject: '数学', room: '', location: '', cells: [] }
  batchDialogVisible.value = true
}

function isBatchSelected(weekday, period) {
  return batchForm.value.cells.some(c => c[0] === weekday && c[1] === period)
}

function toggleBatchCell(weekday, period) {
  const idx = batchForm.value.cells.findIndex(c => c[0] === weekday && c[1] === period)
  if (idx === -1) {
    batchForm.value.cells.push([weekday, period])
  } else {
    batchForm.value.cells.splice(idx, 1)
  }
}

function saveBatch() {
  if (!batchForm.value.subject) { ElMessage.warning('请选择科目'); return }
  if (batchForm.value.cells.length === 0) { ElMessage.warning('请至少选择一个时段'); return }

  let created = 0, skipped = 0
  batchForm.value.cells.forEach(([weekday, period]) => {
    const exists = weeklySchedules.value.find(w => w.weekday === weekday && w.period === period)
    if (exists) { skipped++; return }
    weeklyScheduleService.create({
      class: currentClass.value, weekday, period,
      subject: batchForm.value.subject,
      teacher: batchForm.value.teacher,
      room: batchForm.value.room,
      location: batchForm.value.location
    })
    created++
  })

  batchDialogVisible.value = false
  loadAll()
  ElMessage.success(`分配完成：新增 ${created} 条，跳过 ${skipped} 条已存在`)
}

// Apply weekly schedule to current month
function applyToCurrentMonth() {
  weeklyScheduleService.generateMonth(currentClass.value, currentMonth.value)
  loadMonthLessons()
  ElMessage.success(`已将周课表应用到 ${currentMonthLabel.value}`)
}

// Month view navigation
const monthYear = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() + monthOffset.value)
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
})

const dayHeaders = ['日', '一', '二', '三', '四', '五', '六']

const monthCells = computed(() => {
  const base = new Date()
  base.setMonth(base.getMonth() + monthOffset.value)
  const year = base.getFullYear()
  const month = base.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ label: '', date: null, inMonth: false, isWeekend: false, lessons: [], key: `empty-${i}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month, d).getDay()
    cells.push({
      label: d, date, inMonth: true, isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      lessons: monthLessons.value.filter(l => l.day === date).sort((a, b) => a.period - b.period),
      key: date
    })
  }
  return cells
})

function changeMonth(delta) { monthOffset.value += delta }

// Day detail for month view
const dayDetailVisible = ref(false)
const dayDetailDate = ref('')
const dayDetailLessons = ref([])

function openDayDetail(cell) {
  dayDetailDate.value = cell.date
  dayDetailLessons.value = cell.lessons
  dayDetailVisible.value = true
}

function editCellFromDayDetail(lesson) {
  dayDetailVisible.value = false
  // Find the weekday from the date
  const d = new Date(dayDetailDate.value)
  const weekday = d.getDay() === 0 ? 7 : d.getDay()
  editCell(weekday, lesson.period)
}

// --- Image Import Logic ---
const quickFillSubjects = computed(() => subjectList.value)

const filledCellCount = computed(() => {
  let count = 0
  importCells.value.forEach(row => row.forEach(cell => { if (cell?.subject) count++ }))
  return count
})

const viewerGridStyle = computed(() => {
  const cols = importWeekdays.value.length
  const rows = importPeriodCount.value
  if (cols === 0) return {}
  return {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`
  }
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function processFile(file) {
  if (!file.type.match(/image\/(jpeg|png|webp)/)) {
    ElMessage.warning('请选择 JPG 或 PNG 格式的图片')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function clearImage() {
  uploadedImage.value = null
  importCells.value = []
  quickFillMode.value = false
  ocrResult.value = null
  ocrMatchedCells.value = []
}

async function runOCR() {
  if (!uploadedImage.value) { ElMessage.warning('请先上传课表图片'); return }

  ocrLoading.value = true
  ocrProgress.value = 0
  ocrResult.value = null
  ocrMatchedCells.value = []

  try {
    const worker = await createWorker('chi_sim+eng', 1, {
      logger: m => { if (m.status === 'recognizing text') ocrProgress.value = Math.round(m.progress * 100) }
    })

    const { data } = await worker.recognize(uploadedImage.value)
    await worker.terminate()

    // Parse recognized text
    const allText = data.text
    const words = allText.split(/[\n\r\s,，、]+/).filter(w => w.length >= 1)
    const availableSubjects = subjectList.value

    // Match words against known subjects (fuzzy match)
    const matched = []
    const wordSet = new Set()
    words.forEach(w => {
      availableSubjects.forEach(subj => {
        if (w.includes(subj) || subj.includes(w) || similarity(w, subj) > 0.6) {
          if (!wordSet.has(subj)) {
            matched.push(subj)
            wordSet.add(subj)
          }
        }
      })
    })

    // Also look for 2-char short forms
    const shortMap = { '中':'中国语文', '英':'英国语文', '数':'数学', '物':'物理', '化':'化学', '生':'生物', '史':'历史', '地':'地理', '经':'经济', '体':'体育', '音':'音乐', '美':'视觉艺术' }
    words.forEach(w => {
      if (shortMap[w] && !wordSet.has(shortMap[w])) {
        matched.push(shortMap[w])
        wordSet.add(shortMap[w])
      }
    })

    ocrResult.value = {
      wordCount: words.length,
      matchedSubjects: matched.slice(0, 12),
      rawText: allText.slice(0, 500)
    }

    // Try to auto-fill: if matched subjects and we can guess their positions
    // Set importWeekdays to Mon-Fri, periods to 6 as default
    if (matched.length > 0) {
      importWeekdays.value = [1, 2, 3, 4, 5]
      importPeriodCount.value = Math.min(7, Math.max(4, Math.ceil(matched.length / 5)))
      // Map matched subjects into a rough grid (by frequency)
      ocrMatchedCells.value = matched.map((s, i) => ({
        rowIdx: Math.floor(i / importWeekdays.value.length) % importPeriodCount.value,
        colIdx: i % importWeekdays.value.length,
        subject: s
      }))
    }

    // Auto-advance to step 2
    importStep.value = 2
    ElMessage.success(`识别完成！检测到 ${matched.length} 个科目，请调整网格后自动预填`)
  } catch (e) {
    ElMessage.error('OCR识别失败，请确保图片清晰后重试')
    console.error('OCR error:', e)
  } finally {
    ocrLoading.value = false
    ocrProgress.value = 0
  }
}

function similarity(a, b) {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  if (longer.length === 0) return 1.0
  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++
  }
  return matches / longer.length
}

function toggleImportWeekday(val) {
  const idx = importWeekdays.value.indexOf(val)
  if (idx === -1) {
    const sorted = [...importWeekdays.value, val].sort((a, b) => a - b)
    importWeekdays.value = sorted
  } else if (importWeekdays.value.length > 1) {
    importWeekdays.value = importWeekdays.value.filter(v => v !== val)
  }
}

function applyTemplate() {
  if (!selectedTemplate.value) return
  const tpl = timetableTemplates.find(t => t.name === selectedTemplate.value)
  if (!tpl) return
  // Pre-fill importWeekdays to match template (default Mon-Fri)
  importWeekdays.value = [1, 2, 3, 4, 5]
  importPeriodCount.value = 6
  ElMessage.success(`已选择模板"${tpl.name}"，进入下一步将自动预填`)
}

function startAssigning() {
  // Initialize cells grid
  importCells.value = Array.from({ length: importPeriodCount.value }, () =>
    Array.from({ length: importWeekdays.value.length }, () => ({ subject: '', teacher: '', room: '' }))
  )

  // Apply template if selected (takes priority over OCR)
  if (selectedTemplate.value) {
    const tpl = timetableTemplates.find(t => t.name === selectedTemplate.value)
    if (tpl) {
      importWeekdays.value.forEach((wd, ci) => {
        const dayPattern = tpl.pattern[wd]
        if (!dayPattern) return
        for (let ri = 0; ri < Math.min(importPeriodCount.value, 7); ri++) {
          const subject = dayPattern[ri + 1]
          if (subject && importCells.value[ri]?.[ci]) {
            importCells.value[ri][ci] = { subject, teacher: '', room: '' }
          }
        }
      })
      ElMessage.success(`模板"${tpl.name}"已预填 ${Object.values(tpl.pattern).reduce((s, d) => s + Object.keys(d).length, 0)} 个格子，请微调后同步`)
    }
  } else if (ocrMatchedCells.value.length > 0) {
    // Apply OCR-matched cells
    ocrMatchedCells.value.forEach(({ rowIdx, colIdx, subject }) => {
      if (rowIdx < importPeriodCount.value && colIdx < importWeekdays.value.length && importCells.value[rowIdx]?.[colIdx]) {
        importCells.value[rowIdx][colIdx] = { subject, teacher: '', room: '' }
      }
    })
    ElMessage.success(`智能识别已预填 ${ocrMatchedCells.value.length} 个格子，请手动微调后同步`)
  }

  quickFillSubject.value = subjectList.value[0] || ''
  quickFillMode.value = true
  importStep.value = 3
}

function handleCellClick(rowIdx, colIdx) {
  if (quickFillMode.value && quickFillSubject.value) {
    // Quick fill mode: stamp the selected subject
    const cell = importCells.value[rowIdx]?.[colIdx]
    if (!cell) return
    if (cell.subject === quickFillSubject.value) {
      // Clicking same subject clears it
      cell.subject = ''
      cell.teacher = ''
      cell.room = ''
    } else {
      cell.subject = quickFillSubject.value
      cell.teacher = quickFillTeacher.value
      cell.room = quickFillRoom.value
    }
  } else {
    // Edit mode: open inline mini-editor via prompt-style interaction
    openCellEditor(rowIdx, colIdx)
  }
}

function toggleQuickFill(subject) {
  if (quickFillMode.value && quickFillSubject.value === subject) {
    quickFillMode.value = false
  } else {
    quickFillMode.value = true
    quickFillSubject.value = subject
  }
}

function openCellEditor(ri, ci) {
  const cell = importCells.value[ri]?.[ci]
  if (!cell) return
  ElMessageBox.prompt('编辑课程信息', `第${ri + 1}节 · ${allWeekdays.find(w => w.value === importWeekdays.value[ci])?.label}`, {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: cell.subject,
    inputPlaceholder: '科目名称',
    inputValidator: (val) => val ? true : '请输入科目名称',
    inputErrorMessage: '科目名称不能为空'
  }).then(({ value: subject }) => {
    cell.subject = subject
    ElMessageBox.prompt('教师 & 教室', `设置第${ri + 1}节 ${subject}`, {
      confirmButtonText: '保存',
      cancelButtonText: '跳过',
      inputValue: [cell.teacher, cell.room].filter(Boolean).join(' · '),
      inputPlaceholder: '如：张老师 · 501室'
    }).then(({ value: detail }) => {
      const parts = detail.split(/[·,，、\s]+/).filter(Boolean)
      cell.teacher = parts[0] || ''
      cell.room = parts[1] || ''
    }).catch(() => {})
  }).catch(() => {})
}

function clearAllCells() {
  importCells.value.forEach(row => row.forEach(cell => {
    cell.subject = ''
    cell.teacher = ''
    cell.room = ''
  }))
}

function syncToTimetable() {
  const targetClass = syncTargetClass.value || currentClass.value
  const colWeekdayMap = importWeekdays.value

  // Build new schedules from import cells
  const newSchedules = []
  importCells.value.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      if (cell.subject) {
        newSchedules.push({
          class: targetClass,
          weekday: colWeekdayMap[ci],
          period: ri + 1,
          subject: cell.subject,
          teacher: cell.teacher,
          room: cell.room,
          location: ''
        })
      }
    })
  })

  if (syncStrategy.value === 'replace') {
    // Remove all existing schedules for the target class
    const allSchedules = weeklyScheduleService.getAll()
    allSchedules.forEach(s => {
      if (s.class === targetClass) weeklyScheduleService.delete(s.id)
    })
  } else {
    // Merge: remove only conflicting cells
    const allSchedules = weeklyScheduleService.getAll()
    allSchedules.forEach(s => {
      if (s.class === targetClass) {
        const conflict = newSchedules.find(ns =>
          ns.weekday === s.weekday && ns.period === s.period
        )
        if (conflict) weeklyScheduleService.delete(s.id)
      }
    })
  }

  // Create new entries
  newSchedules.forEach(s => weeklyScheduleService.create(s))

  // Reload
  loadAll()
  ElMessage.success(`课表已同步！共导入 ${newSchedules.length} 条课程到 ${targetClass}班`)
  importStep.value = 1
  activeView.value = 'week'
}

// Print
function doPrint() {
  printTitle.value = printTitle.value || `${store.schoolName} · ${currentMonthLabel.value} · ${printClass.value}班课表`
  const printSchedules = weeklyScheduleService.getByClass(printClass.value)
  const weekdays = showWeekend.value ? allWeekdays : allWeekdays.filter(d => d.value <= 5)

  let tableRows = ''
  periods.value.forEach(p => {
    tableRows += '<tr>'
    tableRows += `<td class="period">${p.label}<br/><span class="ptime">${p.time}</span></td>`
    weekdays.forEach(d => {
      const sched = printSchedules.find(w => w.weekday === d.value && w.period === p.id)
      if (sched) {
        tableRows += `<td><div class="subject">${sched.subject}</div><div class="teacher">${sched.teacher || '—'}</div><div class="room">${sched.room || ''}${sched.location ? ' · ' + sched.location : ''}</div></td>`
      } else {
        tableRows += '<td class="empty">—</td>'
      }
    })
    tableRows += '</tr>'
  })

  const weekHeaders = weekdays.map(d => `<th>${d.label}</th>`).join('')
  const bodyContent = `
    <h1>${printTitle.value}</h1>
    <div class="subtitle">${printClass.value}班 · 打印日期：${today}</div>
    <table><thead><tr><th>节次</th>${weekHeaders}</tr></thead><tbody>${tableRows}</tbody></table>
  `

  const extraCSS = `
    body { font-family: 'PingFang SC','Microsoft YaHei',sans-serif; margin: 20px; color: #2c2416; }
    h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 13px; color: #888; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th,td { border: 1px solid #ccc; padding: 6px 8px; text-align: center; vertical-align: top; }
    th { background: #f5f0e8; font-weight: 600; }
    .period { background: #faf7f2; font-weight: 500; width: 80px; }
    .ptime { font-size: 10px; color: #999; }
    .subject { font-weight: 600; }
    .teacher { font-size: 10px; color: #8b5e3c; }
    .room { font-size: 10px; color: #999; }
    .empty { color: #ddd; }
    @page { size: A4 landscape; margin: 12mm; }
    @media print { body { margin: 0; } }
  `

  const html = buildExportHTML(printTitle.value, bodyContent, extraCSS)

  // Use Blob URL for reliable popup printing
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  if (!w) {
    ElMessage.warning('打印窗口被拦截，请允许弹出窗口后重试')
    return
  }
  w.onload = () => {
    w.focus()
    w.print()
    URL.revokeObjectURL(url)
  }
}

onMounted(() => {
  loadAll()
  printClass.value = currentClass.value
  printMonth.value = currentMonth.value
})
</script>

<style scoped>
.tt-view-tab { padding: 5px 18px; border: 1px solid var(--admin-border); background: var(--admin-surface); border-radius: 20px; font-size: 12px; cursor: pointer; color: var(--admin-text-muted); transition: all 0.2s; }
.tt-view-tab.active { background: var(--admin-primary); color: #fff; border-color: var(--admin-primary); }

/* Week layout */
.tt-week-layout { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
.tt-teacher-panel { background: var(--admin-bg); border-radius: 10px; padding: 12px; max-height: 520px; overflow-y: auto; }
.tt-panel-title { font-size: 12px; font-weight: 600; color: var(--admin-text); margin-bottom: 10px; }
.tt-teacher-row { padding: 8px 10px; border-radius: 6px; cursor: pointer; margin-bottom: 4px; transition: all 0.15s; border: 1px solid transparent; }
.tt-teacher-row:hover { background: var(--admin-surface-hover); }
.tt-teacher-row.active { background: var(--admin-surface-active); border-color: var(--admin-accent); }
.tt-teacher-name { font-size: 12px; font-weight: 600; color: var(--admin-text); }
.tt-teacher-subjects { font-size: 10px; color: var(--admin-text-muted); margin-top: 2px; }
.tt-teacher-total { font-size: 10px; color: var(--admin-accent); margin-top: 2px; }

/* Week Grid */
.tt-grid-wrap { min-width: 0; overflow-x: auto; }
.tt-grid { min-width: 700px; }
.tt-grid-header { display: grid; grid-template-columns: 90px repeat(7, minmax(110px, 1fr)); gap: 2px; margin-bottom: 2px; }
.tt-grid-header:has(+ .tt-grid-row .weekend) { /* handled dynamically */ }
.tt-corner { background: var(--admin-bg); padding: 8px; text-align: center; font-size: 11px; color: var(--admin-text-muted); border-radius: 6px; }
.tt-day-header { background: var(--admin-surface-active); padding: 8px; text-align: center; font-size: 13px; font-weight: 600; color: var(--admin-accent); border-radius: 6px; }
.tt-day-header.weekend { background: var(--admin-bg-secondary); color: var(--admin-text-muted); }

.tt-grid-row { display: grid; grid-template-columns: 90px repeat(7, minmax(110px, 1fr)); gap: 2px; margin-bottom: 2px; }
.tt-period-cell { background: var(--admin-bg); padding: 8px 6px; text-align: center; border-radius: 6px; font-size: 12px; color: var(--admin-text-secondary); }
.tt-period-time { font-size: 10px; color: var(--admin-text-muted); margin-top: 2px; }

.tt-lesson-cell { background: var(--admin-surface-hover); padding: 10px 8px; border-radius: 6px; cursor: pointer; transition: all 0.2s; min-height: 64px; min-width: 100px; display: flex; flex-direction: column; justify-content: center; word-break: keep-all; overflow-wrap: break-word; }
.tt-lesson-cell:hover { background: var(--admin-surface-active); border: 1px solid var(--admin-border-light); }
.tt-lesson-cell.weekend { background: var(--admin-bg-secondary); opacity: 0.6; }
.tt-lesson-cell.has-lesson { background: var(--admin-surface); border: 1px solid var(--admin-border); }
.tt-lesson-cell.highlighted { border: 2px solid var(--admin-accent); background: rgba(201,160,80,0.08); }
.tt-lesson-cell .tt-cell-subject { font-size: 13px; font-weight: 700; color: var(--admin-text); margin-bottom: 3px; line-height: 1.3; }
.tt-lesson-cell .tt-cell-teacher { font-size: 11px; color: var(--admin-accent); font-weight: 500; line-height: 1.3; }
.tt-lesson-cell .tt-cell-room { font-size: 10px; color: var(--admin-text-muted); line-height: 1.3; }
.tt-lesson-cell .tt-cell-empty { color: var(--admin-text-muted); font-size: 18px; opacity: 0.3; text-align: center; }

/* Month View — Redesigned */
.tt-month-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
.tt-month-nav { display: flex; align-items: center; gap: 4px; }
.tt-month-title { font-size: 15px; font-weight: 700; color: var(--admin-text); min-width: 120px; text-align: center; }
.tt-month-legend { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--admin-text-muted); }
.tt-legend-dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }

.tt-calendar-new { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.tt-caln-header { text-align: center; font-size: 11px; font-weight: 700; color: var(--admin-text-secondary); padding: 8px 0 6px; border-bottom: 2px solid var(--admin-border); margin-bottom: 2px; }
.tt-caln-cell { background: var(--admin-surface); border-radius: 8px; padding: 6px 7px; min-height: 100px; cursor: pointer; transition: all 0.15s; border: 1px solid var(--admin-border); display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
.tt-caln-cell:hover { border-color: var(--admin-accent); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.tt-caln-cell.today { border: 2px solid var(--admin-primary); background: var(--admin-surface-active); }
.tt-caln-cell.other { opacity: 0.25; pointer-events: none; }
.tt-caln-cell.weekend { background: var(--admin-bg-secondary); }
.tt-caln-date { font-size: 12px; font-weight: 600; color: var(--admin-text); margin-bottom: 2px; display: flex; align-items: center; gap: 4px; }
.tt-caln-today-badge { background: var(--admin-primary); color: #fff; font-size: 9px; width: 16px; height: 16px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; }
.tt-caln-subjects { display: flex; flex-direction: column; gap: 1px; flex: 1; }
.tt-caln-subject-row { display: flex; align-items: center; gap: 3px; padding: 1px 0; border-left: 3px solid var(--admin-accent); padding-left: 4px; font-size: 10px; }
.tt-caln-period { color: var(--admin-text-muted); font-size: 9px; width: 12px; flex-shrink: 0; }
.tt-caln-subj { color: var(--admin-text-secondary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tt-caln-more { font-size: 9px; color: var(--admin-accent); text-align: center; padding: 2px; cursor: pointer; }
.tt-caln-empty { font-size: 10px; color: var(--admin-text-muted); text-align: center; padding: 8px 0; }

.tt-day-detail-list { display: flex; flex-direction: column; gap: 8px; }
.tt-day-detail-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--admin-bg); border-radius: 8px; }
.tt-day-detail-period { width: 28px; height: 28px; border-radius: 50%; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* Batch grid */
.tt-batch-grid { border: 1px solid var(--admin-border); border-radius: 8px; overflow: hidden; }
.tt-batch-header { display: grid; grid-template-columns: 72px repeat(7, 1fr); background: var(--admin-bg); font-size: 11px; font-weight: 600; color: var(--admin-text-secondary); }
.tt-batch-day { padding: 6px; text-align: center; }
.tt-batch-row { display: grid; grid-template-columns: 72px repeat(7, 1fr); }
.tt-batch-period { padding: 6px; text-align: center; background: var(--admin-bg); font-size: 10px; color: var(--admin-text-muted); border-top: 1px solid var(--admin-border); display: flex; align-items: center; justify-content: center; }
.tt-batch-cell { aspect-ratio: 1; border-top: 1px solid var(--admin-border); border-left: 1px solid var(--admin-border); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
.tt-batch-cell:hover { background: var(--admin-surface-hover); }
.tt-batch-cell.selected { background: var(--admin-primary); color: #fff; }
.tt-batch-cell.selected::after { content: '✓'; font-size: 14px; }
.tt-batch-cell.occupied { background: var(--admin-border); cursor: not-allowed; }
.tt-batch-cell.occupied::after { content: '—'; color: var(--admin-text-muted); font-size: 12px; }

/* === Image Import Styles === */
.tt-import-container { max-width: 1100px; }

/* Step Indicator */
.tt-import-steps { display: flex; align-items: center; gap: 0; margin-bottom: 24px; padding: 0 20px; }
.tt-import-step { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.tt-step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; background: var(--admin-bg-secondary); color: var(--admin-text-muted); border: 2px solid var(--admin-border); transition: all 0.3s; }
.tt-import-step.active .tt-step-num { background: var(--admin-primary); color: #fff; border-color: var(--admin-primary); }
.tt-import-step.done .tt-step-num { background: var(--admin-success); color: #fff; border-color: var(--admin-success); }
.tt-step-label { font-size: 12px; font-weight: 500; color: var(--admin-text-muted); transition: color 0.3s; }
.tt-import-step.active .tt-step-label { color: var(--admin-text); font-weight: 600; }
.tt-import-step.done .tt-step-label { color: var(--admin-text-secondary); }
.tt-step-line { flex: 1; height: 2px; background: var(--admin-border); margin: 0 8px; min-width: 24px; transition: background 0.5s; }
.tt-step-line.filled { background: var(--admin-success); }

/* Step 1: Upload Zone */
.tt-import-upload { max-width: 560px; margin: 0 auto; }
.tt-upload-zone { border: 2px dashed var(--admin-border); border-radius: var(--admin-radius-lg); padding: 48px 24px; text-align: center; cursor: pointer; transition: all 0.3s; background: var(--admin-bg-secondary); position: relative; overflow: hidden; }
.tt-upload-zone:hover { border-color: var(--admin-accent); background: var(--admin-surface-hover); }
.tt-upload-zone.dragging { border-color: var(--admin-primary); background: var(--admin-surface-active); box-shadow: inset 0 0 0 2px var(--admin-primary); }
.tt-upload-zone.has-file { padding: 0; border-style: solid; border-color: var(--admin-border-light); }
.tt-upload-icon { color: var(--admin-text-muted); margin-bottom: 14px; transition: color 0.3s; }
.tt-upload-zone:hover .tt-upload-icon { color: var(--admin-accent); }
.tt-upload-text { font-size: 14px; color: var(--admin-text-secondary); margin-bottom: 8px; }
.tt-upload-link { color: var(--admin-primary); text-decoration: underline; text-underline-offset: 2px; }
.tt-upload-hint { font-size: 11px; color: var(--admin-text-muted); }
.tt-upload-preview { width: 100%; max-height: 360px; object-fit: contain; border-radius: var(--admin-radius-lg); display: block; }
.tt-upload-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; border-radius: var(--admin-radius-lg); }
.tt-upload-zone.has-file:hover .tt-upload-overlay { opacity: 1; }
.tt-upload-change { background: var(--admin-surface); color: var(--admin-text); padding: 8px 20px; border-radius: var(--admin-radius-sm); font-size: 13px; font-weight: 500; }

/* Step 2: Configure Grid */
.tt-config-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; }
.tt-config-panel { background: var(--admin-bg-secondary); border-radius: var(--admin-radius); padding: 18px; }
.tt-config-preview { background: var(--admin-bg-secondary); border-radius: var(--admin-radius); padding: 18px; }
.tt-config-title { font-size: 13px; font-weight: 600; color: var(--admin-text); margin-bottom: 14px; }
.tt-weekday-toggles { display: flex; gap: 4px; flex-wrap: wrap; }
.tt-wd-toggle { padding: 5px 12px; border: 1px solid var(--admin-border); border-radius: var(--admin-radius-sm); font-size: 12px; cursor: pointer; background: var(--admin-surface); color: var(--admin-text-secondary); transition: all 0.15s; }
.tt-wd-toggle:hover { border-color: var(--admin-accent); color: var(--admin-accent); }
.tt-wd-toggle.active { background: var(--admin-primary); color: #fff; border-color: var(--admin-primary); }
.tt-mini-grid { border: 1px solid var(--admin-border); border-radius: 6px; overflow: hidden; }
.tt-mini-row { display: grid; grid-template-columns: 36px repeat(auto-fill, 1fr); gap: 0; }
.tt-mini-row + .tt-mini-row { border-top: 1px solid var(--admin-border); }
.tt-mini-period { background: var(--admin-bg); padding: 4px 2px; text-align: center; font-size: 9px; color: var(--admin-text-muted); border-right: 1px solid var(--admin-border); }
.tt-mini-cell { aspect-ratio: 1.2; max-width: 32px; border-right: 1px solid var(--admin-border); }
.tt-mini-cell:last-child { border-right: none; }

/* Image Viewer with Grid Overlay */
.tt-image-viewer { position: relative; border-radius: var(--admin-radius); overflow: hidden; background: #000; }
.tt-viewer-img { width: 100%; display: block; max-height: 500px; object-fit: contain; }
.tt-viewer-img--compact { max-height: 320px; }
.tt-img-dim-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.55); pointer-events: none; z-index: 1; }
.tt-image-viewer.dimmed .tt-viewer-img { filter: brightness(0.35); }
.tt-image-viewer.dimmed .tt-viewer-grid { z-index: 2; }
.tt-viewer-grid { position: absolute; inset: 0; padding: 0; }
.tt-viewer-grid-inner { display: grid; width: 100%; height: 100%; }
.tt-viewer-row { display: contents; }
.tt-viewer-cell { border: 1px solid rgba(255,255,255,0.25); min-height: 0; }
.tt-viewer-cell:empty { border: 1px solid rgba(255,255,255,0.15); }

/* Step 3: Assign Cells */
.tt-import-assign { }
.tt-quickfill-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--admin-bg-secondary); border-radius: var(--admin-radius); margin-bottom: 16px; flex-wrap: wrap; }
.tt-qf-label { font-size: 12px; font-weight: 600; color: var(--admin-text-secondary); white-space: nowrap; }
.tt-qf-subject { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; border: 2px solid transparent; background: var(--admin-surface); color: var(--admin-text-muted); transition: all 0.15s; white-space: nowrap; }
.tt-qf-subject:hover { border-color: var(--qf-color, var(--admin-accent)); color: var(--qf-color, var(--admin-accent)); }
.tt-qf-subject.active { background: color-mix(in srgb, var(--qf-color, var(--admin-primary)) 20%, transparent); border-color: var(--qf-color, var(--admin-primary)); color: var(--qf-color, var(--admin-primary)); }
.tt-qf-sep { width: 1px; height: 20px; background: var(--admin-border); margin: 0 4px; }
.tt-qf-help { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--admin-border); color: var(--admin-text-muted); font-size: 11px; cursor: help; transition: all 0.15s; flex-shrink: 0; }
.tt-qf-help:hover { background: var(--admin-accent); color: #fff; }
.tt-qf-hint { font-size: 11px; color: var(--admin-text-muted); margin-left: auto; }
.tt-assign-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; }
.tt-assign-image-panel { background: var(--admin-bg-secondary); border-radius: var(--admin-radius); padding: 18px; }
.tt-assign-preview-panel { background: var(--admin-bg-secondary); border-radius: var(--admin-radius); padding: 18px; }
.tt-image-viewer--interactive .tt-viewer-cell { transition: all 0.15s; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.tt-assign-cell { cursor: pointer; border: 2px solid rgba(255,255,255,0.2); }
.tt-assign-cell.hoverable:hover { border-color: var(--qf-color, var(--admin-primary)); background: color-mix(in srgb, var(--qf-color, var(--admin-primary)) 25%, transparent) !important; }
.tt-assign-cell.filled { border-width: 2px; }
.tt-assign-cell.filled:hover { filter: brightness(1.3); }
.tt-ac-subject { font-size: 12px; font-weight: 700; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); line-height: 1.2; text-align: center; }
.tt-ac-teacher { font-size: 9px; color: rgba(255,255,255,0.85); text-shadow: 0 1px 2px rgba(0,0,0,0.4); }
.tt-ac-empty { font-size: 14px; color: rgba(255,255,255,0.3); }

/* Preview Table */
.tt-preview-table { border: 1px solid var(--admin-border); border-radius: 8px; overflow: hidden; }
.tt-pt-header { display: grid; grid-template-columns: 64px repeat(auto-fill, 1fr); background: var(--admin-bg); }
.tt-pt-corner { padding: 6px; text-align: center; font-size: 10px; color: var(--admin-text-muted); font-weight: 600; }
.tt-pt-day { padding: 6px; text-align: center; font-size: 11px; font-weight: 600; color: var(--admin-text-secondary); }
.tt-pt-row { display: grid; grid-template-columns: 64px repeat(auto-fill, 1fr); border-top: 1px solid var(--admin-border); }
.tt-pt-period { padding: 6px 4px; text-align: center; font-size: 10px; color: var(--admin-text-muted); background: var(--admin-bg); display: flex; align-items: center; justify-content: center; }
.tt-pt-cell { padding: 6px 4px; text-align: center; min-height: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; border-left: 1px solid var(--admin-border); }
.tt-pt-cell.filled { background: color-mix(in srgb, var(--cell-color, var(--admin-primary)) 10%, transparent); }
.tt-pt-subject { font-size: 11px; font-weight: 600; color: var(--admin-text); }
.tt-pt-teacher { font-size: 9px; color: var(--admin-text-muted); }
.tt-pt-empty { font-size: 12px; color: var(--admin-text-muted); opacity: 0.4; }

/* Step 4: Sync */
.tt-sync-layout { display: grid; grid-template-columns: 1fr 280px; gap: 20px; }
.tt-sync-main { background: var(--admin-bg-secondary); border-radius: var(--admin-radius); padding: 18px; }
.tt-sync-sidebar { background: var(--admin-bg-secondary); border-radius: var(--admin-radius); padding: 18px; }
.tt-sync-strategy { margin-bottom: 14px; }
.tt-sync-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tt-sync-stat { text-align: center; padding: 12px 8px; background: var(--admin-bg); border-radius: var(--admin-radius-sm); }
.tt-sync-num { display: block; font-size: 22px; font-weight: 700; color: var(--admin-accent); }
.tt-sync-label { display: block; font-size: 10px; color: var(--admin-text-muted); margin-top: 2px; }

/* Sync step uses existing .tt-grid styles with dynamic columns, so override the template */
.tt-sync-main .tt-grid-header { grid-template-columns: 90px repeat(v-bind('importWeekdays.length'), 1fr); }
.tt-sync-main .tt-grid-row { grid-template-columns: 90px repeat(v-bind('importWeekdays.length'), 1fr); }

@media (max-width: 768px) {
  .tt-week-layout { grid-template-columns: 1fr; }
  .tt-grid-row, .tt-grid-header { grid-template-columns: 60px repeat(5, 1fr); }
  .tt-lesson-cell { min-height: 46px; padding: 4px; }
  .tt-config-layout { grid-template-columns: 1fr; }
  .tt-assign-layout { grid-template-columns: 1fr; }
  .tt-sync-layout { grid-template-columns: 1fr; }
  .tt-import-steps { overflow-x: auto; padding: 0; }
}
</style>
