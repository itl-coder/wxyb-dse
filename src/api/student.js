/**
 * 学生管理 API
 */
import request from '@/request/request.js'

/** 全量列表 */
export function getAllStudentsHandler() {
  return request({ url: '/dse/students/all', method: 'get' })
}

/** 分页列表 */
export function getStudentPageHandler(page = 1, size = 20) {
  return request({ url: '/dse/students/page', method: 'get', params: { page, size } })
}

/** 详情 */
export function getStudentByIdHandler(id) {
  return request({ url: `/dse/students/${id}`, method: 'get' })
}

/** 新增 */
export function createStudentHandler(data) {
  return request({ url: '/dse/students', method: 'post', data })
}

/** 修改 */
export function updateStudentHandler(id, data) {
  return request({ url: `/dse/students/${id}`, method: 'put', data })
}

/** 删除 */
export function deleteStudentHandler(id) {
  return request({ url: `/dse/students/${id}`, method: 'delete' })
}

/** 班级列表 */
export function getClassListHandler() {
  return request({ url: '/dse/students/classes', method: 'get' })
}

/** 校区列表 */
export function getCampusListHandler() {
  return request({ url: '/dse/students/campuses', method: 'get' })
}
