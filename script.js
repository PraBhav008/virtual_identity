(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (prefersReducedMotion) {
    document.documentElement.classList.remove('js-anim', 'css-anim');
    return;
  }

  // Fall back to pure CSS animations if GSAP CDN failed to load
  if (typeof window.gsap === 'undefined') {
    document.documentElement.classList.remove('js-anim');
    document.documentElement.classList.add('css-anim');
    return;
  }

  const { gsap } = window;
  gsap.ticker.lagSmoothing(0);

  const MAX_TILT_DEG = 3.0;
  let signatureTl = null;
  let perimeterLoop = null;
  let perimeterPulse = null;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const playSignatureDraw = (strokes) => {
    if (!strokes.length) return null;
    if (signatureTl) signatureTl.kill();

    gsap.set(strokes, {
      strokeDasharray: 100,
      strokeDashoffset: 100,
    });

    signatureTl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    signatureTl
      .to(strokes[0], { strokeDashoffset: 0, duration: 0.95 })
      .to(strokes[1], { strokeDashoffset: 0, duration: 0.45 }, '-=0.14')
      .to(strokes[2], { strokeDashoffset: 0, duration: 0.14 }, '-=0.04');

    return signatureTl;
  };

  const startPerimeterChase = (frameRect) => {
    if (!frameRect) return;
    if (perimeterLoop) perimeterLoop.kill();

    gsap.set(frameRect, {
      strokeDasharray: '28 72',
      strokeDashoffset: 0,
      opacity: 0.92,
    });

    perimeterLoop = gsap.to(frameRect, {
      strokeDashoffset: -100,
      duration: 7.5,
      repeat: -1,
      ease: 'none',
    });
  };

  const playPerimeterClickTrace = (frameRect) => {
    if (!frameRect) return;
    if (perimeterLoop) perimeterLoop.kill();
    if (perimeterPulse) perimeterPulse.kill();

    gsap.set(frameRect, {
      strokeDasharray: 100,
      strokeDashoffset: 100,
      opacity: 1,
    });

    perimeterPulse = gsap.timeline({
      onComplete: () => startPerimeterChase(frameRect),
    });

    perimeterPulse
      .to(frameRect, {
        strokeDashoffset: 0,
        duration: 0.85,
        ease: 'power2.inOut',
      })
      .to(frameRect, {
        strokeDasharray: '28 72',
        duration: 0.45,
        ease: 'power2.out',
      });
  };

  const initEntranceTimeline = () => {
    const chars = gsap.utils.toArray('.char');
    const strokes = gsap.utils.toArray('.sig-stroke');
    const footerItems = gsap.utils.toArray('.icon-link, .editorial-link, .cta-pill');
    const frameRect = document.querySelector('.logo-frame-rect');

    gsap.set(strokes, { strokeDasharray: 100, strokeDashoffset: 100 });
    gsap.set(chars, { yPercent: 105, opacity: 0 });
    gsap.set('.logo-clip', { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set('.logo-img', { yPercent: -6, scale: 1.02 });
    gsap.set('#bioBlock', { y: 12, opacity: 0 });
    gsap.set(footerItems, { y: 14, opacity: 0 });

    if (frameRect) {
      gsap.set(frameRect, {
        strokeDasharray: '28 72',
        strokeDashoffset: 28,
        opacity: 0,
      });
    }

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // 1–2. White canvas -> Smooth logo mask reveal
    tl.to('.logo-clip', {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 0.9,
      ease: 'power4.inOut',
    }, 0.1)
      .to('.logo-img', {
        scale: 0.94,
        duration: 1.1,
        ease: 'power3.out',
      }, 0.1)

      // Continuous thin red perimeter tracing begins gracefully
      .to(frameRect, {
        opacity: 0.92,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => startPerimeterChase(frameRect),
      }, 0.55)

      // 3. Staggered RAIS Studios typography reveal
      .to(chars, {
        yPercent: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.032,
      }, 0.3)

      // 4. Red handwritten signature draws smoothly and remains visible
      .add(() => {
        playSignatureDraw(strokes);
      }, 0.68)

      // 5. Description fades in + grey marquees emerge quietly
      .to('#bioBlock', {
        y: 0,
        opacity: 1,
        duration: 0.68,
        ease: 'power3.out',
      }, 1.0)
      .to('.bg-marquee-layer', {
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
      }, 0.85)

      // 6. Contact icons & CTAs rise cleanly
      .to(footerItems, {
        y: 0,
        opacity: 1,
        duration: 0.62,
        stagger: 0.055,
        ease: 'power3.out',
        clearProps: 'transform',
      }, 1.14);

    return strokes;
  };

  const initAmbientDetails = () => {
    gsap.to('.accent-dot', {
      scale: 0.6,
      opacity: 0.45,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.timeline({ repeat: -1, repeatDelay: 2.6 })
      .to('.accent-cross', {
        rotation: '+=90',
        duration: 0.75,
        ease: 'power3.inOut',
      });
  };

  const initDesktopLogo3D = () => {
    // Strictly disabled on touch / mobile devices
    if (!hasFinePointer) return;

    const hero = document.getElementById('hero');
    const logoPlate = document.getElementById('logoPlate');
    const logoSheen = document.getElementById('logoSheen');
    if (!hero || !logoPlate) return;

    // Smooth ~3deg 3D tilt on logo container only
    const tiltX = gsap.quickTo(logoPlate, 'rotationX', { duration: 0.65, ease: 'power3.out' });
    const tiltY = gsap.quickTo(logoPlate, 'rotationY', { duration: 0.65, ease: 'power3.out' });

    hero.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      tiltX(clamp(-ny * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG));
      tiltY(clamp(nx * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG));

      if (logoSheen) {
        const plateRect = logoPlate.getBoundingClientRect();
        const sheenX = ((event.clientX - plateRect.left) / plateRect.width) * 100;
        const sheenY = ((event.clientY - plateRect.top) / plateRect.height) * 100;
        logoPlate.style.setProperty('--sheen-x', `${clamp(sheenX, 0, 100).toFixed(1)}%`);
        logoPlate.style.setProperty('--sheen-y', `${clamp(sheenY, 0, 100).toFixed(1)}%`);
        logoSheen.style.opacity = '1';
      }
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      tiltX(0);
      tiltY(0);
      if (logoSheen) logoSheen.style.opacity = '0';
    });
  };

  const initMagneticCTA = () => {
    if (!hasFinePointer) return;
    const cta = document.getElementById('ctaConnect');
    if (!cta) return;

    const moveX = gsap.quickTo(cta, 'x', { duration: 0.35, ease: 'power3.out' });
    const moveY = gsap.quickTo(cta, 'y', { duration: 0.35, ease: 'power3.out' });

    cta.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = cta.getBoundingClientRect();
      const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      moveX(clamp(offsetX * 5, -5, 5));
      moveY(clamp(offsetY * 3, -3, 3));
    }, { passive: true });

    cta.addEventListener('pointerleave', () => {
      moveX(0);
      moveY(0);
    });
  };

  const initRestrainedScrollDepth = () => {
    const title = document.querySelector('.studio-title');
    if (!title) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const shift = clamp(window.scrollY * -0.05, -8, 8);
        gsap.set(title, { y: shift });
        ticking = false;
      });
    }, { passive: true });
  };

  const initTapInteraction = (strokes) => {
    const logoTiltWrap = document.getElementById('logoTiltWrap');
    const logoPlate = document.getElementById('logoPlate');
    const frameRect = document.querySelector('.logo-frame-rect');
    if (!logoTiltWrap || !logoPlate) return;

    const triggerReplay = () => {
      gsap.fromTo(
        logoPlate,
        { scale: 0.97 },
        { scale: 1, duration: 0.45, ease: 'back.out(2)', overwrite: 'auto' }
      );
      playPerimeterClickTrace(frameRect);
      playSignatureDraw(strokes);
    };

    logoTiltWrap.addEventListener('click', triggerReplay);
    logoTiltWrap.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        triggerReplay();
      }
    });
  };

  const strokes = document.documentElement.classList.contains('css-anim')
    ? gsap.utils.toArray('.sig-stroke')
    : initEntranceTimeline();
  if (document.documentElement.classList.contains('css-anim')) {
    startPerimeterChase(document.querySelector('.logo-frame-rect'));
  }
  initAmbientDetails();
  initDesktopLogo3D();
  initMagneticCTA();
  initRestrainedScrollDepth();
  initTapInteraction(strokes);
})();
