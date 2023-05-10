<?php
include '../cdn.ardaltunel.com/ardaltunel.php';

error_reporting (0);
$conn = new mysqli("localhost", "ardaltun", "A59i7a5zgB", "ardaltun_music");

if (mysqli_errno ($conn)) {
    die(mysqli_error ($conn));
}

if (isset($_GET['search']) && isset($_GET['submit'])) {
    $search = filter_var ($_GET['search'], FILTER_SANITIZE_FULL_SPECIAL_CHARS);
    $query  = "SELECT * FROM songs WHERE artist LIKE '%$search%' or name LIKE '%$search%'";
    $posts  = mysqli_query ($conn, $query);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <title>Music App - Arda Altunel</title>
    <?= $Meta ?><?= $GoogleTag ?><?= $GoogleAdSanse ?><?= $MetaIcons ?>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.2/css/all.min.css">
    <link rel="stylesheet" href="<?= $DomainUrlFullPath ?>/css/style.css">
</head>
<body>

<?php if (mysqli_num_rows ($posts) > 0) : ?>

    <section class="playlist">

        <h3 class="heading"><a href="/" style="color: var(--black) !important;">
                <span>All Found</span><br>
                <span>Click Me Go Home</span>
            </a></h3>

        <section class="search__bar">
            <form class="container search__bar-container" action="search.php" method="GET">
                <div style="width:100%">
                    <i class="uil uil-search"></i>
                    <input type="search" name="search" placeholder="Search">
                </div>
                <button type="submit" name="submit">Go</button>
            </form>
        </section>

        <div class="box-container">
            <?php while ($post = mysqli_fetch_assoc ($posts)) : ?>
                <div class="box">
                    <?php if ($post['album'] != '') { ?>
                        <img src="uploaded_album/<?= $post['album']; ?>" alt="" class="album">
                    <?php } else { ?>
                        <img src="images/disc.png" alt="" class="album">
                    <?php } ?>
                    <div class="name"><?= $post['name']; ?></div>
                    <div class="artist"><?= $post['artist']; ?></div>
                    <div class="flex">
                        <div class="play" data-src="uploaded_music/<?= $post['music']; ?>"
                             data-id="<?= $post['id']; ?>">
                            <i class="fas fa-play"></i><span>Play</span></div>
                        <a href="uploaded_music/<?= $post['music']; ?>" download>
                            <i class="fas fa-download"></i><span>Download</span></a>
                    </div>
                </div>
            <?php endwhile ?>
            <div class="box more-btn">
                <a href="upload.php" class="btn">Upload Music</a>
            </div>
        </div>
    </section>

    <div class="music-player" id="myModal">
        <i class="fas fa-times" id="close"></i>
        <div class="main-box">
            <div class="left-box">
                <a id="prev_song_button" data-id=""><i class="fa fa-angle-left" aria-hidden="true"></i></a>
            </div>
            <div class="box box-custom">
                <img src="" class="album" alt="">
                <div class="name"></div>
                <div class="artist"></div>
                <audio src="" controls class="music" id="myAudio"></audio>
            </div>
            <div class="right-box">
                <a id="next_song_button" data-id=""><i class="fa fa-angle-right" aria-hidden="true"></i></a>
            </div>
        </div>
    </div>

<?php else : ?>
    <section class="playlist">
        <h3 class="heading"><a href="/" style="color: var(--black) !important;">
                <span>Not Found</span><br>
                <span>Click Me Go Home</span>
            </a></h3>

        <section class="search__bar">
            <form class="container search__bar-container" action="search.php" method="GET">
                <div style="width:100%">
                    <i class="uil uil-search"></i>
                    <input type="search" name="search" placeholder="Search">
                </div>
                <button type="submit" name="submit">Go</button>
            </form>
        </section>

        <div class="box-container">
            <div class="box more-btn">
                <a href="upload.php" class="btn">Upload Music</a>
            </div>
        </div>
    </section>

<?php endif ?>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.3/jquery.min.js"></script>
<script>
    let playBtn = document.querySelectorAll('.playlist .box-container .box .play');
    let musicPlayer = document.querySelector('.music-player');
    let musicAlbum = musicPlayer.querySelector('.album');
    let musicName = musicPlayer.querySelector('.name');
    let musicArtist = musicPlayer.querySelector('.artist');
    let music = musicPlayer.querySelector('.music');

    var prevSongButton = document.getElementById("prev_song_button");
    var nextSongButton = document.getElementById("next_song_button");

    playBtn.forEach(play => {

        play.onclick = () => {
            let src = play.getAttribute('data-src');
            let id = play.getAttribute('data-id');
            let box = play.parentElement.parentElement;
            let name = box.querySelector('.name');
            let album = box.querySelector('.album');
            let artist = box.querySelector('.artist');

            musicAlbum.src = album.src;
            musicName.innerHTML = name.innerHTML;
            musicArtist.innerHTML = artist.innerHTML;
            music.src = src;

            prevSongButton.setAttribute("data-id", id);
            nextSongButton.setAttribute("data-id", id);

            musicPlayer.classList.add('active');

            music.play();
        }
    });

    document.querySelector('#close').onclick = () => {
        musicPlayer.classList.remove('active');
        music.pause();
    }


    var modal = document.getElementById("myModal");

    window.onclick = function (event) {
        if (event.target == modal) {
            musicPlayer.classList.remove('active');
            music.pause();
        }
    }
</script>
<script>
    $("#next_song_button").click(function () {
        let musicPlayer = document.querySelector('.music-player');
        let musicAlbum = musicPlayer.querySelector('.album');
        let musicName = musicPlayer.querySelector('.name');
        let musicArtist = musicPlayer.querySelector('.artist');
        let music = musicPlayer.querySelector('.music');

        var nextSongButton = document.getElementById("next_song_button");
        var dataId = nextSongButton.getAttribute("data-id");
        var search = "<?= $_GET['search'] ?>";
        $.ajax({
            url: 'get-next-song.php',
            type: 'GET',
            dataType: "json",
            data: {
                song_id: dataId,
                search: search,
            },
            success: function (response) {
                var song = response;
                if (song) {

                    musicAlbum.src = "uploaded_album/" + song.album;
                    musicName.innerHTML = song.name;
                    musicArtist.innerHTML = song.artist;
                    music.src = "uploaded_music/" + song.music;

                    prevSongButton.setAttribute("data-id", song.id);
                    nextSongButton.setAttribute("data-id", song.id);

                    music.play();
                }
            },
            error: function (xhr, status, error) {
                console.log('AJAX error:', error);
            }
        });
    });

    $("#prev_song_button").click(function () {
        let musicPlayer = document.querySelector('.music-player');
        let musicAlbum = musicPlayer.querySelector('.album');
        let musicName = musicPlayer.querySelector('.name');
        let musicArtist = musicPlayer.querySelector('.artist');
        let music = musicPlayer.querySelector('.music');

        var prevSongButton = document.getElementById("prev_song_button");
        var dataId = prevSongButton.getAttribute("data-id");
        var search = "<?= $_GET['search'] ?>";
        $.ajax({
            url: 'get-prev-song.php',
            type: 'GET',
            dataType: "json",
            data: {
                song_id: dataId,
                search: search,
            },
            success: function (response) {
                var song = response;
                if (song) {

                    musicAlbum.src = "uploaded_album/" + song.album;
                    musicName.innerHTML = song.name;
                    musicArtist.innerHTML = song.artist;
                    music.src = "uploaded_music/" + song.music;

                    prevSongButton.setAttribute("data-id", song.id);
                    nextSongButton.setAttribute("data-id", song.id);

                    music.play();
                }
            },
            error: function (xhr, status, error) {
                console.log('AJAX error:', error);
            }
        });
    });

    const audio = document.getElementById('myAudio');
    audio.addEventListener('ended', function () {
        var nextSongButton = document.getElementById("next_song_button");
        var dataId = nextSongButton.getAttribute("data-id");
        var search = "<?= $_GET['search'] ?>";
        $.ajax({
            url: 'get-next-song.php',
            type: 'GET',
            dataType: "json",
            data: {
                song_id: dataId,
                search: search,
            },
            success: function (response) {
                var song = response;
                if (song) {

                    musicAlbum.src = "uploaded_album/" + song.album;
                    musicName.innerHTML = song.name;
                    musicArtist.innerHTML = song.artist;
                    music.src = "uploaded_music/" + song.music;

                    prevSongButton.setAttribute("data-id", song.id);
                    nextSongButton.setAttribute("data-id", song.id);

                    music.play();
                }
            },
            error: function (xhr, status, error) {
                console.log('AJAX error:', error);
            }
        });
    });

</script>
</body>
</html>