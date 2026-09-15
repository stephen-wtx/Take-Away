/**
 * TAKE AWAY RUI JÚNIOR - SISTEMA DE NOTIFICAÇÕES (TOAST)
 * Fornece feedback visual rápido e acessível para ações do utilizador.
 */

const Toast = {
  container: null,

  init() {
    if (!this.container) {
      let existing = document.getElementById('toastContainer');
      if (!existing) {
        existing = document.createElement('div');
        existing.id = 'toastContainer';
        existing.className = 'toast-container';
        existing.setAttribute('aria-live', 'polite');
        existing.setAttribute('aria-atomic', 'true');
        document.body.appendChild(existing);
      }
      this.container = existing;
    }
  },

  show(message, type = 'success', duration = 3000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    if (type === 'info') icon = 'fa-circle-info';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Fechar notificação">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    this.container.appendChild(toast);

    // Animar entrada
    requestAnimationFrame(() => {
      toast.classList.add('is-visible');
    });

    // Auto fechar
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  },

  dismiss(toast) {
    toast.classList.remove('is-visible');
    toast.addEventListener('transitionend', () => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    });
  }
};

window.Toast = Toast;
