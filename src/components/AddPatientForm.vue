<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12">
        <v-card class="pa-8" elevation="6" rounded="xl">
          <!-- Título -->
          <v-card-title class="text-h5 font-weight-bold text-center mb-4">
            {{ $t('views.patients.title') }}
          </v-card-title>

          <v-card-text>
            <v-form ref="formRef" v-model="isValid" lazy-validation>
              <v-row>
                <!-- Nombre -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.firstName"
                    :label="$t('common.forms.firstName')"
                    prepend-inner-icon="mdi-account"
                    :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined"
                    maxlength="50"
                    :error-messages="fieldErrors.firstName || []"
                    @focus="hideAlertOnFocus"
                    @input="hideAlertOnInput"
                  />
                </v-col>

                <!-- Apellidos -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.lastName"
                    :label="$t('common.forms.lastName')"
                    prepend-inner-icon="mdi-account-details"
                    :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined"
                    maxlength="50"
                    :error-messages="fieldErrors.lastName || []"
                    @focus="hideAlertOnFocus"
                    @input="hideAlertOnInput"
                  />
                </v-col>
              </v-row>

              <!-- Email -->
              <v-text-field
                v-model="form.email"
                :label="$t('common.forms.email')"
                prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email]"
                variant="outlined"
                class="mt-2"
                maxlength="50"
                :error-messages="fieldErrors.email || []"
                @focus="hideAlertOnFocus"
                @input="hideAlertOnInput"
              />
              <!-- DNI -->
              <v-text-field
                v-model="form.dni"
                :label="$t('common.forms.dni')"
                prepend-inner-icon="mdi-card-account-details"
                :rules="[rules.required, rules.dni]"
                variant="outlined"
                class="mt-2"
                maxlength="9"
                :error-messages="fieldErrors.dni || []"
                @focus="hideAlertOnFocus"
                @input="hideAlertOnInput"
              />

              <!-- Teléfono -->
              <v-text-field
                v-model="form.phone"
                :label="$t('common.forms.phone')"
                prepend-inner-icon="mdi-phone"
                :rules="[rules.required, rules.phone]"
                variant="outlined"
                class="mt-2"
                maxlength="15"
                :error-messages="fieldErrors.phone || []"
                @focus="hideAlertOnFocus"
                @input="hideAlertOnInput"
              />

              <!-- Fecha de nacimiento -->
              <v-date-input
                v-model="form.birthDate"
                :label="$t('common.forms.dateOfBirth')"
                prepend-inner-icon="mdi-calendar-account-outline"
                prepend-icon=""
                :rules="[rules.required]"
                variant="outlined"
                class="mt-2"
                :error-messages="fieldErrors.birthDate || []"
                @focus="hideAlertOnFocus"
                @update:model-value="hideAlertOnInput"
              />

              <!-- Imagen -->
              <CloudinaryUpload
                ref="cloudinaryRef"
                folder="patients"
                :buttonText="$t('common.buttons.uploadImage')"
                :api-url="`${apiBaseUrl}/signature`"
                @uploaded="form.imageUrl = $event"
                @cleared="form.imageUrl = ''"
                block
              />

              <!-- Botón -->
              <v-btn block color="primary" class="mt-6" size="large" @click="newPatient">
                {{ btnTitle }}
              </v-btn>
            </v-form>

            <!-- Alerta -->
            <AlertMessage
              class="mt-4"
              :show="alert.show"
              :type="alert.type"
              :message-code="alert.messageCode"
              :details="alert.details"
              :message-params="alert.params"
              :message="alert.message"
              @field-errors-updated="updateFieldErrors"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AlertMessage from './AlertMessage.vue'
import CloudinaryUpload from './CloudinaryUpload.vue'
import { post, put } from '@/services/api.js'

const { t } = useI18n()
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const cloudinaryRef = ref(null)
const props = defineProps({
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
  items: { type: Object, default: null },
  btnTitle: { type: String, default: '' },
})
const emit = defineEmits(['patient-added', 'patient-updated'])
const formRef = ref(null)
const isValid = ref(false)
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  dni: '',
  imageUrl: '',
})
const alert = reactive({
  show: false,
  type: 'success',
  message: '',
  messageCode: 'OPERATION_SUCCESS',
  details: null,
  params: {},
})
const fieldErrors = reactive({})

function clearFieldErrors() {
  for (const k of Object.keys(fieldErrors)) delete fieldErrors[k]
}

function updateFieldErrors(errors) {
  clearFieldErrors()
  Object.assign(fieldErrors, errors)
}

const rules = {
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
  // Agregar validación de DNI para Vuetify
  dni: (value) => {
    if (!value) return t('common.forms.required')
    const pattern = /^\d{7,8}[A-Za-z]$/i
    return pattern.test(value) || t('common.forms.invalidDNI')
  },

  acceptedLength: (value) => {
    if (!value) return true
    const min = 3,
      max = 50
    return (
      (value.length >= min && value.length <= max) || t('common.forms.validLength', { min, max })
    )
  },
}

// *** Alertas ***
const hideAlertOnFocus = () => {
  if (alert.show && alert.type === 'error') {
    alert.show = false
    clearFieldErrors()
  }
}
const hideAlertOnInput = hideAlertOnFocus

// *** Cargar datos ***
function loadPatientData() {
  if (props.mode === 'edit' && props.items) {
    form.firstName = props.items.firstName || ''
    form.lastName = props.items.lastName || ''
    form.email = props.items.email || ''
    form.phone = props.items.phone || ''
    form.dni = props.items.dni || ''
    form.birthDate = props.items.birthDate ? new Date(props.items.birthDate) : ''
    form.imageUrl = props.items.imageUrl || ''
  } else {
    resetForm()
  }
}

function resetForm() {
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.phone = ''
  form.dni = ''
  form.birthDate = ''
  form.imageUrl = ''
  clearFieldErrors()
  alert.show = false
  cloudinaryRef.value?.clearImage()
}

watch(() => props.items, loadPatientData, { immediate: true })
watch(() => props.mode, loadPatientData)

async function newPatient() {
  const { valid } = await formRef.value.validate()
  if (!valid) return showValidationErrors()

  alert.show = false
  clearFieldErrors()

  const formData = {
    ...form,
    birthDate:
      form.birthDate instanceof Date ? form.birthDate.toISOString().split('T')[0] : form.birthDate,
  }

  try {
    let response
    if (props.mode === 'create') {
      response = await post(`/patients`, formData)
    } else {
      response = await put(`/patients/${props.items.id}/edit`, formData)
    }

    if (props.mode === 'create') {
      formRef.value.reset()
      cloudinaryRef.value?.clearImage()
      emit('patient-added', response)
    } else {
      emit('patient-updated', response)
    }

    showSuccess(response)
  } catch (error) {
    showError(error)
  } finally {
    setTimeout(() => (alert.show = false), 3000)
  }
}

function showSuccess(response) {
  alert.show = true
  alert.type = 'success'
  alert.messageCode = response?.messageCode || 'OPERATION_SUCCESS'
  alert.message = '' // Dejar vacío para que AlertMessage use messageCode
  alert.details = response?.details || null
  alert.params = response?.params || {}
}
function showError(error) {
  console.error('Error saving professional:', error)
  alert.show = true
  alert.type = 'error'
  // Usar el messageCode del error si existe, sino usar uno por defecto
  alert.messageCode = error?.messageCode || error?.response?.data?.messageCode || 'INTERNAL_SERVER_ERROR'
  alert.message = '' // Dejar vacío para que AlertMessage use messageCode
  alert.details = error?.details || error?.response?.data?.details || null
  alert.params = error?.params || error?.response?.data?.params || {}
}
function showValidationErrors() {
  alert.show = true
  alert.type = 'error'
  alert.messageCode = 'VALIDATION_FAILED'
  alert.message = '' // Dejar vacío para que AlertMessage use messageCode
  alert.details = null
  alert.params = {}
}</script>
