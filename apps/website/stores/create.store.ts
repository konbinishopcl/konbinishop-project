import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { CreateForm, DateEvent } from '../types/create.types'

export const useCreateStore = defineStore(
  'create',
  () => {
    const currentStep = ref(0)
    const form = reactive<CreateForm>({
      title: '',
      company: '',
      category: '',
      description: '',
      about: '',
      prices: {
        isFree: true,
        prices: [],
      },
      dates: [
        {
          date: '',
          startTime: '',
          endTime: '',
        },
      ],
      address: {
        address: '',
        address_number: '',
        commune: '',
        region: '',
      },
      ticket_url: '',
      socialLinks: [],
      banner: null,
      poster: null,
      gallery: [],
      videos: [],
    })

    function setCurrentStep(step: number) {
      currentStep.value = step
    }

    function nextStep() {
      if (currentStep.value < 2) {
        currentStep.value++
      }
    }

    function prevStep() {
      if (currentStep.value > 0) {
        currentStep.value--
      }
    }

    function updateForm(values: Partial<CreateForm>) {
      Object.assign(form, values)
    }

    function resetForm() {
      Object.assign(form, {
        title: '',
        company: '',
        category: '',
        description: '',
        about: '',
        prices: {
          isFree: true,
          prices: [],
        },
        dates: [
          {
            date: '',
            startTime: '',
            endTime: '',
          },
        ],
        address: {
          address: '',
          address_number: '',
          commune: '',
          region: '',
        },
        ticket_url: '',
        socialLinks: [],
        banner: null,
        poster: null,
        gallery: [],
        videos: [],
      })
    }

    function isStepOneComplete(): boolean {
      const { title, company, category, description, prices } = form

      if (!title || !company || !category || !description) return false
      if (title.length < 3 || company.length < 2 || description.length < 20) return false
      if (!prices.isFree && (!prices.prices || prices.prices.length === 0)) return false

      return true
    }

    function isStepTwoComplete(): boolean {
      const { dates, ticket_url } = form

      if (!dates || dates.length === 0) return false
      const hasValidDate = dates.some(
        (date: DateEvent) => date.date && date.startTime && date.endTime
      )
      if (!hasValidDate) return false

      if (!form.prices.isFree && !ticket_url) return false

      return true
    }

    function isStepThreeComplete(): boolean {
      const { banner, poster, gallery } = form

      if (!banner || !poster) return false
      if (!gallery || gallery.length < 1) return false

      return true
    }

    return {
      currentStep,
      form,
      setCurrentStep,
      nextStep,
      prevStep,
      updateForm,
      resetForm,
      isStepOneComplete,
      isStepTwoComplete,
      isStepThreeComplete,
    }
  },
  {
    persist: {
      storage: import.meta.client ? localStorage : undefined,
      paths: ['form', 'currentStep'],
    },
  }
)
