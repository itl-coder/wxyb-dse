<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、代数式化简" tag="★ 高频">
        <p>展开利用分配律逐项展开 → 合并同类项（相同字母次数的项合并）。因式分解：提取公因式 → 公式法 → 十字相乘。</p>
        <FormulaBox>(a+b)² = a² + 2ab + b² (a-b)² = a² - 2ab + b² (a+b)(a-b) = a² - b²</FormulaBox>
      </ConceptBlock>
      <ConceptBlock title="二、根式与有理化">
        <FormulaBox>√a × √b = √(ab)（a,b≥0） √(a+b) ≠ √a + √b √(a²+b²) 不可化简</FormulaBox>
        <p>分母有理化：分子分母同乘共轭根式。平方法消去根号。</p>
      </ConceptBlock>
      <ConceptBlock title="三、指数律">
        <FormulaBox>
          a^m × a^n = a^(m+n) a^m ÷ a^n = a^(m-n) (a^m)^n = a^(mn)<br>
          a⁰ = 1 (a≠0) a^(-n) = 1/a^n
        </FormulaBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>(a+b)²=a²+b²</b>：漏掉2ab项</li>
        <li><b>√(a²+b²)=a+b</b>：根号不能拆分加减法</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>完全平方公式必记</b>：(a±b)²=a²±2ab+b²</li>
        <li><b>根式化简先看能不能提完全平方因子</b></li>
      </ul>
    </template>
  </TeachingLayout>
</template>

<script setup>
import TeachingLayout from '@/components/common/TeachingLayout.vue'
import ConceptBlock from '@/components/common/ConceptBlock.vue'
import FormulaBox from '@/components/common/FormulaBox.vue'

const objectives = [
  '掌握代数式展开与合并同类项', '熟记完全平方公式与平方差公式',
  '理解根式运算规则和分母有理化', '掌握指数律（乘除幂法则）'
]
</script>
