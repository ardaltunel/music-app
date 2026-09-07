# Music App

A static music-sharing platform powered by Supabase and compatible with GitHub Pages.

This project includes user registration, authentication, an admin panel, a music upload workflow, and Supabase Storage integration. When Supabase is not configured, the application uses the static song list located in `assets/data/songs.json`.

---

# 📸 Preview

<p align="center">
  <img width="1891" height="900" alt="Music application preview" src="https://github.com/user-attachments/assets/05c07c4d-eecf-4318-8f9f-4e5535f92f41" />
</p>

---

## Features

* User registration and login system
* Admin panel
* Music upload and approval workflow
* Song editing, hiding, and deletion
* Album cover uploads
* Supabase Storage integration
* YouTube search fallback with the official embedded player
* Responsive design
* GitHub Pages support
* Static frontend architecture

## Technologies Used

<p align="left">
  <img src="https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white">
  <img src="https://img.shields.io/badge/GitHub_Pages-121013?style=for-the-badge&logo=github&logoColor=white">
</p>

## Project Structure

```text
.
├── .github/
│   └── workflows/
├── assets/
│   ├── css/
│   ├── data/
│   ├── images/
│   ├── js/
│   └── uploads/
│       ├── albums/
│       └── music/
├── database/
│   └── supabase/
│       ├── admin-actions-policies.sql
│       ├── schema.sql
│       └── seed-songs.sql
├── 404.html
├── admin.html
├── index.html
├── login.html
├── register.html
├── search.html
└── upload.html
```

## Directory Overview

* `assets/css/`: Stylesheets
* `assets/js/`: Application logic and Supabase client code
* `assets/images/`: Favicons and default images
* `assets/data/`: Static data used when Supabase is not configured
* `assets/uploads/albums/`: Legacy or static album cover files
* `assets/uploads/music/`: Legacy or static music files
* `database/supabase/`: Supabase table definitions, policies, and seed SQL files

## Deploying to GitHub Pages

1. Add the project through GitHub Desktop or publish it as a GitHub repository.
2. Open `Settings > Pages` in the GitHub repository.
3. Select the following options:

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

The GitHub Pages URL will usually follow this format:

```text
https://username.github.io/repository-name/
```

## Supabase Configuration

Edit the following file to configure the Supabase connection:

```text
assets/js/supabase-config.js
```

```js
window.MUSIC_SUPABASE_CONFIG = {
    url: 'https://PROJECT_ID.supabase.co',
    anonKey: 'SUPABASE_ANON_KEY',
    storageBucket: 'music-files'
};
```

> **Security Notice:** Never upload your `service_role` key, secret keys, or `.env` files to GitHub.

## Supabase SQL Setup

Run the following files in the Supabase Dashboard SQL Editor in the specified order:

```text
1. database/supabase/schema.sql
2. database/supabase/seed-songs.sql
3. database/supabase/admin-actions-policies.sql
4. database/supabase/security-hardening.sql
```

After creating your first account, run the following query to assign administrator privileges:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## Authentication URL Configuration

In the Supabase Dashboard, open `Authentication > URL Configuration` and add your GitHub Pages URLs:

```text
https://username.github.io/repository-name/
https://username.github.io/repository-name/login.html
https://username.github.io/repository-name/admin.html
https://username.github.io/repository-name/upload.html
```

## Google Authentication

Google ile giriş ve kayıt özelliğini etkinleştirmek için:

1. Google Cloud Console'da bir **Web application** OAuth istemcisi oluşturun.
2. Google istemcisinin **Authorized redirect URIs** listesine Supabase geri çağırma adresini ekleyin:

   ```text
   https://zgqjzsueslitzyewoqwc.supabase.co/auth/v1/callback
   ```

3. Supabase Dashboard'da `Authentication > Providers > Google` bölümünden sağlayıcıyı etkinleştirip Google Client ID ve Client Secret değerlerini kaydedin.
4. Supabase Dashboard'da `Authentication > URL Configuration > Redirect URLs` listesine şu adresleri ekleyin:

   ```text
   https://ardaltunel.github.io/music/login.html
   https://ardaltunel.github.io/music/register.html
   http://localhost:8000/login.html
   http://localhost:8000/register.html
   ```

Google OAuth hem mevcut kullanıcıların girişini hem de ilk kez gelen kullanıcıların kaydını aynı güvenli akış üzerinden tamamlar. Mevcut bir Supabase kurulumunda Google profil adının `profiles.name` alanına aktarılması için `database/supabase/google-auth-profile.sql` dosyasını SQL Editor'da bir kez çalıştırın. Yeni kurulumlarda bu destek zaten `schema.sql` içindedir.

## File Storage

Legacy static files are stored directly in the repository:

```text
assets/uploads/music/
assets/uploads/albums/
```

Newly uploaded files are stored in the `music-files` bucket in Supabase Storage.

## YouTube Search Fallback

When a search has no match in the local `songs` catalog, the search page calls the `youtube-search` Supabase Edge Function and displays embeddable YouTube music results. YouTube videos are played with the official visible iframe player and are never downloaded or copied into Storage.

1. In Google Cloud Console, enable **YouTube Data API v3** and create an API key. Restrict the key to the YouTube Data API.
2. Authenticate and link the Supabase CLI:

```text
npx supabase login
npx supabase link --project-ref zgqjzsueslitzyewoqwc
```

3. Store the API key as an Edge Function secret. Do not add it to `assets/js/supabase-config.js` or commit it to Git:

```text
npx supabase secrets set YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
```

4. Deploy the public search function:

```text
npx supabase functions deploy youtube-search --no-verify-jwt --use-api
```

The function accepts the production GitHub Pages origin and localhost by default. If the site later uses a custom domain, add it as a comma-separated secret before deploying:

```text
npx supabase secrets set ALLOWED_ORIGINS=https://music.example.com
```

## License

This project is licensed under the [MIT License](LICENSE).

## Development and verification

The production site still uses plain HTML, CSS and JavaScript; no framework or Node server is required by GitHub Pages. Node 24 is used only for local tooling.

```text
npm ci
npm run check
npm run dev
```

`check` runs lint, strict typechecking of the shared validation module and Edge Function, behavioral tests, PostgreSQL RLS tests via PGlite, and a static build into `dist/`. The legacy DOM application remains JavaScript and is covered by lint and behavioral tests rather than a full TypeScript conversion. The build verifies HTML asset references and the static catalogue's files. GitHub Pages can continue serving the repository root as before.

For isolated visual testing when Supabase is unavailable:

```text
npm run dev:fixture
```

Open `http://127.0.0.1:8001`. On this **local test server only**, `upload.html?fixture=user` and `admin.html?fixture=admin` show sample authenticated layouts. These fixtures do not modify Supabase and are excluded from `dist/`. They are never loaded by production HTML.

### Security upgrade for an existing deployment

1. Resume the Supabase project if it is paused. At the September 8, 2026 audit it reported `INACTIVE`; no live database changes were applied.
2. Run `database/supabase/security-hardening.sql` **after** the previous schema/policy scripts. It is transactional and rerunnable, and deletes no rows or files. Keep the `private` schema out of the Data API's exposed schemas.
3. Deploy the updated `youtube-search` function using the existing deployment instructions. The SQL must precede the function: its daily budget RPC fails closed if unavailable. Supabase injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into Edge Functions; never put them in browser configuration.
4. Verify registration, email confirmation, Google OAuth, ordinary-user submission, admin approval/edit/delete, and file cleanup with dedicated test accounts on the resumed project.

The function permits 80 uncached upstream searches per YouTube quota day, shared across isolates using an atomic database counter. Its 15-minute in-memory cache and request coalescing reduce repeated calls. This is a global quota guard, not a per-user abuse prevention system. Origin checks are CORS controls, not authentication.

The existing `music-files` bucket remains public to preserve playback URLs. Hiding a song removes it from the catalogue, **not** from access through a previously known file URL. If private moderation assets are required, migrate to a separate private upload bucket and a controlled publication workflow. Browser MIME validation and bucket MIME restrictions are not malware scanning or server-side file-signature inspection.

See `docs/review.md` for the architecture review, verification scope and remaining limitations.
