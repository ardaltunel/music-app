<?php
include '../cdn.ardaltunel.com/ardaltunel.php';
include 'connect.php';

if (isset($_POST['submit'])) {

    $name   = $_POST['name'];
    $name   = filter_var ($name, FILTER_SANITIZE_STRING);
    $artist = $_POST['artist'];
    $artist = filter_var ($artist, FILTER_SANITIZE_STRING);

    if (!isset($artist)) {
        $artist = '';
    }

    $album          = $_FILES['album']['name'];
    $album          = filter_var ($album, FILTER_SANITIZE_STRING);
    $album_size     = $_FILES['album']['size'];
    $album_tmp_name = $_FILES['album']['tmp_name'];
    $album_folder   = 'uploaded_album/' . $album;

    if (isset($album)) {
        if ($album_size > 2000000) {
            $message[] = 'album size is too large!';
        }
        else {
            move_uploaded_file ($album_tmp_name, $album_folder);
        }
    }
    else {
        $album = '';
    }

    $music          = $_FILES['music']['name'];
    $music          = filter_var ($music, FILTER_SANITIZE_STRING);
    $music_size     = $_FILES['music']['size'];
    $music_tmp_name = $_FILES['music']['tmp_name'];
    $music_folder   = 'uploaded_music/' . $music;

    if ($music_size > 100000000) {
        $message[] = 'music size is too large!';
    }
    else {
        $upload_music = $conn -> prepare ("INSERT INTO `songs`(name, artist, album, music) VALUES(?,?,?,?)");
        $upload_music -> execute ([$name, $artist, $album, $music]);
        move_uploaded_file ($music_tmp_name, $music_folder);
        $message[] = 'new music uploaded!';
    }

}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <title>Upload Music - Arda Altunel</title>
    <?= $Meta ?><?= $GoogleTag ?><?= $GoogleAdSanse ?><?= $MetaIcons ?>

    <!-- font awesome cdn link  -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.2/css/all.min.css">

    <!-- custom css file link  -->
    <link rel="stylesheet" href="<?= $DomainUrlFullPath ?>css/style.css">

</head>
<body>

<?php
if (isset($message)) {
    foreach ($message as $message) {
        echo '
      <div class="message">
         <span>' . $message . '</span>
         <i class="fas fa-times" onclick="this.parentElement.remove();"></i>
      </div>
      ';
    }
}
?>

<section class="form-container">

    <h3 class="heading"><a href="/" style="color: var(--black) !important;">
            <span>Upload Music</span><br>
            <span>Click Me Go Home</span>
        </a></h3>

    <form action="" method="POST" enctype="multipart/form-data">
        <p>Music Name <span>*</span></p>
        <input type="text" name="name" placeholder="Enter Music Name" required maxlength="100" class="box">
        <p>Artist Name</p>
        <input type="text" name="artist" placeholder="Enter Artist Name" maxlength="100" class="box">
        <p>Select Music <span>*</span></p>
        <input type="file" name="music" class="box" required accept="audio/*">
        <p>Select Album Photo</p>
        <input type="file" name="album" class="box" accept="image/*">
        <input type="submit" value="upload music" class="btn" name="submit">
        <a href="/" class="option-btn">Go To Home</a>
    </form>

</section>

</body>
</html>