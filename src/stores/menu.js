/**
 * 菜单 Store — 后端树直接渲染，不做前端转换
 *
 *  serverMenuTree        ← 后端 /system/menu/tree 原始数据，AdminLayout 直接消费
 *  flatPathMap / perms   ← watch 自动提取，仅用于鉴权
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getUserMenuTreeHandler } from '@/api/menu'

export const useMenuStore = defineStore('menu', () => {
  const serverMenuTree = ref(null)       // 后端原始树 → 直接渲染
  const flatPathMap = ref({})            // path → node
  const permissionSet = ref(new Set())

  /** 遍历一次，仅提取 pathMap + perms，不转换结构 */
  function extractAuthData(tree) {
    const pathMap = {}
    const perms = new Set()
    if (!tree || tree.length === 0) {
      flatPathMap.value = pathMap
      permissionSet.value = perms
      return
    }
    function walk(nodes) {
      for (const node of nodes) {
        if (node.path) {
          pathMap[node.path] = node
          if (node.perms) { perms.add(node.perms); perms.add(node.perms.replace(/:/g, '.')) }
        }
        if (node.children?.length) walk(node.children)
      }
    }
    walk(tree)
    flatPathMap.value = pathMap
    permissionSet.value = perms
    console.log('[MenuStore] 鉴权数据提取:', { paths: Object.keys(pathMap).length, perms: perms.size })
  }

  // watch 作为安全兜底；正常路径在 fetchMenuTree / clear 中同步调用 extractAuthData
  watch(serverMenuTree, (tree) => extractAuthData(tree))

  // ==================== 权限 ====================
  function hasPermission(perm) {
    const p = permissionSet.value
    if (p.size === 0) return false
    if (p.has('*') || p.has(perm)) return true
    const parts = perm.split('.')
    return parts.length >= 2 && p.has(parts[0] + '.*')
  }

  function hasMenuAccess(path) { return !!flatPathMap.value[path] }

  /** 在原始树中按 path 查找节点 */
  function findNodeByPath(path) {
    function search(nodes) {
      for (const node of nodes) {
        if (node.path === path) return node
        if (node.children?.length) { const f = search(node.children); if (f) return f }
      }
      return null
    }
    return serverMenuTree.value ? search(serverMenuTree.value) : null
  }

  // ==================== 收藏 & 最近 ====================
  const favoritePaths = ref(loadFavorites())
  const recentPaths = ref(loadRecent())

  function loadFavorites() {
    try { return JSON.parse(localStorage.getItem('dse_favorite_paths')) || [] } catch { return [] }
  }
  function loadRecent() {
    try { return JSON.parse(localStorage.getItem('dse_recent_paths')) || [] } catch { return [] }
  }

  function toggleFavorite(path) {
    const idx = favoritePaths.value.indexOf(path)
    idx >= 0 ? favoritePaths.value.splice(idx, 1) : favoritePaths.value.push(path)
    localStorage.setItem('dse_favorite_paths', JSON.stringify(favoritePaths.value))
  }

  function isFavorite(path) { return favoritePaths.value.includes(path) }

  function addRecentAccess(path) {
    if (!path || path === '/admin') return
    recentPaths.value = recentPaths.value.filter(r => r.path !== path)
    recentPaths.value.unshift({ path, accessedAt: Date.now() })
    if (recentPaths.value.length > 5) recentPaths.value = recentPaths.value.slice(0, 5)
    localStorage.setItem('dse_recent_paths', JSON.stringify(recentPaths.value))
  }

  function getFavoriteMenuItems() {
    return favoritePaths.value.map(p => {
      const n = findNodeByPath(p)
      return n ? { menuKey: String(n.menuId), label: n.menuName, icon: n.icon, route: n.path } : null
    }).filter(Boolean)
  }

  function getRecentMenuItems() {
    return recentPaths.value.map(r => {
      const n = findNodeByPath(r.path)
      return n ? { menuKey: String(n.menuId), label: n.menuName, icon: n.icon, route: n.path } : null
    }).filter(Boolean)
  }

  function trackPageAccess(path) {
    if (path && path !== '/admin') addRecentAccess(path)
  }

  // ==================== API ====================
  async function fetchMenuTree() {
    console.log('[API] GET /system/menu/tree')
    const res = await getUserMenuTreeHandler()
    console.log('[API] /system/menu/tree 响应:', res)
    if (res.data) {
      serverMenuTree.value = res.data
      extractAuthData(res.data)  // 同步执行，避免路由守卫竞态
    }
    return res.data
  }

  function clear() { serverMenuTree.value = null }

  return {
    serverMenuTree, flatPathMap,
    hasPermission, hasMenuAccess,
    favoritePaths, recentPaths,
    toggleFavorite, isFavorite, addRecentAccess, trackPageAccess,
    getFavoriteMenuItems, getRecentMenuItems,
    fetchMenuTree, clear
  }
})
