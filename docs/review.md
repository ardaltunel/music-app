# Repository review — 2026-09-08

## Architecture retained

The repository is a 6-screen static Turkish music-sharing application plus a legacy-route 404 handler. It has 25 bundled songs, album art and audio assets. There is no frontend framework, bundler, custom application server or pre-existing test suite. GitHub Pages hosts the site; Supabase provides Postgres, Auth, Storage and a Deno YouTube search function. The browser configuration contains a publishable key, not a service-role secret.

Public users browse approved songs, search the local catalogue, use YouTube fallback, listen through native audio or the official iframe, and download catalogue audio. Email/password and Google sign-in lead to submission. Ordinary submissions require moderation. Admins edit metadata/files and approve, hide or delete songs. A static catalogue is used only when the backend is unconfigured; it must not silently replace live data on an outage because this could resurrect moderated content.

`profiles` links Auth users to display names and roles. `songs` references profiles, stores either legacy URLs or Storage paths, and tracks publication status and timestamps. Auth triggers assign new accounts the user role. Admin authorization comes from the protected database profile, not user-editable Auth metadata. RLS is the server-side boundary; browser role checks are navigation conveniences.

## Implemented changes

- Fixed form `name` collisions, network-rejection button lockups, duplicate auth submissions and accidental native GET submission of credentials. Preserved safe next-page navigation through registration links.
- Protected media URLs against executable schemes and credentials; capped search length, validated upload size/type, and made file names collision resistant.
- Prevented a successful file replacement from deleting its new file after cleanup failure; mutations now require a returned row so RLS-denied zero-row changes cannot report success.
- Added retry and bounded waits for catalogue requests, playback-error feedback, one-shot broken-image fallbacks, auth sign-out synchronization and accessible messages.
- Reworked the collection around cover artwork, a restrained record illustration, consistent spacing and typography, distinct primary/secondary actions and a compact mobile list. Improved all forms, moderation filters/counters, the player and 404 screen. Preserved dark/light themes and existing functionality.
- Added associated labels, named icon actions, main landmarks, skip links, modal focus trapping/restoration, visible keyboard focus, reduced-motion handling and mobile touch targets. Removed mousemove-driven volume layout checks and focus stealing.
- Removed the remote font import and obsolete overflow stylesheet; retained lazy covers, added asynchronous decoding, avoided public profile-email fetches, bounded local cache growth, and started public catalogue loading independently of session lookup.
- Added canonical/OpenGraph metadata, sitemap, robots rules and noindex on account/admin/search pages.
- Added transactional SQL hardening: pending-only ordinary submissions, path ownership, protected profile columns, future-write text constraints, private reference-aware Storage deletion, restricted file enumeration and indexed publication/path lookups. No legacy data is deleted.
- Added Edge JSON/body-size validation, request coalescing, bounded cache and a service-role-only atomic daily budget. API secrets remain server-side; errors do not log upstream URLs containing keys.
- Pinned the browser Supabase dependency and local test dependencies, added a lockfile, static release validation and CI.

## Verification

`npm run check`: ESLint, strict TypeScript checks for core validation and Edge code, 14 behavior/security tests, and static build. Tests cover Turkish search, hostile media URLs, MIME/size validation, register-name binding, duplicate login submission, network failures, playback, labels/landmarks, admin cleanup failure, unavailable-catalogue retry, SQL roles/RLS/file references, malformed Edge inputs, cache/coalescing and quota exhaustion. PostgreSQL tests execute the actual setup and hardening SQL using PGlite, including a repeated upgrade.

Visual checks used the isolated local fixture server: all six screens at 320, 768 and 1440 px had no horizontal overflow. Additional 390 px checks covered the forms and moderation dialog. The 320 px player actually played local audio (unpaused and advancing time). Light and dark themes, tablet search, desktop covers and moderation layout were inspected in the browser.

## Deployment limitations and remaining risks

- Supabase returned `INACTIVE`; a read-only SQL inspection timed out. SQL/function changes have **not** been applied to production. Live RLS state, Google-provider configuration, email deliverability, real uploads and cloud Storage policies still require end-to-end verification after resumption. No live user data was mutated.
- The public bucket preserves known-file access even for pending/hidden tracks. Catalogue moderation is not file confidentiality. Private moderation would need a separate publication workflow.
- The daily search budget limits upstream quota exposure but attackers can consume the shared budget. For public growth, add identity-aware throttling or bot protection; CORS is not an abuse boundary.
- Upload MIME checks do not inspect file signatures or scan malware. Existing public upload semantics remain; stronger content screening belongs in a server-side intake workflow.
- The catalogue still downloads metadata for the current small collection. Beyond Supabase's response row cap (commonly 1,000), add server-side search and cursor pagination rather than silently relying on full-catalogue client filtering. No artificial pagination was added for 25 songs.
- External Font Awesome and Supabase CDN availability are still dependencies. The legacy browser DOM file has not been entirely converted to TypeScript; shared validation and Edge boundaries are strictly checked.
- Storage and Postgres mutations cannot form one atomic transaction. Cleanup is best effort; reference-aware RLS prevents deleting still-referenced paths, but retained unused objects may need later administrative cleanup.

Supabase references used during review: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [changelog](https://supabase.com/changelog).
