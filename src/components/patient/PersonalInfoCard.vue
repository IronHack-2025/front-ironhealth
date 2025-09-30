<template>
  <v-card rounded="xl">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-card-account-details" class="me-2" color="primary" />
    </v-card-title>

    <v-card-text>
      <InfoRow
        :label="$t('common.forms.gender')"
        :value="genderName"
        icon="mdi-account"
        icon-color="black"
      />
      <InfoRow
        :label="$t('common.forms.dateOfBirth')"
        :value="formattedBirthDate"
        icon="mdi-calendar-account"
        icon-color="green"
      />
      <InfoRow label="ID" :value="patient._id" icon="mdi-id-card" icon-color="red" />
      <InfoRow
        :label="$t('common.forms.nationality')"
        :value="nationalityName"
        icon="mdi-map-marker"
        icon-color="blue"
      />

      <!-- Ahora muestra el código del país, hacer que muestre el nombre. Habría que adaptar los nombres de los países a los locales es/en -->
      <InfoRow
        :label="$t('common.forms.emergencyContact')"
        :value="patient.emergencyContact"
        icon="mdi-phone-alert"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import InfoRow from '@/components/base/InfoRow.vue'
import nationalitiesData from '@/assets/data/nationalities.json'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
const { t, locale } = useI18n()
const props = defineProps({
  patient: {
    type: Object,
    required: true,
  },
})

const formattedBirthDate = computed(() => {
  if (!props.patient.birthDate) return ''
  const date = new Date(props.patient.birthDate)
  if (isNaN(date)) return props.patient.birthDate
  return date.toLocaleDateString('es-ES')
})

const genderName = computed(() => {
  const genderMap = {
    male: t('common.genders.genderMan'),
    female: t('common.genders.genderWoman'),
    'non-binary': t('common.genders.genderNonBinary'),
  }
  return genderMap[props.patient.gender] || props.patient.gender
})

const nationalityName = computed(() => {
  const found = nationalitiesData.find((n) => n.code === props.patient.nationality)
  return found ? found.name[locale.value] || found.name.en : props.patient.nationality
})
</script>
