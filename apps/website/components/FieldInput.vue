<template>
  <div class="field field--input">
    <label class="field--input__label" :for="name">
      {{ label }}
    </label>
    <Field
      v-model="localValue"
      :name="name"
      :type="type"
      class="field--input__control"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
    />
    <p v-if="info" class="field--input__info">{{ info }}</p>
    <ErrorMessage :name="name" class="field--input__error" />
  </div>
</template>

<script setup>
import { Field, ErrorMessage } from 'vee-validate'
import { ref, watch } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'text',
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  autocomplete: {
    type: String,
    default: 'off',
  },
  info: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  newValue => {
    localValue.value = newValue
  }
)

watch(localValue, newValue => {
  emit('update:modelValue', newValue)
})
</script>
