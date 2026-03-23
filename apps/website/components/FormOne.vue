/** * FormOne.vue * * Primer paso del formulario de creación de eventos. * Maneja la información
básica del evento: * - Título * - Empresa organizadora * - Categoría * - Descripción general * -
Descripción detallada (opcional) * - Configuración de precios * * @component * @example *
<FormOne :form="formData" />
*/
<template>
  <Form :validation-schema="schema" class="form form--one" @submit="handleSubmit">
    <fieldset class="form--one__fields">
      <!-- Título del evento -->
      <FieldInput
        name="title"
        label="Título del evento"
        type="text"
        :model-value="form?.title || ''"
        placeholder="Introduce el nombre oficial del evento"
        info="Ejemplo: 'Concierto de Anime Symphonic Orchestra 2024'"
        @update:model-value="val => updateField('title', val)"
      />

      <!-- Empresa -->
      <FieldInput
        name="company"
        label="Empresa"
        type="text"
        :model-value="form?.company || ''"
        placeholder="Introduce el nombre oficial del evento"
        info="Ejemplo: 'Cinepolis', 'Productora 8U'"
        @update:model-value="val => updateField('company', val)"
      />

      <!-- Categoría -->
      <FieldSelect
        name="category"
        label="Categoría"
        :model-value="form?.category || null"
        placeholder="Selecciona una categoría"
        :options="categories"
        info="Selecciona una categoría que describa el evento"
        @update:model-value="val => updateField('category', val)"
      />

      <!-- Descripción general -->
      <FieldTextarea
        name="description"
        label="Descripción general"
        :model-value="form?.description || ''"
        placeholder="Escribe una descripción breve del evento, incluyendo temática y tipo de evento"
        info="Ejemplo: 'Un concierto único donde se interpretarán los temas más icónicos de Studio Ghibli.'"
        :rows="4"
        @update:model-value="val => updateField('description', val)"
      />

      <!-- Acerca de (opcional) -->
      <FieldTextarea
        name="about"
        label="Acerca de (opcional)"
        :model-value="form?.about || ''"
        placeholder="Describe con mayor profundidad lo que los asistentes pueden esperar (artistas invitados, actividades, proyecciones especiales, etc.)."
        info="Ej: Presentación en vivo de artistas reconocidos como Yuki Kajiura, venta de productos exclusivos y meet & greet con cosplayers internacionales"
        :rows="6"
        @update:model-value="val => updateField('about', val)"
      />

      <div class="form__separator" />

      <!-- Precios -->
      <FieldPrice
        :model-value="form?.prices || { isFree: true, prices: [] }"
        @update:model-value="val => updateField('prices', val)"
      />
    </fieldset>
  </Form>
</template>

<script setup>
import { Form } from 'vee-validate'
import * as yup from 'yup'
import FieldInput from './FieldInput.vue'
import FieldTextarea from './FieldTextarea.vue'
import FieldSelect from './FieldSelect.vue'
import FieldPrice from './FieldPrice.vue'
import { useCreateStore } from '@/stores/create.store'
import { computed } from 'vue'

const props = defineProps({
  form: {
    type: Object,
    required: false,
    default: () => ({
      title: '',
      company: '',
      category: null,
      description: '',
      about: '',
      prices: {
        isFree: true,
        prices: [],
      },
    }),
  },
  categories: {
    type: Array,
    required: false,
    default: () => [],
  },
})

defineEmits(['update:form'])

const store = useCreateStore()

const schema = yup.object({
  title: yup
    .string()
    .required('El título es requerido')
    .min(3, 'El título debe tener al menos 3 caracteres'),
  company: yup
    .string()
    .required('La empresa es requerida')
    .min(2, 'La empresa debe tener al menos 2 caracteres'),
  category: yup
    .object()
    .required('La categoría es requerida')
    .test('category-validation', 'La categoría es requerida', function (value) {
      return value !== null && value !== undefined
    }),
  description: yup
    .string()
    .required('La descripción general es requerida')
    .min(20, 'La descripción debe tener al menos 20 caracteres'),
  about: yup.string().optional(),
  prices: yup
    .object()
    .required('Los precios son requeridos')
    .test('prices-validation', 'Debe especificar al menos un precio válido', function (value) {
      if (!value) return false
      if (value.isFree) return true
      return value.prices && value.prices.length > 0
    }),
})

const updateField = async (field, value) => {
  try {
    await schema.validateAt(field, { [field]: value })
    store.updateForm({ [field]: value })
  } catch {
    // Error de validación
  }
}

const handleSubmit = async values => {
  try {
    await schema.validate(values)
    store.updateForm(values)
  } catch {
    // Error al validar el formulario
  }
}
</script>
