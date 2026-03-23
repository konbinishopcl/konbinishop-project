<template>
  <div class="field field--price">
    <div class="field--price__free">
      <label class="field--price__free__label">
        <input v-model="localValue.isFree" type="checkbox" @change="handleChange" />
        <div class="field--price__free__label__checkbox">
          <IconCheck v-if="localValue.isFree" class="icon" />
        </div>
        Evento no tiene costo de entrada
      </label>
    </div>

    <div v-if="!localValue.isFree" class="field--price__list">
      <div
        v-for="(price, index) in localValue.prices"
        :key="index"
        class="field--price__list__item"
      >
        <!-- Nombre del precio -->
        <div class="field--price__list__item__group">
          <label :for="'price-name-' + index" class="field--price__label">
            Nombre precio {{ index + 1 }}
          </label>
          <input
            :id="'price-name-' + index"
            v-model="localValue.prices[index].name"
            type="text"
            class="field--price__input"
            placeholder="Ej: Entrada General"
            required
            @input="handleChange"
          />
        </div>

        <!-- Valor del precio -->
        <div class="field--price__list__item__group">
          <label :for="'price-value-' + index" class="field--price__label"> Precio </label>
          <div class="field--price__value">
            <!-- <span class="field--price__value__currency">$</span> -->
            <input
              :id="'price-value-' + index"
              v-model.number="localValue.prices[index].value"
              type="number"
              class="field--price__input"
              min="0"
              required
              @input="handleChange"
            />
            <!-- <span class="field--price__value__code">CLP</span> -->
          </div>
        </div>

        <!-- Botón eliminar -->
        <button
          v-if="localValue.prices.length > 1"
          type="button"
          class="button button--delete"
          @click="removePrice(index)"
        >
          <IconTrash2 size="20" class="icon" />
        </button>
      </div>
    </div>

    <div class="field--price__free__add">
      <!-- Botón agregar precio -->
      <button type="button" class="button button--add" @click="addPrice">
        Agregar precio
        <IconCirclePlus class="icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import {
  CirclePlus as IconCirclePlus,
  Trash2 as IconTrash2,
  Check as IconCheck,
} from 'lucide-vue-next'
import Swal from 'sweetalert2'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref({
  isFree: false,
  prices: [{ name: '', value: 0 }],
})

watch(
  () => props.modelValue,
  newValue => {
    localValue.value = { ...newValue }
  },
  { deep: true, immediate: true }
)

const handleChange = () => {
  emit('update:modelValue', { ...localValue.value })
}

onMounted(() => {
  if (!props.modelValue.prices?.length) {
    emit('update:modelValue', {
      isFree: false,
      prices: [{ name: '', value: 0 }],
    })
    return
  }

  const validPrices = props.modelValue.prices.filter(
    price =>
      price &&
      typeof price === 'object' &&
      price.name &&
      price.name.trim() !== '' &&
      typeof price.value === 'number' &&
      price.value > 0
  )

  if (validPrices.length !== props.modelValue.prices.length) {
    emit('update:modelValue', {
      ...props.modelValue,
      prices: validPrices,
    })
  }
})

const addPrice = () => {
  if (localValue.value.prices.length >= 6) {
    Swal.fire({
      icon: 'warning',
      title: 'Límite alcanzado',
      text: 'No se pueden agregar más de 6 precios',
      confirmButtonText: 'Entendido',
    })
    return
  }

  const lastPrice = localValue.value.prices[localValue.value.prices.length - 1]
  if (lastPrice && (!lastPrice.name.trim() || lastPrice.value <= 0)) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Por favor completa el nombre y el valor del precio actual antes de agregar uno nuevo',
      confirmButtonText: 'Entendido',
    })
    return
  }

  localValue.value.prices.push({ name: '', value: 0 })
  handleChange()
}

const removePrice = index => {
  localValue.value.prices.splice(index, 1)
  handleChange()
}
</script>
