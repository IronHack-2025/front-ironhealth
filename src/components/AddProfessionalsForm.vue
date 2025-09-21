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

              <!-- PROFESIÓN -->
              <v-select v-model="selectedProfession" :label="$t('common.forms.profession')"
                prepend-inner-icon="mdi-briefcase" :items="professionsList" item-title="title" item-value="value"
                :rules="[rules.required]" variant="outlined" class="mt-2"
                :error-messages="fieldErrors.profession || []" />

              <!-- ESPECIALIDAD -->
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

            <!-- Alerta estructurada -->
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
const selectedProfession = ref(null)            // code
const selectedSpecialty = ref('')              // FIX: usar el VALUE '', no la etiqueta "Sin especificar"

// Helper robusto para i18n: admite string o objeto por idioma
const getText = (val) => {
  // Si ya es string, ok
  if (typeof val === 'string') return val
  // Si es objeto, probamos el idioma actual -> en -> primer valor
  if (val && typeof val === 'object') {
    return val[locale.value] || val.en || Object.values(val)[0] || ''
  }
  return ''
}

// Lista de profesiones: muestra text, guarda code
const professionsList = computed(() => {
  return professionsData.professions.map((p) => ({
    title: getText(p.text),  // FIX: evita [object Object] cuando p.text es {es,en}
    value: p.code,
  }))
})

// Lista de especialidades según profesión seleccionada
const specialtiesList = computed(() => {
  if (!selectedProfession.value) return []
  const professionObj = professionsData.professions.find((p) => p.code === selectedProfession.value)
  if (!professionObj || !professionObj.specialty) return []
  return [
    { title: 'Sin especificar', value: '' }, // value siempre '', la UI muestra etiqueta
    ...professionObj.specialty.map((s) => ({
      title: getText(s['specialty-name']),   // FIX: idem para specialty-name
      value: s['specialty-code'],
    })),
  ]
})

watch(selectedProfession, () => {
  // Al cambiar la profesión, resetea el value (no la etiqueta)
  selectedSpecialty.value = ''                // FIX coherente con value
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

const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  messageCode: 'OPERATION_SUCCESS',
  details: null, // [{ field?, code, meta? }]
  params: {},
})

// Errores por campo para enganchar a :error-messages
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

    // Construimos la lista de errores para la alerta (además de las reglas de Vuetify)
    const details = []

    // Nombre
    if (!form.firstName) {
      details.push({ field: 'firstName', code: 'FORM_FIELDS_REQUIRED' })
    } else if (form.firstName.length < 3 || form.firstName.length > 50) {
      details.push({ field: 'firstName', code: 'NAME_MIN_LENGTH', meta: { min: 3, max: 50 } })
    }

    // Apellidos
    if (!form.lastName) {
      details.push({ field: 'lastName', code: 'FORM_FIELDS_REQUIRED' })
    } else if (form.lastName.length < 3 || form.lastName.length > 50) {
      details.push({ field: 'lastName', code: 'NAME_MIN_LENGTH', meta: { min: 3, max: 50 } })
    }

    // Profesión (select requerido)
    if (!selectedProfession.value) {
      details.push({ field: 'profession', code: 'FORM_FIELDS_REQUIRED' })
    }

    // Email
    if (!form.email) {
      details.push({ field: 'email', code: 'FORM_FIELDS_REQUIRED' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      details.push({ field: 'email', code: 'EMAIL_INVALID_FORMAT' })
    }

    // Nº licencia (opcional) – validación simple si hay valor
    if (form.professionLicenceNumber && !/^[a-zA-Z0-9]+$/.test(form.professionLicenceNumber)) {
      details.push({ field: 'professionLicenceNumber', code: 'NAME_INVALID_CHARACTERS' })
    }

    // Mostrar alerta con lista + pintar errores bajo cada input
    alert.show = true
    alert.type = 'error'
    alert.messageCode = 'VALIDATION_FAILED'
    alert.details = details
    alert.params = {}
    alert.message = t('messages.error.VALIDATION_FAILED')

    buildFieldErrors(details) // alimenta :error-messages

    return
  }


  // limpiar estado previo de errores
  alert.show = false
  clearFieldErrors()

  // FIX: specialty value seguro (sin depender de la etiqueta)
  const specialtyToSend = selectedSpecialty.value || ''

  const formData = {
    firstName: form.firstName,
    lastName: form.lastName,
    profession: selectedProfession.value,
    specialty: specialtyToSend,
    email: form.email,
    professionLicenceNumber: form.professionLicenceNumber,
  }

  try {
    const resp = await post('/professionals', formData)
    formRef.value.reset()
    emit('professional-added')

    // ÉXITO: mostrar alerta traducida por messageCode
    alert.show = true
    alert.type = 'success'
    alert.messageCode = resp?.messageCode || 'OPERATION_SUCCESS'
    alert.details = null
    alert.params = {}
    alert.message = t('messages.success.OPERATION_SUCCESS') // fallback
  } catch (error) {
    // ERROR (validación / servidor)
    alert.show = true
    alert.type = 'error'
    alert.messageCode = error.messageCode || 'INTERNAL_SERVER_ERROR'
    alert.details = error.details || null
    alert.params = {}
    alert.message = t(`messages.error.${alert.messageCode}`)

    // Pintar errores bajo cada input si vienen con field
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
