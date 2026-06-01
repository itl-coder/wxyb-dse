/**
 * 菜单权限相关 API
 */
import request from '@/request/request.js'

// ==================== 权限菜单 ====================

/**
 * 获取当前用户的权限菜单树（前端路由用）
 * @returns {Promise} { code, msg, data: [{ menuId, menuName, parentId, orderNum, path, component, menuType, visible, perms, icon, children }] }
 */
export function getUserMenuTreeHandler() {
  return request({
    url: '/system/menu/tree',
    method: 'get'
  })
}

/**
 * 获取全部菜单列表
 * @param {Object} args - { menuName, status }
 */
export function getMenuListHandler(args) {
  return request({
    url: '/system/menu/list',
    method: 'get',
    params: { ...args }
  })
}

/**
 * 获取全部菜单树（管理员用）
 */
export function getAllMenuTreeHandler() {
  return request({
    url: '/system/menu/tree/all',
    method: 'get'
  })
}

/**
 * 查询单个菜单
 * @param {number} id - 菜单ID
 */
export function getMenuByIdHandler(id) {
  return request({
    url: `/system/menu/${id}`,
    method: 'get'
  })
}

/**
 * 新增菜单
 * @param {Object} args
 */
export function createMenuHandler(args) {
  return request({
    url: '/system/menu',
    method: 'post',
    data: { ...args }
  })
}

/**
 * 修改菜单
 * @param {number} id - 菜单ID
 * @param {Object} args
 */
export function updateMenuHandler(id, args) {
  return request({
    url: `/system/menu/${id}`,
    method: 'put',
    data: { ...args }
  })
}

/**
 * 删除菜单
 * @param {number} id - 菜单ID
 */
export function deleteMenuHandler(id) {
  return request({
    url: `/system/menu/${id}`,
    method: 'delete'
  })
}
