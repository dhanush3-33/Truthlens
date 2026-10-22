import { Gavel, Copy, Download, Check, Info, ShieldQuestion } from 'lucide-react'
import { useState } from 'react'
import VerdictBadge from './VerdictBadge.jsx'
import { buildReport } from '../utils/report.js'

export default function VerdictPanel({ result }) {
  const [copied, setCopied] = useState(false)
  if (!result) return null
  const verdict = result.verdict || {}

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildReport(result))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([buildReport(result)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `truthlens-report-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="card-glass card-accent anim-fade-up delay-1 mt-6 p-6 sm:p-8" aria-labelledby="verdict-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="verdict-heading" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-ice">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-acc-violet/30 bg-gradient-to-br from-acc-violet/20 to-acc-blue/10">
            <Gavel className="h-5 w-5 text-acc-violet" aria-hidden="true" />
          </span>
          Verdict
        </h3>
        {result.mode === 'demo' && (
          <span className="pill border-amber-400/40 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
            DEMO MODE — not real AI analysis
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <VerdictBadge verdict={verdict.verdict} />
        <span className="text-xs text-cool/70">
          AI-assisted classification based on retrieved evidence — not absolute truth.
        </span>
      </div>

      <div className="mt-5 rounded-xl border border-ink-700/70 bg-ink-950/60 p-5 shadow-[0_1px_0_0_rgba(248,250,252,0.03)_inset]">
        <p className="text-[15px] leading-relaxed text-ice/90">{verdict.explanation || 'No explanation provided.'}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-700/50 bg-white/[0.015] p-4">
          <h4 className="mb-2.5 text-sm font-semibold text-ice">Important missing context</h4>
          {(verdict.missing_context || []).length === 0 ? (
            <p className="text-sm text-cool/70">None flagged by the analysis.</p>
          ) : (
            <ul className="space-y-2.5">
              {verdict.missing_context.map((m, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-cool">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-acc-blue" aria-hidden="true" />
                  {m}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-ink-700/50 bg-white/[0.015] p-4">
          <h4 className="mb-2.5 text-sm font-semibold text-ice">Limitations & uncertainty</h4>
          {(verdict.limitations || []).length === 0 ? (
            <p className="text-sm text-cool/70">None flagged by the analysis.</p>
          ) : (
            <ul className="space-y-2.5">
              {verdict.limitations.map((l, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-cool">
                  <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                  {l}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3 border-t border-ink-700/60 pt-5">
        <button onClick={handleCopy} className="btn-ghost flex items-center gap-2 px-4 py-2.5 text-sm text-cool hover:text-ice">
          {copied ? <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy report'}
        </button>
        <button onClick={handleDownload} className="btn-ghost flex items-center gap-2 px-4 py-2.5 text-sm text-cool hover:text-ice">
          <Download className="h-4 w-4" aria-hidden="true" />
          Download report
        </button>
      </div>
    </section>
  )
}
