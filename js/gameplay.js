/* js/gameplay.js — extraído de gameplay.html */
gsap.registerPlugin(ScrollTrigger);

// Header Entrance
gsap.from("header", {
    y: 50, opacity: 0, duration: 1, ease: "power3.out"
});

// Cards Staggered Entrance
gsap.from(".game-card", {
    scrollTrigger: {
        trigger: "header",
        start: "bottom 80%"
    },
    y: 100,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: "back.out(1.2)"
});

// Fill Bars Animation
gsap.utils.toArray('.stat-bar-fill').forEach(bar => {
    gsap.from(bar, {
        scrollTrigger: {
            trigger: bar,
            start: "top 95%" /* Mobile optimized trigger */
        },
        width: 0,
        duration: 1.5,
        ease: "power2.out"
    });
});

// Internal Parallax Effect on Cards
const cards = document.querySelectorAll('.game-card');
cards.forEach(card => {
    const bg = card.querySelector('.card-bg');
    gsap.to(bg, {
        y: -50, /* Move bg slightly up */
        ease: "none",
        scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });
});

// 3D Tilt Logic (Mouse only - disabled on touch via CSS hover states mostly, but JS handles mouse)
const tiltCards = document.querySelectorAll('[data-tilt]');
tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -5; // Subtle 5deg
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
});

// Magnetic Button Logic
const magneticBtns = document.querySelectorAll('.magnetic-btn');
magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
    });
});
