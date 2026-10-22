import { useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import HistoryDrawer from './components/HistoryDrawer.jsx'
import Home from './pages/Home.jsx'
import { fetchHealth } from './services/api.js'

const HISTORY_KEY = 'truthlens_history_v1'

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function App() {
  const [health, setHealth] = useState(null)
  const [history, setHistory] = useState(loadHistory)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchHealth(controller.signal)
      .then(setHealth)
      .catch(() => setHealth(null))
    return () => controller.abort()
  }, [])

  const rerun = (text) => {
    setHistoryOpen(false)
    window.dispatchEvent(new CustomEvent('truthlens:rerun', { detail: text }))
  }

  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar onOpenHistory={() => setHistoryOpen(true)} historyCount={history.length} />
      <Home health={health} history={history} setHistory={setHistory} />
      <HistoryDrawer
        open={historyOpen}
        items={history}
        onClose={() => setHistoryOpen(false)}
        onRerun={rerun}
        onClear={clearHistory}
      />
    </div>
  )
}
