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
            :headers="localHeaders"
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
            :item-key="idField"
            :class="{'gl-clickable': rowClickEnabled}"
            @click:row="onRowClick"
          >
            <template v-slot:item.imageUrl="{ item }">
              <v-avatar size="70">
                <v-img :src="item.imageUrl" alt="Foto paciente" />
              </v-avatar>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Alert from './AlertMessage.vue'

const { t } = useI18n()
const router = useRouter()

const props = defineProps({
  title: { type: String, default: '' },
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  headers: { type: Array, required: true },
  loadingText: { type: String, default: '' },
  noDataText: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },

  // Navegación por fila
  itemRoutePrefix: { type: String, default: '' }, // p.ej. '/patients'
  routeName: { type: String, default: '' },       // p.ej. 'PatientDetail'
  idField: { type: String, default: '_id' },
  rowClickable: { type: Boolean, default: true },
})

const rowClickEnabled = computed(() =>
  props.rowClickable && (!!props.itemRoutePrefix || !!props.routeName)
)

const localHeaders = computed(() => {
  const incoming = Array.isArray(props.headers) ? props.headers : []
  return incoming.map(h => {
    const text = h.title || h.text || h.label || ''
    const value = h.key || h.value || h.field || ''
    const copy = { ...h, text, value }
    delete copy.title
    delete copy.key
    delete copy.field
    return copy
  })
})

function navigateTo(record) {
  const id = record?.[props.idField]
  if (!id) return
  if (props.routeName) {
    router.push({ name: props.routeName, params: { id } })
  } else if (props.itemRoutePrefix) {
    router.push(`${props.itemRoutePrefix}/${id}`)
  }
}

function onRowClick(_event, row) {
  if (!rowClickEnabled.value) return
  // Soporta distintas formas de Vuetify 3
  const record = row?.item?.raw ?? row?.item ?? row?.raw ?? row
  navigateTo(record)
}
</script>

<style scoped>
.gl-clickable :deep(tbody tr) {
  cursor: pointer;
}
</style>
