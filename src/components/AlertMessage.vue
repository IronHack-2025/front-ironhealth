<template>
  <v-alert v-if="show" :type="type" variant="tonal" border="start" prominent class="mt-4">
    <!-- <div v-if="visible" :class="alertClasses"> -->
    <!-- Si es un error de validación con múltiples campos -->
    <!--<div v-if="isValidationError && validationDetails">-->
    <!--<div class="alert-title">{{ $t('messages.error.VALIDATION_FAILED') }}</div>
      <ul class="validation-errors">
        <li v-for="(detail, index) in validationDetails" :key="index">
          {{ getValidationMessage(detail) }}
        </li>
      </ul>
    </div> -->  
    {{ translatedMessage }}
  </v-alert>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
defineProps({
  show: Boolean,
  type: {
    type: String,
    required: true,
    validator: (value) => ['success', 'error'].includes(value),
    default: 'success', // 'success' or 'error'
  },
  messageCode: {
    type: String,
    default: '',
      required: true
    },
    fallbackMessage: {
      type: String,
      default: ''
    }
})
const translatedMessage = computed(() => {
  const translation = t(`alerts.${messageCode}`)
  return translation !== `alerts.${messageCode}` ? translation : fallbackMessage
  
})
</script>
