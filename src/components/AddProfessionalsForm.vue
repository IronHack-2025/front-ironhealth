<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12">
        <v-card class="pa-8" elevation="6" rounded="xl">
          <v-card-title class="text-h5 font-weight-bold text-center mb-4">
            {{ $t('views.professionals.title') }}
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="isValid" lazy-validation>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="form.firstName" :label="$t('common.forms.firstName')"
                    prepend-inner-icon="mdi-account" :rules="[rules.required, rules.acceptedLength]" variant="outlined"
                    maxlength="50" :error-messages="fieldErrors.firstName || []" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="form.lastName" :label="$t('common.forms.lastName')"
                    prepend-inner-icon="mdi-account-details" :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined" maxlength="50" :error-messages="fieldErrors.lastName || []" />
                </v-col>
              </v-row>

              <v-select v-model="selectedProfession" :label="$t('common.forms.profession')"
                prepend-inner-icon="mdi-briefcase" :items="professionsList" item-title="title" item-value="value"
                :rules="[rules.required]" variant="outlined" class="mt-2"
                :error-messages="fieldErrors.profession || []" />

              <v-select v-model="selectedSpecialty" :label="$t('common.forms.specialty')"
                prepend-inner-icon="mdi-stethoscope" :items="specialtiesList" item-title="title" item-value="value"
                variant="outlined" class="mt-2" :error-messages="fieldErrors.specialty || []" />

              <v-text-field v-model="form.email" :label="$t('common.forms.email')" prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email, rules.acceptedLength]" variant="outlined" class="mt-2"
                maxlength="50" :error-messages="fieldErrors.email || []" />

              <v-text-field v-model="form.professionLicenceNumber" :label="$t('common.forms.professionalLicenseNumber')"
                prepend-inner-icon="mdi-card-account-details" variant="outlined" class="mt-2" maxlength="50"
                :error-messages="fieldErrors.professionLicenceNumber || []" />

              <v-btn block color="primary" class="mt-6" size="large" @click="submitForm">
                {{ $t('common.buttons.registerProfessional') }}
              </v-btn>
            </v-form>

            <!-- NEW: alerta estructurada con i18n y detalles de validación -->
            <Alert :show="alert.show" :type="alert.type" :message-code="alert.messageCode" :details="alert.details"
              :message-params="alert.params" :fallback-message="alert.message" class="mt-4" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import Alert from './AlertMessage.vue'
import { post } from '../services/api'
import professionsData from '@/assets/data/professions.json'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const emit = defineEmits(['professional-added'])

const formRef = ref(null)
const isValid = ref(false)
const selectedProfession = ref(null) // code
const selectedSpecialty = ref('Sin especificar') // specialty-code

// Lista de profesiones: muestra text, guarda code
const professionsList = computed(() => {
  return professionsData.professions.map((p) => ({
    title: p.text[locale.value] || p.text.en, // Usar idioma actual o fallback a inglés
    value: p.code,
  }))
})

// Lista de especialidades según profesión seleccionada
const specialtiesList = computed(() => {
  if (!selectedProfession.value) return []
  const professionObj = professionsData.professions.find((p) => p.code === selectedProfession.value)
  if (!professionObj || !professionObj.specialty) return []
  return [
    { title: 'Sin especificar', value: '' },
    ...professionObj.specialty.map((s) => ({
      title: s['specialty-name'][locale.value] || s['specialty-name'].en,
      value: s['specialty-code'],
    })),
  ]
})

watch(selectedProfession, () => {
  selectedSpecialty.value = ''
})

watch(locale, async () => {
  if (formRef.value) {
    // Esperar al siguiente tick para que las traducciones se actualicen
    await nextTick()
    formRef.value.validate()
  }
})

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  profession: '',
  specialty: '',
  professionLicenceNumber: '',
})

// NEW: estado de alerta estructurada
const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  messageCode: 'OPERATION_SUCCESS',
  details: null,     // [{ field?, code, meta? }]
  params: {},        // placeholders para mensaje principal
})

// NEW: errores por campo para :error-messages
const fieldErrors = reactive({})
function clearFieldErrors() {
  for (const k of Object.keys(fieldErrors)) delete fieldErrors[k]
}
function buildFieldErrors(details) {
  clearFieldErrors()
  if (!Array.isArray(details)) return
  details.forEach(d => {
    if (!d.field) return
    (fieldErrors[d.field] ||= []).push(t(`messages.validation.${d.code}`, d.meta || {}))
  })
}

const submitForm = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    alert.show = true
    alert.type = 'error'
    alert.messageCode = 'VALIDATION_FAILED'
    alert.details = null
    alert.params = {}
    alert.message = t('messages.error.VALIDATION_FAILED')
    return
  }

  // NEW: limpiar estado de errores previos
  alert.show = false
  clearFieldErrors()

  // NEW: sanitizar specialty ("Sin especificar" -> '')
  const specialtyToSend = selectedSpecialty.value === 'Sin especificar' ? '' : selectedSpecialty.value

  const formData = {
    firstName: form.firstName,
    lastName: form.lastName,
    profession: selectedProfession.value,
    specialty: specialtyToSend,
    email: form.email,
    // mantener sólo los nombres que espera el backend:
    professionLicenceNumber: form.professionLicenceNumber,
  }

  try {
    const resp = await post('/professionals', formData) // { success, messageCode, data }

    formRef.value.reset()
    emit('professional-added')

    // NEW: éxito con messageCode (i18n en Alert)
    alert.show = true
    alert.type = 'success'
    alert.messageCode = resp?.messageCode || 'OPERATION_SUCCESS'
    alert.details = null
    alert.params = {}
    alert.message = t('messages.success.OPERATION_SUCCESS') // fallback visual
  } catch (error) {
    // NEW: error estructurado
    alert.show = true
    alert.type = 'error'
    alert.messageCode = error.messageCode || 'INTERNAL_SERVER_ERROR'
    alert.details = error.details || null
    alert.params = {}
    alert.message = t(`messages.error.${alert.messageCode}`)

    // NEW: mostrar errores bajo cada input si llegan con field
    buildFieldErrors(error.details)
  }
}

const rules = computed(() => ({
  required: (value) => !!value || t('common.forms.required'),
  email: (value) => {
    if (!value) return t('common.forms.required')
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || t('common.forms.invalidEmail')
  },
  phone: (value) => {
    if (!value) return t('common.forms.required')
    const pattern = /^\+?\d{7,15}$/
    return pattern.test(value) || t('common.forms.invalidPhone')
  },
  acceptedLength: (value) => {
    if (!value) return true
    const lengthMax = 50
    const lengthMin = 3
    return (
      (value.length <= lengthMax && value.length >= lengthMin) ||
      t('common.forms.validLength', { min: lengthMin, max: lengthMax })
    )
  },
}))
</script>
