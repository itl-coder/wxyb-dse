/**
 * DSE ECharts 主题工具
 * 读取 CSS 自定义属性，生成 ECharts 主题配置
 * Portal 和 Admin 两套主题，自动适配暗色/亮色
 */

/**
 * 从 :root 读取 CSS 变量值
 */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/**
 * 解析 CSS 变量 rgb 字符串为 rgba
 * 支持格式: #RRGGBB 或 r g b
 */
function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(99,102,241,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Portal 端图表主题
 * 用于 MyExams / 学习报告等学生端页面
 */
export function portalChartTheme() {
  const textMain = cssVar('--text-primary') || '#1A1A24'
  const textMuted = cssVar('--text-muted') || '#A0A0B0'
  const textSecondary = cssVar('--text-secondary') || '#78788E'
  const borderLight = cssVar('--border-lighter') || '#F5F3F0'
  const borderBase = cssVar('--border-base') || '#E0DDD8'
  const cardBg = cssVar('--card-bg') || '#FFFFFF'

  const primary = cssVar('--chart-1') || '#6366F1'
  const cyan = cssVar('--chart-2') || '#06B6D4'
  const green = cssVar('--chart-3') || '#10B981'
  const amber = cssVar('--chart-4') || '#F59E0B'
  const red = cssVar('--chart-5') || '#EF4444'
  const violet = cssVar('--chart-6') || '#8B5CF6'
  const pink = cssVar('--chart-7') || '#EC4899'
  const orange = cssVar('--chart-8') || '#F97316'
  const blue = cssVar('--chart-9') || '#3B82F6'
  const teal = cssVar('--chart-10') || '#14B8A6'

  return {
    color: [primary, cyan, green, amber, red, violet, pink, orange, blue, teal],

    textStyle: {
      fontFamily: cssVar('--font-body') || "'PingFang SC','Microsoft YaHei',sans-serif",
    },

    tooltip: {
      backgroundColor: cardBg || '#FFFFFF',
      borderColor: borderBase,
      textStyle: { color: textMain, fontSize: 13 },
      extraCssText: 'box-shadow: var(--shadow-md); border-radius: var(--radius-sm);',
    },

    legend: {
      textStyle: { color: textSecondary, fontSize: 12 },
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
    },

    grid: {
      top: 40,
      right: 24,
      bottom: 32,
      left: 48,
      containLabel: true,
    },

    xAxis: {
      axisLine: { lineStyle: { color: borderLight } },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 11 },
      splitLine: { show: false },
    },

    yAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: borderLight, type: 'dashed' } },
    },

    categoryAxis: {
      axisLine: { lineStyle: { color: borderLight } },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 11 },
    },

    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: borderLight, type: 'dashed' } },
    },
  }
}

/**
 * 获取单条折线/柱状的渐变 areaStyle 配置
 * @param {string} hexColor - 主色 hex
 * @param {number} topAlpha - 顶部透明度
 * @param {number} bottomAlpha - 底部透明度
 */
export function gradientArea(hexColor, topAlpha = 0.22, bottomAlpha = 0.02) {
  return {
    color: {
      type: 'linear',
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: hexToRgba(hexColor, topAlpha) },
        { offset: 1, color: hexToRgba(hexColor, bottomAlpha) },
      ],
    },
  }
}

/**
 * 获取主色带渐变区域的 series 通用样式
 * @param {string} hexColor
 */
export function lineSeriesStyle(hexColor) {
  return {
    lineStyle: { color: hexColor, width: 2.5 },
    itemStyle: { color: hexColor, borderColor: '#fff', borderWidth: 2 },
    areaStyle: gradientArea(hexColor),
    symbol: 'circle',
    symbolSize: 7,
  }
}

/**
 * Admin 端图表主题
 * 读取 body 上 .admin-layout 的 CSS 变量，适配暗色/亮色
 */
export function adminChartTheme() {
  const el = document.querySelector('.admin-layout') || document.documentElement
  const style = getComputedStyle(el)

  const get = (name) => style.getPropertyValue(name).trim()

  const bg = get('--admin-surface') || '#0D1323'
  const textMain = get('--admin-text') || '#E4ECF6'
  const textMuted = get('--admin-text-muted') || '#4A5470'
  const textSecondary = get('--admin-text-secondary') || '#8899B4'
  const borderBase = get('--admin-border') || '#1A2340'
  const borderLight = get('--admin-border-light') || '#243050'
  const accent = get('--admin-accent') || '#6366F1'

  const primary = cssVar('--chart-1') || '#6366F1'
  const cyan = cssVar('--chart-2') || '#06B6D4'
  const green = cssVar('--chart-3') || '#10B981'
  const amber = cssVar('--chart-4') || '#F59E0B'
  const red = cssVar('--chart-5') || '#EF4444'
  const violet = cssVar('--chart-6') || '#8B5CF6'
  const pink = cssVar('--chart-7') || '#EC4899'
  const orange = cssVar('--chart-8') || '#F97316'
  const blue = cssVar('--chart-9') || '#3B82F6'
  const teal = cssVar('--chart-10') || '#14B8A6'

  return {
    color: [primary, cyan, green, amber, red, violet, pink, orange, blue, teal],

    textStyle: {
      fontFamily: cssVar('--font-body') || "'PingFang SC','Microsoft YaHei',sans-serif",
    },

    tooltip: {
      backgroundColor: bg,
      borderColor: borderBase,
      textStyle: { color: textMain, fontSize: 13 },
    },

    legend: {
      textStyle: { color: textSecondary, fontSize: 12 },
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
    },

    grid: {
      top: 40,
      right: 24,
      bottom: 32,
      left: 48,
      containLabel: true,
    },

    xAxis: {
      axisLine: { lineStyle: { color: borderLight } },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 11 },
      splitLine: { show: false },
    },

    yAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: borderLight, type: 'dashed' } },
    },

    categoryAxis: {
      axisLine: { lineStyle: { color: borderLight } },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 11 },
    },

    valueAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 11 },
      splitLine: { lineStyle: { color: borderLight, type: 'dashed' } },
    },
  }
}
