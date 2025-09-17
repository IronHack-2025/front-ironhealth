<script setup>
import { useI18n } from 'vue-i18n'

// Configuración de i18n
const { t, locale } = useI18n()

// Props para v-model
const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

// Opciones de idioma
const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' }
]

// Función para manejar cambios
const handleLanguageChange = (newValue) => {
  locale.value = newValue
  emit('update:modelValue', newValue)
}

</script>

<template>
<div class="language-selector">
    <v-select
        :model-value="locale"
        @update:model-value="handleLanguageChange"
        :items="languages"
        item-title="label"
        item-value="code"
        :label="t('navbar.selectLang')"
        variant="outlined"
        density="compact"
    ></v-select>
</div>

</template>

<style scoped>
.language-selector {
  margin-bottom: 1rem;
}
</style>