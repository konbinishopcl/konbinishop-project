<template>
  <div class="field field--password">
    <div class="field--password__fields">
      <!-- Password -->
      <div class="field--password__group">
        <label for="password" class="field--password__label">Contraseña</label>
        <div class="field--password__input-group">
          <Field
            v-model="password"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            class="field--password__input"
            placeholder="Introduce tu contraseña"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="field--password__toggle"
            @click="showPassword = !showPassword"
          >
            <Eye v-if="!showPassword" class="icon" />
            <EyeOff v-else class="icon" />
          </button>
        </div>
        <ErrorMessage name="password" class="field--password__error" />
      </div>

      <!-- Repeat Password -->
      <div v-if="showRepeat" class="field--password__group">
        <label for="repeat_password" class="field--password__label">Repetir contraseña</label>
        <div class="field--password__input-group">
          <Field
            v-model="repeatPassword"
            name="repeat_password"
            :type="showPassword ? 'text' : 'password'"
            class="field--password__input"
            placeholder="Repite tu contraseña"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="field--password__toggle"
            @click="showPassword = !showPassword"
          >
            <Eye v-if="!showPassword" class="icon" />
            <EyeOff v-else class="icon" />
          </button>
        </div>
        <ErrorMessage name="repeat_password" class="field--password__error" />
      </div>
    </div>

    <p v-if="error" class="field--password__error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'
import { Field, ErrorMessage } from 'vee-validate'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  showRepeat: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const password = ref(props.modelValue)
const repeatPassword = ref('')
const showPassword = ref(false)
const error = ref('')

watch([password, repeatPassword], ([newPassword, newRepeatPassword]) => {
  if (props.showRepeat && newPassword !== newRepeatPassword) {
    error.value = 'Las contraseñas no coinciden'
  } else {
    error.value = ''
    emit('update:modelValue', newPassword)
  }
})

watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== password.value) {
      password.value = newValue
    }
  }
)
</script>

<style lang="scss" scoped>
.field {
  &--password {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__fields {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    &__group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    &__input-group {
      position: relative;
      display: flex;
    }

    &__input {
      flex: 1;
      padding: 0.5rem;
      padding-right: 2.5rem;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 0.25rem;
      color: #fff;
    }

    &__toggle {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #a1a1aa;
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: #fff;
      }

      .icon {
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    &__error {
      color: #ef4444;
      font-size: 0.875rem;
      margin: 0;
    }
  }
}
</style>
