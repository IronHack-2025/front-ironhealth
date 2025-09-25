<template>
  <v-card rounded="xl">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-card-account-details" class="me-2" color="primary" />
      Información de Contacto
    </v-card-title>

    <v-card-text>
      <InfoRow label="Email" :value="patient?.email" icon="mdi-email" />
      <InfoRow label="Teléfono" :value="patient?.phone" icon="mdi-phone" />
      <InfoRow label="Dirección" :value="patient?.street" icon="mdi-map-marker" />
      <InfoRow label="Ciudad" :value="patient?.city" icon="mdi-city" />
      <InfoRow label="Código Postal" :value="patient?.postalCode" icon="mdi-mailbox" />
    </v-card-text>
  </v-card>
</template>

<script setup>
import InfoRow from '@/components/base/InfoRow.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
  patient: { type: Object, required: true }
})
</script>
