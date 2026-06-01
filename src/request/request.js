/**
 * Axios 请求封装 — 统一请求/响应拦截
 *
 * 功能：
 *   - 请求拦截：自动注入 Bearer Token
 *   - 响应拦截：提取 response.data + 统一错误处理
 *   - Token 过期自动跳转登录页
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000
})

// ==================== 请求拦截器 ====================
request.interceptors.request.use(
  (config) => {
    // 注入 Token（Bearer 认证）
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ==================== 响应拦截器 ====================
request.interceptors.response.use(
  (response) => {
    // 后端统一返回 { code, msg, data }，直接提取 data
    const res = response.data

    // 如果后端返回失败 code（非 200），也走错误处理
    if (res.code && res.code !== 200) {
      ElMessage({
        type: 'error',
        message: res.msg || '请求失败'
      })
      return Promise.reject(new Error(res.msg || '请求失败'))
    }

    return res
  },
  (error) => {
    // 处理网络错误（无响应 / 超时）
    let msg = ''
    const status = error.response?.status

    switch (status) {
      case 401:
        msg = 'Token 已过期，请重新登录'
        // 清除旧 token，跳转登录页
        localStorage.removeItem('admin_token')
        localStorage.removeItem('dse_admin_user')
        window.location.href = '/login'
        break
      case 403:
        msg = '无权访问'
        break
      case 404:
        msg = '请求地址错误'
        break
      case 500:
        msg = '服务器出现问题'
        break
      default:
        msg = error.message === 'Network Error' ? '网络连接失败' : '请求异常'
    }

    ElMessage({
      type: 'error',
      message: msg
    })

    return Promise.reject(error)
  }
)

export default request
