(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (prefersReducedMotion) {
    document.documentElement.classList.remove('js-anim', 'css-anim');
  }

  const form = document.getElementById('connectForm');
  const formCard = document.getElementById('formCard');
  const frameRect = document.querySelector('.form-frame-rect');
  const entryState = document.getElementById('formEntryState');
  const successState = document.getElementById('formSuccessState');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetFormBtn');

  // Service tag selection sync
  const serviceTags = document.querySelectorAll('.service-tag');
  serviceTags.forEach((tag) => {
    const radio = tag.querySelector('input[type="radio"]');
    if (!radio) return;

    tag.addEventListener('click', () => {
      serviceTags.forEach((t) => t.classList.remove('is-active'));
      tag.classList.add('is-active');
      radio.checked = true;
    });

    radio.addEventListener('change', () => {
      if (radio.checked) {
        serviceTags.forEach((t) => t.classList.remove('is-active'));
        tag.classList.add('is-active');
      }
    });
  });

  // Perimeter chase animation
  let perimeterLoop = null;
  const startPerimeterChase = () => {
    if (!frameRect || typeof window.gsap === 'undefined' || prefersReducedMotion) return;
    if (perimeterLoop) perimeterLoop.kill();

    window.gsap.set(frameRect, {
      strokeDasharray: '24 76',
      strokeDashoffset: 0,
      opacity: 0.92,
    });

    perimeterLoop = window.gsap.to(frameRect, {
      strokeDashoffset: -100,
      duration: 8.5,
      repeat: -1,
      ease: 'none',
    });
  };

  // Entrance timeline
  const initEntrance = () => {
    if (typeof window.gsap === 'undefined' || prefersReducedMotion) {
      document.documentElement.classList.remove('js-anim');
      document.documentElement.classList.add('css-anim');
      return;
    }

    const { gsap } = window;
    gsap.ticker.lagSmoothing(0);

    const header = document.querySelector('.connect-header');
    const fields = gsap.utils.toArray('.form-field, .form-actions');
    const headerTexts = gsap.utils.toArray('.form-header .form-eyebrow, .form-header .form-title');

    gsap.set([header, formCard, ...headerTexts, ...fields], { opacity: 0 });
    gsap.set(formCard, { y: 24, scale: 0.985 });
    gsap.set(fields, { y: 14 });
    gsap.set(headerTexts, { y: 12 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to(header, { opacity: 1, duration: 0.6 }, 0.1)
      .to(formCard, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.85,
        ease: 'power4.out',
        onComplete: startPerimeterChase,
      }, 0.2)
      .to(headerTexts, {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.08,
      }, 0.45)
      .to(fields, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.045,
        clearProps: 'transform',
      }, 0.65)
      .to('#submitBtn', {
        opacity: 1,
        duration: 0.4,
        clearProps: 'opacity,visibility',
      }, 0.75)
      .to('.bg-marquee-layer', { opacity: 1, duration: 0.8 }, 0.3);

    // Ambient accents
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

  // Field error helpers
  const setError = (id, message) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    const input = el.previousElementSibling;
    if (input && input.tagName) {
      input.classList.toggle('has-error', Boolean(message));
    }
  };

  const clearErrors = () => {
    ['errClientName', 'errBusinessName', 'errPhone', 'errEmail'].forEach((id) => {
      setError(id, '');
    });
  };

  // Live input error clearing
  ['clientName', 'businessName', 'phone', 'email'].forEach((fieldId) => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.addEventListener('input', () => {
      const errMap = {
        clientName: 'errClientName',
        businessName: 'errBusinessName',
        phone: 'errPhone',
        email: 'errEmail',
      };
      setError(errMap[fieldId], '');
    });
  });

  // Validation
  const validateForm = () => {
    clearErrors();
    let isValid = true;

    const clientName = form.clientName.value.trim();
    const businessName = form.businessName.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();

    if (!clientName || clientName.length < 2) {
      setError('errClientName', 'Please enter your name.');
      isValid = false;
    }

    if (!businessName || businessName.length < 2) {
      setError('errBusinessName', 'Please enter your business or company name.');
      isValid = false;
    }

    // Phone / WhatsApp validation: at least 6 digits
    const digitsOnly = phone.replace(/\D/g, '');
    if (!phone || digitsOnly.length < 6) {
      setError('errPhone', 'Please enter a valid phone or WhatsApp number.');
      isValid = false;
    }

    // Email is optional, but if provided, validate format
    if (email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        setError('errEmail', 'Please enter a valid email address or leave blank.');
        isValid = false;
      }
    }

    return isValid;
  };

  // Form submission handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        const firstErrorInput = form.querySelector('.has-error');
        if (firstErrorInput) firstErrorInput.focus();
        return;
      }

      // Collect inquiry payload with dual aliases so it works with any dashboard format
      const selectedRadio = form.querySelector('input[name="service"]:checked');
      const service = selectedRadio ? selectedRadio.value : 'Web Development';
      const cName = form.clientName.value.trim();
      const bName = form.businessName.value.trim();
      const pNumber = form.phone.value.trim();
      const eMail = form.email.value.trim() || '';
      const pDetails = form.projectDetails.value.trim() || '';
      const now = new Date();

      const inquiry = {
        id: 'client_' + now.getTime().toString(36) + Math.random().toString(36).substring(2, 6),
        timestamp: now.toISOString(),
        createdAt: now.toISOString(),
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),

        // Universal aliases: works whether dashboard expects 'name', 'clientName', etc.
        name: cName,
        clientName: cName,

        business: bName,
        businessName: bName,
        company: bName,

        phone: pNumber,
        contact: pNumber,

        email: eMail,
        service: service,

        notes: pDetails,
        projectDetails: pDetails,
        message: pDetails,

        status: 'Lead',
        stage: 'Lead',
        value: 0,
        source: 'Website Card Form',
      };

      // Button processing state
      const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
      if (submitBtn) {
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Submitting...';
      }

      try {
        /* ==========================================================================
           CLOUDFLARE D1 DATABASE LIVE INTEGRATION:
           Sends the inquiry directly to your citadel-edge-api worker
           ========================================================================== */
        const CLOUDFLARE_WORKER_URL = 'https://citadel-edge-api.bhavsarprathmesh71.workers.dev';

        try {
          // Attempt POST to the Cloudflare D1 Worker endpoint
          const res = await fetch(`${CLOUDFLARE_WORKER_URL}/api/clients`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(inquiry),
          });

          if (!res.ok && res.status === 404) {
            // Fallback to root or /clients if /api/clients is not the route
            await fetch(`${CLOUDFLARE_WORKER_URL}/clients`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(inquiry),
            }).catch(() => {});
          }
          console.info('[Cloudflare D1] Inquiry transmitted to Worker API');
        } catch (workerErr) {
          console.warn('[Cloudflare D1] Network or CORS warning (persisting to storage backup):', workerErr);
        }

        // Persist locally under multiple dashboard-compatible keys so data is never lost
        try {
          const stored = JSON.parse(localStorage.getItem('rais_client_inquiries') || '[]');
          stored.unshift(inquiry);
          localStorage.setItem('rais_client_inquiries', JSON.stringify(stored));

          // Also save into standard clash_of_clients client keys for same-domain / shared storage
          const clashStored = JSON.parse(localStorage.getItem('clash_clients') || localStorage.getItem('clients') || '[]');
          clashStored.unshift(inquiry);
          localStorage.setItem('clash_clients', JSON.stringify(clashStored));
          localStorage.setItem('clients', JSON.stringify(clashStored));
        } catch (storageErr) {
          console.warn('LocalStorage unavailable:', storageErr);
        }

        // Build personalized WhatsApp direct link to +91 9313220611
        const waMsg = encodeURIComponent(
          `Hello RAIS Studios! My name is ${inquiry.clientName} from ${inquiry.businessName}. ` +
          `I just submitted an inquiry for ${inquiry.service}. My contact number is ${inquiry.phone}.`
        );
        const waUrl = `https://wa.me/919313220611?text=${waMsg}`;

        const waBtn = document.getElementById('whatsappRedirectBtn');
        if (waBtn) {
          waBtn.href = waUrl;
        }

        // Emit custom browser event for any embedding listener / dashboard bridge
        window.dispatchEvent(new CustomEvent('rais:new_inquiry', { detail: inquiry }));
        console.info('RAIS Studios Client Inquiry Logged:', inquiry);

        // Populate success view details
        const successClient = document.getElementById('successClientName');
        const successBiz = document.getElementById('successBusinessName');
        const sumContact = document.getElementById('summaryContact');
        const sumBusiness = document.getElementById('summaryBusiness');
        const sumService = document.getElementById('summaryService');
        const sumEmail = document.getElementById('summaryEmail');
        const sumEmailRow = document.getElementById('summaryEmailRow');

        if (successClient) successClient.textContent = inquiry.clientName;
        if (successBiz) successBiz.textContent = inquiry.businessName;
        if (sumContact) sumContact.textContent = `${inquiry.clientName} (${inquiry.phone})`;
        if (sumBusiness) sumBusiness.textContent = inquiry.businessName;
        if (sumService) sumService.textContent = inquiry.service;

        if (sumEmailRow && sumEmail) {
          if (inquiry.email) {
            sumEmail.textContent = inquiry.email;
            sumEmailRow.hidden = false;
          } else {
            sumEmailRow.hidden = true;
          }
        }

        // Brief delay for tactile feedback
        await new Promise((res) => setTimeout(res, 400));

        // Switch to success view
        if (entryState && successState) {
          if (window.gsap && !prefersReducedMotion) {
            window.gsap.to(entryState, {
              opacity: 0,
              y: -10,
              duration: 0.35,
              ease: 'power2.in',
              onComplete: () => {
                entryState.hidden = true;
                successState.hidden = false;
                window.gsap.fromTo(
                  successState,
                  { opacity: 0, y: 16 },
                  { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }
                );
                // Animate checkmark path
                const check = successState.querySelector('.success-check');
                if (check) {
                  const len = check.getTotalLength ? check.getTotalLength() : 30;
                  window.gsap.fromTo(
                    check,
                    { strokeDasharray: len, strokeDashoffset: len },
                    { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out', delay: 0.15 }
                  );
                }
              },
            });
          } else {
            entryState.hidden = true;
            successState.hidden = false;
          }
        }
      } catch (err) {
        console.error('Error recording inquiry:', err);
        alert('There was a temporary problem saving your inquiry. Please try WhatsApp directly.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Submit Inquiry';
        }
      }
    });
  }

  // Reset / submit another inquiry
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      clearErrors();

      // Reset service tags to first option
      serviceTags.forEach((t, i) => {
        t.classList.toggle('is-active', i === 0);
        const r = t.querySelector('input[type="radio"]');
        if (r) r.checked = i === 0;
      });

      if (entryState && successState) {
        if (window.gsap && !prefersReducedMotion) {
          window.gsap.to(successState, {
            opacity: 0,
            y: 10,
            duration: 0.3,
            onComplete: () => {
              successState.hidden = true;
              entryState.hidden = false;
              window.gsap.fromTo(
                entryState,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
              );
            },
          });
        } else {
          successState.hidden = true;
          entryState.hidden = false;
        }
      }
    });
  }

  // Magnetic submit button on desktop
  if (hasFinePointer && submitBtn && window.gsap && !prefersReducedMotion) {
    const moveX = window.gsap.quickTo(submitBtn, 'x', { duration: 0.3, ease: 'power3.out' });
    const moveY = window.gsap.quickTo(submitBtn, 'y', { duration: 0.3, ease: 'power3.out' });

    submitBtn.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = submitBtn.getBoundingClientRect();
      const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      moveX(Math.max(-4, Math.min(4, offsetX * 4)));
      moveY(Math.max(-3, Math.min(3, offsetY * 3)));
    }, { passive: true });

    submitBtn.addEventListener('pointerleave', () => {
      moveX(0);
      moveY(0);
    });
  }

  initEntrance();
})();

