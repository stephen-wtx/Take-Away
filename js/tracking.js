/**
 * TAKE AWAY RUI JÚNIOR - MÓDULO DE ACOMPANHAMENTO DE PEDIDOS (TRACKING.JS)
 * Permite ao cliente consultar o estado do pedido em tempo real com stepper visual.
 */

const Tracking = {
  modal: null,
  input: null,
  searchBtn: null,
  resultBox: null,
  currentOrderId: null,

  STATUS_STEPS: [
    { key: 'NOVO', label: 'Recebido', icon: 'fa-receipt' },
    { key: 'CONFIRMADO', label: 'Confirmado', icon: 'fa-check' },
    { key: 'EM_PREPARACAO', label: 'Em Preparação', icon: 'fa-kitchen-set' },
    { key: 'PRONTO', label: 'Pronto', icon: 'fa-bell-concierge' },
    { key: 'LEVANTADO', label: 'Levantado', icon: 'fa-bag-shopping' }
  ],

  init() {
    this.modal = document.getElementById('trackingModal');
    this.input = document.getElementById('trackingInput');
    this.searchBtn = document.getElementById('trackingSearchBtn');
    this.resultBox = document.getElementById('trackingResultBox');

    // Botões que abrem o modal de acompanhamento
    const trackBtns = document.querySelectorAll('[data-track-open]');
    trackBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    const closeBtn = document.getElementById('trackingCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (this.searchBtn) {
      this.searchBtn.addEventListener('click', () => this.handleSearch());
    }

    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSearch();
        }
      });
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });
    }

    // Atualização em tempo real se o admin mudar o estado
    window.addEventListener('takeaway:orders-updated', () => {
      if (this.isOpen() && this.currentOrderId) {
        this.renderOrder(this.currentOrderId);
      }
    });

    window.addEventListener('storage', (event) => {
      if (event.key === 'takeaway_orders' && this.isOpen() && this.currentOrderId) {
        this.renderOrder(this.currentOrderId);
      }
    });
  },

  isOpen() {
    return this.modal && this.modal.classList.contains('is-active');
  },

  open() {
    if (!this.modal) return;
    this.modal.classList.add('is-active');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (this.input) {
      setTimeout(() => this.input.focus(), 150);
    }
  },

  openWithId(orderId) {
    this.open();
    if (this.input) {
      this.input.value = orderId;
    }
    this.renderOrder(orderId);
  },

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('is-active');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  },

  handleSearch() {
    const val = this.input ? this.input.value.trim() : '';
    if (!val) {
      Toast.show('Por favor digite o número do seu pedido (Ex: BG-1001).', 'warning');
      if (this.input) this.input.focus();
      return;
    }
    this.renderOrder(val);
  },

  renderOrder(orderId) {
    if (!this.resultBox) return;
    const order = StorageService.getOrderById(orderId);

    if (!order) {
      this.currentOrderId = null;
      this.resultBox.innerHTML = `
        <div class="tracking-empty-state">
          <div class="tracking-empty-icon"><i class="fa-solid fa-circle-question"></i></div>
          <h4>Pedido não encontrado</h4>
          <p>Não encontramos nenhum pedido com o código <strong>${orderId}</strong>. Verifique o número e tente novamente.</p>
        </div>
      `;
      this.resultBox.style.display = 'block';
      return;
    }

    this.currentOrderId = order.id;
    const dateFormatted = new Date(order.data).toLocaleString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const isCanceled = order.estado === 'CANCELADO';
    const currentStepIndex = this.STATUS_STEPS.findIndex(s => s.key === order.estado);

    const stepperHTML = isCanceled ? `
      <div class="tracking-canceled-box">
        <i class="fa-solid fa-circle-xmark"></i>
        <span>Este pedido foi cancelado</span>
      </div>
    ` : `
      <div class="tracking-stepper">
        ${this.STATUS_STEPS.map((step, index) => {
          let stepClass = '';
          if (index < currentStepIndex) stepClass = 'is-completed';
          else if (index === currentStepIndex) stepClass = 'is-current';

          return `
            <div class="stepper-step ${stepClass}">
              <div class="step-circle">
                <i class="fa-solid ${step.icon}"></i>
              </div>
              <span class="step-label">${step.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.resultBox.innerHTML = `
      <div class="tracking-card">
        <div class="tracking-header">
          <div>
            <span class="tracking-badge-id">${order.id}</span>
            <div class="tracking-date">${dateFormatted}</div>
          </div>
          <span class="status-badge status-${order.estado.toLowerCase().replace('_', '-')}">
            ${this.getStatusLabel(order.estado)}
          </span>
        </div>

        ${stepperHTML}

        <div class="tracking-details">
          <div class="tracking-row">
            <span>Cliente:</span>
            <strong>${order.cliente.nome} (${order.cliente.telefone})</strong>
          </div>
          <div class="tracking-row">
            <span>Tipo:</span>
            <strong>Takeaway / Levantamento</strong>
          </div>
          <div class="tracking-row">
            <span>Pagamento:</span>
            <strong>${order.pagamento}</strong>
          </div>
          <div class="tracking-items-list">
            ${order.produtos.map(p => `
              <div class="tracking-item-row">
                <span>${p.quantity}x ${p.nome}</span>
                <span>${p.preco * p.quantity} MZN</span>
              </div>
            `).join('')}
          </div>
          <div class="tracking-total-row">
            <span>Total:</span>
            <strong>${order.total} MZN</strong>
          </div>
        </div>
      </div>
    `;

    this.resultBox.style.display = 'block';
  },

  getStatusLabel(status) {
    const map = {
      'NOVO': 'Novo',
      'CONFIRMADO': 'Confirmado',
      'EM_PREPARACAO': 'Em Preparação',
      'PRONTO': 'Pronto para Levantar',
      'LEVANTADO': 'Levantado / Concluído',
      'CANCELADO': 'Cancelado'
    };
    return map[status] || status;
  }
};

window.Tracking = Tracking;
