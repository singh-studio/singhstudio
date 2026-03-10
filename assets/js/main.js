// 1. Initialize Lenis (Smooth Scroll)
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothTouch: false, // Prevents "stuck" feeling on mobile touch
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// 2. Integration: Tell ScrollTrigger to use Lenis's scroll position
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// 3. Navigation Border Logic
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

// 4. The Split-Screen Index Interaction
const indexItems = document.querySelectorAll('.index-item');
const canvasItems = document.querySelectorAll('.canvas-item');

if (indexItems.length > 0 && canvasItems.length > 0) {
    indexItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            indexItems.forEach(el => el.classList.remove('active'));
            canvasItems.forEach(el => {
                el.classList.remove('active');
                const video = el.querySelector('video');
                if (video) video.pause();
            });

            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            const targetCanvas = document.getElementById(targetId);
            
            if (targetCanvas) {
                targetCanvas.classList.add('active');
                const video = targetCanvas.querySelector('video');
                if (video) video.play();
            }
        });
    });
}

// 5. Initialize GSAP ScrollTriggers
document.addEventListener("DOMContentLoaded", () => {
    
    // Refresh ScrollTrigger to ensure it catches the correct height after Lenis init
    ScrollTrigger.refresh();

    // Staggered Fade-Ups
    document.querySelectorAll('.gsap-reveal').forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: "power3.out",
              scrollTrigger: { 
                  trigger: el, 
                  start: "top 85%",
                  markers: false // Set to true if you need to debug positions
              }
            }
        );
    });

    // Handle Window Resizes to prevent "Ghost" scroll height
    window.addEventListener('resize', () => {
        ScrollTrigger.refresh();
    });
});
