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
                :placeholder="searchPlaceholder"
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

          <v-alert v-if="error" type="error" variant="tonal" class="mx-4 mt-4">
            {{ error }}
          </v-alert>

          <v-data-table
            :headers="headers"
            :items="items"
            :loading="loading"
            :search="search"
            :loading-text="loadingText"
            :no-data-text="noDataText"
            class="rounded-b-xl"
            hover
            density="comfortable"
            fixed-header
            height="500px"
          >
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  title: { type: String, default: 'Listado' },
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  headers: { type: Array, required: true },
  loadingText: { type: String, default: 'Cargando...' },
  noDataText: { type: String, default: 'No se encontraron resultados' },
  searchPlaceholder: { type: String, default: 'Buscar...' }
})
const search = ref('')

</script>
