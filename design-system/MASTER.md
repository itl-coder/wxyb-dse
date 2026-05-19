# DSE 智能学情管理系统 — Design System Master

> 基于 UI/UX Pro Max 设计智能数据库 + 项目现状分析生成
> 产品类型: Educational App + Admin Dashboard
> 风格: Claymorphism × Vibrant Block × Modern Professional
> 最后更新: 2026-05-18

---

## 1. 设计原则

| 原则 | 描述 | 准则 |
|------|------|------|
| **温暖专业** | 教育产品需要信任感+亲近感 | 不用纯黑纯白，用暖色偏移的灰阶 |
| **信息清晰** | 数据密集型界面，层次必须分明 | 卡片分级、间距分级、字重分级 |
| **动效克制** | 教育场景下动效辅助理解而非炫技 | 150–300ms，最多2个元素同时动 |
| **全中文友好** | 中文字体呈现优先级高于英文 | 正文≥14px，行高≥1.7，字重≥400 |
| **双模一致** | 门户(学习端) + 管理后台 | 共用 token 体系，仅氛围区分 |

---

## 2. 色彩系统

### 2.1 品牌色（沿用现有 Indigo 体系并微调）

来自 UI/UX Pro Max 推荐: Educational App → Playful indigo + energetic orange

```
Primary Family:
  --color-primary-50:  #EEF2FF
  --color-primary-100: #E0E7FF
  --color-primary-200: #C7D2FE
  --color-primary-300: #A5B4FC
  --color-primary-400: #818CF8
  --color-primary-500: #6366F1   ← Brand
  --color-primary-600: #4F46E5
  --color-primary-700: #4338CA
  --color-primary-800: #3730A3
  --color-primary-900: #312E81
  --color-primary-950: #1E1B4B
```

### 2.2 语义色

```
Success: #10B981 → light bg rgba(16,185,129,0.12)
Warning: #F59E0B → light bg rgba(245,158,11,0.12)
Danger:  #EF4444 → light bg rgba(239,68,68,0.12)
Info:    #3B82F6 → light bg rgba(59,130,246,0.12)
Accent:  #F97316 ← Energetic Orange (用于CTA/高亮)
```

### 2.3 Surface & Text Tokens（门户 — 暖色调）

```css
[data-theme="portal"] {
  /* Surfaces */
  --surface-bg:        #FAF9F6;    /* 暖灰基底 */
  --surface-bg-warm:   #F5F2ED;    /* 暖色偏移 */
  --surface-card:      #FFFFFF;
  --surface-card-warm: #FDFCFA;

  /* Text */
  --text-primary:      #1A1A24;    /* 接近黑但偏暖 */
  --text-regular:      #4A4A5E;
  --text-secondary:    #78788E;
  --text-muted:        #A0A0B0;
  --text-on-brand:     #FFFFFF;

  /* Borders */
  --border-base:       #E0DDD8;
  --border-light:      #EDEAE6;
  --border-lighter:    #F5F3F0;

  /* Shadows (暖色投射) */
  --shadow-card:       0 2px 8px rgba(49, 46, 129, 0.04);
  --shadow-card-hover: 0 4px 18px rgba(49, 46, 129, 0.08);
  --shadow-modal:      0 12px 40px rgba(49, 46, 129, 0.12);
}
```

### 2.4 Surface & Text Tokens（管理后台 — 科技感暗色）

```css
[data-theme="admin"] {
  /* Surfaces — 深海暗色 */
  --admin-bg:           #06090F;
  --admin-bg-secondary: #0B101E;
  --admin-surface:      #0D1323;
  --admin-surface-hover:#131B30;
  --admin-surface-active:#18203C;

  /* Text — 高明度确保可读性 */
  --admin-text:         #E4ECF6;
  --admin-text-secondary:#8899B4;
  --admin-text-muted:   #4A5470;

  /* Borders */
  --admin-border:       #1A2340;
  --admin-border-light: #243050;

  /* Accent gradient (Indigo → Cyan) */
  --admin-accent-gradient: linear-gradient(135deg, #6366F1, #06B6D4);

  /* Shadows (深邃) */
  --admin-shadow-card:  0 1px 3px rgba(0,0,0,0.4);
  --admin-shadow-hover: 0 4px 16px rgba(0,0,0,0.5);
}
```

### 2.5 图表色板（ECharts 专用）

```js
// 学情分析图表色板 — 10 色，色盲友好
const CHART_PALETTE = [
  '#6366F1', // Indigo   — 主色
  '#06B6D4', // Cyan     — 对比色
  '#10B981', // Green    — 达标/进步
  '#F59E0B', // Amber    — 预警/注意
  '#EF4444', // Red      — 退步/不及格
  '#8B5CF6', // Violet   — 扩展
  '#EC4899', // Pink     — 扩展
  '#F97316', // Orange   — 高亮
  '#3B82F6', // Blue     — 扩展
  '#14B8A6', // Teal     — 扩展
];
```

---

## 3. 字体系统

### 3.1 字体栈

来自 UI/UX Pro Max 推荐: Chinese Simplified → Noto Sans SC

```css
:root {
  --font-display: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;
  --font-body:    'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
  --font-mono:    'JetBrains Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace;
}
```

> **注意**: 如果 Google Fonts 在国内无法加载，回退到 PingFang SC / Microsoft YaHei 系统字体。两种方案效果相近。

### 3.2 字体加载策略

```html
<!-- 仅预加载关键字体 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- 使用 &display=swap 避免 FOIT，子集化仅加载 SC -->
```

### 3.3 字号层级

| Token | Size | Weight | Line Height | 用途 |
|-------|------|--------|-------------|------|
| `text-xs` | 11px | 400 | 1.5 | 标签、辅助信息 |
| `text-sm` | 13px | 400 | 1.6 | 表格内容、描述文本 |
| `text-base` | 15px | 400 | 1.7 | 正文 |
| `text-lg` | 17px | 500 | 1.6 | 卡片标题、强调文本 |
| `text-xl` | 20px | 600 | 1.4 | 页面标题 |
| `text-2xl` | 24px | 700 | 1.3 | 仪表盘主标题 |
| `text-3xl` | 32px | 700 | 1.2 | 统计数值 |
| `text-4xl` | 40px | 700 | 1.1 | Hero 大数字 |

---

## 4. 间距与布局

### 4.1 8dp 间距系统

```
--space-0:   0
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
```

### 4.2 响应式断点

```
xs:   0–374px   (小手机)
sm:   375px+    (iPhone SE/6/7/8)
md:   768px+    (iPad 竖屏)
lg:   1024px+   (iPad 横屏 / 小笔记本)
xl:   1280px+   (桌面)
2xl:  1440px+   (大屏)
```

### 4.3 容器宽度

```
.content-container:
  max-width: 1400px (现有，保持)
  padding: var(--space-5) on desktop
  padding: var(--space-4) on tablet
  padding: var(--space-3) on mobile
```

---

## 5. 组件规范

### 5.1 圆角

```
--radius-sm:  6px   (按钮、输入框、标签)
--radius-md:  10px  (卡片、面板)
--radius-lg:  14px  (大卡片、Modal)
--radius-xl:  20px  (Hero 区域)
--radius-full: 999px (胶囊按钮、头像)
```

### 5.2 阴影层级

```
Level 0: none                  (平面元素)
Level 1: --shadow-card         (默认卡片)
Level 2: --shadow-card-hover   (卡片 Hover)
Level 3: --shadow-modal        (Modal / Drawer)
Level 4: --shadow-toast        (Toast / Tooltip)
```

### 5.3 按钮规范

| 层级 | 样式 | 使用场景 |
|------|------|---------|
| Primary | 渐变背景 + 白色文字 | 主操作（提交、保存、生成） |
| Secondary | 透明 + 1px 边框 | 次要操作（取消、返回） |
| Tertiary | 纯文字、无边框 | 表格内操作、链接类 |
| Danger | 红色半透明背景 | 删除、注销 |
| Disabled | opacity 0.4 + cursor not-allowed | 不可用状态 |

按钮最小高度: 36px，内联 padding: 8px 20px
触摸目标: ≥44×44pt（iOS）/ ≥48×48dp（Android）

### 5.4 卡片规范

```
基础卡片:
  background: surface-card
  border: 1px solid border-lighter
  border-radius: radius-md (10px)
  padding: 20px
  shadow: shadow-card
  transition: all 0.25s ease

Hover:
  shadow → shadow-card-hover
  border-color → primary-200
  transform: translateY(-1px)

统计卡片 (Stat Card):
  左侧色块装饰 (4px 宽，品牌色)
  内部 flex 左右布局
  大数字 (32px) + 标签 (13px)
```

### 5.5 表格规范

```
表头:
  background: rgba(99,102,241,0.04)
  font: 12px / 600 / uppercase / letter-spacing 0.5px
  border-bottom: 2px solid border-light

行:
  padding: 10px 14px
  font: 13px
  hover: background rgba(99,102,241,0.04)
  striped: even rows rgba(0,0,0,0.015)

操作列:
  固定宽度 80-100px
  white-space: nowrap
  按钮组 gap: 4px
```

### 5.6 表单规范

```
Label:
  display: block
  font: 13px / 600
  color: text-regular
  margin-bottom: 6px

Input:
  height: 40px (min)
  padding: 8px 12px
  border: 1px solid border-base
  border-radius: radius-sm (6px)
  background: surface-bg
  font: 14px / font-body

Focus:
  border-color → primary-400
  box-shadow: 0 0 0 3px rgba(99,102,241,0.2)

Error:
  border-color → danger
  下方红色提示文字 (12px)
```

---

## 6. 动效规范

### 6.1 时长 Token

```
--duration-fast:     150ms  (微交互: hover, focus, ripple)
--duration-normal:   250ms  (过渡: card hover, tab switch, expand)
--duration-slow:     350ms  (页面切换: route transition, modal open)
```

### 6.2 缓动 Token

```
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1)   ← 进场
--ease-in:     cubic-bezier(0.4, 0, 1, 1)       ← 退场
--ease-in-out:  cubic-bezier(0.65, 0, 0.35, 1)  ← 持续动画
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1) ← 弹性强调
```

### 6.3 动效场景

| 场景 | 时长 | 缓动 | 效果 |
|------|------|------|------|
| 按钮 press | 150ms | ease-out | scale(0.97) + 压暗 |
| Card hover | 250ms | ease-out | translateY(-2px) + shadow |
| Modal 入场 | 300ms | ease-spring | scale(0.95→1) + fade in |
| Page 切换 | 300ms | ease-out | fade up (Y: 12px→0) |
| Stagger 列表 | 50ms/项 | ease-out | 逐项 fade up |
| Toast 入场 | 250ms | ease-spring | slide down + fade |
| Skeleton 加载 | 持续 | — | shimmer 动画 1.5s 循环 |
| 数据刷新 | 200ms | ease-out | crossfade 内容 |

### 6.4 关键规则

- 退场动画比进场短 30-40%
- 动画使用 `transform` + `opacity`，禁用 `width`/`height`
- 遵循 `prefers-reduced-motion`
- 每个视图最多 1-2 个动效焦点

---

## 7. 图标体系

### 7.1 图标来源

```
主要: @element-plus/icons-vue (已安装)
补充: Lucide Icons (如需更多选择)
```

### 7.2 图标尺寸

```
--icon-sm:  16px  (表格内、行内)
--icon-md:  20px  (按钮、导航)
--icon-lg:  24px  (卡片标题区)
--icon-xl:  32px  (统计卡片、Hero)
```

### 7.3 规则

- 禁止使用 Emoji 作为结构性图标
- 同一层级图标风格统一（填充/描边二选一）
- 描边宽度保持一致（推荐 1.5px 或 2px）
- 图标必须设置 `aria-label` 或伴随文字标签

---

## 8. ECharts 图表规范

### 8.1 全局主题配置

```js
// 学情分析图表默认配置
const ECHART_BASE_THEME = {
  textStyle: { fontFamily: 'var(--font-body)' },
  grid: { top: 40, right: 24, bottom: 32, left: 48 },
  legend: { textStyle: { fontSize: 12 } },
  tooltip: { backgroundColor: 'rgba(13,19,35,0.92)', borderColor: '#1A2340' },
};
```

### 8.2 图表类型选择

| 数据场景 | 推荐类型 | 说明 |
|---------|---------|------|
| 成绩趋势（时间） | 折线图 | 多学生/多科目对比线 |
| 班级成绩分布 | 柱状图/直方图 | 分数段统计 |
| 各科得分占比 | 雷达图 | 个人能力分布 |
| 及格/优秀率 | 饼图/环形图 | ≤5 个类别 |
| 排名变化 | 折线图+标记 | 每次考试排名趋势 |
| 知识点掌握度 | 热力图 | 学生×知识点矩阵 |
| 目标达成率 | 仪表盘/进度条 | 单值对比目标 |

### 8.3 图表可访问性

- 图例必须显示（不能只靠颜色区分）
- 关键数据点提供 tooltip + 表格双呈现
- 色盲友好配色（已内置绿色→黄→蓝区分，而非红→绿）
- 为图表提供 `aria-label` 摘要描述

---

## 9. 无障碍检查清单

- [ ] 文本对比度 ≥ 4.5:1（正文） / ≥ 3:1（大文本≥18px）
- [ ] 所有图标按钮有 `aria-label`
- [ ] 表单字段有 label + error 提示
- [ ] focus-visible 可见（2px 品牌色描边）
- [ ] 颜色不是唯一信息传递方式（错误/成功同时显示图标）
- [ ] 支持 prefers-reduced-motion
- [ ] 触摸目标 ≥ 44×44pt
- [ ] 键盘可操作所有交互元素

---

## 10. 重构迁移计划

### 阶段一：Token 统一（影响全局）

1. 提取公共 CSS 变量到 `src/styles/tokens.css`（颜色、间距、字体、动效）
2. `main.css` 精简为布局+组件样式
3. `admin.css` 精简为管理后台特有样式
4. 删除重复定义的变量

### 阶段二：组件规范化（逐个模块）

1. 按钮 → 统一 4 级按钮样式
2. 卡片 → 统一 padding/radius/shadow
3. 表格 → 统一字体/间距/hover
4. 表单 → 统一 label/input/error 模式
5. 标签/徽章 → 统一语义色映射

### 阶段三：细节打磨

1. 加载状态 → Skeleton screen（替换无修饰 spinner）
2. 空状态 → 统一插图 + 引导文案
3. 错误状态 → 统一 error + retry 模式
4. 动画 → 统一 duration/easing token

### 阶段四：Element Plus 深度集成

1. 通过 Element Plus CSS Variables 注入品牌色
2. 统一 ElTable / ElForm / ElDialog 的暗色/亮色变量
3. 自定义 Element Plus 组件的默认 props

---

## 附录 A: Element Plus SCSS 变量覆盖参考

```scss
// element-plus 主题覆盖
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
  $colors: (
    'primary': (
      'base': #6366f1,
    ),
  ),
  $common: (
    'border-radius': 6px,
    'font-family': ('Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif),
  ),
);
```

## 附录 B: 参考项目风格

- **Notion** — Warm paper-like surfaces, clean typography
- **Linear** — Dark theme polish, micro-interactions, keyboard-first
- **Vercel** — Geometric minimalism, gradient accents
- **飞书 (Feishu/Lark)** — Chinese-native design system, excellent CJK typography

---

*此文件为 MASTER.md（全球唯一真相源）。页面级样式在 `design-system/pages/` 目录下按页面名存储，其规则可覆盖 MASTER。*
