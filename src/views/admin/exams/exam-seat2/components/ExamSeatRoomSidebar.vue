<template>
  <div class="esrs-root">
    <div class="esrs-header">
      <h3 class="esrs-title">考场教室</h3>
      <button class="esrs-add-btn" @click="openAdd">
        <span>+</span> 新增
      </button>
    </div>

    <div class="esrs-list">
      <div
        v-for="room in store.roomStats"
        :key="room.id"
        class="esrs-item"
        :class="{ active: room.id === store.selectedRoomId }"
        @click="store.selectRoom(room.id)"
      >
        <div class="esrs-item-top">
          <span class="esrs-room-name">{{ room.name }}</span>
          <span class="esrs-actions">
            <button class="esrs-act-btn" @click.stop="openEdit(room)" title="编辑">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="esrs-act-btn esrs-danger" @click.stop="confirmDelete(room)" title="删除">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </span>
        </div>

        <div class="esrs-meta">
          <span class="esrs-dims">{{ room.rows }} x {{ room.cols }}</span>
          <span class="esrs-location" v-if="room.location">{{ room.location }}</span>
          <span class="esrs-exclusive" v-if="room.exclusiveClassId">{{ room.exclusiveClassId }}班专属</span>
        </div>

        <div class="esrs-progress">
          <div class="esrs-progress-track">
            <div
              class="esrs-progress-fill"
              :class="{ full: room.totalCapacity > 0 && room.assignedCount >= room.totalCapacity }"
              :style="{ width: room.totalCapacity ? (room.assignedCount / room.totalCapacity * 100) + '%' : '0%' }"
            ></div>
          </div>
          <span class="esrs-progress-num">{{ room.assignedCount }}/{{ room.totalCapacity }}</span>
        </div>

        <div class="esrs-quick">
          <button class="esrs-quick-btn" @click.stop="arrangeOne(room.id)">⚡排此教室</button>
          <button class="esrs-quick-btn esrs-quick-clear" @click.stop="clearOne(room.id)">✕清空</button>
        </div>
      </div>

      <div class="esrs-item esrs-item-empty" v-if="store.rooms.length === 0">
        <span>暂无教室，点击上方"新增"</span>
      </div>
    </div>

    <!-- 教室配置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingRoom ? '编辑教室' : '新增教室'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="80px" label-position="top">
        <el-form-item label="教室名称" required>
          <el-input v-model="form.name" placeholder="如: 选修大课室" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="行数">
              <el-input-number v-model="form.rows" :min="3" :max="12" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="列数">
              <el-input-number v-model="form.cols" :min="3" :max="12" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="位置">
          <el-input v-model="form.location" placeholder="如: 3F走廊东" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="考试科目">
              <el-input v-model="form.examSubject" placeholder="如: 数学" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考试时间">
              <el-input v-model="form.examTime" placeholder="如: 5月20日 9:00-11:00" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="监考员">
              <el-input v-model="form.proctor" placeholder="如: 王老师" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专属班级">
              <el-select v-model="form.exclusiveClassId" placeholder="不限制" clearable style="width:100%">
                <el-option v-for="c in store.availableClasses" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">{{ editingRoom ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExamSeat2Store } from '../store/examSeat2Store'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useExamSeat2Store()

const dialogVisible = ref(false)
const editingRoom = ref(null)

const form = ref({
  name: '', rows: 6, cols: 5, location: '',
  examSubject: '', examTime: '', proctor: '', exclusiveClassId: ''
})

function openAdd() {
  editingRoom.value = null
  form.value = { name: '', rows: 6, cols: 5, location: '', examSubject: '', examTime: '', proctor: '', exclusiveClassId: '' }
  dialogVisible.value = true
}

function openEdit(room) {
  editingRoom.value = room
  form.value = {
    name: room.name || '',
    rows: room.rows || 6,
    cols: room.cols || 5,
    location: room.location || '',
    examSubject: room.examSubject || '',
    examTime: room.examTime || '',
    proctor: room.proctor || '',
    exclusiveClassId: room.exclusiveClassId || ''
  }
  dialogVisible.value = true
}

function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入教室名称')
    return
  }
  if (editingRoom.value) {
    store.updateRoom(editingRoom.value.id, { ...form.value })
    ElMessage.success('已更新教室')
  } else {
    store.addRoom({ ...form.value })
    ElMessage.success('已添加教室')
  }
  dialogVisible.value = false
  editingRoom.value = null
}

async function confirmDelete(room) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${room.name}」吗？该教室的座位分配也将被清除。`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    store.deleteRoom(room.id)
    ElMessage.success('已删除教室')
  } catch { /* cancelled */ }
}

async function clearOne(roomId) {
  try {
    await ElMessageBox.confirm(
      '确定清空此教室吗？已锁定的座位将保留。',
      '确认清空',
      { confirmButtonText: '清空', cancelButtonText: '取消', type: 'warning' }
    )
    store.clearRoom(roomId)
  } catch { /* cancelled */ }
}

function arrangeOne(roomId) {
  store.selectRoom(roomId)
  // 自动排座由 index.vue 的 Toolbar 统一处理
}
</script>

<style scoped>
.esrs-root {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.esrs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--admin-border);
  margin-bottom: 8px;
}
.esrs-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--admin-text);
  margin: 0;
}
.esrs-add-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px 12px;
  border: 1px solid rgba(99,102,241,0.3);
  background: rgba(99,102,241,0.06);
  color: var(--admin-accent-light);
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--admin-font);
  transition: all 0.2s;
}
.esrs-add-btn:hover {
  background: rgba(99,102,241,0.12);
  border-color: rgba(99,102,241,0.5);
}
.esrs-add-btn span { font-size: 14px; line-height: 1; }

.esrs-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.esrs-item {
  padding: 10px;
  background: var(--admin-surface);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.18s;
}
.esrs-item:hover { border-color: var(--admin-border-light); }
.esrs-item.active {
  border-color: var(--admin-accent);
  background: rgba(99,102,241,0.04);
  box-shadow: 0 0 12px rgba(99,102,241,0.08);
}
.esrs-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.esrs-room-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--admin-text);
}
.esrs-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}
.esrs-item:hover .esrs-actions { opacity: 1; }
.esrs-act-btn {
  width: 24px; height: 24px;
  border: none;
  background: transparent;
  color: var(--admin-text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.esrs-act-btn:hover { background: rgba(255,255,255,0.06); color: var(--admin-text); }
.esrs-danger:hover { background: rgba(248,113,113,0.15); color: var(--admin-danger); }

.esrs-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 10px;
  color: var(--admin-text-muted);
}
.esrs-dims {
  font-family: var(--font-mono);
  color: var(--admin-text-secondary);
}
.esrs-exclusive {
  background: rgba(99,102,241,0.08);
  color: var(--admin-accent-light);
  padding: 0 4px;
  border-radius: 2px;
}

.esrs-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.esrs-progress-track {
  flex: 1;
  height: 3px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
}
.esrs-progress-fill {
  height: 100%;
  background: var(--admin-accent);
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.esrs-progress-fill.full { background: var(--admin-success); }
.esrs-progress-num {
  font-size: 10px;
  color: var(--admin-text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
}

.esrs-quick {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}
.esrs-item:hover .esrs-quick { opacity: 1; }
.esrs-quick-btn {
  flex: 1;
  padding: 4px 0;
  border: 1px solid rgba(99,102,241,0.2);
  background: rgba(99,102,241,0.05);
  color: var(--admin-accent-light);
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-family: var(--admin-font);
  transition: all 0.15s;
  white-space: nowrap;
}
.esrs-quick-btn:hover {
  background: rgba(99,102,241,0.1);
  border-color: rgba(99,102,241,0.4);
}
.esrs-quick-clear {
  border-color: rgba(248,113,113,0.2);
  background: rgba(248,113,113,0.04);
  color: var(--admin-danger);
}
.esrs-quick-clear:hover {
  background: rgba(248,113,113,0.1);
  border-color: rgba(248,113,113,0.35);
}

.esrs-item-empty {
  text-align: center;
  padding: 20px;
  cursor: default;
  border: 1px dashed var(--admin-border);
  color: var(--admin-text-muted);
  font-size: 12px;
}
</style>
