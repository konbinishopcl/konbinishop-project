<template>
  <div class="field field--social">
    <div class="field--social__header">
      <label class="field--social__title">Red Social</label>
      <p class="field--social__subtitle">
        Ingresa enlaces de redes sociales: Instagram, Facebook, X
      </p>
    </div>

    <div class="field--social__list">
      <div v-for="(social, index) in socialLinks" :key="index" class="field--social__item">
        <div class="field--social__input">
          <input
            v-model="socialLinks[index]"
            type="url"
            placeholder="Ej: https://www.instagram.com/konbinishop.cl"
            class="form--default__control"
            @blur="validateSocialUrl(index)"
          />
          <button
            v-if="socialLinks.length > 1"
            class="button button--delete"
            type="button"
            @click="removeSocialLink(index)"
          >
            <IconTrash2 size="16" class="icon" />
          </button>
        </div>
      </div>
    </div>

    <div class="field--social__footer">
      <button class="button button--add" type="button" @click="addSocialLink">
        <span>Agregar Red Social</span>
        <IconCirclePlus class="icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Trash2 as IconTrash2, CirclePlus as IconCirclePlus } from 'lucide-vue-next'
import Swal from 'sweetalert2'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

const socialLinks = ref(props.modelValue)

const isValidSocialUrl = url => {
  if (!url) return true // Permitir campos vacíos

  // Lista de redes sociales permitidas y sus patrones
  const allowedSocials = {
    instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/.+$/,
    facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/.+$/,
    twitter: /^(https?:\/\/)?(www\.)?x\.com\/.+$/,
    tiktok: /^(https?:\/\/)?(www\.)?tiktok\.com\/.+$/,
    youtube: /^(https?:\/\/)?(www\.)?youtube\.com\/.+$/,
    linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/.+$/,
  }

  // Verificar si la URL coincide con alguna de las redes sociales permitidas
  return Object.values(allowedSocials).some(pattern => pattern.test(url))
}

const getSocialUsername = url => {
  if (!url) return null

  // Patrones para extraer el username de cada red social
  const patterns = {
    instagram: /instagram\.com\/([^/?]+)/,
    facebook: /facebook\.com\/([^/?]+)/,
    twitter: /x\.com\/([^/?]+)/,
    tiktok: /tiktok\.com\/@([^/?]+)/,
    youtube: /youtube\.com\/([^/?]+)/,
    linkedin: /linkedin\.com\/in\/([^/?]+)/,
  }

  for (const [platform, pattern] of Object.entries(patterns)) {
    const match = url.match(pattern)
    if (match) {
      return {
        platform,
        username: match[1],
      }
    }
  }

  return null
}

const validateSocialUrl = index => {
  const url = socialLinks.value[index]
  if (!url) return

  // Validar formato de red social
  if (!isValidSocialUrl(url)) {
    Swal.fire({
      icon: 'error',
      title: 'URL inválida',
      text: 'Por favor ingresa una URL válida de red social',
      confirmButtonText: 'Entendido',
    })
    socialLinks.value[index] = ''
    return
  }

  // Validar duplicados usando el username
  const currentSocial = getSocialUsername(url)
  if (!currentSocial) return

  const isDuplicate = socialLinks.value.some((link, i) => {
    if (i === index) return false
    const otherSocial = getSocialUsername(link)
    return (
      otherSocial &&
      otherSocial.platform === currentSocial.platform &&
      otherSocial.username === currentSocial.username
    )
  })

  if (isDuplicate) {
    Swal.fire({
      icon: 'error',
      title: 'Cuenta duplicada',
      text: 'Esta cuenta ya ha sido agregada',
      confirmButtonText: 'Entendido',
    })
    socialLinks.value[index] = ''
  }
}

watch(
  socialLinks,
  newValue => {
    const validLinks = newValue.filter(url => !url || isValidSocialUrl(url))
    emit('update:modelValue', validLinks)
  },
  { deep: true }
)

const addSocialLink = () => {
  // Verificar si hay campos vacíos o inválidos
  const hasEmptyOrInvalidLinks = socialLinks.value.some(link => !link || !isValidSocialUrl(link))

  if (hasEmptyOrInvalidLinks) {
    Swal.fire(
      'Error',
      'Por favor, completa el campo actual con una URL válida antes de agregar otro',
      'error'
    )
    return
  }

  // Verificar si hay cuentas duplicadas
  const socialAccounts = socialLinks.value.map(getSocialUsername)
  const hasDuplicates = socialAccounts.some(
    (account, index) =>
      account &&
      socialAccounts.findIndex(
        a => a && a.platform === account.platform && a.username === account.username
      ) !== index
  )

  if (hasDuplicates) {
    Swal.fire({
      icon: 'error',
      title: 'Cuentas duplicadas',
      text: 'Por favor, elimina las cuentas duplicadas antes de agregar otra',
      confirmButtonText: 'Entendido',
    })
    return
  }

  if (socialLinks.value.length >= 10) {
    Swal.fire({
      icon: 'warning',
      title: 'Límite alcanzado',
      text: 'No se pueden agregar más de 10 URLs',
      confirmButtonText: 'Entendido',
    })
    return
  }

  socialLinks.value.push('')
}

const removeSocialLink = index => {
  socialLinks.value.splice(index, 1)
}

onMounted(() => {
  // Si no hay datos iniciales o el array está vacío, inicializar con un campo vacío
  if (!props.modelValue?.length) {
    socialLinks.value = ['']
    emit('update:modelValue', [''])
    return
  }

  // Si hay datos iniciales, validarlos
  const validLinks = props.modelValue.filter(
    link => link && typeof link === 'string' && link.trim() !== '' && isValidSocialUrl(link)
  )

  // Si hay links inválidos, actualizar con los válidos
  if (validLinks.length !== props.modelValue.length) {
    socialLinks.value = validLinks
    emit('update:modelValue', validLinks)
  }
})
</script>
