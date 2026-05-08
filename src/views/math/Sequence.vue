<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、等差数列 (Arithmetic Sequence)" tag="★ 高频">
        <FormulaBox>通项：a_n = a₁ + (n-1)d<br>前 n 项和：S_n = n/2[2a₁+(n-1)d] = n(a₁+a_n)/2</FormulaBox>
        <p>d 可以是负数（递减数列）。</p>
      </ConceptBlock>
      <ConceptBlock title="二、等比数列 (Geometric Sequence)" tag="★ 高频">
        <FormulaBox>通项：a_n = a₁·rⁿ⁻¹<br>前 n 项和：S_n = a₁(rⁿ-1)/(r-1) （r≠1）<br>r=1 时 S_n = n·a₁<br>当 |r|&lt;1 时，无限项和 S_∞ = a₁/(1-r)</FormulaBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>等差与等比公式混淆</b>：等差是加减，等比是乘除</li>
        <li><b>等比求和忘记 r≠1</b>：r=1 时所有项相等，Sn=na₁</li>
        <li><b>无限项和条件</b>：必须 |r|&lt;1 才收敛</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>先判断类型</b>：观察相邻项的关系（差常数=等差，比常数=等比）</li>
        <li><b>联立消元</b>：已知两项求首项和公差/公比</li>
      </ul>
    </template>
  </TeachingLayout>
</template>

<script setup>
import TeachingLayout from '@/components/common/TeachingLayout.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '掌握等差数列的通项与求和公式', '掌握等比数列的通项与求和公式',
  '理解 r=1 时等比数列求和的特殊情况', '理解无限等比求和的条件 |r|&lt;1'
]
</script>
