
<template>
  <div class="container">
    <div class="left">
      <AddPatientForm
        @patient-added="handlePatientAdded"
        :btnTitle="$t('common.buttons.registerPatient')"
      />
    </div>
    <div class="rigth">
      <GenericList
        :title="$t('views.patients.listTitle')"
        :items="patients"
        :headers="headers"
        :loading="loading"
        :error="error"
        :search-placeholder="$t('common.forms.search')"
        :canEdit="true"
        :canDelete="false"
        @edit="onEdit"
        @delete="onDelete"
      />
      <AlertMessage
        v-if="alert.show"
        :show="alert.show"
        :type="alert.type"
        :message-code="alert.messageCode"
        :message="alert.message"
        class="mx-4 mt-4"
      />
      <v-dialog v-model="dialog" max-width="800px" persistent>
        <v-card class="elevation-6 rounded-xl pa-2">
          <v-btn icon @click="dialog = false" absolute right top>
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-card-text class="pa-0">
            <AddPatientForm
              @patient-added="handlePatientAdded"
              @patient-updated="handlePatientUpdated"
              :btnTitle="$t('common.buttons.editPatient')"
              :items="editingPatient"
              :mode="edit ? 'edit' : 'create'"
            />
          </v-card-text>
        </v-card>
      </v-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import GenericList from '@/components/GenericList.vue'
import AddPatientForm from '@/components/AddPatientForm.vue'
import { useI18n } from 'vue-i18n'
import { get } from '@/services/api'
import AlertMessage from '@/components/AlertMessage.vue'
const dialog = ref(false)
const edit = ref(false)
const editingPatient = ref(null)
const alert = reactive({
  show: false,
  type: 'success',
  messageCode: '',
  message: '',
})

const { t } = useI18n()

const patients = ref([])
const loading = ref(false)
const error = ref('')

const headers = computed(() => [
  { title: t('common.forms.actions'), key: 'actions' },
  { title: t('common.forms.photo'), key: 'imageUrl' },
  { title: t('common.forms.firstName'), key: 'firstName' },
  { title: t('common.forms.lastName'), key: 'lastName' },
  { title: t('common.forms.phone'), key: 'phone' },
  { title: t('common.forms.email'), key: 'email' },
])

const fetchPatients = async () => {
  console.log('Fetching patients...')
  loading.value = true
  error.value = ''
  try {
    const resp = await get('/patients') // { success, messageCode, data }
    console.log('Patients response:', resp)
    const arr = Array.isArray(resp?.data) ? resp.data : (resp?.data?.items ?? [])
    console.log('Patients array:', arr)
    patients.value = arr
  } catch (e) {
    console.error('Error fetching patients:', e)
    patients.value = []
    error.value = e.message || 'Error desconocido'
  } finally {
    loading.value = false
  }
}

onMounted(fetchPatients)

const handlePatientAdded = () => {
  console.log('Patient added - refreshing list...')
  fetchPatients()
}
const handlePatientUpdated = () => {
  fetchPatients()

  alert.show = true
  alert.type = 'success'
  alert.messageCode = 'PATIENT_UPDATED'
  alert.message = t('messages.success.PATIENT_UPDATED')
  setTimeout(() => {
    dialog.value = false
    alert.show = false
    edit.value = false
    editingPatient.value = null
  }, 3000)
}

async function onEdit(id) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients/${id}/edit`)

    const response = await res.json()
    const data = response.data

    editingPatient.value = {
      id: data._id || data.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phone: data.phone || '',
      birthDate: data.birthDate || '',
      imageUrl: data.imageUrl || '',
    }
    edit.value = true
    dialog.value = true
  } catch (error) {
    alert.show = true
    alert.type = 'error'
    alert.messageCode = 'INTERNAL_SERVER_ERROR'
    alert.message = error.message || t('messages.error.INTERNAL_SERVER_ERROR')

    setTimeout(() => {
      alert.show = false
    }, 5000)
  }
}

async function onDelete(id) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients/${id}/delete`, {
      method: 'PUT',
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Error al eliminar')
    }

    const data = await res.json()
    console.log(data)
    fetchPatients()
    alert.show = true
    alert.type = 'success'
    alert.messageCode = 'PATIENTS_DELETED'
    alert.message = t('messages.success.PATIENTS_DELETED')
  } catch (error) {
    alert.show = true
    alert.type = 'error'
    alert.messageCode = 'INTERNAL_SERVER_ERROR'
    alert.message = error.message || t('messages.error.INTERNAL_SERVER_ERROR')
  } finally {
    setTimeout(() => {
      alert.show = false
    }, 5000)
  }
}
</script>
