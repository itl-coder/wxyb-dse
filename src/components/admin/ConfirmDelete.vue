<script setup>
import { ElMessageBox } from 'element-plus'

async function confirmDelete(title, name) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${name}」吗？此操作不可恢复。`,
      title || '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    return true
  } catch {
    return false
  }
}

defineExpose({ confirmDelete })
</script>
