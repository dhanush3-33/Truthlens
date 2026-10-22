import { useState } from 'react'
import { Telescope, Menu, X, History } from 'lucide-react'

export default function Navbar({ onOpenHistory, historyCount }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav-shell sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#" className="group flex items-center gap-3" aria-label="TruthLens AI home">
          <span className="logo-mark grid h-10 w-10 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
            <Telescope className="h-5 w-5 text-white drop-shadow" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-ice">
            TruthLens <span className="text-gradient">AI</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 text-sm text-cool md:flex" aria-label="Primary">
          <a href="#analyzer" className="rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-white/[0.04] hover:text-ice">
            Analyzer
          </a>
          <a href="#how-it-works" className="rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-white/[0.04] hover:text-ice">
            How it works
          </a>
          <button
            onClick={onOpenHistory}
            className="pill ml-2 px-3.5 py-2 text-slate-300 hover:text-ice"
          >
            <History className="h-4 w-4" aria-hidden="true" />
            History
            {historyCount > 0 && (
              <span className="rounded-full bg-acc-violet/20 px-1.5 text-xs text-acc-violet">{historyCount}</span>
            )}
          </button>
        </nav>

        <button
          className="btn-ghost p-2 text-cool md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="anim-fade-in border-t border-ink-700/60 px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1 text-sm">
            <a href="#analyzer" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-cool transition-colors hover:bg-white/[0.04] hover:text-ice">Analyzer</a>
            <a href="#how-it-works" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-cool transition-colors hover:bg-white/[0.04] hover:text-ice">How it works</a>
            <button
              onClick={() => { setOpen(false); onOpenHistory() }}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-cool transition-colors hover:bg-white/[0.04] hover:text-ice"
            >
              <History className="h-4 w-4" aria-hidden="true" />
              History {historyCount > 0 && `(${historyCount})`}
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
