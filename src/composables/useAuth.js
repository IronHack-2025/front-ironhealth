import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { post } from '@/services/api'

// Estado global reactivo
const authToken = ref(localStorage.getItem('authToken') || null)
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const userRole = ref(localStorage.getItem('userRole') || null)
const loading = ref(false)
const loginError = ref(null)

export function useAuth() {
  const router = useRouter()

  // Computed properties
  const isAuthenticated = computed(() => !!authToken.value)
  const isAdmin = computed(() => userRole.value === 'admin')
  const isProfessional = computed(() => userRole.value === 'professional')

  // Watchers para sincronizar con localStorage
  watch(authToken, (newToken) => {
    if (newToken) {
      localStorage.setItem('authToken', newToken)
    } else {
      localStorage.removeItem('authToken')
    }
  })

  watch(user, (newUser) => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('user')
    }
  }, { deep: true })

  watch(userRole, (newRole) => {
    if (newRole) {
      localStorage.setItem('userRole', newRole)
    } else {
      localStorage.removeItem('userRole')
    }
  })

  // Función de login
  async function login(credentials) {
    loading.value = true
    loginError.value = null

    try {
      const response = await post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      })

      const { data } = response
      
      // Establecer estado de autenticación
      authToken.value = data.token
      user.value = data.user
      userRole.value = data.user?.role || null
      
      // También guardar profileId y userId si existen
      if (data.user?.profileId) {
        localStorage.setItem('profileId', data.user.profileId)
      }
      if (data.user?.id) {
        localStorage.setItem('userId', data.user.id)
      }

      return {
        success: true,
        data: data
      }

    } catch (error) {
      console.error('Login error:', error)
      
      // ✅ Mapear errores específicos de login
      let errorCode = error.messageCode || 'LOGIN_FAILED'
      
      // Si es un 401 en login, siempre mostrar credenciales inválidas
      if (error.statusCode === 401) {
        errorCode = 'INVALID_CREDENTIALS'
      }
      
      loginError.value = errorCode
      
      return {
        success: false,
        error: errorCode
      }
    } finally {
      loading.value = false
    }
  }

  // Función de logout mejorada usando services/api
  async function logout() {
    try {
      // 1. Llamar al endpoint de logout del backend usando el servicio API
      if (authToken.value) {
        await post('/auth/logout').catch((error) => {
          console.warn('Error calling logout endpoint:', error)
          // Continuar con el logout local aunque falle el backend
        })
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // 2. Limpiar estado reactivo (esto automáticamente limpia localStorage)
      authToken.value = null
      user.value = null
      userRole.value = null
      loginError.value = null
      
      // 3. Limpiar otros datos relacionados
      localStorage.removeItem('profileId')
      localStorage.removeItem('userId')
      localStorage.removeItem('token') // Por compatibilidad
      
      // 4. Limpiar cookies si las usas
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // 5. Redirigir a login
      router.push('/login')
    }
  }

  // Función para limpiar errores de login
  function clearLoginError() {
    loginError.value = null
  }

  // Función para verificar permisos
  function hasPermission(requiredRole) {
    if (!isAuthenticated.value) return false
    if (requiredRole === 'admin') return isAdmin.value
    if (requiredRole === 'professional') return isProfessional.value || isAdmin.value
    return true
  }

  // Función para inicializar el estado desde localStorage
  function initializeAuth() {
    const storedToken = localStorage.getItem('authToken')
    const storedUser = localStorage.getItem('user')
    const storedRole = localStorage.getItem('userRole')
    
    if (storedToken) authToken.value = storedToken
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Error parsing user from localStorage:', e)
        localStorage.removeItem('user')
      }
    }
    if (storedRole) userRole.value = storedRole
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
    initializeAuth
  }
}
