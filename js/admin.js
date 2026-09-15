/**
 * TAKE AWAY RUI JÚNIOR - PAINEL ADMINISTRATIVO (ADMIN.JS)
 * Gestão de Dashboard, Pedidos com alteração de estados, Produtos, Categorias e Horários.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const AdminApp = {
    currentView: 'dashboard',
    currentFilter: 'ALL',
    editingProductId: null,

    init() {
      this.bindNavEvents();
      this.bindOrderEvents();
      this.bindProductEvents();
      this.bindCategoryEvents();
      this.bindHoursEvents();
      this.bindMobileSidebar();

      // Escutar atualizações do storage
      window.addEventListener('takeaway:orders-updated', () => {
        if (this.currentView === 'dashboard') this.renderDashboard();
        if (this.currentView === 'orders') this.renderOrders();
      });

      window.addEventListener('takeaway:products-updated', () => {
        if (this.currentView === 'products') this.renderProducts();
      });

      window.addEventListener('storage', (event) => {
        if (event.key === 'takeaway_orders') {
          if (this.currentView === 'dashboard') this.renderDashboard();
          if (this.currentView === 'orders') this.renderOrders();
        }
        if (event.key === 'takeaway_products' && this.currentView === 'products') this.renderProducts();
        if (event.key === 'takeaway_categories' && (this.currentView === 'categories' || this.currentView === 'products')) {
          if (this.currentView === 'categories') this.renderCategories();
          if (this.currentView === 'products') this.renderProducts();
        }
        if (event.key === 'takeaway_settings' && this.currentView === 'hours') this.renderHours();
      });

      // Renderização da view inicial
      this.switchView('dashboard');
    },

    // ----------------------------------------------------------------------
    // NAVEGAÇÃO & SIDEBAR
    // ----------------------------------------------------------------------
    bindNavEvents() {
      const navLinks = document.querySelectorAll('[data-admin-view]');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const view = link.dataset.adminView;
          this.switchView(view);
          this.closeMobileSidebar();
        });
      });
    },

    bindMobileSidebar() {
      const toggleBtn = document.getElementById('adminSidebarToggle');
      const sidebar = document.getElementById('adminSidebar');
      const overlay = document.getElementById('adminSidebarOverlay');

      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
          sidebar.classList.toggle('is-active');
          if (overlay) overlay.classList.toggle('is-active');
        });
      }

      if (overlay) {
        overlay.addEventListener('click', () => this.closeMobileSidebar());
      }
    },

    closeMobileSidebar() {
      const sidebar = document.getElementById('adminSidebar');
      const overlay = document.getElementById('adminSidebarOverlay');
      if (sidebar) sidebar.classList.remove('is-active');
      if (overlay) overlay.classList.remove('is-active');
    },

    switchView(viewName) {
      this.currentView = viewName;

      // Atualizar links ativos
      document.querySelectorAll('[data-admin-view]').forEach(link => {
        if (link.dataset.adminView === viewName) {
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });

      // Alternar secções
      document.querySelectorAll('.admin-view-section').forEach(sec => {
        sec.style.display = 'none';
      });

      const targetSec = document.getElementById(`view-${viewName}`);
      if (targetSec) {
        targetSec.style.display = 'block';
      }

      // Renderizar conteúdo da secção
      if (viewName === 'dashboard') this.renderDashboard();
      if (viewName === 'orders') this.renderOrders();
      if (viewName === 'products') this.renderProducts();
      if (viewName === 'categories') this.renderCategories();
      if (viewName === 'hours') this.renderHours();
    },

    // ----------------------------------------------------------------------
    // 1. DASHBOARD
    // ----------------------------------------------------------------------
    renderDashboard() {
      const orders = StorageService.getOrders();
      const todayStr = new Date().toISOString().split('T')[0];

      // Filtrar pedidos de hoje
      const todayOrders = orders.filter(o => o.data && o.data.startsWith(todayStr));

      const countTotalToday = todayOrders.length;
      const countNew = orders.filter(o => o.estado === 'NOVO').length;
      const countPrep = orders.filter(o => o.estado === 'EM_PREPARACAO').length;
      const countReady = orders.filter(o => o.estado === 'PRONTO').length;
      const countPickedUp = orders.filter(o => o.estado === 'LEVANTADO').length;
      
      const totalRevenueToday = todayOrders
        .filter(o => o.estado !== 'CANCELADO')
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      // Atualizar métricas
      document.getElementById('statTodayOrders').textContent = countTotalToday;
      document.getElementById('statNewOrders').textContent = countNew;
      document.getElementById('statPrepOrders').textContent = countPrep;
      document.getElementById('statReadyOrders').textContent = countReady;
      document.getElementById('statPickedUpOrders').textContent = countPickedUp;
      document.getElementById('statTodayRevenue').textContent = `${totalRevenueToday} MZN`;

      // Renderizar tabela de pedidos recentes (últimos 5)
      const recentList = document.getElementById('dashRecentOrdersList');
      if (recentList) {
        const recentOrders = orders.slice(0, 5);
        if (recentOrders.length === 0) {
          recentList.innerHTML = `
            <tr>
              <td colspan="6" class="table-empty-msg">Não existem pedidos ainda.</td>
            </tr>
          `;
        } else {
          recentList.innerHTML = recentOrders.map(o => `
            <tr>
              <td><strong>${o.id}</strong></td>
              <td>${o.cliente.nome}</td>
              <td>${o.produtos.reduce((acc, p) => acc + p.quantity, 0)} itens</td>
              <td><strong>${o.total} MZN</strong></td>
              <td><span class="status-badge status-${o.estado.toLowerCase().replace('_', '-')}">${this.getStatusLabel(o.estado)}</span></td>
              <td>
                <button type="button" class="btn btn-sm btn-admin-table" data-action="manage-order" data-id="${o.id}">
                  <i class="fa-solid fa-eye"></i> Ver
                </button>
              </td>
            </tr>
          `).join('');

          recentList.querySelectorAll('[data-action="manage-order"]').forEach(btn => {
            btn.addEventListener('click', () => this.openOrderModal(btn.dataset.id));
          });
        }
      }
    },

    // ----------------------------------------------------------------------
    // 2. PEDIDOS
    // ----------------------------------------------------------------------
    bindOrderEvents() {
      // Filtros de estado
      const filterBtns = document.querySelectorAll('[data-order-filter]');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          this.currentFilter = btn.dataset.orderFilter;
          this.renderOrders();
        });
      });

      // Busca de pedidos
      const searchInput = document.getElementById('adminOrderSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', () => this.renderOrders());
      }

      // Modal de Gestão de Pedido
      const orderModal = document.getElementById('adminOrderModal');
      const closeOrderModal = document.getElementById('adminOrderModalClose');
      if (closeOrderModal && orderModal) {
        closeOrderModal.addEventListener('click', () => {
          orderModal.classList.remove('is-active');
        });
      }
    },

    renderOrders() {
      const ordersContainer = document.getElementById('adminOrdersTableBody');
      const searchInput = document.getElementById('adminOrderSearchInput');
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

      let orders = StorageService.getOrders();

      // Aplicar filtro de estado
      if (this.currentFilter !== 'ALL') {
        orders = orders.filter(o => o.estado === this.currentFilter);
      }

      // Aplicar busca
      if (query) {
        orders = orders.filter(o => 
          o.id.toLowerCase().includes(query) ||
          o.cliente.nome.toLowerCase().includes(query) ||
          o.cliente.telefone.toLowerCase().includes(query)
        );
      }

      if (!ordersContainer) return;

      if (orders.length === 0) {
        ordersContainer.innerHTML = `
          <tr>
            <td colspan="7" class="table-empty-msg">Nenhum pedido encontrado para este filtro.</td>
          </tr>
        `;
        return;
      }

      ordersContainer.innerHTML = orders.map(o => {
        const dateFormatted = new Date(o.data).toLocaleString('pt-PT', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        const itemCount = o.produtos.reduce((acc, p) => acc + p.quantity, 0);

        return `
          <tr>
            <td><strong>${o.id}</strong></td>
            <td>
              <div class="client-cell">
                <span class="client-name">${o.cliente.nome}</span>
                <span class="client-tel">${o.cliente.telefone}</span>
              </div>
            </td>
            <td>${itemCount} itens</td>
            <td><strong>${o.total} MZN</strong></td>
            <td><span class="payment-tag">${o.pagamento}</span></td>
            <td><span class="status-badge status-${o.estado.toLowerCase().replace('_', '-')}">${this.getStatusLabel(o.estado)}</span></td>
            <td>
              <button type="button" class="btn btn-sm btn-admin-table" data-action="manage-order" data-id="${o.id}">
                <i class="fa-solid fa-pen-to-square"></i> Gerir
              </button>
            </td>
          </tr>
        `;
      }).join('');

      ordersContainer.querySelectorAll('[data-action="manage-order"]').forEach(btn => {
        btn.addEventListener('click', () => this.openOrderModal(btn.dataset.id));
      });
    },

    openOrderModal(orderId) {
      const order = StorageService.getOrderById(orderId);
      if (!order) return;

      const modal = document.getElementById('adminOrderModal');
      const detailsContainer = document.getElementById('adminOrderModalDetails');
      const statusSelector = document.getElementById('adminOrderStatusSelect');
      const saveStatusBtn = document.getElementById('adminSaveStatusBtn');

      if (!modal || !detailsContainer) return;

      const dateFormatted = new Date(order.data).toLocaleString('pt-PT');

      detailsContainer.innerHTML = `
        <div class="order-modal-header-info">
          <div>
            <h3>Pedido ${order.id}</h3>
            <span class="order-date">${dateFormatted}</span>
          </div>
          <span class="status-badge status-${order.estado.toLowerCase().replace('_', '-')}">
            ${this.getStatusLabel(order.estado)}
          </span>
        </div>

        <div class="order-modal-grid">
          <div class="order-modal-block">
            <h4>Dados do Cliente</h4>
            <p><strong>Nome:</strong> ${order.cliente.nome}</p>
            <p><strong>Telefone:</strong> ${order.cliente.telefone}</p>
            <p><strong>Tipo:</strong> Takeaway / Levantamento</p>
            <p><strong>Pagamento:</strong> ${order.pagamento}</p>
            ${order.observacoes ? `<p><strong>Observações:</strong> ${order.observacoes}</p>` : ''}
          </div>

          <div class="order-modal-block">
            <h4>Itens do Pedido</h4>
            <div class="order-modal-items">
              ${order.produtos.map(p => `
                <div class="modal-item-row">
                  <span>${p.quantity}x ${p.nome}</span>
                  <strong>${p.preco * p.quantity} MZN</strong>
                </div>
              `).join('')}
            </div>
            <div class="modal-total-row">
              <span>Total:</span>
              <strong>${order.total} MZN</strong>
            </div>
          </div>
        </div>
      `;

      if (statusSelector) {
        statusSelector.value = order.estado;
      }

      if (saveStatusBtn) {
        saveStatusBtn.onclick = () => {
          const newStatus = statusSelector.value;
          StorageService.updateOrderStatus(order.id, newStatus);
          Toast.show(`Estado do pedido ${order.id} alterado para ${this.getStatusLabel(newStatus)}.`, 'success');
          modal.classList.remove('is-active');
          this.renderOrders();
          this.renderDashboard();
        };
      }

      modal.classList.add('is-active');
    },

    // ----------------------------------------------------------------------
    // 3. PRODUTOS
    // ----------------------------------------------------------------------
    bindProductEvents() {
      const addBtn = document.getElementById('adminAddProductBtn');
      const modal = document.getElementById('adminProductModal');
      const closeBtn = document.getElementById('adminProductModalClose');
      const form = document.getElementById('adminProductForm');

      if (addBtn) {
        addBtn.addEventListener('click', () => {
          this.editingProductId = null;
          if (form) form.reset();
          document.getElementById('adminProductModalTitle').textContent = 'Adicionar Novo Produto';
          modal.classList.add('is-active');
        });
      }

      if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.remove('is-active'));
      }

      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleSaveProduct();
        });
      }
    },

    renderProducts() {
      const grid = document.getElementById('adminProductsGrid');
      const products = StorageService.getProducts();

      this.renderCategoryOptions();

      if (!grid) return;

      if (products.length === 0) {
        grid.innerHTML = '<p class="empty-grid-msg">Não existem produtos.</p>';
        return;
      }

      grid.innerHTML = products.map(p => `
        <div class="admin-product-card ${p.disponivel ? '' : 'is-unavailable'}">
          <div class="admin-product-img-box">
            <img src="${p.imagem}" alt="${p.nome}">
            <span class="product-status-tag ${p.disponivel ? 'tag-available' : 'tag-unavailable'}">
              ${p.disponivel ? 'Disponível' : 'Indisponível'}
            </span>
          </div>
          <div class="admin-product-body">
            <span class="product-category-tag">${p.categoria}</span>
            <h4 class="admin-product-title">${p.nome}</h4>
            <p class="admin-product-desc">${p.descricao}</p>
            <div class="admin-product-footer">
              <span class="admin-product-price">${p.preco} MZN</span>
              <div class="admin-product-actions">
                <button type="button" class="btn btn-sm btn-secondary" data-action="edit-product" data-id="${p.id}" title="Editar">
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger" data-action="delete-product" data-id="${p.id}" title="Excluir">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      grid.querySelectorAll('[data-action="edit-product"]').forEach(btn => {
        btn.addEventListener('click', () => this.openEditProductModal(btn.dataset.id));
      });

      grid.querySelectorAll('[data-action="delete-product"]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Tem a certeza que deseja remover este produto?')) {
            StorageService.deleteProduct(btn.dataset.id);
            Toast.show('Produto removido com sucesso.', 'info');
            this.renderProducts();
          }
        });
      });
    },

    openEditProductModal(productId) {
      const product = StorageService.getProductById(productId);
      if (!product) return;

      this.editingProductId = productId;
      document.getElementById('adminProductModalTitle').textContent = 'Editar Produto';
      document.getElementById('prodNameInput').value = product.nome;
      document.getElementById('prodDescInput').value = product.descricao;
      document.getElementById('prodPriceInput').value = product.preco;
      document.getElementById('prodCategorySelect').value = product.categoria;
      document.getElementById('prodImgInput').value = product.imagem;
      document.getElementById('prodAvailableInput').checked = product.disponivel;

      const modal = document.getElementById('adminProductModal');
      if (modal) modal.classList.add('is-active');
    },

    handleSaveProduct() {
      const nome = document.getElementById('prodNameInput').value.trim();
      const descricao = document.getElementById('prodDescInput').value.trim();
      const preco = Number(document.getElementById('prodPriceInput').value);
      const categoria = document.getElementById('prodCategorySelect').value;
      const imagem = document.getElementById('prodImgInput').value.trim() || 'assets/imgs/menu/men1.png';
      const disponivel = document.getElementById('prodAvailableInput').checked;

      if (!nome || !descricao || !Number.isFinite(preco) || preco <= 0) {
        Toast.show('Por favor preencha os campos obrigatórios.', 'error');
        return;
      }

      const productData = {
        id: this.editingProductId || 'prod-' + Date.now(),
        nome,
        descricao,
        preco,
        categoria,
        imagem,
        disponivel
      };

      StorageService.saveOrUpdateProduct(productData);
      Toast.show(`Produto "${nome}" guardado com sucesso!`, 'success');

      const modal = document.getElementById('adminProductModal');
      if (modal) modal.classList.remove('is-active');

      this.renderProducts();
    },

    // ----------------------------------------------------------------------
    // 4. CATEGORIAS
    // ----------------------------------------------------------------------
    bindCategoryEvents() {
      const form = document.getElementById('adminCategoryForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = document.getElementById('adminCategoryNameInput');
          const nome = input ? input.value.trim() : '';
          if (!nome) return;

          const id = nome.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          StorageService.saveOrUpdateCategory({ id, nome, ativo: true });
          Toast.show(`Categoria "${nome}" adicionada.`, 'success');
          if (input) input.value = '';
          this.renderCategories();
        });
      }
    },

    renderCategories() {
      const list = document.getElementById('adminCategoriesList');
      const categories = StorageService.getCategories();

      if (!list) return;

      this.renderCategoryOptions();

      list.innerHTML = categories.map(c => `
        <div class="category-item-card">
          <div>
            <strong>${c.nome}</strong>
            <span class="category-slug">(${c.id})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button type="button" class="btn btn-sm btn-secondary" data-action="edit-category" data-id="${c.id}" title="Editar categoria">
              <i class="fa-solid fa-pen"></i>
            </button>
            <label class="toggle-switch">
              <input type="checkbox" data-category-id="${c.id}" ${c.ativo ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `).join('');

      list.querySelectorAll('[data-action="edit-category"]').forEach(button => {
        button.addEventListener('click', () => {
          const category = categories.find(item => item.id === button.dataset.id);
          const name = category ? window.prompt('Nome da categoria:', category.nome) : '';
          if (!category || !name || !name.trim()) return;
          category.nome = name.trim();
          StorageService.saveCategories(categories);
          Toast.show('Categoria actualizada.', 'success');
          this.renderCategories();
        });
      });

      list.querySelectorAll('input[data-category-id]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const catId = checkbox.dataset.categoryId;
          const cat = categories.find(c => c.id === catId);
          if (cat) {
            cat.ativo = checkbox.checked;
            StorageService.saveCategories(categories);
            Toast.show(`Categoria "${cat.nome}" ${cat.ativo ? 'ativada' : 'desativada'}.`, 'info');
          }
        });
      });
    },

    renderCategoryOptions() {
      const select = document.getElementById('prodCategorySelect');
      if (!select) return;
      const currentValue = select.value;
      const categories = StorageService.getCategories();
      select.innerHTML = categories
        .filter(category => category.ativo || category.id === currentValue)
        .map(category => `<option value="${category.id}">${category.nome}</option>`)
        .join('');
      if (categories.some(category => category.id === currentValue)) {
        select.value = currentValue;
      }
    },

    // ----------------------------------------------------------------------
    // 5. HORÁRIOS
    // ----------------------------------------------------------------------
    bindHoursEvents() {
      const saveBtn = document.getElementById('adminSaveHoursBtn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const hours = StorageService.getHours();
          const dayKeys = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

          dayKeys.forEach(day => {
            const openCheck = document.getElementById(`hours-${day}-open`);
            const openTime = document.getElementById(`hours-${day}-start`);
            const closeTime = document.getElementById(`hours-${day}-end`);

            if (hours[day]) {
              hours[day].aberto = openCheck ? openCheck.checked : true;
              hours[day].abertura = openTime ? openTime.value : '08:00';
              hours[day].fecho = closeTime ? closeTime.value : '22:00';
            }
          });

          StorageService.saveHours(hours);
          Toast.show('Horários de funcionamento atualizados com sucesso!', 'success');
        });
      }
    },

    renderHours() {
      const hours = StorageService.getHours();
      const dayKeys = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

      dayKeys.forEach(day => {
        const config = hours[day];
        if (!config) return;

        const openCheck = document.getElementById(`hours-${day}-open`);
        const openTime = document.getElementById(`hours-${day}-start`);
        const closeTime = document.getElementById(`hours-${day}-end`);

        if (openCheck) openCheck.checked = config.aberto;
        if (openTime) openTime.value = config.abertura;
        if (closeTime) closeTime.value = config.fecho;
      });
    },

    // ----------------------------------------------------------------------
    // UTILITÁRIOS
    // ----------------------------------------------------------------------
    getStatusLabel(status) {
      const map = {
        'NOVO': 'Novo',
        'CONFIRMADO': 'Confirmado',
        'EM_PREPARACAO': 'Em Preparação',
        'PRONTO': 'Pronto',
        'LEVANTADO': 'Levantado',
        'CANCELADO': 'Cancelado'
      };
      return map[status] || status;
    }
  };

  AdminApp.init();
});
