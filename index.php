<?php
include '../cdn.ardaltunel.com/ardaltunel.php';
include 'connect.php';
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

<section class="playlist">
    <h3 class="heading">Music Playlist</h3>

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

        <?php
        $select_songs = $conn -> prepare ("SELECT * FROM `songs`");
        $select_songs -> execute ();
        if ($select_songs -> rowCount () > 0) {
            while ($fetch_song = $select_songs -> fetch (PDO::FETCH_ASSOC)) {
                ?>
                <div class="box">
                    <?php
                    if ($fetch_song['album'] != '') { ?>
                        <img src="uploaded_album/<?= $fetch_song['album']; ?>" alt="" class="album">
                        <?php
                    }
                    else { ?>
                        <img src="images/disc.png" alt="" class="album">
                        <?php
                    } ?>
                    <div class="name"><?= $fetch_song['name']; ?></div>
                    <div class="artist"><?= $fetch_song['artist']; ?></div>
                    <div class="flex">
                        <div class="play" data-src="uploaded_music/<?= $fetch_song['music']; ?>"
                             data-id="<?= $fetch_song['id']; ?>">
                            <i class="fas fa-play"></i><span>Play</span>
                        </div>
                        <a href="uploaded_music/<?= $fetch_song['music']; ?>" download>
                            <i class="fas fa-download"></i><span>Download</span>
                        </a>
                        <?
                        if ($DeveloperMi) {
                            ?>
                            <a href="delete.php?id=<?= $fetch_song['id']; ?>" onclick="return ShowConfirm();">
                                <i class="fas fa-trash"></i><span>Delete</span>
                            </a>
                            <?
                        }
                        ?>
                    </div>
                </div>
                <?php
            }
        }
        ?>

        <script type="text/javascript">

            function ShowConfirm() {
                var confirmation = confirm("Are you sure?");
                if (confirmation) {
                    alert("Deleted.");
                }
                return confirmation;
            };

        </script>
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

        $.ajax({
            url: 'get-next-song.php',
            type: 'GET',
            dataType: "json",
            data: {
                song_id: dataId,
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

        $.ajax({
            url: 'get-prev-song.php',
            type: 'GET',
            dataType: "json",
            data: {
                song_id: dataId,
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
        $.ajax({
            url: 'get-next-song.php',
            type: 'GET',
            dataType: "json",
            data: {
                song_id: dataId,
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
