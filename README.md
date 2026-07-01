# Policy Scoring Dashboard

A DU CAID research tool that scores policy documents (PDF/DOCX/TXT) on five
dimensions of evidence-based policymaking using an open-weights LLM, with
per-dimension justifications, radar-chart visualization, document comparison,
and CSV/PNG export.

**Live app:** https://du-caid.github.io/policy-scoring-dashboard/

## Architecture
- **Frontend** (repo root): React 19 + Vite + Tailwind, deployed to GitHub Pages via `gh-pages`.
- **Backend** (`backend/`): FastAPI on a Hugging Face Space (Docker), calling the HF Inference router (`MODEL_ID`, default Mistral-7B-Instruct-v0.3).

## Develop
```bash
npm install
npm run dev              # http://localhost:5173
# optional: point at a different backend
VITE_API_URL=http://localhost:7860 npm run dev
```

## Deploy
```bash
npm run deploy           # builds and pushes dist/ to the gh-pages branch
```
Backend: push the contents of `backend/` to the Hugging Face Space and set the
`HF_TOKEN` secret (Space settings → Variables and secrets).

## License
MIT
