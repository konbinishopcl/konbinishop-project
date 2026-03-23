<template>
  <header
    class="header header--default headroom"
    :class="{ 'headroom--scrolled': isScrolled, 'headroom--hidden': isHidden }"
  >
    <div class="header--default__container">
      <div class="header--default__left">
        <div class="header--default__logo">
          <LogoDefault />
        </div>
        <nav class="header--default__menu">
          <MenuDefault />
        </nav>
        <nav class="header--default__menu">
          <MenuCategories />
        </nav>
      </div>
      <div class="header--default__right">
        <div class="header--default__actions">
          <nuxt-link v-if="!user" to="/login" class="button button--secondary">
            Iniciar sesión
          </nuxt-link>
          <nuxt-link to="/anunciar" class="button button--default"> Anunciar </nuxt-link>
          <button v-if="user" class="button button--secondary" @click.prevent="handleLogout">
            Salir
          </button>
        </div>
        <!-- <div class="header--default__search">
          <SearchDefault />
        </div> -->
        <div v-if="user" class="header--default__profile">
          <MenuUser />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import LogoDefault from './LogoDefault.vue'
import MenuDefault from './MenuDefault.vue'
import MenuCategories from './MenuCategories.vue'
import SearchDefault from './SearchDefault.vue'
import MenuUser from './MenuUser.vue'
import { useScrollHeader } from '@/composables/useScrollHeader'

const { isScrolled, isHidden } = useScrollHeader()
const user = useStrapiUser()
const { logout } = useStrapiAuth()

const handleLogout = async () => {
  try {
    await logout()
    navigateTo('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}
</script>
