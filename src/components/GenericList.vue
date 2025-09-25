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
                @click="$emit('delete', item._id || item.id)"
              />
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
                  :btnTitle="$t('common.buttons.editProfessional')"
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
})
const search = ref('')
</script>
