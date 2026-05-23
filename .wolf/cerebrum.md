# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-09

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

- **Public seat view export uses SVG→Canvas→PNG (no html2canvas):** Build SVG string with seat cells, create blob URL, load as Image, draw to canvas, toBlob download. System fonts work for Chinese text rendering. Avoid html2canvas on public-facing pages.
- **Seat panel UX: collapsible sidebars + dialog for auxiliary info:** Student pool supports collapse toggle; arrangement rules shown in el-dialog rather than consuming vertical space. Auxiliary/secondary info should not compete with primary grid view for real estate.
- **3D desk CSS effect for seat grids:** Use `box-shadow: 2px 3px 0 0 <darker-color>, 2px 3px 4px rgba(0,0,0,0.06)` with `border-collapse: separate; border-spacing: 4px` to create depth and physical desk feel. Subtle gradient backgrounds add dimension.
- **Exam-seat drag between pool and grid uses SortableJS group:** StudentPool uses `pull: 'clone'` and SeatGrid rows use `pull: true, put: true` with shared group name 'seats'. Cross-component drag requires both sides to share the same group name and SortableJS instance.

## Key Learnings

- **SVG→Canvas→PNG高清导出替代html2canvas:** 构建SVG(scale:2) → Blob URL → Image加载 → Canvas绘制 → toBlob下载。100×72×2像素/格，6列教室约1200px宽足够高清。中文依赖系统字体('PingFang SC','Microsoft YaHei')在SVG中渲染正常。
- **Excel网格布局导出:** 使用xlsx的`aoa_to_sheet`按考场实际行列排布数据，每个教室一个Sheet，第一行列标(A/B/C...)，第一列为行号，单元格内放姓名+班级+选修换行文本。通过`!merges`合并标题行。
- **考生画像Dashboard设计:** 概览卡片(总人数/已入座/待安排/班级数) + 班级分布水平条形图(带颜色) + 选修标签云(字号按比例缩放) + 教室使用率进度条 + 状态标签(正常/特殊/缺考/锁定)。数据直接从store.students和store.assignments计算，不依赖paperStatistics。
- **Public seat view uses shared export pipeline:** ExamSeatPublic now imports downloadRoomImageSVG/printRoomSVG from exportPipeline.js to share SVG building logic with admin side. DRY.

- **Native HTML5 drag for table grids, vue-draggable-plus for lists:** vue-draggable-plus wrapper elements are incompatible with `<table>` structure. For seat grids, use native HTML5 drag/drop on `<td>`. For student pools, use DraggableContainer. Pool-to-grid cross-component drag via SortableJS `onEnd` + `document.elementFromPoint()` to detect grid cell drop target.
- **Store migration chain:** When replacing a Pinia store (examSeatStore → examSeat2Store), update ALL consumers — main module, shared components (ImportPreviewDialog), portal views (MyExamSeat), and composables (useExamSeatPreview). The router alone covers only the entry point; 5+ files import the store directly.
- **Exam-seat light mode:** Dark theme uses `--es-*` CSS variables scoped to `.exam-seat-page`. Light mode overrides via `[data-theme="light"] .exam-seat-page` remapping all tokens to lighter equivalents. Background pseudo-elements also need light-mode overrides to avoid dark vignettes on light backgrounds.
- **Dual-login guard pattern:** Two separate login pages (/login for admin, /portal/login for portal) each with their own token (admin_token, portal_token) and independent auth guards in router.beforeEach. Admin routes use `meta.requiresAuth`, portal routes use `meta.requiresPortalAuth`. Each login page redirects to its home if already authenticated.
- **Project:** dse-learning-system
- **Dynamic grid columns in scoped styles:** Use CSS `v-bind('refName.length')` in `<style scoped>` for dynamic `grid-template-columns` instead of inline `:style`. Works with Vue 3.4+ and keeps styling in CSS.
- **Timetable data flow:** weeklyScheduleService stores the template (weekday + period), timetableService stores calendar instances (specific dates). `generateMonth()` expands the template into calendar entries.
- **html2canvas export:** Use scale:3 for HD PNG export. Wrap content in a dedicated container with padding and decorative elements. Ensure container has explicit background color for consistency.
- **Element Plus table span-method:** Return `{rowspan:0, colspan:0}` to hide cells that are merged, `{rowspan:N, colspan:1}` to span N rows. Check `rowIndex > 0 && same value as previous` to determine merging.
- **Vue CSS v-bind with refs:** `v-bind('refName.length')` in `<style scoped>` auto-unwraps refs in Vue 3.4+, enabling dynamic grid columns without inline styles.
- **Core vs Elective subjects (DSE):** Core: 中国语文、英国语文、数学、公民与社会发展. Elective: all others from courseService.
- **Parent Conference templates:** 3-tier system with euphemistic labels — 基础巩固型 (foundation), 稳步提升型 (steady), 拔尖突破型 (excellence). Never use 差等生/中等生/优等生 which could harm student confidence. Each template has different tone, praise angle, and strategy emphasis.
- **HTML5 drag reorder in Vue:** Use `draggable="true"` with `@dragstart`, `@dragover`, `@drop`, `@dragend` handlers. Track `dragSourceIdx` ref for source index. On drop, splice and reinsert the item in the array. No external library needed.
- **Decorative CSS borders without images:** Use `repeating-linear-gradient()` for dotted/dashed line effects, Unicode ornaments (❦, ❧, ◆, ●) as pseudo-element content, and `linear-gradient(90deg, transparent, color, transparent)` for fade-in/fade-out divider lines.

- **Conference.vue data flow:** All school/teacher/footer config flows from `settingsService.get()` → local refs → template and `exportPDF()`. Never hardcode school names — always read from config center via `settingsService`.
- **el-watermark integration:** Wrap export container with `<el-watermark>` conditional on `watermarkEnabled` ref. Text from config center. Works for both screen preview and html2canvas PNG export.
- **Custom PDF export pattern:** `window.open()` + `w.document.write()` + `window.print()`. Use template literals with config refs interpolated in. The ExportPDF component from `@vavt/v3-extension` is FUNDAMENTALLY INCOMPATIBLE with md-editor-v3 v6.5.0 — it crashes trying to access undefined ModalToolbar ref.
- **marked.js for markdown rendering:** `renderRichContent()` only handles bold/italic/code/LaTeX — it does NOT render headings, tables, blockquotes, ordered lists, links. Use `marked.parse()` for full markdown-to-HTML conversion in exports and previews.

## Do-Not-Repeat

- [2026-05-10] **Auth migration: Always provide localStorage key fallback when changing storage format.** When migrating from old `admin_user` key to new `dse_admin_user`, the `loadUserFromStorage()` must check old keys and auto-migrate. Otherwise old sessions have a valid `admin_token` but no user data, causing router guard → login redirect → login auto-redirect → infinite loop → browser crash. Always pair token checks with `store.isAuthenticated` verification in redirect logic.
- [2026-05-10] **Never remove/alter UI elements without explicit user permission:** When the user asks for a specific change (e.g. "make login validation strict"), only make that change. Do NOT remove unrelated tabs, buttons, or layout elements. The user's reaction ("只让你做登陆限定 谁让你移除了，布局都变丑了") shows they value existing UI choices. Scope changes precisely to what was requested.
- [2026-05-09] **Vue SFC `</script>` in template literals:** When writing template literals inside `<script setup>`, the string `</script>` (even inside backticks) will be parsed as the end of the script block by the Vue SFC compiler. Always escape as `<\/script>`. This caused a build failure after applying the print beautification patch.
- [2026-05-09] **`@vavt/v3-extension` ExportPDF with md-editor-v3 v6:** The ExportPDF component crashes with `TypeError: Cannot read properties of undefined (reading 'value')` because ModalToolbar ref is undefined. Do not use it. Use custom `window.open()` + `window.print()` pattern instead.
- [2026-05-09] **md-editor-v3 invalid toolbar keys:** 'mermaid' and 'previewOnly' are NOT valid toolbar keys for md-editor-v3 v6.5.0. Using them causes errors. Check the official docs for the supported toolbar list.
- [2026-05-23] **Vue event handler referenced in onMounted must be defined:** Referencing an undefined function in `onMounted(() => window.addEventListener('keydown', onKeydown))` silently crashes the component setup — all button clicks, events, and reactive bindings stop working with no console error in production build. Always verify every function referenced in lifecycle hooks is actually defined.
- [2026-05-23] **Admin dark theme seat cells must use dark backgrounds:** White/high-luminance backgrounds (#fff, #ffcccc, #ffffcc, #ccffcc, #f0e6ff) on dark admin theme (#06090F) cause blinding contrast and illegible text. Use dark-tinted colors (#162040, #0d1525, #3d1f1f, #2d2a10, #1a2d20, #201e35) with `var(--admin-border)` borders instead. Override seat color tokens inside the admin theme block in tokens.css.

- [2026-05-23] **Distribution route visualization uses SVG viewBox overlay + numbered badges:** Two modes (S-shaped snaking / row-by-row) with `distOrder` computed lookup. SVG polyline path animated via `stroke-dasharray/dashoffset` CSS keyframes. Numbered circle badges (`esp-dist-badge`) absolutely positioned on seat cells with staggered `animationDelay`. First/last steps highlighted green/red. Blocked seats skipped. Admin can toggle 姓名/班级/选修 visibility on public view via store flags (`publicShowNames/Class/Electives`) persisted to localStorage.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
