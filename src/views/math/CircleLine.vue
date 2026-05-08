<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、圆的标准方程与一般式" tag="★ 高频">
        <FormulaBox>标准式：(x-h)²+(y-k)²=r²，圆心 C(h,k)，半径 r<br>一般式：x²+y²+Dx+Ey+F=0<br>圆心 (-D/2, -E/2)，半径 r = √(D²/4+E²/4-F)</FormulaBox>
      </ConceptBlock>
      <ConceptBlock title="二、直线与圆的位置关系" tag="★ 高频">
        <p>d = |Ax₀+By₀+C|/√(A²+B²)，d 是圆心到直线的距离。</p>
        <FormulaBox>d &lt; r 相交（割线） d = r 相切 d &gt; r 相离</FormulaBox>
        <p><b>弦长公式</b>：弦长 = 2√(r²-d²)</p>
      </ConceptBlock>
      <ConceptBlock title="三、判别式法">
        <p>将直线 y=mx+c 代入圆方程得二次方程。Δ>0 相交（2个交点），Δ=0 相切，Δ&lt;0 相离。</p>
      </ConceptBlock>
      <ConceptBlock title="四、切线方程">
        <p>切线⊥切点处半径。圆 x²+y²=r² 上一点(x₀,y₀)的切线：x₀x+y₀y=r²。圆 (x-h)²+(y-k)²=r² 上一点的切线：(x₀-h)(x-h)+(y₀-k)(y-k)=r²。</p>
      </ConceptBlock>
      <ConceptBlock title="五、圆与圆的位置关系">
        <FormulaBox>d = r₁+r₂ 外切 d = |r₁-r₂| 内切 |r₁-r₂| &lt; d &lt; r₁+r₂ 相交</FormulaBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>点到直线距离忘记绝对值</b>：距离永远是正数</li>
        <li><b>判别式判断位置关系记反</b>：Δ>0→相交，Δ&lt;0→相离</li>
        <li><b>弦长公式用错</b>：先求d再代入弦长=2√(r²-d²)</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>几何法优先</b>：用距离公式 d 判断比判别式法更快</li>
        <li><b>弦长公式熟记</b>：2√(r²-d²) 可快速求解弦长问题</li>
        <li><b>切线技巧</b>：利用切线⊥半径的性质确定斜率</li>
      </ul>
    </template>
  </TeachingLayout>
</template>

<script setup>
import TeachingLayout from '@/components/common/TeachingLayout.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '掌握圆的标准方程与一般式的互化', '熟练使用判别式法判断直线与圆的位置关系',
  '掌握弦长公式 2√(r²-d²)', '理解切线性质：切线⊥切点处半径',
  '掌握点到直线的距离公式', '能判断圆与圆的位置关系（外切/内切/相交/相离）'
]
</script>
