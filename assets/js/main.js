gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ duration: 1.2 });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// Accordion Logic
document.querySelectorAll('.accordion-item').forEach(item => {
    item.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.accordion-item').forEach(el => el.classList.remove('active'));
        if (!isActive) item.classList.add('active');
        setTimeout(() => ScrollTrigger.refresh(), 500); // Recalculate sticky positions
    });
});

document.addEventListener("DOMContentLoaded", () => {
    // Reveal Animations
    gsap.utils.toArray('.gsap-reveal').forEach(el => {
        gsap.fromTo(el, { opacity: 0, y: 30 }, { 
            opacity: 1, y: 0, duration: 1, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%" }
        });
    });
});
