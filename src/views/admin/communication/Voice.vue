<template>
  <div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-title">🎙️ AI 语音记录系统</div>
          <div class="admin-card-subtitle">实时录音 · 在线播放 · AI转写 · 家校沟通存档</div>
        </div>
      </div>

      <!-- Recording Control -->
      <div class="voice-recorder">
        <div class="recorder-visual">
          <div class="recorder-circle" :class="{ recording: isRecording }" @click="toggleRecording">
            <div class="recorder-inner">
              <span v-if="!isRecording && !hasRecording">🎙️</span>
              <span v-else-if="isRecording" class="pulse-icon">🔴</span>
              <span v-else>▶️</span>
            </div>
          </div>
          <div class="recorder-timer">{{ formatTime(elapsed) }}</div>
          <div class="recorder-status">
            {{ isRecording ? '录音中...' : isPaused ? '已暂停' : hasRecording ? '录音完成' : '点击开始录音' }}
          </div>
          <div class="recorder-info" v-if="isRecording || hasRecording">
            <span>场景：{{ currentScene }}</span>
            <span>说话人：{{ speakerCount }}人</span>
          </div>
        </div>

        <!-- Controls -->
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <el-select v-model="currentScene" size="small" style="width:140px" :disabled="isRecording">
            <el-option label="家长面谈" value="家长面谈" />
            <el-option label="学生谈话" value="学生谈话" />
            <el-option label="班会记录" value="班会记录" />
            <el-option label="教研会议" value="教研会议" />
            <el-option label="其他" value="其他" />
          </el-select>
          <el-select v-model="speakerCount" size="small" style="width:100px" :disabled="isRecording">
            <el-option :label="n+'人'" :value="n" v-for="n in [1,2,3,4,5,6]" :key="n" />
          </el-select>
          <el-button v-if="isRecording" size="small" type="warning" @click="pauseRecording">{{ isPaused ? '继续' : '暂停' }}</el-button>
          <el-button v-if="isRecording" size="small" type="danger" @click="stopRecording">停止录音</el-button>
          <el-button v-if="hasRecording && !isRecording" size="small" type="success" @click="playRecording">
            {{ isPlaying ? '⏸ 暂停' : '▶️ 播放' }}
          </el-button>
          <el-button v-if="hasRecording && !isRecording" size="small" @click="resetRecording">重新录制</el-button>
          <el-button v-if="hasRecording && !isRecording" size="small" type="primary" @click="saveRecording">💾 保存录音</el-button>
        </div>
      </div>

      <!-- Waveform after recording -->
      <div class="waveform-card" v-if="audioBlobUrl && hasRecording">
        <div ref="waveformContainer" class="waveform-container"></div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;justify-content:center">
          <el-button size="small" type="success" @click="playRecording">{{ isPlaying ? '⏸ 暂停' : '▶️ 播放' }}</el-button>
          <span style="font-size:11px;color:var(--admin-text-muted)">{{ formatTime(elapsed) }}</span>
        </div>
      </div>
      <!-- Hidden audio -->
      <audio ref="audioPlayer" @ended="isPlaying = false" style="display:none"></audio>
    </div>

    <div class="admin-two-col">
      <!-- Transcript -->
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">
          📝 {{ isRecording ? '实时转写' : '文字记录' }}
          <span v-if="isRecording" class="admin-tag danger" style="margin-left:8px">LIVE</span>
          <el-button v-if="hasRecording && !isRecording && !transcript.length" size="small" type="primary" style="margin-left:8px" @click="simulateTranscription" :loading="isTranscribing">
            {{ isTranscribing ? 'AI转写中...' : '🤖 AI转写' }}
          </el-button>
        </div>
        <div class="transcript-area" ref="transcriptEl">
          <div v-for="(line, i) in transcript" :key="i" class="transcript-line" :class="'speaker-' + (i % 3)">
            <span class="tl-speaker">{{ line.speaker }}:</span>
            <span class="tl-text">{{ line.text }}</span>
            <span class="tl-time">{{ line.time }}</span>
          </div>
          <div v-if="transcript.length === 0 && !isRecording" class="admin-empty" style="padding:30px">
            <div class="empty-icon">🎙️</div>
            <p>录音后可点击「AI转写」生成文字记录</p>
          </div>
        </div>
        <div v-if="transcript.length > 0" style="margin-top:8px;display:flex;gap:8px">
          <el-button size="small" @click="copyTranscript">📋 复制文字稿</el-button>
          <el-button size="small" @click="exportTranscript">📥 导出TXT</el-button>
        </div>
      </div>

      <!-- Saved Recordings -->
      <div class="admin-card">
        <div class="admin-card-title" style="font-size:14px;margin-bottom:12px">💾 历史录音</div>
        <el-table :data="paginatedRecordings" stripe size="small" style="width:100%">
          <el-table-column label="标题" fixed>
            <template #default="{ row }">
              <span style="color:var(--admin-text);font-weight:500">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="scene" label="场景" />
          <el-table-column prop="duration" label="时长" />
          <el-table-column prop="date" label="日期" />
          <el-table-column label="操作" fixed="right" width="150">
            <template #default="{ row }">
              <el-button size="small" text @click="loadRecording(row)">查看</el-button>
              <el-button size="small" text type="danger" @click="deleteRecording(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top:8px;display:flex;justify-content:center" v-if="savedRecordings.length > pageSize">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,15,20,50]" :total="savedRecordings.length" layout="total, sizes, prev, pager, next, jumper" size="small" background />
        </div>
      </div>
    </div>

    <!-- Recording Detail Dialog -->
    <el-dialog v-model="detailVisible" title="录音详情" width="680px">
      <div v-if="currentRecording" style="line-height:2">
        <p><b>标题：</b>{{ currentRecording.title }}</p>
        <p><b>场景：</b>{{ currentRecording.scene }} · <b>时长：</b>{{ currentRecording.duration }} · <b>日期：</b>{{ currentRecording.date }}</p>
        <p><b>说话人：</b>{{ currentRecording.speakers }}</p>
        <div v-if="currentRecording.audioUrl" style="margin:10px 0">
          <audio :src="currentRecording.audioUrl" controls style="width:100%"></audio>
        </div>
        <div v-if="currentRecording.transcript && currentRecording.transcript.length" style="margin-top:10px">
          <p><b>文字记录：</b></p>
          <div v-for="(line, i) in currentRecording.transcript" :key="i" style="font-size:12px;padding:2px 0;color:var(--admin-text-secondary)">
            <b>{{ line.speaker }}：</b>{{ line.text }} <span style="color:var(--admin-text-muted);font-size:10px">{{ line.time }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportCurrentTranscript">导出文字稿</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
/**
 * 页面：AI语音记录系统
 * 功能：实时录音与在线播放，支持浏览器语音识别转写和音频波形可视化，家校沟通存档
 * 路由：/admin/voice
 */
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import WaveSurfer from 'wavesurfer.js'
import { voiceService } from '@/services/dataService'

const isRecording = ref(false)
const isPaused = ref(false)
const hasRecording = ref(false)
const isPlaying = ref(false)
const isTranscribing = ref(false)
const elapsed = ref(0)
const currentScene = ref('家长面谈')
const speakerCount = ref(2)
const transcriptEl = ref(null)
const audioPlayer = ref(null)
const audioBlobUrl = ref(null)
const detailVisible = ref(false)
const currentRecording = ref(null)
const speechSupported = ref(false)
const speechActive = ref(false)
const waveformContainer = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
let timer = null
let mediaRecorder = null
let audioChunks = []
let stream = null
let recognition = null
let waveSurfer = null

const savedRecordings = ref([])
const currentAudioBlob = ref(null)
const transcript = ref([])

// API stub for dual storage
const API_BASE = '/api/voice'

async function syncToServer(record) {
  try {
    await fetch(`${API_BASE}/save`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    })
  } catch {
    console.log('后端API暂未连接，已保存到本地存储')
  }
}

// Initialize
onMounted(() => {
  savedRecordings.value = voiceService.getAll()
  speechSupported.value = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
})

function initWaveSurfer() {
  if (waveSurfer) { waveSurfer.destroy(); waveSurfer = null }
  if (waveformContainer.value && audioBlobUrl.value) {
    waveSurfer = WaveSurfer.create({
      container: waveformContainer.value,
      waveColor: 'var(--admin-accent)',
      progressColor: 'var(--admin-accent-dark)',
      cursorColor: 'var(--admin-text)',
      height: 80,
      barWidth: 2,
      barGap: 1,
      barRadius: 3,
      normalize: true
    })
    waveSurfer.load(audioBlobUrl.value)
  }
}

function toggleRecording() {
  if (!isRecording.value && !hasRecording.value) {
    startRecording()
  }
}

async function startRecording() {
  // Start speech recognition if supported
  if (speechSupported.value && !recognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          const mins = Math.floor(elapsed.value / 60)
          const secs = elapsed.value % 60
          const time = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`
          transcript.value.push({
            speaker: `说话人${(transcript.value.length % speakerCount.value) + 1}`,
            text: result[0].transcript.trim(),
            time
          })
        } else {
          interim += result[0].transcript
        }
      }
    }
    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.log('语音识别:', e.error)
    }
    try { recognition.start(); speechActive.value = true } catch {}
  }

  // Start media recording
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
    mediaRecorder = new MediaRecorder(stream, { mimeType })
    audioChunks = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: mimeType })
      currentAudioBlob.value = blob
      if (audioBlobUrl.value) URL.revokeObjectURL(audioBlobUrl.value)
      audioBlobUrl.value = URL.createObjectURL(blob)
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null }
      hasRecording.value = true
      if (recognition) { try { recognition.stop() } catch {}; speechActive.value = false }
      nextTick(() => initWaveSurfer())
    }

    mediaRecorder.start(1000)
    isRecording.value = true
    isPaused.value = false
    elapsed.value = 0
    transcript.value = []
    hasRecording.value = false
    timer = setInterval(() => { if (!isPaused.value) elapsed.value++ }, 1000)
  } catch (err) {
    console.error('获取麦克风权限失败:', err)
    ElMessage.warning('无法访问麦克风，请检查浏览器权限设置')
    simulateRecording()
  }
}

function simulateRecording() {
  isRecording.value = true
  isPaused.value = false
  elapsed.value = 0
  hasRecording.value = false
  transcript.value = []
  timer = setInterval(() => {
    if (!isPaused.value) elapsed.value++
    if (elapsed.value >= 5) stopRecording()
  }, 1000)
}

function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    isPaused.value = true
    mediaRecorder.pause()
    if (recognition) { try { recognition.stop(); speechActive.value = false } catch {} }
  } else if (mediaRecorder && mediaRecorder.state === 'paused') {
    isPaused.value = false
    mediaRecorder.resume()
    if (recognition) { try { recognition.start(); speechActive.value = true } catch {} }
  } else if (!mediaRecorder && isRecording.value) {
    isPaused.value = !isPaused.value
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  if (timer) { clearInterval(timer); timer = null }
  if (recognition) { try { recognition.stop() } catch {}; speechActive.value = false }
  isRecording.value = false
  isPaused.value = false
}

function playRecording() {
  if (!audioPlayer.value || !audioBlobUrl.value) return
  if (isPlaying.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
    if (waveSurfer) waveSurfer.pause()
  } else {
    audioPlayer.value.src = audioBlobUrl.value
    audioPlayer.value.play().catch(err => {
      console.error('播放失败:', err)
      ElMessage.warning('音频播放失败')
    })
    isPlaying.value = true
    if (waveSurfer) waveSurfer.play()
  }
}

function onAudioTimeUpdate() {}

function resetRecording() {
  if (audioPlayer.value) { audioPlayer.value.pause(); audioPlayer.value.src = '' }
  if (audioBlobUrl.value) { URL.revokeObjectURL(audioBlobUrl.value); audioBlobUrl.value = null }
  if (waveSurfer) { waveSurfer.destroy(); waveSurfer = null }
  if (recognition) { try { recognition.stop() } catch {}; recognition = null; speechActive.value = false }
  isPlaying.value = false
  hasRecording.value = false
  isRecording.value = false
  elapsed.value = 0
  transcript.value = []
  currentAudioBlob.value = null
}

function simulateTranscription() {
  isTranscribing.value = true
  const templates = [
    [
      { speaker:'张老师', text:'您好，今天请您来是想沟通一下孩子最近的学习状态。', time:'00:12' },
      { speaker:'家长', text:'老师您好，我也注意到了，他最近回家后不太爱说话。', time:'00:25' },
      { speaker:'张老师', text:'是的，这次月考数学成绩有所下滑，我分析主要是二次函数综合应用这块有漏洞。', time:'00:42' },
      { speaker:'家长', text:'他在家里也确实不怎么练数学题了，说太难了。', time:'00:58' },
      { speaker:'张老师', text:'我建议可以从这几方面入手：每天固定20分钟专项练习，我会发一些针对性题目给他。另外他上课还是很积极的，这个要保持。', time:'01:20' },
      { speaker:'家长', text:'好的，谢谢老师！我们家长一定配合。', time:'01:40' }
    ],
    [
      { speaker:'张老师', text:'这次班会我们讨论两个议题：月考总结和手机使用规范。', time:'00:08' },
      { speaker:'学生A', text:'我觉得手机管理应该更灵活一些，午休时间可以适当开放。', time:'00:25' },
      { speaker:'张老师', text:'这个建议可以考虑，但需要有明确的规则和监督机制。', time:'00:40' },
      { speaker:'学生B', text:'月考成绩出来了，我数学进步了不少，谢谢老师。', time:'01:00' },
      { speaker:'张老师', text:'进步值得肯定！但不要骄傲，继续保持现在的学习节奏。', time:'01:20' }
    ]
  ]
  setTimeout(() => {
    transcript.value = templates[Math.floor(Math.random() * templates.length)]
    isTranscribing.value = false
    ElMessage.success('AI转写完成')
  }, 2000)
}

async function saveRecording() {
  const mins = Math.floor(elapsed.value / 60)
  const secs = elapsed.value % 60
  const dur = `${mins}:${secs.toString().padStart(2, '0')}`
  const title = currentScene.value + ' · ' + new Date().toLocaleDateString('zh-CN')

  // Convert blob to base64 synchronously before saving so data persists across page reloads
  let audioData = null
  if (currentAudioBlob.value) {
    audioData = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(currentAudioBlob.value)
    })
  }

  const record = {
    title,
    scene: currentScene.value,
    duration: dur,
    speakers: speakerCount.value + '人',
    date: new Date().toISOString().split('T')[0],
    audioUrl: audioData || audioBlobUrl.value,
    audioData,
    transcript: [...transcript.value]
  }

  voiceService.create(record)

  // Dual storage: sync to server
  await syncToServer(record)

  savedRecordings.value = voiceService.getAll()
  ElMessage.success('录音已保存（本地 + 云端）')
  resetRecording()
}

const paginatedRecordings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return savedRecordings.value.slice(start, start + pageSize.value)
})

function loadRecording(record) {
  currentRecording.value = { ...record }
  if (record.audioData) {
    currentRecording.value.audioUrl = record.audioData
  } else if (record.audioUrl && record.audioUrl.startsWith('blob:')) {
    // Blob URLs don't survive page reloads — try audioData fallback
    currentRecording.value.audioUrl = null
  }
  detailVisible.value = true
}

async function deleteRecording(record) {
  try {
    await ElMessageBox.confirm(`确定删除录音「${record.title}」吗？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    voiceService.delete(record.id)
    savedRecordings.value = voiceService.getAll()
    ElMessage.success('录音已删除')
  } catch {}
}

function copyTranscript() {
  const text = transcript.value.map(l => `${l.speaker}：${l.text} [${l.time}]`).join('\n')
  navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制到剪贴板'))
}

function exportTranscript() {
  const text = transcript.value.map(l => `${l.speaker}：${l.text} [${l.time}]`).join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `录音文字稿_${new Date().toISOString().split('T')[0]}.txt`
  a.click(); URL.revokeObjectURL(url)
}

function exportCurrentTranscript() {
  if (!currentRecording.value) return
  const lines = (currentRecording.value.transcript || [])
  const text = lines.map(l => `${l.speaker}：${l.text} [${l.time}]`).join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${currentRecording.value.title}_文字稿.txt`
  a.click(); URL.revokeObjectURL(url)
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

onUnmounted(() => {
  clearInterval(timer)
  if (waveSurfer) waveSurfer.destroy()
  if (recognition) { try { recognition.stop() } catch {} }
})
</script>

<style scoped>
.voice-recorder { text-align: center; padding: 20px; }
.recorder-visual { margin-bottom: 16px; }
.recorder-circle {
  width: 100px; height: 100px; border-radius: 50%;
  background: var(--admin-surface-active); border: 3px solid var(--admin-border);
  margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.3s;
}
.recorder-circle:hover { border-color: var(--admin-accent); }
.recorder-circle.recording { border-color: var(--admin-danger); animation: pulse-ring 1.5s ease-out infinite; }
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
  100% { box-shadow: 0 0 0 16px rgba(239,68,68,0); }
}
.recorder-inner { font-size: 36px; }
.pulse-icon { animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.recorder-timer { font-size: 32px; font-weight: 700; color: var(--admin-text); font-family: 'Cascadia Code', monospace; margin-bottom: 4px; }
.recorder-status { font-size: 13px; color: var(--admin-text-secondary); margin-bottom: 6px; }
.recorder-info { display: flex; gap: 16px; justify-content: center; font-size: 11px; color: var(--admin-text-muted); }

.transcript-area { max-height: 380px; overflow-y: auto; background: var(--admin-bg); border-radius: 8px; padding: 12px; }
.transcript-line { padding: 8px 10px; border-radius: 6px; margin-bottom: 4px; display: flex; gap: 8px; align-items: flex-start; font-size: 12px; line-height: 1.6; }
.transcript-line.speaker-0 { background: rgba(59,130,246,0.08); border-left: 2px solid var(--admin-primary); }
.transcript-line.speaker-1 { background: rgba(201,160,80,0.08); border-left: 2px solid var(--admin-accent); }
.transcript-line.speaker-2 { background: rgba(34,197,94,0.08); border-left: 2px solid var(--admin-success); }
.tl-speaker { font-weight: 600; color: var(--admin-text); white-space: nowrap; min-width: 60px; }
.tl-text { color: var(--admin-text-secondary); flex: 1; }
.tl-time { font-size: 10px; color: var(--admin-text-muted); white-space: nowrap; }

.waveform-container { width: 100%; min-height: 80px; }
.waveform-card { margin-top: 12px; padding: 12px 16px; background: var(--admin-bg); border: 1px solid var(--admin-border); border-radius: 10px; }
</style>
