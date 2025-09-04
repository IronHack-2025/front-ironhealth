<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="10">
        <v-card class="pa-8" elevation="6" rounded="lg">
          <v-card-title class="text-h5 font-weight-bold text-center mb-4">
            Registro de Profesional Médico
          </v-card-title>
          <v-card-text>
            <v-form ref="formRef" v-model="isValid" lazy-validation>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="form.firstName" label="Nombre" prepend-inner-icon="mdi-account"
                    :rules="[rules.required, rules.acceptedLength]" variant="outlined" maxlength="50" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="form.surname" label="Apellidos" prepend-inner-icon="mdi-account-details"
                    :rules="[rules.required, rules.acceptedLength]" variant="outlined" maxlength="50" />
                </v-col>
              </v-row>
              <v-select v-model="selectedProfession" label="Profesión" prepend-inner-icon="mdi-briefcase"
                :items="professionsList" :rules="[rules.required]" variant="outlined" class="mt-2" />

              <v-select v-model="selectedSpecialty" label="Especialidad (opcional)" prepend-inner-icon="mdi-stethoscope"
                :items="specialtiesList" variant="outlined" class="mt-2" />

              <v-text-field v-model="form.email" label="Correo electrónico" prepend-inner-icon="mdi-email"
                :rules="[rules.required, rules.email, rules.acceptedLength]" variant="outlined" class="mt-2" />
              <v-text-field v-model="form.professionLicenseNumber" label="Número Colegiado (opcional)"
                prepend-inner-icon="mdi-card-account-details" :rules="[rules.acceptedLength]" variant="outlined" class="mt-2" maxlength="50"/>
              <v-btn block color="primary" class="mt-6" size="large" @click="submitForm">
                Registrar Profesional
              </v-btn>
            </v-form>
            <v-alert v-if="alert.show" :type="alert.type" variant="tonal" border="start" prominent class="mt-4">
              {{ alert.message }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import professionsData from '@/assets/data/professions.json'

const formRef = ref(null)
const isValid = ref(false)
const selectedProfession = ref(null)
const selectedSpecialty = ref('-- Sin especificar --')

const professionsList = professionsData.professions.map((p) => p.profession)
const specialtiesList = computed(() => {
  if (!selectedProfession.value) return []
  const professionObj = professionsData.professions.find(
    (p) => p.profession === selectedProfession.value,
  )
  const specialties = professionObj ? professionObj.specialty.map((s) => s['specialty-name']) : []
  return ['-- Sin especificar --', ...specialties]
})

watch(selectedProfession, () => {
  selectedSpecialty.value = '-- Sin especificar --'
})

const form = reactive({
  name: '',
  surname: '',
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
    return
  }

  const formData = {
    name: form.firstName,
    surname: form.surname,
    profession: selectedProfession.value,
    specialty: selectedSpecialty.value === '-- Sin especificar --' ? '' : selectedSpecialty.value,
    email: form.email,
    professionLicenceNumber: form.professionLicenceNumber,
  }

  console.log(formData)

  try {
    const response = await fetch('http://localhost:4000/api/professionals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      formRef.value.reset()
      alert.message = "Profesional registrado con éxito."
      alert.type = 'success'
      alert.show = true

    } else {
      const errorData = await response.json()
      alert.message = errorData.error
      alert.type = 'error'
      alert.show = true

    }
  } catch (error) {
    alert.message = "Error de conexión: " + error.message
    alert.type = 'error'
    alert.show = true
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
    const lengthMin = 2
    return (
      (value.length <= lengthMax && value.length >= lengthMin) ||
      `El campo debe tener entre ${lengthMin} y ${lengthMax} caracteres.`
    )
  },
}
</script>
