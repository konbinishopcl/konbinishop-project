<template>
  <div class="field field--upload">
    <label class="field--upload__label" :for="name">
      {{ label }}
    </label>
    <div class="field--upload__container">
      <div
        ref="dropzoneRef"
        class="field--upload__dropzone"
        :style="{
          borderColor: error ? '#ef4444' : '#52525b',
          backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
          backgroundSize: previewUrl ? 'cover' : 'auto',
          backgroundPosition: previewUrl ? 'center' : 'auto',
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? '0.7' : '1',
        }"
        @dragover.prevent
        @drop.prevent="!loading && handleDrop($event)"
        @click="!loading && triggerFileInput($event)"
      >
        <template v-if="!loading">
          <span v-if="!previewUrl" class="field--upload__text">{{ uploadText }}</span>
          <span v-if="!previewUrl" class="field--upload__browse" @click.stop="triggerFileInput"
            >Buscar en mi computador</span
          >
          <button v-if="previewUrl" class="field--upload__remove" @click.stop="removeFile">
            Eliminar
          </button>
        </template>
        <span v-else class="field--upload__loading">Subiendo...</span>
      </div>
      <input
        :id="name"
        ref="fileInput"
        type="file"
        :name="name"
        accept="image/*"
        class="field--upload__input"
        style="display: none"
        @change="handleFileChange"
      />
    </div>
    <p v-if="info" class="field--upload__info">{{ info }}</p>
    <p v-if="subinfo" class="field--upload__subinfo">{{ subinfo }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Field, ErrorMessage } from 'vee-validate'
import Swal from 'sweetalert2'
import { useUploadStore } from '../stores/upload.store'
import { useImageUrl } from '../composables/useImageUrl'

const { getImageUrl } = useImageUrl()

interface Props {
  name: string
  label: string
  modelValue?: File | { url: string } | null
  info?: string
  uploadText: string
  subinfo?: string
}

const props = withDefaults(defineProps<Props>(), {
  info: '',
  subinfo: '',
  modelValue: null,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: File | { url: string } | null): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const dropzoneRef = ref<HTMLElement | null>(null)
const previewUrl = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const uploadStore = useUploadStore()

const triggerFileInput = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    try {
      loading.value = true
      error.value = null
      previewUrl.value = URL.createObjectURL(file)

      const response = await uploadStore.uploadImage(file)
      if (response && response.length > 0) {
        const imageData = response[0]
        emit('update:modelValue', imageData)
        previewUrl.value = getImageUrl(imageData.url)
      }
    } catch (err) {
      console.error('Upload error:', err)
      error.value = null
      previewUrl.value = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
      emit('update:modelValue', null)
      Swal.fire({
        icon: 'error',
        title: 'Error al subir la imagen',
        text: 'No se pudo conectar con el servidor. Por favor, inténtalo de nuevo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      })
    } finally {
      loading.value = false
    }
  }
}

const handleDrop = async (event: DragEvent) => {
  if (!event.dataTransfer?.files) return

  const droppedFiles = Array.from(event.dataTransfer.files).filter(file =>
    file.type.startsWith('image/')
  )
  if (droppedFiles.length > 0) {
    try {
      loading.value = true
      error.value = null
      const file = droppedFiles[0]
      previewUrl.value = URL.createObjectURL(file)

      const response = await uploadStore.uploadImage(file)
      if (response && response.length > 0) {
        const imageData = response[0]
        emit('update:modelValue', imageData)
        previewUrl.value = getImageUrl(imageData.url)
      }
    } catch (err) {
      console.error('Upload error:', err)
      error.value = null
      previewUrl.value = null
      emit('update:modelValue', null)
      Swal.fire({
        icon: 'error',
        title: 'Error al subir la imagen',
        text: 'No se pudo conectar con el servidor. Por favor, inténtalo de nuevo.',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
      })
    } finally {
      loading.value = false
    }
  }
}

const removeFile = () => {
  emit('update:modelValue', null)
  previewUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

onMounted(() => {
  if (props.modelValue && 'url' in props.modelValue) {
    previewUrl.value = getImageUrl(props.modelValue.url)
  }
})
</script>
