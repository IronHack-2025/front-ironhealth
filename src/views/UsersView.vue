<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import GenericList from '@/components/GenericList.vue'
import { get } from '@/services/api'

const { t } = useI18n()

// Estado reactivo
const rawUsers = ref([])
const loading = ref(false)
const error = ref('')

// Computed para procesar los usuarios con traducciones reactivas
const users = computed(() =>
  rawUsers.value.map((user) => ({
    ...user,
    isActive: user.isActive ? t('common.yes') : t('common.no'),
    createdAt: new Date(user.createdAt).toLocaleDateString(),
    role: t(`views.users.roles.${user.role}`),
  })),
)

// Configuración reactiva de headers para la tabla de usuarios
const headers = computed(() => [
  {
    title: t('views.users.table.email'),
    key: 'email',
    align: 'start',
    sortable: true,
  },
  {
    title: t('views.users.table.role'),
    key: 'role',
    align: 'center',
    sortable: true,
  },
  {
    title: t('views.users.table.isActive'),
    key: 'isActive',
    align: 'center',
    sortable: true,
  },
  {
    title: t('views.users.table.createdAt'),
    key: 'createdAt',
    align: 'center',
    sortable: true,
  },
])

// Función para obtener los usuarios
const fetchUsers = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await get('/users')

    // Almacenar los datos sin procesar
    rawUsers.value = response.data
  } catch (err) {
    console.error('Error fetching users:', err)
    error.value = err.messageCode || 'FETCH_USERS_FAILED'
  } finally {
    loading.value = false
  }
}

// Cargar usuarios al montar el componente
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <GenericList
    :title="t('views.users.title')"
    :items="users"
    :headers="headers"
    :loading="loading"
    :error="error"
    :search-placeholder="t('views.users.searchPlaceholder')"
    :loading-text="t('common.messages.loading')"
    :no-data-text="t('views.users.noData')"
  />
</template>
