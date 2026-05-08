<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <div class="l-icon">学</div>
        <h2>DSE 智能学情问诊系统</h2>
        <div class="login-sub">AI-Powered Student Assessment</div>
      </div>

      <!-- Login type tabs -->
      <div class="login-tabs">
        <button class="login-tab" :class="{ active: loginType === 'password' }" @click="loginType = 'password'">密码登录</button>
        <button class="login-tab" :class="{ active: loginType === 'sms' }" @click="loginType = 'sms'">短信登录</button>
        <button class="login-tab" :class="{ active: loginType === 'wechat' }" @click="loginType = 'wechat'">微信登录</button>
      </div>

      <!-- Password login -->
      <form v-if="loginType === 'password'" class="login-form" @submit.prevent="handlePasswordLogin">
        <div class="login-input-group">
          <label>手机号 / 工号</label>
          <input v-model="passwordForm.account" type="text" placeholder="请输入手机号或教职工工号" />
        </div>
        <div class="login-input-group">
          <label>密码</label>
          <input v-model="passwordForm.password" type="password" placeholder="请输入密码" />
        </div>
        <div class="login-extra">
          <a @click="loginType = 'sms'">验证码登录</a>
          <a>忘记密码？</a>
        </div>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <!-- SMS login -->
      <form v-else-if="loginType === 'sms'" class="login-form" @submit.prevent="handleSmsLogin">
        <div class="login-input-group">
          <label>手机号</label>
          <input v-model="smsForm.phone" type="tel" placeholder="请输入手机号" />
        </div>
        <div class="login-input-group">
          <label>验证码</label>
          <div class="login-sms-row">
            <input v-model="smsForm.code" type="text" placeholder="请输入验证码" maxlength="6" />
            <button type="button" class="login-btn secondary" style="width:auto;padding:10px 16px;margin-top:0;white-space:nowrap" :disabled="smsCountdown > 0" @click="sendSms">
              {{ smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <!-- WeChat QR login -->
      <div v-else class="login-form" style="text-align:center">
        <div style="width:180px;height:180px;background:var(--admin-bg);margin:0 auto 16px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid var(--admin-border)">
          <div style="text-align:center;color:var(--admin-text-muted)">
            <div style="font-size:48px;margin-bottom:8px">📱</div>
            <div style="font-size:12px">请使用微信扫一扫</div>
            <div style="font-size:10px;margin-top:4px">演示模式</div>
          </div>
        </div>
        <div class="login-extra" style="justify-content:center">
          <a @click="loginType = 'password'">返回密码登录</a>
        </div>
      </div>

      <div style="text-align:center;margin-top:20px;font-size:11px;color:var(--admin-text-muted)">
        <router-link to="/" style="color:var(--admin-accent);text-decoration:none">← 返回学习系统</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loginType = ref('password')
const loading = ref(false)
const smsCountdown = ref(0)

const passwordForm = reactive({ account: '', password: '' })
const smsForm = reactive({ phone: '', code: '' })

function handlePasswordLogin() {
  if (!passwordForm.account || !passwordForm.password) return
  loading.value = true
  // Mock login - in production this calls the API
  setTimeout(() => {
    localStorage.setItem('admin_token', 'mock_jwt_token')
    localStorage.setItem('admin_user', JSON.stringify({ name: '张老师', role: '班主任', id: 'T001' }))
    loading.value = false
    router.push('/admin')
  }, 800)
}

function handleSmsLogin() {
  if (!smsForm.phone || !smsForm.code) return
  loading.value = true
  setTimeout(() => {
    localStorage.setItem('admin_token', 'mock_jwt_token')
    localStorage.setItem('admin_user', JSON.stringify({ name: '张老师', role: '班主任', id: 'T001' }))
    loading.value = false
    router.push('/admin')
  }, 800)
}

function sendSms() {
  if (smsCountdown.value > 0 || !smsForm.phone) return
  smsCountdown.value = 60
  const timer = setInterval(() => {
    smsCountdown.value--
    if (smsCountdown.value <= 0) clearInterval(timer)
  }, 1000)
}
</script>
