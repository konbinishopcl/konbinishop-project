import { computed } from 'vue'
import type { Ref } from 'vue'
import type { User } from '@/types/user.types'

export function useUser() {
  const user = useStrapiUser() as Ref<User | null>

  const initials = computed(() => {
    if (!user.value) return ''
    const { firstname, lastname, username } = user.value
    if (firstname && lastname) {
      return firstname.charAt(0).toUpperCase() + lastname.charAt(0).toUpperCase()
    }
    if (username && username.length >= 2) {
      return username.substring(0, 2).toUpperCase()
    }
    return ''
  })

  const fullName = computed(() => {
    if (!user.value) return ''
    const { firstname, lastname } = user.value
    if (firstname && lastname) {
      return `${firstname} ${lastname}`
    }
    return ''
  })

  return {
    user,
    initials,
    fullName,
  }
}
