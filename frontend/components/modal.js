(() => {
    const globalTarget = typeof window !== 'undefined' ? window : globalThis;
    if (globalTarget?.Modal?.createModal) return;

    function createModal() {
        const overlay = document.createElement('div');
        overlay.className = 'app-modal hidden';
        overlay.innerHTML =
      '<div class="app-modal__backdrop"></div>' +
      '<div class="app-modal__dialog" role="dialog" aria-modal="true">' +
      '<button class="app-modal__close" type="button" aria-label="Close modal">×</button>' +
      '<div class="app-modal__content"></div>' +
      '</div>';
        document.body.appendChild(overlay);

        const content = overlay.querySelector('.app-modal__content');
        const closeButton = overlay.querySelector('.app-modal__close');
        const backdrop = overlay.querySelector('.app-modal__backdrop');
        let resolver = null;

        function close(value) {
            overlay.classList.add('hidden');
            if (content) content.innerHTML = '';
            const done = resolver;
            resolver = null;
            if (done) done(value);
        }

        closeButton?.addEventListener('click', () => close(null));
        backdrop?.addEventListener('click', () => close(null));
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !overlay.classList.contains('hidden')) {
                close(null);
            }
        });

        return {
            open(renderContent) {
                overlay.classList.remove('hidden');
                return new Promise((resolve) => {
                    resolver = resolve;
                    renderContent({ content, close });
                });
            },
            close,
            confirm({ title = 'Confirm', body = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', requireText = null } = {}) {
                return this.open(({ content, close }) => {
                    if (!content) {
                        close(null);
                        return;
                    }
                    content.innerHTML =
            '<div class="modal-header">' +
              '<h3>' + title + '</h3>' +
              (body ? '<p class="account-note">' + body + '</p>' : '') +
            '</div>' +
            (requireText
                ? '<div class="account-field"><label for="modal-confirm-input">Type <strong>' + requireText + '</strong> to confirm</label><input id="modal-confirm-input" type="text" autocomplete="off" /></div>'
                : '') +
            '<div class="modal-actions">' +
              '<button class="btn btn--primary" type="button" data-modal-confirm disabled>' + confirmLabel + '</button>' +
              '<button class="btn btn--ghost" type="button" data-modal-cancel>' + cancelLabel + '</button>' +
            '</div>';
                    const confirmBtn = content.querySelector('[data-modal-confirm]');
                    const cancelBtn = content.querySelector('[data-modal-cancel]');
                    const input = content.querySelector('#modal-confirm-input');
                    if (!requireText && confirmBtn) confirmBtn.disabled = false;
                    input?.addEventListener('input', () => {
                        if (!confirmBtn) return;
                        confirmBtn.disabled = input.value.trim() !== String(requireText);
                    });
                    confirmBtn?.addEventListener('click', () => close(true));
                    cancelBtn?.addEventListener('click', () => close(false));
                });
            }
        };
    }

    globalTarget.Modal = { ...(globalTarget.Modal || {}), createModal };
    globalTarget.createModal = createModal;
})();
