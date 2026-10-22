import { Megaphone, Users, CalendarDays, MapPin, Hash, Building2, Quote, ListChecks } from 'lucide-react'

function ChipList({ items, empty = 'None detected' }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-cool/70">{empty}</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="pill px-2.5 py-1 text-xs text-cool"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

const ENTITY_GROUPS = [
  { key: 'people', label: 'People', icon: Users },
  { key: 'organizations', label: 'Organizations', icon: Building2 },
  { key: 'locations', label: 'Locations', icon: MapPin },
  { key: 'dates', label: 'Dates', icon: CalendarDays },
  { key: 'numbers', label: 'Numbers', icon: Hash },
]

export default function AnalysisPanel({ analysis }) {
  if (!analysis) return null
  const entities = analysis.entities || {}
  const sensational = analysis.sensational_language || []

  return (
    <section className="card-glass anim-fade-up delay-1 mt-6 p-6 sm:p-8" aria-labelledby="analysis-heading">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 id="analysis-heading" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-ice">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-acc-blue/25 bg-gradient-to-br from-acc-blue/15 to-acc-violet/10">
            <Quote className="h-5 w-5 text-acc-blue" aria-hidden="true" />
          </span>
          AI Claim Analysis
        </h3>
        {analysis.claim_type && (
          <span className="pill border-acc-violet/30 px-3.5 py-1.5 text-xs capitalize text-acc-violet">
            {String(analysis.claim_type).replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-acc-blue/25 bg-gradient-to-r from-acc-blue/[0.08] to-transparent p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-acc-blue">Central claim (AI-extracted)</p>
        <p className="mt-2 text-[15px] leading-relaxed text-ice">{analysis.central_claim}</p>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ice">
          <Users className="h-4 w-4 text-acc-violet" aria-hidden="true" />
          Extracted entities
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ENTITY_GROUPS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="rounded-xl border border-ink-700/60 bg-white/[0.015] p-3.5 transition-colors duration-300 hover:border-acc-violet/30">
              <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-cool/80">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
              </p>
              <ChipList items={entities[key]} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cool">
            <Megaphone className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Potentially sensational language
          </h4>
          {sensational.length === 0 ? (
            <p className="text-sm text-cool/70">No strongly sensational phrasing detected.</p>
          ) : (
            <ul className="space-y-2">
              {sensational.map((s, i) => (
                <li key={i} className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-3 text-sm">
                  <span className="font-medium text-amber-300">“{typeof s === 'string' ? s : s.phrase}”</span>
                  {typeof s === 'object' && s.why && (
                    <p className="mt-1 text-xs text-cool">{s.why}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cool">
            <ListChecks className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            What evidence would verify this
          </h4>
          {(analysis.verification_plan || []).length === 0 ? (
            <p className="text-sm text-cool/70">No verification plan generated.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.verification_plan.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-cool">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {analysis.notes && (
        <p className="mt-5 rounded-lg border border-ink-700/70 bg-white/[0.02] p-3 text-xs italic text-cool">
          Note: {analysis.notes}
        </p>
      )}
    </section>
  )
}
