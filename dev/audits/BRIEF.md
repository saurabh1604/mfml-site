# Implementation brief — full polish pass (2026-09-01)

You own exactly ONE file: `/root/mfml-site/dev/src/unit-0N.html`. Do not edit any other file in `src/` or `tpl/` (the hub, shared templates and other units are handled separately). Your audit is in `/root/mfml-site/dev/audits/unit-0N.md` — read it first, then read your unit's src fully before editing.

## What "full polish" means (owner's decision)
1. **Fix every defect in audit §1 and every bug in §2** (stray `</div>`, clipping, label collisions, wrong verdicts, raw LaTeX, mobile-unreadable SVGs, tables outside the prose column, TOC rail overlap at 1420–1440px → raise the rail breakpoint to 1520px in this unit's CSS).
2. **Upgrade widgets** per audit §2: live equation readouts with the current numbers plugged in, presets, "▶ play" tweens (use the shared `tween()` — it respects reduced motion), a one-line "Try:" prompt under widget heads where missing, hide-until-found where the audit suggests, touch equivalents for hover-only. Keep every existing widget id and every existing check id/meaning (returning students' progress is keyed on them). New checks get NEW ids (continue numbering from the unit's max).
3. **Add the missing pictures** from audit §3 as inline static SVGs (theme-aware: stroke/fill via CSS vars `--ink`, `--ink-muted`, `--s1..--s7`, `--surface`, `--line`; use `color-mix(in srgb, var(--sX) N%, transparent)` for washes; viewBox + `width:100%;height:auto;max-width:…`; readable ≥11px text at 390px — use a `min-width` + horizontal-scroll wrapper when an SVG can't shrink). Aim for every §3 item unless it is clearly low value; prefer small, honest diagrams that show the mechanism.
4. **Readability pass** per §4: split walls of text into steps/lists/mini-tables, put the plain "why" sentence first, add a one-line "so what" where missing, and **trim over-literary asides by ~15%** (keep analogies and the storytelling frame; cut winking phrases like "ever the freeloader", "wearing a hat", "sends its regards"). Never make text denser.
5. **Proof layer**: add `.derive` boxes for the rules listed in audit §5 (aim for all of them; at minimum 5). Copy the `.derive` CSS + markup pattern from `/root/mfml-site/dev/src/unit-07.html` (search `class="derive"`; CSS block starts at `.derive{`). Pattern: a `.dhead` title ("Why … — derived"), then `.dstep` rows each with numbered `.dn` circle, a math line, and a `.dwhy` plain-words justification of THAT step, ending with `.dqed` ∎ attached to the last sentence (wrap in `<span style="white-space:nowrap">`). Every step must be a genuine algebraic step a student could re-do; plain words, no hand-waving. Fix the imprecisions listed in §5 too.
6. Anything new must be **mathematically verified**: compute every printed number with python/sympy/numpy before it goes in. Never put math inside an `<h2>` (the TOC reads textContent).

## House rules (don't break these)
- Source is raw KaTeX `\( \)` / `\[ \]`; `node build.js` pre-renders to `site/`. KaTeX 0.18.4 — no `\xrightarrow` overflows in a 44rem column; break long display equations with `aligned`/`\\`.
- Structure: `<section id="sN">` with `.sec-num` displayed numbers; widgets are `.widget` cards (66rem) and prose is `.prose` (44rem). The page-wide IIFE from js-shared closes with `})();` after the widgets — check you don't break it. Do NOT insert new sections (renumbering is a trap); put new material inside existing sections.
- `.widget svg{display:block;…}` must NOT hit KaTeX radicals — add `.widget .katex svg{display:inline;width:auto;height:auto}` if your unit has the rule.
- Reduced motion: any animation goes through `tween()` or checks `prefers-reduced-motion`.
- Brand: never write MFML/ZC416/BITS/WILP anywhere in the page.
- Practice arena problems: keep them; fix counts in prose if they're wrong.

## Verify before you finish (mandatory)
1. `cd /root/mfml-site/dev && node build.js unit-0N.html` (build ONLY your file — others are building concurrently) must print `build ok`.
2. `PW_CHROMIUM=/opt/pw-browsers/chromium node verify-uN.js` (if it exists for your unit) and `PW_CHROMIUM=/opt/pw-browsers/chromium node verify-practice.js` — they expect `/home/claude/mfml-site/site` (symlink exists). If a suite fails only because you intentionally changed a count/label, update the expectation in that verify file (you MAY edit `verify-uN.js` and, for your unit's rows only, `verify-practice.js`; do NOT edit `verify-ux.js` — report the new counts instead).
3. Re-screenshot your unit: `PW_CHROMIUM=/opt/pw-browsers/chromium node shots.js` is page-wide and slow — instead write a tiny script (copy the pattern from `shots.js`) that shoots only your unit at 1440 and 390 into `shots-after/unit-0N/`, then LOOK at every desktop shot and the mobile shots of sections you changed with the Read tool. Fix what looks wrong. Iterate until clean.
4. Open the built page in Playwright and assert: zero console errors, every `getElementById` target exists (grep ids vs. calls), every widget control fires (dispatch `input` on each range/select and click each button) without throwing.
5. Confirm no horizontal page overflow at 360, 390, 768, 1024, 1440, 1680px: `document.documentElement.scrollWidth <= window.innerWidth`.

## Report back (final message, ≤300 words)
- Final counts: widgets · checks (and max check id) · problems · derive boxes; hero-chip text you set.
- What you changed per section (one line each).
- Anything you could not do and why.
- Any change other files will need (hub counts, verify-ux expectations).
