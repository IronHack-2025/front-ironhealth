<template>
   
    <div v-if="isAdmin || isProfessional">
      <AppointmentsCalendar :calendar-locale="calendarLocale" />
    </div>
    <div v-else>
      <PatientCalendar :calendar-locale="calendarLocale" />
    </div>
</template>

<script setup>
import AppointmentsCalendar from '@/components/AppointmentsCalendar.vue';
import PatientCalendar from '@/components/PatientCalendar.vue';
import { useAuth } from '@/composables/useAuth.js';

const { isAdmin, isProfessional } = useAuth()

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es'
  }
})

</script>

<style scoped>

</style>
