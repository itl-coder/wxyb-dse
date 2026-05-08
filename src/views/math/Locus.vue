<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、阿波罗尼奥斯圆">
        <p>PA:PB = k (k>0, k≠1)，轨迹为圆。圆心在 AB 连线上。k=1 时为 AB 中垂线（直线）。</p>
      </ConceptBlock>
      <ConceptBlock title="二、椭圆" tag="★ 高频">
        <p>PF₁+PF₂ = 2a (2a > F₁F₂)。标准方程：x²/a² + y²/b² = 1。a² = b² + c²，离心率 e = c/a (0&lt;e&lt;1)。</p>
      </ConceptBlock>
      <ConceptBlock title="三、双曲线" tag="★ 高频">
        <p>|PF₁-PF₂| = 2a (2a &lt; F₁F₂)。标准方程：x²/a² - y²/b² = 1。c² = a² + b²。渐近线：y = ±(b/a)x。</p>
      </ConceptBlock>
      <ConceptBlock title="四、抛物线">
        <p>PF = d(P, 准线)。标准方程：x²=4py 或 y²=4px。</p>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>阿波罗尼奥斯圆 k=1</b>：轨迹是直线（中垂线），不是圆</li>
        <li><b>双曲线定义忘绝对值</b>：没绝对值只表示双曲线的一支</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>定义法验证</b>：遇到轨迹题先用定义判断类型</li>
        <li><b>标准方程对比</b>：记住 a²、b²、c² 的关系</li>
      </ul>
    </template>
  </TeachingLayout>
</template>

<script setup>
import TeachingLayout from '@/components/common/TeachingLayout.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'

const objectives = [
  '理解阿波罗尼奥斯圆的定义及 k=1 的特殊情况',
  '掌握椭圆的定义及标准方程', '掌握双曲线的定义、渐近线',
  '掌握抛物线的定义及标准方程', '能区分椭圆、双曲线、抛物线的标准方程形式'
]
</script>
