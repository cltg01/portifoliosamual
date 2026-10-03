(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const finePointer = matchMedia('(pointer:fine)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#year') && ($('#year').textContent = new Date().getFullYear());

  /* ==========================================================
     PRELOADER — simula filme carregando
     ========================================================== */
  const preloader = $('#preloader');
  const preloaderCounter = $('#preloaderCounter');
  const preloaderStatus = $('#preloaderStatus');

  const filmFrames = $('#filmFrames');
  if (filmFrames) {
    // Duplica frames pra loop infinito contínuo
    filmFrames.innerHTML += filmFrames.innerHTML;
  }

  let progress = 0;
  const statuses = [
    'Carregando filme...',
    'Enquadrando...',
    'Ajustando luz...',
    'Revelando imagens...',
    'Pronto.'
  ];

  const tickPreloader = () => {
    progress = Math.min(progress + Math.random() * 14, 100);
    if (preloaderCounter) {
      preloaderCounter.textContent = String(Math.floor(progress)).padStart(3, '0') + '%';
    }
    if (preloaderStatus) {
      const idx = Math.min(Math.floor(progress / 25), statuses.length - 1);
      preloaderStatus.textContent = statuses[idx];
    }

    if (progress < 100) {
      setTimeout(tickPreloader, 130 + Math.random() * 180);
    } else {
      setTimeout(() => {
        preloader?.classList.add('hidden');
        document.body.classList.add('ready');
      }, 500);
    }
  };

  window.addEventListener('load', () => {
    setTimeout(tickPreloader, 300);
  });

  // Fallback: força esconder em 5s no máximo
  setTimeout(() => preloader?.classList.add('hidden'), 5000);

  /* ==========================================================
     LINHA DE PROGRESSO
     ========================================================== */
  const progressBar = $('.scroll-line span');
  const updateProgress = () => {
    if (!progressBar) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    progressBar.style.width = `${max ? (scrollY / max) * 100 : 0}%`;
  };
  addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ==========================================================
     HEADER — estado "scrolled"
     ========================================================== */
  const header = $('#siteHeader');
  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle('scrolled', scrollY > 60);
  };
  addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* ==========================================================
     CURSOR CÂMERA — anel de foco
     ========================================================== */
  const cursor = $('#cameraCursor');
  if (cursor && finePointer && !reducedMotion) {
    document.documentElement.classList.add('custom-cursor');

    let cx = 0, cy = 0, tx = 0, ty = 0;

    addEventListener('pointermove', e => {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });

    const loop = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    };
    loop();

    // Foco expande ao passar em links/galleria
    const focusables = 'a, button, .work-item, .gallery-frame, .magnetic, .contact-link';
    $$(focusables).forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('focused'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('focused'));
    });
  }

  /* ==========================================================
     REVEAL — revelação fotográfica (blur → nítido)
     ========================================================== */
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        reveal.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });

  $$('.work-item, .manifesto-copy, .process-copy, .process-steps article, .about-copy, .section-heading, .gallery-frame, .contact, .about-image')
    .forEach(el => { el.classList.add('reveal'); reveal.observe(el); });

  /* ==========================================================
     BOTÕES MAGNÉTICOS
     ========================================================== */
  if (finePointer && !reducedMotion) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .12;
        const y = (e.clientY - r.top - r.height / 2) * .12;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => el.style.transform = '');
    });
  }

  /* ==========================================================
     GALERIA HORIZONTAL
     ========================================================== */
  const horizontal = $('[data-horizontal]');
  if (horizontal) {
    if (finePointer) {
      horizontal.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          horizontal.scrollLeft += e.deltaY * 1.15;
        }
      }, { passive: false });
    }

    let galleryTimer;
    let galleryPaused = false;

    const startGallery = () => {
      clearInterval(galleryTimer);
      galleryTimer = setInterval(() => {
        if (galleryPaused) return;
        const maxScroll = horizontal.scrollWidth - horizontal.clientWidth;
        if (horizontal.scrollLeft >= maxScroll - 5) {
          horizontal.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          horizontal.scrollBy({
            left: window.innerWidth <= 600
              ? window.innerWidth * 0.78 + 18
              : window.innerWidth * 0.55,
            behavior: 'smooth'
          });
        }
      }, 3500);
    };

    horizontal.addEventListener('mouseenter', () => { galleryPaused = true; });
    horizontal.addEventListener('mouseleave', () => { galleryPaused = false; });
    horizontal.addEventListener('touchstart', () => { galleryPaused = true; }, { passive: true });
    horizontal.addEventListener('touchend', () => {
      setTimeout(() => { galleryPaused = false; }, 2500);
    }, { passive: true });
    horizontal.addEventListener('pointerdown', () => { galleryPaused = true; });
    horizontal.addEventListener('pointerup', () => {
      setTimeout(() => { galleryPaused = false; }, 2500);
    });

    startGallery();
  }

  /* ==========================================================
     MENU MOBILE
     ========================================================== */
  const menu = $('.menu-toggle'), nav = $('.site-nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
    });
    $$('a', nav).forEach(a => a.addEventListener('click', () => {
      menu.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    }));
  }

  /* ==========================================================
     LIGHTBOX
     ========================================================== */
  const lightbox = $('.lightbox');
  const lightboxItems = $$('[data-lightbox]');
  if (lightbox && lightboxItems.length) {
    const image = $('.lightbox-media img', lightbox);
    const caption = $('.lightbox-caption', lightbox);
    let current = 0;

    const open = index => {
      current = index;
      const source = lightboxItems[current];
      const img = $('img', source);
      image.src = img.currentSrc || img.src;
      image.alt = img.alt || '';
      caption.textContent = source.dataset.caption || img.alt || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('locked');
    };

    const close = () => {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('locked');
    };

    const next = dir => open((current + dir + lightboxItems.length) % lightboxItems.length);

    lightboxItems.forEach((item, index) => item.addEventListener('click', () => open(index)));
    $('.lightbox-close', lightbox)?.addEventListener('click', close);
    $('.lightbox-prev', lightbox)?.addEventListener('click', () => next(-1));
    $('.lightbox-next', lightbox)?.addEventListener('click', () => next(1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });

    addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next(1);
      if (e.key === 'ArrowLeft') next(-1);
    });
  }

  /* ==========================================================
     PARALLAX SUAVE (hero e about)
     ========================================================== */
  if (!reducedMotion) {
    const parallaxEls = $$('[data-parallax]');
    if (parallaxEls.length) {
      let ticking = false;
      const update = () => {
        const y = scrollY;
        parallaxEls.forEach(el => {
          const speed = parseFloat(el.dataset.parallax) || 0;
          el.style.setProperty('--parallax', `${y * speed}px`);
        });
        ticking = false;
      };
      addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      }, { passive: true });
    }
  }
})();