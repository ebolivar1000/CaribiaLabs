/**
 * CaribIA Labs - Motion Engine V2.0
 * Implementation of the 6 Motion & Visual Pillars:
 * 1. React Bits (Kinetic Typography & Shimmer Triggers)
 * 2. Aceternity UI (Spotlight Mouse Tracking & 3D Tilt with Spring Physics)
 * 3. Cosmos (Editorial Palette & Depth Calibration)
 * 4. MotionSites (Intersection Observer Staggered Reveals)
 * 5. Eyecannndy (Cinematic Parallax & Glow Layering)
 * 6. Figma for Motion (Physics-based Spring Easing Curves)
 */

(function () {
  'use strict';

  // 1. Aceternity UI: Spotlight Card Coordinates Tracking
  function initSpotlightCards() {
    const cards = document.querySelectorAll('.spotlight-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // 2. Aceternity UI & Figma for Motion: 3D Tilt with Spring Return
  function initCard3DTilt() {
    // Only apply on non-touch devices with pointer precision
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cards3D = document.querySelectorAll('.card-3d');
    cards3D.forEach((card) => {
      let isHovered = false;

      card.addEventListener('mouseenter', () => {
        isHovered = true;
      });

      card.addEventListener('mousemove', (e) => {
        if (!isHovered) return;
        const rect = card.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left - width / 2;
        const mouseY = e.clientY - rect.top - height / 2;

        // Subtle tilt angles (max +/- 6 deg)
        const rotateX = (-mouseY / (height / 2)) * 6;
        const rotateY = (mouseX / (width / 2)) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        isHovered = false;
        // Spring physics return
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  // 3. MotionSites: Staggered Scroll Entrances via IntersectionObserver
  function initScrollReveals() {
    const revealElements = document.querySelectorAll('.motion-reveal');
    if (!revealElements.length) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.12
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach((el) => revealObserver.observe(el));
  }

  // 4. Eyecannndy & Cosmos: Ambient Cursor Follower / Subtle Parallax
  function initAmbientAurora() {
    const blobs = document.querySelectorAll('.aurora-blob');
    if (!blobs.length || window.matchMedia('(pointer: coarse)').matches) return;

    let ticking = false;
    window.addEventListener('mousemove', (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const moveX = (e.clientX / window.innerWidth - 0.5) * 40;
          const moveY = (e.clientY / window.innerHeight - 0.5) * 40;

          blobs.forEach((blob, idx) => {
            const factor = (idx + 1) * 0.4;
            blob.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // 5. MotionSites: Horizontal Drag to Scroll for Desktop
  function initHorizontalDragScroll() {
    const reels = document.querySelectorAll('.horizontal-reel-container');
    reels.forEach((slider) => {
      let isDown = false;
      let startX;
      let scrollLeft;

      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.style.cursor = 'grabbing';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });

      slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'grab';
      });

      slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'grab';
      });

      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.6; // Scroll multiplier
        slider.scrollLeft = scrollLeft - walk;
      });
      slider.style.cursor = 'grab';
    });
  }

  // Initialize all motion modules when DOM is ready
  function initAll() {
    initSpotlightCards();
    initCard3DTilt();
    initScrollReveals();
    initAmbientAurora();
    initHorizontalDragScroll();
  }

  // Expose global refresh function for dynamic AJAX/DOM rerenders
  window.refreshMotion = initAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();

