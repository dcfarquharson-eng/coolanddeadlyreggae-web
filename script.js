// Default Live DJ rules (also dynamically refreshed from assets/djs/djs.json)
const DEFAULT_LIVE_DJS = [
    {
        id: 'dj_digital',
        displayName: 'Live DJ Digital',
        pattern: 'live[\\s_-]*dj[\\s_-]*digital',
        imageUrl: 'https://coolanddeadlyreggae.com/assets/djs/dj-digital.jpg',
        webPath: 'assets/djs/dj-digital.jpg'
    },
    {
        id: 'dj_ilaw',
        displayName: 'Live DJ ILaw',
        pattern: 'live[\\s_-]*dj[\\s_-]*i[\\s_-]*law',
        imageUrl: 'https://coolanddeadlyreggae.com/assets/djs/dj-ilaw.jpg',
        webPath: 'assets/djs/dj-ilaw.jpg'
    },
    {
        id: 'father_copper',
        displayName: 'Live Father Copper',
        pattern: 'live[\\s_-]*father[\\s_-]*copper',
        imageUrl: 'https://coolanddeadlyreggae.com/assets/djs/father-copper.jpg',
        webPath: 'assets/djs/father-copper.jpg'
    }
];

function stripDjPrefix(value, regex) {
    if (!value) return '';
    return value
        .replace(regex, '')
        .replace(/^[\s\-_:•|]+/, '')
        .replace(/[\s\-_:•|]+$/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function splitArtistTitle(text) {
    if (!text) return { artist: '', title: '' };
    const separatorMatch = text.match(/\s[-–—|]\s/);
    if (separatorMatch && separatorMatch.index !== undefined) {
        const idx = separatorMatch.index;
        const left = text.slice(0, idx).trim();
        const right = text.slice(idx + separatorMatch[0].length).trim();
        return { artist: left, title: right };
    }
    return { artist: text.trim(), title: '' };
}

function parseLiveDj(song, djList) {
    const rawArtist = (song && song.artist ? String(song.artist) : '').trim();
    const rawTitle = (song && song.title ? String(song.title) : '').trim();
    const rawText = (song && song.text ? String(song.text) : '').trim();
    const combined = rawText || [rawArtist, rawTitle].filter(Boolean).join(' - ');

    if (!combined) return null;

    for (const dj of djList) {
        let regex;
        try {
            regex = new RegExp(dj.pattern, 'i');
        } catch (e) {
            continue;
        }

        if (!regex.test(combined)) continue;

        let artist = '';
        let title = '';

        if (rawArtist && regex.test(rawArtist)) {
            artist = stripDjPrefix(rawArtist, regex);
            title = stripDjPrefix(rawTitle, regex);

            if (!artist && title) {
                const split = splitArtistTitle(title);
                artist = split.artist;
                title = split.title;
            }
        } else if (rawTitle && regex.test(rawTitle) && !rawArtist) {
            const cleaned = stripDjPrefix(rawTitle, regex);
            const split = splitArtistTitle(cleaned);
            artist = split.artist;
            title = split.title;
        } else {
            const remainder = stripDjPrefix(combined, regex);
            const split = splitArtistTitle(remainder);
            artist = split.artist;
            title = split.title;
        }

        return {
            id: dj.id,
            displayName: dj.displayName,
            imageUrl: dj.webPath || dj.imageUrl,
            artist,
            title
        };
    }

    return null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULT_LIVE_DJS, parseLiveDj };
}

if (typeof document !== 'undefined') {
document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio-stream');
    const playBtn = document.getElementById('play-btn');
    const albumArtImg = document.getElementById('album-art');
    const nowPlayingInfo = document.getElementById('now-playing-info');
    const trackDj = document.getElementById('track-dj');
    const trackDjName = document.getElementById('track-dj-name');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const historyGrid = document.getElementById('history-grid');

    let isPlaying = false;
    let liveDjs = DEFAULT_LIVE_DJS.slice();

    // Stream & API Configuration
    const streamUrl = 'https://a13.asurahosting.com/listen/coolanddeadlyreggae.com/radio.mp3';
    const apiUrl = 'https://a13.asurahosting.com/api/nowplaying/96';
    const djManifestUrl = 'assets/djs/djs.json';
    const fallbackImage = 'coolanddeadlyreggae no album cover art found.png';
    audio.src = streamUrl;

    // Album Art Cache
    const artCache = {};

    // Load remote DJ manifest so future DJs/photos update dynamically without code changes
    async function loadDjManifest() {
        try {
            const res = await fetch(`${djManifestUrl}?t=${Math.floor(Date.now() / 60000)}`);
            if (!res.ok) return;
            const manifest = await res.json();
            if (manifest && Array.isArray(manifest.djs) && manifest.djs.length > 0) {
                liveDjs = manifest.djs;
            }
        } catch (e) {
            // Keep built-in DEFAULT_LIVE_DJS fallback
        }
    }

    // Attempt Autoplay on Load
    audio.play().then(() => {
        isPlaying = true;
        playBtn.classList.add('playing');
        playBtn.textContent = '⏸';
    }).catch(() => {
        console.log("Autoplay blocked by browser policy. User must click play.");
    });

    // Play/Pause Logic (Minimal Button)
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            playBtn.classList.remove('playing');
            playBtn.textContent = '▶';
        } else {
            audio.src = streamUrl + '?' + new Date().getTime(); // Cache busting
            audio.play().then(() => {
                isPlaying = true;
                playBtn.classList.add('playing');
                playBtn.textContent = '⏸';
            }).catch(e => {
                console.error("Playback failed:", e);
                alert("Could not start the stream. Please try again.");
            });
        }
    });

    // --- Metadata & Album Art Logic ---
    async function fetchITunesArt(artist, title) {
        if (!artist || !title) return null;

        // Guard against generic streaming metadata that iTunes will falsely match
        const lowerArtist = artist.toLowerCase();
        const lowerTitle = title.toLowerCase();

        if (lowerArtist.includes('unknown') || lowerTitle.includes('unknown') || lowerTitle.startsWith('track ')) {
            return null; // Skip iTunes and go straight to fallback
        }

        const queryKey = `${artist}_${title}`.toLowerCase();
        if (artCache[queryKey] !== undefined) return artCache[queryKey];

        let cleanArtist = artist.replace(/\(.*?\)/g, ' ').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
        let cleanTitle = title.replace(/\(.*?\)/g, ' ').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

        try {
            const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`);
            const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
            const data = await response.json();

            if (data.resultCount > 0) {
                const result = data.results[0];
                const artUrl = result.artworkUrl100;
                if (artUrl) {
                    const highRes = artUrl.replace('100x100bb', '600x600bb');
                    artCache[queryKey] = highRes;
                    return highRes;
                }
            }
        } catch (e) {
            console.error("iTunes fetch error:", e);
        }

        artCache[queryKey] = null;
        return null;
    }

    function applyResponsiveFont(el, text, longLimit, medLimit, longSize, medSize) {
        if (!el) return;
        if (text.length > longLimit) {
            el.style.fontSize = longSize;
        } else if (text.length > medLimit) {
            el.style.fontSize = medSize;
        } else {
            el.style.fontSize = '';
        }
    }

    async function updateNowPlaying() {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.now_playing && data.now_playing.song) {
                const song = data.now_playing.song;
                const matchedDj = parseLiveDj(song, liveDjs);

                let artUrl = null;

                if (matchedDj) {
                    // 3-Line Live DJ Display:
                    // Line 1: Live DJ Name (e.g., "Live DJ Digital")
                    // Line 2: Artist Name (e.g., "Bob Marley")
                    // Line 3: Song Title (e.g., "One Love")
                    if (nowPlayingInfo) nowPlayingInfo.classList.add('is-live-dj');
                    if (trackDj && trackDjName) {
                        trackDjName.textContent = matchedDj.displayName;
                        trackDj.style.display = 'inline-flex';
                    }

                    const line2Artist = matchedDj.artist || 'Live in the Mix';
                    trackArtist.textContent = line2Artist;
                    trackArtist.style.display = '';
                    applyResponsiveFont(trackArtist, line2Artist, 40, 25, '0.95rem', '1.1rem');

                    if (matchedDj.title) {
                        trackTitle.textContent = matchedDj.title;
                        trackTitle.style.display = '';
                        applyResponsiveFont(trackTitle, matchedDj.title, 40, 25, '0.9rem', '1.0rem');
                    } else {
                        trackTitle.textContent = '';
                        trackTitle.style.display = 'none';
                    }

                    // Override cover art directly with the Live DJ's portrait
                    artUrl = matchedDj.imageUrl;
                    albumArtImg.classList.add('is-dj-portrait');
                    albumArtImg.classList.remove('is-vinyl');
                } else {
                    // Standard 2-Line AutoDJ Display
                    if (nowPlayingInfo) nowPlayingInfo.classList.remove('is-live-dj');
                    if (trackDj) trackDj.style.display = 'none';
                    albumArtImg.classList.remove('is-dj-portrait');

                    const currentTitle = song.title || "Live Stream";
                    trackTitle.textContent = currentTitle;
                    trackTitle.style.display = '';
                    applyResponsiveFont(trackTitle, currentTitle, 40, 25, '1.0rem', '1.15rem');

                    const currentArtist = song.artist || "Cool and Deadly Reggae";
                    trackArtist.textContent = currentArtist;
                    trackArtist.style.display = '';
                    applyResponsiveFont(trackArtist, currentArtist, 40, 25, '0.85rem', '0.95rem');

                    const lowerArtist = (song.artist || '').toLowerCase();
                    const lowerTitle = (song.title || '').toLowerCase();
                    const isGenericLiveDJ = (
                        lowerArtist.includes('live_dj') ||
                        lowerTitle.includes('live_dj') ||
                        lowerArtist.includes('live dj') ||
                        lowerTitle.includes('live dj') ||
                        lowerArtist.includes('live_') ||
                        lowerTitle.includes('live_')
                    );

                    if (!isGenericLiveDJ && song.artist && song.title) {
                        const itunesArt = await fetchITunesArt(song.artist, song.title);
                        if (itunesArt) artUrl = itunesArt;
                    }

                    if (!artUrl && song.art) {
                        artUrl = song.art;
                    }

                    // If it's the generic AzuraCast default or missing, use our fallback
                    if (
                        !artUrl ||
                        artUrl.includes('album_art.png') ||
                        /album_art\.\d+\.(png|jpg|jpeg|webp)/i.test(artUrl) ||
                        artUrl.includes('generic_song') ||
                        artUrl.includes('default')
                    ) {
                        artUrl = fallbackImage;
                    }

                    // Apply vinyl styling only when real album art is playing
                    if (artUrl === fallbackImage) {
                        albumArtImg.classList.remove('is-vinyl');
                    } else {
                        albumArtImg.classList.add('is-vinyl');
                    }
                }

                // Only update if it actually changed to avoid flicker
                if (!albumArtImg.src.includes(encodeURI(artUrl))) {
                    albumArtImg.src = artUrl;
                }

                // Update History Grid
                if (historyGrid && data.song_history && data.song_history.length > 0) {
                    historyGrid.innerHTML = '';

                    // Display exactly 3 songs so it fits perfectly flush with the logo
                    for (let i = 0; i < Math.min(3, data.song_history.length); i++) {
                        const item = data.song_history[i];
                        const s = item.song;

                        const sTitle = s.title || "Unknown";
                        let titleStyle = "";

                        if (sTitle.length > 35) {
                            titleStyle = "font-size: 0.85rem;";
                        } else if (sTitle.length > 20) {
                            titleStyle = "font-size: 0.95rem;";
                        }

                        const sArtist = s.artist || "Unknown";
                        let artistStyle = "";

                        if (sArtist.length > 35) {
                            artistStyle = "font-size: 0.7rem;";
                        } else if (sArtist.length > 20) {
                            artistStyle = "font-size: 0.8rem;";
                        }

                        const div = document.createElement('div');
                        div.className = 'history-item';
                        div.innerHTML = `
                            <div class="history-info">
                                <h3 class="history-title-text" style="${titleStyle}">${sTitle}</h3>
                                <p class="history-artist" style="${artistStyle}">${sArtist}</p>
                            </div>
                        `;
                        historyGrid.appendChild(div);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch now playing:", err);
        }
    }

    loadDjManifest().then(updateNowPlaying);
    setInterval(updateNowPlaying, 15000);
    setInterval(loadDjManifest, 15 * 60 * 1000);
});
}
