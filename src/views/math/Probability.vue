<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、基本概率" tag="★ 高频">
        <FormulaBox>P(E) = 有利结果数 / 总结果数 0 ≤ P(E) ≤ 1<br>P(必然事件) = 1 P(不可能事件) = 0 P(A的补集) = 1-P(A)</FormulaBox>
      </ConceptBlock>
      <ConceptBlock title="二、排列与组合" tag="★ 高频">
        <FormulaBox>
          排列 P(n,r) = n!/(n-r)! —— 顺序重要<br>
          组合 C(n,r) = n!/[r!(n-r)!] —— 顺序不重要<br>
          例：5选3排列 = 60，5选3组合 = 10
        </FormulaBox>
      </ConceptBlock>
      <ConceptBlock title="三、条件概率与独立性">
        <FormulaBox>条件概率：P(A|B) = P(A∩B) / P(B)<br>独立事件：P(A∩B) = P(A)×P(B)<br>互斥事件：P(A∪B) = P(A)+P(B)（A∩B=∅）<br>一般加法：P(A∪B) = P(A)+P(B) - P(A∩B)</FormulaBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>排列组合混淆</b>：何时用排列（有序），何时用组合（无序）</li>
        <li><b>概率直接相加</b>：只有互斥事件 P(A∪B)=P(A)+P(B)</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>枚举法</b>：DSE基础题用枚举法最安全</li>
        <li><b>树状图</b>：条件概率画树状图分路径计算</li>
      </ul>
    </template>
  </TeachingLayout>
</template>

<script setup>
import TeachingLayout from '@/components/common/TeachingLayout.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '掌握概率的基本定义和取值范围', '区分排列（有序）和组合（无序）',
  '理解条件概率 P(A|B) 的含义', '掌握独立事件和互斥事件的判断'
]
</script>
