(async function () {
    try {
        const [rankingsXml, teamsXml] = await Promise.all([
            fetch('xml/rankings.xml').then((r) => r.text()),
            fetch('xml/teams.xml').then((r) => r.text()),
        ]);

        const rankings = new DOMParser().parseFromString(rankingsXml, 'application/xml');
        const teamsDoc = new DOMParser().parseFromString(teamsXml, 'application/xml');
        const text = (node, sel) => (node.querySelector(sel)?.textContent || '').trim();

        const teamsById = {};
        teamsDoc.querySelectorAll('team').forEach((n) => {
            const id = n.getAttribute('id');
            if (!id) return;
            teamsById[id] = {
                id,
                name: text(n, 'name'),
                region: text(n, 'region'),
                logo: text(n, 'logo'),
                coach: text(n, 'coach'),
                players: Array.from(n.querySelectorAll('players > player')).map((p) => p.textContent.trim()),
            };
        });

        const parseRanking = (section) =>
            Array.from(rankings.querySelectorAll(section + ' > team')).map((n) => ({
                rank: +n.getAttribute('rank'),
                teamId: n.getAttribute('team_id'),
                points: +text(n, 'points'),
            }));

        const hltv = parseRanking('hltv_ranking');
        const valve = parseRanking('valve_ranking');

        // ratings.html
        const body = document.getElementById('rating-table-body');
        const tabs = document.querySelectorAll('.rating-tab');
        const drawRating = (list) => {
            if (!body) return;
            body.innerHTML = list
                .map((x) => {
                    const t = teamsById[x.teamId];
                    if (!t) return '';
                    return `<tr><td>#${x.rank}</td><td>${t.name}</td><td>${t.region}</td><td class="rating-points">${x.points}</td></tr>`;
                })
                .join('');
        };
        if (body && tabs.length) {
            drawRating(hltv);
            tabs.forEach((tab) => {
                tab.onclick = () => {
                    tabs.forEach((x) => x.classList.remove('is-active'));
                    tab.classList.add('is-active');
                    drawRating(tab.dataset.ranking === 'valve' ? valve : hltv);
                };
            });
        }

        // teams.html
        const grid = document.getElementById('teams-grid');
        const count = document.getElementById('teams-count');
        const modal = document.getElementById('team-modal');
        const closeBtn = document.getElementById('team-modal-close');
        const mTitle = document.getElementById('team-modal-title');
        const mRegion = document.getElementById('team-modal-region');
        const mPlayers = document.getElementById('team-modal-players');
        const mLogo = document.getElementById('team-modal-logo');
        if (!(grid && count && modal && closeBtn && mTitle && mRegion && mPlayers && mLogo)) return;

        const ids = Array.from(new Set(hltv.concat(valve).map((x) => x.teamId)));
        const teams = ids
            .map((id) => teamsById[id])
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

        const close = () => modal.setAttribute('aria-hidden', 'true');
        const open = (team) => {
            mLogo.src = `logos/${team.logo}`;
            mLogo.alt = team.name + ' logo';
            mTitle.textContent = team.name;
            mRegion.textContent = 'Регион: ' + team.region;
            mPlayers.innerHTML =
                '<li class="team-modal__section-title">Игроки</li>' +
                team.players.map((p) => `<li class="team-modal__player">${p}</li>`).join('') +
                (team.coach
                    ? `<li class="team-modal__section-title">Тренер</li><li class="team-modal__coach">${team.coach}</li>`
                    : '');
            modal.setAttribute('aria-hidden', 'false');
        };

        const drawTeams = () => {
            grid.innerHTML = teams
                .map(
                    (t) => `
                        <article class="team-card" tabindex="0" data-team="${t.id}">
                            <div class="team-card__logo">
                                <img src="svg/team-${t.id}.svg" alt="${t.name} logo" loading="lazy" onerror="this.onerror=null;this.src='logos/placeholder-team.svg';">
                            </div>
                            <h3>${t.name}</h3>
                            <p>${t.region}</p>
                        </article>
                    `.trim()
                )
                .join('');

            count.textContent = 'Команд: ' + teams.length;
        };

        closeBtn.onclick = close;
        modal.onclick = (e) => e.target.hasAttribute('data-close-modal') && close();
        document.onkeydown = (e) => e.key === 'Escape' && close();

        grid.onclick = (e) => {
            const card = e.target.closest('[data-team]');
            if (!card) return;
            const team = teamsById[card.getAttribute('data-team')];
            if (team) open(team);
        };
        grid.onkeydown = (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const card = e.target.closest('[data-team]');
            if (!card) return;
            e.preventDefault();
            const team = teamsById[card.getAttribute('data-team')];
            if (team) open(team);
        };

        drawTeams();
    } catch (e) {
        console.error('Ошибка загрузки XML:', e);
    }
})();
