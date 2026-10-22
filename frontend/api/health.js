// GET /api/health — Vercel serverless function
import { json, aiConfigured, demoEnabled, MAX_CHARS } from './_lib.js'

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, 204, {}, req)
  }
  if (req.method !== 'GET') {
    return json(res, 405, { ok: false, error: { code: 'method_not_allowed', message: 'Method not allowed.' } }, req)
  }
  return json(
    res,
    200,
    {
      status: 'ok',
      ai_configured: aiConfigured(),
      demo_mode: demoEnabled(),
      evidence_provider: (process.env.EVIDENCE_PROVIDER || 'auto').trim(),
      max_input_chars: MAX_CHARS,
      runtime: 'vercel-functions',
    },
    req,
  )
}
