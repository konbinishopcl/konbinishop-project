<template>
  <div class="cart cart--default">
    <h2 class="cart__title">Pagar Publicación</h2>

    <div class="cart__alert">
      <div class="cart__alert-icon">
        <i class="cart__alert-i">i</i>
      </div>
      <p class="cart__alert-text">
        Estás realizando el pago de una publicación. Una vez completado, pasará a una etapa de
        revisión de 24 horas para verificar el cumplimiento de las
        <a href="#" class="cart__alert-link">Políticas de KonbiniShop</a>.
      </p>
    </div>

    <div class="cart__summary">
      <div class="cart__item">
        <span class="cart__item-name">1 Evento</span>
        <span class="cart__item-price">$59.000 IVA incluido</span>
      </div>
    </div>

    <div class="cart__invoice">
      <label class="cart__invoice-label">
        <input v-model="needsInvoice" type="checkbox" class="cart__invoice-checkbox" />
        <span class="cart__invoice-text">Represento a Empresa y necesito factura.</span>
      </label>
      <p v-if="needsInvoice" class="cart__invoice-description">
        Te pediremos los datos necesarios para emitirla después de verificación de 24 horas.
      </p>
    </div>

    <button class="cart__submit" @click="handlePayment">Confirmar y Pagar $59.000</button>

    <!-- <p class="cart__payment-method">Pagarás usando Flow</p>
    
    <div class="cart__payment-logos">
      <img src="@/assets/images/webpay.svg" alt="Webpay" class="cart__payment-logo">
      <img src="@/assets/images/onepay.svg" alt="Onepay" class="cart__payment-logo">
      <img src="@/assets/images/khipu.svg" alt="Khipu" class="cart__payment-logo">
      <img src="@/assets/images/mach.svg" alt="MACH" class="cart__payment-logo">
    </div> -->
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCreateStore } from '@/stores/create.store'
import { useEventStore } from '@/stores/event.store'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const needsInvoice = ref(false)
const createStore = useCreateStore()
const eventStore = useEventStore()
const router = useRouter()

const prepareEventData = () => {
  const form = createStore.form
  const timestamp = Date.now()
  return {
    data: {
      title: form.title,
      slug: `${form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${timestamp}`,
      company: form.company,
      category: form.category?.id || null,
      description: form.description,
      about: form.about,
      isFree: form.prices.isFree,
      prices: form.prices.isFree
        ? []
        : form.prices.prices.map(price => ({
            name: price.name,
            price: Number(price.value),
          })),
      dates: form.dates.map(date => ({
        date: date.date,
        start_time: `${date.startTime}:00.000`,
        end_time: `${date.endTime}:00.000`,
      })),
      address: form.address.address,
      address_number: form.address.address_number,
      commune: form.address.commune?.id || null,
      region: form.address.region?.id || null,
      ticket_url: form.ticket_url,
      socialLinks: form.socialLinks.map(link => ({
        link: link,
      })),
      banner: form.banner?.id || null,
      poster: form.poster?.id || null,
      gallery: form.gallery.map(img => img.id),
      videos: form.videos.map(video => ({
        link: video,
      })),
    },
  }
}

const handlePayment = async () => {
  try {
    const eventData = prepareEventData()
    await eventStore.saveEvent(eventData)
    createStore.resetForm()
    router.push('/anuncios/gracias')
  } catch (error) {
    console.error('Error al guardar el evento:', error)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un problema al guardar el evento. Por favor, intenta nuevamente.',
      confirmButtonText: 'Entendido',
    })
  }
}
</script>

<style lang="scss" scoped>
.cart {
  &--default {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    color: #000;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  &__alert {
    background: #f5f5f5;
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;

    &-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #000;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-style: italic;
      font-size: 0.875rem;
    }

    &-text {
      font-size: 0.875rem;
      line-height: 1.4;
    }

    &-link {
      color: inherit;
      text-decoration: underline;
    }
  }

  &__summary {
    margin-bottom: 1.5rem;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &-name {
      font-weight: 500;
    }

    &-price {
      font-weight: 600;
    }
  }

  &__invoice {
    margin-bottom: 2rem;

    &-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    &-description {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: #666;
    }
  }

  &__submit {
    width: 100%;
    background: #000;
    color: white;
    border: none;
    border-radius: 0.5rem;
    padding: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 1rem;

    &:hover {
      background: #333;
    }
  }

  &__payment-method {
    text-align: center;
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 1rem;
  }

  &__payment-logos {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  &__payment-logo {
    height: 24px;
    object-fit: contain;
  }
}
</style>
