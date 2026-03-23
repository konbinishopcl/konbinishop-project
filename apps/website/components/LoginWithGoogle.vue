<template>
  <button
    title="Iniciar sesión con Google"
    type="button"
    class="button button--google"
    @click="onClick"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
      <path
        fill="#4285F4"
        d="M24 9.5c3.9 0 7.1 1.6 9.3 4.1l6.9-6.9C35.3 2.7 30.1 0 24 0 14.6 0 6.4 5.8 2.5 14.1l7.9 6.1C12.1 13.1 17.5 9.5 24 9.5z"
      />
      <path
        fill="#34A853"
        d="M46.5 24c0-1.5-.1-3-.4-4.5H24v9h12.7c-.5 2.5-1.9 4.6-3.9 6.1l7.9 6.1C44.9 36.4 46.5 30.5 46.5 24z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.2c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7L2.5 12.7C.9 16.1 0 20 0 24s.9 7.9 2.5 11.3l7.9-6.1z"
      />
      <path
        fill="#EA4335"
        d="M24 48c6.5 0 12-2.1 16-5.7l-7.9-6.1c-2.2 1.5-5 2.4-8.1 2.4-6.5 0-12-4.4-14-10.4l-7.9 6.1C6.4 42.2 14.6 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
    <span>Ingresa con Google</span>
  </button>
</template>

<script setup lang="ts">
// Obtener la URL de autenticación del proveedor
const { getProviderAuthenticationUrl } = useStrapiAuth()

const onClick = () => {
  window.location.href = getProviderAuthenticationUrl('google')
}
</script>
