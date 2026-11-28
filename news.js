// Cool & Deadly Reggae — 7-Day Daily Newsroom & YouTube Studio Vault
// Pins Today's stories prominently at the top, shows the rolling last 7 days,
// and provides built-in story reader + YouTube Short/Video lightbox modals.
(function () {
    const todayWrap = document.getElementById('today-news-wrap');
    const todayDateLabel = document.getElementById('today-date-label');
    const todayGrid = document.getElementById('today-news-grid');
    const archiveWrap = document.getElementById('archive-news-wrap');
    const archiveGroupLabel = document.getElementById('archive-group-label');
    const newsGrid = document.getElementById('newsroom-grid');
    const filterBar = document.getElementById('news-day-filters');
    const ytGrid = document.getElementById('youtube-vault-grid');

    const modal = document.getElementById('media-modal');
    const modalClose = document.getElementById('modal-close-btn');
    const modalMediaSlot = document.getElementById('modal-media-slot');
    const modalBodySlot = document.getElementById('modal-body-slot');

    let allSevenDayItems = [];
    let activeFilter = 'all';

    function esc(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    function localDateKey(d) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function formatShortDate(dateKey) {
        const [y, m, d] = dateKey.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }

    function formatFullDateTime(iso) {
        const dt = new Date(iso);
        if (Number.isNaN(dt.getTime())) return '';
        return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
            ' • ' +
            dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        modalMediaSlot.innerHTML = '';
        modalBodySlot.innerHTML = '';
        document.body.style.overflow = '';
    }

    function openStoryModal(item) {
        if (!modal) return;
        modalMediaSlot.innerHTML = item.image
            ? `<img class="modal-hero-img" src="${esc(item.image)}" alt="${esc(item.title)}">`
            : '';

        const ytBtn = item.youtube_id
            ? `<button type="button" class="btn-gold" data-play-yt="${esc(item.youtube_id)}" data-yt-title="${esc(item.title)}" data-yt-short="1">▶ Watch YouTube Short</button>`
            : '';
        const srcBtn = item.source_url
            ? `<a class="btn-ghost" href="${esc(item.source_url)}" target="_blank" rel="noopener">Read Original at ${esc(item.source_name || 'Source')} ↗</a>`
            : '';

        modalBodySlot.innerHTML = `
            <div class="news-meta-row">
                <span class="news-source-pill">${esc(item.source_name || 'Reggae News')}</span>
                <span>${esc(formatFullDateTime(item.publish_at))}</span>
            </div>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.body)}</p>
            <div class="news-card-actions">${ytBtn}${srcBtn}</div>
        `;

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function openYouTubeModal(videoId, title, isShort) {
        if (!modal || !videoId) return;
        const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
        const watchUrl = isShort
            ? `https://www.youtube.com/shorts/${encodeURIComponent(videoId)}`
            : `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

        modalMediaSlot.innerHTML = `
            <div class="modal-video-wrap ${isShort ? 'is-short' : ''}">
                <iframe src="${embedUrl}" title="${esc(title || 'Cool & Deadly Reggae Video')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
        `;
        modalBodySlot.innerHTML = `
            <div class="news-meta-row">
                <span class="news-source-pill">Cool &amp; Deadly YouTube</span>
            </div>
            <h3>${esc(title || 'Cool & Deadly Reggae')}</h3>
            <div class="news-card-actions">
                <a class="btn-gold" href="${watchUrl}" target="_blank" rel="noopener">Open on YouTube ↗</a>
                <a class="btn-ghost" href="https://www.youtube.com/@coolanddeadlyreggae" target="_blank" rel="noopener">Subscribe to Channel</a>
            </div>
        `;

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Global delegated click handler for Read Story & Watch Short buttons
    document.addEventListener('click', (e) => {
        const ytBtn = e.target.closest('[data-play-yt]');
        if (ytBtn) {
            e.preventDefault();
            openYouTubeModal(
                ytBtn.getAttribute('data-play-yt'),
                ytBtn.getAttribute('data-yt-title') || '',
                ytBtn.getAttribute('data-yt-short') === '1'
            );
            return;
        }
        const readBtn = e.target.closest('[data-read-story]');
        if (readBtn) {
            e.preventDefault();
            const id = readBtn.getAttribute('data-read-story');
            const found = allSevenDayItems.find((i) => i.id === id);
            if (found) openStoryModal(found);
        }
    });

    function renderLeadCard(item) {
        const imgSrc = item.image || 'assets/djs/station-logo.png';
        const ytBtn = item.youtube_id
            ? `<button type="button" class="btn-gold" data-play-yt="${esc(item.youtube_id)}" data-yt-title="${esc(item.title)}" data-yt-short="1">▶ Watch Short</button>`
            : '';
        return `
            <article class="news-lead-card" id="${esc(item.id)}">
                <div class="news-lead-media">
                    <img src="${esc(imgSrc)}" alt="${esc(item.title)}">
                </div>
                <div class="news-lead-body">
                    <div class="news-meta-row">
                        <span class="news-today-pill">Today</span>
                        <span class="news-source-pill">${esc(item.source_name || 'Reggae News')}</span>
                        <time datetime="${esc(item.publish_at)}">${esc(formatFullDateTime(item.publish_at))}</time>
                    </div>
                    <h3 class="news-lead-title">${esc(item.title)}</h3>
                    <p class="news-excerpt">${esc(item.body)}</p>
                    <div class="news-card-actions">
                        <button type="button" class="btn-ghost" data-read-story="${esc(item.id)}">Read Full Story</button>
                        ${ytBtn}
                        ${item.source_url ? `<a class="btn-ghost" href="${esc(item.source_url)}" target="_blank" rel="noopener">Source ↗</a>` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    function renderGridCard(item, isToday) {
        const imgSrc = item.image || 'assets/djs/station-logo.png';
        const playOverlay = item.youtube_id
            ? `<button type="button" class="news-card-play-badge" data-play-yt="${esc(item.youtube_id)}" data-yt-title="${esc(item.title)}" data-yt-short="1">▶ Short</button>`
            : '';
        return `
            <article class="news-card" id="${esc(item.id)}">
                <div class="news-card-media">
                    <img src="${esc(imgSrc)}" alt="${esc(item.title)}" loading="lazy">
                    ${playOverlay}
                </div>
                <div class="news-card-content">
                    <div class="news-meta-row">
                        ${isToday ? '<span class="news-today-pill">Today</span>' : ''}
                        <span class="news-source-pill">${esc(item.source_name || 'Reggae News')}</span>
                        <time datetime="${esc(item.publish_at)}">${esc(formatFullDateTime(item.publish_at))}</time>
                    </div>
                    <h3 class="news-card-title">${esc(item.title)}</h3>
                    <p class="news-card-excerpt">${esc(item.body)}</p>
                    <div class="news-card-actions">
                        <button type="button" class="btn-ghost" data-read-story="${esc(item.id)}">Read Story</button>
                        ${item.source_url ? `<a class="btn-ghost" href="${esc(item.source_url)}" target="_blank" rel="noopener">Source ↗</a>` : ''}
                    </div>
                </div>
            </article>
        `;
    }

    function renderNews() {
        if (!newsGrid) return;
        const todayKey = localDateKey(new Date());
        const filtered = activeFilter === 'all'
            ? allSevenDayItems
            : allSevenDayItems.filter((i) => i.date_key === activeFilter);

        if (!filtered.length) {
            if (todayWrap) todayWrap.style.display = 'none';
            newsGrid.innerHTML = '<p class="newsroom-empty">Fresh reggae news drops daily at 8 AM, 1 PM &amp; 6 PM EST. Check back soon!</p>';
            return;
        }

        if (activeFilter === 'all') {
            const todayItems = filtered.filter((i) => i.date_key === todayKey);
            const olderItems = filtered.filter((i) => i.date_key !== todayKey);

            // If today has posts, pin Today prominently at the top!
            // If it's early morning before 8 AM, pin the newest day as Featured Lead.
            const spotlightItems = todayItems.length > 0 ? todayItems : [filtered[0]];
            const gridItems = todayItems.length > 0 ? olderItems : filtered.slice(1);

            if (todayWrap && todayGrid) {
                todayWrap.style.display = '';
                const spotDateKey = spotlightItems[0].date_key;
                if (todayDateLabel) {
                    todayDateLabel.textContent = spotDateKey === todayKey
                        ? `${formatShortDate(spotDateKey)} • ${spotlightItems.length} ${spotlightItems.length === 1 ? 'Story' : 'Stories'}`
                        : `Latest Dispatch • ${formatShortDate(spotDateKey)}`;
                }
                const leadHtml = renderLeadCard(spotlightItems[0]);
                const extraTodayHtml = spotlightItems.length > 1
                    ? `<div class="news-grid" style="margin-top: 1.4rem;">${spotlightItems.slice(1).map((it) => renderGridCard(it, it.date_key === todayKey)).join('')}</div>`
                    : '';
                todayGrid.innerHTML = leadHtml + extraTodayHtml;
            }

            if (archiveWrap) {
                archiveWrap.style.display = gridItems.length ? '' : 'none';
            }
            if (archiveGroupLabel) {
                archiveGroupLabel.innerHTML = `<span>Earlier This Week (${gridItems.length} Stories)</span>`;
            }
            newsGrid.innerHTML = gridItems.map((it) => renderGridCard(it, false)).join('');
        } else {
            if (todayWrap) todayWrap.style.display = 'none';
            if (archiveWrap) archiveWrap.style.display = '';
            if (archiveGroupLabel) {
                const lbl = activeFilter === todayKey ? `Today • ${formatShortDate(activeFilter)}` : formatShortDate(activeFilter);
                archiveGroupLabel.innerHTML = `<span>${esc(lbl)} (${filtered.length})</span>`;
            }
            newsGrid.innerHTML = filtered.map((it) => renderGridCard(it, it.date_key === todayKey)).join('');
        }
    }

    function renderFilterPills() {
        if (!filterBar) return;
        const todayKey = localDateKey(new Date());
        const ydt = new Date();
        ydt.setDate(ydt.getDate() - 1);
        const yesterdayKey = localDateKey(ydt);

        const uniqueDays = [];
        for (const it of allSevenDayItems) {
            if (it.date_key && !uniqueDays.includes(it.date_key)) {
                uniqueDays.push(it.date_key);
            }
        }

        const pills = [`<button type="button" class="day-pill ${activeFilter === 'all' ? 'active' : ''}" data-day-filter="all">All 7 Days (${allSevenDayItems.length})</button>`];
        for (const dayKey of uniqueDays.slice(0, 7)) {
            let label = formatShortDate(dayKey);
            if (dayKey === todayKey) label = 'Today';
            else if (dayKey === yesterdayKey) label = 'Yesterday';
            pills.push(`<button type="button" class="day-pill ${activeFilter === dayKey ? 'active' : ''}" data-day-filter="${esc(dayKey)}">${esc(label)}</button>`);
        }
        filterBar.innerHTML = pills.join('');

        filterBar.querySelectorAll('[data-day-filter]').forEach((btn) => {
            btn.addEventListener('click', () => {
                activeFilter = btn.getAttribute('data-day-filter') || 'all';
                renderFilterPills();
                renderNews();
            });
        });
    }

    // Load 7-Day News Feed
    if (newsGrid) {
        fetch('news.json?v=' + Math.floor(Date.now() / 60000))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const rawItems = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
                const cutoffMs = Date.now() - 7.5 * 24 * 60 * 60 * 1000;
                const nowMs = Date.now() + 60000;

                allSevenDayItems = rawItems
                    .filter((item) => {
                        if (!item || !item.publish_at) return false;
                        const t = new Date(item.publish_at).getTime();
                        return !Number.isNaN(t) && t <= nowMs && t >= cutoffMs;
                    })
                    .map((item) => {
                        const dt = new Date(item.publish_at);
                        return {
                            ...item,
                            date_key: item.date_key || localDateKey(dt)
                        };
                    })
                    .sort((a, b) => new Date(b.publish_at) - new Date(a.publish_at));

                // Fallback if all entries are slightly older than 7 days
                if (!allSevenDayItems.length && rawItems.length) {
                    allSevenDayItems = rawItems
                        .slice(0, 12)
                        .map((item) => ({
                            ...item,
                            date_key: item.date_key || localDateKey(new Date(item.publish_at || Date.now()))
                        }))
                        .sort((a, b) => new Date(b.publish_at) - new Date(a.publish_at));
                }

                renderFilterPills();
                renderNews();
            })
            .catch(() => {
                newsGrid.innerHTML = '<p class="newsroom-empty">Unable to load news right now. Please refresh!</p>';
            });
    }

    // Load YouTube Studio Vault
    if (ytGrid) {
        fetch('youtube_feed.json?v=' + Math.floor(Date.now() / 60000))
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const videos = (data && Array.isArray(data.videos)) ? data.videos : [];
                if (!videos.length) {
                    ytGrid.innerHTML = '<p class="newsroom-empty">Visit <a href="https://www.youtube.com/@coolanddeadlyreggae" target="_blank" rel="noopener" style="color:var(--gold);">@coolanddeadlyreggae</a> on YouTube for full reggae history documentaries &amp; shorts.</p>';
                    return;
                }

                // Showcase Reggae History / Documentary clips first, then latest uploads (up to 8 cards)
                const historyFirst = videos.filter((v) => /part \d|black ark|studio one|king tubby|dennis brown|kingston|pull up|marley|reggae/i.test(v.title));
                const rest = videos.filter((v) => !historyFirst.includes(v));
                const showcase = [...historyFirst, ...rest].slice(0, 8);

                ytGrid.innerHTML = showcase.map((v) => {
                    const dt = v.published ? new Date(v.published).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
                    const cleanTitle = v.title.replace(/\s*\|\s*#Shorts\s*$/i, '').replace(/\s*#Shorts\s*$/i, '').trim();
                    return `
                        <button type="button" class="yt-card" data-play-yt="${esc(v.id)}" data-yt-title="${esc(cleanTitle)}" data-yt-short="${v.is_short ? '1' : '0'}">
                            <div class="yt-thumb">
                                <img src="${esc(v.thumbnail)}" alt="${esc(cleanTitle)}" loading="lazy">
                                <span class="yt-play-circle">▶</span>
                            </div>
                            <div class="yt-card-body">
                                <span class="yt-date">${esc(dt)} ${v.is_short ? '• Short' : '• Video'}</span>
                                <span class="yt-title">${esc(cleanTitle)}</span>
                            </div>
                        </button>
                    `;
                }).join('');
            })
            .catch(() => {
                ytGrid.innerHTML = '<p class="newsroom-empty">Watch our latest Reggae history &amp; news on <a href="https://www.youtube.com/@coolanddeadlyreggae" target="_blank" rel="noopener" style="color:var(--gold);">YouTube</a>.</p>';
            });
    }
})();
