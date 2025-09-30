<template>
  <v-card rounded="xl">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-card-account-details" class="me-2" color="primary" />
      {{ $t('views.patients.contactInfo') }}
    </v-card-title>

    <v-card-text>
      <InfoRow :label="$t('common.forms.email')" :value="patient?.email" icon="mdi-email" />
      <InfoRow :label="$t('common.forms.phone')" :value="patient?.phone" icon="mdi-phone" />
      <InfoRow :label="$t('common.forms.street')" :value="patient?.street" icon="mdi-map-marker" />
      <InfoRow :label="$t('common.forms.city')" :value="patient?.city" icon="mdi-city" />
      <InfoRow
        :label="$t('common.forms.postalCode')"
        :value="patient?.postalCode"
        icon="mdi-mailbox"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import InfoRow from '@/components/base/InfoRow.vue'

defineProps({
  patient: { type: Object, required: true },
})
</script>
