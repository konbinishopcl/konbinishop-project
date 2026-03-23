<template>
  <Form
    v-slot="{ meta }"
    :validation-schema="schema"
    class="form form--default"
    @submit="handleSubmit"
  >
    <fieldset class="form--default__fields">
      <!-- <pre>{{ form }}</pre>
      <pre>Form is dirty: {{ meta.dirty }}</pre> -->
      <!-- <pre>Form is valid: {{ meta.valid }}</pre> -->

      <!-- Email -->
      <FieldInput
        name="email"
        label="Correo Electrónico"
        type="email"
        :model-value="form.email"
        placeholder="Introduce tu correo electrónico"
        autocomplete="email"
        @update:model-value="val => (form.email = val)"
      />

      <!-- Password -->
      <FieldPassword
        :model-value="form.password"
        :show-repeat="false"
        @update:model-value="val => (form.password = val)"
      />
    </fieldset>

    <div class="form--default__send">
      <button
        :disabled="!meta.valid || loading"
        :title="`Iniciar Sesión`"
        type="submit"
        class="button button--default"
      >
        <span v-if="!sending">Iniciar Sesión</span>
        <span v-if="sending">Iniciando sesión...</span>
      </button>
    </div>
  </Form>
</template>

<script setup>
import { ref } from 'vue'
import { Form } from 'vee-validate'
import * as yup from 'yup'
import Swal from 'sweetalert2'
import { useRouter, useRoute } from 'vue-router'
import FieldInput from './FieldInput.vue'
import FieldPassword from './FieldPassword.vue'

const { login } = useStrapiAuth()
const sending = ref(false)
const router = useRouter()
const route = useRoute()

const schema = yup.object({
  email: yup
    .string()
    .email('Correo electrónico no válido')
    .required('Correo electrónico es requerido'),
  password: yup.string().required('Contraseña es requerida'),
})

const form = ref({
  email: '',
  password: '',
})

const handleSubmit = async values => {
  if (!schema.isValidSync(values)) {
    Swal.fire('Error', 'Por favor, completa todos los campos correctamente.', 'error')
    return
  }

  sending.value = true

  try {
    await login({ identifier: values.email, password: values.password })
    const redirectTo = route.query.redirect || '/'
    router.push(redirectTo)
  } catch {
    Swal.fire('Error', 'Hubo un error. Por favor, inténtalo de nuevo.', 'error')
  } finally {
    sending.value = false
  }
}
</script>
