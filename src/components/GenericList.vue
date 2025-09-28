<template>
  <v-container fluid>
    <v-row justify="center">
      <v-col cols="12">
        <v-card class="elevation-6 rounded-xl">
          <v-toolbar flat color="primary" class="rounded-t-xl">
            <v-toolbar-title class="text-white">
              {{ title }}
            </v-toolbar-title>
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

          <AlertMessage
            v-if="alert.show"
            :show="alert.show"
            :type="alert.type"
            :message-code="alert.messageCode"
            :message="alert.message"
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

            <!-- Botones según lo que enviemos por props -->
            <template v-slot:item.actions="{ item }">
              <v-btn
                v-if="canEdit"
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="primary"
                @click="$emit('edit', item._id || item.id)"
              />
              <v-btn
                v-if="canDelete"
                icon="mdi-delete"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
              />
            </template>
          </v-data-table>

          <!-- Modal de confirmación de eliminación -->
          <v-dialog v-model="deleteDialog" max-width="500">
            <v-card>
              <v-card-title class="text-h6">
                {{ $t('common.confirmations.deleteTitle') }}
              </v-card-title>
              <v-card-text>
                {{ $t('common.confirmations.deleteMessage') }}
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn text @click="deleteDialog = false">
                  {{ $t('common.buttons.cancel') }}
                </v-btn>
                <v-btn color="error" @click="executeDelete">
                  {{ $t('common.buttons.delete') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import AlertMessage from './AlertMessage.vue'

const { t } = useI18n()
const alert = reactive({
  show: false,
  type: 'success',
  messageCode: '',
  message: '',
})
const emit = defineEmits(['refresh', 'edit', 'delete'])

const props = defineProps({
  title: { type: String, default: '' },
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  headers: { type: Array, required: true },
  loadingText: { type: String, default: '' },
  noDataText: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },
  canEdit: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
  form: { type: String, default: '' },
})
const search = ref('')
const deleteDialog = ref(false)
const itemToDelete = ref(null)

// Funciones para el modal de eliminación
const confirmDelete = (item) => {
  itemToDelete.value = item
  deleteDialog.value = true
}

const executeDelete = () => {
  if (itemToDelete.value) {
    emit('delete', itemToDelete.value._id || itemToDelete.value.id)
  }
  deleteDialog.value = false
  itemToDelete.value = null
}
</script>
