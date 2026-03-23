/** * FormTwo.vue * * Segundo paso del formulario de creación de eventos. * Maneja la información de
logística y redes sociales: * - Fechas y horarios del evento * - Dirección del evento * - URL de
venta de tickets (opcional si el evento es gratuito) * - Enlaces a redes sociales * * @component *
@example *
<FormTwo :form="formData" />
*/
<template>
  <Form :validation-schema="schema" class="form form--two" @submit="handleSubmit">
    <fieldset class="form--two__fields">
      <FieldDatetime
        :model-value="form.dates"
        @update:model-value="val => updateField('dates', val)"
      />

      <div class="form__separator" />

      <FieldAddress
        :model-value="form.address"
        :regions="regions"
        @update:model-value="val => updateField('address', val)"
      />

      <div class="form__separator" />

      <FieldInput
        name="ticket_url"
        label="Sitio web (Ticketera)"
        type="url"
        :model-value="form.ticket_url"
        placeholder="Ej: www.ticketmaster.com/evento"
        info="Ingresa el enlace donde se comprarán las entradas"
        @update:model-value="val => updateField('ticket_url', val)"
      />

      <FieldSocial
        :model-value="form.socialLinks"
        @update:model-value="val => updateField('socialLinks', val)"
      />
    </fieldset>
  </Form>
</template>

<script setup>
import { Form } from 'vee-validate'
import * as yup from 'yup'
import FieldDatetime from './FieldDatetime.vue'
import FieldAddress from './FieldAddress.vue'
import FieldInput from './FieldInput.vue'
import FieldSocial from './FieldSocial.vue'
import { useCreateStore } from '@/stores/create.store'
import Swal from 'sweetalert2'

const store = useCreateStore()

const props = defineProps({
  form: {
    type: Object,
    default: () => ({
      dates: [],
      address: {},
      ticket_url: '',
      socialLinks: [],
    }),
  },
  regions: {
    type: Array,
    required: false,
    default: () => [],
  },
})

const schema = yup.object({
  dates: yup
    .array()
    .of(
      yup.object({
        date: yup.string().required('La fecha es requerida'),
        startTime: yup.string().required('La hora de inicio es requerida'),
        endTime: yup.string().required('La hora de fin es requerida'),
      })
    )
    .min(1, 'Debe agregar al menos una fecha'),
  address: yup.object().optional(),
  ticket_url: yup.string().when('prices.isFree', {
    is: false,
    then: () =>
      yup.string().required('La URL de tickets es requerida cuando el evento no es gratuito'),
    otherwise: () => yup.string().optional(),
  }),
  socialLinks: yup.array().of(
    yup.object({
      platform: yup.string().required('Debes seleccionar una plataforma'),
      url: yup.string().required('Debes ingresar la URL'),
    })
  ),
})

const updateField = (field, value) => {
  store.updateForm({ [field]: value })
}

const handleSubmit = async values => {
  try {
    await schema.validate(values, { abortEarly: false })
    store.updateForm(values)
  } catch (error) {
    if (error.inner) {
      const errorMessages = error.inner.map(err => err.message).join('\n')
      Swal.fire({
        title: 'Error',
        text: errorMessages,
        icon: 'error',
      })
    }
  }
}

defineExpose({
  form: props.form,
})
</script>

<style scoped>
.form--two__fields {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form--two__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.form--two__subtitle {
  font-size: 1rem;
  color: #a1a1aa;
  margin: 0.5rem 0 0 0;
}
</style>
