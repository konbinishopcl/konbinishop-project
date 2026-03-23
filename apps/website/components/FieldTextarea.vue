<template>
  <div class="field field--textarea">
    <label class="field--textarea__label" :for="name">
      {{ label }}
    </label>
    <Field
      ref="textareaRef"
      v-model="localValue"
      :name="name"
      as="textarea"
      class="field--textarea__control"
      :placeholder="placeholder"
      :rows="rows"
    />
    <p v-if="info" class="field--textarea__info">{{ info }}</p>
    <ErrorMessage :name="name" class="field--textarea__error" />
  </div>
</template>

<script setup>
import { Field, ErrorMessage } from 'vee-validate'
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  modelValue: {
    type: [String, Number],
    required: true,
  },
  placeholder: {
    type: String,
    default: '',
  },
  rows: {
    type: Number,
    default: 4,
  },
  info: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
const textareaRef = ref(null)
const localValue = ref(props.modelValue)

const adjustHeight = () => {
  const textarea = textareaRef.value.$el
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

watch(localValue, newValue => {
  emit('update:modelValue', newValue)
  adjustHeight()
})

watch(
  () => props.modelValue,
  newValue => {
    localValue.value = newValue
    adjustHeight()
  }
)

onMounted(() => {
  adjustHeight()
})
</script>
