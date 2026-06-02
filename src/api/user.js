import request from '@/request/request.js'

export function getUserListHandler(params) { return request({ url: '/system/user/list', method: 'get', params }) }
export function getUserByIdHandler(id) { return request({ url: `/system/user/${id}`, method: 'get' }) }
export function createUserHandler(data) { return request({ url: '/system/user', method: 'post', data }) }
export function updateUserHandler(id, data) { return request({ url: `/system/user/${id}`, method: 'put', data }) }
export function deleteUserHandler(id) { return request({ url: `/system/user/${id}`, method: 'delete' }) }
export function getUserRolesHandler(id) { return request({ url: `/system/user/${id}/roles`, method: 'get' }) }
export function assignUserRolesHandler(id, roleIds) { return request({ url: `/system/user/${id}/roles`, method: 'put', data: { roleIds } }) }
