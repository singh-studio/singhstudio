gsap.registerPlugin(ScrollTrigger);

// 1. Structural Navigation (Crisp border on scroll)
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) { nav.classList.add('scrolled'); } 
    else { nav.classList.remove('scrolled'); }
});

// 2. Joyful Interactions: Magnetic Buttons & Cursor
const cursor = document.querySelector('.cursor');
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (!isTouchDevice && cursor) {
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.15, ease: "power2.out" });
    });
    
    document.querySelectorAll('a, button, .hover-target').forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });

    // Magnetic pull effect
    document.querySelectorAll('.magnetic-wrap').forEach(el => {
        el.addEventListener('mousemove', function(e) {
            const pos = this.getBoundingClientRect();
            const mx = e.clientX - pos.left - pos.width/2;
            const my = e.clientY - pos.top - pos.height/2;
            gsap.to(this, { x: mx * 0.3, y: my * 0.3, duration: 0.5, ease: "power2.out" });
        });
        el.addEventListener('mouseleave', function() {
            gsap.to(this, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        });
    });
}

// 3. Smooth Scrolling (Lenis)
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// 4. Smooth Fade-Up Animations
document.addEventListener("DOMContentLoaded", () => {
    
    document.querySelectorAll('.gsap-reveal').forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 85%" }
            }
        );
    });

    document.querySelectorAll('.gsap-parallax').forEach(img => {
        gsap.to(img, {
            yPercent: 15, ease: "none",
            scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
        });
    });

    // Horizontal Scroll (Desktop only)
    const horizontalSection = document.querySelector('.horizontal-wrap');
    if(horizontalSection && window.innerWidth > 768) {
        let scrollWidth = horizontalSection.scrollWidth - window.innerWidth;
        gsap.to(horizontalSection, {
            x: -scrollWidth, ease: "none",
            scrollTrigger: {
                trigger: ".horizontal-container", pin: true, scrub: 1,
                start: "center center", end: () => "+=" + scrollWidth
            }
        });
    }
});
