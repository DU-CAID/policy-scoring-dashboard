"""Policy Scoring API — DU CAID
Scores policy documents on five evidence-based-policymaking dimensions
using an open-weights LLM via the Hugging Face Inference router.
"""
import json
import os
import re
import tempfile
import time

import pdfplumber
import requests
from docx import Document as DocxDocument
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.status import HTTP_429_TOO_MANY_REQUESTS

# ---------------------------------------------------------------- config ---
MODEL_ID = os.getenv("MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.3")
HF_TOKEN = os.getenv("HF_TOKEN")
CHAT_URL = "https://router.huggingface.co/v1/chat/completions"

MAX_FILE_BYTES = 8 * 1024 * 1024          # 8 MB upload cap
HEAD_CHARS = 16_000                        # leading slice of document
TAIL_CHARS = 8_000                         # trailing slice (evaluation sections
                                           # often live at the end of a policy)
RATE_LIMIT = 8                             # scores per IP per window
TIME_WINDOW = 30 * 60                      # 30 minutes

ALLOWED_ORIGINS = [
    "https://du-caid.github.io",
    "https://steflangehennig.github.io",
    "http://localhost:5173",
    "http://localhost:3000",
]

DIMENSIONS = [
    "Use of Empirical Research",
    "Formal Evidence-Gathering Process",
    "Transparency and Accessibility",
    "Expert and Stakeholder Input",
    "Evaluation and Iteration",
]

RUBRIC = """Score the policy document on five dimensions of evidence-based policymaking.
Each dimension gets an integer score 0-3 ("NA" only if the document is not a policy document at all):
0 = no evidence of the dimension; 1 = minimal or implicit evidence;
2 = moderate or partial evidence; 3 = clear, strong, explicit evidence.

1. Use of Empirical Research — 0: no references to data or research; 1: vague/anecdotal ("studies show"); 2: clear empirical support, limited sourcing; 3: multiple clearly cited, high-quality sources.
2. Formal Evidence-Gathering Process — 0: none; 1: informal/anecdotal input; 2: basic assessments (internal reports, cost estimates); 3: formal tools (RCTs, modeling, pilots).
3. Transparency and Accessibility — 0: no documentation or rationale; 1: minimal/internal-only; 2: public access with basic explanation; 3: fully open, replicable, detailed methods.
4. Expert and Stakeholder Input — 0: none; 1: informal or minimal consultation; 2: some formal consultation or stakeholder review; 3: broad engagement with named experts or stakeholders.
5. Evaluation and Iteration — 0: no evaluation plan; 1: vague one-time mention; 2: evaluation with some detail; 3: robust ongoing evaluation and iteration."""

app = FastAPI(title="Policy Scoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------- rate limiting ---
# HF Spaces sits behind a proxy, so request.client.host is the proxy address
# for every visitor; use the first X-Forwarded-For hop instead.
_ip_log: dict[str, list[float]] = {}


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (request.client.host or "unknown")


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    # only meter actual scoring calls — never CORS preflights or health checks
    if request.method == "POST" and request.url.path == "/score":
        ip, now = _client_ip(request), time.time()
        hits = [t for t in _ip_log.get(ip, []) if now - t < TIME_WINDOW]
        if len(hits) >= RATE_LIMIT:
            wait_min = int((TIME_WINDOW - (now - hits[0])) // 60) + 1
            return JSONResponse(
                status_code=HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": f"Rate limit reached ({RATE_LIMIT} documents per 30 minutes). Try again in about {wait_min} min."},
            )
        hits.append(now)
        _ip_log[ip] = hits
    return await call_next(request)


# ------------------------------------------------------------ extraction ---
def extract_text(path: str, filename: str) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        with pdfplumber.open(path) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    elif name.endswith(".docx"):
        text = "\n".join(p.text for p in DocxDocument(path).paragraphs)
    elif name.endswith(".txt"):
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    else:
        raise ValueError("Unsupported file type")
    return re.sub(r"[ \t]+", " ", text).strip()


def slice_document(text: str) -> str:
    """Keep the head and tail of long documents instead of just the first
    30 sentences, so citations up front and evaluation plans at the back
    both reach the model."""
    if len(text) <= HEAD_CHARS + TAIL_CHARS:
        return text
    return text[:HEAD_CHARS] + "\n\n[... middle of document omitted ...]\n\n" + text[-TAIL_CHARS:]


# ------------------------------------------------------------- LLM call ---
def extract_json(text: str) -> dict | None:
    """Find the first balanced JSON object containing all rubric keys."""
    text = re.sub(r"```(?:json)?", "", text)
    for start in [m.start() for m in re.finditer(r"\{", text)]:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        obj = json.loads(text[start : i + 1])
                    except json.JSONDecodeError:
                        break
                    if all(k in obj for k in DIMENSIONS):
                        return obj
                    break
    return None


def normalize(parsed: dict) -> dict:
    """Coerce every dimension into {"score": int 0-3 | "NA", "justification": str}."""
    out = {}
    for dim in DIMENSIONS:
        entry = parsed.get(dim, {})
        if not isinstance(entry, dict):
            entry = {"score": entry, "justification": ""}
        score = entry.get("score", "NA")
        try:
            score = max(0, min(3, int(score)))
        except (TypeError, ValueError):
            score = "NA"
        out[dim] = {"score": score, "justification": str(entry.get("justification", "")).strip()}
    return out


def score_with_llm(document_text: str) -> dict:
    payload = {
        "model": MODEL_ID,
        "temperature": 0.2,
        "max_tokens": 1200,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a policy analyst evaluating how evidence-based a policy document is. "
                    "Respond with ONLY a JSON object — no prose, no markdown fences. Keys are the five rubric "
                    "dimensions exactly as named; each value is an object with an integer \"score\" (0-3) and a "
                    "one-sentence \"justification\" grounded in the document's specific text."
                ),
            },
            {
                "role": "user",
                "content": f"RUBRIC:\n{RUBRIC}\n\nPOLICY DOCUMENT:\n{document_text}\n\nReturn the JSON object now.",
            },
        ],
    }
    res = requests.post(
        CHAT_URL,
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        json=payload,
        timeout=120,
    )
    if res.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Model error ({res.status_code}): {res.text[:300]}")
    content = res.json()["choices"][0]["message"]["content"]
    parsed = extract_json(content)
    if parsed is None:
        raise HTTPException(status_code=502, detail="Model did not return valid JSON. Please retry.")
    return normalize(parsed)


# -------------------------------------------------------------- endpoints ---
@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_ID}


@app.post("/score")
async def score_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail="Unsupported file type — upload a PDF, DOCX, or TXT file.")

    raw = await file.read()
    if len(raw) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (8 MB max).")

    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(raw)
        tmp_path = tmp.name

    try:
        text = extract_text(tmp_path, file.filename)
        if len(text) < 200:
            raise HTTPException(status_code=422, detail="Could not extract enough text from this file (scanned PDFs without OCR are not supported).")
        scores = score_with_llm(slice_document(text))
        return {"filename": file.filename, "model": MODEL_ID, "scores": scores}
    finally:
        os.unlink(tmp_path)
