gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ duration: 1.2 });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// Navigation Scroll State
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

// Accordion (FAQ) Toggle
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
        const parent = trigger.parentElement;
        const isActive = parent.classList.contains('active');
        document.querySelectorAll('.accordion-item').forEach(item => item.classList.remove('active'));
        if (!isActive) parent.classList.add('active');
        setTimeout(() => ScrollTrigger.refresh(), 600);
    });
});

// Animations
document.addEventListener("DOMContentLoaded", () => {
    gsap.utils.toArray('.gsap-reveal').forEach(el => {
        gsap.fromTo(el, { opacity: 0, y: 30 }, { 
            opacity: 1, y: 0, duration: 1.2, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 90%" }
        });
    });
});
