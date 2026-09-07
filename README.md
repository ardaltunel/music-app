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

## Supabase health automation

`.github/workflows/supabase-keep-alive.yml` checks the public `songs` table four times daily (02:17, 08:17, 14:17 and 20:17 UTC; 05:17, 11:17, 17:17 and 23:17 in Turkey). It also runs when the health-check code/configuration changes and can be started from GitHub Actions with **Run workflow**.

The check uses the existing publishable key in the `apikey` header, verifies the response is a valid JSON catalogue result, applies a 20-second request timeout and retries transient failures up to four times. No song, profile or Storage data is changed. A failed check produces a failed Actions run and an explanatory run summary; configure GitHub Actions notifications to receive failures.

After a successful check, a separate job records a health snapshot in `.github/maintenance/supabase-health.json` at most once every 30 days. This job alone has repository `contents: write` permission. Its real maintenance commit refreshes repository activity so GitHub's public-repository 60-day inactivity rule does not silently disable the schedule. No empty commits are created, and health-record commits do not retrigger this workflow.

Validate locally with Node 24 (no npm dependencies required):

```text
node --test .github/scripts/supabase-keep-alive.test.mjs
node .github/scripts/supabase-keep-alive.mjs
```

On September 8, 2026, the previous three-day schedule was still enabled and its September 4 run had successfully queried the database. It was not a failed-job issue; insufficient overall activity is the likely explanation, not a proven pause cause. Supabase's Free plan evaluates sufficient database activity over a week, rather than merely whether one request occurred in that week.

**Limits:** this is a best-effort cloud health/keep-alive job, independent of your computer. It cannot guarantee uptime, override Supabase's Free-plan policy, or resume an already paused project using a public API key. A paid Supabase plan is the supported way to avoid automatic inactivity pausing. Branch protection, denied Actions write permissions, GitHub outages, disabled workflows or revoked API keys can still interrupt this system. The monthly snapshot must succeed as well as the database check.

References: [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [GitHub scheduled workflow inactivity](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).

## License

This project is licensed under the [MIT License](LICENSE).
