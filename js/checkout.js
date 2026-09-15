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

    // Eventos de seleção do Tipo de Pedido (Takeaway vs Entrega)
    this.bindOrderTypeEvents();

    // Eventos do botão de Captura GPS
    this.bindGpsLocationEvents();

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

  bindOrderTypeEvents() {
    const typeRadios = document.querySelectorAll('input[name="checkoutTipoPedido"]');
    const deliveryCard = document.getElementById('deliveryDetailsCard');
    const optTakeaway = document.getElementById('optTypeTakeaway');
    const optDelivery = document.getElementById('optTypeDelivery');

    typeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const isDelivery = radio.value === 'delivery';

        if (optTakeaway) optTakeaway.classList.toggle('is-selected', !isDelivery);
        if (optDelivery) optDelivery.classList.toggle('is-selected', isDelivery);

        if (deliveryCard) {
          deliveryCard.style.display = isDelivery ? 'block' : 'none';
          if (isDelivery) {
            const addrInput = document.getElementById('deliveryAddress');
            if (addrInput && !addrInput.value) {
              setTimeout(() => addrInput.focus(), 100);
            }
          }
        }
      });
    });
  },

  bindGpsLocationEvents() {
    const btnGps = document.getElementById('btnGetGpsLocation');
    const btnText = document.getElementById('btnGpsText');
    const badge = document.getElementById('locationStatusBadge');
    const latInput = document.getElementById('deliveryLatitude');
    const lngInput = document.getElementById('deliveryLongitude');

    if (!btnGps) return;

    btnGps.addEventListener('click', () => {
      if (!navigator.geolocation) {
        Toast.show('O seu navegador não suporta geolocalização GPS.', 'warning');
        return;
      }

      btnGps.disabled = true;
      if (btnText) btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A obter localização GPS...';

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          if (latInput) latInput.value = lat;
          if (lngInput) lngInput.value = lng;

          btnGps.disabled = false;
          btnGps.classList.add('is-captured');
          if (btnText) {
            btnText.innerHTML = '<i class="fa-solid fa-check-circle"></i> Localização GPS Capturada (Clique para atualizar)';
          }

          if (badge) {
            badge.className = 'location-status-badge status-success';
            badge.innerHTML = `
              <strong><i class="fa-solid fa-location-dot"></i> GPS capturado:</strong> ${lat.toFixed(5)}, ${lng.toFixed(5)}
              <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener">
                Abrir no Mapa <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            `;
            badge.style.display = 'block';
          }

          Toast.show('Localização GPS capturada com sucesso!', 'success');
        },
        (error) => {
          btnGps.disabled = false;
          if (btnText) {
            btnText.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Tentar Obter GPS Novamente';
          }

          let errorMsg = 'Não foi possível obter a sua localização GPS.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Permissão de GPS recusada. Pode preencher a sua morada e ponto de referência manualmente abaixo.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Tempo limite excedido ao buscar GPS. Pode indicar o bairro e morada manualmente.';
          }

          if (badge) {
            badge.className = 'location-status-badge status-warning';
            badge.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${errorMsg}`;
            badge.style.display = 'block';
          }

          Toast.show(errorMsg, 'warning', 5000);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
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
    const tipoRadio = document.querySelector('input[name="checkoutTipoPedido"]:checked');
    const obsInput = document.getElementById('checkoutObs');

    const nome = nomeInput ? nomeInput.value.trim() : '';
    const telefone = telInput ? telInput.value.trim() : '';
    const pagamento = pagRadio ? pagRadio.value : 'Dinheiro';
    const tipo = tipoRadio ? tipoRadio.value : 'takeaway';
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

    // Validação e recolha dos dados de entrega se for "Entrega ao Domicílio"
    let entrega = null;
    if (tipo === 'delivery') {
      const addressInput = document.getElementById('deliveryAddress');
      const refInput = document.getElementById('deliveryReference');
      const latInput = document.getElementById('deliveryLatitude');
      const lngInput = document.getElementById('deliveryLongitude');

      const morada = addressInput ? addressInput.value.trim() : '';
      const pontoReferencia = refInput ? refInput.value.trim() : '';
      const latStr = latInput ? latInput.value : '';
      const lngStr = lngInput ? lngInput.value : '';

      if (!morada || morada.length < 3) {
        Toast.show('Por favor indique o Bairro / Morada para a entrega ao domicílio.', 'error');
        if (addressInput) addressInput.focus();
        return;
      }

      const lat = latStr ? parseFloat(latStr) : null;
      const lng = lngStr ? parseFloat(lngStr) : null;

      entrega = {
        morada,
        pontoReferencia,
        latitude: lat,
        longitude: lng,
        mapsUrl: (lat && lng) ? `https://www.google.com/maps?q=${lat},${lng}` : null
      };
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
      tipo,
      entrega,
      pagamento,
      observacoes
    });

    // Limpar carrinho e fechar modal de checkout
    StorageService.clearCart();
    this.close();
    if (this.form) this.form.reset();

    // Resetar campos dinâmicos de localização
    const badge = document.getElementById('locationStatusBadge');
    const btnText = document.getElementById('btnGpsText');
    const btnGps = document.getElementById('btnGetGpsLocation');
    const deliveryCard = document.getElementById('deliveryDetailsCard');
    const optTakeaway = document.getElementById('optTypeTakeaway');
    const optDelivery = document.getElementById('optTypeDelivery');

    if (badge) {
      badge.style.display = 'none';
      badge.innerHTML = '';
    }
    if (btnGps) btnGps.classList.remove('is-captured');
    if (btnText) btnText.innerHTML = 'Obter Minha Localização Atual (GPS)';
    if (deliveryCard) deliveryCard.style.display = 'none';
    if (optTakeaway) optTakeaway.classList.add('is-selected');
    if (optDelivery) optDelivery.classList.remove('is-selected');

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
    const deliveryBox = document.getElementById('confirmDeliveryBox');
    const deliveryAddressEl = document.getElementById('confirmDeliveryAddress');
    const deliveryMapsLinkEl = document.getElementById('confirmDeliveryMapsLink');

    if (orderIdEl) orderIdEl.textContent = order.id;
    if (clientNameEl) clientNameEl.textContent = order.cliente.nome;
    if (clientTelEl) clientTelEl.textContent = order.cliente.telefone;
    if (paymentEl) paymentEl.textContent = order.pagamento;
    if (totalEl) totalEl.textContent = `${order.total} MZN`;

    const isDelivery = order.tipo === 'delivery';
    if (orderTypeEl) {
      orderTypeEl.innerHTML = isDelivery
        ? '<span style="color: #b45309;"><i class="fa-solid fa-motorcycle"></i> Entrega ao Domicílio</span>'
        : '<span style="color: #15803d;"><i class="fa-solid fa-bag-shopping"></i> Takeaway / Levantamento</span>';
    }

    if (deliveryBox) {
      if (isDelivery && order.entrega) {
        deliveryBox.style.display = 'block';
        if (deliveryAddressEl) {
          deliveryAddressEl.innerHTML = `
            <div><strong>Morada:</strong> ${order.entrega.morada}</div>
            ${order.entrega.pontoReferencia ? `<div style="color: var(--color-dark-subtle); font-size: 0.8rem;"><strong>Ref:</strong> ${order.entrega.pontoReferencia}</div>` : ''}
          `;
        }
        if (deliveryMapsLinkEl) {
          if (order.entrega.mapsUrl) {
            deliveryMapsLinkEl.innerHTML = `
              <a href="${order.entrega.mapsUrl}" target="_blank" rel="noopener" style="color: #059669; font-weight: 700; text-decoration: underline;">
                <i class="fa-solid fa-map-location-dot"></i> Ver Coordenadas no Google Maps
              </a>
            `;
          } else {
            deliveryMapsLinkEl.innerHTML = '';
          }
        }
      } else {
        deliveryBox.style.display = 'none';
      }
    }

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
