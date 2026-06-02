# DSE AI 学情问诊系统

威学一百国际教育 — DSE 学习管理与智能诊断平台。

## 技术栈

Vue 3 + Element Plus + Vite + Pinia + Vue Router  
后端：Spring Boot (dse-springboot)

## 快速启动

```bash
npm install
npm run dev        # → http://localhost:3000
npm run build
```

后端先启动（8080端口），Vite proxy 自动转发 `/api` 到后端。

---

## 已对接后端 API 的模块

| 模块 | 路由 | API |
|------|------|-----|
| 登录 | `/login` | `POST /login` `GET /user/info` |
| 动态菜单 | 侧边栏 | `GET /system/menu/tree` |
| 菜单管理 | `/admin/menus` | `GET/POST/PUT/DELETE /system/menu/*` |
| 角色管理 | `/admin/roles` | `GET/POST/PUT/DELETE /system/role/*` `PUT /system/role/{id}/menus` |
| 学生管理 | `/admin/students` | `GET/POST/PUT/DELETE /dse/students/*` |
| 早晚班交接 | `/admin/handover` + `/handover` | `GET/POST/PUT/DELETE /dse/handover/*` |

## 待迁移模块（仍用 dataService localStorage 假数据）

用户管理、作业管理、课堂表现、纪律、手机、考勤、成长日报、心理辅导、试卷、题库、技巧、座位、家长会、反馈、语音、课表、系统设置、配置中心、AI数据收录、课程管理、门户数据

迁移方法：`import { dseApi } from '@/api/dse'` → `dseApi('entity').getAll()` 替换 `xxxService.getAll()`

## 数据流

```
登录 → Token → GET /user/info → GET /system/menu/tree
     → menuStore.serverMenuTree → 侧边栏渲染
     → flatPathMap + permissionSet → 路由鉴权
刷新 → initAuth() → 同流程
```

详见 [docs/menu-data-flow.md](docs/menu-data-flow.md)

## Bug 清单

见 [docs/BUGLOG.md](docs/BUGLOG.md)
