<template>
    <div>
        <AppointmentsCalendar :calendar-locale="calendarLocale" />
    </div>
</template>

<script setup>
import AppointmentsCalendar from '@/components/AppointmentsCalendar.vue';

const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es'
  }
})

</script>

<style scoped>

</style>
