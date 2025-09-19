const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

async function handleResponse(response) {
  if (response.ok) {
    // Solo para respuestas realmente vacías (204 No Content)
    if (response.status === 204) {
      return { 
        success: true,
        messageCode: 'OPERATION_SUCCESS',
        messageType: 'success'
      }
    }
    
    // Para todas las demás respuestas exitosas, intentar parsear JSON
    try {
      const data = await response.json()
      
      // Si la respuesta incluye messageCode del backend
      if (data.messageCode) {
        return {
          ...data,
          messageType: 'success'
        }
      }
      
      // Respuesta legacy sin messageCode
      return {
        ...data,
        messageCode: 'OPERATION_SUCCESS',
        messageType: 'success'
      }
    } catch (parseError) {
      // Si no se puede parsear JSON, asumir éxito simple
      return {
        success: true,
        messageCode: 'OPERATION_SUCCESS',
        messageType: 'success'
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
    } catch (parseError) {
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