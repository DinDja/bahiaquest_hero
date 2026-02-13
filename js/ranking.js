/* js/ranking.js — extraído de ranking.html */
// Módulo responsável por conectar ao Firestore e renderizar a lista de users

// ---------------------------
// 1) Firebase config fornecido pelo usuário (já inserido)
// ---------------------------
// Substituído com o config fornecido — certifique-se de que o projeto no Firebase Console corresponde a estes valores.
const firebaseConfig = {
    apiKey: "AIzaSyDngsg2NCTveN71acJ4VGDmvsSSPFuvsAM",
    authDomain: "lovebuilder-87763.firebaseapp.com",
    projectId: "lovebuilder-87763",
    storageBucket: "lovebuilder-87763.firebasestorage.app",
    messagingSenderId: "272837748642",
    appId: "1:272837748642:web:fd717fda7506c52aeeb4fb",
    measurementId: "G-5D1X2JNVHZ"
};

// ---------------
// 2) Dependências (modular SDK v9+), incluindo Analytics
// ---------------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js';
import {
    getFirestore, collection, addDoc, serverTimestamp,
    query, orderBy, limit, onSnapshot, getDocs
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// If firebaseConfig is not replaced, we skip connecting (so dev can still view UI)
let db = null;
let app = null;
if (firebaseConfig.projectId && firebaseConfig.projectId !== 'REPLACE_ME') {
    try {
        app = initializeApp(firebaseConfig);
        // Analytics (opcional — pode falhar em ambientes sem suporte)
        try { getAnalytics(app); } catch(e) { console.warn('Analytics não inicializado:', e); }
        db = getFirestore(app);
    } catch (err) {
        console.error('Firebase init error', err);
        const fm = document.getElementById('formMsg');
        if (fm) fm.textContent = 'Erro ao iniciar Firebase. Veja o console.';
    }
} else {
    const fm = document.getElementById('formMsg');
    if (fm) fm.textContent = 'Firebase não configurado — substitua firebaseConfig para ativar.';
}

// UI refs
const lb = document.getElementById('leaderboard');
const lbEmpty = document.getElementById('leaderboard-empty');
const form = document.getElementById('scoreForm');
const nameInput = document.getElementById('playerName');
const avatarInput = document.getElementById('playerAvatar');
const scoreInput = document.getElementById('playerScore');
const formMsg = document.getElementById('formMsg');

// ranking mode: 'global' or 'weekly'
let currentMode = 'global';
let currentUnsubscribe = null;
let listenerStarted = false; // indicates whether startListener() has been invoked
const btnGlobal = document.getElementById('mode-global');
const btnWeekly = document.getElementById('mode-weekly');
const weeklyResetEl = document.getElementById('weekly-reset');

// safe DOM helper
function safeSetText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function safeSetHTML(id, value) { const el = document.getElementById(id); if (el) el.innerHTML = value; }

function renderRow(doc, rank = null, mode = currentMode) {
    const data = doc.data();

    const el = document.createElement('div');
    el.className = 'rank-card flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 cursor-pointer';

    // left block (rank badge + medal + avatar + info)
    const left = document.createElement('div');
    left.className = 'flex items-center gap-3 flex-1 min-w-0';

    const rankBadge = document.createElement('div');
    rankBadge.className = 'rank-badge w-12 text-center';
    rankBadge.textContent = rank || '—';

    // medal for top 3
    let medalEl = null;
    if (rank === 1 || rank === 2 || rank === 3) {
        medalEl = document.createElement('div');
        // assign semantic classes + special styling for 1st place
        const medalClass = rank === 1 ? 'medal-gold' : rank === 2 ? 'medal-silver' : 'medal-bronze';
        medalEl.className = `medal ${medalClass}`;
        if (rank === 1) medalEl.classList.add('solo');
        // use inline SVG per medal (gold/silver/bronze)
        const getSVG = (r) => {
            if (r === 1) return `
                <svg viewBox="0 0 64 64" role="img" aria-label="Medalha de ouro">
                    <defs>
                        <radialGradient id="gGoldJS" cx="30%" cy="25%">
                            <stop offset="0%" stop-color="#fff9d6"/>
                            <stop offset="45%" stop-color="#fde68a"/>
                            <stop offset="100%" stop-color="#facc15"/>
                        </radialGradient>
                    </defs>
                    <circle cx="32" cy="28" r="18" fill="url(#gGoldJS)" stroke="#b27a00" stroke-width="1.5"/>
                    <path d="M32 20 L36 28 L44 28 L38 33 L40 42 L32 36 L24 42 L26 33 L20 28 L28 28 Z" fill="#fff4c8" opacity="0.95"/>
                </svg>`;
            if (r === 2) return `
                <svg viewBox="0 0 64 64" role="img" aria-label="Medalha de prata">
                    <defs>
                        <radialGradient id="gSilverJS" cx="30%" cy="25%">
                            <stop offset="0%" stop-color="#f8fafc"/>
                            <stop offset="60%" stop-color="#e6eef6"/>
                            <stop offset="100%" stop-color="#94a3b8"/>
                        </radialGradient>
                    </defs>
                    <circle cx="32" cy="28" r="18" fill="url(#gSilverJS)" stroke="#6b7280" stroke-width="1.2"/>
                    <path d="M32 20 L36 28 L44 28 L38 33 L40 42 L32 36 L24 42 L26 33 L20 28 L28 28 Z" fill="#ffffff" opacity="0.9"/>
                </svg>`;
            return `
                <svg viewBox="0 0 64 64" role="img" aria-label="Medalha de bronze">
                    <defs>
                        <radialGradient id="gBronzeJS" cx="30%" cy="25%">
                            <stop offset="0%" stop-color="#fff3ea"/>
                            <stop offset="55%" stop-color="#ffd9c3"/>
                            <stop offset="100%" stop-color="#fb923c"/>
                        </radialGradient>
                    </defs>
                    <circle cx="32" cy="28" r="18" fill="url(#gBronzeJS)" stroke="#8a3f1a" stroke-width="1.2"/>
                    <path d="M32 20 L36 28 L44 28 L38 33 L40 42 L32 36 L24 42 L26 33 L20 28 L28 28 Z" fill="#fff7ef" opacity="0.9"/>
                </svg>`;
        };

        medalEl.innerHTML = getSVG(rank);
        medalEl.setAttribute('role', 'img');
        medalEl.setAttribute('aria-label', `${rank}º lugar`);
        medalEl.title = `${rank}º lugar`;
        // visible info log to confirm medal creation
        console.info('[ranking] creating medal for rank', rank, 'class:', medalEl.className);
        // pop animation on insert
        requestAnimationFrame(() => { medalEl.classList.add('pop'); });
        medalEl.addEventListener('animationend', () => medalEl.classList.remove('pop'));
        // when clicked, toggle expanded info without propagating to the card
        medalEl.addEventListener('click', (ev) => {
            ev.stopPropagation();
            el.classList.toggle('expanded');
        });
    }

    const img = document.createElement('img');
    img.src = data.photoURL || data.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(doc.id)}`;
    img.alt = data.displayName || data.name || 'avatar';
    img.className = 'player-avatar';

    const info = document.createElement('div');
    info.className = 'min-w-0';
    const title = document.createElement('h3');
    title.className = 'font-bold text-lg text-white truncate';
    title.textContent = data.displayName || data.name || 'Anônimo';

    const subtitle = document.createElement('div');
    subtitle.className = 'text-xs text-slate-400 uppercase font-bold tracking-wider';
    subtitle.textContent = data.title || data.role || '';

    const expanded = document.createElement('div');
    expanded.className = 'expanded-info';
    expanded.textContent = data.details || `${doc.id} • Mais info aqui`;

    info.appendChild(title);
    if (subtitle.textContent) info.appendChild(subtitle);
    info.appendChild(expanded);

    left.appendChild(rankBadge);
    if (medalEl) left.appendChild(medalEl);
    left.appendChild(img);
    left.appendChild(info);

    // right block (xp & meta)
    const right = document.createElement('div');
    right.className = 'text-right';

    const xp = document.createElement('div');
    // show weeklyXp when in weekly mode, otherwise show xp/score/points
    const xpValue = (mode === 'weekly')
        ? ((typeof data.weeklyXp === 'number') ? data.weeklyXp : ((typeof data.xp === 'number') ? data.xp : (typeof data.score === 'number' ? data.score : (data.points || 0))))
        : ((typeof data.xp === 'number') ? data.xp : (typeof data.score === 'number') ? data.score : (data.points || 0));
    xp.className = 'text-2xl font-black text-white';
    xp.textContent = formatXP(xpValue);

    const meta = document.createElement('div');
    meta.className = 'text-[10px] text-slate-400 uppercase tracking-widest';
    const weekly = data.weeklyXp !== undefined ? `Weekly: ${data.weeklyXp}` : '';
    const streak = data.streak !== undefined ? `Streak: ${data.streak}` : '';
    meta.textContent = [weekly, streak].filter(Boolean).join(' • ');

    right.appendChild(xp);
    if (meta.textContent) right.appendChild(meta);

    el.appendChild(left);
    el.appendChild(right);

    // interaction: click to expand/collapse card details
    el.addEventListener('click', () => el.classList.toggle('expanded'));

    return el;
}

// small helper to format XP (k suffix)
function formatXP(n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
    return String(n);
}

// Real-time listener
async function startListener() {
    listenerStarted = true;
    // ensure DOM refs exist (in case startListener is called after DOMContentLoaded)
    if (!document.getElementById('leaderboard')) { console.warn('[ranking] #leaderboard element not found — listener aborted'); return; }
    if (!db) {
        const lbEl = document.getElementById('leaderboard');
        if (lbEl) lbEl.innerHTML = '<div class="text-slate-600">Conecte o Firebase para ver dados reais.</div>';
        return;
    }

    // Single collection source: `users`
    // `orderField` will be either `xp`/`score` (global) or `weeklyXp` (weekly)
    const tryCollection = (colName, orderField) => query(collection(db, colName), orderBy(orderField, 'desc'), limit(200));

    const attachSnapshot = (q, sourceName) => {
        // update UI to show data source (optional)
        console.info(`Listening to ${sourceName} collection (mode=${currentMode})`);
        // unsubscribe previous snapshot if any
        if (currentUnsubscribe) { try { currentUnsubscribe(); } catch(e) { /* ignore */ } currentUnsubscribe = null; }

        currentUnsubscribe = onSnapshot(q, (snap) => {
            lb.innerHTML = '';

            // debug banner (visible in UI so user sees data source / mode / count)
            lb.insertAdjacentHTML('beforeend', `<div id="leaderboard-debug" class="text-xs text-slate-400 mb-3 px-3 py-2 bg-black/20 rounded-md">Fonte: <strong>${sourceName}</strong> • Modo: <strong>${currentMode}</strong> • Docs: <strong>${snap.size}</strong></div>`);

            if (snap.empty) { lbEmpty.classList.remove('hidden');
                safeSetText('stat-players','0');
                safeSetText('stat-total-xp','0');
                safeSetText('stat-avg-xp','0');
                safeSetText('podium-top','—');
                if (weeklyResetEl) weeklyResetEl.classList.add('hidden');

                // show friendly message in leaderboard area
                lb.insertAdjacentHTML('beforeend', `<div class="p-6 text-center text-slate-500">Nenhum registro encontrado (coleção: ${sourceName}).</div>`);
                return;
            } else { if (lbEmpty) lbEmpty.classList.add('hidden'); }

            let totalXP = 0;
            const top3 = [];

            // Use snap.docs.forEach so `idx` is a real index — QuerySnapshot.forEach doesn't provide an index
            snap.docs.forEach((doc, idx) => {
                const rank = idx + 1;
                const rowEl = renderRow(doc, rank, currentMode);
                lb.appendChild(rowEl);

                const data = doc.data();
                // support weekly mode ordering/display
                const xpValue = (currentMode === 'weekly') ? ((typeof data.weeklyXp === 'number') ? data.weeklyXp : ((typeof data.xp === 'number') ? data.xp : (typeof data.score === 'number' ? data.score : (data.points || 0)))) : ((typeof data.xp === 'number') ? data.xp : (typeof data.score === 'number') ? data.score : (data.points || 0));
                totalXP += xpValue;

                if (rank <= 3) {
                    top3.push({ rank, name: data.displayName || data.name || 'Anônimo', xp: xpValue, avatar: data.photoURL || data.avatar, weeklyResetAt: data.weeklyXpResetAt });
                }
            });

            // info: show counts collected (visible in console)
            console.info('[ranking] documents:', snap.size, 'top3:', top3.map(t=>t.name), 'totalXP:', totalXP);

            // Stats
            const players = snap.size;
            const avg = players ? Math.round(totalXP / players) : 0;
            safeSetText('stat-players', players);
            safeSetText('stat-total-xp', totalXP.toLocaleString());
            safeSetText('stat-avg-xp', formatXP(avg));

            // Podium
            function applyStand(n, info) {
                const standEl = document.getElementById(`stand-${n}`);
                if (!standEl) return;
                if (!info) { standEl.textContent = n; standEl.removeAttribute('data-name'); return; }
                standEl.textContent = '';
                standEl.setAttribute('data-name', info.name || '—');
                const img = document.createElement('img');
                img.src = info.avatar || `https://i.pravatar.cc/64?u=${encodeURIComponent(info.name || 'u')}`;
                img.alt = info.name || '';
                img.className = 'player-avatar';
                img.style.width = '40px'; img.style.height = '40px'; img.style.border = '2px solid rgba(255,255,255,0.08)';
                standEl.appendChild(img);
            }

            applyStand(1, top3[0]);
            applyStand(2, top3[1]);
            applyStand(3, top3[2]);

            safeSetText('podium-top', top3[0] ? `${top3[0].name} — ${formatXP(top3[0].xp)}` : '—');

            // interactions
            [1,2,3].forEach(n => {
                const stand = document.getElementById(`stand-${n}`);
                if (!stand) return;
                stand.onmouseenter = () => {
                    const card = document.querySelectorAll('#leaderboard .rank-card')[n-1];
                    if (card) card.classList.add('expanded');
                };
                stand.onmouseleave = () => {
                    const card = document.querySelectorAll('#leaderboard .rank-card')[n-1];
                    if (card) card.classList.remove('expanded');
                };
                stand.onclick = () => {
                    const card = document.querySelectorAll('#leaderboard .rank-card')[n-1];
                    if (card) card.scrollIntoView({behavior: 'smooth', block: 'center'});
                };
            });

        }, (err) => {
            console.error(`snapshot error on ${sourceName}`, err);
            // single collection 'users' in use — surface a clear UI error
            lb.innerHTML = `<div class="text-red-400">Erro ao carregar ranking${err && err.message ? `: ${err.message}` : ''}</div>`;
        });
    };

    const tryAttach = (colName, orderField) => {
        try {
            const q = tryCollection(colName, orderField);
            attachSnapshot(q, colName);
        } catch (err) {
            console.error(`failed to attach snapshot to ${colName}`, err);
            lb.innerHTML = `<div class="text-red-400">Erro ao iniciar listener (${colName}). Verifique regras do Firestore.</div>`;
        }
    };

    // única coleção: `users` — ordena por `weeklyXp` quando em modo semanal
    const orderField = (currentMode === 'weekly') ? 'weeklyXp' : 'xp';
    tryAttach('users', orderField);
}
// attach UI handlers (works whether script runs before/after DOM)
function initUI() {
    const _btnGlobal = document.getElementById('mode-global');
    const _btnWeekly = document.getElementById('mode-weekly');
    const _form = document.getElementById('scoreForm');
    const _clearBtn = document.getElementById('clearBtn');

    if (_btnGlobal && !_btnGlobal.dataset.rankingInit) { _btnGlobal.addEventListener('click', () => setMode('global')); _btnGlobal.dataset.rankingInit = '1'; }
    if (_btnWeekly && !_btnWeekly.dataset.rankingInit) { _btnWeekly.addEventListener('click', () => setMode('weekly')); _btnWeekly.dataset.rankingInit = '1'; }

    if (_form && !_form.dataset.rankingInit) {
        _form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (formMsg) formMsg.textContent = '';
            const name = (nameInput && nameInput.value ? nameInput.value : 'Anônimo').trim().slice(0, 50);
            const avatar = (avatarInput && avatarInput.value ? avatarInput.value : '').trim().slice(0, 200);
            const score = Math.max(0, Math.floor(Number(scoreInput && scoreInput.value ? scoreInput.value : 0) || 0));
            if (!db) { if (formMsg) formMsg.textContent = 'Firebase não configurado.'; return; }
            try {
                const docRef = await addDoc(collection(db, 'users'), {
                    displayName: name,
                    photoURL: avatar || null,
                    xp: score,
                    points: score,
                    weeklyXp: score,
                    weeklyXpResetAt: null,
                    createdAt: serverTimestamp()
                });
                if (formMsg) formMsg.textContent = 'Entrada de teste criada em users ✅';
                _form.reset();
            } catch (err) {
                console.error(err);
                if (formMsg) formMsg.textContent = 'Falha ao enviar (ver console)';
            }
        });
        _form.dataset.rankingInit = '1';
    }

    if (_clearBtn && !_clearBtn.dataset.rankingInit) { _clearBtn.addEventListener('click', () => { if (document.getElementById('scoreForm')) document.getElementById('scoreForm').reset(); if (formMsg) formMsg.textContent = ''; }); _clearBtn.dataset.rankingInit = '1'; }
}

// If DOM already ready, run init + listener; otherwise wait for DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initUI();
    if (document.getElementById('leaderboard')) startListener();
} else {
    window.addEventListener('DOMContentLoaded', () => {
        initUI();
        if (!listenerStarted) startListener();
    });
}

// --- mode switch UI handlers ---
function setMode(mode) {
    if (mode !== 'weekly' && mode !== 'global') return;
    if (currentMode === mode) return;
    currentMode = mode;
    // update button styles
    if (btnGlobal) btnGlobal.classList.toggle('bg-white/6', mode === 'global');
    if (btnGlobal) btnGlobal.classList.toggle('text-slate-100', mode === 'global');
    if (btnWeekly) btnWeekly.classList.toggle('bg-white/6', mode === 'weekly');
    if (btnWeekly) btnWeekly.classList.toggle('text-slate-100', mode === 'weekly');
    // re-run listener using new ordering field
    startListener();
}
if (btnGlobal) btnGlobal.addEventListener('click', () => setMode('global'));
if (btnWeekly) btnWeekly.addEventListener('click', () => setMode('weekly'));

// --- "ME" button: focus on a single user (prompt for UID/email if necessary)
async function focusOnUser(identifier) {
    if (!db) { alert('Firebase não configurado.'); return; }
    let id = identifier;
    if (!id) {
        id = prompt('Digite seu UID ou email para localizar seu ranking:');
        if (!id) return;
    }

    const orderField = (currentMode === 'weekly') ? 'weeklyXp' : 'xp';
    try {
        const q = query(collection(db, 'users'), orderBy(orderField, 'desc'), limit(200));
        const snap = await getDocs(q);
        if (snap.empty) { alert('Nenhum registro encontrado.'); return; }

        // find matching document by uid (doc.id), email or displayName
        let foundIndex = -1;
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i++) {
            const d = docs[i];
            const data = d.data();
            if (d.id === id || (data.email && data.email.toLowerCase() === id.toLowerCase()) || (data.uid && data.uid === id) || (data.displayName && data.displayName.toLowerCase() === id.toLowerCase())) { foundIndex = i; break; }
        }
        if (foundIndex === -1) { alert('Usuário não encontrado entre os 200 primeiros.'); return; }

        // render context (±2)
        lb.innerHTML = '';
        const start = Math.max(0, foundIndex - 2);
        const end = Math.min(docs.length - 1, foundIndex + 2);
        for (let i = start; i <= end; i++) {
            const r = i + 1;
            const row = renderRow(docs[i], r, currentMode);
            if (i === foundIndex) row.classList.add('highlight-me');
            lb.appendChild(row);
        }
        // scroll to the user's card
        const target = document.querySelector('.highlight-me');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
        console.error(err);
        alert('Erro ao buscar usuário. Veja console.');
    }
}

if (document.getElementById('btn-me')) document.getElementById('btn-me').addEventListener('click', () => focusOnUser());

// initialize button state
if (btnGlobal) btnGlobal.classList.add('bg-white/6','text-slate-100');
if (btnWeekly) btnWeekly.classList.remove('bg-white/6','text-slate-100');

// Submit score (test)
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (formMsg) formMsg.textContent = '';
        const name = (nameInput && nameInput.value ? nameInput.value : 'Anônimo').trim().slice(0, 50);
        const avatar = (avatarInput && avatarInput.value ? avatarInput.value : '').trim().slice(0, 200);
        const score = Math.max(0, Math.floor(Number(scoreInput && scoreInput.value ? scoreInput.value : 0) || 0));
        if (!db) { if (formMsg) formMsg.textContent = 'Firebase não configurado.'; return; }
        try {
            // write a lightweight user-like doc to `users` for testing (maps to app schema)
            const docRef = await addDoc(collection(db, 'users'), {
                displayName: name,
                photoURL: avatar || null,
                xp: score,
                points: score,
                weeklyXp: score,
                weeklyXpResetAt: null,
                createdAt: serverTimestamp()
            });
            if (formMsg) formMsg.textContent = 'Entrada de teste criada em users ✅';
            form.reset();
        } catch (err) {
            console.error(err);
            if (formMsg) formMsg.textContent = 'Falha ao enviar (ver console)';
        }
    });
} else {
    console.warn('[ranking] scoreForm not found — submit handler not attached');
}

// Clear (client-side only)
const clearBtn = document.getElementById('clearBtn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => { if (form) form.reset(); if (formMsg) formMsg.textContent = ''; });
} else {
    console.debug('[ranking] clearBtn not present');
}