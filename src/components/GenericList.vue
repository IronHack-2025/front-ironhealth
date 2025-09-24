<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12">
        <v-card class="elevation-6 rounded-xl">
          <v-toolbar flat color="primary" class="rounded-t-xl">
            <v-toolbar-title class="text-white">{{ title }}</v-toolbar-title>
            <v-spacer />
            <v-col cols="12" sm="6" md="4" class="d-flex justify-end">
              <v-text-field
                v-model="search"
                :placeholder="searchPlaceholder || $t('common.search.placeholder')"
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

          <Alert
            v-if="error"
            :show="true"
            type="error"
            :messageCode="error"
            :fallbackMessage="error"
            class="mx-4 mt-4"
          />

          <v-data-table
            :headers="headers"
            :items="items"
            :loading="loading"
            :search="search"
            :loading-text="loadingText || $t('common.messages.loading')"
            :no-data-text="noDataText || $t('common.messages.noData')"
            :items-per-page-text="$t('common.pagination.itemsPerPage')"
            class="rounded-b-xl"
            hover
            density="comfortable"
            fixed-header
            height="500px"
          >
            <!-- Slot para renderizar la imageUrln -->
            <template v-slot:item.imageUrl="{ item }">
              <v-avatar size="70">
                <v-img :src="item.imageUrl" alt="Foto paciente" />
              </v-avatar>
            </template>

            <template v-slot:item.actions="{ item }">
              <ItemActions :id="item._id || item.id" @edit="onEdit" @delete="onDelete" />
            </template>
          </v-data-table>
          <v-dialog v-model="dialog" max-width="800px" persistent>
            <v-card class="elevation-6 rounded-xl pa-2">
              <v-btn icon @click="dialog = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <!-- Adaptar el componente? -->
              <v-card-text class="pa-0">
                <AddProfessionalsForm
                  @professional-added="handleProfessional"
                  @professional-updated="handleUpdate"
                  :btnTitle="
                    edit
                      ? $t('common.buttons.editProfessional')
                      : $t('common.buttons.registerProfessional')
                  "
                  :items="editingProfessional"
                  :mode="edit ? 'edit' : 'create'"
                />
              </v-card-text>
            </v-card>
          </v-dialog>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Alert from './AlertMessage.vue'
import ItemActions from './ItemActions.vue'
import AddProfessionalsForm from './AddProfessionalsForm.vue'

const { t } = useI18n()

const emit = defineEmits(['refresh'])

const props = defineProps({
  title: { type: String, default: '' },
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  headers: { type: Array, required: true },
  loadingText: { type: String, default: '' },
  noDataText: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },
})
let edit = ref(false)
const search = ref('')
const dialog = ref(false)
const editingProfessional = ref(null)

async function onEdit(id) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/professionals/${id}/edit`)
    
    if (!res.ok) throw new Error('No se pudo cargar el profesional')
    const response = await res.json()
    
    // Extraer los datos del profesional desde response.data
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
  }
}

function openCreateForm() {
  editingProfessional.value = null
  edit.value = false   // 🔹 vuelve a modo registro
  dialog.value = true
}

function handleProfessional() {
  dialog.value = false
  emit('refresh')
}

function handleUpdate() {
  dialog.value = false
  emit('refresh')
}

async function onDelete(id) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/professionals/${id}/delete`, {
      method: 'PUT',
    })
    const data = await res.json()
    emit('refresh')
  } catch (error) {
    console.error('Error al eliminar profesional:', error)
  }
}
</script>
