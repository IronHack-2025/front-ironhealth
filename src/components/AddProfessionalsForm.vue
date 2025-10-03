<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12">
        <v-card class="pa-8" elevation="6" rounded="xl">
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

              <!-- Profesión -->
              <v-select
                v-model="selectedProfession"
                :label="$t('common.forms.profession')"
                prepend-inner-icon="mdi-briefcase"
                :items="professionsList"
                item-title="title"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                class="mt-2"
                :error-messages="fieldErrors.profession || []"
                @focus="hideAlertOnFocus"
                @update:model-value="hideAlertOnInput"
              />

              <!-- Especialidad -->
              <v-select
                v-model="selectedSpecialty"
                :label="$t('common.forms.specialty')"
                prepend-inner-icon="mdi-stethoscope"
                :items="specialtiesList"
                item-title="title"
                item-value="value"
                variant="outlined"
                class="mt-2"
                :error-messages="fieldErrors.specialty || []"
                @focus="hideAlertOnFocus"
                @update:model-value="hideAlertOnInput"
              />

              <!-- Email -->
              <v-text-field
                v-model="form.email"
                :label="$t('common.forms.email')"
                prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email, rules.acceptedLength]"
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

              <!-- Nº colegiado -->
              <v-text-field
                v-model="form.professionLicenceNumber"
                :label="$t('common.forms.professionalLicenseNumber')"
                prepend-inner-icon="mdi-card-account-details"
                variant="outlined"
                class="mt-2"
                maxlength="50"
                :error-messages="fieldErrors.professionLicenceNumber || []"
                @focus="hideAlertOnFocus"
                @input="hideAlertOnInput"
              />

              <!-- Imagen -->
              <CloudinaryUpload
                ref="cloudinaryRef"
                folder="professionals"
                :buttonText="$t('common.buttons.uploadImage')"
                :api-url="`${apiBaseUrl}/signature`"
                @uploaded="form.imageUrl = $event"
                @cleared="form.imageUrl = ''"
                block
              />

              <!-- Botón principal -->
              <v-btn block color="primary" class="mt-6" size="large" @click="submitForm">
                {{ btnTitle }}
              </v-btn>
            </v-form>

            <!-- Alertas -->
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AlertMessage from './AlertMessage.vue'
import CloudinaryUpload from './CloudinaryUpload.vue'
import professionsData from '@/assets/data/professions.json'
import { post, put } from '@/services/api'
import { buildRules } from '@/utils/rules.js'

const { t, locale } = useI18n()
const rules = buildRules(t)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const cloudinaryRef = ref(null)
const props = defineProps({
  btnTitle: { type: String, default: '' },
  items: { type: Object, required: false },
  mode: { type: String, default: 'create' }, // 'create' | 'edit'
})
const emit = defineEmits(['professional-added', 'professional-updated'])
const formRef = ref(null)
const isValid = ref(false)
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  profession: '',
  specialty: '',
  dni: '',
  professionLicenceNumber: '',
  imageUrl: '',
})
const selectedProfession = ref(null)
const selectedSpecialty = ref('')
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

const getText = (val) => {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    return val[locale.value] || val.en || Object.values(val)[0] || ''
  }
  return ''
}

// *** Listas de selects ***
const professionsList = computed(() =>
  professionsData.professions.map((p) => ({
    title: getText(p.text),
    value: p.code,
  })),
)
const specialtiesList = computed(() => {
  if (!selectedProfession.value) return []
  const professionObj = professionsData.professions.find((p) => p.code === selectedProfession.value)
  if (!professionObj?.specialty) return []
  return [
    { title: 'Sin especificar', value: '' },
    ...professionObj.specialty.map((s) => ({
      title: getText(s['specialty-name']),
      value: s['specialty-code'],
    })),
  ]
})
watch(selectedProfession, () => {
  selectedSpecialty.value = ''
})

// *** Ocultar alertas ***
const hideAlertOnFocus = () => {
  if (alert.show && alert.type === 'error') {
    alert.show = false
    clearFieldErrors()
  }
}
const hideAlertOnInput = hideAlertOnFocus

// *** Cargar datos en edición ***
function loadEditData() {
  if (props.mode === 'edit' && props.items) {
    form.firstName = props.items.firstName || ''
    form.lastName = props.items.lastName || ''
    form.email = props.items.email || ''
    form.dni = props.items.dni || ''
    form.professionLicenceNumber = props.items.professionLicenceNumber || ''
    form.imageUrl = props.items.imageUrl || ''
    selectedProfession.value = props.items.profession || null
    selectedSpecialty.value = props.items.specialty || ''
  } else {
    resetForm()
  }
}
function resetForm() {
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.professionLicenceNumber = ''
  form.imageUrl = ''
  form.dni = ''
  selectedProfession.value = null
  selectedSpecialty.value = ''
}
onMounted(loadEditData)
watch([() => props.items, () => props.mode], loadEditData, { immediate: true })

async function submitForm() {
  const { valid } = await formRef.value.validate()
  if (!valid) return showValidationErrors()

  alert.show = false
  clearFieldErrors()

  const formData = {
    ...form,
    profession: selectedProfession.value,
    specialty: selectedSpecialty.value || '',
  }

  try {
    let response
    if (props.mode === 'create') {
      response = await post(`/professionals`, formData)
    } else {
      response = await put(`/professionals/${props.items.id}/edit`, formData)
    }

    if (props.mode === 'create') {
      formRef.value.reset()
      cloudinaryRef.value?.clearImage()
      emit('professional-added', response)
    } else {
      emit('professional-updated', response)
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
  alert.messageCode =
    error?.messageCode || error?.response?.data?.messageCode || 'INTERNAL_SERVER_ERROR'
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
}

</script>
