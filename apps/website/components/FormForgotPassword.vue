<template>
  <Form
    v-slot="{ meta }"
    :validation-schema="schema"
    class="form form--default"
    @submit="handleSubmit"
  >
    <fieldset class="form--default__fields">
      <!-- <pre>{{ form }}</pre>
      <pre>Form is dirty: {{ meta.dirty }}</pre>
      <pre>Form is valid: {{ meta.valid }}</pre> -->

      <!-- Email -->
      <FieldInput
        name="email"
        label="Correo electrónico"
        type="email"
        :model-value="form.email"
        placeholder="Introduce tu correo electrónico"
        autocomplete="email"
        @update:model-value="val => (form.email = val)"
      />
    </fieldset>

    <div class="form__send">
      <button
        :disabled="!meta.valid || loading"
        type="button"
        class="button button--default"
        @click="handleSubmit"
      >
        <span v-if="!loading">Recuperar Contraseña</span>
        <span v-if="loading">Enviando…</span>
      </button>
    </div>
  </Form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as yup from 'yup'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'
import FieldInput from './FieldInput.vue'
import { Form } from 'vee-validate'

const { forgotPassword } = useStrapiAuth()
const router = useRouter()

const form = ref({
  email: '',
})

const loading = ref(false)

const schema = yup.object({
  email: yup
    .string()
    .required('Correo electrónico es requerido')
    .email('Correo electrónico no válido'),
})

const handleSubmit = async () => {
  if (!schema.isValidSync(form.value)) {
    Swal.fire('Error', 'Por favor, introduce un correo electrónico válido.', 'error')
    return
  }

  loading.value = true
  try {
    await forgotPassword({
      email: form.value.email,
    })
    Swal.fire('Correo enviado', 'Se ha enviado un correo para recuperar tu contraseña.', 'success')
  } catch (error) {
    console.error('Error en la recuperación de contraseña:', error)
    Swal.fire(
      'Error',
      'Hubo un error al enviar el correo de recuperación. Por favor, inténtalo de nuevo.',
      'error'
    )
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}
</style>
