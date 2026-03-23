<template>
  <div class="menu menu--user">
    <div class="menu--user__avatar">
      <AvatarDefault />
    </div>
    <div class="menu--user__links">
      <NuxtLink to="/profile">Profile</NuxtLink>
      <NuxtLink to="/settings">Settings</NuxtLink>
      <NuxtLink to="/logout">Logout</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import AvatarDefault from './AvatarDefault.vue'
</script>

<style lang="scss">
.menu {
  &--user {
    display: flex;
    position: relative;

    &__links {
      background-color: white;
      border-radius: 10px;
      padding: 10px;
      box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
      position: absolute;
      top: 60px;
      right: 0;
    }
  }
}
</style>
