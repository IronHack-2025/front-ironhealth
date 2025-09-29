<template>
  <div v-if="isProfessional">
    <ProfessionalCalendar
      :calendar-locale="calendarLocale"
      @openPatientHistory="handleOpenPatientHistory"
    />

    <v-card class="pa-4" elevation="2">
      <PatientSearch
        v-model="selectedPatientFromSearch"
        @patient-selected="onPatientSelected"
        @patient-cleared="onPatientCleared"
      />
    </v-card>
    <div v-if="selectedPatientForHistory" class="mt-4 patient-history-section">
      <v-card class="pa-4" elevation="2">
        <PatientHistoryCalendar
          :calendar-locale="calendarLocale"
          :patient-id="selectedPatientForHistory._id || selectedPatientForHistory.id"
        />
      </v-card>
    </div>
  </div>
  <div v-else>
    <PatientHistoryCalendar :calendar-locale="calendarLocale" />
  </div>
</template>

<script setup>
import ProfessionalCalendar from '@/components/ProfessionalCalendar.vue'
import PatientHistoryCalendar from '@/components/PatientHistoryCalendar.vue'
import { useAuth } from '@/composables/useAuth.js'
import PatientSearch from '@/components/PatientSearch.vue'
import { ref } from 'vue'

const { isProfessional } = useAuth()

// ✅ Variable separada para el buscador (no se ve afectada por el emit)
const selectedPatientFromSearch = ref(null)

// ✅ Variable para el historial (se actualiza desde el buscador O desde el emit)
const selectedPatientForHistory = ref(null)

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es',
  },
})

const onPatientSelected = (patient) => {
  console.log('🔍 onPatientSelected called with:', patient)
  selectedPatientFromSearch.value = patient
  selectedPatientForHistory.value = patient // También actualizar el historial
  console.log('📊 State after selection:', {
    selectedPatientFromSearch: selectedPatientFromSearch.value,
    selectedPatientForHistory: selectedPatientForHistory.value,
  })
}

const onPatientCleared = () => {
  console.log('🧹 onPatientCleared called')
  selectedPatientFromSearch.value = null
  selectedPatientForHistory.value = null // También limpiar el historial
  console.log('📊 State after clear:', {
    selectedPatientFromSearch: selectedPatientFromSearch.value,
    selectedPatientForHistory: selectedPatientForHistory.value,
  })
}

const handleOpenPatientHistory = async (patientId) => {
  selectedPatientForHistory.value = { _id: patientId } // Simplicidad: solo ID
}
</script>

<style scoped></style>
