# Music App

Supabase destekli, GitHub Pages uyumlu statik müzik paylaşım platformu.

Bu proje kullanıcı kaydı, giriş sistemi, admin paneli, müzik yükleme akışı ve Supabase Storage entegrasyonu içerir. Supabase ayarı yapılmadığında uygulama `assets/data/songs.json` içindeki statik şarkı listesini kullanır.

## Özellikler

- Kullanıcı kayıt ve giriş sistemi
- Admin paneli
- Müzik yükleme ve onay akışı
- Şarkı düzenleme, gizleme ve silme
- Albüm kapağı yükleme
- Supabase Storage entegrasyonu
- Responsive tasarım
- GitHub Pages desteği
- Statik frontend mimarisi

## Kullanılan Teknolojiler

<p align="left">
  <img src="https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white">
  <img src="https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white">
  <img src="https://img.shields.io/badge/GitHub_Pages-121013?style=for-the-badge&logo=github&logoColor=white">
</p>

## Proje Yapısı

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

## Klasör Mantığı

- `assets/css/`: stil dosyaları
- `assets/js/`: uygulama ve Supabase istemci kodu
- `assets/images/`: favicon ve varsayılan görseller
- `assets/data/`: Supabase kapalıyken kullanılan statik veri
- `assets/uploads/albums/`: eski/statik albüm kapakları
- `assets/uploads/music/`: eski/statik müzik dosyaları
- `database/supabase/`: Supabase tablo, policy ve seed SQL dosyaları

## GitHub Pages Yayına Alma

1. GitHub Desktop ile projeyi ekleyin veya repository olarak yayınlayın.
2. GitHub repository ayarlarında `Settings > Pages` ekranına girin.
3. Aşağıdaki ayarları seçin:

```text
Deploy from a branch
Branch: main
Folder: /root
```

GitHub Pages adresi genellikle şu formattadır:

```text
https://username.github.io/repository-name/
```

## Supabase Ayarları

Supabase bağlantısı için şu dosyayı düzenleyin:

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

Güvenlik notu: `service_role`, secret key ve `.env` dosyalarını GitHub'a yüklemeyin.

## Supabase SQL Kurulumu

Supabase Dashboard içindeki SQL Editor ekranında sırasıyla çalıştırın:

```text
1. database/supabase/schema.sql
2. database/supabase/seed-songs.sql
3. database/supabase/admin-actions-policies.sql
```

İlk hesabınızı oluşturduktan sonra admin yapmak için:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

## Authentication URL Ayarı

Supabase Dashboard içinde `Authentication > URL Configuration` bölümüne GitHub Pages adreslerinizi ekleyin:

```text
https://username.github.io/repository-name/
https://username.github.io/repository-name/login.html
https://username.github.io/repository-name/admin.html
https://username.github.io/repository-name/upload.html
```

## Dosya Sistemi

Statik eski dosyalar repository içinde tutulur:

```text
assets/uploads/music/
assets/uploads/albums/
```

Yeni yüklenen dosyalar Supabase Storage içindeki `music-files` bucket'ına kaydedilir.

## Lisans

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

Made by Arda Altunel.
