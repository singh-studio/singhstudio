gsap.registerPlugin(ScrollTrigger);

// 1. Initialize Lenis (Smooth Scroll)
const lenis = new Lenis({ duration: 1.2, lerp: 0.1 });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

// 2. Magnetic Nav Items
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
        gsap.to(item, { x, y, duration: 0.3 });
    });
    item.addEventListener('mouseleave', () => {
        gsap.to(item, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
    });
});

// 3. Horizontal Scroll Implementation
const strip = document.querySelector(".project-strip");
if (strip) {
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
}

// 4. Hero Text Split Entrance
gsap.from(".hero__title span", {
    y: 100,
    opacity: 0,
    duration: 1.5,
    stagger: 0.2,
    ease: "power4.out"
});

// 5. Service Floating Image
const serviceRows = document.querySelectorAll('.service-row');
const floatImg = document.querySelector('.service-float-img');

serviceRows.forEach(row => {
    row.addEventListener('mouseenter', () => {
        floatImg.style.backgroundImage = `url(${row.dataset.img})`;
        gsap.to(floatImg, { opacity: 1, scale: 1, duration: 0.3 });
    });
    row.addEventListener('mouseleave', () => {
        gsap.to(floatImg, { opacity: 0, scale: 0.7, duration: 0.3 });
    });
    row.addEventListener('mousemove', (e) => {
        gsap.to(floatImg, { x: e.clientX + 20, y: e.clientY - 150, duration: 0.6 });
    });
});

// 6. Active Nav State on Scroll
const sections = document.querySelectorAll('section');
window.addEventListener('scroll', () => {
    let current = "";
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
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
