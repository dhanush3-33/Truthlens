import { useCallback, useEffect, useRef, useState } from 'react'
import { Zap, Database, Scale, ShieldAlert, ScanSearch } from 'lucide-react'
import ClaimInput from '../components/ClaimInput.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import AnalysisPanel from '../components/AnalysisPanel.jsx'
import EvidencePanel from '../components/EvidencePanel.jsx'
import VerdictPanel from '../components/VerdictPanel.jsx'
import Disclaimer from '../components/Disclaimer.jsx'
import { analyzeClaim, fetchHealth } from '../services/api.js'

const HISTORY_KEY = 'truthlens_history_v1'
const MAX_HISTORY = 20

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function Home({ health, history, setHistory }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const resultsRef = useRef(null)

  const persistHistory = useCallback((next) => {
    setHistory(next)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    } catch {
      /* storage full or blocked — history is optional */
    }
  }, [setHistory])

  const runAnalysis = useCallback(
    async (inputText) => {
      const value = (inputText ?? text).trim()
      if (!value) return
      setLoading(true)
      setError(null)
      setResult(null)
      try {
        const data = await analyzeClaim(value)
        setResult(data)
        const entry = {
          id: `${Date.now()}`,
          createdAt: new Date().toISOString(),
          text: value,
          claim: data.analysis?.central_claim || value.slice(0, 140),
          verdict: data.verdict?.verdict || 'Unverified',
        }
        persistHistory([entry, ...history].slice(0, MAX_HISTORY))
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message)
      } finally {
        setLoading(false)
      }
    },
    [text, history, persistHistory],
  )

  useEffect(() => {
    const handler = (e) => {
      const value = typeof e.detail === 'string' ? e.detail : ''
      if (!value) return
      setText(value)
      runAnalysis(value)
    }
    window.addEventListener('truthlens:rerun', handler)
    return () => window.removeEventListener('truthlens:rerun', handler)
  }, [runAnalysis])

  // Merge verdict-side evidence lists into the evidence panel shape
  const evidenceForPanel = result
    ? {
        ...result.evidence,
        supporting_points: result.verdict?.supporting_points || [],
        contradicting_points: result.verdict?.contradicting_points || [],
      }
    : null

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
      {/* Hero */}
      <section className="anim-fade-up relative text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-gradient-to-r from-acc-blue/20 via-acc-violet/25 to-acc-cyan/20 blur-3xl"
        />
        <div className="pill relative mx-auto px-4 py-1.5 text-xs font-medium text-acc-violet">
          <ScanSearch className="h-3.5 w-3.5" aria-hidden="true" />
          AI-assisted fact investigation
        </div>
        <h1 className="relative mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ice sm:text-5xl lg:text-6xl">
          See through the noise with{' '}
          <span className="text-gradient">TruthLens AI</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-cool sm:text-lg">
          Paste a headline, claim, or article. TruthLens extracts the core assertion, retrieves evidence from
          external sources, and weighs it — clearly separating evidence from AI interpretation.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className={`pill px-3.5 py-1.5 font-medium ${health?.ai_configured ? 'text-emerald-300' : 'text-amber-300'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${health?.ai_configured ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'}`} />
            <Zap className="h-3 w-3" aria-hidden="true" />
            {health?.ai_configured ? 'Gemini AI connected' : health ? 'DEMO MODE — set GEMINI_API_KEY' : 'Checking backend…'}
          </span>
          <span className="pill px-3.5 py-1.5 text-cool">
            <Database className="h-3 w-3" aria-hidden="true" />
            Evidence: <span className="capitalize text-ice">{health?.evidence_provider || '…'}</span>
          </span>
        </div>
      </section>

      <div className="mt-12">
        <ClaimInput
          value={text}
          onChange={setText}
          onSubmit={() => runAnalysis()}
          loading={loading}
          maxChars={health?.max_input_chars || 8000}
        />
      </div>

      <div ref={resultsRef}>
        {loading && <LoadingState />}
        <ErrorBanner message={error} onRetry={error ? () => runAnalysis() : null} />

        {!loading && result && (
          <>
            <VerdictPanel result={result} />
            <AnalysisPanel analysis={result.analysis} />
            <EvidencePanel evidence={evidenceForPanel} />
            {result.compare_error && (
              <p className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/[0.06] p-4 text-sm text-amber-200">
                The evidence-comparison step reported an error: {result.compare_error}. Treat the verdict as
                inconclusive.
              </p>
            )}
          </>
        )}

        {!loading && !result && !error && (
          <section className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              { icon: Zap, title: 'AI claim extraction', body: 'Gemini isolates the central factual assertion, entities, dates, and loaded language.' },
              { icon: Database, title: 'Real evidence retrieval', body: 'Configurable search APIs surface primary documents, wire services, and fact-checkers.' },
              { icon: Scale, title: 'Careful verdicts', body: 'Supported · Contradicted · Misleading · Unverified — with limitations always disclosed.' },
            ].map(({ icon: Icon, title, body }, i) => (
              <article key={title} className={`card-glass card-hover anim-fade-up p-6 delay-${i + 1}`}>
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-acc-blue/25 bg-gradient-to-br from-acc-blue/15 to-acc-violet/10">
                  <Icon className="h-5 w-5 text-acc-cyan" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold tracking-tight text-ice">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cool">{body}</p>
              </article>
            ))}
          </section>
        )}
      </div>

      <Disclaimer health={health} />

      {/* How it works */}
      <section id="how-it-works" className="anim-fade-up mt-20 scroll-mt-24">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-ice sm:text-3xl">
            How it <span className="text-gradient">works</span>
          </h2>
          <p className="mt-2 text-sm text-cool">Four careful steps between a claim and a verdict.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {[
            ['1 · Input', 'You paste a headline, claim, or article. Input is validated client- and server-side.'],
            ['2 · AI analysis', 'Gemini extracts the central claim, entities, sensational phrasing, and a verification plan.'],
            ['3 · Evidence', 'A configured search provider retrieves real sources. Failures are disclosed, never hidden.'],
            ['4 · Verdict', 'AI weighs evidence against the claim and classifies it — defaulting to Unverified when unsure.'],
          ].map(([title, body], i) => (
            <div key={title} className="card-glass card-hover relative p-5">
              <span className="pointer-events-none absolute right-4 top-4 text-5xl font-bold text-white/[0.04] tabular-nums">
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-acc-cyan">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-cool">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 flex items-start gap-2 text-xs text-cool/70">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          TruthLens never fabricates sources or citations. If retrieval fails, you will see that it failed.
        </p>
      </section>

      <footer className="mt-20 border-t border-ink-700/60 pt-8 text-center text-xs text-cool/70">
        <p>
          TruthLens <span className="text-gradient font-medium">AI</span> — AI-assisted claim analysis for media
          literacy. Not a substitute for professional fact-checking.
        </p>
      </footer>
    </main>
  )
}
