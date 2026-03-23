<template>
  <ClientOnly>
    <section class="create create--default">
      <div class="create--default__header">
        <div class="create--default__header__step">Paso {{ currentStep }} de 3</div>
        <h1 class="create--default__header__title">
          {{ getStepTitle }}
        </h1>
      </div>
      <div class="create--default__content">
        <FormOne
          v-if="currentStep === 1"
          ref="formOne"
          :form="store.form"
          :categories="categories"
          @update:form="val => store.updateForm(val)"
        />
        <FormTwo
          v-if="currentStep === 2"
          ref="formTwo"
          :form="store.form"
          :regions="regions"
          @update:form="val => store.updateForm(val)"
        />
        <FormThree
          v-if="currentStep === 3"
          ref="formThree"
          :form="store.form"
          @update:form="val => store.updateForm(val)"
        />
      </div>
      <div class="create--default__steps">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="create--default__steps__step"
          :class="{
            'create--default__steps__step--active': currentStep === index + 1,
            'create--default__steps__step--completed': currentStep > index + 1,
          }"
        >
          <span>{{ step }}</span>
        </div>
      </div>
      <div class="create--default__actions">
        <button :disabled="currentStep <= 1" class="button button--default" @click="prevStep">
          Atrás
        </button>

        <button v-if="currentStep < 3" class="button button--default" @click="nextStep">
          Siguiente
        </button>

        <button v-if="currentStep === 3" class="button button--default" @click="handleSubmit">
          Guardar
        </button>
      </div>
    </section>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormOne from './FormOne.vue'
import FormTwo from './FormTwo.vue'
import FormThree from './FormThree.vue'
import Swal from 'sweetalert2'
import { useAsyncData, useState } from '#app'

const props = defineProps({
  categories: {
    type: Array,
    required: false,
    default: () => [],
  },
  regions: {
    type: Array,
    required: false,
    default: () => [],
  },
  store: {
    type: Object,
    required: true,
  },
})

const route = useRoute()
const router = useRouter()
const steps = ['Paso 1', 'Paso 2', 'Paso 3']
const formOne = ref(null)
const formTwo = ref(null)
const formThree = ref(null)

// Inicializar el paso desde la URL de manera asíncrona
const { data: initialStep } = useAsyncData('currentStep', () => {
  const stepFromUrl = Number(route.params.step)
  const isValidStep = !isNaN(stepFromUrl) && stepFromUrl >= 1 && stepFromUrl <= 3
  return isValidStep ? stepFromUrl : 1
})

// Usar useState para mantener el estado consistente
const currentStep = useState('currentStep', () => initialStep.value || 1)

onMounted(() => {
  const step = Number(route.params.step) || currentStep.value

  // Validar que el paso 1 esté completo antes de permitir acceder a pasos posteriores
  if (step > 1 && !props.store.isStepOneComplete()) {
    currentStep.value = 1
    props.store.setCurrentStep(1)
    router.push('/anunciar/1')
    return
  }

  // Validar que el paso 2 esté completo antes de permitir acceder al paso 3
  if (step > 2 && !props.store.isStepTwoComplete()) {
    currentStep.value = 2
    props.store.setCurrentStep(2)
    router.push('/anunciar/2')
    return
  }

  if (step !== currentStep.value) {
    currentStep.value = step
  }
  props.store.setCurrentStep(step)
})

const nextStep = async () => {
  let isValid = false

  switch (currentStep.value) {
    case 1:
      isValid = props.store.isStepOneComplete()
      break
    case 2:
      isValid = props.store.isStepTwoComplete()
      break
    case 3:
      isValid = props.store.isStepThreeComplete()
      break
  }

  if (!isValid) {
    Swal.fire(
      'Error',
      'Por favor, completa todos los campos requeridos antes de continuar',
      'error'
    )
    return
  }

  currentStep.value++
  props.store.setCurrentStep(currentStep.value)
  router.push(`/anunciar/${currentStep.value}`)
  await router.isReady()
  window.scrollTo(0, 0)
}

const prevStep = () => {
  currentStep.value--
  props.store.setCurrentStep(currentStep.value)
  router.push(`/anunciar/${currentStep.value}`)
  window.scrollTo(0, 0)
}

const handleSubmit = async () => {
  try {
    if (currentStep.value === 3) {
      const isValid = props.store.isStepThreeComplete()
      if (!isValid) {
        Swal.fire(
          'Error',
          'Por favor, completa todos los campos requeridos antes de continuar',
          'error'
        )
        return
      }
      router.push('/anunciar/resumen')
    }
  } catch (error) {
    console.error('Error al validar el formulario:', error)
  }
}

const getStepTitle = computed(() => {
  switch (currentStep.value) {
    case 1:
      return 'Hola, Gabriel. Cuéntanos sobre el evento'
    case 2:
      return 'Horarios, Ubicación y Links'
    case 3:
      return 'Imágenes del Evento'
    default:
      return ''
  }
})
</script>
