/**
 * TAKE AWAY RUI JÚNIOR - CAMADA DE ARMAZENAMENTO (STORAGE SERVICE)
 * Abstração reutilizável de LocalStorage para Produtos, Carrinho, Pedidos, Categorias e Horários.
 */

const STORAGE_KEYS = {
  PRODUCTS: 'takeaway_products',
  CATEGORIES: 'takeaway_categories',
  ORDERS: 'takeaway_orders',
  CART: 'takeaway_cart',
  SETTINGS: 'takeaway_settings',
  ORDER_COUNTER: 'takeaway_order_counter'
};

const LEGACY_STORAGE_KEYS = {
  PRODUCTS: 'takeaway_rj_products',
  CATEGORIES: 'takeaway_rj_categories',
  ORDERS: 'takeaway_rj_orders',
  CART: 'takeaway_rj_cart',
  SETTINGS: 'takeaway_rj_hours',
  ORDER_COUNTER: 'takeaway_rj_order_counter'
};

function readStorageValue(key, legacyKey) {
  let value = localStorage.getItem(key);
  if (value === null && legacyKey) {
    value = localStorage.getItem(legacyKey);
    if (value !== null) localStorage.setItem(key, value);
  }
  return value;
}

const StorageService = {
  // ------------------------------------------------------------------------
  // PRODUTOS
  // ------------------------------------------------------------------------
  getProducts() {
    try {
      const data = readStorageValue(STORAGE_KEYS.PRODUCTS, LEGACY_STORAGE_KEYS.PRODUCTS);
      if (!data) {
        this.saveProducts(INITIAL_PRODUCTS);
        return INITIAL_PRODUCTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao obter produtos do storage:', e);
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products) {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      window.dispatchEvent(new CustomEvent('takeaway:products-updated', { detail: products }));
      return true;
    } catch (e) {
      console.error('Erro ao guardar produtos:', e);
      return false;
    }
  },

  getProductById(id) {
    const products = this.getProducts();
    return products.find(p => p.id === id) || null;
  },

  saveOrUpdateProduct(product) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = { ...products[index], ...product };
    } else {
      product.id = product.id || 'prod-' + Date.now();
      products.push(product);
    }
    this.saveProducts(products);
    return product;
  },

  deleteProduct(id) {
    let products = this.getProducts();
    products = products.filter(p => p.id !== id);
    this.saveProducts(products);
    return true;
  },

  // ------------------------------------------------------------------------
  // CATEGORIAS
  // ------------------------------------------------------------------------
  getCategories() {
    try {
      const data = readStorageValue(STORAGE_KEYS.CATEGORIES, LEGACY_STORAGE_KEYS.CATEGORIES);
      if (!data) {
        this.saveCategories(INITIAL_CATEGORIES);
        return INITIAL_CATEGORIES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao obter categorias:', e);
      return INITIAL_CATEGORIES;
    }
  },

  saveCategories(categories) {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      window.dispatchEvent(new CustomEvent('takeaway:categories-updated', { detail: categories }));
      return true;
    } catch (e) {
      console.error('Erro ao guardar categorias:', e);
      return false;
    }
  },

  saveOrUpdateCategory(category) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      categories[index] = { ...categories[index], ...category };
    } else {
      category.id = category.id || 'cat-' + Date.now();
      categories.push(category);
    }
    this.saveCategories(categories);
    return category;
  },

  // ------------------------------------------------------------------------
  // HORÁRIOS & ESTADO DA LOJA
  // ------------------------------------------------------------------------
  getSettings() {
    try {
      const data = readStorageValue(STORAGE_KEYS.SETTINGS, LEGACY_STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(INITIAL_HOURS);
        return INITIAL_HOURS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao obter horários:', e);
      return INITIAL_HOURS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent('takeaway:settings-updated', { detail: settings }));
      window.dispatchEvent(new CustomEvent('takeaway:hours-updated', { detail: settings }));
      return true;
    } catch (e) {
      console.error('Erro ao guardar horários:', e);
      return false;
    }
  },

  getHours() {
    return this.getSettings();
  },

  saveHours(hours) {
    return this.saveSettings(hours);
  },

  isStoreOpen() {
    const hours = this.getSettings();
    const now = new Date();
    const dayMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDayKey = dayMap[now.getDay()];
    const dayConfig = hours[currentDayKey];

    if (!dayConfig || !dayConfig.aberto) {
      return { open: false, reason: 'Fechado hoje', day: dayConfig?.dia || '' };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = dayConfig.abertura.split(':').map(Number);
    const [closeH, closeM] = dayConfig.fecho.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return { open: true, hours: `${dayConfig.abertura} - ${dayConfig.fecho}`, day: dayConfig.dia };
    } else {
      return { open: false, hours: `${dayConfig.abertura} - ${dayConfig.fecho}`, day: dayConfig.dia };
    }
  },

  // ------------------------------------------------------------------------
  // CARRINHO
  // ------------------------------------------------------------------------
  getCart() {
    try {
      const data = readStorageValue(STORAGE_KEYS.CART, LEGACY_STORAGE_KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Erro ao obter carrinho:', e);
      return [];
    }
  },

  saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('takeaway:cart-updated', { detail: cart }));
      return true;
    } catch (e) {
      console.error('Erro ao guardar carrinho:', e);
      return false;
    }
  },

  addToCart(product, quantity = 1) {
    if (!product || !product.disponivel) return false;
    const cart = this.getCart();
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        nome: product.nome,
        preco: product.preco,
        imagem: product.imagem,
        categoria: product.categoria,
        quantity: quantity
      });
    }

    this.saveCart(cart);
    return true;
  },

  updateCartQuantity(productId, delta) {
    let cart = this.getCart();
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== productId);
    }

    this.saveCart(cart);
  },

  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(i => i.id !== productId);
    this.saveCart(cart);
  },

  clearCart() {
    this.saveCart([]);
  },

  getCartTotals() {
    const cart = this.getCart();
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => acc + (item.preco * item.quantity), 0);
    return { count, subtotal, total: subtotal };
  },

  // ------------------------------------------------------------------------
  // PEDIDOS
  // ------------------------------------------------------------------------
  getOrders() {
    try {
      const data = readStorageValue(STORAGE_KEYS.ORDERS, LEGACY_STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Erro ao obter pedidos:', e);
      return [];
    }
  },

  saveOrders(orders) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent('takeaway:orders-updated', { detail: orders }));
      return true;
    } catch (e) {
      console.error('Erro ao guardar pedidos:', e);
      return false;
    }
  },

  getNextOrderNumber() {
    try {
      let counter = parseInt(readStorageValue(STORAGE_KEYS.ORDER_COUNTER, LEGACY_STORAGE_KEYS.ORDER_COUNTER), 10);
      if (isNaN(counter) || counter < 1000) {
        counter = 1000;
      }
      counter += 1;
      localStorage.setItem(STORAGE_KEYS.ORDER_COUNTER, counter.toString());
      return `#BG-${counter}`;
    } catch (e) {
      return `#BG-${Math.floor(1000 + Math.random() * 9000)}`;
    }
  },

  createOrder(orderData) {
    const orders = this.getOrders();
    const newOrder = {
      id: this.getNextOrderNumber(),
      cliente: {
        nome: orderData.nome || 'Cliente',
        telefone: orderData.telefone || ''
      },
      produtos: orderData.produtos || [],
      total: orderData.total || 0,
      tipo: orderData.tipo || 'takeaway',
      pagamento: orderData.pagamento || 'Dinheiro',
      observacoes: orderData.observacoes || '',
      estado: 'NOVO', // NOVO, CONFIRMADO, EM_PREPARACAO, PRONTO, LEVANTADO, CANCELADO
      data: new Date().toISOString(),
      criadoEm: new Date().toISOString()
    };

    orders.unshift(newOrder); // Mais recente no topo
    this.saveOrders(orders);
    return newOrder;
  },

  getOrderById(id) {
    if (!id) return null;
    const cleanId = id.trim().toUpperCase().replace('#', '');
    const orders = this.getOrders();
    return orders.find(o => o.id.toUpperCase().replace('#', '') === cleanId) || null;
  },

  updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId || o.id.replace('#', '') === String(orderId).replace('#', ''));
    if (!order) return false;

    order.estado = newStatus;
    order.atualizadoEm = new Date().toISOString();
    this.saveOrders(orders);
    return true;
  },

  updateOrder(orderId, updates) {
    const orders = this.getOrders();
    const order = orders.find(item => item.id === orderId || item.id.replace('#', '') === String(orderId).replace('#', ''));
    if (!order) return false;
    Object.assign(order, updates);
    order.atualizadoEm = new Date().toISOString();
    this.saveOrders(orders);
    return order;
  },

  updateProduct(productId, updates) {
    const products = this.getProducts();
    const product = products.find(item => item.id === productId);
    if (!product) return false;
    Object.assign(product, updates);
    this.saveProducts(products);
    return product;
  }
};

// Garantir as fontes iniciais na primeira abertura sem substituir dados existentes.
StorageService.getProducts();
StorageService.getCategories();
StorageService.getOrders();
StorageService.getCart();
StorageService.getSettings();
