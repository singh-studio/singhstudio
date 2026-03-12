gsap.registerPlugin(ScrollTrigger);

// 1. Initialize Lenis Smooth Scroll
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// 2. Custom Cursor
const cursor = document.querySelector('.cursor-follower');
document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.3 });
});

// 3. Hero Entrance Reveal
const heroTl = gsap.timeline();
heroTl.from(".hero__title", {
    y: 150,
    skewY: 7,
    duration: 1.5,
    ease: "power4.out"
})
.from(".hero__sub", { opacity: 0, y: 20, duration: 1 }, "-=0.5");

// 4. Horizontal Scroll Portfolio
const strip = document.querySelector(".project-strip");
gsap.to(strip, {
    x: () => -(strip.scrollWidth - window.innerWidth),
    ease: "none",
    scrollTrigger: {
        trigger: ".work-horizontal",
        pin: true,
        scrub: 1,
        end: () => "+=" + strip.scrollWidth,
        invalidateOnRefresh: true
    }
});

// 5. Service Image Float
const serviceRows = document.querySelectorAll('.service-row');
const floatImg = document.querySelector('.service-float-img');

serviceRows.forEach(row => {
    row.addEventListener('mouseenter', () => {
        const imgUrl = row.dataset.img;
        floatImg.style.backgroundImage = `url(${imgUrl})`;
        gsap.to(floatImg, { opacity: 1, scale: 1, duration: 0.3 });
    });
    row.addEventListener('mouseleave', () => {
        gsap.to(floatImg, { opacity: 0, scale: 0.8, duration: 0.3 });
    });
    row.addEventListener('mousemove', (e) => {
        gsap.to(floatImg, { 
            x: e.clientX + 20, 
            y: e.clientY - 200, 
            duration: 0.6, 
            ease: "power2.out" 
        });
    });
});

// 6. Text Reveal on Scroll
const revealTexts = document.querySelectorAll('.reveal-text');
revealTexts.forEach(text => {
    gsap.from(text, {
        scrollTrigger: {
            trigger: text,
            start: "top 80%"
        },
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power3.out"
    });
});

// NEW: Magnetic Menu & Active State Scroll Spy
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    // Magnetic effect
    item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
        gsap.to(item, { x, y, duration: 0.3 });
    });
    item.addEventListener('mouseleave', () => {
        gsap.to(item, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.3)" });
    });

    // Smooth scroll to section
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('href');
        lenis.scrollTo(targetId);
    });
});

// Update active nav based on scroll position
const sections = document.querySelectorAll('section, footer');
window.addEventListener('scroll', () => {
    let current = "";
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 300) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${current}`) {
            item.classList.add('active');
        }
    });
});
