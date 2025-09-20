<template>
  <div class="container">
    <div class="left">
      <AddProfessionalsForm @professional-added="handleProfessionalAdded" />
    </div>
    <div class="rigth">
      <GenericList :title="$t('views.professionals.listTitle')" :items="professionals" :headers="headers"
        :loading="loading" :error="error" :search-placeholder="$t('common.forms.search')" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import GenericList from '@/components/GenericList.vue'
import AddProfessionalsForm from '@/components/AddProfessionalsForm.vue'
import professionsData from '@/assets/data/professions.json'
import { useI18n } from 'vue-i18n'
import { get } from '@/services/api'

const { t, locale } = useI18n()

const professionals = ref([])
const loading = ref(false)
const error = ref('')

function getProfessionName(code) {
  for (const p of professionsData.professions) {
    if (p.code === code) return p.text[locale.value] || p.text.en
  }
  return '—'
}

function getSpecialtyName(code) {
  for (const p of professionsData.professions) {
    const found = p.specialty?.find((s) => s['specialty-code'] === code)
    if (found) return found['specialty-name']?.[locale.value] || found['specialty-name'].en
  }
  return '—'
}

const headers = computed(() => [
  { title: t('common.forms.firstName'), key: 'firstName' },
  { title: t('common.forms.lastName'), key: 'lastName' },
  { title: t('common.forms.email'), key: 'email' },
  {
    title: t('common.forms.profession'),
    key: 'profession',
    value: (item) => getProfessionName(item.profession),
  },
  {
    title: t('common.forms.specialty'),
    key: 'specialty',
    value: (item) => getSpecialtyName(item.specialty),
  },

])

const fetchProfessionals = async () => {
  loading.value = true
  error.value = ''
  try {
    // Usa el servicio GET (sobre estándar)
    const resp = await get('/professionals') // { success, messageCode?, data }
    const arr = Array.isArray(resp?.data) ? resp.data : (resp?.data?.items ?? [])
    professionals.value = arr
  } catch (e) {
    professionals.value = []
    const code = e.messageCode || 'INTERNAL_SERVER_ERROR'
    error.value = t(`messages.error.${code}`) // muestra el texto i18n si existe
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfessionals)

const handleProfessionalAdded = () => {
  fetchProfessionals()
}

</script>

<!-- <style scoped>
.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.left .right {
  padding: 20px;
  overflow-y: auto;
}
</style> -->
