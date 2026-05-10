<template>
  <div class="app-navbar">
    <router-link to="/admin" style="color:var(--accent);font-weight:600">🏫 后台</router-link>
    <router-link to="/portal">👨‍🎓 门户</router-link>
    <span class="nav-sep">|</span>
    <router-link to="/">🏠 总览</router-link>
    <span class="nav-sep">|</span>
    <router-link to="/3d-geometry">立体几何</router-link>
    <router-link to="/trigonometry">三角函数</router-link>
    <router-link to="/log-exp">对数指数</router-link>
    <router-link to="/circle-line">圆与直线</router-link>
    <router-link to="/composite">复合函数</router-link>
    <router-link to="/locus">轨迹</router-link>
    <router-link to="/triangle-center">四心</router-link>

    <router-link to="/quadratic">二次函数</router-link>
    <router-link to="/sequence">数列</router-link>
    <router-link to="/probability">概率</router-link>
    <router-link to="/statistics">统计</router-link>
    <router-link to="/polynomial">多项式</router-link>
    <router-link to="/inequality">不等式</router-link>
    <router-link to="/numbers">数与式</router-link>
    <span class="nav-sep">|</span>
    <router-link to="/practice">📝 练习</router-link>
    <router-link to="/mistakes">❌ 错题</router-link>
    <router-link to="/knowledge">📖 总结</router-link>
    <span class="nav-sep">|</span>
    <span class="nav-current">当前: {{ pageNames[currentPage] || '总览' }}</span>
  </div>
</template>

<script setup>
defineProps({
  currentPage: { type: String, default: 'Home' }
})

const pageNames = {
  Home: '总览', Geometry3D: '立体几何', Trigonometry: '三角函数',
  LogExp: '对数指数', CircleLine: '圆与直线', Composite: '复合函数',
  Locus: '轨迹', TriangleCenter: '四心',
  Quadratic: '二次函数', Sequence: '数列', Probability: '概率',
  Statistics: '统计', Polynomial: '多项式', Inequality: '不等式',
  Numbers: '数与式', Practice: '练习', Mistakes: '错题', Knowledge: '总结',
  Chinese: '中文', Physics: '物理', Chemistry: '化学'
}
</script>
