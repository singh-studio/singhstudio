// Initialize Smooth Scrolling (Lenis)
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// 1. Hero Reveal Animation
const tl = gsap.timeline();

tl.from(".hero__title", {
    y: 100,
    opacity: 0,
    duration: 1.2,
    ease: "power4.out",
    delay: 0.5
})
.from(".overline", {
    opacity: 0,
    y: 20,
    duration: 0.8
}, "-=0.8")
.from(".hero__footer", {
    opacity: 0,
    y: 20,
    duration: 0.8
}, "-=0.5");

// 2. Parallax Scrolling for Project Cards
document.querySelectorAll('.project-card').forEach(card => {
    const speed = card.dataset.speed || 0;
    
    gsap.to(card, {
        scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: true
        },
        y: (i, target) => -ScrollTrigger.maxScroll(window) * (speed / 10),
        ease: "none"
    });
});

// 3. Section Fade-In
const fadeElements = document.querySelectorAll('.section-title, .lead, .service-item');

fadeElements.forEach(el => {
    gsap.from(el, {
        scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none"
        },
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "power3.out"
    });
});

// 4. Navigation scroll effect
let lastScroll = 0;
window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;
    const nav = document.querySelector(".nav");
    
    if (currentScroll <= 0) {
        nav.style.boxShadow = "none";
        return;
    }
    
    if (currentScroll > lastScroll) {
        // Scrolling Down
        gsap.to(nav, { y: -100, duration: 0.3 });
    } else {
        // Scrolling Up
        gsap.to(nav, { y: 0, duration: 0.3, backgroundColor: "rgba(13, 13, 13, 0.8)", backdropFilter: "blur(10px)" });
    }
    lastScroll = currentScroll;
});

// Smooth scroll for nav links
document.querySelectorAll('.nav__link, .btn').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            lenis.scrollTo(href);
        }
    });
});
