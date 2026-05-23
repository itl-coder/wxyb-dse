<template>
  <div class="hsp-root">
    <div class="hsp-header">
      数据总览
      <span class="hsp-header-meta">{{ homeworks.length }} 条记录 · {{ subjectList.length }} 个科目</span>
    </div>

    <div class="hsp-grid">
      <!-- Row 1 Span 2: 各科目提交状态分布（堆叠柱状图） -->
      <div class="hsp-chart-block hsp-chart-wide">
        <div class="hsp-chart-title">各科目提交状态分布</div>
        <v-chart v-if="subjectStackOption" :option="subjectStackOption" autoresize style="height:320px" />
        <div v-else class="hsp-empty">暂无数据</div>
      </div>

      <!-- Row 2: 各科目提交率对比 -->
      <div class="hsp-chart-block">
        <div class="hsp-chart-title">各科目提交率</div>
        <v-chart v-if="submitRateOption" :option="submitRateOption" autoresize style="height:280px" />
        <div v-else class="hsp-empty">暂无数据</div>
      </div>

      <!-- Row 2: 各科正确率分布 -->
      <div class="hsp-chart-block">
        <div class="hsp-chart-title">各科目正确率分布</div>
        <v-chart v-if="accuracyBySubjectOption" :option="accuracyBySubjectOption" autoresize style="height:280px" />
        <div v-else class="hsp-empty">暂无数据</div>
      </div>

      <!-- Row 3: 正确率分段饼图 -->
      <div class="hsp-chart-block">
        <div class="hsp-chart-title">正确率分段总览</div>
        <v-chart v-if="accuracyPieOption" :option="accuracyPieOption" autoresize style="height:260px" />
        <div v-else class="hsp-empty">暂无数据</div>
      </div>

      <!-- Row 3: 学生预警 -->
      <div class="hsp-chart-block">
        <div class="hsp-chart-title">学生预警（未提交 &ge; 2次）</div>
        <div v-if="alertStudents.length" class="hsp-alert-list">
          <div v-for="(s, i) in alertStudents.slice(0, 12)" :key="s.name" class="hsp-alert-row">
            <span class="hsp-alert-rank">{{ i + 1 }}</span>
            <span class="hsp-alert-name">{{ s.name }}</span>
            <span class="hsp-alert-detail">{{ s.subjects.join('、') }}</span>
            <span class="hsp-alert-count">{{ s.count }}次</span>
          </div>
        </div>
        <div v-else class="hsp-empty">暂无预警</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { subjectColor } from '@/views/admin/homework/composables/useHomeworkShared'

use([CanvasRenderer, PieChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const props = defineProps({
  homeworks: { type: Array, default: () => [] },
  assignments: { type: Array, default: () => [] }
})

const STATUS_COLORS = {
  '已批改': '#3b82f6',
  '已提交': '#22c55e',
  '未提交': '#ef4444',
  '未完成': '#f97316',
  '部分完成': '#eab308',
  '已完成': '#10b981',
  '未到截止时间': '#94a3b8',
  '书籍/作业丢失': '#6366f1'
}

const ACCURACY_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

// ---- derived ----
const subjectList = computed(() => {
  return [...new Set(props.homeworks.map(h => h.subject || '未知'))].sort()
})

// ===== Chart 1: 各科目提交状态分布（堆叠柱状图） =====
const subjectStackOption = computed(() => {
  if (!props.homeworks.length) return null
  const subjects = subjectList.value
  const statusOrder = ['已批改', '已提交', '已完成', '部分完成', '未完成', '未提交', '未到截止时间', '书籍/作业丢失']

  // count per subject per status
  const matrix = {}
  subjects.forEach(s => {
    matrix[s] = {}
    statusOrder.forEach(st => { matrix[s][st] = 0 })
  })
  props.homeworks.forEach(h => {
    const s = h.subject || '未知'
    const st = h.submitStatus || h.status || '其他'
    if (matrix[s] && matrix[s][st] !== undefined) matrix[s][st]++
  })

  // only show statuses that have data
  const activeStatuses = statusOrder.filter(st =>
    subjects.some(s => matrix[s][st] > 0)
  )

  const series = activeStatuses.map(st => ({
    name: st,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    itemStyle: { color: STATUS_COLORS[st] || '#94a3b8', borderRadius: 0 },
    data: subjects.map(s => matrix[s][st] || 0)
  }))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: params => {
        const subj = params[0].axisValue
        let html = `<b>${subj}</b><br/>`
        let total = 0
        params.forEach(p => {
          if (p.value > 0) html += `${p.marker} ${p.seriesName}: ${p.value}<br/>`
          total += p.value
        })
        html += `<b>合计: ${total}</b>`
        return html
      }
    },
    legend: {
      data: activeStatuses,
      textStyle: { color: 'var(--admin-text-muted)', fontSize: 10 },
      top: 0
    },
    grid: { left: 90, right: 24, top: 36, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLabel: { color: 'var(--admin-text-muted)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'var(--admin-border)' } }
    },
    yAxis: {
      type: 'category',
      data: subjects,
      axisLabel: { color: 'var(--admin-text)', fontSize: 11, fontWeight: 500 },
      axisLine: { lineStyle: { color: 'var(--admin-border)' } }
    },
    series
  }
})

// ===== Chart 2: 各科目提交率（水平柱状图 + 数据标签） =====
const submitRateOption = computed(() => {
  if (!props.homeworks.length) return null
  const subjects = subjectList.value

  const data = subjects.map(s => {
    const list = props.homeworks.filter(h => (h.subject || '未知') === s)
    const submitted = list.filter(h =>
      h.submitStatus === '已提交' || h.submitStatus === '已批改'
    ).length
    return {
      name: s,
      value: list.length ? Math.round((submitted / list.length) * 100) : 0,
      detail: `${submitted}/${list.length}`
    }
  }).sort((a, b) => b.value - a.value)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: p => `${p[0].name}<br/>提交率: <b>${p[0].value}%</b><br/>${p[0].data.detail}`
    },
    grid: { left: 90, right: 60, top: 8, bottom: 20 },
    xAxis: {
      type: 'value', max: 100,
      axisLabel: { color: 'var(--admin-text-muted)', fontSize: 9, formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'var(--admin-border)' } }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { color: 'var(--admin-text)', fontSize: 11, fontWeight: 500 }
    },
    series: [{
      type: 'bar',
      data: data.map(d => ({
        value: d.value,
        detail: d.detail,
        itemStyle: {
          color: d.value >= 80 ? '#22c55e' : d.value >= 60 ? '#eab308' : '#ef4444',
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barMaxWidth: 20,
      label: {
        show: true, position: 'right',
        color: 'var(--admin-text-secondary)', fontSize: 9,
        formatter: p => `${p.value}%  ${p.data.detail}`
      }
    }]
  }
})

// ===== Chart 3: 各科目正确率分布 =====
const accuracyBySubjectOption = computed(() => {
  const list = props.homeworks.filter(h => h.accuracy != null)
  if (!list.length) return null

  const subjects = [...new Set(list.map(h => h.subject || '未知'))].sort()
  const ranges = [
    { label: '0-59', min: 0, max: 59, color: '#ef4444' },
    { label: '60-69', min: 60, max: 69, color: '#f97316' },
    { label: '70-79', min: 70, max: 79, color: '#eab308' },
    { label: '80-89', min: 80, max: 89, color: '#22c55e' },
    { label: '90-100', min: 90, max: 100, color: '#3b82f6' }
  ]

  const series = ranges.map(r => ({
    name: r.label,
    type: 'bar',
    stack: 'accuracy',
    emphasis: { focus: 'series' },
    itemStyle: { color: r.color },
    data: subjects.map(s => {
      const slist = list.filter(h => (h.subject || '未知') === s)
      return slist.filter(h => h.accuracy >= r.min && h.accuracy <= r.max).length
    })
  }))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: params => {
        let html = `<b>${params[0].axisValue}</b><br/>`
        params.forEach(p => {
          if (p.value > 0) html += `${p.marker} ${p.seriesName}分: ${p.value}人<br/>`
        })
        return html
      }
    },
    legend: {
      data: ranges.map(r => r.label),
      textStyle: { color: 'var(--admin-text-muted)', fontSize: 10 },
      top: 0
    },
    grid: { left: 90, right: 16, top: 36, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLabel: { color: 'var(--admin-text-muted)', fontSize: 9 },
      splitLine: { lineStyle: { color: 'var(--admin-border)' } }
    },
    yAxis: {
      type: 'category', data: subjects,
      axisLabel: { color: 'var(--admin-text)', fontSize: 11, fontWeight: 500 }
    },
    series
  }
})

// ===== Chart 4: 正确率分段总览饼图 =====
const accuracyPieOption = computed(() => {
  const vals = props.homeworks.filter(h => h.accuracy != null).map(h => h.accuracy)
  if (!vals.length) return null

  const buckets = [
    { name: '0-59分', min: 0, max: 59 },
    { name: '60-69分', min: 60, max: 69 },
    { name: '70-79分', min: 70, max: 79 },
    { name: '80-89分', min: 80, max: 89 },
    { name: '90-100分', min: 90, max: 100 }
  ]
  const data = buckets.map((b, i) => ({
    name: b.name,
    value: vals.filter(v => v >= b.min && v <= b.max).length,
    itemStyle: { color: ACCURACY_COLORS[i] }
  })).filter(d => d.value > 0)

  const total = vals.length
  const avg = Math.round(vals.reduce((s, v) => s + v, 0) / total)

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    graphic: {
      type: 'text',
      left: 'center', top: '46%',
      style: {
        text: `${avg}%`,
        textAlign: 'center',
        fill: 'var(--admin-text)',
        fontSize: 22,
        fontWeight: 700
      }
    },
    series: [{
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: false,
      label: {
        color: 'var(--admin-text-muted)', fontSize: 9,
        formatter: '{b}\n{d}%'
      },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
      data
    }]
  }
})

// ===== 学生预警 =====
const alertStudents = computed(() => {
  const map = {}
  props.homeworks.forEach(h => {
    const isMissing = h.submitStatus === '未提交' || h.status === '未提交' || h.status === '未完成'
    if (!isMissing) return
    const key = h.studentName || h.name
    if (!key) return
    if (!map[key]) map[key] = { count: 0, subjects: [] }
    map[key].count++
    if (!map[key].subjects.includes(h.subject)) map[key].subjects.push(h.subject)
  })
  return Object.entries(map)
    .filter(([, v]) => v.count >= 2)
    .map(([name, v]) => ({ name, count: v.count, subjects: v.subjects }))
    .sort((a, b) => b.count - a.count)
})
</script>

<style scoped>
.hsp-root {
  padding: 16px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
}
.hsp-header {
  font-size: 14px; font-weight: 700; color: var(--admin-text);
  letter-spacing: 0.5px; padding-bottom: 10px;
  border-bottom: 1px solid var(--admin-border);
  margin-bottom: 14px;
  display: flex; align-items: baseline; gap: 12px;
}
.hsp-header-meta {
  font-size: 11px; font-weight: 400; color: var(--admin-text-muted);
}

/* 2-column grid */
.hsp-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.hsp-chart-block {
  background: var(--admin-bg);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius);
  padding: 14px;
}
.hsp-chart-wide {
  grid-column: span 2;
}
.hsp-chart-title {
  font-size: 12px; font-weight: 600; color: var(--admin-text-secondary);
  margin-bottom: 10px;
}
.hsp-empty {
  text-align: center; padding: 32px 16px; font-size: 12px; color: var(--admin-text-muted);
}

/* Alert list */
.hsp-alert-list {
  display: flex; flex-direction: column; gap: 5px;
  max-height: 220px; overflow-y: auto;
}
.hsp-alert-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 6px; font-size: 11px;
  background: rgba(239,68,68,0.05);
  border-left: 3px solid var(--admin-danger);
}
.hsp-alert-rank {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--admin-danger); color: #fff;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hsp-alert-name { color: var(--admin-text); font-weight: 600; min-width: 48px; }
.hsp-alert-detail {
  flex: 1; color: var(--admin-text-muted); font-size: 10px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hsp-alert-count { color: var(--admin-danger); font-weight: 700; flex-shrink: 0; }

@media (max-width: 1100px) {
  .hsp-grid { grid-template-columns: 1fr; }
  .hsp-chart-wide { grid-column: span 1; }
}
</style>
