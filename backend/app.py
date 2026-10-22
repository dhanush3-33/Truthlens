"""TruthLens AI backend — Flask API."""

import os
import time

from dotenv import load_dotenv

load_dotenv()

from flask import Flask, jsonify, request
from flask_cors import CORS

from services import ai_analyzer
from services.evidence_search import active_provider, search_evidence

app = Flask(__name__)

_allowed = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if o.strip()
]
CORS(app, resources={r"/api/*": {"origins": _allowed or "*"}})

MAX_CHARS = int(os.getenv("MAX_INPUT_CHARS", "8000") or 8000)


def _demo_enabled():
    flag = (os.getenv("DEMO_MODE") or "true").strip().lower() in ("1", "true", "yes", "on")
    return flag and not ai_analyzer.is_configured()


@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "ai_configured": ai_analyzer.is_configured(),
            "demo_mode": _demo_enabled(),
            "evidence_provider": active_provider() or "none",
            "max_input_chars": MAX_CHARS,
        }
    )


@app.post("/api/analyze")
def analyze():
    started = time.time()
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"ok": False, "error": {"code": "bad_request", "message": "JSON body required."}}), 400

    text = payload.get("text")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"ok": False, "error": {"code": "empty_input", "message": "Please enter a claim, headline, or article text."}}), 400
    text = text.strip()
    if len(text) > MAX_CHARS:
        return jsonify({
            "ok": False,
            "error": {
                "code": "too_long",
                "message": "Input is too long (%d chars). Maximum is %d characters." % (len(text), MAX_CHARS),
            },
        }), 400

    demo = _demo_enabled()
    ai_available = ai_analyzer.is_configured()

    # ---- Phase 1: AI claim analysis -------------------------------------
    try:
        if ai_available:
            analysis = ai_analyzer.analyze_claim(text)
        else:
            analysis = ai_analyzer.demo_analyze(text)
    except ai_analyzer.AIError as exc:
        return jsonify({
            "ok": False,
            "error": {"code": "ai_failure", "message": str(exc)},
            "partial": {"analysis": None, "evidence": None},
        }), 502

    # ---- Phase 2: evidence retrieval ------------------------------------
    queries = analysis.get("search_queries") or []
    sources, search_meta = search_evidence(queries)

    # Attach human-readable summaries before the AI comparison step.
    for s in sources:
        s["summary"] = s.get("snippet") or ""

    # ---- Phase 3: evidence comparison / verdict -------------------------
    compare_error = None
    if ai_available:
        try:
            verdict_block = ai_analyzer.compare_evidence(analysis["central_claim"], analysis, sources)
        except ai_analyzer.AIError as exc:
            compare_error = str(exc)
            verdict_block = {
                "verdict": "Unverified",
                "explanation": "Evidence was retrieved, but the AI comparison step failed: %s" % str(exc),
                "supporting_points": [],
                "contradicting_points": [],
                "missing_context": [],
                "limitations": ["The verdict step failed; treat this result as inconclusive."],
            }
    else:
        verdict_block = ai_analyzer.demo_compare(analysis["central_claim"], analysis, sources)

    result = {
        "ok": True,
        "mode": "demo" if demo else "live",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "input_chars": len(text),
        "original_text_preview": text[:600],
        "analysis": analysis,
        "evidence": {
            "search": search_meta,
            "sources": sources,
        },
        "verdict": verdict_block,
        "disclaimer": (
            "TruthLens AI provides AI-assisted analysis of public information. "
            "Verdicts are probabilistic interpretations of retrieved evidence, not absolute truth. "
            "Always consult primary sources before making decisions."
        ),
        "elapsed_seconds": round(time.time() - started, 2),
        "compare_error": compare_error,
    }
    return jsonify(result)


@app.errorhandler(404)
def not_found(_e):
    return jsonify({"ok": False, "error": {"code": "not_found", "message": "Endpoint not found."}}), 404


@app.errorhandler(405)
def method_not_allowed(_e):
    return jsonify({"ok": False, "error": {"code": "method_not_allowed", "message": "Method not allowed."}}), 405


@app.errorhandler(500)
def server_error(_e):
    return jsonify({"ok": False, "error": {"code": "server_error", "message": "Unexpected server error."}}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001") or 5001)
    host = os.getenv("HOST", "0.0.0.0")  # 0.0.0.0 required for cloud hosts (Render etc.)
    debug = (os.getenv("FLASK_DEBUG", "false") or "false").strip().lower() in ("1", "true", "yes")
    app.run(host=host, port=port, debug=debug)
