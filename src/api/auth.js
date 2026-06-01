/**
 * 认证相关 API — 登录 / 注册 / 用户信息 / 短信 / 微信
 */
import request from '@/request/request.js'

// ==================== 账号密码登录 ====================

/**
 * 账号密码登录（支持用户名或手机号）
 * @param {Object} args - { username, password, rememberMe }
 * @returns {Promise} { code, msg, data: { accessToken, refreshToken, expiresAt, userId, username, nickName, avatar } }
 */
export function loginHandler(args) {
  return request({
    url: '/login',
    method: 'post',
    data: { ...args }
  })
}

// ==================== 短信验证码 ====================

/**
 * 发送短信验证码
 * @param {Object} args - { phone }
 */
export function sendSmsHandler(args) {
  return request({
    url: '/sms/send',
    method: 'post',
    data: { ...args }
  })
}

/**
 * 手机验证码登录（首次自动注册）
 * @param {Object} args - { phone, code }
 */
export function loginBySmsHandler(args) {
  return request({
    url: '/login/sms',
    method: 'post',
    data: { ...args }
  })
}

// ==================== 微信扫码登录 ====================

/**
 * 微信扫码登录（首次自动注册）
 * @param {Object} args - { code }
 */
export function loginByWechatHandler(args) {
  return request({
    url: '/login/wechat',
    method: 'post',
    data: { ...args }
  })
}

// ==================== 用户注册 ====================

/**
 * 注册新用户
 * @param {Object} args - { username, password, nickName }
 */
export function registerHandler(args) {
  return request({
    url: '/register',
    method: 'post',
    data: { ...args }
  })
}

// ==================== 账号绑定 ====================

/**
 * 绑定手机号（需登录）
 * @param {Object} args - { phone, code }
 */
export function bindPhoneHandler(args) {
  return request({
    url: '/bind/phone',
    method: 'post',
    data: { ...args }
  })
}

/**
 * 绑定微信（需登录）
 * @param {Object} args - { code }
 */
export function bindWechatHandler(args) {
  return request({
    url: '/bind/wechat',
    method: 'post',
    data: { ...args }
  })
}

// ==================== 当前用户信息 ====================

/**
 * 获取当前登录用户信息
 * @returns {Promise} { code, msg, data: { userId, username, nickName, email, phoneNumber, sex, avatar, ... } }
 */
export function getUserInfoHandler() {
  return request({
    url: '/user/info',
    method: 'get'
  })
}
