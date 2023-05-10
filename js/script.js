let playBtn = document.querySelectorAll('.playlist .box-container .box .play');
let musicPlayer = document.querySelector('.music-player');
let musicAlbum = musicPlayer.querySelector('.album');
let musicName = musicPlayer.querySelector('.name');
let musicArtist = musicPlayer.querySelector('.artist');
let music = musicPlayer.querySelector('.music');

let prevSongButton = musicPlayer.querySelector('#prev_song_button');
let nextSongButton = musicPlayer.querySelector('#next_song_button');

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