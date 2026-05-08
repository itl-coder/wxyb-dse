<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、一元一次不等式">
        <p>解法与方程类似，但 <b>乘以或除以负数时反转不等号</b>。</p>
        <ExampleBox><b>示例</b>：-2x &lt; 6 → x &gt; -3（除以负数，反号）</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="二、一元二次不等式" tag="★ 高频">
        <p>步骤：① 因式分解 → ② 找临界点 → ③ 数轴分析确定解集。</p>
        <FormulaBox>(x-a)(x-b) &gt; 0 → x &lt; a 或 x &gt; b（取两边）<br>(x-a)(x-b) &lt; 0 → a &lt; x &lt; b（取中间）</FormulaBox>
        <ExampleBox><b>示例</b>：x²-x-6&gt;0 → (x-3)(x+2)&gt;0 → x&lt;-2 或 x&gt;3</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="三、线性规划" tag="★ 高频">
        <p>在可行域内求目标函数的最大/最小值。<b>最优解在顶点处取得。</b></p>
        <ExampleBox><b>示例</b>：约束 x+y≤6, x≥1, y≥2，目标 P=3x+2y。顶点 A(1,2), B(1,5), C(4,2)。P(A)=7, P(B)=13, P(C)=16 → 最大值16在C点。</ExampleBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>乘负数不反号</b>：乘以或除以负数必须反转不等号</li>
        <li><b>二次不等式方向搞错</b>：大于0取两边，小于0取中间</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>数轴分析</b>：二次不等式画数轴标注临界点</li>
        <li><b>线性规划三步</b>：画可行域→找顶点→代入比较</li>
      </ul>
    </template>
  </TeachingLayout>
</template>

<script setup>
import TeachingLayout from '@/components/common/TeachingLayout.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'
import ExampleBox from '@/components/common/ExampleBox.vue'

const objectives = [
  '掌握不等式的移项规则，特别注意乘负数反号', '掌握二次不等式的数轴分析法',
  '理解线性规划的基本思路：可行域→顶点→最值', '能解决不等式组问题'
]
</script>
