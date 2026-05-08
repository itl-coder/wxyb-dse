<template>
  <el-select :model-value="modelValue" size="small" placeholder="班级" style="width:110px" clearable @update:model-value="$emit('update:modelValue', $event)">
    <el-option v-for="c in classList" :key="c" :label="c" :value="c" />
  </el-select>
</template>

<script setup>
import { computed } from 'vue'
import { studentService } from '@/services/dataService'

defineProps({ modelValue: { type: String, default: '' } })
defineEmits(['update:modelValue'])

const classList = computed(() => studentService.getClasses())
</script>
