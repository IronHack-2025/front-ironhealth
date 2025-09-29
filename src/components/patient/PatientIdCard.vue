<template>
  <v-card class="pa-4 d-flex align-center" rounded="xl" elevation="2" >
    <v-avatar size="80" class="me-4">
      <v-img :src="photoSrc" alt="Patient picture" cover />
    </v-avatar>

    <div class="min-w-0">
      <div class="text-h6 text-truncate">
        {{ displayName }}
      </div>
      <div class="text-caption text-medium-emphasis">
        {{ secondaryText }}
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  imageUrl: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  // Texto bajo el nombre (opcional)
  subtitle: { type: String, default: 'Patient' },
})

const displayName = computed(() => {
  const f = (props.firstName || '').trim()
  const l = (props.lastName || '').trim()
  return (f || l) ? `${f} ${l}`.trim() : 'Nombre y Apellidos'
})

const photoSrc = computed(() => {
  return props.imageUrl || 'https://placehold.co/160x160?text=Foto'
})

const secondaryText = computed(() => props.subtitle || 'Paciente')
</script>

<style scoped>
.min-w-0 { min-width: 0; } /* permite text-truncate dentro */
</style>