<template>
  <div>
    <!-- System entry points -->
    <div class="system-entries">
      <router-link to="/admin" class="sys-entry admin-entry-card">
        <div class="sys-entry-icon">🏫</div>
        <div class="sys-entry-info">
          <div class="sys-entry-title">管理后台</div>
          <div class="sys-entry-desc">学情问诊 · 班级管理 · AI智能分析</div>
        </div>
        <span class="sys-entry-arrow">→</span>
      </router-link>
      <router-link to="/portal" class="sys-entry portal-entry-card">
        <div class="sys-entry-icon">👨‍🎓</div>
        <div class="sys-entry-info">
          <div class="sys-entry-title">学生门户</div>
          <div class="sys-entry-desc">我的学情 · 作业考试 · 错题本</div>
        </div>
        <span class="sys-entry-arrow">→</span>
      </router-link>
    </div>

    <div class="dashboard-hero">
      <h2>📐 DSE 数学专题总览</h2>
      <p>选择专题进入交互式学习 · 每专题包含教学讲解、可视化演示、DSE解题策略</p>
    </div>
    <div class="topic-grid">
      <TopicCard
        v-for="m in mathModules"
        :key="m.id"
        :to="routeMap[m.id]"
        :icon="m.icon"
        :name="m.name"
        :desc="m.desc"
        :freq="m.freq"
        :stars="m.stars"
      />
    </div>
    <div class="quick-links">
      <router-link to="/practice" class="quick-link">📝 DSE 练习系统</router-link>
      <router-link to="/mistakes" class="quick-link">❌ 经典错题整理</router-link>
      <router-link to="/knowledge" class="quick-link">📖 知识体系总结</router-link>
    </div>
  </div>
</template>

<script setup>
import TopicCard from '@/components/common/TopicCard.vue'
import { mathModules } from '@/data/moduleMeta.js'

const routeMap = {
  '3d': '/3d-geometry', trig: '/trigonometry', log: '/log-exp',
  circ: '/circle-line', comp: '/composite', loc: '/locus',
  cent: '/triangle-center', mov: '/moving-point', quad: '/quadratic',
  seq: '/sequence', prob: '/probability', stat: '/statistics',
  poly: '/polynomial', ineq: '/inequality', num: '/numbers'
}
</script>
