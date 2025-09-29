<template>
  <div class="container">
    <!-- Formulario -->
    <AddPatientForm
      :btnTitle="$t('common.buttons.registerPatient')"
      @patient-added="handlePatientAdded"
    />

    <!-- Listado de pacientes -->
    <GenericList
      :title="$t('views.patients.listTitle')"
      :items="patients"
      :headers="headers"
      :loading="loading"
      :error="error"
      :search-placeholder="$t('common.forms.search')"
      :canEdit="true"
      :canDelete="true"
      @edit="onEdit"
      @delete="onDelete"
    />

    <!-- Alertas -->
    <AlertMessage
      v-if="alert.show"
      :show="alert.show"
      :type="alert.type"
      :message-code="alert.messageCode"
      :message="alert.message"
      class="mx-4 mt-4"
    />

    <!-- Modal de edición -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card class="elevation-8 rounded-xl pa-2">
        <v-btn icon @click="dialog = false" absolute right top>
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-card-text class="pa-0">
          <v-row justify="center" class="mb-4" v-if="editingPatient?.imageUrl">
            <v-col cols="auto">
              <v-avatar size="140">
                <v-img :src="editingPatient.imageUrl" alt="Patient Photo" cover />
              </v-avatar>
            </v-col>
          </v-row>

          <AddPatientForm
            :btnTitle="$t('common.buttons.editPatient')"
            :items="editingPatient"
            :mode="edit ? 'edit' : 'create'"
            @patient-added="handlePatientAdded"
            @patient-updated="handlePatientUpdated"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { get } from '@/services/api'
import GenericList from '@/components/GenericList.vue'
import AddPatientForm from '@/components/AddPatientForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'

const { t } = useI18n()
const patients = ref([])
const loading = ref(false)
const error = ref('')
const dialog = ref(false)
const edit = ref(false)
const editingPatient = ref(null)

// Alertas
const alert = reactive({
  show: false,
  type: 'success',
  messageCode: '',
  message: '',
})

// Encabezados de la tabla
const headers = computed(() => [
  { title: t('common.forms.actions'), key: 'actions' },
  { title: t('common.forms.photo'), key: 'imageUrl' },
  { title: t('common.forms.firstName'), key: 'firstName' },
  { title: t('common.forms.lastName'), key: 'lastName' },
  { title: t('common.forms.phone'), key: 'phone' },
  { title: t('common.forms.email'), key: 'email' },
])

// Obtener lista de pacientes
const fetchPatients = async () => {
  loading.value = true
  error.value = ''
  try {
    const resp = await get('/patients') // { success, messageCode, data }
    const arr = Array.isArray(resp?.data) ? resp.data : (resp?.data?.items ?? [])
    patients.value = arr
  } catch (e) {
    patients.value = []
    error.value = e.message 
  } finally {
    loading.value = false
  }
}
onMounted(fetchPatients)

// Paciente agregado
const handlePatientAdded = () => {
  fetchPatients()
}

// Paciente actualizado
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

// Editar paciente
const onEdit = async (id) => {
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

// Eliminar paciente
const onDelete = async (id) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/patients/${id}/delete`, {
      method: 'PUT',
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message)
    }

    await res.json()
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
