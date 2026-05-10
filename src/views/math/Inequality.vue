<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、一元一次不等式" tag="★ 基础">
        <p>解法与方程类似，但 <b>乘以或除以负数时反转不等号</b>。解集用区间表示或数轴表示。</p>
        <ExampleBox><b>例</b>：−2x &lt; 6 → x &gt; −3（除以负数，反号）。3x+1 ≥ 2x−4 → x ≥ −5。</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="二、一元二次不等式" tag="★★ 进阶">
        <p>步骤：① 移项使一边为0 → ② 因式分解 → ③ 找临界点 → ④ 数轴分析确定解集。</p>
        <FormulaBox>(x−a)(x−b) &gt; 0 → x &lt; a 或 x &gt; b（取两边）<br>(x−a)(x−b) &lt; 0 → a &lt; x &lt; b（取中间）<br>前提：a &lt; b</FormulaBox>
        <ExampleBox><b>例</b>：x²−x−6&gt;0 → (x−3)(x+2)&gt;0 → x&lt;−2 或 x&gt;3</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="三、二次不等式的图解法" tag="★★★ DSE">
        <p>利用抛物线开口方向和与x轴交点判断解集。设 f(x)=ax²+bx+c：</p>
        <p>a&gt;0（开口向上）：f(x)&gt;0 取交点两边；f(x)&lt;0 取交点中间</p>
        <p>a&lt;0（开口向下）：f(x)&gt;0 取交点中间；f(x)&lt;0 取交点两边</p>
        <p>若 Δ&lt;0（无实根）：a&gt;0时f(x)&gt;0恒成立；a&lt;0时f(x)&lt;0恒成立。</p>
      </ConceptBlock>
      <ConceptBlock title="四、复合不等式" tag="★★ 进阶">
        <p><b>AND型</b>（取交集）：a &lt; x 且 x &lt; b → a &lt; x &lt; b（两区间重叠部分）</p>
        <p><b>OR型</b>（取并集）：x &lt; a 或 x &gt; b（两区间全部）</p>
        <ExampleBox><b>例</b>：解 −3 &lt; 2x+1 &lt; 7 → 分两步 −3&lt;2x+1 → x&gt;−2，2x+1&lt;7 → x&lt;3 → 解集 −2&lt;x&lt;3</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="五、含绝对值的不等式" tag="★★★ DSE">
        <FormulaBox>
          |x−a| &lt; k (k&gt;0) → a−k &lt; x &lt; a+k（区间内）<br>
          |x−a| &gt; k (k&gt;0) → x &lt; a−k 或 x &gt; a+k（区间外）<br>
          |x−a| ≥ k → x ≤ a−k 或 x ≥ a+k
        </FormulaBox>
        <ExampleBox><b>例</b>：|2x−1| &lt; 5 → −5&lt;2x−1&lt;5 → −4&lt;2x&lt;6 → −2&lt;x&lt;3</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="六、分式不等式" tag="★★★ DSE">
        <p>方法：移项通分 → 分子分母定号分析。<b>不可直接交叉相乘</b>（分母符号未知时）。</p>
        <ExampleBox><b>例</b>：解 \\(\\frac{x-1}{x+2} &gt; 0\\)。①分子零点 x=1；②分母零点 x=−2；③数轴分三段分析 → x&lt;−2 或 x&gt;1</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="七、线性规划 (Linear Programming)" tag="★★★ DSE">
        <p>步骤：① 画可行域（各不等式半平面的交集） → ② 找顶点坐标 → ③ 代入目标函数比较 → ④ 得最值。</p>
        <p><b>最优解在顶点处取得</b>（目标函数为线性时）。</p>
        <ExampleBox><b>例</b>：约束 x+y≤6, x≥1, y≥2，目标 P=3x+2y。顶点 A(1,2), B(1,5), C(4,2)。P(A)=7, P(B)=13, P(C)=16 → 最大值16在C(4,2)。</ExampleBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>乘负数不反号</b>：乘以或除以负数必须反转不等号</li>
        <li><b>二次不等式方向搞错</b>：(x−a)(x−b)&gt;0 → 取两边；(x−a)(x−b)&lt;0 → 取中间</li>
        <li><b>分式不等式直接交叉相乘</b>：分母符号不确定时不可交叉相乘</li>
        <li><b>|x|&lt;a 解成 x&lt;a 或 x&gt;−a</b>：正确解是 −a&lt;x&lt;a（取中间非两边）</li>
        <li><b>线性规划忘记检查顶点在不在可行域内</b></li>
        <li><b>复合不等式先拆成两个再求解</b>：a&lt;f(x)&lt;b 应拆为 a&lt;f(x) 且 f(x)&lt;b</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>二次不等式先因式分解</b>：不能分解时用判别式判断符号</li>
        <li><b>绝对值不等式</b>：|x−a|&lt;k ↔ a−k&lt;x&lt;a+k；|x−a|&gt;k ↔ x&lt;a−k 或 x&gt;a+k</li>
        <li><b>分式不等式用数轴分析</b>：找分子分母零点，分区间讨论符号</li>
        <li><b>线性规划三步走</b>：画可行域 → 找所有顶点 → 逐一代入目标函数</li>
        <li><b>图解法验证</b>：二次不等式画抛物线确认开口方向和交点位置</li>
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
  '掌握不等式的移项规则，特别注意乘负数反号',
  '掌握二次不等式的数轴分析法和图解法',
  '能解含绝对值的不等式',
  '能解分式不等式',
  '理解复合不等式的解集求法',
  '掌握线性规划：可行域→顶点→最值'
]
</script>
