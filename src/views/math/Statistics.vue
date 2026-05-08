<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、集中趋势的度量" tag="★ 高频">
        <FormulaBox>
          <b>平均数</b> μ = Σx/n<br>
          <b>中位数</b>：数据排序后中间值（偶数为中间两数平均）<br>
          <b>众数</b>：出现次数最多的值
        </FormulaBox>
      </ConceptBlock>
      <ConceptBlock title="二、离散程度的度量" tag="★ 高频">
        <FormulaBox>
          方差 σ² = Σ(x-μ)²/n（母体） 或 s² = Σ(x-x̄)²/(n-1)（样本）<br>
          标准差 σ = √σ²  四分位距 IQR = Q₃ - Q₁
        </FormulaBox>
        <p>标准差越小，数据越集中。离群值对平均数影响大。</p>
      </ConceptBlock>
      <ConceptBlock title="三、常见统计图表">
        <p>· <b>茎叶图</b>：保留原始数据，适合小数据集<br>· <b>箱线图</b>：显示最小值、Q₁、中位数、Q₃、最大值<br>· <b>直方图</b>：适合连续数据分布<br>· <b>散点图</b>：展示两变量关系</p>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>标准差公式混淆</b>：母体÷n，样本÷(n-1)</li>
        <li><b>中位数计算</b>：偶数个数据时取中间两个的平均数</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>比较数据用标准差</b>：标准差越小越稳定</li>
        <li><b>箱线图分析</b>：关注IQR判断数据集中度</li>
      </ul>
    </template>
  </TeachingLayout>
</template>

<script setup>
import TeachingLayout from '@/components/common/TeachingLayout.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '掌握平均数、中位数、众数的计算方法', '理解方差和标准差的含义及公式',
  '能区分母体标准差（÷n）和样本标准差（÷(n-1)）',
  '理解箱线图的构成和各分位数的含义'
]
</script>
