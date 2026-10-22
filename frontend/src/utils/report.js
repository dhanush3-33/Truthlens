export function buildReport(result) {
  const a = result.analysis || {}
  const v = result.verdict || {}
  const e = result.evidence || {}
  const search = e.search || {}
  const sources = e.sources || []

  const lines = []
  lines.push('TruthLens AI — Analysis Report')
  lines.push('='.repeat(60))
  lines.push(`Generated: ${result.generated_at || new Date().toISOString()}`)
  if (result.mode === 'demo') {
    lines.push('MODE: DEMO (no real AI analysis was performed)')
  }
  lines.push('')

  lines.push('VERDICT: ' + (v.verdict || 'Unverified'))
  lines.push('')
  lines.push('EXPLANATION:')
  lines.push(v.explanation || '(none)')
  lines.push('')

  lines.push('AI-EXTRACTED CENTRAL CLAIM:')
  lines.push(a.central_claim || '(none)')
  lines.push('')

  lines.push('ORIGINAL INPUT (preview):')
  lines.push(result.original_text_preview || '(not available)')
  lines.push('')

  lines.push('EVIDENCE SUPPORTING THE CLAIM:')
  ;(v.supporting_points || []).forEach((p) => lines.push('  - ' + p))
  if (!(v.supporting_points || []).length) lines.push('  (none identified)')
  lines.push('')

  lines.push('EVIDENCE CONTRADICTING THE CLAIM:')
  ;(v.contradicting_points || []).forEach((p) => lines.push('  - ' + p))
  if (!(v.contradicting_points || []).length) lines.push('  (none identified)')
  lines.push('')

  lines.push('IMPORTANT MISSING CONTEXT:')
  ;(v.missing_context || []).forEach((p) => lines.push('  - ' + p))
  if (!(v.missing_context || []).length) lines.push('  (none flagged)')
  lines.push('')

  lines.push('LIMITATIONS & UNCERTAINTY:')
  ;(v.limitations || []).forEach((p) => lines.push('  - ' + p))
  if (!(v.limitations || []).length) lines.push('  (none flagged)')
  lines.push('')

  lines.push('SOURCES:')
  if (!sources.length) {
    lines.push('  (no sources retrieved)')
  }
  sources.forEach((s, i) => {
    lines.push(`  [${i + 1}] ${s.title}`)
    lines.push(`      ${s.url}`)
    if (s.published_date) lines.push(`      Published: ${s.published_date}`)
    if (s.summary) lines.push(`      Summary: ${s.summary}`)
  })
  lines.push('')

  lines.push('SEARCH STATUS: ' + (search.detail || 'unavailable'))
  lines.push('')
  lines.push('DISCLAIMER:')
  lines.push(result.disclaimer || '')
  lines.push('This report is AI-assisted analysis, not absolute truth. Verify with primary sources.')

  return lines.join('\n')
}
