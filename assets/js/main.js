document.addEventListener("DOMContentLoaded", () => {
    
    // The "Highful" Text Reveal (A bit faster and snappier)
    gsap.utils.toArray('.gsap-reveal').forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 60 },
            { 
                opacity: 1, y: 0, 
                duration: 1.4, 
                ease: "expo.out", // This creates that snappy, premium feel
                scrollTrigger: {
                    trigger: el,
                    start: "top 92%",
                }
            }
        );
    });

    // Simple Parallax for images
    gsap.utils.toArray('.reveal-img-container img').forEach(img => {
        gsap.to(img, {
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
                trigger: img,
                scrub: true
            }
        });
    });
});
