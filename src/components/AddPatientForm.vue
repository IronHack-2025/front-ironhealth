<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12">
        <v-card class="pa-8" elevation="6" rounded="xl">
          <v-card-title class="text-h5 font-weight-bold text-center mb-4">
            {{$t('views.patients.title')}}
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="isValid" lazy-validation>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.firstName"
                    :label="$t('common.forms.firstName')"
                    prepend-inner-icon="mdi-account"
                    :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined"
                    maxlength="50"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.lastName"
                    :label="$t('common.forms.lastName')"
                    prepend-inner-icon="mdi-account-details"
                    :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined"
                    maxlength="50"
                  />
                </v-col>
              </v-row>
              <v-text-field
                v-model="form.email"
                :label="$t('common.forms.email')"
                prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email]"
                variant="outlined"
                class="mt-2"
                maxlength="50"
              />

              <v-text-field
                v-model="form.phone"
                :label="$t('common.forms.phone')"
                prepend-inner-icon="mdi-phone"
                :rules="[rules.required, rules.phone]"
                variant="outlined"
                class="mt-2"
                maxlength="9"
              />

              <v-date-input
                v-model="form.birthDate"
                :label="$t('common.forms.dateOfBirth')"
                prepend-inner-icon="mdi-calendar-account-outline"
                prepend-icon=""
                :rules="[rules.required]"
                variant="outlined"
                class="mt-2"
              />
              <v-btn
                block
                color="primary"
                class="mt-6"
                size="large"
                @click="newPatient"
                cursor="pointer"
              >
              {{$t('common.buttons.registerPatient')}}
              </v-btn>
            </v-form>

            <Alert 
              :show="alert.show" 
              :type="alert.type" 
              :messageCode="alert.messageCode" 
              :details="alert.details"
              :fallbackMessage="alert.fallbackMessage" 
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Alert from './AlertMessage.vue'
import { post } from '../services/api'

const { t, locale } = useI18n()
const emit = defineEmits(['patient-added'])

const formRef = ref(null)
const isValid = ref(false)

watch(locale, async () => {
  if (formRef.value) {
    // Esperar al siguiente tick para que las traducciones se actualicen
    await nextTick()
    formRef.value.validate()
  }
})

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

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  birthDate: '',
})

const alert = reactive({
  show: false,
  type: 'success',
  messageCode: '',
  details: null,
  fallbackMessage: ''
})

const resetAlert = () => {
  alert.show = false
  alert.type = 'success'
  alert.messageCode = ''
  alert.details = null
  alert.fallbackMessage = ''
}

const showAlert = (type, messageCode, details = null, fallbackMessage = '') => {
  alert.show = true
  alert.type = type
  alert.messageCode = messageCode
  alert.details = details
  alert.fallbackMessage = fallbackMessage
}

const newPatient = async () => {
    resetAlert()
  
  const { valid } = await formRef.value.validate()
  if (!valid) {
    showAlert('error', 'FORM_VALIDATION_FAILED', null, 'Please check the form fields')
    return
  }

  const formData = {
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    phone: form.phone,
    birthDate: form.birthDate,
  }

  try {
  const response = await post('/patients', formData)
    console.log('Response from backend:', response)

    formRef.value.reset()
    emit('patient-added')

    showAlert('success', response.data.messageCode || 'PATIENT_CREATED',
      null,
      'Patient created successfully')
  } catch (error) {
    console.error('Error creating patient:', error)
    console.error('Error details:', {
      messageCode: error.messageCode,
      messageType: error.messageType,
      details: error.details,
      message: error.message,
      stack: error.stack
    })
    
    // Verificar si el error tiene las propiedades esperadas
    const errorMessageCode = error?.messageCode || 'INTERNAL_SERVER_ERROR'
    const errorDetails = error?.details || null
    const errorMessage = error?.message || 'An error occurred while creating the patient'
    
    // Mostrar mensaje de error
    showAlert(
      'error',
      errorMessageCode,
      errorDetails,
      errorMessage
    )
  }
}
</script>