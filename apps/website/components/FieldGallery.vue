<template>
  <div class="field field--gallery">
    <div class="field--gallery__header">
      <label class="field--gallery__title">{{ label }}</label>
      <p v-if="info" class="field--gallery__subtitle">
        Puedes subir hasta 8 imágenes
        {{ images.length > 0 ? `(${images.length}/8)` : '' }}
      </p>
    </div>

    <div class="field--gallery__grid">
      <!-- Botón de agregar imagen -->
      <div
        v-if="images.length < 8"
        class="field--gallery__add"
        :class="{ 'is-loading': uploadStore.loading }"
        :style="{ cursor: uploadStore.loading ? 'wait' : 'pointer' }"
        @click="!uploadStore.loading && triggerFileInput()"
        @drop.prevent="!uploadStore.loading && handleDrop($event)"
        @dragover.prevent
      >
        <span>Seleccionar</span>
        <IconImagePlus class="icon" />
      </div>

      <!-- Imágenes seleccionadas -->
      <div
        v-for="(image, index) in images"
        :key="index"
        class="field--gallery__item"
        :class="{ 'is-loading': uploadStore.loading }"
      >
        <img :src="getImageUrl(image.url)" alt="Gallery image" class="field--gallery__image" />
        <button type="button" class="field--gallery__remove" @click="removeImage(index)">
          <IconX class="icon" />
        </button>
      </div>
    </div>

    <input
      :id="name"
      ref="fileInput"
      type="file"
      :name="name"
      accept="image/*"
      class="field--gallery__input"
      multiple
      @change="handleFileChange"
    />

    <p v-if="subinfo" class="field--gallery__subinfo">{{ subinfo }}</p>
    <ErrorMessage :name="name" class="field--gallery__error" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Field, ErrorMessage } from 'vee-validate'
import { useUploadStore } from '../stores/upload.store'
import { ImagePlus as IconImagePlus, X as IconX } from 'lucide-vue-next'
import Swal from 'sweetalert2'
import { useImageUrl } from '../composables/useImageUrl'

const props = withDefaults(
  defineProps<{
    name: string
    label: string
    modelValue?: Array<{ url: string }>
    info?: string
    subinfo?: string
  }>(),
  {
    info: '',
    subinfo: '',
    modelValue: () => [],
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: Array<{ url: string }>): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const images = ref<Array<{ url: string }>>(props.modelValue || [])
const uploadStore = useUploadStore()

const { getImageUrl } = useImageUrl()

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])

  if (images.value.length + files.length > 8) {
    uploadStore.error = `Solo puedes agregar ${8 - images.value.length} imágenes más`
    await Swal.fire({
      icon: 'warning',
      title: 'Límite excedido',
      text: uploadStore.error,
    })
    return
  }

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      try {
        const response = await uploadStore.uploadImage(file)
        if (response?.[0]) {
          const imageData = response[0]
          images.value.push(imageData)
          emit('update:modelValue', [...images.value])
        }
      } catch (error) {
        console.error('Error uploading image:', error)
      }
    }
  }

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleDrop = async (event: DragEvent) => {
  if (!event.dataTransfer?.files) return

  const droppedFiles = Array.from(event.dataTransfer.files).filter(file =>
    file.type.startsWith('image/')
  )

  if (images.value.length + droppedFiles.length > 8) {
    uploadStore.error = `Solo puedes agregar ${8 - images.value.length} imágenes más`
    await Swal.fire({
      icon: 'warning',
      title: 'Límite excedido',
      text: uploadStore.error,
    })
    return
  }

  for (const file of droppedFiles) {
    try {
      const response = await uploadStore.uploadImage(file)
      if (response?.[0]) {
        const imageData = response[0]
        images.value.push(imageData)
        emit('update:modelValue', [...images.value])
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }
}

const removeImage = (index: number) => {
  const newImages = [...images.value]
  newImages.splice(index, 1)
  images.value = newImages
  emit('update:modelValue', newImages)
}

watch(
  () => props.modelValue,
  newValue => {
    images.value = newValue
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/base/variables' as *;

.field--gallery {
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
    color: $white;
    margin: 0;
  }

  &__subtitle {
    font-size: 0.875rem;
    color: $gray-200;
    margin: 0;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  &__add {
    aspect-ratio: 1;
    border: 2px dashed $gray-400;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: $gray-700;
    color: $gray-200;

    &:hover {
      border-color: $white;
      color: $white;
    }

    .icon {
      width: 24px;
      height: 24px;
    }
  }

  &__item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;

    &.is-loading::after {
      content: '';
      position: absolute;
      inset: 0;
      background: $white-50;
    }
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__remove {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: $white-50;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $white;
    transition: all 0.2s ease;

    &:hover {
      background: $danger;
    }

    .icon {
      width: 16px;
      height: 16px;
    }
  }

  &__input {
    display: none;
  }

  &__error {
    color: $error;
    font-size: 0.875rem;
    margin: 0;
  }

  &__subinfo {
    font-size: 0.875rem;
    color: $gray-200;
    margin: 0;
  }
}
</style>
