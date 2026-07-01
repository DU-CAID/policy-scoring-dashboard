# Migration: personal site to DU-CAID

## 1. Publish under DU-CAID
1. Create the repo **DU-CAID/policy-scoring-dashboard** (public, empty — no README).
2. From this folder:
   ```bash
   git init && git add -A && git commit -m "Rebuild: Vite + CAID branding, fixed backend"
   git branch -M main
   git remote add origin https://github.com/DU-CAID/policy-scoring-dashboard.git
   git push -u origin main
   npm install && npm run deploy
   ```
3. In the new repo: Settings → Pages → confirm source is the `gh-pages` branch.
   The app will be live at **https://du-caid.github.io/policy-scoring-dashboard/**
   (org project pages publish at that path automatically).

## 2. Backend on Hugging Face
The existing Space (`steflangehennig/policy-scoring-api`) keeps working — the
frontend default points at it. To fully rebrand:
1. Create a **DU-CAID org on Hugging Face** (or keep your account) and a new
   Docker Space, e.g. `du-caid/policy-scoring-api`.
2. Upload `backend/app.py`, `backend/Dockerfile`, `backend/requirements.txt`,
   and `backend/README.md` (its YAML frontmatter configures the Space —
   the old `.huggingface.yaml` is no longer needed).
3. Add the `HF_TOKEN` secret in Space settings.
4. Point the frontend at it: create `.env` with
   `VITE_API_URL=https://du-caid-policy-scoring-api.hf.space`
   then `npm run deploy` again.
Either way, **redeploy the backend code** — the rebuilt `app.py` fixes the
rate limiter and document truncation and cuts the image from ~6 GB to ~250 MB
(much faster cold starts on the free tier).

## 3. Add to the CAID projects page
Paste the block from `projects-snippet.html` into `projects.html` in
DU-CAID/du-caid.github.io (it matches the existing section format).

## 4. Remove from your personal site
1. In **steflangehennig/policy-scoring-dashboard**: Settings → Pages →
   set Source to **None**. The old URL stops serving.
2. (Optional) Archive that repo, or add a README note pointing to the new home.
3. Remove any link to the old URL from steflangehennig.github.io pages.
