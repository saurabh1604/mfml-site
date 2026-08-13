# Dev sources — The Math Behind the Machine (linearalgebra.info)

Editable pipeline for the published pages in the repo root.

- `src/*.html` — canonical page sources (KaTeX as raw `\( \)` / `\[ \]`)
- `build.js` — pre-renders KaTeX + inlines fonts → `site/*.html` (copy those to repo root to publish)
- `build-all.sh` — full rebuild: restores `src/` from a pristine copy if you keep one, applies `patch-ux.js` → `patch-hub.js` → `patch-brand.js`, then builds. The patches are already applied to `src/`; they are kept for history and are idempotent (safe to re-run — they skip patched files).
- `verify*.js` — Playwright suites (expect the built pages at /home/claude/mfml-site/site or adjust paths):
  `verify.js` (unit 1 + hub), `verify-u2..u5.js` (widgets/checks), `verify-practice.js` (practice arenas), `verify-ux.js` (drawer TOC, resume, hub progress, a11y, print, no-overflow at 360–1680px)
- `content/` — transcribed lecture/companion/practice source texts
- `fragments/` — practice-arena CSS + card template

Setup: `npm install` (needs `katex`), Playwright with Chromium for the verify suites.
