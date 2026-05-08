<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、重心 G (Centroid)" tag="★ 高频">
        <p>三条中线的交点。坐标 = (A+B+C)/3。重心分中线为 2:1（到顶点部分较长）。<b>DSE最常考。</b></p>
        <FormulaBox>G = ( (x₁+x₂+x₃)/3 , (y₁+y₂+y₃)/3 )</FormulaBox>
      </ConceptBlock>
      <ConceptBlock title="二、外心 O (Circumcenter)">
        <p>三条中垂线的交点，到三顶点等距 = R（外接圆半径）。直角三角形外心在斜边中点。</p>
      </ConceptBlock>
      <ConceptBlock title="三、内心 I (Incenter)" tag="★ 高频">
        <p>三条角平分线的交点，到三边等距 = r（内切圆半径）。r = 面积/半周长。面积用海伦公式：√[s(s-a)(s-b)(s-c)]，s=(a+b+c)/2。</p>
      </ConceptBlock>
      <ConceptBlock title="四、垂心 H (Orthocenter)">
        <p>三条高的交点。锐角三角形垂心在内部，钝角在外，直角三角形在直角顶点。</p>
      </ConceptBlock>
      <ConceptBlock title="五、欧拉线">
        <p>O、G、H 三点共线，OG:GH = 1:2。等边三角形的四心合一。</p>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>重心坐标除以2</b>：重心=(A+B+C)/3，不是除以2</li>
        <li><b>内心与外心混淆</b>：内心→到三边等距，外心→到三顶点等距</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>重心公式必背</b>：坐标取三顶点平均值</li>
        <li><b>内切圆半径</b>：r = 面积/半周长，搭配海伦公式使用</li>
        <li><b>特殊三角形</b>：直角三角形外心在斜边中点，内心 r=(a+b-c)/2</li>
      </ul>
    </template>
  </TeachingLayout>
</template>

<script setup>
import TeachingLayout from '@/components/common/TeachingLayout.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '掌握重心 G 的坐标公式 (A+B+C)/3', '理解外心是外接圆圆心，到三顶点等距',
  '理解内心是内切圆圆心，到三边等距', '知道垂心是三条高的交点',
  '理解欧拉线：O/G/H共线且OG:GH=1:2', '能用海伦公式求面积→内切圆半径'
]
</script>
