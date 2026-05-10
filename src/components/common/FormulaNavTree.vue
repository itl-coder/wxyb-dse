<template>
  <div class="fnt">
    <div class="fnt-search">
      <input
        v-model="searchQuery"
        placeholder="搜索公式..."
        class="fnt-search-input"
        @input="filterItems"
      />
    </div>
    <div class="fnt-tree">
      <template v-for="group in filteredItems" :key="group.id">
        <div class="fnt-group">
          <button class="fnt-group-header" @click="toggleGroup(group.id)">
            <span class="fnt-arrow" :class="{ open: expandedGroups.has(group.id) }">▶</span>
            <span class="fnt-group-icon">{{ group.icon }}</span>
            <span class="fnt-group-label">{{ group.label }}</span>
            <span class="fnt-group-count">{{ group.children.length }}</span>
          </button>
          <div v-if="expandedGroups.has(group.id)" class="fnt-children">
            <button
              v-for="item in group.children"
              :key="item.id"
              class="fnt-item"
              :class="{ active: activeId === item.id }"
              @click="$emit('select', item)"
            >
              <span class="fnt-item-dot"></span>
              <span class="fnt-item-label">{{ item.label }}</span>
              <span v-if="item.tags" class="fnt-item-tags">
                <span v-for="t in item.tags" :key="t" class="fnt-tag">{{ t }}</span>
              </span>
            </button>
          </div>
        </div>
      </template>
      <div v-if="filteredItems.length === 0" class="fnt-empty">未找到匹配公式</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  activeId: { type: String, default: '' }
})

defineEmits(['select'])

const searchQuery = ref('')
const expandedGroups = ref(new Set(props.items.map(g => g.id)))
const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return props.items
  const q = searchQuery.value.toLowerCase()
  return props.items.map(g => ({
    ...g,
    children: g.children.filter(c => c.label.toLowerCase().includes(q) || (c.tags && c.tags.some(t => t.toLowerCase().includes(q))))
  })).filter(g => g.children.length > 0)
})

function toggleGroup(id) {
  if (expandedGroups.value.has(id)) {
    expandedGroups.value.delete(id)
  } else {
    expandedGroups.value.add(id)
  }
  // Trigger reactivity
  expandedGroups.value = new Set(expandedGroups.value)
}

function filterItems() {
  if (searchQuery.value.trim()) {
    expandedGroups.value = new Set(filteredItems.value.map(g => g.id))
  }
}
</script>

<style scoped>
.fnt {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.fnt-search {
  padding: 0 0 10px;
}

.fnt-search-input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  background: var(--admin-bg);
  color: var(--admin-text);
  font-size: 12px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.fnt-search-input:focus {
  border-color: var(--admin-accent, #6366f1);
}

.fnt-search-input::placeholder {
  color: var(--admin-text-muted);
}

.fnt-tree {
  flex: 1;
  overflow-y: auto;
}

.fnt-group {
  margin-bottom: 2px;
}

.fnt-group-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border: none;
  background: transparent;
  color: var(--admin-text);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}

.fnt-group-header:hover {
  background: var(--admin-surface-hover);
}

.fnt-arrow {
  font-size: 8px;
  transition: transform 0.2s;
  flex-shrink: 0;
  color: var(--admin-text-muted);
}

.fnt-arrow.open {
  transform: rotate(90deg);
}

.fnt-group-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.fnt-group-label {
  flex: 1;
  text-align: left;
}

.fnt-group-count {
  font-size: 10px;
  color: var(--admin-text-muted);
  background: var(--admin-bg);
  padding: 1px 6px;
  border-radius: 8px;
}

.fnt-children {
  padding-left: 16px;
}

.fnt-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: none;
  background: transparent;
  color: var(--admin-text-secondary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.15s;
  text-align: left;
}

.fnt-item:hover {
  background: var(--admin-surface-hover);
  color: var(--admin-text);
}

.fnt-item.active {
  background: rgba(99, 102, 241, 0.1);
  color: var(--admin-accent, #6366f1);
  font-weight: 600;
}

.fnt-item-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--admin-text-muted);
  flex-shrink: 0;
  transition: background 0.2s;
}

.fnt-item.active .fnt-item-dot {
  background: var(--admin-accent, #6366f1);
}

.fnt-item-label { flex: 1; text-align: left; }

.fnt-item-tags {
  display: flex;
  gap: 3px;
}

.fnt-tag {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--admin-bg);
  color: var(--admin-text-muted);
}

.fnt-empty {
  text-align: center;
  padding: 24px;
  font-size: 12px;
  color: var(--admin-text-muted);
}
</style>
