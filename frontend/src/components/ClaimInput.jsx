import { useState } from 'react'
import { Search, Sparkles, AlertCircle } from 'lucide-react'

const SAMPLES = [
  {
    label: 'Health myth',
    text: 'Drinking eight glasses of water a day is a medically proven requirement for optimal health.',
  },
  {
    label: 'Science claim',
    text: 'The Great Wall of China is visible from space with the naked eye.',
  },
  {
    label: 'Statistic',
    text: 'Renewable energy made up more than 30% of global electricity generation in 2023, according to international energy statistics.',
  },
  {
    label: 'Short headline',
    text: 'Scientists announce a new species of deep-sea shark discovered in the Pacific Ocean.',
  },
]

const MAX_CHARS = 8000

export default function ClaimInput({ value, onChange, onSubmit, loading, maxChars = MAX_CHARS }) {
  const [touched, setTouched] = useState(false)
  const trimmed = value.trim()
  const tooLong = value.length > maxChars
  const empty = trimmed.length === 0
  const invalid = empty || tooLong
  const showEmptyError = touched && empty && value.length === 0

  return (
    <section id="analyzer" className="card-glass anim-fade-up p-6 sm:p-8">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight text-ice">Analyze a claim</h2>
        <p className="mt-1.5 text-sm text-cool">
          Paste a headline, short claim, or article text. AI extracts the core claim, finds evidence, and weighs it.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="list" aria-label="Sample claims">
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            type="button"
            role="listitem"
            onClick={() => { onChange(s.text); setTouched(true) }}
            disabled={loading}
            className="pill px-3.5 py-1.5 text-xs text-cool hover:text-ice disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3 text-acc-violet" aria-hidden="true" />
            {s.label}
          </button>
        ))}
      </div>

      <label htmlFor="claim-input" className="sr-only">Claim or article text</label>
      <textarea
        id="claim-input"
        value={value}
        onChange={(e) => { onChange(e.target.value); if (!touched) setTouched(true) }}
        onBlur={() => setTouched(true)}
        disabled={loading}
        rows={6}
        maxLength={maxChars + 2000}
        placeholder="e.g. “A widely shared post claims that a new study proves coffee cures Alzheimer's disease…”"
        aria-invalid={invalid && touched}
        aria-describedby="claim-input-help"
        className={`input-premium mt-5 w-full resize-y p-4 text-[15px] leading-relaxed text-ice placeholder:text-cool/60 focus:outline-none disabled:opacity-60 ${
          tooLong ? '!border-red-500/60' : showEmptyError ? '!border-amber-400/50' : ''
        }`}
      />

      <div id="claim-input-help" className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-h-[1.25rem] text-xs">
          {showEmptyError && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> Enter a claim to analyze.
            </span>
          )}
          {tooLong && (
            <span className="flex items-center gap-1.5 text-red-400">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> Too long — shorten to {maxChars.toLocaleString()} characters or paste a summary.
            </span>
          )}
          {!tooLong && !showEmptyError && (
            <span className="text-cool/70">Claims and short articles work best. Max {maxChars.toLocaleString()} characters.</span>
          )}
        </div>
        <span
          className={`text-xs tabular-nums ${tooLong ? 'text-red-400' : value.length > maxChars * 0.85 ? 'text-amber-400' : 'text-cool/60'}`}
          aria-live="polite"
        >
          {value.length.toLocaleString()} / {maxChars.toLocaleString()}
        </span>
      </div>

      <button
        type="button"
        onClick={() => { setTouched(true); if (!invalid && !loading) onSubmit() }}
        disabled={loading || invalid}
        className="btn-primary mt-5 flex w-full items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-white sm:w-auto"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
            Analyzing…
          </>
        ) : (
          <>
            <Search className="h-4 w-4" aria-hidden="true" />
            Analyze Claim
          </>
        )}
      </button>
    </section>
  )
}
