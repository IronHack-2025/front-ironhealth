<template>
  <div class="d-flex gap-2">
    <!-- Ver detalle -->
    <v-btn
      v-if="showView"
      icon="mdi-eye"
      size="small"
      variant="text"
      color="info"
      @click="$emit('view', id)"
    />

    <!-- Editar -->
    <v-btn
      v-if="showEdit"
      icon="mdi-pencil"
      size="small"
      variant="text"
      color="primary"
      @click="$emit('edit', id)"
    />

    <!-- Descargar -->
    <v-btn
      v-if="showDownload"
      icon="mdi-download"
      size="small"
      variant="text"
      color="success"
      @click="$emit('download', id)"
    />

    <!-- Activar/Desactivar -->
    <v-btn
      v-if="showToggle"
      icon="mdi-toggle-switch"
      size="small"
      variant="text"
      color="warning"
      @click="$emit('toggle', id)"
    />

    <!-- Eliminar -->
    <v-btn
      v-if="showDelete"
      icon="mdi-delete"
      size="small"
      variant="text"
      color="error"
      @click="dialog = true"
    />

    <v-dialog v-model="dialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Confirmar eliminación</v-card-title>
        <v-card-text> ¿Estás seguro de que quieres eliminar este elemento? </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn text @click="dialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="confirmDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  id: { type: [String, Number], required: true },
  showView: { type: Boolean, default: true },
  showEdit: { type: Boolean, default: true },
  showDelete: { type: Boolean, default: true },
  showDownload: { type: Boolean, default: false },
  showToggle: { type: Boolean, default: false },
})

const emit = defineEmits(['view', 'edit', 'delete', 'download', 'toggle'])

const dialog = ref(false)

function confirmDelete() {
  emit('delete', props.id)
  dialog.value = false
}
</script>
