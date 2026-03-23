<template>
  <div class="field field--select">
    <label class="field--select__label" :for="name">
      {{ label }}
    </label>
    <select
      :name="name"
      class="field--select__control"
      :value="modelValue?.name || ''"
      @input="
        $emit(
          'update:modelValue',
          options.find(opt => opt.name === $event.target.value)
        )
      "
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.name" :value="option.name">
        {{ option.name.charAt(0).toUpperCase() + option.name.slice(1) }}
      </option>
    </select>
    <p v-if="info" class="field--select__info">{{ info }}</p>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  modelValue: {
    type: [String, Number, Object],
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Seleccionar una opción',
  },
  options: {
    type: Array,
    required: false,
    default: () => [],
  },
  info: {
    type: String,
    default: '',
  },
})

defineEmits(['update:modelValue'])
</script>
