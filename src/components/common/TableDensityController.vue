<template>
  <div class="tdc-root">
    <span class="tdc-label">密度</span>
    <el-radio-group
      v-model="densityModel"
      size="small"
      @change="setDensity"
    >
      <el-radio-button
        v-for="opt in densityOptions"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script setup>
/**
 * 全局表格密度切换组件
 * 紧凑 / 默认 / 宽松 三态切换，localStorage 持久化
 * used by: 所有含 el-table 的管理页面
 */
import { computed } from 'vue'
import { useTableDensity } from '@/composables/useTableDensity'

const { density, setDensity, densityOptions } = useTableDensity()

const densityModel = computed({
  get: () => density.value,
  set: val => setDensity(val)
})
</script>

<style scoped>
.tdc-root {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tdc-label {
  font-size: 11px;
  color: var(--admin-text-muted);
  white-space: nowrap;
}
</style>
