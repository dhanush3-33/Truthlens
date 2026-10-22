import { ShieldCheck } from 'lucide-react'

export default function Disclaimer({ health }) {
  const demo = health?.demo_mode
  const aiReady = health?.ai_configured
  return (
    <div className="card-glass anim-fade-up delay-3 mt-8 border-l-2 !border-l-acc-cyan/40 p-5">
      <p className="flex items-start gap-3 text-xs leading-relaxed text-cool">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-acc-cyan" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-ice">How to read results:</strong> TruthLens combines AI-assisted
          claim analysis with evidence retrieved from external search providers. Verdicts ({' '}
          <span className="text-emerald-300">Supported</span>, <span className="text-red-300">Contradicted</span>,{' '}
          <span className="text-amber-300">Misleading</span>, <span className="text-sky-300">Unverified</span> ) are
          interpretations of available evidence, not absolute truth. Absence of evidence never means a claim is false.
          Always verify with primary sources.
          {demo && (
            <>
              {' '}
              <strong className="font-semibold text-amber-300"> Currently in DEMO MODE:</strong> no AI key is
              configured, so analyses use local heuristics only and verdicts stay <em>Unverified</em>.
            </>
          )}
          {!demo && !aiReady && <> AI is not configured on the backend.</>}
        </span>
      </p>
    </div>
  )
}
