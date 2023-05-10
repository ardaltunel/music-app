<?php

include 'connect.php';


// Şarkı ID'sini al
if (isset($_GET['song_id'])) {
    $song_id = $_GET['song_id'];

    // Sıradaki şarkıyı getir
    if (isset($_GET['search'])) {
        $search    = $_GET['search'];
        $next_song = $conn -> prepare ("SELECT * FROM songs WHERE id > :id AND artist LIKE '%$search%' ORDER BY id ASC LIMIT 1");
    }
    else {
        $next_song = $conn -> prepare ("SELECT * FROM `songs` WHERE `id` > :id ORDER BY `id` ASC LIMIT 1");
    }
    $next_song -> execute (array (":id" => $song_id));
    if ($next_song -> rowCount () > 0) {
        // Şarkı bilgilerini dizide depola ve JSON olarak döndür
        $next_song_info = $next_song -> fetch (PDO::FETCH_ASSOC);
        echo json_encode ($next_song_info);
    }
    else {
        // Sıradaki şarkı yoksa hata kodu döndür
        http_response_code (404);
    }
}
else {
    // Şarkı ID'si belirtilmediyse hata kodu döndür
    http_response_code (400);
}
?>
