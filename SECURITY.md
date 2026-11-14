# Security

## Reporting a problem

If you find a security problem in Whisperbox, please report it privately:

- Use **[Report a vulnerability](https://github.com/Shahryartariq/whisperbox/security/advisories/new)** on GitHub, or
- open an [issue](https://github.com/Shahryartariq/whisperbox/issues) that says only that you have a security report, without the details.

Please include what you did, what happened and what you expected. You'll get a reply within a week.

## How the app is protected

- **Database rules** ([`firestore.rules`](firestore.rules), tested in CI): answers store no author, only the asker's browser can manage a question, nothing can be edited after posting, and length and rate limits apply.
- **Browser protections:** Content Security Policy, HSTS and related headers ([`next.config.ts`](next.config.ts)).
- **No secrets in the app:** the Firebase web config is public by design; the rules above are what protect the data.
- **Dependencies:** audited in CI and kept current by Dependabot.

## Known limits

- Rate limits are per browser. Someone who resets their browser identity can get around them, within Firebase's own per-IP sign-up limits. Firebase App Check is the planned fix.
- There is no automatic content moderation. The asker can delete any answer and close or delete a question.
