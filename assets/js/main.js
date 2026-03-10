// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis Smooth Scrolling
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

// Initialize Swup for Page Transitions
const swup = new Swup({
    animationSelector: '[class*="transition-"]',
    containers: ['#swup-main'] // Only update content inside this ID
});

// Master Animation Function
function initAnimations() {
    // Reveal lines of text (Basic staggered fade-up for now, easily upgraded to SplitText later)
    const revealText = document.querySelectorAll('.reveal-text');
    if(revealText.length > 0) {
        gsap.fromTo(revealText, 
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: "power4.out", delay: 0.2 }
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

    // Refresh ScrollTrigger after DOM changes
    ScrollTrigger.refresh();
}

// Run animations on first load
document.addEventListener("DOMContentLoaded", initAnimations);

// Re-run animations every time Swup loads a new page
swup.hooks.on('page:view', () => {
    window.scrollTo(0, 0);
    ScrollTrigger.getAll().forEach(t => t.kill()); // Clean up old triggers
    initAnimations();
});
