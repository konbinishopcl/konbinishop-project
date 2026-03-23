import { ref, onMounted, onUnmounted } from 'vue'

export function useScrollHeader() {
  const isScrolled = ref(false)
  const isHidden = ref(false)
  const lastScrollPosition = ref(0)
  const scrollThreshold = 100 // Umbral de scroll para mostrar/ocultar el header

  const handleScroll = () => {
    if (import.meta.client) {
      const currentScrollPosition = window.scrollY
      const scrollDirection = currentScrollPosition > lastScrollPosition.value ? 'down' : 'up'

      // Si el scroll es hacia abajo y supera el umbral, ocultamos el header
      if (scrollDirection === 'down' && currentScrollPosition > scrollThreshold) {
        isHidden.value = true
      }
      // Si el scroll es hacia arriba, mostramos el header
      else if (scrollDirection === 'up') {
        isHidden.value = false
      }

      // Si estamos haciendo scroll (en cualquier dirección), activamos el estado de scrolled
      if (currentScrollPosition > 0) {
        isScrolled.value = true
      } else {
        isScrolled.value = false
      }

      lastScrollPosition.value = currentScrollPosition
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll() // Llamamos una vez al montar para establecer el estado inicial
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    isScrolled,
    isHidden,
  }
}
