/**
 * TAKE AWAY RUI JÚNIOR - MÓDULO DO CARRINHO (CART.JS)
 * Gestão do drawer do carrinho, cálculo de totais e sincronização com LocalStorage.
 */

const Cart = {
  drawer: null,
  overlay: null,
  itemsContainer: null,
  totalEl: null,
  badgeEls: [],

  init() {
    this.drawer = document.getElementById('cartDrawer');
    this.overlay = document.getElementById('cartOverlay');
    this.itemsContainer = document.getElementById('cartItemsList');
    this.totalEl = document.getElementById('cartTotalPrice');
    this.badgeEls = document.querySelectorAll('[data-cart-count]');

    // Event listeners para botões de abrir/fechar carrinho
    const openBtns = document.querySelectorAll('[data-cart-open]');
    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    const closeBtn = document.getElementById('cartCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    const continueBtn = document.getElementById('cartContinueBtn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => this.close());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    // Fechar ao pressionar Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Escutar eventos de atualização do carrinho no LocalStorage
    window.addEventListener('takeaway:cart-updated', () => {
      this.render();
      this.updateBadges();
    });

    // Renderização inicial
    this.render();
    this.updateBadges();
  },

  isOpen() {
    return this.drawer && this.drawer.classList.contains('is-active');
  },

  open() {
    if (!this.drawer) return;
    this.drawer.classList.add('is-active');
    if (this.overlay) this.overlay.classList.add('is-active');
    this.drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.render();
  },

  close() {
    if (!this.drawer) return;
    this.drawer.classList.remove('is-active');
    if (this.overlay) this.overlay.classList.remove('is-active');
    this.drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  updateBadges() {
    const { count } = StorageService.getCartTotals();
    this.badgeEls = document.querySelectorAll('[data-cart-count]');
    this.badgeEls.forEach(badge => {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.add('has-items');
      } else {
        badge.classList.remove('has-items');
      }
    });
  },

  render() {
    if (!this.itemsContainer) return;
    const cart = StorageService.getCart();
    const { count, total } = StorageService.getCartTotals();

    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    const emptyState = document.getElementById('cartEmptyState');
    const footer = document.getElementById('cartFooter');

    if (cart.length === 0) {
      this.itemsContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (footer) footer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (footer) footer.style.display = 'block';

    this.itemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-img-box">
          <img src="${item.imagem}" alt="${item.nome}" class="cart-item-img">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-header">
            <h4 class="cart-item-title">${item.nome}</h4>
            <button type="button" class="cart-item-remove" data-action="remove" data-id="${item.id}" aria-label="Remover ${item.nome}">
              <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
            </button>
          </div>
          <div class="cart-item-price-unit">${item.preco} MZN cada</div>
          <div class="cart-item-footer">
            <div class="cart-quantity-control">
              <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Diminuir quantidade">-</button>
              <span class="qty-value">${item.quantity}</span>
              <button type="button" class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Aumentar quantidade">+</button>
            </div>
            <div class="cart-item-subtotal">${item.preco * item.quantity} MZN</div>
          </div>
        </div>
      </div>
    `).join('');

    if (this.totalEl) {
      this.totalEl.textContent = `${total} MZN`;
    }

    // Ligar eventos nos botões de quantidade e remoção
    this.itemsContainer.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const productId = btn.dataset.id;

        if (action === 'increase') {
          StorageService.updateCartQuantity(productId, 1);
        } else if (action === 'decrease') {
          StorageService.updateCartQuantity(productId, -1);
        } else if (action === 'remove') {
          StorageService.removeFromCart(productId);
          Toast.show('Item removido do carrinho.', 'info', 2000);
        }
      });
    });
  }
};

window.Cart = Cart;
