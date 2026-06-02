# Bug 跟踪文档

> 2026-06-02 系统全面审查

## 已修复

| ID | 描述 | 修复 |
|----|------|------|
| B001 | CORS 跨域错误 | Vite proxy `/api` → `localhost:8080` |
| B002 | 登录后菜单为空 | menuStore 同步调用 extractAuthData |
| B003 | el-menu 折叠图标消失 | `<span>` → `<i>` 标签，Element Plus 不隐藏 `<i>` |
| B004 | 学生管理行点击触发编辑 | 移除 `@row-click`，仅姓名列可点击 |
| B005 | 学生管理固定列透明 | 添加 `el-table__fixed` 背景色 |
| B006 | 心理辅导弹窗压住侧边栏 | `append-to-body` |
| B007 | 作业管理布置按钮不显示 | `homework.assign` → `homework:view` |
| B008 | 角色管理权限树为空 | 改用 `getAllMenuTreeHandler` 后端数据 |
| B009 | 菜单管理页面不存在 | 创建 MenuManagement.vue + 添加路由 `/admin/menus` |
| B010 | dev 分支合并失败 | 分支结构不同（services 路径变更），回退到 dev-parent-meeting-73f6661 |
| B011 | 角色管理 `hasPermission` 权限 key 不匹配 | `student.edit` → `student:view` |
| B012 | 补交开关无法控制 | `:model-value` → `v-model` |
| B013 | 早晚班交接刷新后数据丢失 | handoverService → dseApi('handover') 后端 API |
| B014 | 前台预览数值可编辑 | 恢复为只读展示 span |
| B015 | 课程管理下方冗余卡片 | 移除核心/选修汇总卡片 |

## 待修复

| ID | 描述 | 优先级 | 位置 |
|----|------|--------|------|
| B016 | 用户管理弹窗数据仍用 dataService 假数据 | 高 | UserManagement.vue |
| B017 | 作业管理数据仍用 dataService 假数据 | 高 | Homework.vue |
| B018 | 课程管理数据仍用 dataService 假数据 | 中 | CourseManagement.vue |
| B019 | 行为/考勤/纪律/手机等教学模块仍用 dataService | 中 | teaching/*.vue |
| B020 | 成长日报/考试/题库等仍用 dataService | 低 | students/Reports.vue, exams/*.vue |
| B021 | AI 数据收录模块仍用 dataService | 低 | ai-data/*.vue |
| B022 | 系统设置/配置中心仍用 dataService | 低 | settings/*.vue |
| B023 | 课表模块仍用 dataService | 低 | timetable/Timetable.vue |
| B024 | DSE 数学专题页面使用静态数据 | 低 | math/*.vue（设计如此） |
| B025 | 学生管理批量导出使用前端过滤非后端分页 | 低 | StudentManagement.vue |
| B026 | 角色管理 `$refs` 语法在 Vue3 中不兼容 | 已修复为 `treeRef.value` |
| B027 | dev 分支 services 路径变更导致合并冲突 | 需手动解决 | 全局 |
