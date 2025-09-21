<template>
  <v-alert v-if="show && (translatedMessage || validationItems.length)" :type="type" variant="tonal" border="start"
    prominent class="mt-4">

    <!-- Si es un error de validación con múltiples campos -->
    <div v-if="isValidationError && validationItems.length">

      <!-- Usamos validationTitle con fallback a common.messages.error -->
      <div class="font-weight-bold mb-2">{{ validationTitle }}</div>
      <ul class="pl-4">
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

// Props estructurados
const props = defineProps({
  show: { type: Boolean, default: false },
  type: {
    type: String,
    validator: v => ['success', 'error', 'warning', 'info'].includes(v),
    default: 'success'
  },
  // messageCode estructurado (ej: 'PROFESSIONAL_CREATED' o 'VALIDATION_FAILED')
  messageCode: { type: String, default: '' },
  // Compatibilidad con tu versión previa (texto plano)
  message: { type: String, default: '' },
  // detalles de validación [{ field?, code, meta? }, ...]
  details: { type: Array, default: null },
  // params opcionales para el mensaje principal (placeholders)
  messageParams: { type: Object, default: () => ({}) }
})

// ¿Es un error de validación con lista?
const isValidationError = computed(() =>
  props.messageCode === 'VALIDATION_FAILED' && Array.isArray(props.details) && props.details.length > 0
)

// Título de la sección de validación con fallback a common.messages.error
const validationTitle = computed(() => {
  const key = 'messages.error.VALIDATION_FAILED'
  const txt = t(key)
  if (txt !== key) return txt

  const commonKey = 'common.messages.error'
  const common = t(commonKey)
  return common !== commonKey ? common : 'Validation error'
})

// Mensaje principal traducido (success/error) con fallback a common.messages
const translatedMessage = computed(() => {
  // Si tenemos messageCode, intentamos traducirlo: messages.success.CODE o messages.error.CODE
  if (props.messageCode) {
    const key = `messages.${props.type}.${props.messageCode}`
    const msg = t(key, props.messageParams)
    if (msg !== key) return msg

    // Fallback: common.messages.success | common.messages.error
    const commonKey = `common.messages.${props.type === 'error' ? 'error' : 'success'}`
    const commonMsg = t(commonKey)
    if (commonMsg !== commonKey) return commonMsg
  }
  // Fallback final: usa el mensaje plano si lo pasas, o cadena vacía
  return props.message || ''
})

// Convierte details[] a lista de textos traducidos
const validationItems = computed(() => {
  if (!Array.isArray(props.details)) return []
  return props.details.map(detail => {
    const textKey = `messages.validation.${detail.code}`
    const text = t(textKey, detail.meta || {})
    const resolved = (text === textKey) ? detail.code : text

    // Si viene el nombre del campo, añadimos su etiqueta traducida si existe
    if (detail.field) {
      const fieldKey = `messages.fields.${detail.field}`
      const label = t(fieldKey)
      return (label === fieldKey) ? resolved : `${label}: ${resolved}`
    }
    return resolved
  })
})
</script>
