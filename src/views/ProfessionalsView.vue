<template>
  <div class="container">
    <!-- Formulario para registrar profesional -->
    <div v-if="isAdmin" class="d-flex justify-end ma-6">
      <v-btn
        color="primary"
        size="medium"
        class="text-white font-weight-medium px-4 py-2 mx-4 rounded-xl"
        @click="showForm = !showForm"
      >
        <v-icon icon="mdi-plus" start></v-icon>
        {{ $t('common.buttons.registerProfessional') }}
      </v-btn>
    </div>
    <v-expand-transition>
      <div v-show="showForm && isAdmin" class="form-container">
        <v-card class="pa-6 rounded-xl">
          <AddProfessionalsForm
            :btnTitle="$t('common.buttons.registerProfessional')"
            @professional-added="handleProfessionalAdded"
          />
        </v-card>
      </div>
    </v-expand-transition>

    <!-- Listado de profesionales -->
    <template v-if="professionals.length"
      >0>
      <GenericList
        :title="$t('views.professionals.listTitle')"
        :items="professionals"
        :headers="headers"
        :loading="loading"
        :error="error"
        :search-placeholder="$t('common.forms.search')"
        :canEdit="isAdmin"
        :canDelete="isAdmin"
        @refresh="fetchProfessionals"
        @edit="onEdit"
        @delete="onDelete"
      />
    </template>

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
      <v-card class="elevation-6 rounded-xl pa-2">
        <v-btn icon @click="dialog = false" absolute right top>
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-card-text class="pa-0">
          <div v-if="editingProfessional?.imageUrl" class="d-flex justify-center mb-4">
            <v-img
              :src="editingProfessional.imageUrl"
              max-width="180"
              max-height="180"
              class="rounded-circle"
              alt="Patient Photo"
              cover
            />
          </div>

          <AddProfessionalsForm
            :btnTitle="$t('common.buttons.editProfessional')"
            :items="editingProfessional"
            :mode="edit ? 'edit' : 'create'"
            @professional-added="handleProfessionalAdded"
            @professional-updated="handleProfessionalUpdated"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { get, put } from '@/services/api'
import professionsData from '@/assets/data/professions.json'

import GenericList from '@/components/GenericList.vue'
import AddProfessionalsForm from '@/components/AddProfessionalsForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import { useAuth } from '@/composables/useAuth.js'

const showForm = ref(false)
const { isAdmin } = useAuth()
const { t, locale } = useI18n()
const professionals = ref([])
const loading = ref(false)
const error = ref('')
const dialog = ref(false)
const edit = ref(false)
const editingProfessional = ref(null)

// Alertas
const alert = reactive({
  show: false,
  type: 'success',
  messageCode: '',
  message: '',
})

// Encabezados de la tabla

const headers = computed(() => {
  const headersTable = [
    { title: t('common.forms.photo'), key: 'imageUrl' },
    { title: t('common.forms.firstName'), key: 'firstName' },
    { title: t('common.forms.lastName'), key: 'lastName' },
    { title: t('common.forms.email'), key: 'email' },
    {
      title: t('common.forms.profession'),
      key: 'profession',
      value: (item) => getProfessionName(item.profession),
    },
    {
      title: t('common.forms.specialty'),
      key: 'specialty',
      value: (item) => getSpecialtyName(item.specialty),
    },
  ]
  if (isAdmin.value) {
    headersTable.unshift({ title: t('common.forms.actions'), key: 'actions' })
  }
  return headersTable
})

// Helpers para multilenguaje
const getText = (val) => {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    return val[locale.value] || val.en || Object.values(val)[0] || ''
  }
  return ''
}

function getProfessionName(code) {
  for (const p of professionsData.professions) {
    if (p.code === code) return getText(p.text)
  }
  return '—'
}

function getSpecialtyName(code) {
  for (const p of professionsData.professions) {
    const found = p.specialty?.find((s) => s['specialty-code'] === code)
    if (found) return getText(found['specialty-name'])
  }
  return '—'
}

// Obtener lista de profesionales
const fetchProfessionals = async () => {
  loading.value = true
  error.value = ''
  try {
    const resp = await get('/professionals') // { success, messageCode, data }
    const arr = Array.isArray(resp?.data) ? resp.data : (resp?.data?.items ?? [])
    professionals.value = arr
  } catch (e) {
    professionals.value = []
    error.value = e.message
    console.error('Error fetching professionals:', e)
  } finally {
    loading.value = false
  }
}
onMounted(fetchProfessionals)

// Profesional añadido
const handleProfessionalAdded = () => {
  fetchProfessionals()
}

// Profesional actualizado
const handleProfessionalUpdated = () => {
  fetchProfessionals()

  setTimeout(() => {
    dialog.value = false
    edit.value = false
    editingProfessional.value = null
  }, 3000)
}

// Editar profesional
const onEdit = async (id) => {
  try {
    const response = await get(`/professionals/${id}`)
    editingProfessional.value = {
      id: response.data._id || response.data.id,
      firstName: response.data.firstName || '',
      lastName: response.data.lastName || '',
      email: response.data.email || '',
      profession: response.data.profession || '',
      specialty: response.data.specialty || '',
      dni: response.data.dni || '',
      professionLicenceNumber: response.data.professionLicenceNumber || '',
      imageUrl: response.data.imageUrl || '',
    }
    edit.value = true
    dialog.value = true
  } catch (error) {
    console.error('Error editing professional:', error)
    // Solo mostrar alerta si no es un error de sesión expirada (401)
    if (error.statusCode !== 401) {
      alert.show = true
      alert.type = 'error'
      alert.messageCode = 'INTERNAL_SERVER_ERROR'
      alert.message = error.message || t('messages.error.INTERNAL_SERVER_ERROR')

      setTimeout(() => {
        alert.show = false
      }, 5000)
    }
  }
}

// Eliminar profesional
const onDelete = async (id) => {
  try {
    const response = await put(`/professionals/${id}/delete`)
    fetchProfessionals()

    alert.show = true
    alert.type = 'success'
    alert.messageCode = response?.messageCode || 'PROFESSIONAL_DELETED'
    alert.message = '' // Dejar vacío para que AlertMessage use messageCode
  } catch (error) {
    alert.show = true
    alert.type = 'error'
    alert.messageCode = error?.messageCode || 'INTERNAL_SERVER_ERROR'
    alert.message = '' // Dejar vacío para que AlertMessage use messageCode
  } finally {
    setTimeout(() => {
      alert.show = false
    }, 5000)
  }
}
</script>
