<template>
  <div class="container">
    <!-- Formulario para registrar profesional -->
    <AddProfessionalsForm
      :btnTitle="$t('common.buttons.registerProfessional')"
      @professional-added="handleProfessionalAdded"
    />

    <!-- Listado de profesionales -->
    <GenericList
      :title="$t('views.professionals.listTitle')"
      :items="professionals"
      :headers="headers"
      :loading="loading"
      :error="error"
      :search-placeholder="$t('common.forms.search')"
      :canEdit="true"
      :canDelete="true"
      @refresh="fetchProfessionals"
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
import { get } from '@/services/api'
import professionsData from '@/assets/data/professions.json'

import GenericList from '@/components/GenericList.vue'
import AddProfessionalsForm from '@/components/AddProfessionalsForm.vue'
import AlertMessage from '@/components/AlertMessage.vue'

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
const headers = computed(() => [
  { title: t('common.forms.actions'), key: 'actions' },
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
])

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
  alert.show = true
  alert.type = 'success'
  alert.messageCode = 'PROFESSIONAL_UPDATED'
  alert.message = t('messages.success.PROFESSIONAL_UPDATED')

  setTimeout(() => {
    dialog.value = false
    alert.show = false
    edit.value = false
    editingProfessional.value = null
  }, 3000)
}

// Editar profesional
const onEdit = async (id) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/professionals/${id}/edit`)
    const response = await res.json()
    const data = response.data

    editingProfessional.value = {
      id: data._id || data.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      profession: data.profession || '',
      specialty: data.specialty || '',
      professionLicenceNumber: data.professionLicenceNumber || '',
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

// Eliminar profesional
const onDelete = async (id) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/professionals/${id}/delete`, {
      method: 'PUT',
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Error al eliminar')
    }

    await res.json()
    fetchProfessionals()

    alert.show = true
    alert.type = 'success'
    alert.messageCode = 'PROFESSIONAL_DELETED'
    alert.message = t('messages.success.PROFESSIONAL_DELETED')
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
