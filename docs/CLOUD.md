# CLOUD.md — INFRASTRUCTURE, DEPLOYMENT & OPERATIONS
This document covers cloud infrastructure, not the Claude Code coding assistant. The coding-agent directive is CLAUDE.md.

## Architecture
Browser -> CDN/edge -> Next.js app -> CMS content API -> image/media CDN. Analytics and contact form endpoints are isolated services. 3D assets delivered as compressed static files with cache headers. Keep marketing content functional when 3D fails.

## Environments
local, preview/staging, production. Each has separate env vars, CMS datasets, analytics settings, and preview URLs. Production deployments require review and smoke test. Protect staging from indexing.

## Hosting and DNS
Prefer Vercel for Next.js unless existing infrastructure favors another provider. Point RayMindset.com as canonical; redirect www to canonical (or vice versa, choose once). Set HTTPS, HSTS after validation, DNS records, sitemap, robots, 404/500 behavior, and canonical metadata. Other purchased domains require ownership/spelling verification before redirects.

## Asset pipeline
Store original high-resolution media in a private source library; publish transformed responsive images and licensed video derivatives. Use AVIF/WebP for photos where supported, poster images for video, GLB/glTF with Draco/Meshopt/KTX2 where appropriate, and progressive loading. Track provenance and usage rights.

## Security/privacy
Keep secrets in hosting vault; role-based CMS permissions; protect preview tokens; rate-limit contact form; spam protection; server-side validation; no client-side exposed API secrets. Collect minimum contact data; publish privacy policy; handle consent requirements for analytics by jurisdiction. Never publish client/patient data or internal financial information.

## CI/CD
PR -> install locked dependencies -> lint -> typecheck -> unit tests -> build -> preview deployment -> manual visual/a11y review -> production approval. Add dependency audit, error monitoring, uptime checks, backups and CMS export schedule.

## Observability
Capture web vitals, page errors, WebGL failure rates, 3D scene loading failures, contact conversion, article engagement, and broken routes. Avoid invasive session capture by default. Define event names: hero_enter, intro_skip, story_chapter_view, venture_open, article_open, social_click, contact_submit.

## Performance budget (initial, subject to device testing)
Hero must render useful text before 3D is ready. Prefer one hero canvas and reuse it rather than mounting many heavy canvases. Lazy load noncritical scenes. Establish measured JS, texture, polygon, and transfer budgets in proof-of-concept; never assume desktop GPU performance translates to mobile.

## Disaster recovery
Maintain documented DNS/hosting access owners, backups for CMS and assets, rollback to last good deployment, error alert routing, and a non-WebGL fallback mode. Never make DNS or production changes without explicit owner approval.

## Definition of done
Preview and production environments documented; verified domain, TLS, redirects, indexability, analytics, monitoring, contact delivery, rollback and CMS backups; ownership handed over to Ray/team.
