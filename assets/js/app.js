const SONG_DATA_URL = 'assets/data/songs.json';
const DEFAULT_ALBUM = 'assets/images/disc.png';
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const THEME_STORAGE_KEY = 'music-theme';
const YOUTUBE_SEARCH_FUNCTION = 'youtube-search';
const YOUTUBE_CACHE_TTL_MS = 15 * 60 * 1000;
const YOUTUBE_CACHE_PREFIX = 'music-youtube-search:';

let allSongs = [];
let visibleSongs = [];
let activeIndex = -1;
let currentSession = null;
let currentProfile = null;
let youtubeFallbackActive = false;
let youtubeFallbackFailed = false;

const page = document.body.dataset.page || 'home';
const params = new URLSearchParams(window.location.search);
const currentSearch = (params.get('search') || '').trim();
const backend = window.musicSupabase || { configured: false, client: null, bucket: 'music-files' };
const supabaseClient = backend.client;

const grid = document.querySelector('[data-song-grid]');
const searchForm = document.querySelector('[data-search-form]');
const searchInput = searchForm?.querySelector('input[name="search"]');
const authNav = document.querySelector('[data-auth-nav]');
const messageArea = document.querySelector('[data-message-area]');
const adminList = document.querySelector('[data-admin-list]');
const adminEditPanel = document.querySelector('[data-admin-edit-panel]');
const adminEditForm = document.querySelector('[data-admin-edit-form]');
const adminEditMessage = document.querySelector('[data-admin-edit-message]');

const player = document.querySelector('.music-player');
const playerAlbum = player?.querySelector('.album');
const playerName = player?.querySelector('.name');
const playerArtist = player?.querySelector('.artist');
const audio = player?.querySelector('.music');
const playerToggleButton = player?.querySelector('[data-player-toggle]');
const playerProgress = player?.querySelector('[data-player-progress]');
const playerCurrentTime = player?.querySelector('[data-current-time]');
const playerDuration = player?.querySelector('[data-duration]');
const playerMuteButton = player?.querySelector('[data-player-mute]');
const playerVolume = player?.querySelector('[data-player-volume]');
const playerVolumeGroup = player?.querySelector('.player-volume-group');
const playerDownload = player?.querySelector('[data-player-download]');
const nativePlayerControls = player?.querySelector('[data-native-player]');
const youtubePlayer = player?.querySelector('[data-youtube-player]');
const prevButton = player?.querySelector('#prev_song_button');
const nextButton = player?.querySelector('#next_song_button');
const closeButton = player?.querySelector('#close');

function storedTheme() {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
        return null;
    }
}

function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // Theme persistence is optional; the toggle still works for the current page.
    }
}

function preferredTheme() {
    const saved = storedTheme();
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.setAttribute('aria-label', isDark ? 'Açık moda geç' : 'Koyu moda geç');
        button.title = isDark ? 'Açık mod' : 'Koyu mod';
        button.innerHTML = isDark
            ? '<i class="fas fa-sun"></i><span>Açık</span>'
            : '<i class="fas fa-moon"></i><span>Koyu</span>';
    });
}

function themeToggleMarkup() {
    return '<button class="nav-button theme-toggle" type="button" data-theme-toggle aria-label="Koyu moda geç" title="Koyu mod"><i class="fas fa-moon"></i><span>Koyu</span></button>';
}

function bindThemeToggle() {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
            saveTheme(nextTheme);
            applyTheme(nextTheme);
        });
    });
    applyTheme(preferredTheme());
}

applyTheme(preferredTheme());

function normalizeText(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .toLocaleLowerCase('tr-TR');
}

function matchesSong(song, term) {
    const searchTerm = normalizeText(term);
    return normalizeText(song.name).includes(searchTerm) || normalizeText(song.artist).includes(searchTerm);
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function showMessage(message, type = 'info') {
    const target = messageArea || document.body;
    const item = document.createElement('div');
    item.className = `inline-message inline-message-${type}`;
    item.textContent = message;

    if (messageArea) {
        target.textContent = '';
        target.append(item);
    } else {
        item.classList.add('message');
        document.body.append(item);
        setTimeout(() => item.remove(), 7000);
    }
}

function isSupabaseReady() {
    return Boolean(backend.configured && supabaseClient);
}

function storagePublicUrl(path) {
    if (!path || !isSupabaseReady()) return '';
    const { data } = supabaseClient.storage.from(backend.bucket).getPublicUrl(path);
    return data?.publicUrl || '';
}

function localAssetPath(folder, fileName) {
    return fileName ? `${folder}/${encodeURIComponent(fileName).replace(/%2F/g, '/')}` : '';
}

function isYoutubeSong(song) {
    return song?.source === 'youtube' && /^[a-zA-Z0-9_-]{11}$/.test(song.provider_id || '');
}

function decodeHtmlEntities(value) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(value || '');
    return textarea.value;
}

function youtubeCacheKey(query) {
    return `${YOUTUBE_CACHE_PREFIX}${normalizeText(query)}`;
}

function readYoutubeCache(query) {
    try {
        const cached = JSON.parse(localStorage.getItem(youtubeCacheKey(query)) || 'null');
        if (!cached || Date.now() - cached.savedAt > YOUTUBE_CACHE_TTL_MS || !Array.isArray(cached.items)) {
            return null;
        }
        return cached.items;
    } catch {
        return null;
    }
}

function writeYoutubeCache(query, items) {
    try {
        localStorage.setItem(youtubeCacheKey(query), JSON.stringify({ savedAt: Date.now(), items }));
    } catch {
        // Search still works when browser storage is unavailable.
    }
}

function normalizeYoutubeSong(item) {
    const providerId = String(item?.provider_id || '');
    if (!/^[a-zA-Z0-9_-]{11}$/.test(providerId)) return null;

    return {
        id: `youtube:${providerId}`,
        source: 'youtube',
        provider_id: providerId,
        name: decodeHtmlEntities(item.name),
        artist: decodeHtmlEntities(item.artist) || 'YouTube',
        album_url: item.album_url || DEFAULT_ALBUM,
        external_url: `https://www.youtube.com/watch?v=${providerId}`
    };
}

async function searchYoutube(query) {
    const cached = readYoutubeCache(query);
    if (cached) return cached.map(normalizeYoutubeSong).filter(Boolean);

    let data;
    if (isSupabaseReady()) {
        const result = await supabaseClient.functions.invoke(YOUTUBE_SEARCH_FUNCTION, {
            body: { query }
        });
        if (result.error) throw new Error(result.error.message || 'YouTube araması tamamlanamadı.');
        data = result.data;
    } else {
        const config = window.MUSIC_SUPABASE_CONFIG || {};
        const url = String(config.url || '').replace(/\/$/, '');
        const publishableKey = String(config.anonKey || '');
        if (!/^https:\/\/.+\.supabase\.co$/i.test(url) || !publishableKey) {
            throw new Error('YouTube araması için Supabase bağlantısı gerekli.');
        }

        const response = await fetch(`${url}/functions/v1/${YOUTUBE_SEARCH_FUNCTION}`, {
            method: 'POST',
            headers: {
                apikey: publishableKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });
        data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'YouTube araması tamamlanamadı.');
    }

    if (!Array.isArray(data?.items)) throw new Error('YouTube araması geçersiz yanıt verdi.');

    const items = data.items.map(normalizeYoutubeSong).filter(Boolean);
    writeYoutubeCache(query, data.items);
    return items;
}

function normalizeAssetUrl(url) {
    const value = String(url || '');
    if (value.startsWith('uploaded_album/')) {
        return value.replace('uploaded_album/', 'assets/uploads/albums/');
    }
    if (value.startsWith('uploaded_music/')) {
        return value.replace('uploaded_music/', 'assets/uploads/music/');
    }
    return value;
}

function songAlbumUrl(song) {
    return song.albumSrc || normalizeAssetUrl(song.album_url) || storagePublicUrl(song.album_path) || localAssetPath('assets/uploads/albums', song.album) || DEFAULT_ALBUM;
}

function songMusicUrl(song) {
    return song.musicSrc || normalizeAssetUrl(song.music_url) || storagePublicUrl(song.music_path) || localAssetPath('assets/uploads/music', song.music);
}

function getSongDownloadName(song) {
    return song.music || song.music_path?.split('/').pop() || `${song.name || 'music'}.mp3`;
}

function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
}

function setRangeFill(range, percent) {
    if (!range) return;
    const clamped = Math.max(0, Math.min(100, percent));
    range.style.background = `linear-gradient(90deg, var(--main-color) ${clamped}%, rgba(255, 255, 255, .18) ${clamped}%)`;
}

function updatePlayerToggle() {
    if (!playerToggleButton || !audio) return;
    const isPlaying = !audio.paused;
    playerToggleButton.setAttribute('aria-label', isPlaying ? 'Duraklat' : 'Oynat');
    playerToggleButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function updatePlayerProgress() {
    if (!audio || !playerProgress) return;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const percent = duration ? (audio.currentTime / duration) * 100 : 0;
    playerProgress.value = String(percent);
    if (playerCurrentTime) playerCurrentTime.textContent = formatDuration(audio.currentTime);
    if (playerDuration) playerDuration.textContent = formatDuration(duration);
    setRangeFill(playerProgress, percent);
}

function updatePlayerVolume() {
    if (!audio) return;
    const effectiveVolume = audio.muted ? 0 : audio.volume;
    if (playerVolume) {
        playerVolume.value = String(effectiveVolume);
        setRangeFill(playerVolume, effectiveVolume * 100);
    }
    if (playerMuteButton) {
        const muted = audio.muted || audio.volume === 0;
        playerMuteButton.setAttribute('aria-label', muted ? 'Sesi aç' : 'Sesi kapat');
        playerMuteButton.innerHTML = muted
            ? '<i class="fas fa-volume-xmark"></i>'
            : '<i class="fas fa-volume-high"></i>';
    }
}

function bindPlayerVolumeGroup() {
    if (!playerVolumeGroup) return;
    const closeVolumeGroup = () => {
        if (playerVolumeGroup.contains(document.activeElement)) {
            document.activeElement.blur();
        }
        playerVolumeGroup.classList.remove('is-open');
    };
    playerVolumeGroup.addEventListener('mouseenter', () => {
        playerVolumeGroup.classList.add('is-open');
    });
    playerVolumeGroup.addEventListener('mouseleave', closeVolumeGroup);
    document.addEventListener('mousemove', (event) => {
        const rect = playerVolumeGroup.getBoundingClientRect();
        const outside = event.clientX < rect.left
            || event.clientX > rect.right
            || event.clientY < rect.top
            || event.clientY > rect.bottom;

        if (outside) {
            closeVolumeGroup();
        }
    });
    playerVolumeGroup.addEventListener('focusin', () => {
        playerVolumeGroup.classList.add('is-open');
    });
    playerVolumeGroup.addEventListener('focusout', () => {
        setTimeout(() => {
            if (!playerVolumeGroup.contains(document.activeElement)) {
                playerVolumeGroup.classList.remove('is-open');
            }
        }, 0);
    });
}

async function initSession() {
    if (!isSupabaseReady()) return;
    const { data } = await supabaseClient.auth.getSession();
    currentSession = data.session || null;
    if (currentSession) {
        currentProfile = await fetchCurrentProfile();
    }
}

async function fetchCurrentProfile() {
    if (!currentSession) return null;
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('id,name,email,role')
        .eq('id', currentSession.user.id)
        .maybeSingle();

    if (error) {
        console.warn(error);
        return null;
    }

    return data;
}

function isAdmin() {
    return currentProfile?.role === 'admin';
}

async function renderAuthNav() {
    if (!authNav) return;

    const links = [];

    if (!isSupabaseReady()) {
        links.unshift('<a href="upload.html"><i class="fas fa-cloud-arrow-up"></i><span>Müzik Ekle</span></a>');
        links.push('<a href="login.html"><i class="fas fa-right-to-bracket"></i><span>Giriş</span></a>');
        links.push(themeToggleMarkup());
        authNav.innerHTML = links.join('');
        bindThemeToggle();
        return;
    }

    if (currentSession) {
        links.unshift('<a href="upload.html"><i class="fas fa-cloud-arrow-up"></i><span>Müzik Ekle</span></a>');
        if (isAdmin()) {
            links.unshift('<a href="admin.html"><i class="fas fa-shield-halved"></i><span>Admin</span></a>');
        }
        links.push(`<span class="user-chip">${escapeHtml(currentProfile?.name || currentSession.user.email || 'Kullanıcı')}</span>`);
        links.push('<button class="nav-button" type="button" data-logout><i class="fas fa-right-from-bracket"></i><span>Çıkış</span></button>');
    } else {
        links.unshift('<a href="upload.html"><i class="fas fa-cloud-arrow-up"></i><span>Müzik Ekle</span></a>');
        links.push('<a href="login.html"><i class="fas fa-right-to-bracket"></i><span>Giriş</span></a>');
    }

    links.push(themeToggleMarkup());
    authNav.innerHTML = links.join('');
    bindThemeToggle();
    authNav.querySelector('[data-logout]')?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });
}

function createSongCard(song, index) {
    const article = document.createElement('article');
    article.className = 'box';

    const img = document.createElement('img');
    img.src = songAlbumUrl(song);
    img.alt = song.name;
    img.className = 'album';
    img.loading = 'lazy';
    img.onerror = () => {
        img.src = DEFAULT_ALBUM;
    };

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = song.name;

    const artist = document.createElement('div');
    artist.className = 'artist';
    artist.textContent = song.artist || 'Sanatçı belirtilmedi';

    const provider = isYoutubeSong(song) ? document.createElement('span') : null;
    if (provider) {
        provider.className = 'provider-badge';
        provider.innerHTML = '<i class="fab fa-youtube"></i> YouTube sonucu';
    }

    const flex = document.createElement('div');
    flex.className = 'flex';

    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'play';
    play.innerHTML = '<i class="fas fa-play"></i><span>Oynat</span>';
    play.addEventListener('click', () => playSong(index));

    const secondaryAction = document.createElement('a');
    if (isYoutubeSong(song)) {
        secondaryAction.href = song.external_url;
        secondaryAction.target = '_blank';
        secondaryAction.rel = 'noopener noreferrer';
        secondaryAction.innerHTML = '<i class="fab fa-youtube"></i><span>YouTube</span>';
    } else {
        secondaryAction.href = songMusicUrl(song);
        secondaryAction.download = getSongDownloadName(song);
        secondaryAction.innerHTML = '<i class="fas fa-download"></i><span>İndir</span>';
    }

    flex.append(play, secondaryAction);
    if (provider) article.append(provider);
    article.append(img, name, artist, flex);
    return article;
}

function createInfoCard(message, actionText = 'Ana Sayfaya Dön', actionHref = 'index.html') {
    const article = document.createElement('article');
    article.className = 'box more-btn';

    const text = document.createElement('p');
    text.className = 'empty-state';
    text.textContent = message;

    article.append(text);
    if (actionText) {
        const action = document.createElement('a');
        action.className = 'btn';
        action.href = actionHref;
        action.textContent = actionText;
        article.append(action);
    }
    return article;
}

function renderSongs(songs) {
    if (!grid) return;
    grid.textContent = '';

    if (!songs.length) {
        grid.append(createInfoCard('Sonuç bulunamadı.'));
        return;
    }

    songs.forEach((song, index) => {
        grid.append(createSongCard(song, index));
    });

    if (!youtubeFallbackActive) {
        grid.append(createInfoCard(currentSession ? 'Yeni şarkı yükleyebilirsin.' : 'Şarkı yüklemek için giriş yap.', 'Müzik Ekle', 'upload.html'));
    }
}

function updateSearchHeader() {
    if (page !== 'search') return;
    const title = document.querySelector('[data-search-title]');
    const summary = document.querySelector('[data-search-summary]');

    if (searchInput) searchInput.value = currentSearch;
    if (!currentSearch) {
        if (title) title.textContent = 'Arama';
        if (summary) summary.textContent = 'Şarkı veya sanatçı adı yaz.';
        return;
    }

    if (youtubeFallbackActive) {
        if (title) title.textContent = 'YouTube Sonuçları';
        if (summary) summary.textContent = `“${currentSearch}” Music kataloğunda bulunamadı; YouTube sonuçları gösteriliyor.`;
        return;
    }

    if (title) title.textContent = visibleSongs.length ? 'Arama Sonuçları' : 'Sonuç Bulunamadı';
    if (summary) {
        summary.textContent = youtubeFallbackFailed
            ? `“${currentSearch}” bulunamadı ve YouTube araması şu anda kullanılamıyor.`
            : currentSearch;
    }
}

async function loadSongs() {
    if (!grid) return;

    try {
        if (isSupabaseReady()) {
            const { data, error } = await supabaseClient
                .from('songs')
                .select('*')
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (error) throw error;
            allSongs = data || [];
        } else {
            const response = await fetch(SONG_DATA_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            allSongs = await response.json();
        }

        visibleSongs = currentSearch ? allSongs.filter((song) => matchesSong(song, currentSearch)) : allSongs;
        youtubeFallbackActive = false;
        youtubeFallbackFailed = false;

        if (page === 'search' && currentSearch && !visibleSongs.length) {
            grid.textContent = '';
            grid.append(createInfoCard('Music kataloğunda bulunamadı. YouTube’da aranıyor…', ''));

            try {
                visibleSongs = await searchYoutube(currentSearch);
                youtubeFallbackActive = visibleSongs.length > 0;
            } catch (youtubeError) {
                youtubeFallbackFailed = true;
                console.warn(youtubeError);
            }
        }

        renderSongs(visibleSongs);
        updateSearchHeader();
    } catch (error) {
        grid.textContent = '';
        grid.append(createInfoCard('Şarkı listesi yüklenemedi.'));
        console.error(error);
    }
}

function clearYoutubePlayer() {
    if (!youtubePlayer) return;
    youtubePlayer.replaceChildren();
    youtubePlayer.classList.remove('is-fallback');
    youtubePlayer.hidden = true;
}

function renderYoutubeFallback(song, message) {
    if (!youtubePlayer) return;

    youtubePlayer.classList.add('is-fallback');

    const fallback = document.createElement('div');
    fallback.className = 'youtube-fallback';

    const image = document.createElement('img');
    image.className = 'youtube-fallback-image';
    image.src = songAlbumUrl(song);
    image.alt = '';

    const content = document.createElement('div');
    content.className = 'youtube-fallback-content';

    const icon = document.createElement('span');
    icon.className = 'youtube-fallback-icon';
    icon.innerHTML = '<i class="fab fa-youtube" aria-hidden="true"></i>';

    const title = document.createElement('strong');
    title.textContent = 'Video burada oynatılamıyor';

    const detail = document.createElement('p');
    detail.textContent = message;

    const link = document.createElement('a');
    link.href = song.external_url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML = '<i class="fab fa-youtube" aria-hidden="true"></i><span>YouTube\'da izle</span>';

    content.append(icon, title, detail, link);
    fallback.append(image, content);
    youtubePlayer.replaceChildren(fallback);
}

function youtubePlayerSource(song) {
    if (window.location.protocol === 'file:' || window.location.origin === 'null') return '';

    const embedUrl = new URL(`https://www.youtube.com/embed/${song.provider_id}`);
    embedUrl.searchParams.set('autoplay', '1');
    embedUrl.searchParams.set('playsinline', '1');
    embedUrl.searchParams.set('origin', window.location.origin);
    return embedUrl.toString();
}

function playYoutubeSong(song) {
    if (!youtubePlayer) return;

    audio?.pause();
    audio?.removeAttribute('src');
    audio?.load();

    if (playerAlbum) playerAlbum.hidden = true;
    if (nativePlayerControls) nativePlayerControls.hidden = true;
    youtubePlayer.hidden = false;

    youtubePlayer.classList.remove('is-fallback');
    const playerSource = youtubePlayerSource(song);
    if (!playerSource) {
        renderYoutubeFallback(song, 'Gömülü oynatma için projeyi GitHub Pages veya bir yerel web sunucusu üzerinden açmalısın.');
        return;
    }

    const iframe = document.createElement('iframe');
    iframe.title = `${song.name} - YouTube oynatıcı`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    iframe.addEventListener('error', () => {
        renderYoutubeFallback(song, 'Oynatıcı yüklenemedi. Videoyu doğrudan YouTube üzerinde açabilirsin.');
    }, { once: true });
    iframe.src = playerSource;
    youtubePlayer.replaceChildren(iframe);
}

function playSong(index) {
    const song = visibleSongs[index];
    if (!song || !player) return;

    if (isYoutubeSong(song) && window.location.protocol === 'file:') {
        const youtubeWindow = window.open(song.external_url, '_blank');
        if (youtubeWindow) {
            youtubeWindow.opener = null;
        } else {
            window.location.assign(song.external_url);
        }
        return;
    }

    activeIndex = index;
    playerName.textContent = song.name;
    playerArtist.textContent = song.artist || 'Sanatçı belirtilmedi';

    if (isYoutubeSong(song)) {
        playYoutubeSong(song);
    } else {
        clearYoutubePlayer();
        if (playerAlbum) {
            playerAlbum.hidden = false;
            playerAlbum.src = songAlbumUrl(song);
            playerAlbum.alt = song.name;
            playerAlbum.onerror = () => {
                playerAlbum.src = DEFAULT_ALBUM;
            };
        }
        if (nativePlayerControls) nativePlayerControls.hidden = false;

        const musicUrl = songMusicUrl(song);
        audio.src = musicUrl;
        if (playerDownload) {
            playerDownload.href = musicUrl;
            playerDownload.download = getSongDownloadName(song);
        }
        updatePlayerProgress();
        updatePlayerVolume();
    }

    player.classList.add('active');
    player.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    if (!isYoutubeSong(song)) {
        audio.play().catch(() => updatePlayerToggle());
    }
}

function playRelative(direction) {
    if (!visibleSongs.length) return;
    const nextIndex = (activeIndex + direction + visibleSongs.length) % visibleSongs.length;
    playSong(nextIndex);
}

function closePlayer() {
    if (!player) return;
    player.classList.remove('active');
    player.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    audio?.pause();
    clearYoutubePlayer();
    updatePlayerToggle();
}

function wireSearch() {
    if (!searchForm || !searchInput) return;
    if (page !== 'search' && currentSearch) searchInput.value = currentSearch;

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const term = searchInput.value.trim();
        window.location.href = term ? `search.html?search=${encodeURIComponent(term)}` : 'index.html';
    });
}

function wirePasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach((button) => {
        button.addEventListener('click', () => {
            const field = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            if (!field) return;

            const hidden = field.type === 'password';
            field.type = hidden ? 'text' : 'password';
            button.setAttribute('aria-label', hidden ? 'Şifreyi gizle' : 'Şifreyi göster');
            icon?.classList.toggle('fa-eye', !hidden);
            icon?.classList.toggle('fa-eye-slash', hidden);
        });
    });
}

function requireConfiguredAuth() {
    if (isSupabaseReady()) return true;
    showMessage('Supabase bağlantısı henüz ayarlanmadı. assets/js/supabase-config.js dosyasını doldurmalısın.', 'warning');
    return false;
}

function requireLogin() {
    if (!requireConfiguredAuth()) return false;
    if (currentSession) return true;
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html')}`;
    return false;
}

async function handleLoginPage() {
    const form = document.querySelector('[data-login-form]');
    if (!form) return;

    if (!requireConfiguredAuth()) return;
    if (currentSession) {
        window.location.href = 'index.html';
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submit = form.querySelector('button[type="submit"]');
        submit.disabled = true;

        const { error } = await supabaseClient.auth.signInWithPassword({
            email: form.email.value.trim(),
            password: form.password.value
        });

        submit.disabled = false;
        if (error) {
            showMessage('E-posta veya şifre hatalı.', 'error');
            return;
        }

        window.location.href = params.get('next') || 'index.html';
    });
}

async function handleRegisterPage() {
    const form = document.querySelector('[data-register-form]');
    if (!form) return;

    if (!requireConfiguredAuth()) return;
    if (currentSession) {
        window.location.href = 'index.html';
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const password = form.password.value;
        const passwordConfirm = form.password_confirm.value;

        if (password !== passwordConfirm) {
            showMessage('Şifreler eşleşmiyor.', 'error');
            return;
        }

        const submit = form.querySelector('button[type="submit"]');
        submit.disabled = true;

        const { data, error } = await supabaseClient.auth.signUp({
            email: form.email.value.trim(),
            password,
            options: {
                data: {
                    name: form.name.value.trim()
                }
            }
        });

        submit.disabled = false;
        if (error) {
            showMessage(error.message || 'Kayıt oluşturulamadı.', 'error');
            return;
        }

        if (!data.session) {
            showMessage('Kayıt oluşturuldu. Supabase e-posta doğrulaması açıksa gelen kutunu kontrol etmelisin.', 'success');
            return;
        }

        window.location.href = 'index.html';
    });
}

function safeFileName(file) {
    const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    const base = file.name.replace(/\.[^.]+$/, '').normalize('NFKD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'file';
    return `${Date.now()}-${base}${extension ? `.${extension}` : ''}`;
}

async function uploadStorageFile(file, folder) {
    if (!file) return '';
    if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error('Dosya en fazla 50 MB olabilir.');
    }

    const path = `${currentSession.user.id}/${folder}/${safeFileName(file)}`;
    const { error } = await supabaseClient.storage
        .from(backend.bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || undefined
        });

    if (error) throw error;
    return path;
}

async function handleUploadPage() {
    const form = document.querySelector('[data-upload-form]');
    const submit = form?.querySelector('[data-upload-submit]');
    if (!form) return;

    if (!isSupabaseReady()) {
        form.querySelectorAll('input,button[type="submit"]').forEach((item) => {
            item.disabled = true;
        });
        showMessage('Supabase bağlantısı henüz ayarlanmadı. assets/js/supabase-config.js dosyasını doldurmalısın.', 'warning');
        return;
    }

    if (!requireLogin()) return;
    if (submit) submit.textContent = isAdmin() ? 'Yükle ve Yayına Al' : 'Onaya Gönder';

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        submit.disabled = true;

        const uploadedPaths = [];
        try {
            const musicFile = form.music.files[0];
            const albumFile = form.album.files[0];

            if (!form.name.value.trim() || !musicFile) {
                throw new Error('Müzik adı ve müzik dosyası zorunludur.');
            }

            const musicPath = await uploadStorageFile(musicFile, 'music');
            uploadedPaths.push(musicPath);
            const albumPath = albumFile ? await uploadStorageFile(albumFile, 'albums') : '';
            if (albumPath) uploadedPaths.push(albumPath);

            const { error } = await supabaseClient.from('songs').insert({
                user_id: currentSession.user.id,
                name: form.name.value.trim(),
                artist: form.artist.value.trim() || 'Sanatçı belirtilmedi',
                music_path: musicPath,
                album_path: albumPath || null,
                status: isAdmin() ? 'approved' : 'pending'
            });

            if (error) throw error;

            showMessage(isAdmin() ? 'Müzik yüklendi ve yayına alındı.' : 'Müzik yüklendi. Admin onayından sonra yayında görünecek.', 'success');
            form.reset();
        } catch (error) {
            if (uploadedPaths.length) {
                await supabaseClient.storage.from(backend.bucket).remove(uploadedPaths);
            }
            showMessage(error.message || 'Yükleme tamamlanamadı.', 'error');
        } finally {
            submit.disabled = false;
        }
    });
}

function adminStatusLabel(status) {
    return {
        pending: 'Onay Bekliyor',
        approved: 'Onaylandı',
        hidden: 'Gizlendi'
    }[status] || status;
}

function adminStatusRank(status) {
    return {
        pending: 0,
        approved: 1,
        hidden: 2
    }[status] ?? 3;
}

function sortAdminSongs(songs) {
    return [...songs].sort((first, second) => {
        const statusDiff = adminStatusRank(first.status) - adminStatusRank(second.status);
        if (statusDiff !== 0) return statusDiff;

        return new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime();
    });
}

function createAdminSong(song) {
    const article = document.createElement('article');
    article.className = 'admin-song';

    const img = document.createElement('img');
    img.src = songAlbumUrl(song);
    img.alt = song.name;
    img.onerror = () => {
        img.src = DEFAULT_ALBUM;
    };

    const main = document.createElement('div');
    main.className = 'admin-song-main';
    main.innerHTML = `
        <strong>${escapeHtml(song.name)}</strong>
        <span>${escapeHtml(song.artist || 'Sanatçı belirtilmedi')}</span>
        <small>Yükleyen: ${escapeHtml(song.profiles?.name || song.user_id || 'Eski kayıt')}</small>
    `;

    const status = document.createElement('span');
    status.className = `status status-${song.status}`;
    status.textContent = adminStatusLabel(song.status);

    const actions = document.createElement('div');
    actions.className = 'admin-actions';

    actions.append(createAdminAction('Düzenle', 'fa-pen', () => openAdminEdit(song)));

    if (song.status !== 'approved') {
        actions.append(createAdminAction('Onayla', 'fa-check', () => updateSongStatus(song.id, 'approved')));
    }

    if (song.status !== 'hidden') {
        actions.append(createAdminAction('Yayından kaldır', 'fa-eye-slash', () => updateSongStatus(song.id, 'hidden')));
    }

    actions.append(createAdminAction('Sil', 'fa-trash', () => deleteSong(song), true));

    const controls = document.createElement('div');
    controls.className = 'admin-controls';
    controls.append(status, actions);

    article.append(img, main, controls);
    return article;
}

function createAdminAction(title, icon, handler, danger = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = title;
    button.className = danger ? 'danger' : '';
    button.innerHTML = `<i class="fas ${icon}"></i>`;
    button.addEventListener('click', handler);
    return button;
}

function openAdminEdit(song) {
    if (!adminEditPanel || !adminEditForm) return;
    const fields = adminEditForm.elements;
    if (adminEditMessage) {
        adminEditMessage.hidden = true;
        adminEditMessage.textContent = '';
    }

    fields.id.value = song.id;
    fields.name.value = song.name || '';
    fields.artist.value = song.artist || '';
    fields.status.value = song.status || 'pending';
    fields.current_music_path.value = song.music_path || '';
    fields.current_album_path.value = song.album_path || '';
    fields.music.value = '';
    fields.album.value = '';
    adminEditPanel.hidden = false;
    document.body.classList.add('modal-open');
    fields.name.focus();
}

function closeAdminEdit() {
    if (!adminEditPanel || !adminEditForm) return;
    adminEditForm.reset();
    adminEditPanel.hidden = true;
    document.body.classList.remove('modal-open');
}

async function handleAdminEditSubmit(event) {
    event.preventDefault();
    if (!adminEditForm || !isAdmin()) return;

    const submit = adminEditForm.querySelector('button[type="submit"]');
    const uploadedPaths = [];
    submit.disabled = true;

    try {
        const fields = adminEditForm.elements;
        if (adminEditMessage) {
            adminEditMessage.hidden = true;
            adminEditMessage.textContent = '';
        }

        const updates = {
            name: fields.name.value.trim(),
            artist: fields.artist.value.trim() || 'Sanatçı belirtilmedi',
            status: fields.status.value
        };

        if (!updates.name) {
            throw new Error('Müzik adı boş olamaz.');
        }

        const musicFile = fields.music.files[0];
        const albumFile = fields.album.files[0];

        if (musicFile) {
            updates.music_path = await uploadStorageFile(musicFile, 'music');
            updates.music_url = null;
            uploadedPaths.push(updates.music_path);
        }

        if (albumFile) {
            updates.album_path = await uploadStorageFile(albumFile, 'albums');
            updates.album_url = null;
            uploadedPaths.push(updates.album_path);
        }

        const { error } = await supabaseClient
            .from('songs')
            .update(updates)
            .eq('id', fields.id.value);

        if (error) throw error;

        const removePaths = [];
        if (musicFile && fields.current_music_path.value) removePaths.push(fields.current_music_path.value);
        if (albumFile && fields.current_album_path.value) removePaths.push(fields.current_album_path.value);
        if (removePaths.length) {
            await supabaseClient.storage.from(backend.bucket).remove(removePaths);
        }

        closeAdminEdit();
        showMessage('Şarkı güncellendi.', 'success');
        await loadAdminSongs();
    } catch (error) {
        if (uploadedPaths.length) {
            await supabaseClient.storage.from(backend.bucket).remove(uploadedPaths);
        }
        if (adminEditMessage) {
            adminEditMessage.textContent = error.message || 'Şarkı güncellenemedi.';
            adminEditMessage.hidden = false;
        } else {
            showMessage(error.message || 'Şarkı güncellenemedi.', 'error');
        }
    } finally {
        submit.disabled = false;
    }
}

async function loadAdminSongs() {
    if (!adminList) return;

    if (!requireLogin()) return;
    if (!isAdmin()) {
        adminList.innerHTML = '<article class="admin-song"><div class="admin-song-main"><strong>Bu sayfaya erişim yetkin yok.</strong></div></article>';
        return;
    }

    const { data, error } = await supabaseClient
        .from('songs')
        .select('*, profiles(name,email)')
        .order('created_at', { ascending: false });

    if (error) {
        adminList.innerHTML = '<article class="admin-song"><div class="admin-song-main"><strong>Şarkılar yüklenemedi.</strong></div></article>';
        console.error(error);
        return;
    }

    adminList.textContent = '';
    if (!data?.length) {
        adminList.innerHTML = '<article class="admin-song"><div class="admin-song-main"><strong>Kayıt yok.</strong></div></article>';
        return;
    }

    sortAdminSongs(data).forEach((song) => adminList.append(createAdminSong(song)));
}

async function updateSongStatus(id, status) {
    const { error } = await supabaseClient
        .from('songs')
        .update({ status })
        .eq('id', id);

    if (error) {
        showMessage(error.message || 'Durum güncellenemedi.', 'error');
        return;
    }

    showMessage(status === 'approved' ? 'Şarkı yayına alındı.' : 'Şarkı yayından gizlendi.', 'success');
    await loadAdminSongs();
}

async function deleteSong(song) {
    if (!window.confirm(`"${song.name}" kalıcı olarak silinsin mi?`)) return;

    const { error } = await supabaseClient
        .from('songs')
        .delete()
        .eq('id', song.id);

    if (error) {
        showMessage(error.message || 'Şarkı silinemedi.', 'error');
        return;
    }

    const paths = [song.music_path, song.album_path].filter(Boolean);
    if (paths.length) {
        await supabaseClient.storage.from(backend.bucket).remove(paths);
    }

    showMessage('Şarkı silindi.', 'success');
    await loadAdminSongs();
}

async function init() {
    wirePasswordToggles();
    wireSearch();
    await initSession();
    await renderAuthNav();

    if (page === 'home' || page === 'search') await loadSongs();
    if (page === 'login') await handleLoginPage();
    if (page === 'register') await handleRegisterPage();
    if (page === 'upload') await handleUploadPage();
    if (page === 'admin') await loadAdminSongs();
}

adminEditForm?.addEventListener('submit', handleAdminEditSubmit);
document.querySelectorAll('[data-admin-edit-cancel]').forEach((button) => {
    button.addEventListener('click', closeAdminEdit);
});
adminEditPanel?.addEventListener('click', (event) => {
    if (event.target === adminEditPanel) closeAdminEdit();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && adminEditPanel && !adminEditPanel.hidden) closeAdminEdit();
    if (event.key === 'Escape' && player?.classList.contains('active')) closePlayer();
});

prevButton?.addEventListener('click', () => playRelative(-1));
nextButton?.addEventListener('click', () => playRelative(1));
playerToggleButton?.addEventListener('click', async () => {
    if (!audio?.src) return;
    if (audio.paused) {
        await audio.play().catch(() => {});
    } else {
        audio.pause();
    }
    updatePlayerToggle();
});
playerProgress?.addEventListener('input', () => {
    if (!audio || !Number.isFinite(audio.duration) || !audio.duration) return;
    audio.currentTime = (Number(playerProgress.value) / 100) * audio.duration;
    updatePlayerProgress();
});
playerMuteButton?.addEventListener('click', () => {
    if (!audio) return;
    audio.muted = !audio.muted;
    updatePlayerVolume();
});
playerVolume?.addEventListener('input', () => {
    if (!audio) return;
    audio.volume = Number(playerVolume.value);
    audio.muted = audio.volume === 0;
    updatePlayerVolume();
});
audio?.addEventListener('loadedmetadata', updatePlayerProgress);
audio?.addEventListener('timeupdate', updatePlayerProgress);
audio?.addEventListener('play', updatePlayerToggle);
audio?.addEventListener('pause', updatePlayerToggle);
audio?.addEventListener('volumechange', updatePlayerVolume);
audio?.addEventListener('ended', () => playRelative(1));
closeButton?.addEventListener('click', closePlayer);
player?.addEventListener('click', (event) => {
    if (event.target === player) closePlayer();
});

updatePlayerVolume();
updatePlayerToggle();
bindPlayerVolumeGroup();

init();
