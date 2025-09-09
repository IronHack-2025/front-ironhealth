<template>
  <v-container>
    <v-card class="elevation-3 rounded-xl">
      <v-toolbar flat color="primary" class="rounded-t-xl">
        <v-toolbar-title class="text-white"> Profesionales </v-toolbar-title>
        <v-spacer />
        <v-col cols="12" sm="6" md="4" class="d-flex justify-end">
          <v-text-field
            v-model="search"
            placeholder="Buscar..."
            prepend-inner-icon="mdi-magnify"
            variant="solo-filled"
            hide-details
            clearable
            density="compact"
            class="bg-white rounded-lg"
            maxlength="50"
          />
        </v-col>
      </v-toolbar>

      <v-data-table
        :headers="headers"
        :items="professionals"
        :loading="loading"
        :search="search"
        loading-text="Cargando profesionales..."
        no-data-text="No se encontraron profesionales"
        class="rounded-b-xl"
        hover
        density="comfortable"
        fixed-header
        height="500px"
      >
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import professionsData from '@/assets/data/professions.json'

const professionals = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')

function getSpecialtyName(code) {
  for (const p of professionsData.professions) {
    const found = p.specialty?.find((s) => s['specialty-code'] === code)
    if (found) return found['specialty-name']
  }
  return '—'
}

function getProfessionName(code) {
    console.log("el codigo recibido es:", code, "---");
    for (const p of professionsData.professions) {
        if (p.code === code) return p.text;
    }
    return '—';
}


const headers = [
  { title: 'Nombre', key: 'name' },
  { title: 'Apellidos', key: 'surname' },
{
    title: 'Profesión',
    key: 'professions',
    value: (item) => getProfessionName(item.profession),
},
  {
    title: 'Especialidad',
    key: 'specialty',
    value: (item) => getSpecialtyName(item.specialty),
  },
  { title: 'Email', key: 'email' },
  { title: 'Nº colegiado', key: 'professionLicenceNumber' },
]

const fetchProfessionals = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/professionals')
    if (!res.ok) throw new Error('Error al cargar profesionales')
    const data = await res.json()
    professionals.value = Array.isArray(data) ? data : []
  } catch (err) {
    // Componente Alert
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfessionals)
</script>
