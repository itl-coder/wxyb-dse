<template>
  <div class="alogin">
    <TechParticles />

    <div class="al-shell">
      <!-- Left: Brand + AI Dashboard -->
      <div class="al-hero">
        <div class="al-brand">
          <div class="al-logo">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="4" y1="2" x2="28" y2="30">
                  <stop offset="0%" stop-color="#818cf8" />
                  <stop offset="50%" stop-color="#6366f1" />
                  <stop offset="100%" stop-color="#06b6d4" />
                </linearGradient>
              </defs>
              <path d="M16 2L4 8v10c0 7.18 5.12 13.88 12 15.46 6.88-1.58 12-8.28 12-15.46V8L16 2z" stroke="url(#logoGrad)" stroke-width="1.6" stroke-linejoin="round"/>
              <path d="M12 16l3 3 6-6" stroke="url(#logoGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>DSE 学情指挥中心</h1>
          <p>AI 驱动的精准教学 · 智能分析引擎</p>
          <div class="al-brand-line"></div>
        </div>

        <div class="al-dash">
          <div class="ald-card">
            <div class="ald-card-top">
              <div class="ald-card-icon trend">📊</div>
              <div class="ald-card-hd">
                <span class="ald-card-title">学业趋势</span>
                <span class="ald-badge up">+3.2%</span>
              </div>
            </div>
            <div class="ald-chart">
              <div class="ald-bar-wrap" v-for="(h, i) in [62, 75, 58, 88, 72, 90, 79]" :key="i">
                <div class="ald-bar" :style="{ height: h + '%' }"></div>
              </div>
            </div>
            <div class="ald-foot-row">
              <span class="ald-foot-label">近 7 次考试均分</span>
              <span class="ald-foot-val">82.4</span>
            </div>
          </div>

          <div class="ald-card">
            <div class="ald-card-top">
              <div class="ald-card-icon risk">⚠</div>
              <div class="ald-card-hd">
                <span class="ald-card-title">风险预警</span>
                <span class="ald-card-count">3</span>
              </div>
            </div>
            <div class="ald-warn-list">
              <div class="ald-warn-item" v-for="w in warnings" :key="w.text">
                <span class="ald-warn-dot" :style="{ background: w.color }"></span>
                <span>{{ w.text }}</span>
              </div>
            </div>
          </div>

          <div class="ald-card">
            <div class="ald-card-top">
              <div class="ald-card-icon sys">⊞</div>
              <div class="ald-card-hd">
                <span class="ald-card-title">系统状态</span>
                <span class="ald-status-tag">ONLINE</span>
              </div>
            </div>
            <div class="ald-sys-grid">
              <div class="ald-sys-item">
                <span class="ald-sys-num">12,847</span>
                <span class="ald-sys-label">今日处理</span>
              </div>
              <div class="ald-sys-item">
                <span class="ald-sys-num">99.7%</span>
                <span class="ald-sys-label">正常运行</span>
              </div>
              <div class="ald-sys-item">
                <span class="ald-sys-num">4.2ms</span>
                <span class="ald-sys-label">响应延迟</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Login Card -->
      <div class="al-card-col">
        <AnimatedBorder :opacity="0.15" :speed="12" :radius="20">
          <div class="al-card">
            <div class="al-card-inner">
              <div class="al-card-accent"></div>

              <div class="al-status-pill">
                <span class="al-status-dot"></span>
                <span>SYSTEM · SECURE</span>
                <span class="al-status-ver">v3.2</span>
              </div>

              <div class="al-tabs">
                <button class="al-tab" :class="{ on: loginType === 'password' }" @click="loginType = 'password'; clearErrors()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
                  <span>密码登录</span>
                </button>
                <button class="al-tab" :class="{ on: loginType === 'qr' }" @click="loginType = 'qr'; clearErrors()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v3M14 21h3M21 21v-3"/></svg>
                  <span>扫码登录</span>
                </button>
              </div>

              <form v-if="loginType === 'password'" class="al-form" @submit.prevent="handleLogin" autocomplete="off">
                <FloatingInput
                  v-model="form.account"
                  placeholder="管理员账号"
                  icon="👤"
                  :error="errors.account"
                  autocomplete="off"
                  @update:model-value="errors.account = ''"
                />

                <FloatingInput
                  v-model="form.password"
                  placeholder="管理员密码"
                  type="password"
                  icon="🔑"
                  :error="errors.password"
                  autocomplete="off"
                  @update:model-value="errors.password = ''"
                />

                <div class="al-captcha-row">
                  <div class="al-captcha-field">
                    <FloatingInput
                      v-model="form.captcha"
                      placeholder="验证码"
                      icon="🔐"
                      :error="errors.captcha"
                      maxlength="4"
                      autocomplete="off"
                      @update:model-value="errors.captcha = ''"
                    />
                  </div>
                  <button type="button" class="al-captcha-box" @click="genCaptcha">{{ captchaText }}</button>
                </div>

                <div class="al-roles">
                  <button type="button" v-for="r in roles" :key="r.value" class="al-role" :class="{ picked: form.role === r.value }" @click="form.role = r.value">
                    <span class="al-role-dot"></span>
                    {{ r.label }}
                  </button>
                </div>

                <div v-if="errors.form" class="al-alert">{{ errors.form }}</div>

                <GlowButton type="submit" :disabled="!form.account || !form.password || !form.captcha" :loading="loading" accent="#6366f1" accentEnd="#06b6d4">
                  <span v-if="!loading">
                    <span>授 权 登 录</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:6px"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </span>
                </GlowButton>

                <div class="al-links">
                  <a href="#">忘记密码</a>
                  <span class="al-link-sep">·</span>
                  <a href="#">申请权限</a>
                </div>
              </form>

              <div v-else class="al-qr">
                <div class="al-qr-box">
                  <svg width="110" height="110" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="0.4">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="15" width="7" height="7" rx="1"/>
                    <rect x="14.5" y="14.5" width="3" height="3" rx="0.5"/><rect x="20" y="14.5" width="2" height="2" rx="0.5"/>
                    <rect x="14.5" y="20" width="3" height="2" rx="0.5"/><rect x="19.5" y="19" width="2.5" height="3" rx="0.5"/>
                    <rect x="4" y="4" width="2" height="2" rx="0.3"/><rect x="16" y="4" width="2" height="2" rx="0.3"/>
                    <rect x="4" y="16" width="2" height="2" rx="0.3"/>
                  </svg>
                  <p>微信扫码登录</p>
                </div>
                <p class="al-qr-refresh" @click="genCaptcha">⟳ 刷新二维码</p>
              </div>
            </div>
          </div>
        </AnimatedBorder>
      </div>
    </div>

    <div class="al-foot">
      <router-link to="/">← 返回学习系统</router-link>
      <span class="al-foot-sep">|</span>
      <router-link to="/portal/login">门户登录 →</router-link>
    </div>
  </div>
</template>

<script setup>
/**
 * 页面：管理员登录
 * 功能：密码登录与微信扫码登录，含验证码校验、角色选择、数据看板预览
 * 路由：/admin/login
 */
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import TechParticles from '@/components/login/TechParticles.vue'
import AnimatedBorder from '@/components/login/AnimatedBorder.vue'
import FloatingInput from '@/components/login/FloatingInput.vue'
import GlowButton from '@/components/login/GlowButton.vue'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const loginType = ref('password')
const loading = ref(false)
const captchaText = ref('A3K9')

const form = reactive({ account: '', password: '', captcha: '', role: 'admin' })
const errors = reactive({ account: '', password: '', captcha: '', form: '' })

const roles = [
  { label: '管理员', value: 'admin' },
  { label: '教师', value: 'teacher' },
  { label: '教务', value: 'dean' }
]

const warnings = [
  { text: '2名学生连续3天缺勤', color: '#ef4444' },
  { text: '5D班数学作业提交率 < 70%', color: '#f59e0b' },
  { text: '1条心理辅导提醒待处理', color: '#f59e0b' }
]

function clearErrors() { Object.keys(errors).forEach(k => errors[k] = '') }

function genCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  captchaText.value = s
}

onMounted(() => {
  if (localStorage.getItem('admin_token') && store.isAuthenticated) router.replace('/admin')
  genCaptcha()
})

async function handleLogin() {
  clearErrors()
  if (!form.account.trim()) { errors.account = '请输入账号'; return }
  if (!form.password) { errors.password = '请输入密码'; return }
  if (!form.captcha) { errors.captcha = '请输入验证码'; return }
  if (form.captcha.toUpperCase() !== captchaText.value) {
    errors.captcha = '验证码错误'
    genCaptcha()
    form.captcha = ''
    return
  }

  loading.value = true
  try {
    const result = await store.login(form.account.trim(), form.password)
    if (!result.success) {
      errors.form = result.error || '账号或密码错误'
      genCaptcha()
      form.captcha = ''
      loading.value = false
      return
    }
    router.push(route.query.redirect || '/admin')
  } catch (e) {
    errors.form = '网络异常，请稍后重试'
    loading.value = false
  }
}
</script>

<style scoped>
/* === Foundation === */
.alogin {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #030510;
  padding: 24px;
  padding-top: 80px;
  position: relative;
  overflow: hidden;
}

/* === Shell === */
.al-shell {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: stretch;
  gap: 48px;
  max-width: 1040px;
  width: 100%;
}

/* === Hero (Left) === */
.al-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: heroIn 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) both;
  min-width: 0;
}

@keyframes heroIn {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Brand */
.al-brand {
  text-align: center;
  padding: 8px 0 4px;
}

.al-logo {
  width: 60px; height: 60px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  backdrop-filter: blur(10px);
}

.al-logo::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 17px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.4));
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

.al-logo::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), transparent 40%, rgba(6, 182, 212, 0.1));
  filter: blur(8px);
  z-index: -1;
}

.al-brand h1 {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #e4e6f2 0%, #a5b4fc 50%, #67e8f9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 6px;
  letter-spacing: 2px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.al-brand p {
  font-size: 10px;
  color: rgba(148, 163, 184, 0.35);
  letter-spacing: 3px;
  margin: 0;
  font-family: 'Cascadia Code', 'SF Mono', 'Consolas', monospace;
}

.al-brand-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), rgba(6, 182, 212, 0.3), transparent);
  margin: 12px auto 0;
}

/* === Dashboard Cards === */
.al-dash {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ald-card {
  background: rgba(10, 14, 28, 0.7);
  border: 1px solid rgba(99, 102, 241, 0.07);
  border-radius: 14px;
  padding: 16px 18px;
  backdrop-filter: blur(12px);
  animation: cardFade 0.5s ease both;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s, background 0.3s;
}

.ald-card:hover {
  border-color: rgba(99, 102, 241, 0.15);
  background: rgba(14, 18, 34, 0.8);
}

.ald-card::before {
  content: '';
  position: absolute;
  top: 0; left: 12px; right: 12px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.12), transparent);
}

.ald-card:nth-child(1) { animation-delay: 0.1s; }
.ald-card:nth-child(2) { animation-delay: 0.2s; }
.ald-card:nth-child(3) { animation-delay: 0.3s; }

@keyframes cardFade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.ald-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.ald-card-icon {
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}

.ald-card-icon.trend { background: rgba(99, 102, 241, 0.12); }
.ald-card-icon.risk { background: rgba(239, 68, 68, 0.1); }
.ald-card-icon.sys { background: rgba(34, 197, 94, 0.1); color: #4ade80; font-weight: 700; font-size: 18px; }

.ald-card-hd {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ald-card-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(203, 213, 236, 0.8);
  letter-spacing: 0.5px;
}

.ald-card-count {
  font-size: 10px;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  padding: 1px 7px;
  border-radius: 8px;
  font-weight: 600;
}

.ald-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 6px;
  font-weight: 600;
  font-family: 'Cascadia Code', 'SF Mono', monospace;
}

.ald-badge.up { background: rgba(34, 197, 94, 0.12); color: #4ade80; }

.ald-status-tag {
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(34, 197, 94, 0.12);
  color: #4ade80;
  font-weight: 700;
  letter-spacing: 1px;
  font-family: 'Cascadia Code', 'SF Mono', monospace;
}

/* Chart */
.ald-chart {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 40px;
  margin-bottom: 10px;
}

.ald-bar-wrap {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.ald-bar {
  width: 100%;
  background: linear-gradient(180deg, #818cf8 0%, #6366f1 60%, #4f46e5 100%);
  border-radius: 2px 2px 0 0;
  opacity: 0.7;
  transition: opacity 0.3s;
  min-height: 4px;
}

.ald-bar:hover { opacity: 1; }

.ald-foot-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.ald-foot-label { font-size: 10px; color: rgba(148, 163, 184, 0.4); }

.ald-foot-val {
  font-size: 16px;
  font-weight: 700;
  color: #4ade80;
  font-family: 'Cascadia Code', 'SF Mono', monospace;
}

/* Warnings */
.ald-warn-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.ald-warn-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(180, 190, 210, 0.55);
}

.ald-warn-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* System grid */
.ald-sys-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.ald-sys-item {
  text-align: center;
  padding: 6px 2px;
}

.ald-sys-num {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: rgba(203, 213, 236, 0.85);
  font-family: 'Cascadia Code', 'SF Mono', monospace;
}

.ald-sys-label {
  font-size: 9px;
  color: rgba(148, 163, 184, 0.35);
  letter-spacing: 0.5px;
}

/* === Login Card Column (Right) === */
.al-card-col {
  width: 390px;
  flex-shrink: 0;
  animation: cardIn 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) 0.15s both;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateX(30px) scale(0.98); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

.al-card {
  background: rgba(14, 18, 34, 0.85);
  backdrop-filter: blur(28px);
  border-radius: 20px;
  box-shadow:
    0 0 0 1px rgba(99, 102, 241, 0.04) inset,
    0 28px 72px rgba(0, 0, 0, 0.5),
    0 0 100px rgba(99, 102, 241, 0.04);
  overflow: hidden;
}

.al-card-inner {
  padding: 24px 28px 20px;
  position: relative;
}

/* Top accent line */
.al-card-accent {
  position: absolute;
  top: 0; left: 20px; right: 20px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4) 20%, rgba(6, 182, 212, 0.3) 80%, transparent);
  z-index: 2;
  pointer-events: none;
}

.al-card-accent::after {
  content: '';
  position: absolute;
  top: 0; left: 50%;
  transform: translateX(-50%);
  width: 60px; height: 1px;
  background: rgba(129, 140, 248, 0.6);
  animation: accentPulse 3s ease-in-out infinite;
}

@keyframes accentPulse {
  0%, 100% { opacity: 0.3; width: 40px; }
  50% { opacity: 1; width: 80px; }
}

/* System status pill */
.al-status-pill {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 9px;
  font-family: 'Cascadia Code', 'SF Mono', monospace;
  color: rgba(148, 163, 184, 0.3);
  letter-spacing: 2px;
}

.al-status-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.4);
  animation: statusGlow 2s ease-in-out infinite;
}

@keyframes statusGlow {
  0%, 100% { box-shadow: 0 0 4px rgba(74, 222, 128, 0.3); }
  50% { box-shadow: 0 0 8px rgba(74, 222, 128, 0.7); }
}

.al-status-ver {
  color: rgba(99, 102, 241, 0.3);
  margin-left: 2px;
}

/* === Tabs === */
.al-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 18px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  padding: 3px;
  position: relative;
  z-index: 1;
}

.al-tab {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: rgba(148, 163, 184, 0.4);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.al-tab svg { flex-shrink: 0; opacity: 0.5; transition: opacity 0.25s; }
.al-tab:hover { color: rgba(203, 213, 225, 0.65); }
.al-tab:hover svg { opacity: 0.75; }
.al-tab.on {
  background: rgba(99, 102, 241, 0.12);
  color: #a5b4fc;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
.al-tab.on svg { opacity: 1; }

/* === Form === */
.al-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  position: relative;
  z-index: 1;
}

/* Captcha */
.al-captcha-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.al-captcha-field {
  flex: 1;
  min-width: 0;
}

.al-captcha-box {
  width: 80px; height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: rgba(99, 102, 241, 0.06);
  color: #a5b4fc;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Cascadia Code', 'SF Mono', monospace;
  cursor: pointer;
  letter-spacing: 4px;
  transition: all 0.2s;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.al-captcha-box::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255, 255, 255, 0.02) 1px, rgba(255, 255, 255, 0.02) 2px);
  pointer-events: none;
}

.al-captcha-box:hover {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.4);
}

/* Roles */
.al-roles {
  display: flex;
  gap: 6px;
}

.al-role {
  flex: 1;
  padding: 7px 0;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.015);
  color: rgba(148, 163, 184, 0.4);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.al-role:hover { border-color: rgba(99, 102, 241, 0.2); color: #cbd5e1; }
.al-role.picked {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(99, 102, 241, 0.1);
  color: #a5b4fc;
  font-weight: 600;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.1);
}

.al-role-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
  transition: all 0.2s;
}

.al-role.picked .al-role-dot { opacity: 1; background: #818cf8; box-shadow: 0 0 4px rgba(129, 140, 248, 0.5); }

/* Alert */
.al-alert {
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  font-size: 11px;
  text-align: center;
}

/* Links */
.al-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.al-links a {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.2);
  text-decoration: none;
  transition: color 0.2s;
}

.al-links a:hover { color: rgba(148, 163, 184, 0.45); }
.al-link-sep { color: rgba(148, 163, 184, 0.1); }

/* === QR === */
.al-qr {
  text-align: center;
  padding: 8px 0 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.al-qr-box {
  width: 185px; height: 200px;
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.012);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(148, 163, 184, 0.22);
  font-size: 12px;
  position: relative;
  overflow: hidden;
}

.al-qr-box::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(99, 102, 241, 0.03) 0%, transparent 70%);
  pointer-events: none;
}

.al-qr-refresh {
  font-size: 11px;
  color: rgba(99, 102, 241, 0.35);
  margin-top: 12px;
  cursor: pointer;
  transition: color 0.2s;
}

.al-qr-refresh:hover { color: rgba(99, 102, 241, 0.65); }

/* === Footer === */
.al-foot {
  position: absolute;
  bottom: 28px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
}

.al-foot a {
  color: rgba(148, 163, 184, 0.22);
  text-decoration: none;
  transition: color 0.2s;
}

.al-foot a:hover { color: rgba(148, 163, 184, 0.45); }
.al-foot-sep { color: rgba(148, 163, 184, 0.1); }

/* === Responsive === */
@media (max-width: 900px) {
  .al-shell {
    flex-direction: column;
    gap: 24px;
    align-items: center;
  }

  .al-hero { max-width: 390px; width: 100%; }
  .al-brand h1 { font-size: 18px; letter-spacing: 2px; }
  .al-brand p { font-size: 9px; letter-spacing: 2px; }
  .al-card-col { width: 100%; max-width: 390px; }
}

@media (max-width: 480px) {
  .al-card-inner { padding: 24px 18px 18px; }
  .al-brand h1 { font-size: 16px; }
  .al-dash { gap: 6px; }
  .ald-card { padding: 12px 14px; }
  .ald-sys-grid { gap: 4px; }
  .ald-sys-num { font-size: 13px; }
}
</style>
