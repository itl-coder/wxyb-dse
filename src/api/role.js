/**
 * 角色管理 API
 */
import request from '@/request/request.js'

/** 角色列表 */
export function getRoleListHandler(params) {
  return request({ url: '/system/role/list', method: 'get', params })
}

/** 角色详情（含菜单权限） */
export function getRoleByIdHandler(id) {
  return request({ url: `/system/role/${id}`, method: 'get' })
}

/** 新增 */
export function createRoleHandler(data) {
  return request({ url: '/system/role', method: 'post', data })
}

/** 修改 */
export function updateRoleHandler(id, data) {
  return request({ url: `/system/role/${id}`, method: 'put', data })
}

/** 删除 */
export function deleteRoleHandler(id) {
  return request({ url: `/system/role/${id}`, method: 'delete' })
}

/** 获取角色的菜单ID列表 */
export function getRoleMenuIdsHandler(id) {
  return request({ url: `/system/role/${id}/menus`, method: 'get' })
}

/** 分配菜单权限 */
export function assignRoleMenusHandler(id, menuIds) {
  return request({ url: `/system/role/${id}/menus`, method: 'put', data: { menuIds } })
}
