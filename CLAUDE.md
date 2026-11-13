# Fares & Rana — Wedding RSVP

Static wedding RSVP site (vanilla HTML, CSS, JavaScript), hosted on GitHub Pages from `main` / root.

- Repository: https://github.com/Mohammed-Hossam11/fares-rana-rsvp
- Live site: https://mohammed-hossam11.github.io/fares-rana-rsvp/
- Couple: Fares & Rana · 10 December 2026 · The Nile Ritz-Carlton, Cairo

## Structure

- `index.html` — page markup: exactly 2 full-screen sections: Hero, and Countdown + RSVP + tiny footer (`#rsvp`), with scroll snapping between them.
- `styles.css` — all styling; colour tokens are CSS variables at the top.
- `script.js` — countdown, step-by-step RSVP wizard, Google Apps Script submission (`APPS_SCRIPT_URL`).
- `Code.gs` — Google Apps Script backend; pasted into the Sheet's Apps Script editor, not used by the browser.

## Design rules

- Preserve the existing colours (cream, beige, caramel, mocha, chocolate brown), fonts (Allura script, Italiana serif, DM Sans) and animations unless explicitly told otherwise.
- Mobile first: phones (~390px) are the priority. Any change made for mobile is mirrored on desktop/laptop unless it is inherently narrow-screen (e.g. stacking the names); when the two conflict, mobile wins.
- Keep every asset path relative (no leading `/`) so the site works under the `/fares-rana-rsvp/` Pages subpath.
- Keep the site responsive on desktop, tablet and mobile: no horizontal scrolling, readable text sizes.
- Do not modify the RSVP submission backend, `APPS_SCRIPT_URL`, or `Code.gs` unless explicitly instructed.

## Development and Git workflow (standing instructions)

For every requested website modification:

1. Implement only the requested changes.
2. Preserve existing functionality, colours, fonts and design unless instructed otherwise.
3. Keep verification minimal: the owner tests the site personally. Only run a quick check when something is genuinely essential (e.g. a risky layout change or the RSVP flow), and keep any test report to a line or two.
4. Stage only the relevant modified files (never `git add -A` blindly).
5. Commit with a short, descriptive message.
6. Push to `origin/main` automatically. The owner has pre-authorised pushing successfully tested changes to `main`; do not wait to be asked.
7. Report whether the push succeeded and the commit message.

Safety rules:

- Never force-push, rewrite published history, or overwrite unrelated work.
- Never commit credentials, tokens, or guest response data (RSVP exports, CSV/XLSX files).
- If authentication fails or there is a merge conflict / rejected push, stop and report it. No destructive workarounds.
