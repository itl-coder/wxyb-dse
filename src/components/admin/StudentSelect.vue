<template>
  <el-select :model-value="modelValue" style="width:100%" filterable @update:model-value="$emit('update:modelValue', $event)" @change="onChange">
    <el-option v-for="s in studentList" :key="s.id" :label="`${s.name} · ${s.class}`" :value="s.id" />
  </el-select>
</template>

<script setup>
import { computed } from 'vue'
import { studentService } from '@/services/dataService'

const props = defineProps({
  modelValue: { type: [Number, String], default: null }
})
const emit = defineEmits(['update:modelValue', 'change'])

const studentList = computed(() => studentService.getAll())

function onChange(val) {
  const s = studentList.value.find(s => s.id === val)
  emit('change', s || null)
}
</script>
