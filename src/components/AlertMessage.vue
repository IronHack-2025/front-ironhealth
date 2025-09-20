<template>
  <v-alert v-if="show" :type="type" variant="tonal" border="start" prominent class="mt-4">
    <!-- Si es un error de validación con múltiples campos -->
    <div v-if="isValidationError && details">
      <div class="font-weight-bold mb-2">{{ $t('messages.error.VALIDATION_FAILED') }}</div>
      <ul class="pl-4">
        <!-- ⬅️ usamos validationItems, ya viene traducido e interpolado -->
        <li v-for="(msg, index) in validationItems" :key="index" class="text-body-2">
          {{ msg }}
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

const FIELD_I18N_KEYS = {
  // backend -> i18n (en.json usa "professionalLicenseNumber")
  professionLicenceNumber: 'professionalLicenseNumber',
  birthDate: 'dateOfBirth',
}

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
  },
  // Parámetros opcionales para mensaje principal (placeholders)
  messageParams: {
    type: Object,
    default: () => ({})
  }
})

const isValidationError = computed(() => {
  return props.messageCode === 'VALIDATION_FAILED' && props.details && props.details.length > 0
})

const translatedMessage = computed(() => {
  // Buscar en la estructura correcta: messages.success.CODE o messages.error.CODE
  const messageKey = `messages.${props.type}.${props.messageCode}`
  const translation = t(messageKey, props.messageParams) // ⬅️ añadido: interpolación

  // Si no existe la traducción, usar fallback o el código
  if (translation === messageKey) {
    return props.fallbackMessage || props.messageCode
  }

  return translation
})

// Lista de mensajes de validación ya traducidos
const validationItems = computed(() => {
  if (!props.details?.length) return []
  return props.details.map(detail => getValidationMessage(detail))
})

const getValidationMessage = (detail) => {
  // Traducción del texto del error (con meta para placeholders)
  const validationKey = `messages.validation.${detail.code}`
  const msg = t(validationKey, detail.meta || {})

  // Si falta traducción, devolvemos el code
  const resolvedMsg = (msg === validationKey) ? detail.code : msg

  // Si llega el campo, intentamos anteponer su etiqueta traducida
  if (detail.field) {
    // 1) Intentar en common.forms con posible mapeo de nombre del back a la clave del i18n
    const formsKey = `common.forms.${FIELD_I18N_KEYS[detail.field] || detail.field}`
    const formsLabel = t(formsKey)
    if (formsLabel !== formsKey) {
      return `${formsLabel}: ${resolvedMsg}`
    }

    // 2) Fallback opcional a messages.fields (por si en el futuro añadís esa sección)
    const fieldKey = `messages.fields.${detail.field}`
    const fieldLabel = t(fieldKey)
    if (fieldLabel !== fieldKey) {
      return `${fieldLabel}: ${resolvedMsg}`
    }
  }

  return resolvedMsg // ⬅️ Añadido para manejar el caso en que no haya campo
}
</script>
