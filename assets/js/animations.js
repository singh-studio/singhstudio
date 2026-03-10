// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Update ScrollTrigger with Lenis
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

document.addEventListener("DOMContentLoaded", (event) => {
    
    // 1. Reveal Elements (Fade Up)
    const revealElements = document.querySelectorAll('.gsap-reveal');
    revealElements.forEach((el) => {
        gsap.to(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // 2. Parallax Images
    const parallaxImages = document.querySelectorAll('.project-img');
    parallaxImages.forEach((img) => {
        gsap.to(img, {
            scrollTrigger: {
                trigger: img.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            },
            y: 30, // Move image down slightly as we scroll
            scale: 1.05,
            ease: "none"
        });
    });

    // 3. Hero Text Stagger (SplitText alternative using simple HTML structure or just fading lines)
    // To avoid needing GSAP SplitText (premium plugin), we animate elements with a specific class
    const heroLines = document.querySelectorAll('.hero-stagger');
    if(heroLines.length > 0) {
        gsap.fromTo(heroLines, 
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 1.2, stagger: 0.2, ease: "power4.out", delay: 0.2 }
        );
    }
});