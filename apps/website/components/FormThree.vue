/** * FormThree.vue * * Tercer paso del formulario de creación de eventos. * Maneja el contenido
multimedia del evento: * - Banner principal (imagen horizontal) * - Póster del evento (imagen
vertical) * - Galería de imágenes (máximo 8 imágenes) * - Videos de YouTube * * @component *
@example *
<FormThree :form="formData" @update:form="handleFormUpdate" />
*/
<template>
  <Form :validation-schema="schema" class="form form--three" @submit="handleSubmit">
    <fieldset class="form--three__fields">
      <FieldUpload
        :key="'banner'"
        :model-value="form.banner"
        name="banner"
        label="Imagen principal (Banner del evento)"
        type="banner"
        info="La imagen no debe contener textos"
        upload-text="Sube una imagen en formato horizontal que represente el evento"
        @update:model-value="val => updateField('banner', val)"
      />

      <div class="form__separator" />

      <FieldUpload
        :key="'poster'"
        :model-value="form.poster"
        name="poster"
        label="Póster"
        type="poster"
        upload-text="Sube una imagen vertical del póster oficial del evento"
        @update:model-value="val => updateField('poster', val)"
      />

      <div class="form__separator" />

      <FieldGallery
        :model-value="form.gallery"
        name="gallery"
        label="Imágenes para galería"
        info="Puedes subir hasta 10 imágenes"
        subinfo="Imágenes que estarán en la descripción"
        @update:model-value="val => updateField('gallery', val)"
      />

      <FieldVideos
        :model-value="form.videos"
        @update:model-value="val => updateField('videos', val)"
      />
    </fieldset>
  </Form>
</template>

<script setup>
import { ref } from 'vue'
import { Form } from 'vee-validate'
import * as yup from 'yup'
import FieldUpload from './FieldUpload.vue'
import FieldVideos from './FieldVideos.vue'
import FieldGallery from './FieldGallery.vue'
import { useCreateStore } from '@/stores/create.store'

const store = useCreateStore()

const props = defineProps({
  form: {
    type: Object,
    default: () => ({
      banner: null,
      poster: null,
      gallery: [],
      videos: [],
    }),
  },
})

const emit = defineEmits(['update:form'])

const schema = yup.object({
  title: yup
    .string()
    .required('El título es requerido')
    .min(3, 'El título debe tener al menos 3 caracteres'),
  banner: yup.mixed().test('fileType', 'Solo se permiten imágenes', value => {
    if (!value) return false
    return value && value.url
  }),
  poster: yup.mixed().test('fileType', 'Solo se permiten imágenes', value => {
    if (!value) return false
    return value && value.url
  }),
  gallery: yup
    .array()
    .required('Se requiere al menos una imagen para la galería')
    .min(1, 'Se requiere al menos una imagen')
    .max(10, 'No puedes subir más de 10 imágenes')
    .test('fileType', 'Solo se permiten imágenes', value => {
      if (!value) return false
      return value.every(file => file && file.url)
    }),
  videos: yup
    .array()
    .of(
      yup
        .string()
        .matches(
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
          'Debe ser una URL válida de YouTube'
        )
    ),
})

const updateField = (field, value) => {
  const updatedForm = { ...props.form, [field]: value }
  emit('update:form', updatedForm)
  store.updateForm({ [field]: value })
}

const handleSubmit = async values => {
  try {
    await schema.validate(values)
    store.updateForm(values)
  } catch (error) {
    console.error('Error al validar el formulario:', error)
  }
}

defineExpose({
  form: props.form,
})
</script>

<style lang="scss" scoped>
.form--three__fields {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.field--gallery {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__label {
    font-size: 1.25rem;
    font-weight: 600;
    color: #fff;
  }

  &__info {
    font-size: 0.875rem;
    color: #a1a1aa;
    margin: 0;
  }
}
</style>
