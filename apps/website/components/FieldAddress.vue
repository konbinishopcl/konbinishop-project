<template>
  <div class="field field--address">
    <div class="field--address__header">
      <label class="field--address__title">Dirección (Opcional)</label>
      <p class="field--address__subtitle">Ingresa la dirección del evento</p>
    </div>

    <div class="field--address__fields">
      <!-- Región -->
      <div class="field--address__group">
        <label for="region" class="field--address__label"> Región </label>
        <select
          id="region"
          v-model="address.region"
          class="field--address__select"
          @change="handleRegionChange"
        >
          <option value="" disabled>Selecciona una región</option>
          <option v-for="region in props.regions" :key="region.id" :value="region">
            {{ region.name }}
          </option>
        </select>
      </div>

      <!-- Comuna -->
      <div class="field--address__group">
        <label for="commune" class="field--address__label"> Comuna </label>
        <select
          id="commune"
          v-model="address.commune"
          class="field--address__select"
          :disabled="!address.region"
          @change="handleCommuneChange"
        >
          <option value="" disabled>Selecciona una comuna</option>
          <option v-for="commune in communes" :key="commune.id" :value="commune">
            {{ commune.name }}
          </option>
        </select>
      </div>

      <!-- Dirección -->
      <div class="field--address__group">
        <label for="address" class="field--address__label"> Dirección </label>
        <input
          id="address"
          v-model="address.address"
          type="text"
          class="field--address__input"
          placeholder="Ej: Avenida Providencia"
          :disabled="!address.commune"
        />
      </div>

      <!-- Número de dirección -->
      <div class="field--address__group">
        <label for="address_number" class="field--address__label"> Número </label>
        <input
          id="address_number"
          v-model="address.address_number"
          type="text"
          class="field--address__input"
          placeholder="Ej: 1234"
          :disabled="!address.commune"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: false,
    default: () => ({
      address: '',
      address_number: '',
      region: null,
      commune: null,
    }),
  },
  regions: {
    type: Array,
    required: false,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue'])

// Lista de comunas
const communes = computed(() => {
  if (!address.region) return []
  return address.region.communes || []
})

const address = reactive({ ...props.modelValue })

const handleRegionChange = () => {
  // Limpiar comuna y dirección cuando cambia la región
  address.commune = null
  address.address = ''
  address.address_number = ''
}

const handleCommuneChange = () => {
  // Limpiar dirección cuando cambia la comuna
  address.address = ''
  address.address_number = ''
}

watch(
  address,
  () => {
    emit('update:modelValue', { ...address })
  },
  { deep: true }
)

watch(
  () => props.modelValue,
  newValue => {
    Object.assign(address, newValue)
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.field {
  &--address {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

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
    }

    &__fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    &__group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      &--full {
        grid-column: 1 / -1;
      }

      &__label {
        font-size: 0.875rem;
        color: #a1a1aa;
      }

      &__input,
      &__select {
        width: 100%;
        padding: 0.5rem;
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 0.25rem;
        color: #fff;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>
