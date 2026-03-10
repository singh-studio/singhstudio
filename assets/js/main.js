gsap.registerPlugin(ScrollTrigger);

// 1. Smooth Scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
});
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// 2. Swup Page Transitions
const swup = new Swup({
    animationSelector: '[class*="transition-"]',
    containers: ['#swup-main']
});

// 3. Animation Logic
function initAnimations() {
    // Reveal Text
    const revealText = document.querySelectorAll('.reveal-text');
    if(revealText.length > 0) {
        gsap.fromTo(revealText, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: "power4.out", delay: 0.1 }
        );
    }

    // Parallax Images
    const parallaxImages = document.querySelectorAll('[data-parallax]');
    parallaxImages.forEach((img) => {
        gsap.to(img, {
            scrollTrigger: {
                trigger: img.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            },
            y: "15%",
            scale: 1.1,
            ease: "none"
        });
    });

    ScrollTrigger.refresh();
}

// Run on first load & after every page transition
document.addEventListener("DOMContentLoaded", initAnimations);
swup.hooks.on('page:view', () => {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill()); // Kill old triggers so they don't break
    initAnimations();
});
