// Default Live DJ rules (also dynamically refreshed from assets/djs/djs.json)
const DEFAULT_LIVE_DJS = [
    {
        id: 'dj_digital',
        displayName: 'Live DJ Digital',
        showName: 'Saturday Night Shakedown',
        pattern: 'live[\\s_-]*dj[\\s_-]*digital',
        streamerNames: ['dcfarquharson@gmail.com'],
        imageUrl: 'https://coolanddeadlyreggae.com/assets/djs/dj-digital.jpg',
        webPath: 'assets/djs/dj-digital.jpg'
    },
    {
        id: 'dj_ilaw',
        displayName: 'Live DJ ILaw',
        showName: 'Roots Rock Reggae Vibration',
        pattern: 'live[\\s_-]*dj[\\s_-]*i[\\s_-]*law',
        streamerNames: ['raslaw@hotmail.com'],
        imageUrl: 'https://coolanddeadlyreggae.com/assets/djs/dj-ilaw.jpg',
        webPath: 'assets/djs/dj-ilaw.jpg'
    },
    {
        id: 'father_copper',
        displayName: 'Live Father Copper',
        showName: 'Father Copper Showcase',
        pattern: 'live[\\s_-]*father[\\s_-]*copper',
        streamerNames: ['copperintl@yahoo.com'],
        imageUrl: 'https://coolanddeadlyreggae.com/assets/djs/father-copper.jpg',
        webPath: 'assets/djs/father-copper.jpg'
    }
];

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripDjPrefix(value, regex) {
    if (!value) return '';
    const cleaned = regex ? value.replace(regex, '') : value;
    return cleaned
        .replace(/^[\s\-_:•|]+/, '')
        .replace(/[\s\-_:•|]+$/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripBroadcastTimestamp(value) {
    if (!value) return '';
    const stripped = value.replace(/[\s_-]+\d+m$/i, '').trim();
    if (/^\d+m$/i.test(stripped)) return '';
    return stripped;
}

function stripShowName(value, showName) {
    if (!value || !showName || !showName.trim()) return value || '';
    const words = showName
        .trim()
        .split(/[\s_\-,]+/)
        .filter(Boolean)
        .map(escapeRegex);
    if (!words.length) return value;

    const showRegex = new RegExp(words.join('[\\s_\\-,]+'), 'ig');
    return value
        .replace(showRegex, '')
        .replace(/^[\s\-_:•|]+/, '')
        .replace(/[\s\-_:•|]+$/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanLiveField(value, regex, showName) {
    let cleaned = stripDjPrefix(value, regex);
    cleaned = stripBroadcastTimestamp(cleaned);
    cleaned = stripShowName(cleaned, showName);
    cleaned = stripBroadcastTimestamp(cleaned);
    return cleaned;
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

function matchStreamer(dj, streamerName) {
    if (!streamerName || !Array.isArray(dj.streamerNames)) return false;
    const target = streamerName.trim().toLowerCase();
    if (!target) return false;
    return dj.streamerNames.some(
        (name) => typeof name === 'string' && name.trim().toLowerCase() === target
    );
}

function parseLiveDj(song, djList, liveInfo = null) {
    const rawArtist = (song && song.artist ? String(song.artist) : '').trim();
    const rawTitle = (song && song.title ? String(song.title) : '').trim();
    const rawText = (song && song.text ? String(song.text) : '').trim();
    const combined = rawText || [rawArtist, rawTitle].filter(Boolean).join(' - ');
    const isLive = Boolean(liveInfo && liveInfo.isLive);
    const streamerName = isLive && liveInfo && liveInfo.streamerName
        ? String(liveInfo.streamerName).trim()
        : '';

    if (!combined && !streamerName) return null;

    let matchedDj = null;
    let matchedRegex = null;
    let matchedByPattern = false;

    for (const dj of djList) {
        let regex = null;
        try {
            if (dj.pattern) regex = new RegExp(dj.pattern, 'i');
        } catch (e) {
            regex = null;
        }
        if (regex && combined && regex.test(combined)) {
            matchedDj = dj;
            matchedRegex = regex;
            matchedByPattern = true;
            break;
        }
    }

    if (!matchedDj && streamerName) {
        for (const dj of djList) {
            if (matchStreamer(dj, streamerName)) {
                matchedDj = dj;
                try {
                    if (dj.pattern) matchedRegex = new RegExp(dj.pattern, 'i');
                } catch (e) {
                    matchedRegex = null;
                }
                break;
            }
        }
    }

    if (!matchedDj) return null;

    const showName = (matchedDj.showName || '').trim();
    let artist = '';
    let title = '';

    if (matchedByPattern && matchedRegex) {
        if (rawArtist && matchedRegex.test(rawArtist)) {
            artist = cleanLiveField(rawArtist, matchedRegex, showName);
            title = cleanLiveField(rawTitle, matchedRegex, showName);

            if (!artist && title) {
                const split = splitArtistTitle(title);
                artist = split.artist;
                title = split.title;
            }
        } else if (rawTitle && matchedRegex.test(rawTitle) && !rawArtist) {
            const cleaned = cleanLiveField(rawTitle, matchedRegex, showName);
            const split = splitArtistTitle(cleaned);
            artist = split.artist;
            title = split.title;
        } else {
            const remainder = cleanLiveField(combined, matchedRegex, showName);
            const split = splitArtistTitle(remainder);
            artist = split.artist;
            title = split.title;
        }
    } else if (rawArtist || rawTitle) {
        artist = cleanLiveField(rawArtist, matchedRegex, showName);
        title = cleanLiveField(rawTitle, matchedRegex, showName);
        if (!artist && title) {
            const split = splitArtistTitle(title);
            artist = split.artist;
            title = split.title;
        }
    } else if (combined) {
        const remainder = cleanLiveField(combined, matchedRegex, showName);
        const split = splitArtistTitle(remainder);
        artist = split.artist;
        title = split.title;
    }

    return {
        id: matchedDj.id,
        displayName: matchedDj.displayName,
        showName,
        imageUrl: matchedDj.webPath || matchedDj.imageUrl,
        artist,
        title
    };
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
    let artRotationConfig = { enabled: true, djSeconds: 10, logoSeconds: 5 };
    let activeDjRotationKey = null;
    let activeDjPortraitUrl = null;
    let showingStationLogo = false;
    let djRotationTimer = null;
    let fadeSwapTimer = null;

    // Stream & API Configuration
    const streamUrl = 'https://a13.asurahosting.com/listen/coolanddeadlyreggae.com/radio.mp3';
    const apiUrl = 'https://a13.asurahosting.com/api/nowplaying/96';
    const djManifestUrl = 'assets/djs/djs.json';
    const fallbackImage = 'coolanddeadlyreggae no album cover art found.png';
    const rotatingStationLogo = 'assets/djs/station-logo.png';
    audio.src = streamUrl;

    // Preload rotating station logo so transitions are instant
    const preloadedLogo = new Image();
    preloadedLogo.src = rotatingStationLogo;

    // Album Art Cache
    const artCache = {};

    function clampSeconds(value, fallback) {
        const num = Number(value);
        if (!Number.isFinite(num)) return fallback;
        return Math.min(120, Math.max(3, Math.round(num)));
    }

    function stopDjArtRotation() {
        if (djRotationTimer) {
            clearTimeout(djRotationTimer);
            djRotationTimer = null;
        }
        activeDjRotationKey = null;
        activeDjPortraitUrl = null;
        showingStationLogo = false;
        albumArtImg.classList.remove('is-station-logo');
    }

    function setAlbumArtSmooth(nextUrl, { isDjPortrait = false, isStationLogo = false, isVinyl = false, fade = false } = {}) {
        const applyClasses = () => {
            albumArtImg.classList.toggle('is-dj-portrait', isDjPortrait);
            albumArtImg.classList.toggle('is-station-logo', isStationLogo);
            albumArtImg.classList.toggle('is-vinyl', isVinyl);
        };

        const alreadyShown = albumArtImg.src && albumArtImg.src.includes(encodeURI(nextUrl));
        if (alreadyShown) {
            applyClasses();
            return;
        }

        if (!fade) {
            if (fadeSwapTimer) {
                clearTimeout(fadeSwapTimer);
                fadeSwapTimer = null;
            }
            albumArtImg.classList.remove('is-fading');
            applyClasses();
            albumArtImg.src = nextUrl;
            return;
        }

        if (fadeSwapTimer) {
            clearTimeout(fadeSwapTimer);
            fadeSwapTimer = null;
        }
        albumArtImg.classList.add('is-fading');
        fadeSwapTimer = setTimeout(() => {
            applyClasses();
            albumArtImg.src = nextUrl;
            requestAnimationFrame(() => {
                albumArtImg.classList.remove('is-fading');
            });
            fadeSwapTimer = null;
        }, 350);
    }

    function scheduleNextDjArtSwap() {
        if (djRotationTimer) {
            clearTimeout(djRotationTimer);
            djRotationTimer = null;
        }
        if (!activeDjRotationKey || !activeDjPortraitUrl || !artRotationConfig.enabled || document.hidden) {
            return;
        }
        const delayMs = (showingStationLogo ? artRotationConfig.logoSeconds : artRotationConfig.djSeconds) * 1000;
        djRotationTimer = setTimeout(() => {
            if (!activeDjRotationKey || !activeDjPortraitUrl || !artRotationConfig.enabled || document.hidden) {
                return;
            }
            showingStationLogo = !showingStationLogo;
            if (showingStationLogo) {
                setAlbumArtSmooth(rotatingStationLogo, { isStationLogo: true, fade: true });
            } else {
                setAlbumArtSmooth(activeDjPortraitUrl, { isDjPortrait: true, fade: true });
            }
            scheduleNextDjArtSwap();
        }, delayMs);
    }

    function syncDjArtRotation(djKey, portraitUrl) {
        if (!artRotationConfig.enabled) {
            stopDjArtRotation();
            setAlbumArtSmooth(portraitUrl, { isDjPortrait: true, fade: false });
            return;
        }

        const isNewDj = activeDjRotationKey !== djKey || activeDjPortraitUrl !== portraitUrl;
        activeDjRotationKey = djKey;
        activeDjPortraitUrl = portraitUrl;

        if (isNewDj) {
            showingStationLogo = false;
            setAlbumArtSmooth(portraitUrl, { isDjPortrait: true, fade: false });
            scheduleNextDjArtSwap();
        } else if (!djRotationTimer && !document.hidden) {
            scheduleNextDjArtSwap();
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (djRotationTimer) {
                clearTimeout(djRotationTimer);
                djRotationTimer = null;
            }
        } else if (activeDjRotationKey && artRotationConfig.enabled) {
            scheduleNextDjArtSwap();
        }
    });

    // Load remote DJ manifest so future DJs/photos/rotation update dynamically without code changes
    async function loadDjManifest() {
        try {
            const res = await fetch(`${djManifestUrl}?t=${Math.floor(Date.now() / 60000)}`);
            if (!res.ok) return;
            const manifest = await res.json();
            if (manifest && Array.isArray(manifest.djs) && manifest.djs.length > 0) {
                liveDjs = manifest.djs;
            }
            if (manifest && manifest.rotation && typeof manifest.rotation === 'object') {
                artRotationConfig = {
                    enabled: manifest.rotation.enabled !== false,
                    djSeconds: clampSeconds(manifest.rotation.djSeconds, 10),
                    logoSeconds: clampSeconds(manifest.rotation.logoSeconds, 5)
                };
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
                const liveInfo = {
                    isLive: Boolean(data.live && data.live.is_live),
                    streamerName: (data.live && data.live.streamer_name) || data.now_playing.streamer || ''
                };
                const matchedDj = parseLiveDj(song, liveDjs, liveInfo);

                let artUrl = null;

                if (matchedDj) {
                    // 3-Line Live DJ Display:
                    // Line 1: Live DJ Name (e.g., "Live DJ ILaw")
                    // Line 2: Show Name (e.g., "Roots Rock Reggae Vibration") or Artist
                    // Line 3: Artist - Song Title (when song info is available)
                    if (nowPlayingInfo) nowPlayingInfo.classList.add('is-live-dj');
                    if (trackDj && trackDjName) {
                        trackDjName.textContent = matchedDj.displayName;
                        trackDj.style.display = 'inline-flex';
                    }

                    if (matchedDj.showName) {
                        trackArtist.textContent = matchedDj.showName;
                        trackArtist.style.display = '';
                        applyResponsiveFont(trackArtist, matchedDj.showName, 40, 25, '0.95rem', '1.1rem');

                        const trackLine = [matchedDj.artist, matchedDj.title].filter(Boolean).join(' - ');
                        if (trackLine) {
                            trackTitle.textContent = trackLine;
                            trackTitle.style.display = '';
                            applyResponsiveFont(trackTitle, trackLine, 40, 25, '0.9rem', '1.0rem');
                        } else {
                            trackTitle.textContent = '';
                            trackTitle.style.display = 'none';
                        }
                    } else {
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
                    }

                    // Smoothly alternate between the Live DJ portrait and the station logo
                    const djKey = `${matchedDj.id}|${matchedDj.imageUrl}`;
                    syncDjArtRotation(djKey, matchedDj.imageUrl);
                } else {
                    // Standard 2-Line AutoDJ Display
                    stopDjArtRotation();
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

                    setAlbumArtSmooth(artUrl, {
                        isDjPortrait: false,
                        isStationLogo: false,
                        isVinyl: artUrl !== fallbackImage,
                        fade: false
                    });
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
