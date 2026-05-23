<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑教室' : '新增教室'"
    width="480px"
    :close-on-click-modal="false"
    @close="$emit('close')"
  >
    <el-form :model="form" label-width="80px" label-position="top">
      <el-form-item label="教室名称" required>
        <el-input v-model="form.name" placeholder="如: 101 教室" />
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
        <el-input v-model="form.location" placeholder="如: 教学楼 1F" />
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
            <el-select v-model="form.exclusiveClassId" placeholder="不限制（混合考场）" clearable style="width:100%">
              <el-option
                v-for="cls in store.availableClasses"
                :key="cls"
                :label="cls"
                :value="cls"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="$emit('close')">取消</el-button>
      <el-button type="primary" @click="handleSave">{{ isEdit ? '保存' : '创建' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useExamSeatStore } from '@/views/admin/exams/exam-seat/store/examSeatStore.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
  room: { type: Object, default: null }
})
const emit = defineEmits(['close'])

const store = useExamSeatStore()
const visible = ref(true)

const isEdit = computed(() => !!props.room)

const form = ref({
  name: props.room?.name || '',
  rows: props.room?.rows || 6,
  cols: props.room?.cols || 5,
  location: props.room?.location || '',
  examSubject: props.room?.examSubject || '',
  examTime: props.room?.examTime || '',
  exclusiveClassId: props.room?.exclusiveClassId || '',
  proctor: props.room?.proctor || ''
})

function handleSave() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入教室名称')
    return
  }
  if (isEdit.value) {
    store.updateRoom(props.room.id, form.value)
    ElMessage.success('已更新教室')
  } else {
    store.addRoom(form.value)
    ElMessage.success('已添加教室')
  }
  emit('close')
}
</script>
