function getImageForTournament(name) {
    const n = String(name || '').toLowerCase();

    // 2025
    if (n.includes('starladder') && n.includes('budapest') && n.includes('major')) return 'images/starladder-major-2025.png';

    // 2026 
    if (n.includes('blast') && n.includes('bounty')) return 'images/blast-bounty-2026.jpg';
    if (n.includes('iem') && n.includes('krakow')) return 'images/iem-krakow-2026.jpg';
    if (n.includes('pgl') && n.includes('cluj')) return 'images/pgl-cluj.jpg';
    if (n.includes('esl') && n.includes('pro league')) return 'images/esl-pro-league-finals.webp';
    if (n.includes('pgl') && n.includes('bucharest')) return 'images/pgl-bucharest-2026.webp';
    if (n.includes('iem') && n.includes('rio')) return 'images/iem-rio-2026.jpg';
    if (n.includes('blast') && n.includes('rivals')) return 'images/blast-rivals-2026.jpg';
    if (n.includes('pgl') && n.includes('astana')) return 'images/pgl-astana-2026.webp';
    if (n.includes('iem') && n.includes('atlanta')) return 'images/iem-atlanta-2026.png';
    if ((n.includes('cs asia') || n.includes('asia championships')) && n.includes('2026')) return 'images/cs-asia-chmp-2026.webp';
    if (n.includes('iem') && n.includes('cologne') && n.includes('major')) return 'images/iem-cologne-major-2026.jpg';

    return 'images/images.jpg';
}

const esc = (s) =>
    String(s || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

const fmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
const d0 = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null);
const d1 = (s) => {
    const d = s ? new Date(s) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
};
const range = (a, b) => {
    if (!a && !b) return '';
    if (a && !b) return fmt.format(a);
    if (!a && b) return fmt.format(b);
    return `${fmt.format(a)} — ${fmt.format(b)}`;
};
const status = (a, b) => {
    const t = d0(new Date());
    const s = d0(a);
    const e = d0(b);
    if (e && e < t) return 'ПРОШЕЛ';
    if (s && e && s <= t && t <= e) return 'ИДЕТ';
    return 'СКОРО';
};

(async function () {
    const root = document.getElementById('tournaments-root');
    if (!root) return;

    try {
        const res = await fetch('xml/tournaments.xml', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Не удалось загрузить XML (HTTP ${res.status})`);

        const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
        if (xml.querySelector('parsererror')) throw new Error('XML содержит ошибку и не парсится');

        const years = Array.from(xml.querySelectorAll('tournaments > year'));
        root.innerHTML = years
            .map((y) => {
                const yearValue = y.getAttribute('value') || '';
                const nodes = Array.from(y.querySelectorAll(':scope > tournament'));
                if (!nodes.length) return '';

                const cards = nodes
                    .map((n) => {
                        const name = n.querySelector(':scope > name')?.textContent?.trim() || 'Турнир';
                        const location = n.querySelector(':scope > location')?.textContent?.trim() || '';
                        const prizePool = n.querySelector(':scope > prize_pool')?.textContent?.trim() || '';
                        const winner = n.querySelector(':scope > winner')?.textContent?.trim() || '';
                        const mvp = n.querySelector(':scope > mvp')?.textContent?.trim() || '';
                        const start = n.querySelector(':scope > dates > start')?.textContent?.trim() || '';
                        const end = n.querySelector(':scope > dates > end')?.textContent?.trim() || '';
                        const isMajor = (n.getAttribute('major') || '').toLowerCase() === 'true';

                        const startDate = d1(start);
                        const endDate = d1(end);
                        const dates = range(startDate, endDate);
                        const st = status(startDate, endDate);

                        const badges = [
                            isMajor ? '<span class="badge badge--major">MAJOR</span>' : '',
                            `<span class="badge">${esc(st)}</span>`,
                        ]
                            .filter(Boolean)
                            .join(' ');

                        const imgSrc = getImageForTournament(name);
                        const cls = isMajor ? 'tournament-card--major' : '';
                        const prize = prizePool ? `<p class="prize">$ ${esc(prizePool)}</p>` : '';
                        const winnerLine = st === 'ПРОШЕЛ' && winner ? `<p>🏆 Победитель: ${esc(winner)}</p>` : '';
                        const mvpLine = st === 'ПРОШЕЛ' && mvp ? `<p>⭐ MVP: ${esc(mvp)}</p>` : '';

                        return `
                            <article class="${cls}">
                                <figure>
                                    <img src="${esc(imgSrc)}" alt="${esc(name)}" loading="lazy" />
                                </figure>
                                <div>
                                    ${badges}
                                    <h3>${esc(name)}</h3>
                                    ${dates ? `<p>📅 ${esc(dates)}</p>` : ''}
                                    ${location ? `<p>📍 ${esc(location)}</p>` : ''}
                                    ${winnerLine}
                                    ${mvpLine}
                                    ${prize}
                                </div>
                            </article>
                        `.trim();
                    })
                    .join('\n');

                const title = yearValue ? `Турниры ${esc(yearValue)}` : 'Турниры';
                return `
                    <section class="tournaments">
                        <div class="section-head">
                            <div>
                                <h2><span></span>${title}</h2>
                                <p>Всего: ${nodes.length}</p>
                            </div>
                        </div>
                        <div class="tournaments-grid">
                            ${cards}
                        </div>
                    </section>
                `.trim();
            })
            .filter(Boolean)
            .join('\n');

        if (!root.innerHTML.trim()) root.innerHTML = '<p style="color:#8b92a5">Турниры не найдены.</p>';
    } catch (e) {
        const msg = e && e.message ? e.message : 'неизвестная ошибка';
        root.innerHTML = `<p style="color:#8b92a5">Ошибка загрузки турниров: ${esc(msg)}</p>`;
    }
})();

