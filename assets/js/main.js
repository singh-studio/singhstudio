gsap.registerPlugin(ScrollTrigger);

// 1. Lenis
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// 2. Navigation
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.style.padding = "1rem 4vw";
    else nav.style.padding = "1.5rem 4vw";
});

// 3. Reveal
document.addEventListener("DOMContentLoaded", () => {
    ScrollTrigger.refresh();

    gsap.utils.toArray('.gsap-reveal').forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 40 },
            { 
                opacity: 1, y: 0, duration: 1, ease: "power3.out",
                scrollTrigger: { trigger: el, start: "top 90%" }
            }
        );
    });
});
