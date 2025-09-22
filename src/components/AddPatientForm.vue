<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12">
        <v-card class="pa-8" elevation="6" rounded="xl">
          <v-card-title class="text-h5 font-weight-bold text-center mb-4">
            {{ $t('views.patients.title') }}
          </v-card-title>

          <v-card-text>
            <v-form ref="formRef" v-model="isValid" lazy-validation>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="form.firstName" :label="$t('common.forms.firstName')"
                    prepend-inner-icon="mdi-account" :rules="[rules.required, rules.acceptedLength]" variant="outlined"
                    maxlength="50" :error-messages="fieldErrors.firstName || []" 
                    @focus="hideAlertOnFocus" @input="hideAlertOnInput" />
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field v-model="form.lastName" :label="$t('common.forms.lastName')"
                    prepend-inner-icon="mdi-account-details" :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined" maxlength="50" :error-messages="fieldErrors.lastName || []" 
                    @focus="hideAlertOnFocus" @input="hideAlertOnInput" />
                </v-col>
              </v-row>

              <v-text-field v-model="form.email" :label="$t('common.forms.email')" prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email]" variant="outlined" class="mt-2" maxlength="50"
                :error-messages="fieldErrors.email || []" 
                @focus="hideAlertOnFocus" @input="hideAlertOnInput" />

              <v-text-field v-model="form.phone" :label="$t('common.forms.phone')" prepend-inner-icon="mdi-phone"
                :rules="[rules.required, rules.phone]" variant="outlined" class="mt-2" maxlength="15"
                :error-messages="fieldErrors.phone || []" 
                @focus="hideAlertOnFocus" @input="hideAlertOnInput" />

              <!-- NOTA: usar el componente de fecha registrado (Vuetify Labs) -->
              <v-date-input v-model="form.birthDate" :label="$t('common.forms.dateOfBirth')"
                prepend-inner-icon="mdi-calendar-account-outline" prepend-icon="" :rules="[rules.required]"
                variant="outlined" class="mt-2" :error-messages="fieldErrors.birthDate || []" 
                @focus="hideAlertOnFocus" @update:model-value="hideAlertOnInput" />
              <CloudinaryUpload
               ref="cloudinaryRef" 
                :preset="uploadPreset"
                folder="patients"
                buttonText="$t('common.buttons.uploadImage')"
                :api-url="`${apiBaseUrl}/signature`"
                @uploaded="form.imageUrl = $event"
                @cleared="form.imageUrl = ''"
                block
              />
              <v-btn block color="primary" class="mt-6" size="large" @click="newPatient">
                {{ $t('common.buttons.registerPatient') }}
              </v-btn>
            </v-form>

            <!-- Alerta estructurada alineada con el backend -->
            <Alert class="mt-4" :show="alert.show" :type="alert.type" :message-code="alert.messageCode"
              :details="alert.details" :message-params="alert.params" :message="alert.message" 
              @field-errors-updated="updateFieldErrors" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Alert from './AlertMessage.vue'
import { post } from '@/services/api'
import CloudinaryUpload from './CloudinaryUpload.vue'
const cloudinaryRef = ref(null)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const { t } = useI18n()
const emit = defineEmits(['patient-added'])

const formRef = ref(null)
const isValid = ref(false)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
  imageUrl: '',
})
const alert = reactive({
  show: false,
  type: 'success',                 // 'success' | 'error' | ...
  message: '',                     // fallback (texto plano)
  messageCode: 'OPERATION_SUCCESS',
  details: null,                   // [{ field?, code, meta? }]
  params: {}                       // placeholders opcionales
})

// Errores por campo para :error-messages
const fieldErrors = reactive({})
function clearFieldErrors() {
  for (const k of Object.keys(fieldErrors)) delete fieldErrors[k]
}

// Recibir fieldErrors del componente Alert
const updateFieldErrors = (errors) => {
  // Limpiar errores anteriores
  clearFieldErrors()
  // Asignar nuevos errores
  Object.assign(fieldErrors, errors)
}

// Función para ocultar alerta cuando el usuario interactúa
const hideAlertOnFocus = () => {
  if (alert.show && alert.type === 'error') {
    alert.show = false
    clearFieldErrors()
  }
}

const hideAlertOnInput = () => {
  if (alert.show && alert.type === 'error') {
    alert.show = false
    clearFieldErrors()
  }
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
  acceptedLength: (value) => {
    if (!value) return true
    const lengthMax = 50
    const lengthMin = 3
    return (
      (value.length <= lengthMax && value.length >= lengthMin) ||
      t('common.forms.validLength', { min: lengthMin, max: lengthMax })
    )
  },
}

const newPatient = async () => {
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

    // Email
    if (!form.email) {
      details.push({ field: 'email', code: 'FORM_FIELDS_REQUIRED' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      details.push({ field: 'email', code: 'EMAIL_INVALID_FORMAT' })
    }

    // Teléfono
    if (!form.phone) {
      details.push({ field: 'phone', code: 'FORM_FIELDS_REQUIRED' })
    } else if (!/^\+?\d{7,15}$/.test(form.phone)) {
      details.push({ field: 'phone', code: 'PHONE_INVALID_FORMAT' })
    }

    // Fecha de nacimiento
    if (!form.birthDate) {
      details.push({ field: 'birthDate', code: 'FORM_FIELDS_REQUIRED' })
    } else if (isNaN(new Date(form.birthDate).getTime())) {
      details.push({ field: 'birthDate', code: 'BIRTHDATE_INVALID' })
    }

    alert.show = true
    alert.type = 'error'
    alert.messageCode = 'VALIDATION_FAILED'
    alert.details = details
    alert.params = {}
    alert.message = t('messages.error.VALIDATION_FAILED')

    return
  }

  alert.show = false
  clearFieldErrors()

  console.log(form.imageUrl)
  
  try {
    const resp = await post('/patients', { ...form }) // { success, messageCode, data }
    formRef.value.reset()
    cloudinaryRef.value?.clearImage()
    emit('patient-added')

    // Éxito
    alert.show = true
    alert.type = 'success'
    alert.messageCode = resp?.messageCode || 'PATIENT_CREATED'
    alert.details = null
    alert.params = {}
    alert.message = t('common.messages.success') // fallback
  } catch (e) {
    // Error (validación o servidor)
    alert.show = true
    alert.type = 'error'
    alert.messageCode = e.messageCode || 'INTERNAL_SERVER_ERROR'
    alert.details = e.details || null
    alert.params = {}
    alert.message = t('common.messages.error')
  }
}

onMounted(() => {
  if (!window.cloudinary) {
    const script = document.createElement('script')
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
    script.async = true
    script.onload = () => {
      initWidget()
    }
    document.head.appendChild(script)
  } else {
    initWidget()
  }
})

function initWidget() {
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  const myWidget = window.cloudinary.createUploadWidget(
    {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
    },
    (error, result) => {
      if (!error && result && result.event === 'success') {
        imageUrl.value = result.info.secure_url
        form.imageUrl = result.info.secure_url // <-- Cambia aquí a imageUrl
        console.log('Imagen subida:', result.info)
      }
    },
  )
}

function openCloudinaryWidget() {
  if (myWidget) {
    myWidget.open()
  }
}
</script>
