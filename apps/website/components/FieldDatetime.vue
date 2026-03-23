<template>
  <div class="field field--datetime">
    <div class="field--datetime__header">
      <label class="field--datetime__title">Día y hora del evento</label>
      <p class="field--datetime__subtitle">Selecciona el día y la hora del evento</p>
    </div>

    <div class="field--datetime__list">
      <div v-for="(dateTime, index) in localValue" :key="index" class="field--datetime__item">
        <!-- Fecha -->
        <div class="field--datetime__input-group">
          <label :for="'date-' + index" class="field--datetime__label"> Fecha </label>
          <input
            :id="'date-' + index"
            v-model="localValue[index].date"
            type="date"
            class="field--datetime__input"
            :min="getTomorrowDate()"
            @input="handleChange"
          />
        </div>

        <!-- Hora inicio -->
        <div class="field--datetime__input-group">
          <label :for="'start-time-' + index" class="field--datetime__label"> Hora inicio </label>
          <input
            :id="'start-time-' + index"
            v-model="localValue[index].startTime"
            type="time"
            class="field--datetime__input"
            @input="handleChange"
          />
        </div>

        <!-- Hora término -->
        <div class="field--datetime__input-group">
          <label :for="'end-time-' + index" class="field--datetime__label"> Hora término </label>
          <input
            :id="'end-time-' + index"
            v-model="localValue[index].endTime"
            type="time"
            class="field--datetime__input"
            @input="handleChange"
          />
        </div>

        <!-- Botón eliminar -->
        <button
          v-if="localValue.length > 1"
          type="button"
          class="button button--delete"
          @click="removeDate(index)"
        >
          <IconTrash2 size="16" class="icon" />
        </button>
      </div>
    </div>

    <div class="field--datetime__footer">
      <!-- Botón agregar fecha -->
      <button type="button" class="button button--add" @click="addDate">
        <span>Agregar día</span>
        <IconCirclePlus class="icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Trash2 as IconTrash2, CirclePlus as IconCirclePlus } from 'lucide-vue-next'
import Swal from 'sweetalert2'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [{ date: '', startTime: '', endTime: '' }],
  },
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref([{ date: '', startTime: '', endTime: '' }])

watch(
  () => props.modelValue,
  newValue => {
    if (Array.isArray(newValue) && newValue.length > 0) {
      localValue.value = [...newValue]
    } else {
      localValue.value = [{ date: '', startTime: '', endTime: '' }]
    }
  },
  { deep: true, immediate: true }
)

const handleChange = () => {
  emit('update:modelValue', [...localValue.value])
}

onMounted(() => {
  if (!Array.isArray(props.modelValue) || props.modelValue.length === 0) {
    emit('update:modelValue', [{ date: '', startTime: '', endTime: '' }])
  } else {
    // Validar que cada fecha tenga todos los campos requeridos y eliminar las vacías
    const validatedDates = props.modelValue
      .map(date => ({
        date: date.date || '',
        startTime: date.startTime || '',
        endTime: date.endTime || '',
      }))
      .filter(date => date.date || date.startTime || date.endTime)

    // Si no hay fechas válidas, agregar una vacía
    if (validatedDates.length === 0) {
      validatedDates.push({ date: '', startTime: '', endTime: '' })
    }

    emit('update:modelValue', validatedDates)
  }
})

const addDate = () => {
  if (localValue.value.length >= 10) {
    Swal.fire({
      icon: 'warning',
      title: 'Límite alcanzado',
      text: 'No se pueden agregar más de 10 fechas',
      confirmButtonText: 'Entendido',
    })
    return
  }

  const lastDate = localValue.value[localValue.value.length - 1]
  if (!lastDate.date || !lastDate.startTime || !lastDate.endTime) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Por favor completa todos los campos antes de agregar una nueva fecha',
      confirmButtonText: 'Entendido',
    })
    return
  }

  localValue.value.push({ date: '', startTime: '', endTime: '' })
  handleChange()
}

const removeDate = index => {
  localValue.value.splice(index, 1)
  handleChange()
}

const getTomorrowDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

const isDateTimeValid = dateTime => {
  if (!dateTime.date || !dateTime.startTime || !dateTime.endTime) {
    return false
  }

  const selectedDate = new Date(dateTime.date)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  if (selectedDate < tomorrow) {
    return false
  }

  return dateTime.startTime < dateTime.endTime
}

// Función para verificar si un elemento debe estar bloqueado
const isDateTimeLocked = dateTime => {
  return isDateTimeValid(dateTime)
}
</script>
