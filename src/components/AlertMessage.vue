<template>
  <v-alert 
    v-if="show" 
    :type="type" 
    variant="tonal" 
    border="start" 
    prominent 
    class="mt-4"
  >
    <!-- Si es un error de validación con múltiples campos -->
    <div v-if="isValidationError && details">
      <div class="font-weight-bold mb-2">{{ $t('messages.error.VALIDATION_FAILED') }}</div>
      <ul class="pl-4">
        <li v-for="(detail, index) in details" :key="index" class="text-body-2">
          {{ getValidationMessage(detail) }}
        </li>
      </ul>
    </div>
    
    <!-- Mensaje simple -->
    <div v-else>
      {{ translatedMessage }}
    </div>
  </v-alert>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value),
    default: 'success'
  },
  messageCode: {
    type: String,
    required: true,
    default: ''
  },
  fallbackMessage: {
    type: String,
    default: ''
  },
  details: {
    type: Array,
    default: null
  }
})

const isValidationError = computed(() => {
  return props.messageCode === 'VALIDATION_FAILED' && props.details && props.details.length > 0
})

const translatedMessage = computed(() => {
  // Buscar en la estructura correcta: messages.success.CODE o messages.error.CODE
  const messageKey = `messages.${props.type}.${props.messageCode}`
  const translation = t(messageKey)
  
  // Si no existe la traducción, usar fallback o el código
  if (translation === messageKey) {
    return props.fallbackMessage || props.messageCode
  }
  
  return translation
})

const getValidationMessage = (detail) => {
  const validationKey = `messages.validation.${detail.code}`
  const translation = t(validationKey)
  
  if (translation === validationKey) {
    return detail.code
  }
  
  return translation
}
</script>
