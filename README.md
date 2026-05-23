# DSE AI 学情问诊系统

威学一百国际教育 — DSE 学习管理与智能诊断平台。为教师提供学生成绩分析、家长会准备、课堂表现追踪、考试座位编排等全套教务工具，为学生提供个性化学习门户。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3.4 (Composition API) |
| 构建 | Vite 5.2 |
| 状态管理 | Pinia 3.0 |
| 路由 | Vue Router 4.3 |
| UI 组件库 | Element Plus 2.6 |
| 图表 | ECharts 5.5 + vue-echarts |
| Markdown | md-editor-v3 + markdown-it |
| 数学渲染 | KaTeX + MathJax |
| 图形 | P5.js + Three.js |
| 导出 | html2canvas、xlsx (SheetJS) |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器 (http://localhost:3000)
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
dse-vue/
├── index.html                  # 入口 HTML
├── vite.config.js              # Vite 配置（@ 别名 → src/）
├── jsconfig.json               # VS Code 路径映射
├── .editorconfig               # 编辑器统一配置
├── eslint.config.js            # ESLint 规则
├── .prettierrc                 # Prettier 格式化
├── package.json                # 依赖与脚本
│
└── src/
    ├── main.js                 # 应用入口：导入样式 → 初始化数据 → 挂载
    ├── App.vue                 # 根组件（主题初始化 + router-view）
    │
    ├── assets/                 # 静态资源（图片、字体等）
    │
    ├── components/             # 共享组件
    │   ├── admin/              #   管理后台专用组件（下拉选择等）
    │   ├── common/             #   通用组件（数学渲染、编辑器、布局）
    │   └── login/              #   登录页视觉组件（粒子、动画、输入框）
    │
    ├── composables/            # 组合式函数（复用逻辑）
    │   ├── useAttachment.js    #   附件上传（FileReader → base64）
    │   ├── useExcel.js         #   Excel 导入导出
    │   ├── useKatex.js         #   LaTeX 数学公式渲染
    │   └── useScopedData.js    #   数据范围过滤（按校区/班级/本人）
    │
    ├── content/                # 静态学习内容（DSE 知识、题库、范文）
    │
    ├── layouts/                # 布局外壳
    │   ├── AdminLayout.vue     #   管理后台布局（侧边栏 + 顶栏 + 内容区）
    │   ├── DefaultLayout.vue   #   公共页面布局
    │   └── PortalLayout.vue    #   学生/家长门户布局
    │
    ├── router/                 # 路由配置
    │   └── index.js            #   全部路由定义 + 权限守卫
    │
    ├── services/               # 数据服务层（localStorage 模拟后端）
    │   └── dataService.js      #   核心：所有 CRUD 服务 + 种子数据
    │
    ├── stores/                 # Pinia 状态管理
    │   ├── index.js            #   Pinia 实例创建
    │   └── app.js              #   全局状态（主题/用户/权限/收藏/设置）
    │
    ├── styles/                 # 样式系统
    │   ├── tokens.css          #   设计令牌（颜色/字体/间距/阴影/动画）
    │   ├── main.css            #   门户/公共页面样式
    │   └── admin.css           #   管理后台样式
    │
    ├── utils/                  # 工具函数
    │   ├── printTemplate.js    #   打印/导出 HTML 模板
    │   ├── renderContent.js    #   Markdown 内容渲染
    │   └── watermark.js        #   水印生成
    │
    └── views/                  # 页面视图
        ├── admin/              #   管理后台页面（27 个功能模块）
        ├── math/               #   数学交互学习页面（14 个专题）
        ├── portal/             #   学生/家长门户页面
        ├── subjects/           #   学科页面（中文/化学/物理）
        ├── HomePage.vue        #   首页
        ├── Knowledge.vue       #   知识总结页
        ├── Mistakes.vue        #   错题整理页
        └── Practice.vue        #   练习页
```

## 管理后台功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 数据看板 | `/admin` | 核心指标概览 |
| 课表管理 | `/admin/timetable` | 周/月课表 + 图片导入 |
| 课堂表现 | `/admin/behavior` | 学生课堂行为记录 |
| 作业管理 | `/admin/homework` | 作业追踪 + 布置分发 |
| 早晚班交接 | `/admin/handover` | 班次交接记录 |
| 纪律台账 | `/admin/discipline` | 纪律事件管理 |
| 手机管理 | `/admin/phone` | 手机收发记录 |
| 考勤请假 | `/admin/attendance` | 出勤/请假管理 |
| 成长日报 | `/admin/reports` | Markdown 周报 + 导出 |
| 试卷错题 | `/admin/exam` | 考试分析 + 错题管理 |
| 智能出题 | `/admin/questions` | AI 辅助出题 |
| 心理辅导 | `/admin/counseling` | 心理状态跟踪 + 录音 |
| 家长会准备 | `/admin/conference` | 文稿生成 + 导出 |
| 家长会预约 | `/admin/parent-conference` | 预约管理 + 日历 |
| 语音记录 | `/admin/voice` | 语音备忘管理 |
| 学生信息 | `/admin/students` | 学生档案 CRUD |
| 课程维护 | `/admin/courses` | 课程信息管理 |
| 课堂反馈 | `/admin/course-feedback` | 教学反馈收集 |
| 系统设置 | `/admin/settings` | 学校信息 + 水印 |
| 配置中心 | `/admin/config` | 门户可见性配置 |
| 用户管理 | `/admin/users` | RBAC 用户 CRUD |
| 角色管理 | `/admin/roles` | RBAC 角色权限分配 |
| 题库中心 | `/admin/question-bank` | 题库 CRUD |
| 做题技巧 | `/admin/exam-tips` | 考试技巧管理 |
| 考试座位 | `/admin/exam-seat` | 座位编排 + 导出 |
| AI 数据收录 | `/admin/ai-*` | Skills/公式/工具/语录/Prompt 收录 |

## 三个前端入口

| 入口 | 路径 | 用户 | 布局 |
|------|------|------|------|
| 公共页面 | `/` | 所有访客 | DefaultLayout |
| 管理后台 | `/admin` | 管理员/教师 | AdminLayout |
| 学生门户 | `/portal` | 学生/家长 | PortalLayout |

## 开发说明

- **数据存储**：当前使用 localStorage 模拟后端，所有数据操作在 `src/services/dataService.js` 中
- **权限系统**：RBAC 基于角色，60+ 权限点，24 个菜单项，4 种数据范围
- **主题系统**：双主题（浅色/深色）+ 双场景（门户/管理后台），CSS 变量在 `src/styles/tokens.css` 中定义
- **路径别名**：`@/` 映射到 `src/`，配置在 `vite.config.js` 和 `jsconfig.json` 中
