const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const getAuthToken = () => {
  return localStorage.getItem('authToken') || localStorage.getItem('token')
}
const getAuthHeaders = () => {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

// Manejo centralizado de respuestas

async function handleResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
    const error = new Error('Token expired or invalid')
    error.messageCode = 'INVALID_TOKEN'
    error.messageType = 'error'
    error.statusCode = 401
    throw error
  }
  
  if (response.status === 403) {
    const error = new Error('Insufficient permissions')
    error.messageCode = 'INSUFFICIENT_PERMISSIONS'
    error.messageType = 'error'
    error.statusCode = 403
    throw error
  }

  if (response.ok) {
    // Solo para respuestas realmente vacías (204 No Content)
    if (response.status === 204) {
      return {
        success: true,
        messageCode: 'OPERATION_SUCCESS',
        messageType: 'success',
      }
    }

    // Para todas las demás respuestas exitosas, intentar parsear JSON
    try {
      const data = await response.json()

      // Si el backend (por error) manda success:false con 200, lo tratamos como error lógico
      if (data && data.success === false) {
        const error = new Error('API logical error')
        error.messageCode = data.messageCode || 'INTERNAL_SERVER_ERROR'
        error.messageType = 'error'
        error.details = data.details || null
        error.statusCode = 200
        throw error
      }

      // Si la respuesta incluye messageCode del backend
      if (data && data.messageCode) {
        return {
          ...data,
          messageType: 'success',
        }
      }

      // Respuesta legacy sin messageCode
      // Si el backend devuelve un array plano (listado), lo envolvemos como { success, data }
      if (Array.isArray(data) || data === null || typeof data !== 'object') {
        return {
          success: true,
          data,
          messageCode: 'OPERATION_SUCCESS',
          messageType: 'success',
        }
      }

      // Objeto sin messageCode -> asumimos payload directo y lo envolvemos en data
      return {
        success: true,
        data,
        messageCode: 'OPERATION_SUCCESS',
        messageType: 'success',
      }
    } catch {
      // Si no se puede parsear JSON, asumir un éxito simple
      return {
        success: true,
        messageCode: 'OPERATION_SUCCESS',
        messageType: 'success',
      }
    }
  } else {
    // Manejar errores HTTP
    try {
      const errorData = await response.json()
      console.error('❌ API Error Response:', errorData)
      
      // ¡IMPORTANTE! Mostrar los detalles de validación
      if (errorData.details && Array.isArray(errorData.details)) {
        console.error('📋 Validation Details:', errorData.details)
      }

      // Crear error estructurado con código de mensaje
      const error = new Error(errorData.message || errorData.error || 'API request failed')
      error.messageCode = errorData.messageCode || 'API_ERROR'
      error.messageType = 'error'
      error.details = errorData.details || errorData
      error.statusCode = response.status

      throw error
    } catch (parseError) {
      // Si parseError es nuestro error estructurado, re-lanzarlo
      if (parseError.messageCode) {
        throw parseError
      }
      
      console.error('❌ Could not parse error response:', parseError)
      
      // Si no se puede parsear el JSON del error
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      error.messageCode = 'HTTP_ERROR'
      error.messageType = 'error'
      error.statusCode = response.status

      throw error
    }
  }
}

export const post = async (endpoint, data) => {
  try {
    console.log('🚀 POST Request Details:')
    console.log('URL:', `${apiBaseUrl}${endpoint}`)
    console.log('Headers:', getAuthHeaders())
    console.log('Body Data:', data)
    console.log('Body JSON:', JSON.stringify(data))

    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })

    console.log('📥 Response Status:', response.status)
    console.log('📥 Response Headers:', [...response.headers.entries()])

    return await handleResponse(response)
  } catch (error) {
    console.error('❌ POST Error:', error)
    // Si es un error de red o fetch (no tiene messageCode)
    if (!error.messageCode) {
      error.messageCode = 'NETWORK_ERROR'
      error.messageType = 'error'
    }
    throw error
  }
}

// Añadimos GET con el mismo manejo
export const get = async (endpoint) => {
  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`,{
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      }
    })
    return handleResponse(response)
  } catch (error) {
    if (!error.messageCode) {
      error.messageCode = 'NETWORK_ERROR'
      error.messageType = 'error'
    }
    throw error
  }
}
