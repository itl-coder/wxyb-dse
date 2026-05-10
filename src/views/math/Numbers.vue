<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、代数式化简" tag="★ 基础">
        <p>展开利用分配律逐项展开 → 合并同类项（相同字母次数的项合并）。因式分解：提取公因式 → 公式法 → 十字相乘。</p>
        <FormulaBox>(a+b)² = a² + 2ab + b² (a-b)² = a² - 2ab + b² (a+b)(a-b) = a² - b²</FormulaBox>
      </ConceptBlock>
      <ConceptBlock title="二、根式与有理化" tag="★ 基础">
        <FormulaBox>√a × √b = √(ab)（a,b≥0） √(a+b) ≠ √a + √b √(a²+b²) 不可化简</FormulaBox>
        <p>分母有理化：分子分母同乘共轭根式。常见形式：\\(\\frac{a}{\\sqrt{b}}\\) → 乘√b/√b；\\(\\frac{a}{\\sqrt{b}+\\sqrt{c}}\\) → 乘(√b−√c)/(√b−√c)。</p>
        <ExampleBox><b>例</b>：化简 \\(\\frac{1}{\\sqrt{3}+1} = \\frac{\\sqrt{3}-1}{(\\sqrt{3}+1)(\\sqrt{3}-1)} = \\frac{\\sqrt{3}-1}{2}\\)</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="三、指数律" tag="★ 基础">
        <FormulaBox>
          a^m × a^n = a^(m+n) a^m ÷ a^n = a^(m-n) (a^m)^n = a^(mn)<br>
          a⁰ = 1 (a≠0) a^(-n) = 1/a^n a^(1/n) = ⁿ√a a^(m/n) = ⁿ√(a^m)
        </FormulaBox>
      </ConceptBlock>
      <ConceptBlock title="四、数系与分类" tag="★ 基础">
        <p><b>自然数N</b> = {1,2,3,...} <b>整数Z</b> = {...,−2,−1,0,1,2,...} <b>有理数Q</b> = 可写成分数形式 p/q 的数（含有限小数和循环小数）</p>
        <p><b>无理数</b> = 不可写成分数的小数（如 √2, π, e） <b>实数R</b> = 有理数 ∪ 无理数</p>
        <p>注意：\\(\\sqrt{4}\\) 是有理数，\\(\\sqrt{2}\\) 才是无理数。循环小数如 0.333...=1/3 是有理数。</p>
      </ConceptBlock>
      <ConceptBlock title="五、科学记数法与有效数字" tag="★★ 进阶">
        <FormulaBox>a × 10ⁿ 其中 1 ≤ |a| < 10，n 为整数</FormulaBox>
        <p>有效数字：从左边第一个非零数字起的所有数字。0.00320 有3位有效数字（3,2,0）。3.20×10⁶ 有3位有效数字。</p>
        <ExampleBox><b>例</b>：1234000 = 1.234×10⁶ 0.000567 = 5.67×10⁻⁴</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="六、百分数、盈亏与利息" tag="★★ 进阶">
        <FormulaBox>
          百分变化 = (新值−旧值)/旧值 × 100%<br>
          盈利% = (售价−成本)/成本 × 100% 折扣后售价 = 标价 × (1−折扣率)<br>
          单利：I = P×r×t 本利和 = P(1+rt)<br>
          复利：A = P(1+r)^t 其中 P=本金，r=每期利率，t=期数
        </FormulaBox>
        <ExampleBox><b>例</b>：本金$10000，年利率4%复利，3年后本利和 = 10000×(1.04)³ = $11248.64</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="七、比与比例" tag="★★ 进阶">
        <p>若 a:b = c:d，则 ad = bc（内项积=外项积）。若 a:b = 2:3，则 a=2k, b=3k（k为常数）。</p>
        <ExampleBox><b>例</b>：三角形三个角之比为2:3:4，则三个角分别为 2/(2+3+4)×180°=40°, 3/9×180°=60°, 4/9×180°=80°</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="八、绝对值" tag="★ 基础">
        <FormulaBox>|a| = a (a≥0) |a| = −a (a&lt;0) |x−a| 表示x到a的距离</FormulaBox>
        <p>常见性质：|ab| = |a|·|b| |a/b| = |a|/|b| |a+b| ≤ |a|+|b|（三角不等式）</p>
        <ExampleBox><b>例</b>：|x−3| = 5 → x−3 = ±5 → x = 8 或 x = −2</ExampleBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>(a+b)²=a²+b²</b>：漏掉2ab项，这是最常见的代数错误</li>
        <li><b>√(a²+b²)=a+b</b>：根号不能拆分加减法</li>
        <li><b>循环小数不是有理数</b>：所有循环小数都可写成分数，是有理数</li>
        <li><b>复利计算用单利公式</b>：注意"利叠利"才是复利</li>
        <li><b>科学记数法a的范围搞错</b>：1 ≤ |a| &lt; 10，不是 0 &lt; a &lt; 1</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>完全平方公式必记</b>：(a±b)²=a²±2ab+b²，平方差 a²−b²=(a+b)(a−b)</li>
        <li><b>根式化简先看能不能提完全平方因子</b>：√48=√(16×3)=4√3</li>
        <li><b>利息题先判断单利还是复利</b>：单利=本金×利率×时间，复利=本金×(1+利率)^时间</li>
        <li><b>比例题设k法</b>：出现比例时设 a=2k, b=3k 转化求解</li>
        <li><b>绝对值方程拆成两个</b>：|ax+b|=c → ax+b=±c</li>
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
  '掌握代数式展开与合并同类项',
  '熟记完全平方公式与平方差公式',
  '理解根式运算规则和分母有理化',
  '掌握指数律（乘除幂法则）',
  '能区分有理数与无理数',
  '掌握科学记数法与有效数字',
  '理解百分变化、盈亏与单复利计算',
  '能解含绝对值的基本方程'
]
</script>
