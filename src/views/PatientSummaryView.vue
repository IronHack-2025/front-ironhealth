<!-- Header:
     Foto pacient
    Nom i cognom
    -->
<!-- Component informació contacte/informació personal -->
<!-- Component historial -->
<!-- Potser plantejar posar un mini calendari amb les cites a la vista del pacient? -->

<template>
  <v-container>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <template v-else-if="patientData">
      <v-row>
        <v-col cols="12" md="6">
          <PatientIdCard
            :first-name="patientData.firstName"
            :last-name="patientData.lastName"
            :image-url="patientData.imageUrl"
            :subtitle="$t('views.patients.description')"
            class="mb-4"
          />
          <!-- Margen inferior -->

          <ContactInfoCard :patient="patientData" class="mb-4" />
          <!-- Margen inferior -->

          <PersonalInfoCard :patient="patientData" class="mb-4" />
          <!-- Margen inferior -->
        </v-col>

        <v-col>
          <!-- Historial paciente -->
          <PatientHistoryCalendar :patient-id="patientData._id" :show-patient-info="false" />
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
import ContactInfoCard from '@/components/patient/ContactInfoCard.vue'
import PatientIdCard from '@/components/patient/PatientIdCard.vue'
import PersonalInfoCard from '@/components/patient/PersonalInfoCard.vue'
import PatientHistoryCalendar from '@/components/PatientHistoryCalendar.vue'
import { get } from '@/services/api'
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const patientData = ref(null)
const loading = ref(false)
const error = ref('')
const route = useRoute()

function getRouteId() {
  // Soporta distintos nombres de parámetro
  return route.params.id ?? route.params.patientId ?? route.params.slug ?? null
}

function extractPatient(res) {
  // Soporta distintas formas de payload: axios {data}, {data:{patient}}, {patient}, etc.
  let a = res?.data ?? res
  if (a && typeof a === 'object' && 'data' in a && a.data && typeof a.data === 'object') {
    a = a.data
  }
  return a?.patient ?? a?.item ?? a?.result ?? a
}

async function loadPatient() {
  const id = getRouteId()
  if (!id) {
    error.value = 'Falta el id del paciente en la ruta'
    patientData.value = null
    return
  }

  loading.value = true
  error.value = ''
  try {
    const res = await get(`/patients/${id}`)
    const patient = extractPatient(res)
    if (!patient || typeof patient !== 'object') {
      throw new Error('Paciente no encontrado o respuesta inválida')
    }
    patientData.value = patient
    // console.debug('Paciente cargado:', patient)
  } catch (e) {
    error.value = e?.message || 'Error al cargar el paciente'
    patientData.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadPatient)
// Si cambia el id en la misma vista, recarga
watch(() => route.params, loadPatient, { deep: true })
</script>
