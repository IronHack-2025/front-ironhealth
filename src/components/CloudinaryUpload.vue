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
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadSignatureURL: props.apiUrl,
        uploadPreset: props.preset,
        folder: props.folder,
        multiple: false,
        resourceType: 'image',
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowBackButton: true,
        croppingValidateDimensions: true,
        showAdvancedOptions: true,
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
