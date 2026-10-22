"""Pluggable web evidence retrieval.

All results come from real external search APIs. Nothing is invented.
If a provider fails or is unconfigured, the failure is disclosed, not hidden.
"""

import html
import os
import re

import requests

TIMEOUT_DEFAULT = 15
USER_AGENT = "TruthLensAI/1.0 (evidence-retrieval; +https://localhost)"


class SearchError(Exception):
    def __init__(self, message, provider="unknown"):
        super().__init__(message)
        self.provider = provider


def _timeout():
    try:
        return float(os.getenv("SEARCH_TIMEOUT_SECONDS", str(TIMEOUT_DEFAULT)))
    except ValueError:
        return float(TIMEOUT_DEFAULT)


def _clean(text, limit=350):
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", str(text))
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


def _valid_url(url):
    if not url or not isinstance(url, str):
        return False
    url = url.strip()
    if not url.lower().startswith(("http://", "https://")):
        return False
    # reject obvious javascript/data URIs that may have slipped through
    if re.match(r"^(javascript|data|file):", url, re.I):
        return False
    return True


def _normalize(items, provider):
    """Convert raw provider items into a safe, uniform shape. Drops invalid URLs."""
    out = []
    seen = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        url = str(item.get("url") or item.get("link") or "").strip()
        if not _valid_url(url):
            continue
        key = url.lower().rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        out.append(
            {
                "title": _clean(item.get("title") or "Untitled source", 200) or "Untitled source",
                "url": url,
                "snippet": _clean(item.get("snippet") or item.get("description") or "", 500),
                "published_date": _clean(item.get("published_date") or item.get("date") or "", 40),
                "provider": provider,
            }
        )
    return out


# ----------------------------- providers ---------------------------------


def _search_tavily(query, max_results):
    key = os.getenv("TAVILY_API_KEY", "").strip()
    if not key:
        raise SearchError("Tavily API key not configured.", "tavily")
    try:
        resp = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": key,
                "query": query,
                "max_results": max_results,
                "search_depth": "basic",
                "include_answer": False,
            },
            timeout=_timeout(),
            headers={"Content-Type": "application/json"},
        )
    except requests.Timeout:
        raise SearchError("Tavily search timed out.", "tavily")
    except requests.RequestException as exc:
        raise SearchError("Tavily request failed: %s" % exc.__class__.__name__, "tavily")
    if resp.status_code == 401:
        raise SearchError("Tavily API key is invalid.", "tavily")
    if resp.status_code == 429:
        raise SearchError("Tavily rate limit reached.", "tavily")
    if resp.status_code >= 400:
        raise SearchError("Tavily error (HTTP %s)." % resp.status_code, "tavily")
    try:
        data = resp.json()
    except ValueError:
        raise SearchError("Tavily returned invalid JSON.", "tavily")
    return _normalize(data.get("results") or [], "tavily")


def _search_brave(query, max_results):
    key = os.getenv("BRAVE_API_KEY", "").strip()
    if not key:
        raise SearchError("Brave API key not configured.", "brave")
    try:
        resp = requests.get(
            "https://api.search.brave.com/res/v1/web/search",
            params={"q": query, "count": max_results},
            headers={"X-Subscription-Token": key, "Accept": "application/json"},
            timeout=_timeout(),
        )
    except requests.Timeout:
        raise SearchError("Brave search timed out.", "brave")
    except requests.RequestException as exc:
        raise SearchError("Brave request failed: %s" % exc.__class__.__name__, "brave")
    if resp.status_code == 401:
        raise SearchError("Brave API key is invalid.", "brave")
    if resp.status_code == 429:
        raise SearchError("Brave rate limit reached.", "brave")
    if resp.status_code >= 400:
        raise SearchError("Brave error (HTTP %s)." % resp.status_code, "brave")
    try:
        data = resp.json()
    except ValueError:
        raise SearchError("Brave returned invalid JSON.", "brave")
    items = (data.get("web") or {}).get("results") or []
    return _normalize(
        [{"title": i.get("title"), "url": i.get("url"), "snippet": i.get("description"),
          "date": i.get("age") or i.get("page_age")} for i in items],
        "brave",
    )


def _search_serpapi(query, max_results):
    key = os.getenv("SERPAPI_API_KEY", "").strip()
    if not key:
        raise SearchError("SerpApi API key not configured.", "serpapi")
    try:
        resp = requests.get(
            "https://serpapi.com/search.json",
            params={"q": query, "api_key": key, "num": max_results, "engine": "google"},
            timeout=_timeout(),
        )
    except requests.Timeout:
        raise SearchError("SerpApi search timed out.", "serpapi")
    except requests.RequestException as exc:
        raise SearchError("SerpApi request failed: %s" % exc.__class__.__name__, "serpapi")
    if resp.status_code == 401:
        raise SearchError("SerpApi API key is invalid.", "serpapi")
    if resp.status_code == 429:
        raise SearchError("SerpApi rate limit reached.", "serpapi")
    if resp.status_code >= 400:
        raise SearchError("SerpApi error (HTTP %s)." % resp.status_code, "serpapi")
    try:
        data = resp.json()
    except ValueError:
        raise SearchError("SerpApi returned invalid JSON.", "serpapi")
    if data.get("error"):
        raise SearchError("SerpApi error: %s" % _clean(data.get("error"), 120), "serpapi")
    items = data.get("organic_results") or []
    return _normalize(
        [{"title": i.get("title"), "url": i.get("link"), "snippet": i.get("snippet"),
          "date": i.get("date")} for i in items],
        "serpapi",
    )


def _search_wikipedia(query, max_results):
    """Keyless fallback via the public MediaWiki search API (real results only)."""
    try:
        resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srlimit": max_results,
                "srprop": "snippet|timestamp",
                "format": "json",
                "utf8": 1,
            },
            headers={"User-Agent": USER_AGENT},
            timeout=_timeout(),
        )
    except requests.Timeout:
        raise SearchError("Wikipedia search timed out.", "wikipedia")
    except requests.RequestException as exc:
        raise SearchError("Wikipedia request failed: %s" % exc.__class__.__name__, "wikipedia")
    if resp.status_code >= 400:
        raise SearchError("Wikipedia error (HTTP %s)." % resp.status_code, "wikipedia")
    try:
        data = resp.json()
    except ValueError:
        raise SearchError("Wikipedia returned invalid JSON.", "wikipedia")
    items = (data.get("query") or {}).get("search") or []
    normalized = [
        {
            "title": i.get("title"),
            "url": "https://en.wikipedia.org/wiki/" + str(i.get("title") or "").replace(" ", "_"),
            "snippet": i.get("snippet"),
            "date": (i.get("timestamp") or "")[:10],
        }
        for i in items
    ]
    results = _normalize(normalized, "wikipedia")
    if not results:
        raise SearchError("Wikipedia returned no results.", "wikipedia")
    return results


def _search_duckduckgo(query, max_results):
    """Keyless fallback using DuckDuckGo's HTML endpoint. Fragile by nature."""
    try:
        resp = requests.post(
            "https://html.duckduckgo.com/html/",
            data={"q": query, "kl": "us-en"},
            headers={"User-Agent": USER_AGENT},
            timeout=_timeout(),
        )
    except requests.Timeout:
        raise SearchError("DuckDuckGo search timed out.", "duckduckgo")
    except requests.RequestException as exc:
        raise SearchError("DuckDuckGo request failed: %s" % exc.__class__.__name__, "duckduckgo")
    if resp.status_code >= 400:
        raise SearchError("DuckDuckGo error (HTTP %s)." % resp.status_code, "duckduckgo")

    pattern = re.compile(
        r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>'
        r'.*?(?:<a[^>]+class="result__snippet"[^>]*>(.*?)</a>)?',
        re.DOTALL | re.I,
    )
    items = []
    for m in pattern.finditer(resp.text):
        href, title, snippet = m.group(1), m.group(2), m.group(3) or ""
        # DDG wraps results in a redirect; extract the real uddg param
        real = re.search(r"uddg=([^&]+)", href)
        if real:
            from urllib.parse import unquote

            href = unquote(real.group(1))
        items.append({"title": title, "url": href, "snippet": snippet})
        if len(items) >= max_results:
            break
    results = _normalize(items, "duckduckgo")
    if not results:
        raise SearchError("DuckDuckGo returned no parseable results.", "duckduckgo")
    return results


PROVIDERS = {
    "tavily": _search_tavily,
    "brave": _search_brave,
    "serpapi": _search_serpapi,
    "wikipedia": _search_wikipedia,
    "duckduckgo": _search_duckduckgo,
}

KEYLESS_FALLBACKS = ["wikipedia", "duckduckgo"]


def _provider_chain():
    """Ordered list of providers to try. Explicit choice = single provider."""
    choice = (os.getenv("EVIDENCE_PROVIDER") or "auto").strip().lower()
    if choice == "none":
        return []
    if choice in PROVIDERS:
        return [choice]
    chain = []
    if os.getenv("TAVILY_API_KEY", "").strip():
        chain.append("tavily")
    if os.getenv("BRAVE_API_KEY", "").strip():
        chain.append("brave")
    if os.getenv("SERPAPI_API_KEY", "").strip():
        chain.append("serpapi")
    chain.extend(KEYLESS_FALLBACKS)
    return chain


def active_provider():
    """First provider that would actually be tried (for status reporting)."""
    chain = _provider_chain()
    return chain[0] if chain else None


def _provider_status():
    return {
        "tavily": bool(os.getenv("TAVILY_API_KEY", "").strip()),
        "brave": bool(os.getenv("BRAVE_API_KEY", "").strip()),
        "serpapi": bool(os.getenv("SERPAPI_API_KEY", "").strip()),
        "wikipedia": True,
        "duckduckgo": True,
        "configured_provider": active_provider(),
    }


def search_evidence(queries, max_per_query=5):
    """Run queries across the provider chain. Returns (sources, meta). Never invents results."""
    chain = _provider_chain()
    meta = {
        "status": "unavailable",
        "provider": chain[0] if chain else "none",
        "detail": "",
        "queries_run": [],
        "errors": [],
        "providers_tried": list(chain),
        "provider_status": _provider_status(),
    }
    if not chain:
        meta["detail"] = (
            "Evidence search is disabled (EVIDENCE_PROVIDER=none). "
            "No external sources were consulted."
        )
        return [], meta

    queries = [q for q in (queries or []) if isinstance(q, str) and q.strip()][:4]
    if not queries:
        meta["detail"] = "No usable search queries were generated for this claim."
        return [], meta

    all_sources = []
    used_provider = None
    for provider in chain:
        search_fn = PROVIDERS[provider]
        provider_sources = []
        provider_failed = False
        for q in queries:
            if q not in meta["queries_run"]:
                meta["queries_run"].append(q)
            try:
                provider_sources.extend(search_fn(q, max_per_query))
            except SearchError as exc:
                meta["errors"].append({"provider": exc.provider, "error": str(exc)})
                provider_failed = True
            if len(provider_sources) >= 12:
                break
        if provider_sources and not (provider_failed and not provider_sources):
            used_provider = provider
            all_sources.extend(provider_sources)
            break  # primary provider succeeded; stop the chain

    # de-duplicate across queries
    seen, deduped = set(), []
    for s in all_sources:
        key = s["url"].lower().rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        deduped.append(s)

    if deduped:
        meta["status"] = "ok"
        meta["provider"] = used_provider or meta["provider"]
        caveat = ""
        if used_provider == "wikipedia":
            caveat = (
                " Note: Wikipedia is encyclopedic context, not a fact-check; "
                "cross-reference primary sources."
            )
        meta["detail"] = "%d source(s) retrieved via %s.%s" % (len(deduped), used_provider, caveat)
    else:
        meta["status"] = "failed"
        if meta["errors"]:
            first = meta["errors"][0]["error"]
            meta["detail"] = (
                "Evidence retrieval failed (%s). No sources were found, so the "
                "verdict will reflect missing evidence." % first
            )
        else:
            meta["detail"] = (
                "The search returned no relevant results for this claim. "
                "Absence of results is not evidence against the claim."
            )
    return deduped[:12], meta
