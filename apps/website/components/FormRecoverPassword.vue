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

      <!-- New Password -->
      <FieldPassword
        name="new_password"
        label="Nueva Contraseña"
        :model-value="form.newPassword"
        placeholder="Introduce tu nueva contraseña"
        autocomplete="new-password"
        :show-repeat="true"
        @update:model-value="val => (form.newPassword = val)"
      />
    </fieldset>

    <div class="form__send">
      <button
        :disabled="!meta || loading"
        type="button"
        class="button button--default"
        @click="handleSubmit"
      >
        <span v-if="!loading">Cambiar Contraseña</span>
        <span v-if="loading">Enviando…</span>
      </button>
    </div>
  </Form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as yup from 'yup'
import Swal from 'sweetalert2'
import { useRouter, useRoute } from 'vue-router'
import FieldPassword from './FieldPassword.vue'
import { Form } from 'vee-validate'

const { resetPassword } = useStrapiAuth()
const router = useRouter()
const route = useRoute()

const form = ref({
  newPassword: '',
})

const loading = ref(false)

const schema = yup.object({
  newPassword: yup.string().required('Nueva contraseña es requerida').min(6, 'Mínimo 6 caracteres'),
})

const handleSubmit = async () => {
  if (!schema.isValidSync(form.value)) {
    Swal.fire('Error', 'Por favor, completa todos los campos correctamente.', 'error')
    return
  }

  loading.value = true
  try {
    const token = Array.isArray(route.query.token) ? route.query.token[0] : route.query.token
    if (!token) {
      throw new Error('Token no válido')
    }
    await resetPassword({
      password: form.value.newPassword,
      passwordConfirmation: form.value.newPassword,
      code: token,
    })
    Swal.fire('Contraseña cambiada', 'Tu contraseña ha sido cambiada con éxito.', 'success')
    router.push('/login')
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error)
    Swal.fire(
      'Error',
      'Hubo un error al cambiar tu contraseña. Por favor, inténtalo de nuevo.',
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
