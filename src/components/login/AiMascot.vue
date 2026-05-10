<template>
  <div class="mascot-wrap">
    <div class="mascot">
      <!-- Body -->
      <div class="ms-body">
        <!-- Eyes -->
        <div class="ms-eyes">
          <div class="ms-eye ms-eye-l">
            <div class="ms-pupil"></div>
          </div>
          <div class="ms-eye ms-eye-r">
            <div class="ms-pupil"></div>
          </div>
        </div>
        <!-- Blush -->
        <div class="ms-blush ms-blush-l"></div>
        <div class="ms-blush ms-blush-r"></div>
        <!-- Mouth -->
        <div class="ms-mouth"></div>
      </div>
      <!-- Floating rings -->
      <div class="ms-ring ms-ring-1"></div>
      <div class="ms-ring ms-ring-2"></div>
      <div class="ms-ring ms-ring-3"></div>
      <!-- Sparkles -->
      <div class="ms-sparkle ms-sp-1">✦</div>
      <div class="ms-sparkle ms-sp-2">✧</div>
      <div class="ms-sparkle ms-sp-3">✦</div>
    </div>
    <div class="ms-label">
      <span class="ms-label-text">AI 学习伙伴</span>
      <span class="ms-label-sub">小智</span>
    </div>
  </div>
</template>

<style scoped>
.mascot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.mascot {
  position: relative;
  width: 180px;
  height: 180px;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* Body - rounded blob */
.ms-body {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 110px; height: 120px;
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
  border-radius: 55px 55px 48px 48px;
  box-shadow:
    0 8px 32px rgba(99,102,241,0.3),
    inset 0 2px 0 rgba(255,255,255,0.2),
    inset 0 -4px 8px rgba(0,0,0,0.1);
}

/* Eyes */
.ms-eyes {
  position: absolute;
  top: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
}

.ms-eye {
  width: 18px; height: 20px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: blink 3s ease-in-out infinite;
}

.ms-pupil {
  width: 10px; height: 12px;
  background: #1e1b4b;
  border-radius: 50%;
  animation: look 5s ease-in-out infinite;
}

@keyframes look {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(2px, -1px); }
  50% { transform: translate(-2px, 1px); }
  75% { transform: translate(0, -2px); }
}

@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

/* Blush */
.ms-blush {
  position: absolute;
  top: 48px;
  width: 14px; height: 8px;
  background: rgba(255, 150, 150, 0.5);
  border-radius: 50%;
}

.ms-blush-l { left: 18px; }
.ms-blush-r { right: 18px; }

/* Mouth */
.ms-mouth {
  position: absolute;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px; height: 8px;
  border-bottom: 2.5px solid rgba(255,255,255,0.7);
  border-radius: 0 0 8px 8px;
}

/* Floating rings */
.ms-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  animation: ringPulse 3s ease-in-out infinite;
}

.ms-ring-1 {
  width: 150px; height: 150px;
  top: 15px; left: 15px;
  animation-delay: 0s;
}

.ms-ring-2 {
  width: 170px; height: 170px;
  top: 5px; left: 5px;
  animation-delay: 1s;
}

.ms-ring-3 {
  width: 130px; height: 130px;
  top: 25px; left: 25px;
  animation-delay: 2s;
  border-style: dashed;
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.08); opacity: 0.6; }
}

/* Sparkles */
.ms-sparkle {
  position: absolute;
  font-size: 14px;
  color: #a78bfa;
  animation: sparkleFloat 2.5s ease-in-out infinite;
  opacity: 0;
}

.ms-sp-1 { top: 10px; right: 10px; animation-delay: 0s; }
.ms-sp-2 { bottom: 30px; left: 0px; animation-delay: 0.8s; }
.ms-sp-3 { top: 50px; left: -8px; animation-delay: 1.6s; }

@keyframes sparkleFloat {
  0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
  50% { opacity: 0.9; transform: translateY(-10px) scale(1.2); }
}

/* Label */
.ms-label {
  text-align: center;
}

.ms-label-text {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  letter-spacing: 1px;
}

.ms-label-sub {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #a5b4fc;
  margin-top: 2px;
}
</style>
