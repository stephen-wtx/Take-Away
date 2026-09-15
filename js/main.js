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
  // 5. ANIMAÇÃO TRANSPARENTE CONTROLADA POR SCROLL (82 FRAMES WEBP EM ALTA DEFINIÇÃO)
  // ------------------------------------------------------------------------
  function initHeroScrollAnimation() {
    const heroWrapper = document.getElementById('heroWrapper');
    const canvas = document.getElementById('heroScrollCanvas');

    if (!heroWrapper || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Configurações de renderização de alta fidelidade
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const TOTAL_FRAMES = 82;
    const frames = new Array(TOTAL_FRAMES + 1);
    const loadedStatus = new Array(TOTAL_FRAMES + 1).fill(false);

    let targetProgress = 0;
    let currentProgress = 0;
    let lastRenderedIndex = -1;
    let rafId = null;

    function getFrameSrc(index) {
      const paddedIndex = String(index).padStart(3, '0');
      return `assets/imgs/frames/frame_${paddedIndex}.webp`;
    }

    // Renderiza um frame específico com enquadramento completo (sem cortes de borda)
    function renderFrame(index) {
      const clampedIndex = Math.max(1, Math.min(index, TOTAL_FRAMES));
      
      // Procura o frame carregado mais próximo se o desejado ainda não tiver descarregado
      let frameToDraw = frames[clampedIndex];
      if (!loadedStatus[clampedIndex]) {
        for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
          const prev = clampedIndex - offset;
          const next = clampedIndex + offset;
          if (prev >= 1 && loadedStatus[prev]) {
            frameToDraw = frames[prev];
            break;
          }
          if (next <= TOTAL_FRAMES && loadedStatus[next]) {
            frameToDraw = frames[next];
            break;
          }
        }
      }

      if (frameToDraw && frameToDraw.complete && frameToDraw.naturalWidth > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Enquadramento aprimorado com respiro proporcional
        // Escala calibrada a 91% para manter o hambúrguer imponente e centralizado
        const scale = 0.91;
        const drawW = canvas.width * scale;
        const drawH = canvas.height * scale;
        const drawX = (canvas.width - drawW) / 2;
        const drawY = (canvas.height - drawH) / 2;

        ctx.drawImage(frameToDraw, drawX, drawY, drawW, drawH);

        // Suavização perimetral completa (Feathering 360º de 4 bordas)
        // Elimina qualquer corte reto do vídeo original (topo, base, esquerda e direita),
        // integrando o hambúrguer perfeitamente e sem limites visíveis no fundo da página.
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';

        // 1. Desvanecimento lateral esquerdo (42px) - suaviza salpicos e sementes na borda esquerda
        const leftFade = ctx.createLinearGradient(drawX - 2, 0, drawX + 42, 0);
        leftFade.addColorStop(0, 'rgba(0, 0, 0, 1)');
        leftFade.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = leftFade;
        ctx.fillRect(0, 0, drawX + 42, canvas.height);

        // 2. Desvanecimento lateral direito (42px) - suaviza salpicos e sementes na borda direita
        const rightFade = ctx.createLinearGradient(drawX + drawW - 42, 0, drawX + drawW + 2, 0);
        rightFade.addColorStop(0, 'rgba(0, 0, 0, 0)');
        rightFade.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = rightFade;
        ctx.fillRect(drawX + drawW - 42, 0, canvas.width - (drawX + drawW - 42), canvas.height);

        // 3. Desvanecimento no topo (48px) - dissolve o corte reto do pão superior quando expandido
        const topFade = ctx.createLinearGradient(0, drawY - 2, 0, drawY + 48);
        topFade.addColorStop(0, 'rgba(0, 0, 0, 1)');
        topFade.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topFade;
        ctx.fillRect(0, 0, canvas.width, drawY + 48);

        // 4. Desvanecimento na base (75px) - dissolve fatias de tomate e gotas caindo sem cortes bruscos
        const bottomFade = ctx.createLinearGradient(0, drawY + drawH - 75, 0, drawY + drawH + 2);
        bottomFade.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomFade.addColorStop(1, 'rgba(0, 0, 0, 1)');
        ctx.fillStyle = bottomFade;
        ctx.fillRect(0, drawY + drawH - 75, canvas.width, canvas.height - (drawY + drawH - 75));

        ctx.restore();

        lastRenderedIndex = clampedIndex;
      }
    }

    // Função auxiliar para carregar uma imagem
    function loadSingleFrame(index, onDone) {
      if (frames[index]) {
        if (onDone) onDone();
        return;
      }
      const img = new Image();
      img.src = getFrameSrc(index);
      frames[index] = img;
      img.onload = () => {
        loadedStatus[index] = true;
        const curIdx = Math.min(Math.floor(currentProgress * (TOTAL_FRAMES - 1)) + 1, TOTAL_FRAMES);
        if (curIdx === index) {
          renderFrame(index);
        }
        if (onDone) onDone();
      };
      img.onerror = () => {
        if (onDone) onDone();
      };
    }

    // 1. Carregar primeiro frame imediatamente
    loadSingleFrame(1, () => {
      renderFrame(1);
    });

    // 2. Pré-carregamento prioritário de frames-chave (otimização extrema para mobile)
    // Permite que utilizadores em mobile rolem imediatamente com resposta fluida
    const keyFrames = [10, 20, 30, 40, 50, 60, 70, 80, TOTAL_FRAMES];
    keyFrames.forEach(idx => loadSingleFrame(idx));

    // 3. Pré-carregar os restantes frames em lotes moderados (não engasga a rede 3G/4G/5G)
    let batchIndex = 2;
    function loadNextBatch() {
      if (batchIndex > TOTAL_FRAMES) return;
      let batchCount = 0;
      while (batchIndex <= TOTAL_FRAMES && batchCount < 4) {
        loadSingleFrame(batchIndex);
        batchIndex++;
        batchCount++;
      }
      if (batchIndex <= TOTAL_FRAMES) {
        setTimeout(loadNextBatch, 60);
      }
    }

    setTimeout(loadNextBatch, 150);

    // Calcula a porcentagem do scroll dentro do wrapper [0, 1] compatível com Desktop e Mobile
    function calculateProgress() {
      const rect = heroWrapper.getBoundingClientRect();
      const scrollDist = heroWrapper.offsetHeight - window.innerHeight;
      if (scrollDist <= 0) return 0;

      const currentScroll = Math.max(0, -rect.top);
      return Math.min(Math.max(currentScroll / scrollDist, 0), 1);
    }

    // Loop de animação suave com interpolação (LERP) a 60fps
    function updateCanvas() {
      const diff = targetProgress - currentProgress;
      if (Math.abs(diff) < 0.002) {
        currentProgress = targetProgress;
      } else {
        currentProgress += diff * 0.32; // Interpolação tátil calibrada para touch e mouse wheel
      }

      const frameIndex = Math.min(Math.floor(currentProgress * (TOTAL_FRAMES - 1)) + 1, TOTAL_FRAMES);
      if (frameIndex !== lastRenderedIndex) {
        renderFrame(frameIndex);
      }

      if (Math.abs(targetProgress - currentProgress) >= 0.002) {
        rafId = requestAnimationFrame(updateCanvas);
      } else {
        rafId = null;
      }
    }

    function onScrollOrResize() {
      const rect = heroWrapper.getBoundingClientRect();
      // Otimização: ignora cálculos quando a hero estiver totalmente fora do viewport
      if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;

      targetProgress = calculateProgress();
      if (!rafId) {
        rafId = requestAnimationFrame(updateCanvas);
      }
    }

    // Eventos universais: scroll de janela, redimensionamento e toque móvel
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    window.addEventListener('touchmove', onScrollOrResize, { passive: true });
    document.addEventListener('scroll', onScrollOrResize, { passive: true });

    // Suporte a toque/arraste direto no hambúrguer em dispositivos móveis
    let touchStartY = 0;
    let initialTouchProgress = 0;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        initialTouchProgress = targetProgress;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const deltaY = touchStartY - e.touches[0].clientY;
        const progressDelta = deltaY / 300;
        targetProgress = Math.min(Math.max(initialTouchProgress + progressDelta, 0), 1);
        if (!rafId) {
          rafId = requestAnimationFrame(updateCanvas);
        }
      }
    }, { passive: true });

    // Inicialização forçada garantida
    setTimeout(onScrollOrResize, 50);
    setTimeout(onScrollOrResize, 250);
  }

  initHeroScrollAnimation();

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
