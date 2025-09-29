<template>
  <div class="cloudinary-upload">
    <v-btn color="grey" @click="openWidget">
      {{ buttonText }}
    </v-btn>
    <div v-if="imageUrl" class="mt-3">
      <v-img :src="imageUrl" alt="Imagen subida" max-width="200" class="rounded" />
      <v-btn color="red" size="small" class="mt-2" @click="clearImage"> Quitar imagen </v-btn>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const props = defineProps({
  buttonText: { type: String, default: 'Subir Imagen' },
  preset: { type: String, required: true }, // tu uploadPreset (signed)
  folder: { type: String, default: 'uploads' },
  apiUrl: { type: String, default: 'http://localhost:3000/api/signature' }, // endpoint firma
})
const emit = defineEmits(['uploaded', 'cleared'])
const imageUrl = ref('')
// Abrir el widget firmado
const openWidget = async () => {
  try {
    // Obtener firma del backend
    const res = await fetch(`${props.apiUrl}?folder=${props.folder}`)
    const { cloudName, apiKey, signature, timestamp } = await res.json()
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        apiKey,
        uploadSignature: (cb) => cb({ signature, timestamp }),
        uploadPreset: props.preset,
        folder: props.folder,
        multiple: false,
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          imageUrl.value = result.info.secure_url
          emit('uploaded', imageUrl.value)
        }
      },
    )
    widget.open()
  } catch (err) {
    console.error('Error al abrir widget', err)
  }
}
const clearImage = () => {
  imageUrl.value = ''
  emit('cleared')
}
defineExpose({ clearImage })
</script>
<style scoped>
.cloudinary-upload {
  display: flex;
  flex-direction: column;
}
</style>
