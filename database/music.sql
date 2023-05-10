-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: localhost:3306
-- Üretim Zamanı: 11 May 2023, 02:02:15
-- Sunucu sürümü: 10.6.13-MariaDB
-- PHP Sürümü: 8.1.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `ardaltun_music`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `songs`
--

CREATE TABLE `songs` (
  `id` int(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `artist` varchar(100) NOT NULL,
  `album` varchar(100) NOT NULL,
  `music` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Tablo döküm verisi `songs`
--

INSERT INTO `songs` (`id`, `name`, `artist`, `album`, `music`) VALUES
(1, 'ARAB GHETTO', 'Amentu', 'arab-getto.jpg', 'amentu-arab-ghettoprod-paisabeatz.mp3'),
(2, 'Hakim Bey', 'KADR', '13193931771497000145_mq.jpg', 'kadr-hakim-bey.mp3'),
(3, 'Sayısal Loto', 'ELMUSTO', 'sayısalloto.jpg', 'elmusto-sayisal-loto-prodby-yns.mp3'),
(4, 'OnlyFans', 'Lil Zey', 'onlyfans.jpg', 'lil-zey-onlyfans-official-music-video.mp3'),
(5, 'Herkes Gibisin', 'Semicenk', 'herkesgibisin.jfif', 'semicenk-herkes-gibisin.mp3'),
(6, 'FLEX SO HARD RMX', 'SUMMER CEM & UZI', 'flexsohard.jfif', 'summer-cem-uzi-flex-so-hard-rmx-official-video-prod-by-miksu-macloud.mp3'),
(7, 'Kalbin bana kaldı', 'ALIZADE & BEGE', 'kalbinbana.jpg', 'alizade-bege-kalbin-bana-kaldi-lyric-video.mp3'),
(8, 'ANORMAL', 'ALIZADE', 'anormal.jpg', 'alizade-anormal-official-video.mp3'),
(9, 'ÇALKALA', 'ELMUSTO', 'calkalaelmustoo.png', 'elmusto-calkala.mp3'),
(10, 'Zenti', 'EX', 'zenti.jpg', 'zenti.mp3'),
(11, 'İSTANBUL FLOW', 'Amentu', 'ist.jfif', 'amentu-istanbul-flowprod-cvn.mp3'),
(12, 'D.H.S', 'melfete', 'dhs.jpg', 'melfete-dhs-official-video.mp3'),
(16, 'Unchain My Heart', 'Joe Cocker', 'joe-cocker---unchain-my-heart-ikinci-el-016f.jpeg', 'Unchain My Heart.mp3'),
(17, 'Nah Neh Nah', 'Vaya Con Dios', 'VAYA-CON-DIOS-1282679367.jpeg', 'Nah Neh Nah.mp3'),
(18, 'Her Akşam Votka Rakı', 'Mary Jane', 'maxresdefault.jpeg', 'Mary Jane - Her Akşam Votka Rakı Şarap - Akustik Cover (Sözleri).mp3'),
(19, 'Kendime Yalan Söyledim', 'Seksendört', 'sddefault.jpeg', 'Seksendört - Kendime Yalan Söyledim.mp3'),
(20, 'Pembe Mezarlık', 'Model', 'x1080.jpeg', 'Model - Pembe Mezarlık.mp3'),
(21, 'Arnavut Kaldırımı', 'Demet Sağıroğlu', 's-50a7468337adeceb913a047dc6bdc542fcb2caaa.webp', 'Demet Sağıroğlu - Arnavut Kaldırımı.mp3'),
(22, 'Değmesin Ellerimiz', 'Model', '2aad4d47cc7cb816525862dc5f19ccff.1000x1000x1.png', 'biz hiç beceremedik, sevmeyi de terk etmeyi de..mp3'),
(23, 'Bir Derdim Var', 'Mor ve Ötesi', 'mqdefault.jpeg', 'Bir Derdim Var.mp3'),
(24, 'Gökyüzünü Tutamam', 'Can Koç', 'ab67616d0000b273183337eef9318285b10d6164.jpeg', 'Gökyüzünü Tutamam.mp3'),
(25, 'Ay Tenli Kadın', 'Ufuk Beydemir', 'artworks-000494116521-alnago-t500x500.jpeg', 'Ufuk Beydemir - Ay Tenli Kadın.mp3'),
(26, 'Yokluğunda', 'Leyla The Band', '5d235a8d24009f09525b20fc1b0f047e.640x640x1.jpg', 'Yokluğunda (Leyla The Band).mp3'),
(27, 'Bi Tek Ben Anlarim', 'Köfn', 'unnamed.jpeg', 'KÖFN - Bi Tek Ben Anlarım - (Official Video).mp3'),
(28, 'Beni Vur', 'Eda Baba', 'ab67616d0000b273147ba0cbad3aa78e82039b62.jpeg', 'Eda Baba - Beni Vur.mp3');

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `songs`
--
ALTER TABLE `songs`
  ADD PRIMARY KEY (`id`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `songs`
--
ALTER TABLE `songs`
  MODIFY `id` int(100) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
