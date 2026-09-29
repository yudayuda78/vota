const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export { API_BASE_URL }

export async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`)
  if (!res.ok) throw new Error(`API GET /${endpoint} failed: ${res.status}`)
  return res.json()
}

export async function apiPost(endpoint, data) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`API POST /${endpoint} failed: ${res.status}`)
  return res.json()
}