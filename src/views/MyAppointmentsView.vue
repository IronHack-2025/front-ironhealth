<template>
  <div v-if="isProfessional">
    <ProfessionalCalendar :calendar-locale="calendarLocale" />
    <PatientSearch 
      v-model="selectedPatient" 
      @patient-selected="onPatientSelected"
      @patient-cleared="onPatientCleared" 
    />
    <div v-if="selectedPatient" class="mt-4">
      <PatientHistoryCalendar 
        :calendar-locale="calendarLocale" 
        :patient-id="selectedPatient._id || selectedPatient.id"
      />  
    </div>
  </div>
  <div v-else>
    <PatientHistoryCalendar :calendar-locale="calendarLocale" />
  </div>
</template>

<script setup>
import ProfessionalCalendar from '@/components/ProfessionalCalendar.vue';
import PatientHistoryCalendar from '@/components/PatientHistoryCalendar.vue';
import { useAuth } from '@/composables/useAuth.js';
import PatientSearch from '@/components/PatientSearch.vue';
import { ref } from 'vue';

const { isProfessional } = useAuth()

const selectedPatient = ref(null);

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es'
  }
})

const onPatientSelected = (patient) => {
  selectedPatient.value = patient;
};

const onPatientCleared = () => {
  selectedPatient.value = null;
};
</script>

<style scoped>

</style>