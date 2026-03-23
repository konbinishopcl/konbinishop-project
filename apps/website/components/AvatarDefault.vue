<template>
  <div class="avatar avatar--default">
    <!-- <pre>{{ user }}</pre> -->
    <span>{{ initials }}</span>
  </div>
</template>

<script setup lang="ts">
import { useUser } from '@/composables/useUser'

const { user, initials } = useUser()
</script>
