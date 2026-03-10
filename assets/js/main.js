// Initialize Lenis Smooth Scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Navigation Hide/Show on Scroll
let lastScrollY = window.scrollY;
const nav = document.querySelector('.nav');

lenis.on('scroll', (e) => {
    if (window.scrollY > 100) {
        if (window.scrollY > lastScrollY) {
            nav.classList.add('hidden'); // Scrolling down
        } else {
            nav.classList.remove('hidden'); // Scrolling up
        }
    } else {
        nav.classList.remove('hidden');
    }
    lastScrollY = window.scrollY;
});

// Mobile Menu Toggle
const menuBtn = document.querySelector('.menu-btn');
const menuOverlay = document.querySelector('.menu-overlay');
let menuOpen = false;

if(menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', () => {
        menuOpen = !menuOpen;
        if(menuOpen) {
            menuOverlay.classList.add('active');
            menuBtn.textContent = 'Close';
            lenis.stop(); // Prevent scrolling when menu is open
        } else {
            menuOverlay.classList.remove('active');
            menuBtn.textContent = 'Menu';
            lenis.start();
        }
    });
}