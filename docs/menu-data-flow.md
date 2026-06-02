# 动态菜单数据流

> 本文档说明前端菜单从登录成功到渲染的完整数据流，所有数据唯一来源：后端 `/system/menu/tree`

---

## 一、登录阶段

```
Login.vue → store.login(username, password)
```

**调用链（src/stores/app.js → login()）：**

### 步骤 1：POST /login → 获取 Token

```
POST /login  { username, password, rememberMe }
    │
    ▼ 响应
{
  code: 200,
  data: {
    accessToken: "eyJ...",
    refreshToken: "...",
    userId: 1,
    username: "admin",
    nickName: "管理员",
    avatar: null
  }
}
```

→ `accessToken` 立即存入 `localStorage('admin_token')`，后续所有请求的 axios 拦截器自动注入 `Authorization: Bearer <token>`

### 步骤 2：GET /user/info → 用户详细信息

```
GET /user/info
Authorization: Bearer <accessToken>
    │
    ▼ 响应
{
  code: 200,
  data: {
    userId, username, nickName, email, phoneNumber, sex, avatar, ...
  }
}
```

→ 合并到 `store.currentUser`，存入 `localStorage('dse_admin_user')`

### 步骤 3：GET /system/menu/tree → 权限菜单树（核心）

```
GET /system/menu/tree
Authorization: Bearer <accessToken>   ← 与步骤1同一token，后端校验
    │
    ▼ 响应（该用户有权看到的所有菜单）
{
  code: 200,
  data: [
    {
      menuId: 1,
      menuName: "常用功能",     ← M 类型 = 菜单分组
      menuType: "M",
      path: "",
      icon: "common",
      visible: "0",            ← "0" = 可见
      orderNum: 1,
      children: [
        {
          menuId: 9,
          menuName: "数据看板",  ← C 类型 = 页面菜单项
          menuType: "C",
          path: "/admin",       ← 前端路由路径
          component: "admin/dashboard/Dashboard",
          perms: "dashboard:view",  ← 权限标识
          icon: "dashboard",
          children: []
        },
        ...
      ]
    },
    ...共 8 个分组，29 个叶子菜单
  ]
}
```

→ `menuStore.serverMenuTree.value = res.data`
→ **触发 watch** → `extractAuthData(tree)` 仅提取鉴权数据，不做结构转换

---

## 二、数据使用（不转换，不构建）

**位置：** `src/stores/menu.js`

**原则：后端树直接渲染，不做前端二次转换**

```
serverMenuTree (后端原始树，原样存储)
    │
    │  watch 触发
    ▼
extractAuthData(tree)              ← 仅遍历一次，提取鉴权数据
    │
    ├─ flatPathMap: {}             ← path → node，用于 hasMenuAccess() / 面包屑
    └─ permissionSet: Set()        ← 扁平权限，用于 hasPermission()
    
AdminLayout 模板直接迭代 serverMenuTree:
    M 节点 (menuType="M")  → <el-sub-menu>
    C 节点 (menuType="C")  → <el-menu-item :index="path">
    
    ← 无需 dynamicMenuGroups 等中间格式 ←

---

## 三、AdminLayout 渲染

**位置：** `src/layouts/AdminLayout.vue`

```
<el-menu :default-active="route.path" :collapse="store.sidebarCollapsed" :router="true">
    │
    │  for group in menuStore.dynamicMenuGroups   ← 直接遍历步骤二的输出
    │
    ├─ <el-sub-menu :index="group.group">         ← M 节点 → 可折叠分组
    │     <template #title>
    │       <span class="menu-char-icon">{{ group.group.charAt(0) }}</span>  ← 折叠时显示
    │       <span>{{ group.group }}</span>
    │     </template>
    │
    │     for item in group.items
    │       ├─ <el-sub-menu v-if="item.children.length">   ← 嵌套子菜单
    │       └─ <el-menu-item v-else :index="item.route">   ← C 节点 → 路由链接
    │            <span class="menu-char-icon">{{ item.label.charAt(0) }}</span>
    │            <span class="menu-full-label">{{ item.label }}</span>
    │          </el-menu-item>
    │
    └─ </el-sub-menu>
</el-menu>
```

**关键特性：**
- `:router="true"` → el-menu-item 的 `:index` 直接作为 vue-router 跳转路径
- `:default-active="route.path"` → 自动高亮当前路由对应的菜单项
- `:collapse="store.sidebarCollapsed"` → el-menu 原生折叠，flyout 子菜单
- 折叠态图标 = 菜单名首字符（如 "数"、"课"、"学"），无硬编码

---

## 四、路由守卫鉴权

**位置：** `src/router/index.js → router.beforeEach`

```
用户访问 /admin/timetable
    │
    ├─ 1. 检查 admin_token → 无 → 跳转登录
    │
    ├─ 2. 检查 store.currentUser → 无 → 清除 token，跳转登录
    │
    ├─ 3. menuStore.hasMenuAccess("/admin/timetable")
    │     → 查 flatPathMap["/admin/timetable"]
    │     → 存在 → 放行 ✓
    │     → 不存在 → 跳转 Dashboard（无权限）
    │
    └─ 4. menuStore.hasPermission("timetable:view")  ← 细粒度鉴权
          → 查 permissionSet
          → 有 → 放行 ✓
```

---

## 五、页面刷新恢复

**位置：** `src/stores/app.js → initAuth()`，由 `main.js` 启动时调用

```
页面刷新
    │
    ├─ 1. 读 localStorage('admin_token')
    │     → 无 → 返回 false（不登录）
    │
    ├─ 2. GET /user/info  ← 验证 token 有效性
    │     → 401 → 清除 token，返回 false
    │     → 200 → 恢复 currentUser
    │
    └─ 3. GET /system/menu/tree  ← 重新拉菜单
          → 赋值 serverMenuTree
          → 触发 buildMenuData()
          → 菜单恢复 ✓
```

---

## 六、数据流图（简化）

```
┌──────────┐   POST /login    ┌──────────────┐
│ Login.vue │ ───────────────→ │ Spring Boot  │
│  (前端)   │ ←─────────────── │   (后端)      │
└────┬─────┘   accessToken    └──────┬───────┘
     │                               │
     │  GET /system/menu/tree        │
     │  Authorization: Bearer <token>│  ← 同一 token，后端校验
     │ ─────────────────────────────→│
     │ ←─────────────────────────────│
     │  菜单树 JSON (仅该用户有权)     │
     │                               │
     ▼                               │
┌─────────────┐                      │
│  menuStore  │                      │
│ serverMenu  │                      │
│    Tree     │                      │
└──────┬──────┘                      │
       │ watch                       │
       ▼                             │
 buildMenuData()                     │
  ├─ dynamicMenuGroups ──→ AdminLayout el-menu 渲染
  ├─ flatPathMap ────────→ hasMenuAccess() 路由鉴权
  └─ permissionSet ──────→ hasPermission() 细粒度鉴权
```

---

## 七、架构原则

| 原则 | 说明 |
|------|------|
| **单一数据源** | 菜单结构唯一来源 = 后端 `/system/menu/tree`，前端不做降级、不硬编码 |
| **Token 一致性** | 登录获取的 token 立即存入，后续 `/user/info` 和 `/system/menu/tree` 使用同一 token |
| **服务端鉴权** | 后端返回的菜单树 = 该用户有权看到的全部菜单，前端只负责渲染和路由拦截 |
| **无硬编码** | 不保留 `MENU_DEFINITIONS`、`pageToPath` 等前端静态菜单映射 |
| **一次遍历** | `buildMenuData()` 遍历后端树一次，产出 groups / pathMap / perms 三份数据 |
