<?php

include 'connect.php';


// Şarkı ID'sini al
if (isset($_GET['song_id'])) {
    $song_id = $_GET['song_id'];
    if (isset($_GET['search'])) {
        $search    = $_GET['search'];
        $prev_song = $conn -> prepare ("SELECT * FROM songs WHERE id < :id AND artist LIKE '%$search%' ORDER BY id ASC LIMIT 1");
    }
    else {
        $prev_song = $conn -> prepare ("SELECT * FROM `songs` WHERE `id` < :id ORDER BY `id` DESC LIMIT 1");
    }
    $prev_song -> execute (array (":id" => $song_id));
    if ($prev_song -> rowCount () > 0) {
        // Şarkı bilgilerini dizide depola ve JSON olarak döndür
        $prev_song_info = $prev_song -> fetch (PDO::FETCH_ASSOC);
        echo json_encode ($prev_song_info);
    }
    else {
        // Önceki şarkı yoksa hata kodu döndür
        http_response_code (404);
    }
}
else {
    // Şarkı ID'si belirtilmediyse hata kodu döndür
    http_response_code (400);
}
?>