gsap.registerPlugin(ScrollTrigger);

// 1. Lenis Initialization
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

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// 2. Navigation
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

// 3. Highful-Style Reveal
document.addEventListener("DOMContentLoaded", () => {
    // Refresh ScrollTrigger to catch pinned heights
    ScrollTrigger.refresh();

    // Text Reveal
    gsap.utils.toArray('.gsap-reveal').forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 50 },
            { 
                opacity: 1, y: 0, duration: 1, ease: "expo.out",
                scrollTrigger: { trigger: el, start: "top 90%" }
            }
        );
    });

    // Image Parallax
    gsap.utils.toArray('.img-reveal-wrap img').forEach(img => {
        gsap.to(img, {
            yPercent: 15, ease: "none",
            scrollTrigger: { trigger: img, scrub: true }
        });
    });
});
