<template>

    <div>
      <ProfessionalCalendar :calendar-locale="calendarLocale" />
    </div>
    
</template>

<script setup>
import ProfessionalCalendar from '@/components/ProfessionalCalendar.vue';


const props = defineProps({
  calendarLocale: {
    type: String,
    default: 'es'
  }
})

</script>

<style scoped>

</style>