<template>
  <div class="card card--map">
    <div class="card--map__header">
      <MapPin class="card--map__icon" />
      <span class="card--map__title">Ubicación</span>
    </div>
    <div class="card--map__content">
      <h3 class="card--map__location">{{ locationName }}</h3>
      <p class="card--map__address">{{ fullAddress }}</p>
      <div class="card--map__iframe">
        <iframe
          :src="mapUrl"
          width="100%"
          height="200"
          style="border: 0"
          allowfullscreen=""
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
      <div class="card--map__buttons">
        <a :href="wazeUrl" target="_blank" rel="noopener noreferrer" class="button button--map">
          <font-awesome-icon :icon="['fab', 'waze']" class="button--map-icon" />
          <span>Ver en Waze</span>
        </a>
        <a
          :href="googleMapsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="button button--map"
        >
          <font-awesome-icon :icon="['fab', 'google']" class="button--map-icon" />
          <span>Ver en Google Maps</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MapPin } from 'lucide-vue-next'

interface Commune {
  name: string
  slug: string
}

interface Region {
  name: string
  slug: string
}

interface Props {
  locationName?: string
  address?: string
  addressNumber?: string
  commune?: Commune
  region?: Region
}

const props = defineProps<Props>()

const fullAddress = computed(() => {
  const parts = []
  if (props.address) parts.push(props.address)
  if (props.addressNumber) parts.push(`n.º ${props.addressNumber}`)
  if (props.commune?.name) parts.push(props.commune.name)
  if (props.region?.name) parts.push(props.region.name)
  return parts.join(', ')
})

const mapUrl = computed(() => {
  const address = encodeURIComponent(fullAddress.value)
  return `https://maps.google.com/maps?q=${address}&t=&z=13&ie=UTF8&iwloc=A&output=embed`
})

const wazeUrl = computed(() => {
  const address = encodeURIComponent(fullAddress.value)
  return `https://waze.com/ul?q=${address}`
})

const googleMapsUrl = computed(() => {
  const address = encodeURIComponent(fullAddress.value)
  return `https://www.google.com/maps/search/?api=1&query=${address}`
})
</script>
