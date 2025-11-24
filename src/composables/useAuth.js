import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { post } from '@/services/api'

// 📝 Constantes para claves de localStorage (fuente única de verdad)
const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  USER_ROLE: 'userRole',
  PROFILE_ID: 'profileId',
  USER_ID: 'userId',
})
// Estado global reactivo
const authToken = ref(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null)
const user = ref(JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'))
const userRole = ref(localStorage.getItem(STORAGE_KEYS.USER_ROLE) || null)
const loading = ref(false)
const loginError = ref(null)

// 🔧 Helper para manejo seguro de localStorage
const storage = {
  set(key, value) {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value)
      }
    } catch (error) {
      console.warn(`Failed to set localStorage key "${key}":`, error)
    }
  },

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue

      // Intentar parsear como JSON, si falla devolver string
      try {
        return JSON.parse(item)
      } catch {
        return item
      }
    } catch (error) {
      console.warn(`Failed to get localStorage key "${key}":`, error)
      return defaultValue
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Failed to remove localStorage key "${key}":`, error)
    }
  },

  clear() {
    Object.values(STORAGE_KEYS).forEach((key) => this.remove(key))
    // Limpiar cookies
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  },
}

export function useAuth() {
  const router = useRouter()

  // Computed properties
  const isAuthenticated = computed(() => !!authToken.value)
  const isAdmin = computed(() => userRole.value === 'admin')
  const isProfessional = computed(() => userRole.value === 'professional')

  // 🔄 Watchers unificados con helper
  watch(authToken, (newToken) => storage.set(STORAGE_KEYS.AUTH_TOKEN, newToken))
  watch(user, (newUser) => storage.set(STORAGE_KEYS.USER, newUser), { deep: true })
  watch(userRole, (newRole) => storage.set(STORAGE_KEYS.USER_ROLE, newRole))

  // 🏠 Helper para obtener headers de autenticación
  function getAuthHeaders() {
    return authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
  }

  // Función de login
  async function login(credentials) {
    loading.value = true
    loginError.value = null

    try {
      const response = await post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      })

      const { data } = response

      // ✅ Usar helper unificado para establecer estado
      authToken.value = data.token
      user.value = data.user
      userRole.value = data.user?.role || null

      // Guardar IDs adicionales con helper
      if (data.user?.profileId) {
        storage.set(STORAGE_KEYS.PROFILE_ID, data.user.profileId)
      }
      if (data.user?.id) {
        storage.set(STORAGE_KEYS.USER_ID, data.user.id)
      }

      return { success: true, data }
    } catch (error) {
      console.error('Login error:', error)

      let errorCode = error.messageCode || 'LOGIN_FAILED'
      if (error.statusCode === 401) {
        errorCode = 'INVALID_CREDENTIALS'
      }

      loginError.value = errorCode
      return { success: false, error: errorCode }
    } finally {
      loading.value = false
    }
  }

  // Función de logout mejorada
  async function logout() {
    try {
      if (authToken.value) {
        try {
          console.info('🔄 Attempting server logout...')
          await post('/auth/logout')
          console.info('✅ Server logout successful')
        } catch (error) {
          if (error.statusCode === 401 || error.messageCode === 'INVALID_TOKEN') {
            console.info('ℹ️ Token already expired - server logout not needed')
          } else if (error.messageCode === 'NETWORK_ERROR') {
            console.info('ℹ️ Network error during logout - proceeding with local cleanup only')
          } else {
            console.info(`ℹ️ Server logout error - proceeding with local cleanup`)
          }
        }
      }
    } finally {
      // ✅ Limpiar estado reactivo
      authToken.value = null
      user.value = null
      userRole.value = null
      loginError.value = null

      // ✅ Usar helper unificado para limpiar storage
      storage.clear()

      router.push('/')
    }
  }

  function clearLoginError() {
    loginError.value = null
  }

  function hasPermission(requiredRoles) {
    if (!isAuthenticated.value) return false

    if (Array.isArray(requiredRoles)) {
      return requiredRoles.some((role) => {
        if (role === 'admin') return isAdmin.value
        if (role === 'professional') return isProfessional.value || isAdmin.value
        if (role === 'patient') return userRole.value === 'patient'
        return false
      })
    }

    if (requiredRoles === 'admin') return isAdmin.value
    if (requiredRoles === 'professional') return isProfessional.value || isAdmin.value
    if (requiredRoles === 'patient') return userRole.value === 'patient'

    return false
  }

  // Función para manejar la expiración de sesión
  function handleSessionExpired() {
    // Limpiar estado reactivo
    authToken.value = null
    user.value = null
    userRole.value = null
    loginError.value = null

    // Limpiar storage
    storage.clear()

    // Redirigir a login solo si no estamos ya en la página de login
    if (router.currentRoute.value.name !== 'login') {
      router.push('/login')
    }
  }

  // ✅ Función de inicialización mejorada
  function initializeAuth() {
    authToken.value = storage.get(STORAGE_KEYS.AUTH_TOKEN)
    user.value = storage.get(STORAGE_KEYS.USER)
    userRole.value = storage.get(STORAGE_KEYS.USER_ROLE)
  }

  return {
    // Estado
    authToken,
    user,
    userRole,
    loading,
    loginError,

    // Computed
    isAuthenticated,
    isAdmin,
    isProfessional,

    // Métodos
    login,
    logout,
    clearLoginError,
    hasPermission,
    initializeAuth,
    getAuthHeaders,
    handleSessionExpired,

    // ✅ Constantes para tests y consistencia
    STORAGE_KEYS,
  }
}
