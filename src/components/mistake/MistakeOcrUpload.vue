<template>
  <div class="mou-root">
    <!-- Step 1: 上传截图 -->
    <div v-if="step === 1" class="mou-upload">
      <div class="mou-dropzone" @click="triggerFile" @dragover.prevent @drop.prevent="handleDrop">
        <div class="mou-drop-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <div class="mou-drop-text">点击上传错题截图</div>
        <div class="mou-drop-hint">支持 JPG、PNG，建议清晰拍摄题目区域</div>
      </div>
      <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="handleFile" />
    </div>

    <!-- Step 2: 裁切 & 识别 -->
    <div v-else-if="step === 2" class="mou-process">
      <div class="mou-preview-area">
        <img :src="imageDataUrl" class="mou-preview-img" ref="previewImg" />
      </div>

      <div class="mou-progress" v-if="recognizing">
        <div class="mou-progress-bar">
          <div class="mou-progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="mou-progress-text">{{ progressText }}</div>
      </div>

      <div class="mou-actions" v-if="!recognizing">
        <el-button @click="resetAll">重新选择</el-button>
        <el-button type="primary" @click="startRecognition" :loading="recognizing">
          开始识别
        </el-button>
      </div>
    </div>

    <!-- Step 3: 结果预览 & 校正 -->
    <div v-else-if="step === 3" class="mou-result">
      <div class="mou-result-header">识别结果预览</div>

      <!-- 识别文本 -->
      <div class="mou-field">
        <label>识别文本</label>
        <el-input v-model="ocrResult.text" type="textarea" :rows="4" placeholder="OCR 识别文本…" />
      </div>

      <!-- 题号 -->
      <div class="mou-field">
        <label>识别题号</label>
        <div class="mou-tags">
          <el-tag
            v-for="(n, i) in ocrResult.questionNumbers"
            :key="i"
            closable
            size="small"
            @close="ocrResult.questionNumbers.splice(i, 1)"
          >第 {{ n }} 题</el-tag>
          <el-button size="small" text @click="addQuestionNumber">+ 添加题号</el-button>
        </div>
      </div>

      <!-- 公式 -->
      <div class="mou-field" v-if="ocrResult.formulas.length">
        <label>识别公式</label>
        <div class="mou-tags">
          <el-tag
            v-for="(f, i) in ocrResult.formulas"
            :key="i"
            type="success"
            closable
            size="small"
            @close="ocrResult.formulas.splice(i, 1)"
          >{{ f }}</el-tag>
        </div>
      </div>

      <!-- 元信息 -->
      <div class="mou-meta">
        <div class="mou-meta-row">
          <span class="mou-meta-label">科目</span>
          <el-select v-model="meta.subject" size="small" style="width:180px">
            <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
        <div class="mou-meta-row">
          <span class="mou-meta-label">来源</span>
          <el-input v-model="meta.source" size="small" placeholder="如：2026年5月月考" style="width:180px" />
        </div>
        <div class="mou-meta-row">
          <span class="mou-meta-label">知识点</span>
          <el-input v-model="meta.knowledgePoint" size="small" placeholder="如：二次函数顶点式" style="width:180px" />
        </div>
      </div>

      <div class="mou-result-actions">
        <el-button @click="step = 2">返回上一步</el-button>
        <el-button type="primary" @click="confirmAndSave">确认并保存错题</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { performOCR } from '@/composables/useOCR'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['saved', 'cancel'])

const subjects = ['数学', '中国语文', '英国语文', '物理', '化学', '生物', '历史', '地理', '经济', '资讯及通讯科技']

const step = ref(1)
const fileInput = ref(null)
const imageDataUrl = ref('')
const recognizing = ref(false)
const progress = ref(0)
const progressText = ref('')

const ocrResult = ref({
  text: '',
  questionNumbers: [],
  formulas: [],
  confidence: 0
})

const meta = ref({
  subject: '数学',
  source: '',
  knowledgePoint: ''
})

function triggerFile() { fileInput.value?.click() }

function handleDrop(e) {
  const f = e.dataTransfer?.files?.[0]
  if (f && f.type.startsWith('image/')) loadImage(f)
}

function handleFile(e) {
  const f = e.target.files?.[0]
  if (f) loadImage(f)
}

function loadImage(file) {
  const reader = new FileReader()
  reader.onload = (ev) => {
    imageDataUrl.value = ev.target.result
    step.value = 2
  }
  reader.readAsDataURL(file)
}

function resetAll() {
  step.value = 1
  imageDataUrl.value = ''
  recognizing.value = false
  progress.value = 0
  ocrResult.value = { text: '', questionNumbers: [], formulas: [], confidence: 0 }
}

async function startRecognition() {
  recognizing.value = true
  progress.value = 10
  progressText.value = '正在加载识别引擎…'

  try {
    progress.value = 30
    progressText.value = '正在分析图片…'

    const result = await performOCR(imageDataUrl.value)

    progress.value = 90
    progressText.value = '识别完成'

    ocrResult.value = {
      text: result.text,
      questionNumbers: result.questionNumbers,
      formulas: result.formulas,
      confidence: result.confidence
    }

    progress.value = 100
    await new Promise(r => setTimeout(r, 300))
    step.value = 3
  } catch (e) {
    ElMessage.warning('OCR 识别失败，请重试或手动输入')
    step.value = 3
  }
  recognizing.value = false
}

function addQuestionNumber() {
  ocrResult.value.questionNumbers.push(0)
}

function confirmAndSave() {
  if (!ocrResult.value.text.trim()) {
    ElMessage.warning('请确保识别文本不为空')
    return
  }
  emit('saved', {
    question: ocrResult.value.text,
    questionNumbers: ocrResult.value.questionNumbers.filter(n => n > 0),
    formulas: ocrResult.value.formulas,
    subject: meta.value.subject,
    source: meta.value.source,
    knowledgePoint: meta.value.knowledgePoint,
    imageUrl: imageDataUrl.value
  })
}

function cancel() { emit('cancel') }
</script>

<style scoped>
.mou-root {
  padding: 4px 0;
}

.mou-upload { text-align: center; }
.mou-dropzone {
  border: 2px dashed rgba(255,255,255,0.1);
  border-radius: 12px; padding: 40px 20px; cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.mou-dropzone:hover {
  border-color: var(--accent, #6366f1);
  background: rgba(99,102,241,0.03);
}
.mou-drop-icon { color: rgba(255,255,255,0.2); margin-bottom: 12px; }
.mou-drop-text { font-size: 14px; color: var(--text-primary, #e2e8f0); }
.mou-drop-hint { font-size: 12px; color: var(--text-muted, #64748b); margin-top: 6px; }

.mou-process { display: flex; flex-direction: column; gap: 16px; }
.mou-preview-area {
  text-align: center; max-height: 340px; overflow: hidden;
  border-radius: 10px; border: 1px solid var(--border-light, rgba(255,255,255,0.08));
  background: rgba(0,0,0,0.1);
}
.mou-preview-img { max-width: 100%; max-height: 340px; object-fit: contain; }

.mou-progress { text-align: center; padding: 20px 0; }
.mou-progress-bar {
  height: 6px; background: var(--border-light, rgba(255,255,255,0.08));
  border-radius: 3px; overflow: hidden; margin-bottom: 10px;
}
.mou-progress-fill {
  height: 100%; background: var(--accent, #6366f1);
  border-radius: 3px; transition: width 0.4s ease;
}
.mou-progress-text { font-size: 12px; color: var(--text-muted, #64748b); }

.mou-actions { display: flex; justify-content: center; gap: 10px; }

/* Result */
.mou-result { display: flex; flex-direction: column; gap: 14px; }
.mou-result-header { font-size: 14px; font-weight: 700; color: var(--text-primary, #e2e8f0); }
.mou-field { display: flex; flex-direction: column; gap: 6px; }
.mou-field label { font-size: 11px; font-weight: 600; color: var(--text-muted, #64748b); }
.mou-tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.mou-meta { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(255,255,255,0.015); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
.mou-meta-row { display: flex; align-items: center; gap: 10px; }
.mou-meta-label { font-size: 11px; font-weight: 600; color: var(--text-muted, #64748b); min-width: 56px; }

.mou-result-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
</style>
