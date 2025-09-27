<template>
        <div v-if="isProfessional">
      <ProfessionalCalendar :calendar-locale="calendarLocale" />
    </div>
    <div v-else>
      <PatientHistoryCalendar :calendar-locale="calendarLocale" />
    </div>
</template>

<script setup>
import ProfessionalCalendar from '@/components/ProfessionalCalendar.vue';
import PatientHistoryCalendar from '@/components/PatientHistoryCalendar.vue';
import { useAuth } from '@/composables/useAuth.js';

const { isProfessional } = useAuth()


const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es'
  }
})

</script>

<style scoped>

</style>