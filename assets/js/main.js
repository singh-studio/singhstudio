gsap.registerPlugin(ScrollTrigger);

// 1. Custom Cursor
const cursor = document.querySelector('.cursor');
const interactiveElements = document.querySelectorAll('a, button, .work-item');

document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });
});

interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
});

// 2. Lenis Smooth Scroll
const lenis = new Lenis({
    duration: 1.5,
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

// 3. Hero Parallax Animations
gsap.to(".hero-img-overlay", {
    yPercent: -100, // Moves the image up over the text as you scroll
    ease: "none",
    scrollTrigger: {
        trigger: ".hero-wrapper",
        start: "top top",
        end: "bottom top",
        scrub: true
    }
});

gsap.to(".hero-text-move", {
    xPercent: -20, // Slowly moves the massive text left
    ease: "none",
    scrollTrigger: {
        trigger: ".hero-wrapper",
        start: "top top",
        end: "bottom top",
        scrub: true
    }
});

// 4. Horizontal Scroll Portfolio
const horizontalSection = document.querySelector('.horizontal-wrap');
if(horizontalSection) {
    // Calculate how far to scroll based on the width of the content
    let scrollWidth = horizontalSection.scrollWidth - window.innerWidth;
    
    gsap.to(horizontalSection, {
        x: -scrollWidth,
        ease: "none",
        scrollTrigger: {
            trigger: ".horizontal-container",
            pin: true,
            scrub: 1,
            start: "center center",
            end: () => "+=" + scrollWidth // Scroll distance matches width
        }
    });
}

// 5. Image Reveal (Clip Path)
const revealImages = document.querySelectorAll('.reveal-img');
revealImages.forEach(img => {
    gsap.fromTo(img, 
        { clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)", scale: 1.2 },
        { 
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", scale: 1, 
            duration: 1.5, ease: "power4.inOut",
            scrollTrigger: {
                trigger: img,
                start: "top 85%"
            }
        }
    );
});
