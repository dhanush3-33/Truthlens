import { ScanSearch } from 'lucide-react'

const STEPS = [
  'Extracting the central factual claim…',
  'Identifying entities, dates, and numbers…',
  'Searching reliable sources for evidence…',
  'Comparing evidence against the claim…',
  'Classifying verdict and compiling report…',
]

export default function LoadingState() {
  return (
      <section
        className="card-glass card-accent anim-fade-up mt-6 p-10 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative mx-auto h-20 w-20 float-slow" aria-hidden="true">
        <span className="loader-ring" />
        <span className="loader-ring" />
        <span className="loader-ring" />
        <div className="loader-core absolute inset-0 grid place-items-center">
          <ScanSearch className="h-7 w-7 text-acc-cyan" />
        </div>
      </div>

      <h3 className="mt-5 text-lg font-semibold text-ice">Analyzing claim…</h3>
      <p className="mt-1 text-sm text-cool">
        Running AI extraction, evidence retrieval, and source comparison. This can take up to a minute.
      </p>

      <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-cool">
        {STEPS.map((s, i) => (
          <li key={s} className="anim-fade-up flex items-start gap-2.5" style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-acc-violet" aria-hidden="true" />
            {s}
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-6 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/5" aria-hidden="true">
        <div className="skeleton h-full w-full opacity-60" />
      </div>
    </section>
  )
}
