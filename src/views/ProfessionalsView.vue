<template>
  <div class="container">
    <div>
      <AddProfessionalsForm
        @professional-added="handleProfessionalAdded"
        :btnTitle="$t('common.buttons.registerProfessional')"
      />
    </div>
    <div class="rigth">
      <GenericList
        :title="$t('views.professionals.listTitle')"
        :items="professionals"
        :headers="headers"
        :loading="loading"
        :error="error"
        :search-placeholder="$t('common.forms.search')"
        @refresh="fetchProfessionals"
        :canEdit="true"
        :canDelete="true"
        @edit="onEdit"
        @delete="onDelete"
      >
      </GenericList>
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
            <AddProfessionalsForm
              @professional-added="handleProfessionalAdded"
              @professional-updated="handleProfessionalUpdated"
              :btnTitle="$t('common.buttons.editProfessional')"
              :items="editingProfessional"
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
import AddProfessionalsForm from '@/components/AddProfessionalsForm.vue'
import professionsData from '@/assets/data/professions.json'
import { useI18n } from 'vue-i18n'
import { get } from '@/services/api'
import AlertMessage from '@/components/AlertMessage.vue'

const alert = reactive({
  show: false,
  type: 'success',
  messageCode: '',
  message: '',
})
const { t, locale } = useI18n()
const dialog = ref(false) //Modal de edición
const edit = ref(false) // Variable para controlar el modo de edición
const editingProfessional = ref(null) //Profesional a editar
const professionals = ref([]) //Todos los profesionales
const loading = ref(false)
const error = ref('')
const headers = computed(() => [
  { title: t('common.forms.actions'), key: 'actions' },
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

// Helper robusto: string u objeto por idioma -> string legible
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

const fetchProfessionals = async () => {
  loading.value = true
  error.value = ''
  try {
    const resp = await get('/professionals') // { success, messageCode, data }
    const arr = Array.isArray(resp?.data) ? resp.data : (resp?.data?.items ?? [])
    professionals.value = arr
  } catch (e) {
    professionals.value = []
    error.value = e.message || 'Error desconocido'
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfessionals)

const handleProfessionalAdded = () => {
  fetchProfessionals()
}

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

async function onEdit(id) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/professionals/${id}/edit`)

    if (!res.ok) {
      throw new Error('No se pudo cargar el profesional')
    }

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
    console.error('Error al cargar profesional:', error)
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
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/professionals/${id}/delete`, {
      method: 'PUT',
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || 'Error al eliminar')
    }

    const data = await res.json()
    console.log(data)
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
