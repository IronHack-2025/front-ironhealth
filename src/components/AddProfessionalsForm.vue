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

              <!-- PROFESIÓN -->
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

              <!-- ESPECIALIDAD -->
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

              <v-btn block color="primary" class="mt-6" size="large" @click="submitForm">
                {{ btnTitle }}
              </v-btn>
            </v-form>

            <!-- Alerta estructurada -->
            <AlertMessage
              :show="alert.show"
              :type="alert.type"
              :message-code="alert.messageCode"
              :details="alert.details"
              :message-params="alert.params"
              :message="alert.message"
              class="mt-4"
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
import AlertMessage from './AlertMessage.vue'
import professionsData from '@/assets/data/professions.json'
import { useI18n } from 'vue-i18n'
const props = defineProps({
  btnTitle: { type: String, default: '' },
  items: { type: Object, required: false },
  mode: { type: String, default: 'create' }, // 'create' o 'edit'
})

const { t, locale } = useI18n()
const emit = defineEmits(['professional-added', 'professional-updated'])
const formRef = ref(null)
const isValid = ref(false)
const selectedProfession = ref(null) // code
const selectedSpecialty = ref('') // FIX: usar el VALUE '', no la etiqueta "Sin especificar"

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
    title: getText(p.text), // FIX: evita [object Object] cuando p.text es {es,en}
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
      title: getText(s['specialty-name']), // FIX: idem para specialty-name
      value: s['specialty-code'],
    })),
  ]
})

watch(selectedProfession, () => {
  // Al cambiar la profesión, resetea el value (no la etiqueta)
  selectedSpecialty.value = '' // FIX coherente con value
})

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  profession: '',
  specialty: '',
  professionLicenceNumber: '',
  imageUrl: '',
})

const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  messageCode: 'OPERATION_SUCCESS',
  details: null, // [{ field?, code, meta? }]
  params: {},
})

function loadEditData() {
  if (props.mode === 'edit' && props.items) {
    // Campos básicos
    form.firstName = props.items.firstName || ''
    form.lastName = props.items.lastName || ''
    form.email = props.items.email || ''
    form.professionLicenceNumber = props.items.professionLicenceNumber || ''
    form.imageUrl = props.items.imageUrl || ''

    // Selects
    selectedProfession.value = props.items.profession || null
    selectedSpecialty.value = props.items.specialty || ''
  } else if (props.mode === 'create') {
    // Resetea el formulario si no hay datos
    resetForm()
  }
}

onMounted(() => {
  loadEditData()
})

watch(
  [() => props.items, () => props.mode],
  () => {
    loadEditData()
  },
  { immediate: true }
)

function resetForm() {
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.professionLicenceNumber = ''
  form.imageUrl = ''
  selectedProfession.value = null
  selectedSpecialty.value = ''
}

// Errores por campo para enganchar a :error-messages
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

const submitForm = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    // ... (tu lógica de validación actual, sin cambios)
    return
  }

  alert.show = false
  clearFieldErrors()

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
    let response
    let res

    if (props.mode === 'create') {
      // Crear nuevo
      response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/professionals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
    } else if (props.mode === 'edit') {
      // Aseguramos que haya un ID válido
      if (!props.items?.id) {
        throw new Error('No se puede editar: falta el ID del profesional')
      }

      // Editar existente → usamos el ID del objeto recibido
      response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/professionals/${props.items.id}/edit`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      )
    } else {
      throw new Error('Modo desconocido: debe ser "create" o "edit"')
    }

    if (!response.ok) {
      // Intentar extraer mensaje del backend
      let errorMessage = 'Error en la operación'
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        // Si no es JSON, usar status text
        errorMessage = response.statusText || 'Error desconocido'
      }
      throw new Error(errorMessage)
    }

    res = await response.json()

    // Emitir evento
    if (props.mode === 'create') {
      formRef.value.reset()
      emit('professional-added', res)
    } else {
      emit('professional-updated', res)
    }

    // Éxito
    alert.show = true
    alert.type = 'success'
    alert.messageCode = res?.messageCode || 'OPERATION_SUCCESS'
    alert.details = null
    alert.params = {}
    alert.message = t('messages.success.OPERATION_SUCCESS')

    setTimeout(() => {
      alert.show = false
    }, 3000)

  } catch (error) {
    alert.show = true
    alert.type = 'error'
    alert.messageCode = 'INTERNAL_SERVER_ERROR'
    alert.details = null
    alert.params = {}
    alert.message = error.message || t('messages.error.INTERNAL_SERVER_ERROR')
        setTimeout(() => {
      alert.show = false
    }, 3000)

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
