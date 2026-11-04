// ====================================================================
// CARIBIA LABS - SOFTWARE FACTORY & PLATAFORMA DE AUTOMATIZACIÓN
// Interacciones Dinámicas, Showroom Interactivo y Calculadora de Ahorro
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTemplateTabs();
  initShowroom();
  initCalculator();
  initHeroChatLoop();
  initLeadForm();
});

// ====================================================================
// 1. SHOWROOM INTERACTIVO (SIMULADOR DE CATÁLOGO & CONTROL DE STOCK)
// ====================================================================
function initShowroom() {
  const variantBtns = document.querySelectorAll('#demo-variants-btns .variant-btn');
  const stockBadge = document.getElementById('demo-stock-badge');
  const prodPriceEl = document.getElementById('demo-prod-price');
  const btnPayMp = document.getElementById('btn-pay-mp');
  const btnPayAlias = document.getElementById('btn-pay-alias');
  const checkoutBtnText = document.getElementById('checkout-btn-text');
  const btnSimularCompra = document.getElementById('btn-simular-compra');
  const orderSimModal = document.getElementById('order-sim-modal');
  const btnCloseSimModal = document.getElementById('btn-close-sim-modal');
  const orderSimDesc = document.getElementById('order-sim-desc');

  let currentStock = 3;
  let currentPrice = 38000;
  let selectedMethod = 'mp'; // 'mp' or 'alias'
  let currentVariant = 'Negro Mate';

  // Cambio de variante / talle
  variantBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      variantBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentVariant = btn.getAttribute('data-variant');
      currentStock = parseInt(btn.getAttribute('data-stock'), 10);
      currentPrice = parseInt(btn.getAttribute('data-price'), 10);

      updateProductState();
    });
  });

  // Cambio de método de pago
  if (btnPayMp && btnPayAlias) {
    btnPayMp.addEventListener('click', () => {
      selectedMethod = 'mp';
      btnPayMp.classList.add('active');
      btnPayAlias.classList.remove('active');
      updatePriceDisplay();
    });

    btnPayAlias.addEventListener('click', () => {
      selectedMethod = 'alias';
      btnPayAlias.classList.add('active');
      btnPayMp.classList.remove('active');
      updatePriceDisplay();
    });
  }

  function updateProductState() {
    if (currentStock > 0) {
      stockBadge.textContent = `Quedan ${currentStock} en stock`;
      stockBadge.style.background = 'rgba(16, 185, 129, 0.9)';
      btnSimularCompra.disabled = false;
      btnSimularCompra.style.opacity = '1';
      btnSimularCompra.style.cursor = 'pointer';
    } else {
      stockBadge.textContent = '¡Agotado!';
      stockBadge.style.background = 'rgba(239, 68, 68, 0.9)';
      btnSimularCompra.disabled = true;
      btnSimularCompra.style.opacity = '0.5';
      btnSimularCompra.style.cursor = 'not-allowed';
    }
    updatePriceDisplay();
  }

  function updatePriceDisplay() {
    if (currentStock === 0) {
      prodPriceEl.textContent = `$${currentPrice.toLocaleString('es-AR')} ARS`;
      checkoutBtnText.textContent = 'Producto Agotado en esta opción';
      return;
    }

    if (selectedMethod === 'alias') {
      const discounted = Math.round(currentPrice * 0.9);
      prodPriceEl.innerHTML = `<span style="text-decoration: line-through; font-size: 0.8em; color: #94a3b8; margin-right: 6px;">$${currentPrice.toLocaleString('es-AR')}</span> $${discounted.toLocaleString('es-AR')} ARS`;
      checkoutBtnText.textContent = `Pagar con Transferencia Alias ($${discounted.toLocaleString('es-AR')} ARS - 10% OFF)`;
    } else {
      prodPriceEl.textContent = `$${currentPrice.toLocaleString('es-AR')} ARS`;
      checkoutBtnText.textContent = `Comprar con Mercado Pago ($${currentPrice.toLocaleString('es-AR')} ARS)`;
    }
  }

  // Simulación de clic en comprar
  if (btnSimularCompra) {
    btnSimularCompra.addEventListener('click', () => {
      if (currentStock <= 0) return;

      const finalPrice = selectedMethod === 'alias' ? Math.round(currentPrice * 0.9) : currentPrice;
      const methodText = selectedMethod === 'alias' ? 'Transferencia Bancaria (Alias)' : 'Mercado Pago (Tarjeta/Cuotas)';

      orderSimDesc.innerHTML = `
        <strong>Opción:</strong> ${currentVariant}<br>
        <strong>Total:</strong> $${finalPrice.toLocaleString('es-AR')} ARS (${methodText})<br>
        <strong>Notificación:</strong> Se descontó 1 unidad de stock y se envió el detalle estructurado a tu WhatsApp.
      `;

      orderSimModal.classList.remove('hidden');
    });
  }

  if (btnCloseSimModal) {
    btnCloseSimModal.addEventListener('click', () => {
      orderSimModal.classList.add('hidden');
    });
  }
}

// ====================================================================
// 2. CALCULADORA DE AHORRO & IMPACTO COMERCIAL
// ====================================================================
function initCalculator() {
  const sliderMsg = document.getElementById('slider-mensajes');
  const sliderHoras = document.getElementById('slider-horas');
  const valMsg = document.getElementById('val-mensajes');
  const valHoras = document.getElementById('val-horas');
  const resHoras = document.getElementById('res-horas');
  const resVentas = document.getElementById('res-ventas');
  const resSolucion = document.getElementById('res-solucion');

  if (!sliderMsg || !sliderHoras) return;

  function recalculate() {
    const mensajes = parseInt(sliderMsg.value, 10);
    const horas = parseInt(sliderHoras.value, 10);

    valMsg.textContent = `${mensajes} mensajes/día`;
    valHoras.textContent = `${horas} ${horas === 1 ? 'hora' : 'horas'}/día`;

    // 22 días hábiles de trabajo al mes
    const horasRecuperadas = Math.round(horas * 22 * 0.85); // ahorra el 85% de las tareas manuales
    resHoras.textContent = `${horasRecuperadas} hs`;

    // Estimación de aumento de ventas según volumen de consultas
    let aumentoVentas = 20;
    if (mensajes >= 80) aumentoVentas = 42;
    else if (mensajes >= 50) aumentoVentas = 35;
    else if (mensajes >= 30) aumentoVentas = 28;
    else aumentoVentas = 20;

    resVentas.textContent = `+${aumentoVentas}%`;

    // Recomendación dinámica
    if (mensajes >= 70) {
      resSolucion.textContent = 'Catálogo con Stock + Bot de WhatsApp con IA + Pasarela Mercado Pago Automática';
    } else if (mensajes >= 30) {
      resSolucion.textContent = 'Catálogo Web Interactivo + Checkout Doble Vía (Mercado Pago y Alias)';
    } else {
      resSolucion.textContent = 'Página Web con Catálogo Inteligente y Pedidos Directos a WhatsApp';
    }
  }

  sliderMsg.addEventListener('input', recalculate);
  sliderHoras.addEventListener('input', recalculate);
  recalculate();
}

// ====================================================================
// 3. ANIMACIÓN EN BUCLE DEL CHAT DE WHATSAPP (HERO MOCKUP)
// ====================================================================
function initHeroChatLoop() {
  const chatContainer = document.getElementById('hero-chat-container');
  if (!chatContainer) return;

  // El chat ya está renderizado en el HTML con contenido realista,
  // agregamos una suave animación de pulso y scroll interactivo si el usuario pasa el mouse
  chatContainer.addEventListener('mouseenter', () => {
    chatContainer.style.overflowY = 'auto';
  });
}

// ====================================================================
// 4. FORMULARIO DE DIAGNÓSTICO GRATUITO Y ENVÍO A WHATSAPP
// ====================================================================
function initLeadForm() {
  const form = document.getElementById('lead-form');
  const feedback = document.getElementById('form-feedback');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const business = document.getElementById('contact-business').value.trim();
    const rubro = document.getElementById('contact-rubro').value;
    const phone = document.getElementById('contact-phone').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !business || !phone || !message) {
      showFeedback('Por favor completa todos los campos requeridos.', 'error');
      return;
    }

    // Mensaje formateado para abrir en WhatsApp oficial
    const wspText = `¡Hola CaribIA Labs! Quiero solicitar un Diagnóstico Gratuito para mi negocio:
- Nombre: ${name}
- Negocio: ${business}
- Rubro: ${rubro}
- WhatsApp: ${phone}
- Tarea manual a optimizar: ${message}`;

    const encodedText = encodeURIComponent(wspText);
    const wspUrl = `https://wa.me/5491154188294?text=${encodedText}`;

    showFeedback('¡Excelente! Abriendo WhatsApp con los datos de tu consulta...', 'success');

    // Redirigir a WhatsApp después de 1 segundo
    setTimeout(() => {
      window.open(wspUrl, '_blank');
      form.reset();
    }, 1200);
  });

  function showFeedback(text, type) {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.classList.remove('hidden', 'bg-rose-500/20', 'text-rose-400', 'bg-emerald-500/20', 'text-emerald-400');
    
    if (type === 'error') {
      feedback.classList.add('bg-rose-500/20', 'text-rose-400', 'border', 'border-rose-500/30');
    } else {
      feedback.classList.add('bg-emerald-500/20', 'text-emerald-400', 'border', 'border-emerald-500/30');
    }
  }
}


// ====================================================================
// 5. CONTROLADOR DE SUB-PESTAÑAS (EJEMPLOS Y PLANTILLAS)
// ====================================================================
function initTemplateTabs() {
  const tabBtns = document.querySelectorAll('.template-tab-btn');
  const panes = document.querySelectorAll('.template-tabs-content .tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      panes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.remove('hidden');
          pane.classList.add('active');
        } else {
          pane.classList.add('hidden');
          pane.classList.remove('active');
        }
      });
    });
  });
}
