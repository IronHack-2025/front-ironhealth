<script setup>
import { useI18n } from 'vue-i18n'
import { watch } from 'vue'

// Configuración de i18n
const { t, locale } = useI18n()

// Props para v-model
const props = defineProps({
  modelValue: String,
})

const emit = defineEmits(['update:modelValue'])

// Opciones de idioma
const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

// Si el padre cambia el v-model desde fuera, sincronizamos el i18n.locale
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal && newVal !== locale.value) {
      locale.value = newVal // Añadido (sincronización)
    }
  },
)

// Función para manejar cambios
const handleLanguageChange = (newValue) => {
  locale.value = newValue
  localStorage.setItem('lang', newValue) // Añadido (persistencia)
  emit('update:modelValue', newValue)
}
</script>

<template>
  <div class="language-selector">
    <v-select
      prepend-icon="mdi-translate"
      :model-value="locale"
      @update:model-value="handleLanguageChange"
      :items="languages"
      item-title="label"
      item-value="code"
      variant="outlined"
      density="compact"
    ></v-select>
  </div>
</template>

<style scoped>
.language-selector {
  margin-top: 1.5rem;
}
</style>
