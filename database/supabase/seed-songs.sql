-- Optional seed for the existing static songs.
-- Run schema.sql first, then run this file in Supabase SQL Editor.

insert into public.songs (id, user_id, name, artist, album_url, music_url, status, created_at)
values
(28, null, 'Beni Vur', 'Eda Baba', 'assets/uploads/albums/ab67616d0000b273147ba0cbad3aa78e82039b62.jpeg', 'assets/uploads/music/Eda Baba - Beni Vur.mp3', 'approved', '2026-05-03 14:03:20'),
(27, null, 'Bi Tek Ben Anlarim', 'Köfn', 'assets/uploads/albums/unnamed.jpeg', 'assets/uploads/music/KOÌˆFN - Bi Tek Ben AnlarÄ±m - (Official Video).mp3', 'approved', '2026-05-03 14:03:20'),
(26, null, 'Yokluğunda', 'Leyla The Band', 'assets/uploads/albums/5d235a8d24009f09525b20fc1b0f047e.640x640x1.jpg', 'assets/uploads/music/YoklugÌ†unda (Leyla The Band).mp3', 'approved', '2026-05-03 14:03:20'),
(25, null, 'Ay Tenli Kadın', 'Ufuk Beydemir', 'assets/uploads/albums/artworks-000494116521-alnago-t500x500.jpeg', 'assets/uploads/music/Ufuk Beydemir - Ay Tenli KadÄ±n.mp3', 'approved', '2026-05-03 14:03:20'),
(24, null, 'Gökyüzünü Tutamam', 'Can Koç', 'assets/uploads/albums/ab67616d0000b273183337eef9318285b10d6164.jpeg', 'assets/uploads/music/GoÌˆkyuÌˆzuÌˆnuÌˆ Tutamam.mp3', 'approved', '2026-05-03 14:03:20'),
(23, null, 'Bir Derdim Var', 'Mor ve Ötesi', 'assets/uploads/albums/mqdefault.jpeg', 'assets/uploads/music/Bir Derdim Var.mp3', 'approved', '2026-05-03 14:03:20'),
(22, null, 'Değmesin Ellerimiz', 'Model', 'assets/uploads/albums/2aad4d47cc7cb816525862dc5f19ccff.1000x1000x1.png', 'assets/uploads/music/biz hicÌ§ beceremedik, sevmeyi de terk etmeyi de..mp3', 'approved', '2026-05-03 14:03:20'),
(21, null, 'Arnavut Kaldırımı', 'Demet Sağıroğlu', 'assets/uploads/albums/s-50a7468337adeceb913a047dc6bdc542fcb2caaa.webp', 'assets/uploads/music/Demet SagÌ†Ä±rogÌ†lu - Arnavut KaldÄ±rÄ±mÄ±.mp3', 'approved', '2026-05-03 14:03:20'),
(20, null, 'Pembe Mezarlık', 'Model', 'assets/uploads/albums/x1080.jpeg', 'assets/uploads/music/Model - Pembe MezarlÄ±k.mp3', 'approved', '2026-05-03 14:03:20'),
(19, null, 'Kendime Yalan Söyledim', 'Seksendört', 'assets/uploads/albums/sddefault.jpeg', 'assets/uploads/music/SeksendoÌˆrt - Kendime Yalan SoÌˆyledim.mp3', 'approved', '2026-05-03 14:03:20'),
(18, null, 'Her Akşam Votka Rakı', 'Mary Jane', 'assets/uploads/albums/maxresdefault.jpeg', 'assets/uploads/music/Mary Jane - Her AksÌ§am Votka RakÄ± SÌ§arap - Akustik Cover (SoÌˆzleri).mp3', 'approved', '2026-05-03 14:03:20'),
(17, null, 'Nah Neh Nah', 'Vaya Con Dios', 'assets/uploads/albums/VAYA-CON-DIOS-1282679367.jpeg', 'assets/uploads/music/Nah Neh Nah.mp3', 'approved', '2026-05-03 14:03:20'),
(16, null, 'Unchain My Heart', 'Joe Cocker', 'assets/uploads/albums/joe-cocker---unchain-my-heart-ikinci-el-016f.jpeg', 'assets/uploads/music/Unchain My Heart.mp3', 'approved', '2026-05-03 14:03:20'),
(12, null, 'D.H.S', 'melfete', 'assets/uploads/albums/dhs.jpg', 'assets/uploads/music/melfete-dhs-official-video.mp3', 'approved', '2026-05-03 14:03:20'),
(11, null, 'İSTANBUL FLOW', 'Amentu', 'assets/uploads/albums/ist.jfif', 'assets/uploads/music/amentu-istanbul-flowprod-cvn.mp3', 'approved', '2026-05-03 14:03:20'),
(10, null, 'Zenti', 'EX', 'assets/uploads/albums/zenti.jpg', 'assets/uploads/music/zenti.mp3', 'approved', '2026-05-03 14:03:20'),
(9, null, 'ÇALKALA', 'ELMUSTO', 'assets/uploads/albums/calkalaelmustoo.png', 'assets/uploads/music/elmusto-calkala.mp3', 'approved', '2026-05-03 14:03:20'),
(8, null, 'ANORMAL', 'ALIZADE', 'assets/uploads/albums/anormal.jpg', 'assets/uploads/music/alizade-anormal-official-video.mp3', 'approved', '2026-05-03 14:03:20'),
(7, null, 'Kalbin bana kaldı', 'ALIZADE & BEGE', 'assets/uploads/albums/kalbinbana.jpg', 'assets/uploads/music/alizade-bege-kalbin-bana-kaldi-lyric-video.mp3', 'approved', '2026-05-03 14:03:20'),
(6, null, 'FLEX SO HARD RMX', 'SUMMER CEM & UZI', 'assets/uploads/albums/flexsohard.jfif', 'assets/uploads/music/summer-cem-uzi-flex-so-hard-rmx-official-video-prod-by-miksu-macloud.mp3', 'approved', '2026-05-03 14:03:20'),
(5, null, 'Herkes Gibisin', 'Semicenk', 'assets/uploads/albums/herkesgibisin.jfif', 'assets/uploads/music/semicenk-herkes-gibisin.mp3', 'approved', '2026-05-03 14:03:20'),
(4, null, 'OnlyFans', 'Lil Zey', 'assets/uploads/albums/onlyfans.jpg', 'assets/uploads/music/lil-zey-onlyfans-official-music-video.mp3', 'approved', '2026-05-03 14:03:20'),
(3, null, 'Sayısal Loto', 'ELMUSTO', 'assets/uploads/albums/sayÄ±salloto.jpg', 'assets/uploads/music/elmusto-sayisal-loto-prodby-yns.mp3', 'approved', '2026-05-03 14:03:20'),
(2, null, 'Hakim Bey', 'KADR', 'assets/uploads/albums/13193931771497000145_mq.jpg', 'assets/uploads/music/kadr-hakim-bey.mp3', 'approved', '2026-05-03 14:03:20'),
(1, null, 'ARAB GHETTO', 'Amentu', 'assets/uploads/albums/arab-getto.jpg', 'assets/uploads/music/amentu-arab-ghettoprod-paisabeatz.mp3', 'approved', '2026-05-03 14:03:20')
on conflict (id) do update
set name = excluded.name,
    artist = excluded.artist,
    album_url = excluded.album_url,
    music_url = excluded.music_url,
    status = excluded.status;

select setval(pg_get_serial_sequence('public.songs', 'id'), (select coalesce(max(id), 0) from public.songs));
