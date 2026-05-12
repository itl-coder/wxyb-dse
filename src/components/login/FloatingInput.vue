<template>
  <div class="fi-wrap" :class="{ focused, 'has-icon': !!icon, filled: modelValue, error: !!error, disabled }">
    <span v-if="icon" class="fi-icon">
      <slot name="icon">{{ icon }}</slot>
    </span>
    <div class="fi-input-area">
      <input
        ref="inputRef"
        :type="inputType"
        :value="modelValue"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :placeholder="placeholder"
        class="fi-input"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="focused = true"
        @blur="focused = false"
      />
      <label class="fi-label">{{ placeholder }}</label>
    </div>
    <button
      v-if="type === 'password' && modelValue"
      type="button"
      class="fi-toggle"
      @click="showPassword = !showPassword"
      tabindex="-1"
    >
      {{ showPassword ? '◉' : '○' }}
    </button>
    <span v-if="error" class="fi-err">{{ error }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  type: { type: String, default: 'text' },
  icon: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: Boolean,
  autocomplete: { type: String, default: 'off' },
  maxlength: { type: [String, Number], default: undefined }
})

defineEmits(['update:modelValue'])

const focused = ref(false)
const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type === 'password' && showPassword.value) return 'text'
  return props.type
})
</script>

<style scoped>
.fi-wrap {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.fi-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  color: rgba(148, 163, 184, 0.25);
  display: flex;
  align-items: center;
  transition: color 0.25s;
  pointer-events: none;
}

.fi-wrap.focused .fi-icon {
  color: rgba(129, 140, 248, 0.55);
}

.fi-wrap.error .fi-icon {
  color: rgba(248, 113, 113, 0.5);
}

.fi-input-area {
  position: relative;
  flex: 1;
}

.fi-input {
  width: 100%;
  padding: 14px 12px 6px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.025);
  color: #e2e8f0;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: all 0.25s;
  box-sizing: border-box;
}

.fi-wrap.has-icon .fi-input {
  padding-left: 38px;
}

.fi-input::placeholder {
  color: transparent;
}

.fi-input:focus {
  border-color: rgba(99, 102, 241, 0.45);
  background: rgba(99, 102, 241, 0.05);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.06);
}

.fi-wrap.error .fi-input {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.03);
}

.fi-wrap.disabled .fi-input {
  opacity: 0.5;
  cursor: not-allowed;
}

.fi-label {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: rgba(148, 163, 184, 0.25);
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: left center;
}

.fi-wrap.has-icon .fi-label {
  left: 38px;
}

.fi-wrap.focused .fi-label,
.fi-wrap.filled .fi-label,
.fi-input:not(:placeholder-shown) ~ .fi-label {
  top: 8px;
  transform: translateY(0) scale(0.75);
  color: rgba(129, 140, 248, 0.55);
}

.fi-wrap.error .fi-label {
  color: rgba(248, 113, 113, 0.5);
}

.fi-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(148, 163, 184, 0.3);
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  transition: color 0.2s;
  z-index: 1;
}

.fi-toggle:hover {
  color: rgba(203, 213, 225, 0.6);
}

.fi-err {
  position: absolute;
  bottom: -16px;
  left: 4px;
  font-size: 10px;
  color: #f87171;
}
</style>
