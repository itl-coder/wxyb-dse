# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-05-23
> Files: 135 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `CLAUDE.md` — OpenWolf (~57 tok)
- `useOCR.js` — Exports performOCR, extractQuestionNumbers, extractFormulas, tesseract.js动态import+降级方案 (~180 tok)
- `MistakeOcrUpload.vue` — Vue: setup, 错题OCR上传3步组件(上传→识别→校正), 支持题号/公式提取+科目来源知识点元信息 (~270 tok)
- `index.html` — DSE 智能学习系统 (~122 tok)
- `package-lock.json` — npm lock file (~16860 tok)
- `package.json` — Node.js package manifest, includes vue-draggable-plus (~165 tok)
- `vite.config.js` — Vite build configuration (~80 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .claude/skills/ui-ux-pro-max/

- `SKILL.md` — UI/UX Pro Max - Design Intelligence (~3521 tok)

## .claude/skills/ui-ux-pro-max/data/

- `charts.csv` (~2013 tok)
- `colors.csv` (~2591 tok)
- `icons.csv` (~3570 tok)
- `landing.csv` (~3837 tok)
- `products.csv` (~7944 tok)
- `react-performance.csv` — Exports getUser (~3953 tok)
- `styles.csv` — Declares hierarchy (~25313 tok)
- `typography.csv` (~8501 tok)
- `ui-reasoning.csv` (~8286 tok)
- `ux-guidelines.csv` (~5005 tok)
- `web-interface.csv` — Declares email (~1993 tok)

## .claude/skills/ui-ux-pro-max/data/stacks/

- `astro.csv` — Exports prerender (~3165 tok)
- `flutter.csv` — Declares MyWidget (~2792 tok)
- `html-tailwind.csv` — /*.{js,ts,jsx,tsx}']",purge: [...],High,https://tailwindcss.com/docs/content-configuration (~3030 tok)
- `jetpack-compose.csv` — Declares Route (~2185 tok)
- `nextjs.csv` — Exports Page (~3346 tok)
- `nuxt-ui.csv` — Declares overlay (~3736 tok)
- `nuxtjs.csv` — in: submit, submit (~4411 tok)
- `react-native.csv` — Declares App (~2676 tok)
- `react.csv` — total: User, User, Button + 3 more (~3471 tok)
- `shadcn.csv` — Declares styles (~4246 tok)
- `svelte.csv` — Exports load (~2951 tok)
- `swiftui.csv` — Declares MyView (~2900 tok)
- `vue.csv` — Exports useFetch (~2949 tok)

## .claude/skills/ui-ux-pro-max/scripts/

- `core.py` — -*- coding: utf-8 -*- (~2922 tok)
- `design_system.py` — -*- coding: utf-8 -*- (~12449 tok)
- `search.py` — -*- coding: utf-8 -*- (~1563 tok)

## src/

- `App.vue` — Vue: setup (~18 tok)
- `main.js` — Declares app (~164 tok)

## src/components/

- `MarkdownEditor.vue` — Vue: setup, markdown-it-katex预览, 编辑/分屏/预览三模式+LaTeX工具栏 (~400 tok)

## src/components/admin/

- `ClassSelect.vue` — Vue: setup, emits (~144 tok)
- `ConfirmDelete.vue` — Vue: setup (~100 tok)
- `StudentSelect.vue` — Vue: setup, emits (~192 tok)

## src/components/login/

- `AiMascot.vue` — Vue: setup, AI宠物"小智", 纯CSS动画(浮动/眨眼/瞳孔/光环/星光) (~800 tok)
- `AnimatedBorder.vue` — Vue: setup, 流动渐变边框组件, conic-gradient动画+mask技术 (~120 tok)
- `FloatingInput.vue` — Vue: setup, 浮动标签输入框, 支持图标/密码切换/错误状态 (~200 tok)
- `GlowButton.vue` — Vue: setup, 渐变流动+波纹+光泽跟随+loading状态升级版 (~300 tok)
- `ParallaxParticles.vue` — Vue: setup, Canvas粒子背景+鼠标视差+网格叠加+轨道光球 (~700 tok)
- `TechParticles.vue` — Vue: setup, AI科技粒子背景, Canvas 2D神经网络节点+扫描线+公式装饰+数据流弧线 (~300 tok)

## src/components/common/

- `AppHeader.vue` — Vue: setup, emits (~278 tok)
- `AppNavbar.vue` — Vue: setup (~511 tok)
- `ConceptBlock.vue` — Vue: setup (~88 tok)
- `ExampleBox.vue` — Vue component (~16 tok)
- `FormulaBox.vue` — Vue component (~18 tok)
- `FormulaContent.vue` — Vue: setup, 公式学习区(公式渲染/变体/推导步骤/关键要点) (~250 tok)
- `FormulaNavTree.vue` — Vue: setup, 公式导航树(搜索/分组展开/标签筛选) (~200 tok)
- `FormulaPageLayout.vue` — Vue: setup, 三栏可缩放布局(拖拽分栏/响应式折叠) (~220 tok)
- `FormulaSidebar.vue` — Vue: setup, 公式详情栏(例题/相关公式/常见错误/应用场景) (~230 tok)
- `KatexDisplay.vue` — Vue: setup, markdown-it-katex渲染器, 支持行内/块级/错误边界 (~200 tok)
- `DraggableContainer.vue` — Vue: setup, vue-draggable-plus wrapper with touch/mobile support + auto-scroll (~80 tok)
- `P5Canvas.vue` — Vue: setup, emits (~321 tok)
- `TeachingLayout.vue` — Vue: setup (~477 tok)
- `TableDensityController.vue` — Vue: setup, 表格密度3态切换按钮组(紧凑/默认/宽松), 全局useTableDensity (~50 tok)

## src/views/admin/exams/exam-seat2/

- `index.vue` — 考场座位2.0模块入口, 3栏可缩放面板(教室列表+座位表+学生池)+统计栏+工具栏+键盘快捷键 (~300 tok)

## src/views/admin/exams/exam-seat2/components/

- `ExamSeatCell.vue` — 单个座位格, 姓名/班级选修/座号, 10种状态颜色(含预留/外班预留/锁定/批量选中), CSS变量驱动 (~180 tok)
- `ExamSeatGrid.vue` — 原生table座位表, 反转行, 门口标记, 行/列批量选择, Ctrl多选, 框选, 增强右键菜单(预留/锁定/门口) (~300 tok)
- `ExamSeatHeader.vue` — 考试标题区(名称/日期/时间/教室信息), 门口方向/排列方式全局切换 (~230 tok)
- `ExamSeatLegend.vue` — 10色图例(已占/空位/锁定/预留/外班预留/屏蔽/缺考/特殊/专属/冲突) (~40 tok)
- `ExamSeatStudentPool.vue` — 学生池(vue-draggable-plus), 搜索/筛选/拖拽入座/多选批量放入教室 (~150 tok)
- `ExamSeatRoomSidebar.vue` — 教室列表(CRUD+容量进度条+快速操作)+配置对话框 (~200 tok)
- `ExamSeatPrint.vue` — 打印/导出对话框(3Tab:座位表PNG/JPG/PDF+门贴预览打印+Excel汇总名单统计) (~250 tok)
- `ExamRulePanel.vue` — 可折叠排座规则说明面板, 9条规则标签+冲突评分颜色指示 (~80 tok)
- `ExamConflictPanel.vue` — 冲突检测面板, 评分概览+分类冲突列表(同班相邻/同选相邻/跨室重复/专属违规) (~120 tok)
- `ExamDistributionAssist.vue` — 发卷辅助视图, 按科目/选修高亮座位, 方便监考分发试卷 (~100 tok)
- `ExamPaperStatistics.vue` — 考生画像Dashboard, 概览卡片+班级分布条+选修标签云+教室使用率+状态标签 (~200 tok)
- `ExamPaperPrintPreview.vue` — 试卷分发清单打印预览, A4排版+科目汇总 (~120 tok)
- `ExamElectiveProfile.vue` — 选修画像弹窗, 科目分布条形图+热门选修组合+班级×选修矩阵热力图 (~150 tok)
- `ExamSeatLockToolbar.vue` — 锁定/解锁工具栏(全部锁定/解锁+选中区域锁定/解锁) (~60 tok)

## src/views/admin/exams/exam-seat2/store/

- `examSeat2Store.js` — Pinia Store, 教室CRUD+学生管理+座位分配/交换/锁定/屏蔽+冲突检测+撤销+localStorage持久化 (~350 tok)
- `TopicCard.vue` — Vue: setup (~280 tok)

## src/views/admin/exams/exam-seat2/utils/

- `exportPipeline.js` — 统一导出管线(buildSeatChartHTML+buildDoorTagHTML+captureHTML离屏渲染+Canvas水印+PNG/JPG/PDF下载+打印+Excel导出) (~480 tok)

## src/components/student/

- `ImportPreviewDialog.vue` — 增强学生导入预览（异常检测/筛选/勾选/分页） (~300 tok)

## src/components/examtips/

- `TipReviewHistory.vue` — Vue: setup, 审核记录时间轴(提交/通过/驳回/重新提交), 彩色圆点+连线+驳回原因展示 (~90 tok)
- `TipReviewPanel.vue` — Vue: setup, 审核抽屉(el-drawer), 技巧只读预览+审核操作(通过/驳回+原因)+审核历史 (~180 tok)

## src/components/mistake/

- `MistakeOcrUpload.vue` — Vue: setup, 错题OCR上传3步组件(上传→识别→校正), 支持题号/公式提取+科目来源知识点元信息 (~270 tok)

## src/views/admin/homework/

- `Homework.vue` — Vue: setup, 作业管理2栏布局（顶部水平筛选栏+表格/卡片+右侧数据总览），支持内联标题编辑、按作业筛选、密度/列配置、卡片模式 (~700 tok)

## src/views/admin/homework/components/

- `HomeworkDetail.vue` — 作业详情视图（提交统计+学生明细表格） (~150 tok)
- `HomeworkStatsPanel.vue` — ECharts统计面板,2列布局,5图(科目提交堆叠柱状图+提交率+正确率分布+分段饼图+预警),按科目分类 (~330 tok)

## src/views/admin/homework/composables/

- `useHomeworkShared.js` — 共享常量/工具函数（核心科目/选修/状态/颜色映射） (~100 tok)
- `useHomeworkTable.js` — 表格配置（密度/列可见性/卡片模式）+ localStorage持久化 (~120 tok)

## src/composables/

- `useAttachment.js` — Exports useAttachment, FileReader→base64 conversion + file validation + size formatting (~180 tok)
- `useExcel.js` — Exports useExcel, SheetJS xlsx import/export/template download composable (~180 tok)
- `useKatex.js` — Exports useKatex, markdown-it-katex引擎(renderMarkdown/renderInline/renderBlock/validateLatex/extractFormulas) (~350 tok)
- `useScopedData.js` — Data scope filter composable — filters lists by campus/class/self based on user role (~40 tok)
- `useExamSeatPreview.js` — 考场座位预览逻辑（A4横版HTML生成+Canvas水印+html2canvas导出PNG/JPG+打印+配置持久化） (~250 tok)
- `useDraggablePlus.js` — vue-draggable-plus薄封装, 统一group/sort/animation配置, 供StudentPool和SeatGrid使用 (~45 tok)
- `useTableDensity.js` — 表格密度控制(compact/comfortable/loose), 全局singleton+localStorage持久化 (~50 tok)

## src/data/

- `chineseData.js` — Exports essayPrompts, wenyanData (~8122 tok)
- `examProblems.js` — DSE 练习题库数据 — 来源: dse-data.js (~4731 tok)
- `knowledgeData.js` — DSE 知识总结数据 — 来源: dse-data.js (~2080 tok)
- `mistakeData.js` — DSE 经典错题数据 — 来源: dse-data.js (~1745 tok)
- `moduleMeta.js` — 模块元数据 — 用于 Dashboard 卡片和导航 (~541 tok)

## src/layouts/

- `AdminLayout.vue` — Vue: setup, 动态侧边栏(基于角色菜单权限)+顶栏(用户信息/退出/主题/水印) (~3200 tok)
- `DefaultLayout.vue` — Vue: setup (~485 tok)
- `PortalLayout.vue` — Vue: setup, 门户布局+学生切换+退出登录 (~1300 tok)

## src/router/

- `index.js` — Declares routes, admin+portal auth guards with RBAC permission/menu checks (~2300 tok)

## src/services/

- `dataService.js` — DSE 学情问诊系统 — 中央数据服务（localStorage 模拟后端）, RBAC权限/菜单/角色/用户服务 (~13000 tok)

## src/stores/

- `app.js` — Exports useAppStore, RBAC auth state+permission checks+login/logout (~900 tok)
- `index.js` (~19 tok)

## src/styles/

- `admin.css` — Styles: dual-theme (dark Prism Command + light cool indigo), admin page styles (~8400 tok)
- `main.css` — Styles: dual-theme (dark/light via data-theme), indigo/violet brand palette, portal+public styles (~7500 tok)

## src/utils/

- `colorHash.js` — 确定性班级颜色哈希(16色调色板)+SEAT_STATUS_COLORS常量 (~30 tok)
- `printTemplate.js` — Print/PDF HTML document builder — "Scholarly Refinement" aesthetic for parent conference export (~1200 tok)
- `renderContent.js` — Rich content renderer — markdown-it + KaTeX渲染, 支持完整Markdown语法+LaTeX (~100 tok)
- `watermark.js` — Watermark utility — tiled scattered pattern for print/export (~805 tok)

## src/views/

- `ExamSeatPublic.vue` — 考场座位公开视图(原生table+反转行+门口标记+讲台+统一导出管线, 数据源examSeat2Store) (~350 tok)
- `HomePage.vue` — Vue: setup (~520 tok)
- `Knowledge.vue` — Vue: setup (~312 tok)
- `Mistakes.vue` — Vue: setup, 错题整理(硬编码色→CSS变量+dark mode适配) (~550 tok)
- `Practice.vue` — Vue: setup, 练习系统(el-select→native select) (~750 tok)

## src/views/admin/

- `Attendance.vue` — Vue: setup (~5636 tok)
- `Behavior.vue` — Vue: 陈小明, setup (~2537 tok)
- `Conference.vue` — Vue: setup, 家长会文稿+3级模板(基础巩固/稳步提升/拔尖突破)+Markdown编辑+拖拽排序+装饰纹路导出 (~20000 tok)
- `ConfigCenter.vue` — Vue: setup (~2491 tok)
- `Counseling.vue` — Vue: setup, 心理辅导+录音+情绪卡片+查看对话框+两栏布局, 完全重构 (~9000 tok)
- `CourseFeedback.vue` — Vue: setup (~4684 tok)
- `CourseManagement.vue` — Vue: setup (~2481 tok)
- `Dashboard.vue` — Vue: setup (~4933 tok)
- `Discipline.vue` — Vue: setup (~3756 tok)
- `Exam.vue` — Vue component (~8483 tok)
- `Homework.vue` — Vue: setup, 作业追踪表格(核心/选修筛选/合并单元格)+提交统计+未交提醒,已移除日/周/月视图及布置/导出/打印功能 (~7000 tok)
- `HomeworkAssign.vue` — Vue: setup, 布置作业系统(自动分发:必修→全班/选修→选课学生)+科目分组+合并单元格+分发预览 (~4200 tok)
- `Login.vue` — Vue: setup, 管理后台登录页, AI科技感品牌重设计(TechParticles+AnimatedBorder+FloatingInput+GlowButton) (~5000 tok)
- `ParentConference.vue` — Vue: setup (~5011 tok)
- `Phone.vue` — Vue: setup, 手机管理重构版（日期切换+手机柜可视化网格+今日统计卡片+一键复制昨日配置+批量操作+快速状态切换） (~700 tok)

## src/views/admin/teaching/phone/

- `usePhoneData.js` — 手机管理数据层composable(学生/登记/记录加载/状态切换/扣留字段/统计/批量操作) (~300 tok)

## src/views/admin/teaching/phone/components/

- `PhoneCabinet.vue` — 手机柜网格组件(班级Tab+8列网格+5色状态+图例) (~120 tok)
- `PhoneStudentDetail.vue` — 学生详情面板(登记信息+快速状态切换+扣留追溯表单+家长通知+存取记录时间轴) (~280 tok)
- `QuestionBank.vue` — Vue component (~7664 tok)
- `Questions.vue` — Vue component (~10434 tok)
- `Reports.vue` — Vue: setup, 成长周报(Markdown编辑/分屏预览/html2canvas导出) (~7200 tok)
- `RoleManagement.vue` — Vue: setup, 角色管理+三栏RBAC重构(el-tree权限树+数据范围配置+角色CRUD+搜索筛选+复制) (~2000 tok)
- `Settings.vue` — Vue component (~7173 tok)
- `StudentManagement.vue` — Vue: setup (~4417 tok)
- `Timetable.vue` — Vue: setup, 周/月课表+图片导入+时间设置+背景填充+模板, ~1200行 (~13500 tok)
- `UserManagement.vue` — Vue: setup, 用户管理CRUD+角色分配+状态切换, table+对话框 (~300 tok)
- `Voice.vue` — Vue: setup (~5568 tok)
- `AISkills.vue` — Vue: setup, AI数据收录中心-Skills技能收录(CRUD+Excel导入导出+附件上传+操作日志) (~5200 tok)
- `AIFunctions.vue` — Vue: setup, AI数据收录中心-Excel公式收录(函数名/公式/参数/案例/难度) (~4800 tok)
- `AITools.vue` — Vue: setup, AI数据收录中心-软件工具收录(下载链接/官网/图标/教程) (~4800 tok)
- `AIQuotes.vue` — Vue: setup, AI数据收录中心-名言语录收录(轮播预览/展示样式/权重) (~4600 tok)
- `AIPrompts.vue` — Vue: setup, AI数据收录中心-Prompt话术收录(输入输出示例对比/一键复制/优化版本) (~4600 tok)

## src/views/math/

- `CircleLine.vue` — Vue: setup, 圆与直线交互画布(P5Canvas)+参数调节+位置关系计算 (~1400 tok)
- `Composite.vue` — Vue: setup (~2750 tok)
- `Geometry3D.vue` — Vue: setup (~7788 tok)
- `Inequality.vue` — Vue: setup, 不等式DSE知识(一元一次/二次不等式/图解法/复合/绝对值/分式不等式/线性规划) (~1600 tok)
- `Locus.vue` — Vue: setup, 轨迹方程交互画布(P5Canvas)+椭圆/双曲线/抛物线+预设 (~1600 tok)
- `LogExp.vue` — Vue: setup (~2722 tok)

- `Numbers.vue` — Vue: setup, 数与式DSE知识(代数/根式/指数律/数系/科学记数法/百分数/利息/比与比例/绝对值) (~1600 tok)
- `Polynomial.vue` — Vue: setup, 多项式DSE知识(运算/因式定理/余数定理/综合除法/HCF-LCM/有理分式/恒等式) (~1600 tok)
- `Probability.vue` — Vue: setup, 概率DSE知识(基本概率/排列组合/计数方法/条件概率/至少一个/期望值/树状图) (~1500 tok)
- `Quadratic.vue` — Vue: setup (~2491 tok)
- `Sequence.vue` — Vue: setup, 数列DSE知识(等差/等比数列/Σ记号/求通项/裂项相消/错位相减/实际应用) (~1600 tok)
- `Statistics.vue` — Vue: setup, 统计DSE知识(集中趋势/离散程度/百分位数/箱线图/数据变换/相关性/回归/正态分布/标准分) (~1700 tok)
- `TriangleCenter.vue` — Vue: setup, 三角形四心交互画布(P5Canvas)+拖拽顶点+外接圆/内切圆+欧拉线 (~1200 tok)
- `Trigonometry.vue` — Vue: setup (~3234 tok)

## src/views/portal/

- `MyExams.vue` — Vue: setup (~2618 tok)
- `MyHomework.vue` — Vue: setup (~1676 tok)
- `MyMistakes.vue` — Vue: setup, 错题本门户页（分组折叠视图+flat列表+打印选题+checkbox+答案对比+KATEX公式渲染） (~4100 tok)
- `MyExamSeat.vue` — Vue: setup, 门户端考场座位预览（教室Tab切换+可配置信息+水印+导出PNG/JPG+打印） (~150 tok)
- `MyTips.vue` — Vue: setup, 做题技巧门户页 (~500 tok)
- `MyPerformance.vue` — Vue: setup (~1772 tok)
- `PortalHome.vue` — Vue: setup (~2590 tok)
- `PortalLogin.vue` — Vue: setup, 门户登录页, 温暖品牌风+AI宠物英雄+学生/家长Tab+手机验证码登录+学习报告预览 (~2400 tok)

## src/views/subjects/

- `Chemistry.vue` — Vue component (~80 tok)
- `Chinese.vue` — Vue: setup, brown/amber Chinese-culture theme (hardcoded colors, frozen from global vars) (~9452 tok)
- `Physics.vue` — Vue component (~77 tok)

## src/views/exam/

- `ExamSeatViewer.vue` — Vue: setup, A4考试座位查看器, vue3-print-nb打印, 黑白教务风格, 每教室一个A4卡片预览 (~200 tok)

## src/components/exam/viewer/

- `ExamViewerHeader.vue` — Vue: setup, 座位表标题头（考试名/教室/人数/序号） (~30 tok)
- `ExamViewerInfo.vue` — Vue: setup, 考试信息行（科目/日期/时间/监考/类型） (~50 tok)
- `ExamViewerSeatTable.vue` — Vue: setup, 原生table座位网格, 支持屏蔽/缺考/特殊状态 (~150 tok)
- `ExamViewerRules.vue` — Vue: setup, 考场规则文本条 (~30 tok)
- `ExamViewerFooter.vue` — Vue: setup, 页脚日期+总座数 (~30 tok)
