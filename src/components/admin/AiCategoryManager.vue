<template>
  <el-dialog
    v-model="visible"
    :title="`分类管理 — ${moduleLabel}`"
    width="520px"
    :close-on-click-modal="false"
    destroy-on-close
    @open="loadCategories"
  >
    <div style="margin-bottom:12px;display:flex;gap:8px">
      <el-input
        v-model="newCategoryName"
        size="small"
        placeholder="输入新分类名称"
        @keyup.enter="addCategory"
        style="flex:1"
      />
      <el-button size="small" type="primary" @click="addCategory" :disabled="!newCategoryName.trim()">
        + 添加
      </el-button>
    </div>

    <div v-if="categories.length === 0" style="text-align:center;padding:40px;color:var(--admin-text-muted)">
      暂无分类，请添加
    </div>

    <div v-else class="category-list">
      <div
        v-for="(cat, idx) in categories"
        :key="idx"
        class="category-row"
        :class="{ editing: editingIdx === idx }"
      >
        <template v-if="editingIdx === idx">
          <el-input
            v-model="editValue"
            size="small"
            style="flex:1"
            @keyup.enter="saveEdit(idx)"
            @keyup.escape="cancelEdit"
          />
          <el-button size="small" type="primary" @click="saveEdit(idx)">保存</el-button>
          <el-button size="small" @click="cancelEdit">取消</el-button>
        </template>
        <template v-else>
          <span class="category-name">{{ cat }}</span>
          <div class="category-actions">
            <el-button size="small" text @click="startEdit(idx)">✏️</el-button>
            <el-button size="small" text @click="removeCategory(idx)" style="color:var(--admin-danger)">🗑</el-button>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <el-button size="small" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { aiCategoryService } from '@/services/dataService'

const props = defineProps({
  moduleKey: { type: String, required: true },
  moduleLabel: { type: String, default: '' }
})

const emit = defineEmits(['updated'])

const visible = ref(false)
const categories = ref([])
const newCategoryName = ref('')
const editingIdx = ref(-1)
const editValue = ref('')

function loadCategories() {
  categories.value = [...aiCategoryService.getByModule(props.moduleKey)]
}

function addCategory() {
  const name = newCategoryName.value.trim()
  if (!name) return
  if (categories.value.includes(name)) {
    newCategoryName.value = ''
    return
  }
  aiCategoryService.add(props.moduleKey, name)
  newCategoryName.value = ''
  loadCategories()
  emit('updated')
}

function removeCategory(idx) {
  const name = categories.value[idx]
  aiCategoryService.remove(props.moduleKey, name)
  loadCategories()
  emit('updated')
}

function startEdit(idx) {
  editingIdx.value = idx
  editValue.value = categories.value[idx]
}

function saveEdit(idx) {
  const newName = editValue.value.trim()
  if (newName && newName !== categories.value[idx]) {
    aiCategoryService.update(props.moduleKey, categories.value[idx], newName)
    loadCategories()
    emit('updated')
  }
  cancelEdit()
}

function cancelEdit() {
  editingIdx.value = -1
  editValue.value = ''
}

function open() {
  visible.value = true
}

function close() {
  visible.value = false
}

defineExpose({ open, close })
</script>

<style scoped>
.category-list {
  max-height: 360px;
  overflow-y: auto;
}
.category-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  transition: background 0.15s;
}
.category-row:hover {
  background: var(--admin-surface-hover);
}
.category-row.editing {
  background: var(--admin-surface-active);
}
.category-name {
  flex: 1;
  font-size: 13px;
  color: var(--admin-text);
}
.category-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}
.category-row:hover .category-actions {
  opacity: 1;
}
</style>
