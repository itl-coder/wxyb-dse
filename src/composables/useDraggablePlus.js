/**
 * vue-draggable-plus 薄封装
 * 统一 group 命名、动画配置、sort 策略
 * used by: ExamSeatStudentPool, ExamSeatGrid (P2)
 */
import { ref } from 'vue'

const DRAG_GROUP = 'exam-seats'

/**
 * @param {object} opts
 * @param {boolean} [opts.sort=true] - 是否允许排序
 * @param {string} [opts.group] - 自定义 group 名称
 * @returns {{ dragOptions: import('vue').ComputedRef, isDragging: import('vue').Ref<boolean> }}
 */
export function useDraggablePlus(opts = {}) {
  const isDragging = ref(false)
  const groupName = opts.group || DRAG_GROUP

  const poolDragOptions = {
    group: { name: groupName, pull: 'clone', put: false },
    sort: false,
    animation: 200,
    dragClass: 'dp-dragging',
    ghostClass: 'dp-ghost',
    chosenClass: 'dp-chosen'
  }

  const gridDragOptions = {
    group: { name: groupName, pull: true, put: true },
    sort: opts.sort !== undefined ? opts.sort : true,
    animation: 180,
    dragClass: 'dp-dragging',
    ghostClass: 'dp-ghost',
    chosenClass: 'dp-chosen'
  }

  return {
    isDragging,
    groupName,
    poolDragOptions,
    gridDragOptions
  }
}
