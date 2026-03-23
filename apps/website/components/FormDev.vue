<template>
  <Form
    v-slot="{ meta }"
    :validation-schema="schema"
    class="form form--default"
    @submit="handleSubmit"
  >
    <fieldset class="form--default__fields">
      <!-- Username -->
      <FieldInput
        v-model="form.username"
        name="username"
        label="Usuario"
        type="text"
        placeholder="Introduce tu usuario"
        autocomplete="username"
      />

      <!-- Password -->
      <FieldPassword v-model="form.password" :show-repeat="false" />
    </fieldset>

    <div class="form--default__send">
      <button
        :disabled="!meta.valid || sending"
        :title="`Acceder al sitio`"
        type="submit"
        class="button button--default"
      >
        <span v-if="!sending">Acceder</span>
        <span v-if="sending">Accediendo...</span>
      </button>
    </div>
  </Form>
</template>

<script setup>
import { ref } from 'vue'
import { Form } from 'vee-validate'
import * as yup from 'yup'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'
import FieldInput from './FieldInput.vue'
import FieldPassword from './FieldPassword.vue'

const sending = ref(false)
const router = useRouter()

const schema = yup.object({
  username: yup.string().required('Usuario es requerido'),
  password: yup.string().required('Contraseña es requerida'),
})

const form = ref({
  username: '',
  password: '',
})

const handleSubmit = async () => {
  if (!schema.isValidSync(form.value)) {
    Swal.fire('Error', 'Por favor, completa todos los campos correctamente.', 'error')
    return
  }

  sending.value = true

  try {
    // Llamar al endpoint del servidor para validar credenciales
    const response = await $fetch('/api/dev-login', {
      method: 'POST',
      body: {
        username: form.value.username,
        password: form.value.password,
      },
    })

    if (response.success) {
      // Establecer cookie 'devmode' con el token de sesión
      const devmode = useCookie('devmode', {
        maxAge: 60 * 60 * 24, // 1 día en segundos
        path: '/', // Disponible en todo el sitio
        sameSite: 'lax',
      })

      // Guardar el token de sesión
      devmode.value = response.sessionToken

      // Redirigir directamente sin mostrar mensaje de éxito
      router.push('/')
    }
  } catch (error) {
    console.error('Error de autenticación:', error)

    if (error.statusCode === 401) {
      Swal.fire('Error', 'Credenciales incorrectas', 'error')
    } else if (error.statusCode === 400) {
      Swal.fire('Error', 'Por favor, completa todos los campos', 'error')
    } else {
      Swal.fire('Error', 'Hubo un error. Por favor, inténtalo de nuevo.', 'error')
    }
  } finally {
    sending.value = false
  }
}
</script>
