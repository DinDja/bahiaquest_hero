/* js/metodo.js — extraído de metodo.html */
gsap.registerPlugin(ScrollTrigger);

// 1. Header Parallax
gsap.to("#hero-title", {
    scrollTrigger: {
        trigger: "header",
        start: "top top",
        end: "bottom top",
        scrub: true
    },
    y: 50,
    opacity: 0.5
});

// 2. Blob Movement (Parallax)
gsap.to("#blob1", {
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 2
    },
    y: 300,
    x: 50
});

gsap.to("#blob2", {
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 2
    },
    y: -300,
    x: -50
});

// 3. Loop Rotation on Scroll (PINNED for 3 scrolls)
// We use a timeline to control both the pinning and the animation over that pinned duration
ScrollTrigger.create({
    trigger: "#loop-section",
    start: "center center",
    end: "+=3000", // Increased to 3000 for 3 full scrolls duration
    pin: true,
    pinSpacing: true, // Explicitly set spacing
    scrub: 1,
    anticipatePin: 1,
    animation: gsap.timeline()
        .to("#rotating-elements", { rotation: 360 * 3, ease: "none" }) // 3 full rotations
        .to("#rotating-elements > div", { rotation: -360 * 3, ease: "none" }, 0)
});

// 4. Cards Entrance
gsap.utils.toArray(".step-card").forEach((card, i) => {
    gsap.from(card, {
        scrollTrigger: { trigger: card, start: "top 90%" },
        y: 50, opacity: 0, duration: 0.8, delay: i * 0.15, ease: "back.out(1.2)"
    });
});

// 5. 3D Tilt Logic (Vanilla JS)
const tiltCards = document.querySelectorAll('[data-tilt]');

tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
});

// 6. Magnetic Button Logic
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
