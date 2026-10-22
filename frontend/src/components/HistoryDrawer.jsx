import { X, Trash2, RotateCw, Clock } from 'lucide-react'
import VerdictBadge from './VerdictBadge.jsx'

export default function HistoryDrawer({ open, items, onClose, onRerun, onClear }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Analysis history">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm anim-fade-in" onClick={onClose} />
      <aside className="anim-fade-up absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-ink-700/70 bg-ink-900/95 shadow-[-24px_0_64px_-24px_rgba(2,6,23,0.9)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-ink-700/60 px-5 py-4">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-ice">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-acc-blue/25 bg-acc-blue/10">
              <Clock className="h-4.5 w-4.5 text-acc-blue" aria-hidden="true" />
            </span>
            Analysis history
          </h2>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={onClear}
                className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs text-cool hover:border-red-400/40 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Clear
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close history"
              className="btn-ghost p-2 text-cool hover:text-ice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="mt-8 text-center text-sm text-cool/70">
              No analyses yet. Results you analyze will appear here (stored only in this browser).
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-ink-700/70 bg-white/[0.02] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-acc-blue/40 hover:shadow-[0_12px_32px_-16px_rgba(59,130,246,0.3)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <VerdictBadge verdict={item.verdict} size="sm" />
                    <span className="text-[11px] text-cool/70">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-cool">{item.claim}</p>
                  <button
                    onClick={() => onRerun(item.text)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-acc-cyan transition-colors hover:text-ice"
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Re-run this analysis
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="border-t border-ink-700 px-5 py-3 text-[11px] text-cool/70">
          History is stored in your browser's localStorage only. Nothing is sent to a server.
        </p>
      </aside>
    </div>
  )
}
