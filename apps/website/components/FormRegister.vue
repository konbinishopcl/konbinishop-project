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

      <!-- Password -->
      <FieldPassword
        :model-value="form.password"
        :show-repeat="true"
        @update:model-value="val => (form.password = val)"
      />
    </fieldset>

    <div class="form--default__send">
      <button
        :disabled="!meta.valid || loading"
        type="button"
        class="button button--default"
        @click="handleSubmit"
      >
        <span v-if="!loading">Registrate</span>
        <span v-if="loading">Registrando…</span>
      </button>
    </div>
  </Form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as yup from 'yup'
import Swal from 'sweetalert2'
import { useRouter, useRoute } from 'vue-router'
import FieldInput from './FieldInput.vue'
import FieldPassword from './FieldPassword.vue'
import { Form } from 'vee-validate'

const { register } = useStrapiAuth()
const router = useRouter()
const route = useRoute()

const form = ref({
  email: '',
  password: '',
})

const loading = ref(false)

const schema = yup.object({
  email: yup
    .string()
    .required('Correo electrónico es requerido')
    .email('Correo electrónico no válido'),
  password: yup.string().required('Contraseña es requerida').min(6, 'Mínimo 6 caracteres'),
})

const handleSubmit = async () => {
  if (!schema.isValidSync(form.value)) {
    Swal.fire('Error', 'Por favor, completa todos los campos correctamente.', 'error')
    return
  }

  loading.value = true
  try {
    const emailParts = form.value.email.split('@')
    const username = emailParts[0]

    await register({
      email: form.value.email,
      password: form.value.password,
      username,
    })
    Swal.fire(
      'Cuenta creada',
      'Tu cuenta ha sido creada con éxito. Se ha enviado un correo para confirmar tu dirección de correo electrónico.',
      'success'
    )
    router.push('/login')
  } catch (error) {
    console.error('Error en el registro:', error)
    Swal.fire('Error', 'Hubo un error al crear tu cuenta. Por favor, inténtalo de nuevo.', 'error')
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
