<template>
  <v-container>
    <v-card class="elevation-3 rounded-xl">
      <v-toolbar flat color="primary" class="rounded-t-xl">
        <v-toolbar-title class="text-white"> Patients </v-toolbar-title>
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
        :items="patients"
        :loading="loading"
        :search="search"
        loading-text="Cargando pacientes..."
        no-data-text="No se encontraron pacientes"
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
import { ref, onMounted, computed } from 'vue'

const patients = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')



const headers = [
  { title: 'Nombre', key: 'firstName' },
  { title: 'Apellidos', key: 'lastName' },
  { title: 'Email', key: 'email' },
  { title: 'Telefono', key: 'phone' },
  { title: 'Fecha de nacimiento', key: 'birthDate' },
]

const fetchPatients = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/patients')
    if (!res.ok) throw new Error('Error al cargar pacientes')
    const data = await res.json()
    patients.value = Array.isArray(data) ? data : []
    loading.value = false
  } catch (err) {
    // Componente Alert
    error.value = err.message
  }
}

onMounted(fetchPatients)
</script>
