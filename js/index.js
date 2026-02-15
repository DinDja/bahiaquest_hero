/* js/index.js — extraído de index.html */
gsap.registerPlugin(ScrollTrigger);

// XP Progress Bar
gsap.to("#xpBar", {
    width: "100%",
    ease: "none",
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 0
    }
});

let mm = gsap.matchMedia();

const tlHero = gsap.timeline();
tlHero.from(".reveal-text", { y: -50, opacity: 0, duration: 1, ease: "power4.out" })
      .from(".reveal-main", { y: 100, opacity: 0, stagger: 0.2, duration: 1, ease: "power4.out" }, "-=0.5")
      .from(".reveal-desc", { y: 20, opacity: 0, duration: 1, ease: "power2.out" }, "-=0.5")
      .from(".reveal-btn", { scale: 0.8, opacity: 0, duration: 0.8, ease: "back.out(1.7)" }, "-=0.5");

gsap.to("#hero-bg", {
    scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: true
    },
    y: 200,
    scale: 1.3
});

// --- DESKTOP LOGIC (Horizontal) ---
mm.add("(min-width: 1024px)", () => {
    let sections = gsap.utils.toArray(".h-panel");
    gsap.to(sections, {
        xPercent: -100 * (sections.length - 1),
        ease: "none",
        scrollTrigger: {
            trigger: "#modes",
            pin: true,
            scrub: 1,
            snap: 1 / (sections.length - 1),
            end: () => "+=" + document.querySelector("#modes").offsetWidth * 2,
        }
    });
});

// --- MOBILE/TABLET LOGIC (Vertical but Reactive) ---
mm.add("(max-width: 1023px)", () => {
    // 1. App Icon Interaction (Panel 1)
    gsap.to("#mobile-app-icon", {
        scrollTrigger: {
            trigger: ".mobile-icon-trigger",
            start: "top center",
            end: "bottom top",
            scrub: 1
        },
        rotation: 180,
        scale: 0.6,
        y: 50
    });

    // 2. Phones Entering (Panel 2)
    gsap.from(".phone-left", {
        scrollTrigger: {
            trigger: ".phone-section-trigger",
            start: "top 80%",
            end: "top 20%",
            scrub: 1
        },
        x: -150,
        rotation: -30,
        opacity: 0
    });

    gsap.from(".phone-right", {
        scrollTrigger: {
            trigger: ".phone-section-trigger",
            start: "top 80%",
            end: "top 20%",
            scrub: 1
        },
        x: 150,
        rotation: 30,
        opacity: 0
    });

    // 3. Radar Zoom (Panel 3)
    gsap.from("#radar-ui", {
        scrollTrigger: {
            trigger: "#radar-ui",
            start: "top 90%",
            end: "bottom 80%",
            scrub: 1
        },
        scale: 0.5,
        opacity: 0.5
    });

    // 4. Profile Card Tilt (Panel 4)
    gsap.from("#profile-card", {
        scrollTrigger: {
            trigger: "#profile-card",
            start: "top 90%",
            end: "top 40%",
            scrub: 1
        },
        rotateX: 45,
        y: 100,
        opacity: 0
    });
});

// Stacking Cards (Universal)
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cards = gsap.utils.toArray(".stack-card");
cards.forEach((card, index) => {
    gsap.from(card, {
        scrollTrigger: {
            trigger: card,
            start: "top bottom", 
            end: "top 15vh", 
            scrub: true
        },
        scale: 0.8,
        rotation: index % 2 === 0 ? -5 : 5,
        opacity: 0.5
    });
    
    gsap.to(card, {
        scrollTrigger: {
            trigger: card,
            start: "top 15vh",
            end: "top top",
            scrub: true
        },
        rotation: 0,
        scale: 1,
        opacity: 1
    });

    // Add pointer tilt on desktop & pointer devices
    addTiltEffect(card);
});

// --- Utility interactions: ripple, tilt, nav shrink, keyboard + swipe navigation, long-press ---



// Smooth-scroll for anchor links (enhancement)
try { document.documentElement.style.scrollBehavior = 'smooth'; } catch(e){}

// Ripple effect for buttons with .btn-ripple
function attachRipple() {
    document.querySelectorAll('.btn-ripple').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.2;
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });
}
attachRipple();

// Navbar shrink on scroll + mobile menu toggle
const navEl = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 20) navEl.classList.add('scrolled'); else navEl.classList.remove('scrolled');
}, { passive: true });

// Mobile drawer toggle (backdrop, body scroll lock)
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileBackdrop = document.getElementById('mobileMenuBackdrop');
const mobileClose = document.getElementById('mobileMenuClose');

// Fallback: use inline transform so the drawer opens even if Tailwind classes don't toggle
if (mobileMenu) {
    mobileMenu.style.transform = 'translateX(100%)';
    mobileMenu.style.transition = mobileMenu.style.transition || 'transform 300ms ease-in-out';
    mobileMenu.style.display = 'block';
    mobileMenu.style.visibility = 'visible';
}
if (mobileBackdrop) {
    mobileBackdrop.style.opacity = '0';
    mobileBackdrop.style.transition = mobileBackdrop.style.transition || 'opacity 300ms ease-in-out';
    mobileBackdrop.style.pointerEvents = 'none';
}

function openMobileMenu() {
    console && console.log && console.log('[menu] openMobileMenu called');
    // class fallback for Tailwind + inline transform guarantee
    mobileMenu && mobileMenu.classList.remove('translate-x-full');
    mobileMenu && mobileMenu.classList.add('translate-x-0');

    // force styles (defensive)
    if (mobileMenu) {
        mobileMenu.style.transform = 'translateX(0)';
        mobileMenu.style.right = '0';
        mobileMenu.style.display = 'block';
        mobileMenu.style.visibility = 'visible';
        mobileMenu.style.opacity = '1';
    }

    mobileBackdrop && mobileBackdrop.classList.remove('opacity-0','pointer-events-none');
    mobileBackdrop && mobileBackdrop.classList.add('opacity-100');
    mobileBackdrop && (mobileBackdrop.style.opacity = '1');
    mobileBackdrop && (mobileBackdrop.style.pointerEvents = 'auto');

    mobileBtn && mobileBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
    console && console.log && console.log('[menu] closeMobileMenu called');
    mobileMenu && mobileMenu.classList.remove('translate-x-0');
    mobileMenu && mobileMenu.classList.add('translate-x-full');

    if (mobileMenu) {
        mobileMenu.style.transform = 'translateX(100%)';
        mobileMenu.style.opacity = '0';
    }

    mobileBackdrop && mobileBackdrop.classList.add('opacity-0');
    mobileBackdrop && mobileBackdrop.classList.add('pointer-events-none');
    mobileBackdrop && (mobileBackdrop.style.opacity = '0');
    mobileBackdrop && (mobileBackdrop.style.pointerEvents = 'none');

    mobileBtn && mobileBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

// stronger click handler: log + force open (defensive)
mobileBtn && mobileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console && console.log && console.log('[menu] mobileMenuBtn clicked');
    // defensive immediate show in case class toggles fail
    if (mobileMenu) {
        mobileMenu.style.transform = 'translateX(0)';
        mobileMenu.style.right = '0';
        mobileMenu.style.display = 'block';
        mobileMenu.style.visibility = 'visible';
    }
    if (mobileBackdrop) { mobileBackdrop.style.opacity = '1'; mobileBackdrop.style.pointerEvents = 'auto'; }
    openMobileMenu();
});

mobileBackdrop && mobileBackdrop.addEventListener('click', closeMobileMenu);
mobileClose && mobileClose.addEventListener('click', closeMobileMenu);

// Close with Escape
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeMobileMenu(); });

// Close when a menu link is selected
document.querySelectorAll('#mobileMenu a').forEach(a => a.addEventListener('click', closeMobileMenu));

// Prevent placeholder anchors (href="#") from jumping to top on mobile
// Keeps placeholder/social buttons from navigating to “#” and forcing scroll-to-top.
document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', (e) => e.preventDefault()));

const _openMobileMenu = openMobileMenu;
const _closeMobileMenu = closeMobileMenu;
openMobileMenu = function() { _openMobileMenu(); };
closeMobileMenu = function() { _closeMobileMenu(); };

// Tilt effect (pointer-based). Uses GSAP for smooth reset.
function addTiltEffect(el) {
    if (prefersReduced) return; // respect user preference
    el.classList.add('tilt-active');
    let rect = null;
    el.addEventListener('pointermove', (ev) => {
        rect = rect || el.getBoundingClientRect();
        const px = (ev.clientX - rect.left) / rect.width;
        const py = (ev.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 12; // degrees
        const rotateX = (0.5 - py) * 8;  // degrees
        gsap.to(el, {rotationY: rotateY, rotationX: rotateX, transformPerspective: 800, transformOrigin: 'center', duration: 0.4, ease: 'power3.out'});
    });
    el.addEventListener('pointerleave', () => {
        rect = null;
        gsap.to(el, {rotationY: 0, rotationX: 0, duration: 0.5, ease: 'elastic.out(1, 0.6)'});
    });
}

// Long-press on phone mockups (mobile-friendly) to show a quick tooltip
document.querySelectorAll('.phone-mockup').forEach(pm => {
    let t = null;
    let tip = null;
    function showTip() {
        tip = document.createElement('div');
        tip.className = 'lp-tooltip lp-visible';
        tip.textContent = 'Pressione para ver mais';
        pm.appendChild(tip);
    }
    function hideTip() { if (tip) tip.remove(); tip = null; }
    pm.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return; // long-press only for touch
        t = setTimeout(showTip, 600);
    });
    ['pointerup','pointercancel','pointerleave'].forEach(evt => pm.addEventListener(evt, () => { clearTimeout(t); hideTip(); }));
});

// Keyboard navigation for horizontal panels (desktop)
const panels = gsap.utils.toArray('.h-panel');
function getClosestPanelIndex() {
    const centerX = window.innerWidth / 2;
    let best = 0; let bestDist = Infinity;
    panels.forEach((p, i) => {
        const r = p.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - centerX);
        if (dist < bestDist) { best = i; bestDist = dist; }
    });
    return best;
}
document.addEventListener('keydown', (ev) => {
    if (window.innerWidth < 1024) return; // only desktop horizontal
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
        ev.preventDefault();
        const idx = getClosestPanelIndex();
        const next = ev.key === 'ArrowRight' ? Math.min(panels.length - 1, idx + 1) : Math.max(0, idx - 1);
        panels[next].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
    }
});

// Swipe detection to change panels (desktop only — avoid interfering with mobile vertical scroll)
let touchStartX = 0;
let touchStartY = 0;
let touchStarted = false;

document.addEventListener('touchstart', (e) => {
    // Guard: only run horizontal-swipe logic on wide screens (desktop/horizontal panels)
    if (window.innerWidth < 1024) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStarted = true;
}, {passive: true});

document.addEventListener('touchend', (e) => {
    if (window.innerWidth < 1024) { touchStarted = false; return; }
    if (!touchStarted) return; touchStarted = false;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchStartX;
    const diffY = endY - touchStartY;

    // ignore small swipes and vertical scroll gestures
    if (Math.abs(diffX) < 50) return;
    if (Math.abs(diffY) > Math.abs(diffX)) return;

    const idx = getClosestPanelIndex();
    const next = diffX < 0 ? Math.min(panels.length - 1, idx + 1) : Math.max(0, idx - 1);
    panels[next].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'});
}, {passive: true});

// Enhance buttons that should have ripple
document.querySelectorAll('button, .btn, .phone-mockup').forEach(el => {
    // add the class where appropriate
    if (el.closest('header') || el.classList.contains('phone-mockup')) {
        el.classList.add('btn-ripple');
    }
});
attachRipple();

// Apply tilt to phone mockups and interactive UI pieces
document.querySelectorAll('.phone-mockup, #mobile-app-icon, .profile-stat, .phone-screen').forEach(addTiltEffect);

// Respect reduced motion on GSAP animations as well
if (prefersReduced) {
    ScrollTrigger.getAll().forEach(st => st.disable());
}

// Fetch top player from leaderboard (Firestore REST) and show in profile-card
function formatXP(n) {
    if (!n) return '0';
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
    return String(n);
}

function getThemeColor(theme) {
    const map = { indigo: '#6366F1', blue: '#3B82F6', pink: '#EC4899', orange: '#FB923C', green: '#10B981', yellow: '#F59E0B' };
    return map[theme] || (typeof theme === 'string' ? theme : '#64748b');
}

async function fetchTopPlayerAndUpdateProfile() {
    const card = document.getElementById('profile-card');
    if (!card) return;
    const apiKey = 'AIzaSyDngsg2NCTveN71acJ4VGDmvsSSPFuvsAM';
    const projectId = 'lovebuilder-87763';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
    const body = {
        structuredQuery: {
            from: [{ collectionId: 'users' }],
            orderBy: [{ field: { fieldPath: 'xp' }, direction: 'DESCENDING' }],
            limit: 1
        }
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;
        const doc = data.find(r => r.document && r.document.fields);
        if (!doc) return;
        const f = doc.document.fields || {};

        const name = f.displayName?.stringValue || f.name?.stringValue || '—';
        const avatar = f.photoURL?.stringValue || f.avatar?.stringValue || '';
        const xpVal = parseInt(f.xp?.integerValue || f.points?.integerValue || f.score?.integerValue || '0', 10) || 0;

        // additional fields (defaults applied)
        const profileTheme = f.profileTheme?.stringValue || 'indigo';
        const streakVal = parseInt(f.streak?.integerValue || f.streak?.doubleValue || '65', 10) || 65;
        const bio = f.bio?.stringValue || '';
        const coverColor = f.coverColor?.stringValue || '';
        const coverImage = f.coverImage?.stringValue || '';
        const createdRaw = f.createdAt?.timestampValue || f.createdAt?.stringValue || null;
        const createdAt = createdRaw ? new Date(createdRaw) : null;

        const avatarEl = document.getElementById('profileAvatar');
        const nameEl = document.getElementById('profileName');
        const rankEl = document.getElementById('profileRank');
        const bioEl = document.getElementById('profileBio');
        const streakEl = document.getElementById('stat-streak');
        const themeEl = document.getElementById('profileTheme');
        const coverEl = document.getElementById('profileCover');
        const createdEl = document.getElementById('profileCreatedAt');
        const noteEl = document.getElementById('profileNote');

        if (avatarEl) avatarEl.src = avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`;
        if (nameEl) nameEl.textContent = name;
        if (rankEl) rankEl.textContent = `#1 — ${formatXP(xpVal)} na Bahia`;
        if (bioEl) bioEl.textContent = bio || '"Evolua seu personagem enquanto evolui sua mente."';
        if (streakEl) streakEl.textContent = streakVal;
        if (themeEl) { themeEl.textContent = profileTheme; themeEl.style.background = getThemeColor(profileTheme); themeEl.style.color = '#fff'; }

        if (coverEl) {
            if (coverImage) {
                coverEl.style.backgroundImage = `url(${coverImage})`;
                coverEl.style.backgroundSize = 'cover';
                coverEl.style.backgroundPosition = 'center';
            } else if (coverColor) {
                coverEl.style.background = coverColor;
            } else {
                coverEl.style.background = 'linear-gradient(90deg,#0b1220,#111827)';
            }
        }

        if (createdEl) {
            createdEl.textContent = createdAt ? `Membro desde ${createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}` : '';
        }

        if (noteEl) noteEl.textContent = 'Este card mostra quem está em 1º lugar no ranking global.';

        // small visual accent on avatar using theme color
        if (avatarEl) avatarEl.style.boxShadow = `0 0 0 6px ${getThemeColor(profileTheme)}33`;

        // ensure clicking the card links to leaderboard top
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => { window.location.href = 'ranking.html#stand-1'; });

    } catch (err) {
        console.warn('fetchTopPlayer failed:', err);
    }
}

// run on load
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fetchTopPlayerAndUpdateProfile();
} else {
    window.addEventListener('DOMContentLoaded', fetchTopPlayerAndUpdateProfile);
}
