<template>
  <div class="field field--rut">
    <label class="field--rut__label" :for="name">
      {{ label }}
    </label>
    <div class="field--rut__input">
      <input
        :id="name"
        v-model="localValue"
        type="text"
        :placeholder="placeholder"
        class="field--rut__control"
        maxlength="12"
        @input="handleInput"
        @keypress="onlyNumbers"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRut } from '@/composables/useRut'

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
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Introduce tu RUT',
  },
})

const emit = defineEmits(['update:modelValue'])

const { cleanRut, formatRut } = useRut()
const localValue = ref(props.modelValue)

watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== localValue.value) {
      localValue.value = newValue
    }
  }
)

const onlyNumbers = e => {
  const key = e.key
  const isNumber = /[0-9]/.test(key)
  const isAllowedKey = ['k', 'K'].includes(key) && e.target.value.length >= 7

  if (!isNumber && !isAllowedKey) {
    e.preventDefault()
  }
}

const handleInput = event => {
  const value = event.target.value.replace(/[^0-9kK]/g, '')

  if (value) {
    // Si tiene suficientes números para ser un RUT válido
    if (value.length > 1) {
      // Separar números del dígito verificador
      let numbers = value.slice(0, -1)
      const dv = value.slice(-1).toUpperCase()

      // Formatear números con puntos
      numbers = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

      // Unir con guión
      localValue.value = `${numbers}-${dv}`
    } else {
      localValue.value = value
    }
  } else {
    localValue.value = ''
  }

  emit('update:modelValue', localValue.value)
}
</script>
