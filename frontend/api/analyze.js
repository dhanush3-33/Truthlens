// POST /api/analyze — Vercel serverless function (same contract as the Flask API)
import {
  json,
  aiConfigured,
  demoEnabled,
  MAX_CHARS,
  analyzeClaim,
  compareEvidence,
  demoAnalyze,
  demoCompare,
  searchEvidence,
  DISCLAIMER,
} from './_lib.js'

export const maxDuration = 60

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {}, req)
  }
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: { code: 'method_not_allowed', message: 'Method not allowed.' } }, req)
  }

  const started = Date.now()
  const payload = typeof req.body === 'object' && req.body !== null ? req.body : safeParse(req.body)

  if (!payload || typeof payload !== 'object') {
    return json(res, 400, { ok: false, error: { code: 'bad_request', message: 'JSON body required.' } }, req)
  }

  const text = payload.text
  if (typeof text !== 'string' || !text.trim()) {
    return json(
      res,
      400,
      { ok: false, error: { code: 'empty_input', message: 'Please enter a claim, headline, or article text.' } },
      req,
    )
  }
  const trimmed = text.trim()
  if (trimmed.length > MAX_CHARS) {
    return json(
      res,
      400,
      {
        ok: false,
        error: {
          code: 'too_long',
          message: `Input is too long (${trimmed.length} chars). Maximum is ${MAX_CHARS} characters.`,
        },
      },
      req,
    )
  }

  const demo = demoEnabled()
  const aiAvailable = aiConfigured()

  // Phase 1: AI claim analysis
  let analysis
  try {
    analysis = aiAvailable ? await analyzeClaim(trimmed) : demoAnalyze(trimmed)
  } catch (err) {
    return json(
      res,
      502,
      {
        ok: false,
        error: { code: 'ai_failure', message: err.message },
        partial: { analysis: null, evidence: null },
      },
      req,
    )
  }

  // Phase 2: evidence retrieval
  const [sources, searchMeta] = await searchEvidence(analysis.search_queries || [])
  for (const s of sources) s.summary = s.snippet || ''

  // Phase 3: evidence comparison / verdict
  let compareError = null
  let verdictBlock
  if (!aiAvailable) {
    verdictBlock = demoCompare(sources)
  } else if (!sources.length) {
    // No evidence → verdict is Unverified by rule; skip the 2nd Gemini call (saves daily quota).
    verdictBlock = {
      verdict: 'Unverified',
      explanation:
        'No usable external evidence was retrieved for this claim, so no verdict can be issued. Absence of evidence is not evidence that the claim is false.',
      supporting_points: [],
      contradicting_points: [],
      missing_context: [],
      limitations: [
        'Evidence retrieval returned no sources — verdict held at Unverified by design.',
        'This is AI-assisted analysis, not absolute truth.',
      ],
    }
  } else {
    try {
      verdictBlock = await compareEvidence(analysis.central_claim, analysis, sources)
    } catch (err) {
      compareError = err.message
      verdictBlock = {
        verdict: 'Unverified',
        explanation: `Evidence was retrieved, but the AI comparison step failed: ${err.message}`,
        supporting_points: [],
        contradicting_points: [],
        missing_context: [],
        limitations: ['The verdict step failed; treat this result as inconclusive.'],
      }
    }
  }

  return json(
    res,
    200,
    {
      ok: true,
      mode: demo ? 'demo' : 'live',
      generated_at: new Date().toISOString(),
      input_chars: trimmed.length,
      original_text_preview: trimmed.slice(0, 600),
      analysis,
      evidence: { search: searchMeta, sources },
      verdict: verdictBlock,
      disclaimer: DISCLAIMER,
      elapsed_seconds: Math.round((Date.now() - started) / 100) / 10,
      compare_error: compareError,
    },
    req,
  )
}

function safeParse(body) {
  if (typeof body !== 'string') return null
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}
