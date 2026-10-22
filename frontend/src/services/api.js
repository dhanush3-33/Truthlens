const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001').replace(/\/$/, '')

export async function fetchHealth(signal) {
  const res = await fetch(`${API_BASE}/api/health`, { signal })
  if (!res.ok) throw new Error(`Health check failed (HTTP ${res.status})`)
  return res.json()
}

export async function analyzeClaim(text, signal) {
  let res
  try {
    res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('Could not reach the TruthLens backend. Is the Flask server running?')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    throw new Error('The server returned an unreadable response.')
  }

  if (!res.ok || !data.ok) {
    const message = data?.error?.message || `Analysis failed (HTTP ${res.status}).`
    const error = new Error(message)
    error.code = data?.error?.code || 'unknown'
    throw error
  }
  return data
}

export { API_BASE }
