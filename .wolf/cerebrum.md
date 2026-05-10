# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-05-09

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

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

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
