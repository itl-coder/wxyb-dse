<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、多项式的基本概念" tag="★ 基础">
        <p><b>次数</b>（degree）：多项式中最高次项的次数。<b>首项系数</b>：最高次项的系数。<b>常数项</b>：不含变量的项。</p>
        <p>例：f(x)=3x⁴−2x²+5x−1，次数=4，首项系数=3，常数项=−1。</p>
      </ConceptBlock>
      <ConceptBlock title="二、基本运算" tag="★ 基础">
        <p>加减法：合并同类项。乘法：逐项相乘后合并。除法：长除法或综合除法。</p>
        <ExampleBox><b>例</b>：(x²+3x−1)(x+2) = x³+2x²+3x²+6x−x−2 = x³+5x²+5x−2</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="三、因式定理 (Factor Theorem)" tag="★★ 进阶">
        <FormulaBox>若 f(a) = 0，则 (x−a) 是 f(x) 的因式<br>若 (x−a) 是 f(x) 的因式，则 f(a) = 0</FormulaBox>
        <p>注意符号：f(a)=0 对应 (x−a) 是因子；f(−a)=0 对应 (x+a) 是因子。</p>
        <ExampleBox><b>例</b>：f(x)=x³−6x²+11x−6，f(1)=1−6+11−6=0 → (x−1)是因式。再长除得 f(x)=(x−1)(x−2)(x−3)</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="四、余数定理 (Remainder Theorem)" tag="★★ 进阶">
        <FormulaBox>f(x) 除以 (x−a) 的余数 = f(a)<br>f(x) 除以 (ax−b) 的余数 = f(b/a)</FormulaBox>
        <p>DSE常见题型：用余数定理求多项式中的未知系数。</p>
        <ExampleBox><b>例</b>：f(x)=2x³+px²+qx−6 除以(x−2)余0，除以(x+1)余−12。f(2)=16+4p+2q−6=0，f(−1)=−2+p−q−6=−12。联立解得p、q。</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="五、综合除法 (Synthetic Division)" tag="★★ 进阶">
        <p>快速进行多项式除以 (x−a) 的方法。<b>缺项必须补0</b>：x³−2x+1=[1,0,−2,1]。</p>
        <ExampleBox><b>例</b>：(x³−5x²+3x+2)÷(x−2)：系数[1,−5,3,2] → 1→−3→−3→−4 → 商x²−3x−3，余−4</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="六、多项式的HCF与LCM" tag="★★ 进阶">
        <p>先将多项式因式分解，再求最大公因式（HCF）和最小公倍式（LCM）。</p>
        <p>HCF：取各公因式的最低次幂。LCM：取各因式的最高次幂。</p>
        <ExampleBox><b>例</b>：A=(x−1)(x−2)², B=(x−1)²(x−3) → HCF=(x−1), LCM=(x−1)²(x−2)²(x−3)</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="七、有理分式化简" tag="★★★ DSE">
        <p>约分前先因式分解分子分母。加减法先通分（LCM作公分母）。</p>
        <ExampleBox><b>例</b>：化简 \\(\\frac{x^2-1}{x^2+2x-3} = \\frac{(x-1)(x+1)}{(x+3)(x-1)} = \\frac{x+1}{x+3}\\)（x≠1,−3）</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="八、恒等式与方程" tag="★ 基础">
        <p><b>恒等式</b>：对所有x都成立的等式（如 (x+1)²=x²+2x+1）。<b>比较系数法</b>：同次项系数相等。</p>
        <ExampleBox><b>例</b>：若2x²+3x+1=Ax²+Bx+C对所有x成立，则A=2,B=3,C=1</ExampleBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>综合除法缺项忘记补0</b>：x³−2x+1 写成 [1,0,−2,1]，x²项系数为0</li>
        <li><b>因式定理符号搞反</b>：f(a)=0 则 (x−a) 是因子（不是 x+a）</li>
        <li><b>余数定理除 ax−b 时忘记除以a</b>：除以(2x−1)的余数是 f(1/2)</li>
        <li><b>有理分式约分前不因式分解</b>：先分解再约，否则容易遗漏公因式</li>
        <li><b>混淆恒等式与方程</b>：恒等式对所有x成立，方程只有特定解</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>综合除法练熟</b>：DSE因式分解题关键步骤，节省计算时间</li>
        <li><b>余数定理求参数</b>：DSE最常见的应用题类型，f(a)=已知数 → 方程 → 求系数</li>
        <li><b>HCF/LCM先因式分解</b>：分解后再取公因式/全因式，基本不直接推</li>
        <li><b>有理分式注意定义域</b>：化简须标注 x≠? 以排除分母为0的点</li>
        <li><b>比较系数法</b>：恒等式问题展开后逐项比对同次项系数</li>
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
  '掌握多项式的加减乘除运算',
  '理解因式定理：f(a)=0 ⟺ (x−a)是因子',
  '掌握余数定理：f(x)÷(x−a)余数为f(a)',
  '熟练使用综合除法进行因式分解',
  '能求多项式的HCF和LCM',
  '掌握有理分式的化简与通分',
  '理解恒等式比较系数法'
]
</script>
