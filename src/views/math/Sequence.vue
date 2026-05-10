<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、等差数列 (Arithmetic Sequence)" tag="★ 基础">
        <FormulaBox>通项：a_n = a₁ + (n−1)d<br>前 n 项和：S_n = n/2[2a₁+(n−1)d] = n(a₁+a_n)/2<br>公差 d = a_{n+1} − a_n（常数）</FormulaBox>
        <p>d &gt; 0 递增，d &lt; 0 递减，d = 0 常数列。</p>
        <ExampleBox><b>例</b>：3,7,11,15,... → a₁=3, d=4 → a₁₀ = 3+9×4 = 39, S₁₀ = 10×(3+39)/2 = 210</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="二、等比数列 (Geometric Sequence)" tag="★ 基础">
        <FormulaBox>通项：a_n = a₁·rⁿ⁻¹<br>前 n 项和：S_n = a₁(rⁿ−1)/(r−1) （r≠1）<br>r = 1 时 S_n = n·a₁<br>当 |r|&lt;1 时，无限项和 S_∞ = a₁/(1−r)</FormulaBox>
        <ExampleBox><b>例</b>：2,6,18,54,... → a₁=2, r=3 → a₅=2×3⁴=162, S₅=2(3⁵−1)/(3−1)=242</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="三、Σ记号与常见求和公式" tag="★★ 进阶">
        <FormulaBox>
          Σ_{k=1}^{n} k = n(n+1)/2<br>
          Σ_{k=1}^{n} k² = n(n+1)(2n+1)/6<br>
          Σ_{k=1}^{n} k³ = [n(n+1)/2]²
        </FormulaBox>
        <p>性质：Σ(c·a_k) = c·Σa_k Σ(a_k ± b_k) = Σa_k ± Σb_k Σc = n·c</p>
      </ConceptBlock>
      <ConceptBlock title="四、求数列通项的方法" tag="★★ 进阶">
        <p><b>观察法</b>：看相邻项差（等差）、比（等比）、平方、交替符号等。</p>
        <p><b>已知S_n求a_n</b>：a₁ = S₁；n≥2时 a_n = S_n − S_{n−1}</p>
        <ExampleBox><b>例</b>：已知S_n=n²+n，则a₁=S₁=2，a_n=S_n−S_{n−1}=(n²+n)−((n−1)²+(n−1))=2n (n≥2)</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="五、裂项相消法 (Telescoping)" tag="★★★ DSE">
        <p>将通项拆成相邻两项之差，求和时中间项互相抵消。</p>
        <FormulaBox>\\(\frac{1}{n(n+1)} = \frac{1}{n} - \frac{1}{n+1}\\)<br>\\(\frac{1}{n(n+k)} = \frac{1}{k}\left(\frac{1}{n} - \frac{1}{n+k}\right)\\)</FormulaBox>
        <ExampleBox><b>例</b>：求 Σ_{n=1}^{99} 1/[n(n+1)] = (1/1−1/2)+(1/2−1/3)+...+(1/99−1/100) = 1−1/100 = 0.99</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="六、等差×等比的混合数列" tag="★★★ DSE">
        <p>形如 {a_n = (等差项)×(等比项)} 的数列，用<b>错位相减法</b>求和。</p>
        <p>方法：写出 S_n → 两边乘公比 r → 对齐相减 → 等比数列求和。</p>
        <ExampleBox><b>例</b>：S_n=1·2+2·2²+3·2³+...+n·2ⁿ。乘2得 2S_n=1·2²+2·2³+...+(n−1)·2ⁿ+n·2ⁿ⁺¹。相减得 −S_n=2+2²+2³+...+2ⁿ−n·2ⁿ⁺¹=2(2ⁿ−1)/(2−1)−n·2ⁿ⁺¹=2ⁿ⁺¹−2−n·2ⁿ⁺¹ → S_n=(n−1)2ⁿ⁺¹+2</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="七、数列的实际应用" tag="★★ 进阶">
        <p><b>复利</b>：A = P(1+r)^t，每年本利和构成等比数列，公比=1+r。</p>
        <p><b>折旧</b>：价值每年按固定比例下降，构成等比数列，公比=1−折旧率。</p>
        <p><b>等差数列应用</b>：等额递增的存款、阶梯式计费等。</p>
        <ExampleBox><b>例</b>：每年存$5000，第1年$5000，第2年$5500，第3年$6000（等差递增$500）→ 第n年存入额=5000+(n−1)×500</ExampleBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>等差与等比公式混淆</b>：等差=加减（公差d），等比=乘除（公比r）</li>
        <li><b>等比求和忘记 r≠1</b>：r=1 时所有项相等，S_n = n·a₁</li>
        <li><b>无限项和条件</b>：必须 |r|&lt;1 才收敛（和为a₁/(1−r)）</li>
        <li><b>已知S_n求a_n忘记验证a₁</b>：n=1 时公式可能不适用</li>
        <li><b>裂项公式记错</b>：1/[n(n+1)]=1/n−1/(n+1)（不是1/n+1/(n+1)）</li>
        <li><b>Σ符号的下标和上标搞混</b>：Σ_{k=1}^{n} 表示k从1加到n</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>先判断类型</b>：观察相邻项关系（差常数=等差，比常数=等比）</li>
        <li><b>联立消元</b>：已知两项求首项和公差/公比，用公式联立方程</li>
        <li><b>S_n求a_n万能公式</b>：a₁=S₁；a_n=S_n−S_{n−1}(n≥2)</li>
        <li><b>裂项求和找规律</b>：写出前几项看抵消模式，注意首尾保留项</li>
        <li><b>错位相减</b>：等差×等比数列的求和标准方法</li>
        <li><b>应用题意先建模</b>：把文字描述转化为等差或等比数列模型</li>
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
  '掌握等差数列的通项与求和公式',
  '掌握等比数列的通项、求和与无限项和',
  '理解Σ记号并能使用常见求和公式',
  '掌握从S_n求a_n的方法',
  '掌握裂项相消法求和',
  '能处理等差×等比混合数列求和',
  '能将实际问题建模为数列问题'
]
</script>
