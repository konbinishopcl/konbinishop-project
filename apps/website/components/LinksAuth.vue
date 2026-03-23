<template>
  <div class="links--auth">
    <NuxtLink v-if="!isLoginPage" to="/login" class="links--auth__link">
      <IconArrowRight size="16" />
      ¿Ya tienes una cuenta? Inicia sesión
    </NuxtLink>
    <NuxtLink v-if="!isRegisterPage" to="/registro" class="links--auth__link">
      <IconArrowRight size="16" />
      ¿Aún no tienes cuenta? Regístrate
    </NuxtLink>
    <NuxtLink v-if="!isRecoverPage" to="/recuperar-contrasena" class="links--auth__link">
      <IconArrowRight size="16" />
      ¿Olvidaste tu contraseña?, recupérala aquí
    </NuxtLink>

    <NuxtLink v-if="isAuthPage" to="/" class="links--auth__link">
      <IconArrowRight size="16" />
      Volver al inicio
    </NuxtLink>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight as IconArrowRight } from 'lucide-vue-next'

const route = useRoute()

const isLoginPage = computed(() => route.path === '/login')
const isRegisterPage = computed(() => route.path === '/registro')
const isRecoverPage = computed(() => route.path === '/recuperar')
const isAuthPage = computed(() => isLoginPage.value || isRegisterPage.value || isRecoverPage.value)
</script>
