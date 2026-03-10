gsap.registerPlugin(ScrollTrigger);

// 1. Custom Cursor & Media Reveal Logic
const cursor = document.querySelector('.cursor');
const mediaReveal = document.querySelector('.media-reveal');
const disciplineItems = document.querySelectorAll('.discipline-item');
const mediaItems = document.querySelectorAll('.media-reveal img, .media-reveal video');

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

if (!isTouchDevice && cursor) {
    // Fast cursor follow
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
        gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.1, ease: "power2.out" });
        
        // Slower, delayed follow for the massive media reveal (creates fluid drag effect)
        if(mediaReveal.classList.contains('active')) {
            gsap.to(mediaReveal, { x: mouseX, y: mouseY, duration: 0.6, ease: "power3.out" });
        }
    });

    // Hover logic for disciplines
    disciplineItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            cursor.style.opacity = '0'; // Hide small dot
            mediaReveal.classList.add('active'); // Show massive media
            
            // Show the specific image/video based on data-target
            const targetId = item.getAttribute('data-target');
            mediaItems.forEach(media => media.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
            
            // If it's a video, play it
            const targetVideo = document.getElementById(targetId);
            if(targetVideo.tagName === 'VIDEO') targetVideo.play();
        });
        
        item.addEventListener('mouseleave', () => {
            cursor.style.opacity = '1';
            mediaReveal.classList.remove('active');
            
            const targetId = item.getAttribute('data-target');
            const targetVideo = document.getElementById(targetId);
            if(targetVideo.tagName === 'VIDEO') targetVideo.pause();
        });
    });
}

// 2. Smooth Scrolling
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });

// 3. Audio Toggle (For the Music Producer)
const audioBtn = document.querySelector('.audio-btn');
const bgAudio = new Audio('path/to/your/ambient-track.mp3'); // REPLACE THIS
bgAudio.loop = true;

if(audioBtn) {
    audioBtn.addEventListener('click', () => {
        if(bgAudio.paused) {
            bgAudio.play();
            audioBtn.textContent = 'SOUND: ON';
        } else {
            bgAudio.pause();
            audioBtn.textContent = 'SOUND: OFF';
        }
    });
}
