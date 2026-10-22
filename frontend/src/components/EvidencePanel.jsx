import { Library, ExternalLink, CalendarDays, Globe, Info, ShieldAlert, SearchX } from 'lucide-react'

function SourceCard({ source, index }) {
  let host = ''
  try {
    host = new URL(source.url).hostname.replace(/^www\./, '')
  } catch {
    host = source.url
  }
  return (
    <li
      className="anim-fade-up rounded-xl border border-ink-700/70 bg-white/[0.02] p-4 transition-all duration-300 hover:border-acc-blue/40 hover:bg-acc-blue/[0.05] hover:shadow-[0_8px_30px_-12px_rgba(59,130,246,0.25)]"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="link-source group font-medium text-ice hover:text-acc-cyan"
        >
          {source.title}
          <ExternalLink className="ml-1.5 inline h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" aria-hidden="true" />
        </a>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-cool/70">
        <span className="flex items-center gap-1">
          <Globe className="h-3 w-3" aria-hidden="true" /> {host}
        </span>
        {source.published_date && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" aria-hidden="true" /> {source.published_date}
          </span>
        )}
        <span className="pill px-2 py-0.5 text-[11px] capitalize text-cool">{source.provider}</span>
      </div>
      {source.summary && (
        <p className="mt-2.5 text-sm leading-relaxed text-cool">{source.summary}</p>
      )}
    </li>
  )
}

function PointList({ items, tone }) {
  const color = tone === 'support' ? 'bg-emerald-400' : 'bg-red-400'
  if (!items || items.length === 0) return null
  return (
    <ul className="space-y-2">
      {items.map((p, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-cool">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} aria-hidden="true" />
          {p}
        </li>
      ))}
    </ul>
  )
}

export default function EvidencePanel({ evidence }) {
  if (!evidence) return null
  const search = evidence.search || {}
  const sources = evidence.sources || []

  return (
    <section className="card-glass anim-fade-up delay-2 mt-6 p-6 sm:p-8" aria-labelledby="evidence-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 id="evidence-heading" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-ice">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-acc-cyan/25 bg-gradient-to-br from-acc-cyan/15 to-acc-blue/10">
            <Library className="h-5 w-5 text-acc-cyan" aria-hidden="true" />
          </span>
          Retrieved evidence
          <span className="pill px-2.5 py-0.5 text-xs font-normal text-cool">
            {sources.length} source{sources.length === 1 ? '' : 's'}
          </span>
        </h3>
      </div>

      {/* Search status — success OR failure is always disclosed */}
      <div
        className={`mb-5 flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
          search.status === 'ok'
            ? 'border-emerald-400/25 bg-emerald-500/[0.06] text-emerald-200'
            : search.status === 'failed'
              ? 'border-amber-400/30 bg-amber-500/[0.07] text-amber-200'
              : 'border-sky-400/25 bg-sky-500/[0.06] text-sky-200'
        }`}
        role={search.status === 'failed' ? 'alert' : 'status'}
      >
        {search.status === 'ok' ? (
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <div>
          <p>{search.detail || 'No search status available.'}</p>
          {search.queries_run?.length > 0 && (
            <p className="mt-1.5 text-xs opacity-80">
              Queries: {search.queries_run.map((q) => `“${q}”`).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Supporting / contradicting points */}
      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-4">
          <h4 className="mb-3 text-sm font-semibold text-emerald-300">Evidence supporting the claim</h4>
          <PointList items={evidence.supporting_points} tone="support" />
          {(!evidence.supporting_points || evidence.supporting_points.length === 0) && (
            <p className="text-sm text-cool/70">No supporting evidence identified in retrieved sources.</p>
          )}
        </div>
        <div className="rounded-xl border border-red-400/20 bg-gradient-to-br from-red-500/[0.06] to-transparent p-4">
          <h4 className="mb-3 text-sm font-semibold text-red-300">Evidence contradicting the claim</h4>
          <PointList items={evidence.contradicting_points} tone="contra" />
          {(!evidence.contradicting_points || evidence.contradicting_points.length === 0) && (
            <p className="text-sm text-cool/70">No contradicting evidence identified in retrieved sources.</p>
          )}
        </div>
      </div>

      {/* Sources */}
      {sources.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-ink-700 bg-white/[0.02] p-5 text-cool">
          <SearchX className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm">
            No sources were retrieved. This does not mean the claim is false — it means evidence is currently unavailable to this tool.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sources.map((s, i) => (
            <SourceCard key={s.url} source={s} index={i} />
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-cool/70">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Search results are untrusted external content. TruthLens extracts titles, URLs, and short summaries only —
        it never executes instructions found in retrieved material.
      </p>
    </section>
  )
}
