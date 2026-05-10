<template>
  <div class="plogin">
    <ParallaxParticles />

    <!-- Left: Brand + Mascot Hero -->
    <div class="pl-hero">
      <div class="pl-hero-inner">
        <AiMascot />
        <div class="pl-brand">
          <h1 class="pl-brand-title">DSE 智能学情</h1>
          <p class="pl-brand-sub">读懂每一次进步 · 陪伴每一步成长</p>
        </div>

        <!-- Learning Report Preview Card -->
        <div class="pl-report">
          <div class="plr-head">
            <span class="plr-icon">📋</span>
            <span class="plr-title">学习报告预览</span>
          </div>
          <div class="plr-metrics">
            <div class="plr-metric">
              <span class="plrm-val">12</span>
              <span class="plrm-label">本周课时</span>
            </div>
            <div class="plr-metric">
              <span class="plrm-val up">85%</span>
              <span class="plrm-label">作业完成率</span>
            </div>
            <div class="plr-metric">
              <span class="plrm-val up">+3</span>
              <span class="plrm-label">获表扬次数</span>
            </div>
          </div>
          <div class="plr-quote">"持续稳定的投入，正在积累成可见的进步。"</div>
        </div>
      </div>
    </div>

    <!-- Right: Login Card -->
    <div class="pl-card">
      <div class="plc-header">
        <h2 class="plc-title">欢迎回来</h2>
        <p class="plc-desc">登录以查看专属学情报告</p>
      </div>

      <!-- Role Tabs -->
      <div class="plc-tabs">
        <button class="plc-tab" :class="{ on: role === 'student' }" @click="role = 'student'; clearErrors()">
          🎒 学生登录
        </button>
        <button class="plc-tab" :class="{ on: role === 'parent' }" @click="role = 'parent'; clearErrors()">
          👨‍👩‍👧 家长登录
        </button>
      </div>

      <!-- Login Form -->
      <form class="plc-form" @submit.prevent="handleLogin" autocomplete="off">
        <div class="plc-field" :class="{ bad: errors.phone }">
          <div class="plcf-label">手机号码</div>
          <input v-model="form.phone" type="tel" placeholder="请输入手机号" maxlength="11" autocomplete="off" @input="errors.phone = ''" />
          <span v-if="errors.phone" class="plc-err">{{ errors.phone }}</span>
        </div>

        <div class="plc-field" :class="{ bad: errors.captcha }">
          <div class="plcf-label">验证码</div>
          <div class="plc-captcha-row">
            <input v-model="form.captcha" placeholder="短信验证码" maxlength="6" autocomplete="off" @input="errors.captcha = ''" style="flex:1" @keydown.enter="handleLogin" />
            <button type="button" class="plc-captcha-btn" :disabled="countdown > 0" @click="sendCode">
              {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
            </button>
          </div>
          <span v-if="errors.captcha" class="plc-err">{{ errors.captcha }}</span>
        </div>

        <div v-if="errors.form" class="plc-alert">{{ errors.form }}</div>

        <GlowButton :loading="loading" :disabled="!form.phone || !form.captcha" accent="#6366f1">
          登 录
        </GlowButton>
      </form>

      <!-- Footer Links -->
      <div class="plc-footer">
        <span class="plcf-text">还没有账号？</span>
        <a href="#" class="plcf-link" @click.prevent="goRegister">免费注册</a>
        <span class="plcf-sep">|</span>
        <a href="#" class="plcf-link">体验账号</a>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="pl-foot">
      <router-link to="/">← 返回学习系统</router-link>
      <span class="pl-foot-sep">|</span>
      <router-link to="/login">管理后台 →</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ParallaxParticles from '@/components/login/ParallaxParticles.vue'
import GlowButton from '@/components/login/GlowButton.vue'
import AiMascot from '@/components/login/AiMascot.vue'

const router = useRouter()
const route = useRoute()

const role = ref('student')
const loading = ref(false)
const countdown = ref(0)
let countdownTimer = null

const form = reactive({ phone: '', captcha: '' })
const errors = reactive({ phone: '', captcha: '', form: '' })

function clearErrors() {
  Object.keys(errors).forEach(k => errors[k] = '')
}

function sendCode() {
  if (countdown.value > 0) return
  if (!form.phone || form.phone.length < 11) {
    errors.phone = '请输入正确的11位手机号'
    return
  }
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }, 1000)
}

function goRegister() {
  router.push('/portal/register')
}

onMounted(() => {
  if (localStorage.getItem('portal_token')) {
    router.replace('/portal')
  }
})

function handleLogin() {
  clearErrors()
  if (!form.phone || form.phone.length < 11) {
    errors.phone = '请输入正确的11位手机号'
    return
  }
  if (!form.captcha) {
    errors.captcha = '请输入验证码'
    return
  }
  if (form.captcha !== '123456') {
    errors.captcha = '验证码错误（测试码：123456）'
    form.captcha = ''
    return
  }

  loading.value = true
  setTimeout(() => {
    localStorage.setItem('portal_token', 'dse_portal_authenticated')
    localStorage.setItem('portal_user', JSON.stringify({
      name: role.value === 'student' ? '陈小明' : '陈爸爸',
      role: role.value === 'student' ? '学生' : '家长',
      phone: form.phone
    }))
    router.push(route.query.redirect || '/portal')
  }, 600)
}
</script>

<style scoped>
/* === Layout === */
.plogin {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  background: linear-gradient(135deg, #0c0f1a 0%, #13172a 30%, #0f1325 60%, #0a0d18 100%);
  padding: 32px;
  position: relative;
  overflow: hidden;
}

/* === Hero (Left) === */
.pl-hero {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  animation: heroIn 0.8s ease both;
}

.pl-hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

@keyframes heroIn {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

.pl-brand {
  text-align: center;
}

.pl-brand-title {
  font-size: 28px;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 6px;
  letter-spacing: 3px;
}

.pl-brand-sub {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.5);
  letter-spacing: 2px;
  margin: 0;
}

/* Learning Report Preview */
.pl-report {
  background: rgba(18, 22, 38, 0.5);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 16px;
  padding: 18px 22px;
  min-width: 240px;
  animation: heroIn 0.8s ease 0.2s both;
}

.plr-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.plr-icon { font-size: 16px; }

.plr-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(226, 232, 240, 0.7);
  letter-spacing: 0.5px;
}

.plr-metrics {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.plr-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.plrm-val {
  font-size: 20px;
  font-weight: 700;
  color: rgba(203, 213, 225, 0.7);
}

.plrm-val.up { color: #22c55e; }

.plrm-label {
  font-size: 10px;
  color: rgba(148, 163, 184, 0.4);
}

.plr-quote {
  font-size: 11px;
  color: rgba(139, 92, 246, 0.5);
  font-style: italic;
  text-align: center;
  line-height: 1.6;
}

/* === Login Card (Right) === */
.pl-card {
  position: relative;
  z-index: 2;
  width: 380px;
  max-width: 100%;
  background: rgba(18, 22, 38, 0.6);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 24px;
  padding: 36px 32px 28px;
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.03) inset,
    0 32px 80px rgba(0, 0, 0, 0.4),
    0 0 60px rgba(139, 92, 246, 0.03);
  animation: cardIn 0.8s ease 0.1s both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateX(30px) scale(0.97); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

.plc-header {
  text-align: center;
  margin-bottom: 22px;
}

.plc-title {
  font-size: 22px;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 4px;
}

.plc-desc {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.45);
  margin: 0;
}

/* Tabs */
.plc-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 3px;
}

.plc-tab {
  flex: 1;
  padding: 9px 0;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: rgba(148, 163, 184, 0.5);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.plc-tab:hover { color: #cbd5e1; }

.plc-tab.on {
  background: rgba(139, 92, 246, 0.12);
  color: #c4b5fd;
  font-weight: 600;
}

/* Form */
.plc-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.plc-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.plcf-label {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.45);
  letter-spacing: 1px;
}

.plc-field input {
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  color: #e2e8f0;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: all 0.2s;
}

.plc-field input::placeholder { color: rgba(148, 163, 184, 0.2); }

.plc-field input:focus {
  border-color: rgba(139, 92, 246, 0.35);
  background: rgba(139, 92, 246, 0.04);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.05);
}

.plc-field.bad input {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.04);
}

.plc-err {
  font-size: 11px;
  color: #f87171;
}

/* Captcha row */
.plc-captcha-row {
  display: flex;
  gap: 10px;
}

.plc-captcha-btn {
  width: 100px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(139, 92, 246, 0.12);
  background: rgba(139, 92, 246, 0.05);
  color: #a78bfa;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 0 8px;
}

.plc-captcha-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.25);
}

.plc-captcha-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Alert */
.plc-alert {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  font-size: 13px;
  text-align: center;
}

/* Footer */
.plc-footer {
  text-align: center;
  margin-top: 18px;
  font-size: 12px;
}

.plcf-text {
  color: rgba(148, 163, 184, 0.35);
}

.plcf-link {
  color: rgba(139, 92, 246, 0.55);
  text-decoration: none;
  transition: color 0.2s;
  margin: 0 4px;
}

.plcf-link:hover { color: rgba(139, 92, 246, 0.8); }

.plcf-sep {
  color: rgba(148, 163, 184, 0.15);
  margin: 0 4px;
}

/* === Bottom Nav === */
.pl-foot {
  position: absolute;
  bottom: 28px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
}

.pl-foot a {
  color: rgba(148, 163, 184, 0.3);
  text-decoration: none;
  transition: color 0.2s;
}

.pl-foot a:hover { color: rgba(148, 163, 184, 0.6); }

.pl-foot-sep { color: rgba(148, 163, 184, 0.15); }

/* === Responsive === */
@media (max-width: 800px) {
  .plogin {
    flex-direction: column;
    gap: 24px;
    padding: 24px 16px;
  }

  .pl-hero { order: -1; }

  .pl-report { display: none; }

  .pl-brand-title { font-size: 22px; }

  .pl-card {
    width: 100%;
    padding: 28px 20px 22px;
    border-radius: 18px;
  }
}
</style>
