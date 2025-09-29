<template>
  <div class="container">
    <div class="left">
      <AddPatient @patient-added="handlePatientAdded" />
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
import GenericList from '@/components/GenericList.vue'
import AddPatient from '@/components/AddPatientForm.vue'
import { useI18n } from 'vue-i18n'
import { get } from '@/services/api'

const { t } = useI18n()

const patients = ref([])
const loading = ref(false)
const error = ref('')

const headers = computed(() => [
  { title: t('common.forms.photo'), key: 'imageUrl' },
  { title: t('common.forms.firstName'), key: 'firstName' },
  { title: t('common.forms.lastName'), key: 'lastName' },
  { title: t('common.forms.phone'), key: 'phone' },
  { title: t('common.forms.email'), key: 'email' },
])

const fetchPatients = async () => {
  loading.value = true
  error.value = ''
  try {
    const resp = await get('/patients') // { success, messageCode, data }
    const arr = Array.isArray(resp?.data) ? resp.data : (resp?.data?.items ?? [])
    patients.value = arr
  } catch (e) {
    patients.value = []
    error.value = e.message || 'Error desconocido'
  } finally {
    loading.value = false
  }
}

onMounted(fetchPatients)

const handlePatientAdded = () => {
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
