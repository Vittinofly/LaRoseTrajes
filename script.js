/* La Rose Trajes a Rigor: módulos initX; cada um sai em silêncio se os elementos não existirem */
(() => {
  'use strict';
  window.laRoseReady = true;

  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('[data-header]');
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const isMenuOpen = () => !!navbar && navbar.classList.contains('active');

  /* 1. Menu mobile: aria-expanded, trava o scroll, fecha com ESC, link ou clique fora */
  let closeMenu = () => { };
  function initMenu() {
    const navClose = document.getElementById('navClose');
    const overlay = document.getElementById('menuOverlay');
    if (!navbar || !menuToggle) return;

    const open = () => {
      navbar.classList.add('active');
      if (overlay) overlay.classList.add('active');
      menuToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      const first = navbar.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    };
    closeMenu = () => {
      if (!isMenuOpen()) return;
      navbar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    menuToggle.addEventListener('click', open);
    if (navClose) navClose.addEventListener('click', () => { closeMenu(); menuToggle.focus(); });
    if (overlay) overlay.addEventListener('click', closeMenu);
    navbar.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isMenuOpen()) { closeMenu(); menuToggle.focus(); }
    });
  }

  /* 2. Header inteligente: some ao descer (> 80px), volta ao subir, nunca some com o menu aberto */
  function initHeader() {
    if (!header) return;
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 20);
      const goingDown = y > lastY && y > 80;
      header.classList.toggle('nav-hidden', goingDown && !isMenuOpen());
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* 3. Scroll reveal: fade + subida, cascata automática por lote, uma vez só */
  function initReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    const finish = el => {
      el.removeAttribute('data-reveal');
      el.classList.remove('is-visible');
      el.style.transitionDelay = '';
    };
    if (REDUCE || !('IntersectionObserver' in window)) { els.forEach(finish); return; }

    const io = new IntersectionObserver(entries => {
      let i = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const custom = el.getAttribute('data-reveal-delay');
        el.style.transitionDelay = (custom !== null ? +custom : Math.min(i * 90, 450)) + 'ms';
        el.classList.add('is-visible');
        el.addEventListener('transitionend', function done(ev) {
          if (ev.target !== el || ev.propertyName !== 'opacity') return;
          el.removeEventListener('transitionend', done);
          finish(el);
        });
        io.unobserve(el);
        i++;
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    els.forEach(el => io.observe(el));
  }

  /* 4. Animação assinatura: título do hero revelado palavra por palavra */
  function initHeroWords() {
    const h1 = document.querySelector('.hero-title');
    if (!h1 || REDUCE) return;
    const words = h1.textContent.trim().split(/\s+/);
    h1.textContent = '';
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      span.style.setProperty('--i', i);
      span.textContent = w;
      h1.appendChild(span);
      if (i < words.length - 1) h1.appendChild(document.createTextNode(' '));
    });
  }

  /* 5. Âncoras com desconto do header + scrollspy no menu */
  function initAnchors() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const offset = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - offset + 1;
        window.scrollTo({ top, behavior: REDUCE ? 'auto' : 'smooth' });
        if (history.replaceState) history.replaceState(null, '', id);
      });
    });

    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    if (!navLinks.length || !('IntersectionObserver' in window)) return;
    const byId = new Map();
    navLinks.forEach(l => {
      const sec = document.querySelector(l.getAttribute('href'));
      if (sec) byId.set(sec, l);
    });
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(l => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
        const link = byId.get(entry.target);
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, sec) => spy.observe(sec));
  }

  /* 6. FAQ: transição de altura, um item aberto por vez */
  const FAQ_ONE_OPEN = true;
  function initFaq() {
    const items = [...document.querySelectorAll('.faq-item')];
    if (!items.length) return;
    const opts = { duration: 380, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };

    const open = d => {
      d.open = true;
      if (REDUCE) return;
      const p = d.querySelector('p');
      const pad = getComputedStyle(p).paddingBottom;
      p.style.overflow = 'hidden';
      p.animate([
        { height: '0px', paddingBottom: '0px', opacity: 0 },
        { height: p.offsetHeight + 'px', paddingBottom: pad, opacity: 1 }
      ], opts).onfinish = () => { p.style.overflow = ''; };
    };
    const close = d => {
      if (REDUCE) { d.open = false; return; }
      const p = d.querySelector('p');
      p.style.overflow = 'hidden';
      p.animate([
        { height: p.offsetHeight + 'px', paddingBottom: getComputedStyle(p).paddingBottom, opacity: 1 },
        { height: '0px', paddingBottom: '0px', opacity: 0 }
      ], opts).onfinish = () => { d.open = false; p.style.overflow = ''; };
    };

    items.forEach(d => {
      d.querySelector('summary').addEventListener('click', e => {
        e.preventDefault();
        if (d.open) { close(d); return; }
        if (FAQ_ONE_OPEN) items.forEach(o => { if (o !== d && o.open) close(o); });
        open(d);
      });
    });
  }

  /* 7. Galeria: filtros com entrada animada + itens abrem pelo teclado */
  function initGallery() {
    const buttons = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.portfolio-item');
    if (!items.length) return;

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        const filter = button.getAttribute('data-filter');
        items.forEach(item => {
          const show = filter === 'all' || item.classList.contains(filter);
          item.classList.toggle('hide', !show);
          item.classList.remove('is-filtering');
          if (show && !REDUCE) {
            void item.offsetWidth; // reinicia a animação
            item.classList.add('is-filtering');
          }
        });
        updateCollapse();
      });
    });

    // Galeria recolhida: 1 fileira + parte da 2ª (tablet/computador) ou 2 fotos + parte da 3ª (celular)
    const wrapper = document.getElementById('galleryWrapper');
    const more = document.getElementById('galleryMore');
    const moreBtn = document.getElementById('galleryMoreBtn');

    function updateCollapse() {
      if (!wrapper || !more || !moreBtn) return;
      const visible = [...items].filter(item => !item.classList.contains('hide'));
      const rowTops = [...new Set(visible.map(item => item.offsetTop))].sort((a, b) => a - b);
      const fullRows = window.innerWidth < 768 ? 2 : 1;

      // Poucas fotos (ex.: filtro "Clutches"): mostra tudo, sem botão, mas guarda se estava recolhida
      const short = rowTops.length <= fullRows + 1;
      wrapper.classList.toggle('is-short', short);
      more.hidden = short;
      if (short) {
        wrapper.style.maxHeight = 'none';
        return;
      }

      if (wrapper.classList.contains('is-collapsed')) {
        const peek = visible[0].offsetHeight * 0.45;
        wrapper.style.maxHeight = (rowTops[fullRows] - rowTops[0] + peek) + 'px';
      } else {
        wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
      }
    }

    function setExpanded(expanded) {
      wrapper.classList.toggle('is-collapsed', !expanded);
      moreBtn.setAttribute('aria-expanded', expanded);
      moreBtn.querySelector('span').textContent = expanded ? 'Ver menos' : 'Ver mais modelos';
      updateCollapse();
    }

    if (wrapper && more && moreBtn) {
      moreBtn.addEventListener('click', () => {
        const expanding = wrapper.classList.contains('is-collapsed');
        setExpanded(expanding);
        if (!expanding) {
          document.getElementById('portfolio').scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
        }
      });

      // Quem navega pelo teclado e chega numa foto escondida abre a galeria inteira
      wrapper.addEventListener('focusin', e => {
        if (!wrapper.classList.contains('is-collapsed') || wrapper.classList.contains('is-short')) return;
        const item = e.target.closest('.portfolio-item');
        if (item && item.offsetTop + item.offsetHeight > wrapper.clientHeight) setExpanded(true);
      });

      window.addEventListener('resize', updateCollapse);
      window.addEventListener('load', updateCollapse);
      updateCollapse();
    }

    items.forEach(item => {
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      });
      item.addEventListener('animationend', () => item.classList.remove('is-filtering'));
    });
  }

  /* 8. Lightbox: anterior/próximo, setas, ESC, clique fora, foco preso e devolvido */
  function initLightbox() {
    const modal = document.getElementById('lightboxModal');
    if (!modal) return;
    const img = document.getElementById('lightboxImg');
    const title = document.getElementById('lightboxTitle');
    const desc = document.getElementById('lightboxDesc');
    const closeBtn = modal.querySelector('.lightbox-close');
    let lastFocus = null;
    let current = null;

    const visibleItems = () => [...document.querySelectorAll('.portfolio-item:not(.hide)')];
    const show = item => {
      const t = item.dataset.title || '';
      const d = item.dataset.desc || '';
      img.src = item.dataset.full;
      img.alt = d || t;
      title.textContent = t;
      desc.textContent = d;
    };

    const open = item => {
      current = item;
      lastFocus = item;
      show(item);
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    };
    const close = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    const step = dir => {
      const list = visibleItems();
      if (!list.length) return;
      const idx = Math.max(0, list.indexOf(current));
      current = list[(idx + dir + list.length) % list.length];
      show(current);
      if (!REDUCE) img.animate([{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 350, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    };

    document.querySelectorAll('.portfolio-item[data-full]').forEach(item => {
      item.addEventListener('click', () => open(item));
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    const prev = modal.querySelector('[data-lightbox-prev]');
    const next = modal.querySelector('[data-lightbox-next]');
    if (prev) prev.addEventListener('click', () => step(-1));
    if (next) next.addEventListener('click', () => step(1));
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', e => {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') {
        const f = [...modal.querySelectorAll('button')];
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }

  /* 9. Micro-interação: CTA principal magnético (só com mouse) */
  function initMagnetic() {
    if (REDUCE || !window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${(y - 3).toFixed(1)}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* 10. Ano do rodapé */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  }

  initHeroWords();
  document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    initHeader();
    initReveal();
    initAnchors();
    initFaq();
    initGallery();
    initLightbox();
    initMagnetic();
    initYear();
  });
})();
