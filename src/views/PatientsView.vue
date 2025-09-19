
<template>
  <div class="container">
    <div class="left">
      <AddPatient @patient-added="handleProfessionalAdded" />
    </div>
    <div class="rigth">
      <GenericList
        :title="$t('views.patients.listTitle')"
        :items="patients"
        :headers="headers"
        :loading="loading"
        :error="error"
        :search-placeholder="$t('common.forms.search')"
      />
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import GenericList from '@/components/GenericList.vue'
import AddPatient from '@/components/AddPatientForm.vue'

const { t } = useI18n()

const patients = ref([])
const loading = ref(false)
const error = ref('')

const headers = computed(() => [
  { title: t('common.forms.firstName'), key: 'firstName' },
  { title: t('common.forms.lastName'), key: 'lastName' },
  { title: t('common.forms.email'), key: 'email' },
  { title: t('common.forms.phone'), key: 'phone' },
])

const fetchPatients = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('http://localhost:3000/api/patients')
    if (!response.ok) throw new Error('Error al obtener pacientes')
    const data = await response.json()

   if (data.success && data.data) {
  patients.value = Array.isArray(data.data) ? data.data : []
} else {
  // Fallback para estructura legacy
  patients.value = Array.isArray(data) ? data : []
}
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
