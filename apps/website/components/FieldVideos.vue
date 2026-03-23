<template>
  <div class="field field--videos">
    <div class="field--videos__header">
      <label class="field--videos__title">Videos de YouTube</label>
      <p class="field--videos__subtitle">
        Ingresa enlaces de videos de YouTube relacionados al evento
      </p>
    </div>

    <div class="field--videos__list">
      <div v-for="(video, index) in videoLinks" :key="index" class="field--videos__item">
        <div class="field--videos__input">
          <input
            v-model="videoLinks[index]"
            type="url"
            placeholder="Ej: https://www.youtube.com/watch?v=..."
            class="form--default__control"
            @blur="validateYouTubeUrl(index)"
          />
          <button
            v-if="videoLinks.length > 1"
            class="button button--icon button--danger"
            type="button"
            @click="removeVideoLink(index)"
          >
            <IconTrash2 class="icon" />
          </button>
        </div>
      </div>
    </div>

    <button class="button button--add" type="button" @click="addVideoLink">
      <span>Agregar Video</span>
      <IconCirclePlus class="icon" />
    </button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { CirclePlus as IconCirclePlus, Trash2 as IconTrash2 } from 'lucide-vue-next'
import Swal from 'sweetalert2'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const videoLinks = ref(props.modelValue)

const isValidYouTubeUrl = url => {
  if (!url) return true // Permitir campos vacíos

  // Patrones para diferentes formatos de URLs de YouTube
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+(&.*)?$/, // Formato estándar
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+(\?.*)?$/, // Formato embed
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+(\?.*)?$/, // Formato acortado
  ]

  return patterns.some(pattern => pattern.test(url))
}

const getYouTubeVideoId = url => {
  if (!url) return null

  // Extraer ID de diferentes formatos de URLs de YouTube
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/]

  const match = url.match(patterns[0])
  return match ? match[1] : null
}

watch(
  videoLinks,
  newValue => {
    const validLinks = newValue.filter(url => !url || isValidYouTubeUrl(url))
    emit('update:modelValue', validLinks)
  },
  { deep: true }
)

onMounted(() => {
  if (!props.modelValue?.length) {
    videoLinks.value = ['']
    emit('update:modelValue', [''])
    return
  }

  const validLinks = props.modelValue.filter(
    link => link && typeof link === 'string' && link.trim() !== '' && isValidYouTubeUrl(link)
  )

  if (validLinks.length !== props.modelValue.length) {
    videoLinks.value = validLinks.length ? validLinks : ['']
    emit('update:modelValue', validLinks.length ? validLinks : [''])
  }
})

const addVideoLink = () => {
  // Verificar si hay campos vacíos o inválidos
  const hasEmptyOrInvalidLinks = videoLinks.value.some(link => !link || !isValidYouTubeUrl(link))

  if (hasEmptyOrInvalidLinks) {
    Swal.fire(
      'Error',
      'Por favor, completa el campo actual con una URL válida antes de agregar otro',
      'error'
    )
    return
  }

  // Verificar si hay videos duplicados usando IDs
  const videoIds = videoLinks.value.map(getYouTubeVideoId)
  const hasDuplicates = videoIds.some((id, index) => id && videoIds.indexOf(id) !== index)

  if (hasDuplicates) {
    Swal.fire({
      icon: 'error',
      title: 'Videos duplicados',
      text: 'Por favor, elimina los videos duplicados antes de agregar otro',
      confirmButtonText: 'Entendido',
    })
    return
  }

  if (videoLinks.value.length >= 10) {
    Swal.fire({
      icon: 'warning',
      title: 'Límite alcanzado',
      text: 'No se pueden agregar más de 10 videos',
      confirmButtonText: 'Entendido',
    })
    return
  }

  videoLinks.value.push('')
}

const removeVideoLink = index => {
  videoLinks.value.splice(index, 1)
}

const validateYouTubeUrl = index => {
  const url = videoLinks.value[index]
  if (!url) return

  // Validar formato de YouTube
  if (!isValidYouTubeUrl(url)) {
    Swal.fire({
      icon: 'error',
      title: 'URL inválida',
      text: 'Por favor ingresa una URL válida de YouTube',
      confirmButtonText: 'Entendido',
    })
    videoLinks.value[index] = ''
    return
  }

  // Validar duplicados usando el ID del video
  const currentVideoId = getYouTubeVideoId(url)
  if (!currentVideoId) return

  const isDuplicate = videoLinks.value.some((link, i) => {
    if (i === index) return false
    const otherVideoId = getYouTubeVideoId(link)
    return otherVideoId === currentVideoId
  })

  if (isDuplicate) {
    Swal.fire({
      icon: 'error',
      title: 'Video duplicado',
      text: 'Este video ya ha sido agregado',
      confirmButtonText: 'Entendido',
    })
    videoLinks.value[index] = ''
  }
}
</script>

<style lang="scss" scoped>
.field--videos {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  &__subtitle {
    font-size: 0.875rem;
    color: #a1a1aa;
    margin: 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;

    input {
      flex: 1;
    }
  }
}

.button--icon {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.button--danger {
  background-color: #991b1b;
  color: #fff;

  &:hover {
    background-color: #7f1d1d;
  }
}

.button--add {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;

  .material-icons {
    font-size: 1.25rem;
  }
}
</style>
