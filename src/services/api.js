const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

async function handleResponse(response) {
  if (response.ok) {
    if (response.status === 204 || response.status === 201 || response.headers.get('Content-Length') === '0') {
      return { success: true }
    }
    return response.json()
  } else {
    const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }))
    throw new Error(errorData.error || 'API request failed')
  }
}

export const post = async (endpoint, data) => {
  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // More headers, token etc.
    },
    body: JSON.stringify(data),
  })

  return handleResponse(response)
}
