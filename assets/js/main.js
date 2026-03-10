gsap.registerPlugin(ScrollTrigger);

// 1. Structural Navigation Border
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
});

// 2. The Split-Screen Index Interaction
const indexItems = document.querySelectorAll('.index-item');
const canvasItems = document.querySelectorAll('.canvas-item');

if (indexItems.length > 0 && canvasItems.length > 0) {
    indexItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            // Remove active class from all
            indexItems.forEach(el => el.classList.remove('active'));
            canvasItems.forEach(el => {
                el.classList.remove('active');
                // Pause any playing videos
                const video = el.querySelector('video');
                if (video) video.pause();
            });

            // Add active class to hovered item
            item.classList.add('active');
            
            // Find and activate corresponding canvas item
            const targetId = item.getAttribute('data-target');
            const targetCanvas = document.getElementById(targetId);
            
            if (targetCanvas) {
                targetCanvas.classList.add('active');
                // Play video if it exists
                const video = targetCanvas.querySelector('video');
                if (video) video.play();
            }
        });
    });
}

// 3. Smooth Scrolling (Lenis)
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });

// 4. Staggered Fade-Ups
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.gsap-reveal').forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 85%" }
            }
        );
    });
});
