---
title: Policy Scoring API
emoji: 📊
colorFrom: red
colorTo: yellow
sdk: docker
app_port: 7860
---

# Policy Scoring API (DU CAID)

FastAPI backend for the CAID Policy Scoring Dashboard. Scores policy documents
(PDF/DOCX/TXT) on five evidence-based-policymaking dimensions using an
open-weights LLM via the Hugging Face Inference router.

**Space secrets required:** `HF_TOKEN` (a HF token with Inference Providers access).
**Optional:** `MODEL_ID` to swap models (default `mistralai/Mistral-7B-Instruct-v0.3`;
`Qwen/Qwen2.5-7B-Instruct` is a good alternative).

Endpoints: `POST /score` (multipart file), `GET /health`.
