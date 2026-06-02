/**
 * DSE 业务通用 API — 后端 DseBaseController 统一 CRUD 模式
 *
 * 使用: import { dseApi } from '@/api/dse'
 *       dseApi('behavior').getAll()       → GET /dse/behavior/all
 *       dseApi('behavior').create(data)   → POST /dse/behavior
 */
import request from '@/request/request.js'

export function dseApi(entity) {
  const base = `/dse/${entity}`
  return {
    getAll: () => request({ url: `${base}/all`, method: 'get' }),
    getById: (id) => request({ url: `${base}/${id}`, method: 'get' }),
    create: (data) => request({ url: base, method: 'post', data }),
    update: (id, data) => request({ url: `${base}/${id}`, method: 'put', data }),
    delete: (id) => request({ url: `${base}/${id}`, method: 'delete' }),
    // 自定义请求
    custom: (method, path, data) => request({ url: `${base}/${path}`, method, data }),
  }
}
