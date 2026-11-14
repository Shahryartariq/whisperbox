# Changelog

## 1.0.0 (2026-11-13)

First public release.

### Features
- Ask a question and get a share link (copy, WhatsApp or the device share sheet).
- Anonymous answers that appear on the wall in real time.
- The asker can close a question, delete answers or delete the whole question.
- "Your questions" list for the browser that asked them.
- `/ideas`: 44 question ideas in five groups, each one tap from a new link.
- Link-preview image for every question.

### Security
- Firestore rules: answers store no author, only the asker can manage a question, nothing can be edited after posting, and length and rate limits apply (1 question per 30 s, 1 answer per 10 s per browser).
- Content Security Policy, HSTS and other security headers.
- Lean Firebase Auth setup (no popup helper script or iframe).
- Patched a vulnerable transitive dependency (`@grpc/grpc-js`), with a dependency audit in CI, Dependabot, `SECURITY.md` and `security.txt`.

### SEO
- Canonical URLs, Open Graph and X cards, sitemap, robots.txt, web app manifest and icons.
- JSON-LD: WebSite, WebApplication, FAQPage, BreadcrumbList.
- Question pages are `noindex` (personal content) but keep their link previews.

### Pages
- Home with how-it-works and FAQ, `/privacy`, `/terms`, error and not-found pages.

### Reliability
- Error messages say what actually happened (too fast, no connection, service busy) instead of always blaming the rate limit.
- A countdown shows when you can send the next answer or create the next question.
- Offline, sending explains the wait and completes when the connection returns.
- Answers load even when the anonymous sign-in is slow or blocked, and sign-in retries when you're back online.
- A failed database lookup on the server no longer shows "no question at this link" for a real question.
- One anonymous sign-in per page, so a browser's identity can't change mid-visit.
- Deleting an answer takes two taps, and failed deletes or copies are reported.
- The asker no longer sees the answer box flash on their own question.
- "Report it" link on every question, and a note when a wall passes 300 answers.

### Performance
- Fonts are self-hosted through `next/font` with the headline font preloaded.
- Firebase loads on demand after the page has rendered.
- Server functions run in Mumbai, next to the database.

### Fixes
- The home form no longer stays stuck on "Creating your link…" after you delete a question and come back.
- Inner pages (`/ideas`, `/privacy`, `/terms`) now carry their own social title, URL and preview image.
