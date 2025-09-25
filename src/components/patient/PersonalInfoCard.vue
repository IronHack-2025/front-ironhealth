<template>
    <v-card rounded="xl">
        <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-card-account-details" class="me-2" color="primary" />
            Información personal
        </v-card-title>

        <v-card-text>
            <InfoRow label="Gender" :value="patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)" icon="mdi-account" icon-color="black" />
            <InfoRow label="Birth date" :value="formattedBirthDate" icon="mdi-calendar-account" icon-color="green" />
            <InfoRow label="Id" :value="patient._id" icon="mdi-id-card" icon-color="red" />
            <InfoRow label="Nationality" :value="nationalityName" icon="mdi-map-marker" icon-color="blue" />

            <!-- Ahora muestra el código del país, hacer que muestre el nombre. Habría que adaptar los nombres de los países a los locales es/en -->
            <InfoRow label="Emergency contact" :value="patient.emergencyContact" icon="mdi-phone-alert" />
        </v-card-text>
    </v-card>
</template>

<script setup>
import InfoRow from '@/components/base/InfoRow.vue'
import nationalitiesData from '@/assets/data/nationalities.json'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({
    patient: {
        type: Object,
        required: true
    }
})

// Formateja la data a "dd/mm/yyyy"
const formattedBirthDate = computed(() => {
  if (!props.patient.birthDate) return ''
  const date = new Date(props.patient.birthDate)
  if (isNaN(date)) return props.patient.birthDate // fallback si no és data
  return date.toLocaleDateString('es-ES') // o canvia 'es-ES' pel teu idioma
})

// Busca el nom pel codi
const nationalityName = computed(() => {
  const found = nationalitiesData.find(n => n.code === props.patient.nationality)
  return found ? found.name : props.patient.nationality
})
</script>
