// Cool & Deadly Newsroom
// Renders news.json. Items only appear once their publish_at time has passed,
// so approved posts can be pushed ahead of time and "go live" on schedule.
(function () {
    const grid = document.getElementById('newsroom-grid');
    if (!grid) return;

    const TYPE_LABELS = { on_this_day: 'ON THIS DAY', coming_up: 'COMING UP', news: 'REGGAE NEWS', radio: 'ON THE RADIO' };

    function esc(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function card(item) {
        const date = new Date(item.publish_at);
        const when = date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        const label = TYPE_LABELS[item.type] || 'NEWS';
        const source = item.source_url
            ? `<a class="news-source" href="${esc(item.source_url)}" target="_blank" rel="noopener">Source: ${esc(item.source_name || 'link')}</a>`
            : '';
        return `
            <article class="news-card" id="news-${esc(item.id)}">
                <div class="news-meta"><span class="news-tag">${label}</span><time datetime="${esc(item.publish_at)}">${when}</time></div>
                <h3 class="news-title">${esc(item.title)}</h3>
                <p class="news-body">${esc(item.body)}</p>
                ${source}
            </article>`;
    }

    fetch('news.json?v=' + Date.now())
        .then(r => r.ok ? r.json() : [])
        .then(items => {
            const now = Date.now();
            const live = (items || [])
                .filter(i => i.publish_at && new Date(i.publish_at).getTime() <= now)
                .sort((a, b) => new Date(b.publish_at) - new Date(a.publish_at))
                .slice(0, 9);
            grid.innerHTML = live.length
                ? live.map(card).join('')
                : '<p class="newsroom-empty">Fresh vibes coming soon. Check back!</p>';
        })
        .catch(() => { grid.innerHTML = '<p class="newsroom-empty">Fresh vibes coming soon. Check back!</p>'; });
})();
