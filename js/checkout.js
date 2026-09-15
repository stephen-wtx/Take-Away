/**
 * TAKE AWAY RUI JÚNIOR - MÓDULO DE CHECKOUT & CONFIRMAÇÃO (CHECKOUT.JS)
 * Formulário de finalização de pedido, geração de número único e modal de confirmação.
 */

const Checkout = {
  modal: null,
  form: null,
  confirmModal: null,

  init() {
    this.modal = document.getElementById('checkoutModal');
    this.confirmModal = document.getElementById('confirmationModal');
    this.form = document.getElementById('checkoutForm');

    // Botão para abrir checkout a partir do carrinho
    const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
    if (cartCheckoutBtn) {
      cartCheckoutBtn.addEventListener('click', () => {
        const cart = StorageService.getCart();
        if (cart.length === 0) {
          Toast.show('O seu carrinho está vazio.', 'warning');
          return;
        }
        Cart.close();
        this.open();
      });
    }

    // Botão de fechar modal de checkout
    const closeBtn = document.getElementById('checkoutCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Botão de fechar modal de confirmação
    const confirmCloseBtn = document.getElementById('confirmationCloseBtn');
    if (confirmCloseBtn) {
      confirmCloseBtn.addEventListener('click', () => this.closeConfirmation());
    }

    // Submissão do formulário de checkout
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Fechar ao clicar no backdrop dos modais
    [this.modal, this.confirmModal].forEach(m => {
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) {
            if (m === this.modal) this.close();
            if (m === this.confirmModal) this.closeConfirmation();
          }
        });
      }
    });
  },

  open() {
    if (!this.modal) return;
    this.renderSummary();
    this.modal.classList.add('is-active');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('is-active');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  renderSummary() {
    const summaryContainer = document.getElementById('checkoutSummaryItems');
    const totalEl = document.getElementById('checkoutSummaryTotal');
    const cart = StorageService.getCart();
    const { total } = StorageService.getCartTotals();

    if (summaryContainer) {
      summaryContainer.innerHTML = cart.map(item => `
        <div class="checkout-summary-row">
          <span>${item.quantity}x ${item.nome}</span>
          <strong>${item.preco * item.quantity} MZN</strong>
        </div>
      `).join('');
    }

    if (totalEl) {
      totalEl.textContent = `${total} MZN`;
    }
  },

  handleSubmit() {
    const nomeInput = document.getElementById('checkoutNome');
    const telInput = document.getElementById('checkoutTelefone');
    const pagRadio = document.querySelector('input[name="checkoutPagamento"]:checked');
    const obsInput = document.getElementById('checkoutObs');

    const nome = nomeInput ? nomeInput.value.trim() : '';
    const telefone = telInput ? telInput.value.trim() : '';
    const pagamento = pagRadio ? pagRadio.value : 'Dinheiro';
    const observacoes = obsInput ? obsInput.value.trim() : '';

    if (!nome || nome.length < 2) {
      Toast.show('Por favor insira o seu nome completo.', 'error');
      if (nomeInput) nomeInput.focus();
      return;
    }

    if (!telefone || telefone.length < 6) {
      Toast.show('Por favor insira um número de telefone válido.', 'error');
      if (telInput) telInput.focus();
      return;
    }

    const cart = StorageService.getCart();
    const { total } = StorageService.getCartTotals();

    if (cart.length === 0) {
      Toast.show('O seu carrinho está vazio.', 'warning');
      this.close();
      return;
    }

    // Criar pedido no LocalStorage
    const newOrder = StorageService.createOrder({
      nome,
      telefone,
      produtos: cart,
      total,
      tipo: 'takeaway',
      pagamento,
      observacoes
    });

    // Limpar carrinho e fechar modal de checkout
    StorageService.clearCart();
    this.close();
    if (this.form) this.form.reset();

    // Feedback e abrir confirmação
    Toast.show(`Pedido ${newOrder.id} realizado com sucesso!`, 'success', 4000);
    this.openConfirmation(newOrder);
  },

  openConfirmation(order) {
    if (!this.confirmModal) return;

    // Preencher dados na tela de confirmação
    const orderIdEl = document.getElementById('confirmOrderId');
    const clientNameEl = document.getElementById('confirmClientName');
    const clientTelEl = document.getElementById('confirmClientTel');
    const orderTypeEl = document.getElementById('confirmOrderType');
    const itemsEl = document.getElementById('confirmOrderItems');
    const totalEl = document.getElementById('confirmOrderTotal');
    const paymentEl = document.getElementById('confirmPaymentMethod');
    const trackBtn = document.getElementById('confirmTrackOrderBtn');

    if (orderIdEl) orderIdEl.textContent = order.id;
    if (clientNameEl) clientNameEl.textContent = order.cliente.nome;
    if (clientTelEl) clientTelEl.textContent = order.cliente.telefone;
    if (orderTypeEl) orderTypeEl.textContent = 'Levantamento / Takeaway';
    if (paymentEl) paymentEl.textContent = order.pagamento;
    if (totalEl) totalEl.textContent = `${order.total} MZN`;

    if (itemsEl) {
      itemsEl.innerHTML = order.produtos.map(p => `
        <div class="confirm-item-row">
          <span>${p.quantity}x ${p.nome}</span>
          <span>${p.preco * p.quantity} MZN</span>
        </div>
      `).join('');
    }

    if (trackBtn) {
      trackBtn.onclick = () => {
        this.closeConfirmation();
        if (window.Tracking) {
          window.Tracking.openWithId(order.id);
        }
      };
    }

    this.confirmModal.classList.add('is-active');
    this.confirmModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  },

  closeConfirmation() {
    if (!this.confirmModal) return;
    this.confirmModal.classList.remove('is-active');
    this.confirmModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
};

window.Checkout = Checkout;
