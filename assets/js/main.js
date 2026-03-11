gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis
const lenis = new Lenis({ duration: 1.2 });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// Nav Scroll Logic
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

// Refined Reveal Animation
document.addEventListener("DOMContentLoaded", () => {
    gsap.utils.toArray('.gsap-reveal').forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 30 },
            { 
                opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
                scrollTrigger: { trigger: el, start: "top 88%" }
            }
        );
    });
});
