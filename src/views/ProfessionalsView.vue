<template>
  <div class="container">
    <div class="left">
      <AddProfessionalsForm @professional-added="handleProfessionalAdded" />
    </div>
    <div class="rigth">
      <GenericList
        :items="professionals"
        :headers="headers"
        :loading="loading"
        :error="error"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import GenericList from '@/components/GenericList.vue'
import AddProfessionalsForm from '@/components/AddProfessionalsForm.vue'
import professionsData from '@/assets/data/professions.json'

const professionals = ref([])
const loading = ref(false)
const error = ref('')

function getProfessionName(code) {
  for (const p of professionsData.professions) {
    if (p.code === code) return p.text
  }
  return '—'
}

function getSpecialtyName(code) {
  for (const p of professionsData.professions) {
    const found = p.specialty?.find((s) => s['specialty-code'] === code)
    if (found) return found['specialty-name']
  }
  return '—'
}

const headers = [
  { title: 'Nombre', key: 'firstName' },
  { title: 'Apellidos', key: 'lastName' },
  {
    title: 'Profesión',
    key: 'profession',
    value: (item) => getProfessionName(item.profession),
  },
  {
    title: 'Especialidad',
    key: 'specialty',
    value: (item) => getSpecialtyName(item.specialty),
  },
  { title: 'Email', key: 'email' },
]

const fetchProfessionals = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('http://localhost:3000/api/professionals')
    if (!response.ok) throw new Error('Error al obtener profesionales')
    const data = await response.json()
    professionals.value = Array.isArray(data) ? data : []
  } catch (err) {
    professionals.value = []
    error.value = err.message || 'Error desconocido'
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfessionals)

const handleProfessionalAdded = () => {
  fetchProfessionals()
}

</script>

<!-- <style scoped>
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.left .right {
  padding: 20px;
  overflow-y: auto;
}
</style> -->
