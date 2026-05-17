document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('audio-stream');
    const playBtn = document.getElementById('play-btn');
    const albumArtImg = document.getElementById('album-art');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const historyGrid = document.getElementById('history-grid');

    let isPlaying = false;

    // Stream & API Configuration
    const streamUrl = 'https://a13.asurahosting.com/listen/coolanddeadlyreggae.com/radio.mp3'; 
    const apiUrl = 'https://a13.asurahosting.com/api/nowplaying/96';
    const fallbackImage = 'coolanddeadlyreggae no album cover art found.png';
    audio.src = streamUrl;

    // Album Art Cache
    const artCache = {};

    // Attempt Autoplay on Load
    audio.play().then(() => {
        isPlaying = true;
        playBtn.classList.add('playing');
        playBtn.textContent = '⏸';
    }).catch((e) => {
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

    async function updateNowPlaying() {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.now_playing && data.now_playing.song) {
                const song = data.now_playing.song;
                
                const currentTitle = song.title || "Live Stream";
                trackTitle.textContent = currentTitle;
                
                // Dynamically reduce font size for very long titles
                if (currentTitle.length > 40) {
                    trackTitle.style.fontSize = '1.0rem';
                } else if (currentTitle.length > 25) {
                    trackTitle.style.fontSize = '1.15rem';
                } else {
                    trackTitle.style.fontSize = ''; // Reset to default
                }

                trackArtist.textContent = song.artist || "Cool and Deadly Reggae";

                const isLiveDJ = (song.artist.toLowerCase().includes('live') || song.title.toLowerCase().includes('live') || song.artist.toLowerCase().includes('dj'));
                
                let artUrl = null;

                if (!isLiveDJ && song.artist && song.title) {
                    const itunesArt = await fetchITunesArt(song.artist, song.title);
                    if (itunesArt) artUrl = itunesArt;
                }
                
                if (!artUrl && data.now_playing.song.art) {
                    artUrl = data.now_playing.song.art;
                }
                
                // If it's the generic azuracast default or missing, use our fallback
                // Adding generic_song to aggressively catch other default Azuracast images
                if (!artUrl || artUrl.includes('album_art.png') || artUrl.includes('generic_song') || artUrl.includes('default')) {
                    artUrl = fallbackImage;
                }

                // Apply vinyl styling only when real album art is playing
                if (artUrl === fallbackImage) {
                    albumArtImg.classList.remove('is-vinyl');
                } else {
                    albumArtImg.classList.add('is-vinyl');
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
                        
                        // Dynamically reduce font size in history grid for long titles
                        if (sTitle.length > 35) {
                            titleStyle = "font-size: 0.85rem;";
                        } else if (sTitle.length > 20) {
                            titleStyle = "font-size: 0.95rem;";
                        }

                        const div = document.createElement('div');
                        div.className = 'history-item';
                        div.innerHTML = `
                            <div class="history-info">
                                <h3 class="history-title-text" style="${titleStyle}">${sTitle}</h3>
                                <p class="history-artist">${s.artist || "Unknown"}</p>
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

    updateNowPlaying();
    setInterval(updateNowPlaying, 15000);
});
