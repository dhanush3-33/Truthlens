import { AlertOctagon, RefreshCw } from 'lucide-react'

export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div
      className="card-glass anim-fade-up mt-6 flex flex-col gap-3 border-red-400/30 p-5 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
        <div>
          <p className="font-medium text-red-200">Analysis could not be completed</p>
          <p className="mt-0.5 text-sm text-red-200/80">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-ghost flex shrink-0 items-center gap-2 border-red-400/40 px-4 py-2 text-sm font-medium text-red-200 hover:border-red-400/70 hover:text-red-100"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  )
}
