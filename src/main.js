import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'katex/dist/katex.min.css'
import 'echarts'
import VueECharts from 'vue-echarts'
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
app.use(router)
app.mount('#app')
