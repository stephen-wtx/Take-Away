/**
 * TAKE AWAY RUI JÚNIOR - SCRIPTS PRINCIPAIS DA LANDING PAGE (MAIN.JS)
 * Orquestração da Landing Page: Menu Dinâmico, Carrinho, Checkout, Acompanhamento e Horários.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- Elementos do DOM ---
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileCloseBtn = document.getElementById('mobileCloseBtn');
  const navLinks = document.querySelectorAll('[data-nav-link]');

  // ------------------------------------------------------------------------
  // 1. MENU MOBILE (DRAWER & ACESSIBILIDADE)
  // ------------------------------------------------------------------------
  function openMobileMenu() {
    if (!menuToggle || !mobileNav) return;
    menuToggle.classList.add('is-active');
    mobileNav.classList.add('is-active');
    if (mobileOverlay) mobileOverlay.classList.add('is-active');
    
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Fechar menu de navegação');
    mobileNav.setAttribute('aria-hidden', 'false');
    
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    if (!menuToggle || !mobileNav) return;
    menuToggle.classList.remove('is-active');
    mobileNav.classList.remove('is-active');
    if (mobileOverlay) mobileOverlay.classList.remove('is-active');
    
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu de navegação');
    mobileNav.setAttribute('aria-hidden', 'true');
    
    document.body.style.overflow = '';
  }

  function toggleMobileMenu() {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    if (isExpanded) closeMobileMenu();
    else openMobileMenu();
  }

  if (menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileMenu);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('is-active')) {
      closeMobileMenu();
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // ------------------------------------------------------------------------
  // 2. HEADER SCROLL & HORÁRIOS DA LOJA
  // ------------------------------------------------------------------------
  function handleHeaderScroll() {
    if (!header) return;
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  function updateStoreStatusBadge() {
    const status = StorageService.isStoreOpen();
    const badges = document.querySelectorAll('[data-store-status]');
    badges.forEach(badge => {
      if (status.open) {
        badge.className = 'store-status-badge is-open';
        badge.innerHTML = `<i class="fa-solid fa-circle"></i> Estamos abertos (${status.hours})`;
      } else {
        badge.className = 'store-status-badge is-closed';
        badge.innerHTML = '<i class="fa-solid fa-circle"></i> Estamos fechados no momento.';
      }
    });
  }

  updateStoreStatusBadge();
  window.addEventListener('takeaway:hours-updated', updateStoreStatusBadge);

  // ------------------------------------------------------------------------
  // 3. RENDERIZAÇÃO DINÂMICA DO MENU & ADICIONAR AO CARRINHO
  // ------------------------------------------------------------------------
  function renderMenuProducts() {
    const menuGrid = document.querySelector('.menu-grid');
    if (!menuGrid) return;

    const products = StorageService.getProducts();
    if (products.length === 0) {
      menuGrid.innerHTML = '<p class="empty-menu-msg">De momento não existem produtos disponíveis no cardápio.</p>';
      return;
    }

    menuGrid.innerHTML = products.map(p => `
      <article class="menu-card ${p.disponivel === false ? 'is-unavailable' : ''}" role="listitem">
        <div class="card-img-wrapper">
          <img 
            src="${p.imagem}" 
            alt="${p.nome} - Take Away Rui Júnior" 
            class="card-img"
            loading="lazy"
            decoding="async"
            width="320"
            height="240"
          >
        </div>
        <div class="card-body">
          <h3 class="card-title">${p.nome}</h3>
          <p class="card-desc">${p.descricao}</p>
          ${p.disponivel === false ? '<span class="product-unavailable-label">Indisponível no momento</span>' : ''}
          <div class="card-footer">
            <div class="card-price-box">
              <span class="price-label">Preço</span>
              <span class="card-price">${p.preco} MZN</span>
            </div>
            <button type="button" class="btn btn-primary btn-card" data-order-product="${p.id}" aria-label="${p.disponivel === false ? `${p.nome} indisponível` : `Pedir ${p.nome} por ${p.preco} MZN`}" ${p.disponivel === false ? 'disabled' : ''}>
              <span>Pedir</span>
              <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>
    `).join('');

    // Ligar eventos nos botões "Pedir"
    menuGrid.querySelectorAll('[data-order-product]').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = btn.dataset.orderProduct;
        const product = StorageService.getProductById(productId);
        if (product && product.disponivel !== false) {
          StorageService.addToCart(product, 1);
          Toast.show(`<strong>${product.nome}</strong> adicionado ao carrinho!`, 'success');
          
          // Animação de feedback no botão
          btn.classList.add('btn-added-pulse');
          setTimeout(() => btn.classList.remove('btn-added-pulse'), 500);
        }
      });
    });
  }

  renderMenuProducts();
  window.addEventListener('takeaway:products-updated', renderMenuProducts);
  window.addEventListener('storage', (event) => {
    if (event.key === 'takeaway_products') renderMenuProducts();
    if (event.key === 'takeaway_settings') updateStoreStatusBadge();
  });

  // ------------------------------------------------------------------------
  // 4. INICIALIZAÇÃO DOS MÓDULOS DE CARRINHO, CHECKOUT E TRACKING
  // ------------------------------------------------------------------------
  if (window.Toast) Toast.init();
  if (window.Cart) Cart.init();
  if (window.Checkout) Checkout.init();
  if (window.Tracking) Tracking.init();

  // ------------------------------------------------------------------------
  // 5. VÍDEO CONTROLADO POR SCROLL NA HERO SECTION (INTEGRADO AO BACKGROUND)
  // ------------------------------------------------------------------------
  function initHeroScrollVideo() {
    const heroWrapper = document.getElementById('heroWrapper');
    const heroVideo = document.getElementById('heroScrollVideo');

    if (!heroWrapper || !heroVideo) return;

    let targetTime = 0;
    let lastAppliedTime = -1;
    let isSeeking = false;
    let isPendingSeek = false;
    let rafId = null;

    // Garantir que o vídeo esteja pausado e sem som
    heroVideo.muted = true;
    heroVideo.pause();
    heroVideo.currentTime = 0;

    function onMetadataReady() {
      calculateAndSeek();
    }

    if (heroVideo.readyState >= 1) {
      onMetadataReady();
    } else {
      heroVideo.addEventListener('loadedmetadata', onMetadataReady);
      heroVideo.addEventListener('canplay', onMetadataReady);
    }

    function calculateProgress() {
      const rect = heroWrapper.getBoundingClientRect();
      const scrollDist = heroWrapper.offsetHeight - window.innerHeight;
      if (scrollDist <= 0) return 0;

      // rect.top varia de 0 (topo) até -scrollDist (fim da seção hero-wrapper)
      const scrolled = -rect.top;
      return Math.min(Math.max(scrolled / scrollDist, 0), 1);
    }

    function performSeek() {
      if (!heroVideo.duration) return;

      // Se o decodificador móvel ainda está processando o seek anterior, marca pendência
      if (isSeeking || heroVideo.seeking) {
        isPendingSeek = true;
        return;
      }

      // Limiar para economizar decodificação móvel (mínimo ~1 frame a 30fps)
      const timeDiff = Math.abs(targetTime - lastAppliedTime);
      if (timeDiff < 0.03 && lastAppliedTime !== -1) {
        return;
      }

      const clampedTime = Math.min(Math.max(targetTime, 0), heroVideo.duration - 0.02);
      lastAppliedTime = clampedTime;
      isSeeking = true;
      isPendingSeek = false;

      if ('fastSeek' in heroVideo) {
        heroVideo.fastSeek(clampedTime);
      } else {
        heroVideo.currentTime = clampedTime;
      }
    }

    // Liberação de busca para máxima fluidez no mobile (evita filas de decode)
    heroVideo.addEventListener('seeked', () => {
      isSeeking = false;
      if (isPendingSeek) {
        isPendingSeek = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(performSeek);
      }
    });

    function calculateAndSeek() {
      if (!heroVideo.duration) return;
      const progress = calculateProgress();
      targetTime = progress * heroVideo.duration;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(performSeek);
    }

    window.addEventListener('scroll', calculateAndSeek, { passive: true });
    window.addEventListener('resize', calculateAndSeek, { passive: true });

    // Atualização inicial
    setTimeout(calculateAndSeek, 150);
  }

  initHeroScrollVideo();

  // ------------------------------------------------------------------------
  // 6. SCROLL SUAVE & SCROLL SPY
  // ------------------------------------------------------------------------
  const allAnchorLinks = document.querySelectorAll('a[href^="#"]');
  allAnchorLinks.forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '#pedidos') return;

      if (targetId === '#hero') {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        return;
      }

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = header ? header.offsetHeight : 0;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  const sections = document.querySelectorAll('section[id]');
  const desktopLinks = document.querySelectorAll('.desktop-nav .nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  function highlightNavOnScroll() {
    const scrollY = window.pageYOffset;
    const headerHeight = header ? header.offsetHeight : 80;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - headerHeight - 50;
      const sectionId = current.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        desktopLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });

        mobileLinks.forEach((link) => {
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNavOnScroll, { passive: true });
});
