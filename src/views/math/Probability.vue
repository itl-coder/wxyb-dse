<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、概率的基本概念" tag="★ 基础">
        <FormulaBox>P(E) = 有利结果数 / 总结果数 0 ≤ P(E) ≤ 1<br>P(必然事件) = 1 P(不可能事件) = 0 P(A') = 1−P(A)</FormulaBox>
        <p><b>样本空间S</b>：所有可能结果的集合。<b>事件E</b>：样本空间的子集。</p>
      </ConceptBlock>
      <ConceptBlock title="二、排列与组合" tag="★ 基础">
        <FormulaBox>
          排列 P(n,r) = n!/(n−r)! —— 顺序重要（选r个排成一列）<br>
          组合 C(n,r) = n!/[r!(n−r)!] —— 顺序不重要（选r个放入一组）<br>
          常用值：C(n,0)=1, C(n,1)=n, C(n,n)=1, C(n,r)=C(n,n−r)
        </FormulaBox>
        <ExampleBox><b>例</b>：5人选3人排成一列 = P(5,3)=60；5人选3人组成小组 = C(5,3)=10</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="三、计数方法在概率中的应用" tag="★★ 进阶">
        <p><b>乘法原理</b>：事件A有m种方式，事件B有n种方式，则A和B连续发生有m×n种方式。</p>
        <p><b>加法原理</b>：事件A有m种方式，事件B有n种方式（互斥），则A或B发生有m+n种方式。</p>
        <ExampleBox><b>例</b>：从5男4女中选2男2女组成委员会。选2男=C(5,2)=10，选2女=C(4,2)=6 → 总方式=10×6=60</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="四、条件概率与独立性" tag="★★ 进阶">
        <FormulaBox>条件概率：P(A|B) = P(A∩B) / P(B)，其中P(B)&gt;0<br>独立事件：P(A∩B) = P(A)×P(B) 或 P(A|B)=P(A)<br>互斥事件：A∩B=∅, P(A∪B)=P(A)+P(B)<br>一般加法公式：P(A∪B)=P(A)+P(B)−P(A∩B)</FormulaBox>
        <ExampleBox><b>例</b>：抽两张牌不放回，第一张是A (A事件) 且第二张是K (B事件)。P(A∩B)=(4/52)×(4/51)=16/2652。P(B|A)=4/51</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="五、至少一个模式" tag="★★★ DSE">
        <FormulaBox>P(至少一个) = 1 − P(一个都没有)</FormulaBox>
        <p>遇到"至少"问题时，先求补事件的概率往往更简单。</p>
        <ExampleBox><b>例</b>：掷3枚公平硬币，至少1枚正面的概率 = 1−P(全部反面) = 1−(1/2)³ = 7/8</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="六、期望值 (Expected Value)" tag="★★★ DSE">
        <FormulaBox>E(X) = Σ x_i · P(X=x_i)<br>性质：E(aX+b) = a·E(X)+b E(X+Y) = E(X)+E(Y)</FormulaBox>
        <p>期望值是随机变量的长期平均值。可用于判断一个游戏是否"公平"。</p>
        <ExampleBox><b>例</b>：掷一枚骰子，掷出6赢$10，否则输$2。E = 10×(1/6)+(−2)×(5/6) = (10−10)/6 = $0 → 公平游戏</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="七、树状图与分步概率" tag="★★ 进阶">
        <p><b>树状图</b>用于分步（多阶段）概率问题。每条路径的概率 = 沿途各步概率的乘积。多个路径的概率相加。</p>
        <ExampleBox><b>例</b>：盒子有3红2白，不放回抽两个。P(同色) = P(RR)+P(WW) = (3/5)(2/4)+(2/5)(1/4) = 6/20+2/20 = 2/5</ExampleBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>排列组合混淆</b>：有序用排列，无序用组合。关键词："排成一列"vs"选出"</li>
        <li><b>概率直接相加</b>：只有互斥事件 P(A∪B)=P(A)+P(B)，非互斥必须减交集</li>
        <li><b>"独立"和"互斥"搞混</b>：独立→一个发生不影响另一个。互斥→两个不可能同时发生。互斥必不独立(P&gt;0时)</li>
        <li><b>条件概率分母用错</b>：P(A|B) 的分母是 P(B)（给定条件的事件的概率）</li>
        <li><b>不放回抽样忘记调整分母</b>：抽第二个时分母少1</li>
        <li><b>期望值用胜率而非实际净收益计算</b>：E = 赢×赢钱+输×输钱</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>枚举法</b>：DSE基础题用枚举法最安全，以防遗漏</li>
        <li><b>树状图</b>：多步概率题画树状图，每枝标概率，末端相乘路径求和</li>
        <li><b>"至少"=1−补集</b>：1−P(一个都没有) 比逐项求P(1个)+P(2个)+...方便</li>
        <li><b>有放回 vs 无放回</b>：有放回→每次概率不变；无放回→分母逐次减1</li>
        <li><b>条件概率先缩小样本空间</b>：给定B已发生，只在B的范围内考虑</li>
        <li><b>期望值判断公平性</b>：E=0为公平，E&gt;0有利玩家，E&lt;0不利玩家</li>
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
  '掌握概率的基本定义和取值范围',
  '区分排列P(n,r)（有序）和组合C(n,r)（无序）',
  '熟练运用乘法原理和加法原理计数',
  '理解条件概率P(A|B)及其计算',
  '掌握独立事件和互斥事件的判断与公式',
  '运用"至少一个"=1−补集策略解题',
  '理解期望值的含义并能计算'
]
</script>
