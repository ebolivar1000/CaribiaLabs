// ====================================================================
// AURA STUDIO - MOTOR SHOPIFY CLEAN AESTHETIC (INDUMENTARIA & MODA)
// Catálogo, Carrito Reactivo, Checkout y Modo Edición Rápida (CMS)
// ====================================================================

// Configuración de Tienda por Defecto (Persistente en localStorage)
const DEFAULT_CONFIG = {
  store_name: "AURA STUDIO",
  tagline: "BUENOS AIRES · INDUMENTARIA",
  whatsapp_phone: "5491154188294",
  bank_alias: "aura.studio.mp",
  bank_discount_percent: 15,
  free_shipping_threshold: 50000,
  shipping_cost: 3500
};

let storeConfig = JSON.parse(localStorage.getItem("aura_store_config")) || DEFAULT_CONFIG;

// Catálogo de Moda Inicial (Prendas 100% de Ropa y Estética Shopify)
const DEFAULT_FASHION_PRODUCTS = [
  {
    id: "aura-1",
    name: "Remera Oversize Heavyweight 24/1",
    category: "Remeras",
    description: "Confeccionada en algodón 100% peinado de alto gramaje (24/1). Corte holgado con hombros caídos y cuello cerrado en ribb de 3 cm. No encoge ni pierde color con los lavados.",
    price: 38000,
    compare_price: 44000,
    image: "assets/remera_oversize_negra.jpg",
    badge: "Bestseller",
    color: "Negro Carbón",
    variants: [
      { size: "S", stock: 3 },
      { size: "M", stock: 5 },
      { size: "L", stock: 2 },
      { size: "XL", stock: 0 }
    ]
  },
  {
    id: "aura-2",
    name: "Hoodie Boxy Fit French Terry",
    category: "Buzos",
    description: "Buzo con capucha confeccionado en frisa invisible pesada. Calce boxy fit ancho y ligeramente corto en cintura. Bolsillo canguro y puños con elástico grueso.",
    price: 68000,
    compare_price: 78000,
    image: "assets/hoodie_beige.jpg",
    badge: "Nuevo",
    color: "Arena / Crudo",
    variants: [
      { size: "S", stock: 2 },
      { size: "M", stock: 4 },
      { size: "L", stock: 3 },
      { size: "XL", stock: 1 }
    ]
  },
  {
    id: "aura-3",
    name: "Pantalón Cargo Wide Leg",
    category: "Pantalones",
    description: "Gabardina 100% algodón prelavada. Tiro medio-alto con caída recta amplia y 6 bolsillos utilitarios con solapa. Cintura ajustable con cordón interno.",
    price: 58000,
    compare_price: null,
    image: "assets/pantalon_cargo.jpg",
    badge: null,
    color: "Verde Militar",
    variants: [
      { size: "S", stock: 2 },
      { size: "M", stock: 0 },
      { size: "L", stock: 3 },
      { size: "XL", stock: 2 }
    ]
  },
  {
    id: "aura-4",
    name: "Campera Puffer Térmica Urbana",
    category: "Abrigos",
    description: "Relleno térmico siliconado ultra liviano y repelente al agua. Cuello alto acolchado, cierre metálico bidireccional y bolsillos laterales térmicos.",
    price: 95000,
    compare_price: 115000,
    image: "assets/campera_puffer.jpg",
    badge: "Sale -15%",
    color: "Negro Mate",
    variants: [
      { size: "S", stock: 1 },
      { size: "M", stock: 2 },
      { size: "L", stock: 0 },
      { size: "XL", stock: 1 }
    ]
  },
  {
    id: "aura-5",
    name: "Blazer Sastrero Oversize Unisex",
    category: "Abrigos",
    description: "Confeccionado en twill sastrero de caída fluida. Bolsillos con tapa, forro interior satinado al tono y botones frontales en carey.",
    price: 89000,
    compare_price: null,
    image: "assets/blazer_oversize.jpg",
    badge: "Tendencia",
    color: "Gris Melange",
    variants: [
      { size: "S", stock: 2 },
      { size: "M", stock: 3 },
      { size: "L", stock: 1 },
      { size: "XL", stock: 0 }
    ]
  },
  {
    id: "aura-6",
    name: "Vestido Midi en Lino Natural",
    category: "Remeras",
    description: "Lino puro prelavado de tacto suave. Silueta fluida evasé con tajos laterales sutiles y escote redondo limpio.",
    price: 62000,
    compare_price: 72000,
    image: "assets/vestido_lino.jpg",
    badge: "Exclusivo",
    color: "Beige Natural",
    variants: [
      { size: "S", stock: 3 },
      { size: "M", stock: 2 },
      { size: "L", stock: 1 },
      { size: "XL", stock: 0 }
    ]
  }
];

let products = JSON.parse(localStorage.getItem("aura_products")) || DEFAULT_FASHION_PRODUCTS;
let cart = JSON.parse(localStorage.getItem("aura_cart")) || [];

// Variables de estado
let isEditMode = false;
let currentFilter = "all";
let activeDetailProduct = null;
let activeDetailSize = null;
let selectedDelivery = "pickup"; // 'pickup' o 'ship'
let selectedPayment = "alias";   // 'alias' o 'mp'

document.addEventListener("DOMContentLoaded", () => {
  applyStoreConfig();
  renderProducts();
  updateCartUI();
  initEventListeners();
});

// ================= 1. RENDERIZADO DEL CATÁLOGO SHOPIFY =================
function renderProducts() {
  const container = document.getElementById("products-container");
  const searchQuery = document.getElementById("header-search-input").value.toLowerCase().trim();
  const counterText = document.getElementById("products-counter-text");
  const catTitle = document.getElementById("current-category-name");

  const filtered = products.filter(p => {
    let matchCat = true;
    if (currentFilter === "Sale") {
      matchCat = p.badge && p.badge.toLowerCase().includes("sale") || p.compare_price > p.price;
    } else if (currentFilter !== "all") {
      matchCat = p.category === currentFilter;
    }

    const matchSearch = p.name.toLowerCase().includes(searchQuery) ||
                        p.description.toLowerCase().includes(searchQuery) ||
                        p.variants.some(v => v.size.toLowerCase().includes(searchQuery));

    return matchCat && matchSearch;
  });

  counterText.textContent = `${filtered.length} ${filtered.length === 1 ? 'prenda' : 'prendas disponibles'}`;
  catTitle.textContent = currentFilter === "all" ? "Todas las Prendas" : currentFilter;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #888;">
        <p style="font-size: 1.2rem; font-weight: 700; color: #111;">No encontramos prendas en esta colección</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Prueba seleccionando otra categoría o borrando tu búsqueda.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const totalStock = p.variants.reduce((acc, v) => acc + v.stock, 0);
    const transferPrice = Math.round(p.price * (1 - storeConfig.bank_discount_percent / 100));
    const cuotaPrice = Math.round(p.price / 3);

    const variantsPillsHtml = p.variants.map(v => `
      <span class="mini-variant-pill ${v.stock === 0 ? 'out' : ''}">
        ${v.size} ${v.stock > 0 ? '' : '✕'}
      </span>
    `).join("");

    return `
      <article class="shopify-card">
        <div class="card-image-box" onclick="openDetailModal('${p.id}')">
          <img src="${p.image}" alt="${p.name}" class="card-product-img" loading="lazy" />
          
          <div class="badge-tag-overlay">
            ${p.badge ? `<span class="badge-sale">${p.badge}</span>` : ''}
            <span class="badge-stock-info">
              ${totalStock > 0 ? `Stock: ${totalStock} un.` : 'Agotado'}
            </span>
          </div>

          <!-- Botón de edición rápida si el modo comerciante está activo -->
          ${isEditMode ? `
            <button type="button" class="card-owner-edit-btn" onclick="event.stopPropagation(); openEditProductModal('${p.id}')">
              ✏️ Editar Prenda
            </button>
          ` : ''}
        </div>

        <div class="card-body">
          <span class="card-category">${p.category}</span>
          <h3 class="card-title" onclick="openDetailModal('${p.id}')">${p.name}</h3>
          
          <div class="card-price-group">
            <span class="price-main">$${p.price.toLocaleString("es-AR")} ARS</span>
            ${p.compare_price ? `<span class="price-compare">$${p.compare_price.toLocaleString("es-AR")}</span>` : ''}
            <span class="price-transfer-deal">
              $${transferPrice.toLocaleString("es-AR")} pagando con Transferencia (${storeConfig.bank_discount_percent}% OFF)
            </span>
          </div>

          <p class="installments-text">
            💳 <strong>3 cuotas fijas</strong> de $${cuotaPrice.toLocaleString("es-AR")} sin interés
          </p>

          <div class="card-variants-pills">
            ${variantsPillsHtml}
          </div>

          <button type="button" class="btn-card-quick-buy" onclick="openDetailModal('${p.id}')">
            ${totalStock > 0 ? 'Seleccionar Talle' : 'Agotado temporalmente'}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

// ================= 2. MODAL FICHA DE PRENDA ESTILO SHOPIFY =================
window.openDetailModal = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  activeDetailProduct = product;
  activeDetailSize = product.variants.find(v => v.stock > 0) || product.variants[0];

  document.getElementById("detail-modal-img").src = product.image;
  document.getElementById("detail-modal-title").textContent = product.name;
  document.getElementById("detail-modal-desc").textContent = product.description;
  document.getElementById("detail-modal-price").textContent = `$${product.price.toLocaleString("es-AR")} ARS`;
  
  const transferPrice = Math.round(product.price * (1 - storeConfig.bank_discount_percent / 100));
  document.getElementById("detail-modal-transfer-price").textContent = `$${transferPrice.toLocaleString("es-AR")} ARS con Transferencia (${storeConfig.bank_discount_percent}% OFF)`;
  
  const cuota = Math.round(product.price / 3);
  document.getElementById("detail-modal-cuotas").textContent = `$${cuota.toLocaleString("es-AR")}`;

  document.getElementById("selected-color-label").textContent = product.color || "Único";

  renderDetailSizes();
  document.getElementById("product-detail-modal").classList.remove("hidden");
};

function renderDetailSizes() {
  const container = document.getElementById("modal-sizes-buttons");
  const statusNotice = document.getElementById("modal-stock-status-text");
  const addBtn = document.getElementById("btn-add-to-cart-action");
  const buyBtn = document.getElementById("btn-buy-now-action");

  container.innerHTML = activeDetailProduct.variants.map(v => {
    const isSelected = activeDetailSize && activeDetailSize.size === v.size;
    const isOut = v.stock === 0;

    return `
      <button 
        type="button" 
        class="size-btn ${isSelected ? 'active' : ''} ${isOut ? 'disabled' : ''}"
        ${isOut ? 'disabled' : ''}
        onclick="selectDetailSize('${v.size}')"
      >
        ${v.size} (${v.stock > 0 ? `${v.stock} disp.` : 'Agotado'})
      </button>
    `;
  }).join("");

  if (activeDetailSize && activeDetailSize.stock > 0) {
    statusNotice.innerHTML = `✓ <strong>${activeDetailSize.stock} unidades disponibles</strong> en Talle ${activeDetailSize.size}. Despacho en 24hs.`;
    statusNotice.style.color = "var(--accent-green)";
    addBtn.disabled = false;
    buyBtn.disabled = false;
    addBtn.style.opacity = "1";
    buyBtn.style.opacity = "1";
  } else {
    statusNotice.innerHTML = `✕ <strong>Talle ${activeDetailSize ? activeDetailSize.size : ''} agotado</strong>. Suscríbete para recibir alerta de reposición.`;
    statusNotice.style.color = "var(--accent-sale)";
    addBtn.disabled = true;
    buyBtn.disabled = true;
    addBtn.style.opacity = "0.4";
    buyBtn.style.opacity = "0.4";
  }
}

window.selectDetailSize = function(sizeLabel) {
  activeDetailSize = activeDetailProduct.variants.find(v => v.size === sizeLabel);
  renderDetailSizes();
};

// ================= 3. CARRITO LATERAL & CHECKOUT =================
function addToCart(product, sizeObj, openDrawer = true) {
  if (!product || !sizeObj || sizeObj.stock === 0) return;

  const existingIdx = cart.findIndex(item => item.productId === product.id && item.size === sizeObj.size);

  if (existingIdx > -1) {
    if (cart[existingIdx].quantity < sizeObj.stock) {
      cart[existingIdx].quantity += 1;
    } else {
      alert(`Solo quedan ${sizeObj.stock} unidades en Talle ${sizeObj.size}.`);
      return;
    }
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: sizeObj.size,
      maxStock: sizeObj.stock,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  document.getElementById("product-detail-modal").classList.add("hidden");

  if (openDrawer) {
    openCartDrawer();
  }
}

function updateCartUI() {
  const bubble = document.getElementById("cart-counter-bubble");
  const drawerQty = document.getElementById("cart-drawer-qty");
  const list = document.getElementById("cart-items-list");
  const subtotalVal = document.getElementById("cart-subtotal-val");
  const discountRow = document.getElementById("cart-discount-row");
  const discountVal = document.getElementById("cart-discount-val");
  const shippingVal = document.getElementById("cart-shipping-val");
  const finalTotal = document.getElementById("cart-final-total");
  const installmentsText = document.getElementById("cart-installments-text");
  const freeShippingBar = document.getElementById("free-shipping-bar");
  const freeShippingMsg = document.getElementById("free-shipping-msg");

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  bubble.textContent = totalItems;
  drawerQty.textContent = `(${totalItems})`;

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Barra de envío gratis
  const remainingForFreeShip = Math.max(0, storeConfig.free_shipping_threshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / storeConfig.free_shipping_threshold) * 100));
  freeShippingBar.style.width = `${progressPercent}%`;

  if (remainingForFreeShip === 0) {
    freeShippingMsg.innerHTML = `🎉 <strong>¡Felicitaciones! Tienes Envío Gratis</strong>`;
  } else {
    freeShippingMsg.innerHTML = `¡Agrega <strong>$${remainingForFreeShip.toLocaleString("es-AR")}</strong> más para tener <strong>Envío Gratis</strong>!`;
  }

  if (cart.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 60px 10px; color: #888;">
        <p style="font-size: 1.1rem; font-weight: 700; color: #111;">Tu carrito está vacío</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Explora la nueva colección y agrega tus prendas favoritas.</p>
      </div>
    `;
    subtotalVal.textContent = "$0 ARS";
    discountVal.textContent = "-$0 ARS";
    finalTotal.textContent = "$0 ARS";
    installmentsText.textContent = "o en 3 cuotas sin interés con Mercado Pago";
    return;
  }

  list.innerHTML = cart.map((item, idx) => `
    <div class="cart-row-item">
      <img src="${item.image}" alt="${item.name}" class="cart-row-img" />
      <div class="cart-row-details">
        <h4 class="cart-row-title">${item.name}</h4>
        <span class="cart-row-variant">Talle: ${item.size}</span>
        <div class="cart-row-price">$${(item.price * item.quantity).toLocaleString("es-AR")} ARS</div>
        
        <div class="cart-qty-control">
          <button type="button" class="cart-qty-btn" onclick="changeQty(${idx}, -1)">−</button>
          <span style="font-size: 0.85rem; font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
          <button type="button" class="cart-qty-btn" onclick="changeQty(${idx}, 1)">+</button>
          <button type="button" style="background: none; border: none; font-size: 0.72rem; color: #b91c1c; margin-left: 8px; cursor: pointer;" onclick="removeItem(${idx})">Eliminar</button>
        </div>
      </div>
    </div>
  `).join("");

  // Descuentos y Envíos
  let discount = 0;
  if (selectedPayment === "alias") {
    discount = Math.round(subtotal * (storeConfig.bank_discount_percent / 100));
    discountRow.style.display = "flex";
    discountVal.textContent = `-$${discount.toLocaleString("es-AR")} ARS`;
  } else {
    discountRow.style.display = "none";
  }

  let shipping = 0;
  if (selectedDelivery === "ship") {
    shipping = subtotal >= storeConfig.free_shipping_threshold ? 0 : storeConfig.shipping_cost;
  }

  shippingVal.textContent = shipping === 0 ? "Gratis" : `+$${shipping.toLocaleString("es-AR")} ARS`;

  const total = subtotal - discount + shipping;
  subtotalVal.textContent = `$${subtotal.toLocaleString("es-AR")} ARS`;
  finalTotal.textContent = `$${total.toLocaleString("es-AR")} ARS`;

  const cuota = Math.round(total / 3);
  installmentsText.textContent = `o 3 cuotas sin interés de $${cuota.toLocaleString("es-AR")} con Mercado Pago`;
}

window.changeQty = function(idx, delta) {
  if (!cart[idx]) return;
  cart[idx].quantity += delta;
  if (cart[idx].quantity > cart[idx].maxStock) {
    cart[idx].quantity = cart[idx].maxStock;
    alert(`Solo quedan ${cart[idx].maxStock} unidades disponibles en este talle.`);
  }
  if (cart[idx].quantity <= 0) {
    cart.splice(idx, 1);
  }
  saveCart();
  updateCartUI();
};

window.removeItem = function(idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCartUI();
};

function saveCart() {
  localStorage.setItem("aura_cart", JSON.stringify(cart));
}

function openCartDrawer() {
  document.getElementById("cart-backdrop").classList.remove("hidden");
}

function closeCartDrawer() {
  document.getElementById("cart-backdrop").classList.add("hidden");
}

// ================= 4. FINALIZAR COMPRA POR WHATSAPP =================
function finishOrderWhatsApp() {
  if (cart.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const orderNumber = Math.floor(1000 + Math.random() * 9000);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discount = selectedPayment === "alias" ? Math.round(subtotal * (storeConfig.bank_discount_percent / 100)) : 0;
  const shipping = selectedDelivery === "ship" ? (subtotal >= storeConfig.free_shipping_threshold ? 0 : storeConfig.shipping_cost) : 0;
  const total = subtotal - discount + shipping;

  const paymentText = selectedPayment === "alias"
    ? `Transferencia Bancaria (Alias: ${storeConfig.bank_alias} con ${storeConfig.bank_discount_percent}% OFF)`
    : `Mercado Pago (3 cuotas sin interés)`;

  const deliveryText = selectedDelivery === "ship"
    ? `Envío a domicilio (${shipping === 0 ? 'Gratis por superar $50.000' : '+$3.500 ARS'})`
    : `Retiro sin cargo en Showroom (Palermo, CABA)`;

  const itemsList = cart.map(i => `• ${i.quantity}x ${i.name} [Talle: ${i.size}] - $${(i.price * i.quantity).toLocaleString("es-AR")}`).join("\n");

  const message = `🛍️ *PEDIDO #${orderNumber} - ${storeConfig.store_name}*
━━━━━━━━━━━━━━━━━━━━
${itemsList}
━━━━━━━━━━━━━━━━━━━━
📦 *Entrega:* ${deliveryText}
💳 *Pago:* ${paymentText}
💰 *TOTAL A ABONAR:* $${total.toLocaleString("es-AR")} ARS

Hola! Acabo de armar mi pedido en la tienda online. ¿Me confirmas la disponibilidad y los datos para finalizar el pago y coordinar el envío?`;

  const url = `https://wa.me/${storeConfig.whatsapp_phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");

  cart = [];
  saveCart();
  updateCartUI();
  closeCartDrawer();
}

// ================= 5. MODO COMERCIANTE (CMS / EDICIÓN EN VIVO) =================
function setupOwnerToolbar() {
  const toggleBtn = document.getElementById("btn-toggle-edit-mode");
  const addBtn = document.getElementById("btn-quick-add-product");
  const settingsBtn = document.getElementById("btn-open-settings");

  toggleBtn.addEventListener("click", () => {
    isEditMode = !isEditMode;
    toggleBtn.classList.toggle("active", isEditMode);
    document.getElementById("edit-mode-label").textContent = isEditMode ? "✓ Modo Edición ACTIVO" : "✏️ Activar Edición en Vivo";
    addBtn.classList.toggle("hidden", !isEditMode);
    renderProducts();
  });

  settingsBtn.addEventListener("click", () => {
    document.getElementById("setting-store-name").value = storeConfig.store_name;
    document.getElementById("setting-whatsapp").value = storeConfig.whatsapp_phone;
    document.getElementById("setting-alias").value = storeConfig.bank_alias;
    document.getElementById("setting-discount").value = storeConfig.bank_discount_percent;
    document.getElementById("settings-modal").classList.remove("hidden");
  });

  // Guardar configuración general
  document.getElementById("form-settings").addEventListener("submit", (e) => {
    e.preventDefault();
    storeConfig.store_name = document.getElementById("setting-store-name").value.trim();
    storeConfig.whatsapp_phone = document.getElementById("setting-whatsapp").value.trim();
    storeConfig.bank_alias = document.getElementById("setting-alias").value.trim();
    storeConfig.bank_discount_percent = parseInt(document.getElementById("setting-discount").value, 10);

    localStorage.setItem("aura_store_config", JSON.stringify(storeConfig));
    applyStoreConfig();
    renderProducts();
    updateCartUI();
    document.getElementById("settings-modal").classList.add("hidden");
    alert("¡Ajustes de tienda guardados con éxito!");
  });

  // Agregar Prenda Rápida
  addBtn.addEventListener("click", () => {
    openEditProductModal(null);
  });
}

function applyStoreConfig() {
  document.getElementById("store-brand-name").textContent = storeConfig.store_name;
  document.getElementById("footer-store-name").textContent = storeConfig.store_name;
  document.getElementById("store-meta-title").textContent = `${storeConfig.store_name} | Tienda Online de Ropa`;
}

window.openEditProductModal = function(productId) {
  const modal = document.getElementById("edit-product-modal");
  const modalTitle = document.getElementById("edit-modal-title");
  const form = document.getElementById("form-edit-product");
  const stockGrid = document.getElementById("edit-variants-stock-grid");

  let product = productId ? products.find(p => p.id === productId) : null;

  if (product) {
    modalTitle.textContent = `Editar: ${product.name}`;
    document.getElementById("edit-prod-id").value = product.id;
    document.getElementById("edit-prod-name").value = product.name;
    document.getElementById("edit-prod-price").value = product.price;
    document.getElementById("edit-prod-category").value = product.category;

    stockGrid.innerHTML = product.variants.map((v, i) => `
      <div style="background: #f1f5f9; padding: 6px; border-radius: 6px; text-align: center;">
        <label style="font-size: 0.72rem; font-weight: 700;">Talle ${v.size}</label>
        <input type="number" class="shopify-input" style="padding: 6px; text-align: center; margin-top: 4px;" data-size="${v.size}" value="${v.stock}" />
      </div>
    `).join("");
  } else {
    modalTitle.textContent = "Publicar Nueva Prenda";
    document.getElementById("edit-prod-id").value = "";
    document.getElementById("edit-prod-name").value = "";
    document.getElementById("edit-prod-price").value = "";
    document.getElementById("edit-prod-category").value = "Remeras";

    const standardSizes = ["S", "M", "L", "XL"];
    stockGrid.innerHTML = standardSizes.map(s => `
      <div style="background: #f1f5f9; padding: 6px; border-radius: 6px; text-align: center;">
        <label style="font-size: 0.72rem; font-weight: 700;">Talle ${s}</label>
        <input type="number" class="shopify-input" style="padding: 6px; text-align: center; margin-top: 4px;" data-size="${s}" value="3" />
      </div>
    `).join("");
  }

  modal.classList.remove("hidden");
};

// Guardar cambios de producto
document.getElementById("form-edit-product").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("edit-prod-id").value;
  const name = document.getElementById("edit-prod-name").value.trim();
  const price = parseInt(document.getElementById("edit-prod-price").value, 10);
  const category = document.getElementById("edit-prod-category").value;

  const stockInputs = document.querySelectorAll("#edit-variants-stock-grid input");
  const newVariants = [];
  stockInputs.forEach(inp => {
    newVariants.push({
      size: inp.getAttribute("data-size"),
      stock: parseInt(inp.value, 10) || 0
    });
  });

  if (id) {
    const prod = products.find(p => p.id === id);
    if (prod) {
      prod.name = name;
      prod.price = price;
      prod.category = category;
      prod.variants = newVariants;
    }
  } else {
    products.unshift({
      id: "aura-" + Date.now(),
      name,
      price,
      compare_price: null,
      category,
      description: "Prenda de diseño exclusivo confeccionada con los más altos estándares textiles.",
      image: "assets/remera_oversize_negra.jpg",
      badge: "Nuevo",
      color: "Negro",
      variants: newVariants
    });
  }

  localStorage.setItem("aura_products", JSON.stringify(products));
  renderProducts();
  document.getElementById("edit-product-modal").classList.add("hidden");
  alert("¡Prenda actualizada con éxito en la tienda!");
});

// ================= 6. INICIALIZACIÓN DE EVENTOS =================
function initEventListeners() {
  setupOwnerToolbar();

  // Filtros de Colección
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      currentFilter = link.getAttribute("data-filter");
      renderProducts();
    });
  });

  // Buscador Header
  const searchInput = document.getElementById("header-search-input");
  searchInput.addEventListener("input", renderProducts);

  // Drawer Carrito
  document.getElementById("open-cart-drawer").addEventListener("click", openCartDrawer);
  document.getElementById("close-cart-drawer").addEventListener("click", closeCartDrawer);

  // Selector Entrega en Carrito
  const btnPickup = document.getElementById("btn-delivery-pickup");
  const btnShip = document.getElementById("btn-delivery-ship");
  btnPickup.addEventListener("click", () => {
    selectedDelivery = "pickup";
    btnPickup.classList.add("active");
    btnShip.classList.remove("active");
    updateCartUI();
  });
  btnShip.addEventListener("click", () => {
    selectedDelivery = "ship";
    btnShip.classList.add("active");
    btnPickup.classList.remove("active");
    updateCartUI();
  });

  // Selector Pago en Carrito
  const btnAliasChoice = document.getElementById("btn-pay-alias-choice");
  const btnMpChoice = document.getElementById("btn-pay-mp-choice");
  btnAliasChoice.addEventListener("click", () => {
    selectedPayment = "alias";
    btnAliasChoice.classList.add("active");
    btnMpChoice.classList.remove("active");
    updateCartUI();
  });
  btnMpChoice.addEventListener("click", () => {
    selectedPayment = "mp";
    btnMpChoice.classList.add("active");
    btnAliasChoice.classList.remove("active");
    updateCartUI();
  });

  // Botón Comprar en WhatsApp
  document.getElementById("btn-checkout-whatsapp").addEventListener("click", finishOrderWhatsApp);

  // Modales
  document.getElementById("close-detail-modal").addEventListener("click", () => {
    document.getElementById("product-detail-modal").classList.add("hidden");
  });

  document.getElementById("btn-add-to-cart-action").addEventListener("click", () => {
    if (activeDetailProduct && activeDetailSize) {
      addToCart(activeDetailProduct, activeDetailSize, true);
    }
  });

  document.getElementById("btn-buy-now-action").addEventListener("click", () => {
    if (activeDetailProduct && activeDetailSize) {
      addToCart(activeDetailProduct, activeDetailSize, false);
      finishOrderWhatsApp();
    }
  });

  // Guía de talles
  document.getElementById("btn-open-size-guide").addEventListener("click", () => {
    document.getElementById("size-guide-modal").classList.remove("hidden");
  });
  document.getElementById("close-size-guide").addEventListener("click", () => {
    document.getElementById("size-guide-modal").classList.add("hidden");
  });

  // Cierre de modales de edición
  document.getElementById("close-edit-modal").addEventListener("click", () => {
    document.getElementById("edit-product-modal").classList.add("hidden");
  });
  document.getElementById("btn-cancel-edit").addEventListener("click", () => {
    document.getElementById("edit-product-modal").classList.add("hidden");
  });

  document.getElementById("close-settings-modal").addEventListener("click", () => {
    document.getElementById("settings-modal").classList.add("hidden");
  });
  document.getElementById("btn-cancel-settings").addEventListener("click", () => {
    document.getElementById("settings-modal").classList.add("hidden");
  });
}
