// 1. Smooth Scroll (Lenis)
const lenis = new Lenis();
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// 2. GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// Hero Entrance
const tl = gsap.timeline();
tl.from(".hero__title", { y: 60, opacity: 0, duration: 1.2, ease: "power4.out", delay: 0.5 })
  .from(".overline", { opacity: 0, y: 20, duration: 0.8 }, "-=0.8")
  .from(".hero__footer", { opacity: 0, y: 20, duration: 0.8 }, "-=0.5");

// Fade-in Elements
document.querySelectorAll('.section-title, .lead, .project-card').forEach(el => {
    gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 85%" },
        opacity: 0, y: 40, duration: 1, ease: "power3.out"
    });
});

// 3. Magnetic Menu Items
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
        gsap.to(item, { x, y, duration: 0.3 });
    });
    item.addEventListener('mouseleave', () => {
        gsap.to(item, { x: 0, y: 0, duration: 0.5, ease: "power2.out" });
    });
});

// Update active state on scroll
window.addEventListener('scroll', () => {
    let current = "";
    document.querySelectorAll('section, header').forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) current = section.getAttribute('id');
    });
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${current}`) item.classList.add('active');
    });
});
