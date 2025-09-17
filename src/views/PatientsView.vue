
<template>
  <div class="container">
    <div class="left">
      <AddPatient @patient-added="handleProfessionalAdded" />
    </div>
    <div class="rigth">
      <GenericList
        :items="patients"
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
import AddPatient from '@/components/AddPatientForm.vue'

const patients = ref([])
const loading = ref(false)
const error = ref('')


const headers = [
  {title: 'Foto', key: 'imageUrl'},
  { title: 'Nombre', key: 'firstName' },
  { title: 'Apellidos', key: 'lastName' },
  { title: 'Email', key: 'email' },
  { title: 'Telefono', key: 'phone' },
]

const fetchPatients = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('http://localhost:3000/api/patients')
    if (!response.ok) throw new Error('Error al obtener pacientes')
    const data = await response.json()
    patients.value = Array.isArray(data) ? data : []
  } catch (err) {
    patients.value = []
    error.value = err.message || 'Error desconocido'
  } finally {
    loading.value = false
  }
}

onMounted(fetchPatients)

const handleProfessionalAdded = () => {
  fetchPatients()
}


</script>


<!-- <style scoped>
.container{
  display: grid;
  grid-template-columns: 1fr 1fr;

}

.left .right {
  padding: 20px;
  overflow-y: auto
}

</style> -->
