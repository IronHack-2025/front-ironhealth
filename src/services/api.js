const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

async function handleResponse(response) {
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

      // NEW: si por algún motivo el backend devuelve success:false con 200
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
      // NEW: si el backend devuelve un array plano (o un primitivo), lo envolvemos en { success, data }
      if (Array.isArray(data) || data === null || typeof data !== 'object') {
        return {
          success: true,
          data,
          messageCode: 'OPERATION_SUCCESS',
          messageType: 'success',
        }
      }

      // NEW: objeto sin messageCode ni success -> asumimos payload directo y lo envolvemos en data
      return {
        success: true,
        data,
        messageCode: 'OPERATION_SUCCESS',
        messageType: 'success',
      }
    } catch {
      // Si no se puede parsear JSON, asumir éxito simple
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

      // Crear error estructurado con código de mensaje
      const error = new Error(errorData.error || 'API request failed')
      error.messageCode = errorData.messageCode || 'INTERNAL_SERVER_ERROR'
      error.messageType = 'error'
      error.details = errorData.details || null
      error.statusCode = response.status

      throw error
    } catch {
      // Si no se puede parsear el JSON del error
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      error.messageCode = 'INTERNAL_SERVER_ERROR'
      error.messageType = 'error'
      error.statusCode = response.status

      throw error
    }
  }
}

export const post = async (endpoint, data) => {
  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // More headers, token etc.
      },
      body: JSON.stringify(data),
    })

    return handleResponse(response)
  } catch (error) {
    // Si es un error de red o fetch (no tiene messageCode)
    if (!error.messageCode) {
      error.messageCode = 'NETWORK_ERROR'
      error.messageType = 'error'
    }
    throw error
  }
}

// NEW: GET con el mismo manejo de respuestas y errores
export const get = async (endpoint) => {
  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`)
    return handleResponse(response)
  } catch (error) {
    if (!error.messageCode) {
      error.messageCode = 'NETWORK_ERROR'
      error.messageType = 'error'
    }
    throw error
  }
}
