import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react'

const STYLES = {
  Supported: {
    icon: CheckCircle2,
    classes: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/40 shadow-[0_0_24px_-8px_rgba(52,211,153,0.5)]',
  },
  Contradicted: {
    icon: XCircle,
    classes: 'bg-red-400/10 text-red-300 border-red-400/40 shadow-[0_0_24px_-8px_rgba(248,113,113,0.5)]',
  },
  Misleading: {
    icon: AlertTriangle,
    classes: 'bg-amber-400/10 text-amber-300 border-amber-400/40 shadow-[0_0_24px_-8px_rgba(251,191,36,0.5)]',
  },
  Unverified: {
    icon: HelpCircle,
    classes: 'bg-sky-400/10 text-sky-300 border-sky-400/40 shadow-[0_0_24px_-8px_rgba(56,189,248,0.5)]',
  },
}

export default function VerdictBadge({ verdict, size = 'lg' }) {
  const config = STYLES[verdict] || STYLES.Unverified
  const Icon = config.icon
  const big = size === 'lg'
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold backdrop-blur-sm transition-transform duration-300 hover:scale-[1.03] ${config.classes} ${
        big ? 'px-5 py-2.5 text-sm tracking-wide' : 'px-3 py-1 text-xs'
      }`}
      role="status"
    >
      <Icon className={big ? 'h-5 w-5' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {verdict || 'Unverified'}
    </span>
  )
}
