<template>
  <VueDraggable
    v-bind="draggableProps"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
    @start="$emit('dragStart', $event)"
    @end="$emit('dragEnd', $event)"
    @add="$emit('add', $event)"
    @remove="$emit('remove', $event)"
  >
    <slot />
  </VueDraggable>
</template>

<script setup>
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  group: { type: [String, Object], default: undefined },
  sort: { type: Boolean, default: true },
  handle: { type: String, default: undefined },
  filter: { type: String, default: undefined },
  ghostClass: { type: String, default: 'sortable-ghost' },
  dragClass: { type: String, default: 'sortable-drag' },
  animation: { type: Number, default: 200 },
  delay: { type: Number, default: 0 },
  touchStartThreshold: { type: Number, default: 5 },
  scroll: { type: Boolean, default: true },
  scrollSensitivity: { type: Number, default: 30 },
  scrollSpeed: { type: Number, default: 10 },
  disabled: { type: Boolean, default: false },
  itemKey: { type: String, default: 'id' },
  tag: { type: String, default: 'div' }
})

defineEmits([
  'update:modelValue',
  'change',
  'dragStart',
  'dragEnd',
  'add',
  'remove'
])

const draggableProps = computed(() => ({
  modelValue: props.modelValue,
  group: props.group,
  sort: props.sort,
  handle: props.handle,
  filter: props.filter,
  ghostClass: props.ghostClass,
  dragClass: props.dragClass,
  animation: props.animation,
  delay: props.delay,
  touchStartThreshold: props.touchStartThreshold,
  scroll: props.scroll,
  scrollSensitivity: props.scrollSensitivity,
  scrollSpeed: props.scrollSpeed,
  disabled: props.disabled,
  itemKey: props.itemKey,
  tag: props.tag
}))
</script>
