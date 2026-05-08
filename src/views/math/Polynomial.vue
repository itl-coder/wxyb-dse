<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、基本运算" tag="★ 高频">
        <p>加减法：合并同类项。乘法：逐项相乘后合并。除法：长除法或综合除法。</p>
      </ConceptBlock>
      <ConceptBlock title="二、因式定理 (Factor Theorem)" tag="★ 高频">
        <FormulaBox>若 f(a) = 0，则 (x-a) 是 f(x) 的因式<br>若 (x-a) 是 f(x) 的因式，则 f(a) = 0</FormulaBox>
        <p>注意符号：f(a)=0 对应 (x-a)，f(-a)=0 对应 (x+a)。</p>
      </ConceptBlock>
      <ConceptBlock title="三、余数定理 (Remainder Theorem)" tag="★ 高频">
        <FormulaBox>f(x) 除以 (x-a) 的余数 = f(a)<br>f(x) 除以 (ax-b) 的余数 = f(b/a)</FormulaBox>
        <p>DSE常见题型：用余数定理求多项式中的未知系数。</p>
      </ConceptBlock>
      <ConceptBlock title="四、综合除法">
        <p>快速进行多项式除以 (x-a) 的方法。注意：缺项要补0！如 x³-2x+1=[1,0,-2,1]。</p>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>综合除法缺项忘记补0</b>：x³-2x+1 写成 [1,0,-2,1]</li>
        <li><b>因式定理符号搞反</b>：f(a)=0 则 (x-a) 是因子（不是 x+a）</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>综合除法练熟</b>：因式分解的多项式除法标准方法</li>
        <li><b>余数定理求参数</b>：DSE最常见的应用题类型</li>
      </ul>
    </template>
  </TeachingLayout>
</template>

<script setup>
import TeachingLayout from '@/components/common/TeachingLayout.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '掌握多项式的加减乘除运算', '理解因式定理：f(a)=0 ⟺ (x-a)是因子',
  '掌握余数定理：f(x)÷(x-a)余数为f(a)', '熟练使用综合除法进行因式分解'
]
</script>
