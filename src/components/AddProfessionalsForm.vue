<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12">
        <v-card class="pa-8" elevation="6" rounded="xl">
          <v-card-title class="text-h5 font-weight-bold text-center mb-4">
            Registro de Profesional Médico
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="isValid" lazy-validation>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.firstName"
                    label="Nombre"
                    prepend-inner-icon="mdi-account"
                    :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined"
                    maxlength="50"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="form.lastName"
                    label="Apellidos"
                    prepend-inner-icon="mdi-account-details"
                    :rules="[rules.required, rules.acceptedLength]"
                    variant="outlined"
                    maxlength="50"
                  />
                </v-col>
              </v-row>
              <v-select
                v-model="selectedProfession"
                label="Profesión"
                prepend-inner-icon="mdi-briefcase"
                :items="professionsList"
                item-title="title"
                item-value="value"
                :rules="[rules.required]"
                variant="outlined"
                class="mt-2"
              />

              <v-select
                v-model="selectedSpecialty"
                label="Especialidad (opcional)"
                prepend-inner-icon="mdi-stethoscope"
                :items="specialtiesList"
                item-title="title"
                item-value="value"
                variant="outlined"
                class="mt-2"
              />

              <v-text-field
                v-model="form.email"
                label="Correo electrónico"
                prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email, rules.acceptedLength]"
                variant="outlined"
                class="mt-2"
                maxlength="50"
              />
              <v-text-field
                v-model="form.professionLicenceNumber"
                label="Número Colegiado (opcional)"
                prepend-inner-icon="mdi-card-account-details"
                variant="outlined"
                class="mt-2"
                maxlength="50"
              />
              <v-btn block color="primary" class="mt-6" size="large" @click="submitForm">
                Registrar Profesional
              </v-btn>
            </v-form>
            <Alert :show="alert.show" :type="alert.type" :message="alert.message" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Alert from './AlertMessage.vue'
import { post } from '../services/api'
import professionsData from '@/assets/data/professions.json'
const emit = defineEmits(['professional-added'])
const formRef = ref(null)
const isValid = ref(false)
const selectedProfession = ref(null) // code
const selectedSpecialty = ref('Sin especificar') // specialty-code

// Lista de profesiones: muestra text, guarda code
const professionsList = professionsData.professions.map((p) => ({
  title: p.text,
  value: p.code,
}))

// Lista de especialidades según profesión seleccionada
const specialtiesList = computed(() => {
  if (!selectedProfession.value) return []
  const professionObj = professionsData.professions.find((p) => p.code === selectedProfession.value)
  if (!professionObj || !professionObj.specialty) return []
  return [
    { title: 'Sin especificar', value: '' },
    ...professionObj.specialty.map((s) => ({
      title: s['specialty-name'],
      value: s['specialty-code'],
    })),
  ]
})

watch(selectedProfession, () => {
  selectedSpecialty.value = ''
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
})

const submitForm = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    alert.message = 'Revisa los campos del formulario'
    return
  }

  const formData = {
    firstName: form.firstName,
    lastName: form.lastName,
    profession: selectedProfession.value,
    specialty: selectedSpecialty.value,
    email: form.email,
    specialization: selectedSpecialty.value,
    licenseNumber: form.professionLicenceNumber,
  }

  try {
    await post('/professionals', formData)
    formRef.value.reset()
    emit('professional-added')
    alert.show = true
    alert.type = 'success'
    alert.message = 'Profesional registrado con éxito'
  } catch (error) {
    alert.show = true
    alert.type = 'error'
    alert.message = error.message
  }
}

const rules = {
  required: (value) => !!value || 'Este campo es obligatorio.',
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Correo electrónico no válido.'
  },

  acceptedLength: (value) => {
    const lengthMax = 50
    const lengthMin = 3
    return (
      (value.length <= lengthMax && value.length >= lengthMin) ||
      `El campo debe tener entre ${lengthMin} y ${lengthMax} caracteres.`
    )
  },
}
</script>
