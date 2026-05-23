/**
 * 应用入口 — 初始化顺序：
 *   1. 导入样式（Element Plus → KaTeX → 自定义 tokens → main → admin）
 *   2. initAllData() 往 localStorage 播种默认数据
 *   3. 创建 Vue 应用 → 注册全局组件/插件 → 挂载到 #app
 *
 * 注意：样式导入顺序影响级联优先级，不要随意调整。
 */
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'katex/dist/katex.min.css'
import 'echarts'
import VueECharts from 'vue-echarts'
import print from 'vue3-print-nb'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import { initAllData } from './services/dataService'
import './styles/tokens.css'
import './styles/main.css'
import './styles/admin.css'

initAllData()

const app = createApp(App)
app.component('VChart', VueECharts)
app.use(ElementPlus, { locale: zhCn })
app.use(pinia)
app.use(print)
app.use(router)
app.mount('#app')
