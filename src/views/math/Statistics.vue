<template>
  <TeachingLayout :objectives="objectives">
    <template #concepts>
      <ConceptBlock title="一、集中趋势的度量" tag="★ 基础">
        <FormulaBox>
          <b>平均数</b> μ = Σx/n <b>加权平均数</b> = Σ(w_i·x_i)/Σw_i<br>
          <b>中位数</b>：数据排序后中间值（偶数为中间两数平均）<br>
          <b>众数</b>：出现次数最多的值（可能有多个或没有）
        </FormulaBox>
        <p>中位数不受离群值影响，平均数受离群值影响较大。分布右偏时平均数&gt;中位数。</p>
      </ConceptBlock>
      <ConceptBlock title="二、离散程度的度量" tag="★ 基础">
        <FormulaBox>
          方差 σ² = Σ(x−μ)²/n（母体） 或 s² = Σ(x−x̄)²/(n−1)（样本）<br>
          标准差 σ = √σ²  四分位距 IQR = Q₃ − Q₁<br>
          极差（Range）= 最大值 − 最小值
        </FormulaBox>
        <p>标准差越小，数据越集中。IQR不受离群值影响，比极差更稳定。</p>
      </ConceptBlock>
      <ConceptBlock title="三、百分位数与箱线图" tag="★★ 进阶">
        <p><b>第p百分位数</b>：至少有p%的数据 ≤ 该值。中位数=第50百分位数，Q₁=第25百分位数，Q₃=第75百分位数。</p>
        <p><b>箱线图</b>：显示 Min、Q₁、Median、Q₃、Max。<b>离群值</b>通常定义为 &lt;Q₁−1.5×IQR 或 &gt;Q₃+1.5×IQR 的数据点。</p>
      </ConceptBlock>
      <ConceptBlock title="四、常见统计图表" tag="★ 基础">
        <p>· <b>茎叶图</b>：保留原始数据，适合小数据集，可快速找中位数和众数</p>
        <p>· <b>直方图</b>：显示连续数据的频率分布，柱面积=频率（等宽时柱高=频率）</p>
        <p>· <b>累积频率多边形</b>：从直方图累积而来，可读取中位数和百分位数</p>
        <p>· <b>散点图</b>：展示两变量关系，每个点代表一个观测</p>
      </ConceptBlock>
      <ConceptBlock title="五、数据变换对统计量的影响" tag="★★★ DSE">
        <p>若新数据 y = ax + b（a,b为常数）：</p>
        <FormulaBox>
          新平均数 = a·原平均数 + b<br>
          新中位数 = a·原中位数 + b<br>
          新标准差 = |a|·原标准差 （加b不影响标准差）<br>
          新方差 = a²·原方差 （加b不影响方差）<br>
          新IQR = |a|·原IQR
        </FormulaBox>
        <ExampleBox><b>例</b>：已知某班平均分60、标准差8。若每人加5分再乘1.2，则新平均=1.2×(60+5)=78，新标准差=|1.2|×8=9.6</ExampleBox>
      </ConceptBlock>
      <ConceptBlock title="六、相关性与回归直线" tag="★★★ DSE">
        <p><b>正相关</b>：散点图从左下到右上。x增大y也增大。<b>负相关</b>：从左上到右下。</p>
        <p><b>相关系数r</b>：−1≤r≤1。|r|越接近1，线性关系越强。r=0无线性相关（可能有其他关系）。</p>
        <p><b>回归直线y=a+bx</b> 通过数据中心(\\(\\bar{x},\\bar{y}\\))，用于预测。不要将回归预测外推到数据范围之外。</p>
      </ConceptBlock>
      <ConceptBlock title="七、正态分布基础" tag="★★★ DSE">
        <p>正态分布的特征：钟形对称曲线，以平均数μ为中心。约68%数据在μ±σ内，约95%在μ±2σ内，约99.7%在μ±3σ内。</p>
        <p>标准分（z-score）：z = (x−μ)/σ。表示数据离平均数有几个标准差。</p>
        <FormulaBox>标准分 z = (x − μ) / σ<br>正z值表示高于平均，负z值表示低于平均</FormulaBox>
        <ExampleBox><b>例</b>：某考试μ=70, σ=10，小明得85分 → z=(85−70)/10=1.5 → 比平均高1.5个标准差</ExampleBox>
      </ConceptBlock>
    </template>
    <template #misconceptions>
      <ul>
        <li><b>标准差公式混淆</b>：母体÷n，样本÷(n−1)。DSE通常用母体公式</li>
        <li><b>中位数计算</b>：偶数个数据时取中间两个的平均数，不是取任意一个</li>
        <li><b>数据加常数不影响标准差</b>：y=x+b时标准差不变（所有数据平移）</li>
        <li><b>乘常数标准差也乘|a|</b>：y=ax时标准差变为|a|倍（不是a²倍，那是方差）</li>
        <li><b>相关系数=0不等于没有关系</b>：可能只是没有线性关系（如y=x²可能r≈0）</li>
        <li><b>回归直线不应用于超范围预测</b>：数据范围外的外推不可靠</li>
      </ul>
    </template>
    <template #strategies>
      <ul>
        <li><b>比较数据稳定性用标准差或IQR</b>：标准差越小越稳定，IQR适合有离群值的情形</li>
        <li><b>数据变换问题</b>：牢记加b不改离散度量（SD/IQR/方差），乘a改均值也改离散</li>
        <li><b>箱线图分析</b>：关注IQR和中位数判断数据集中度和对称性</li>
        <li><b>加权平均</b>：Σ(权×值)/Σ权 — 常用于计算（不同比重科目）的总平均分</li>
        <li><b>标准分用于横向比较</b>：不同科目用z-score比较学生在班级中的相对位置</li>
        <li><b>频数分布表求平均数</b>：用组中点×频数求和再除以总频数</li>
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
  '掌握平均数、中位数、众数的计算与选用',
  '理解方差和标准差的含义及公式',
  '能区分母体标准差（÷n）和样本标准差（÷(n−1)）',
  '掌握箱线图的构成和百分位数计算',
  '理解数据变换对均值、标准差、IQR的影响',
  '了解相关系数和回归直线的基本概念',
  '理解标准分z-score的含义和计算方法'
]
</script>
