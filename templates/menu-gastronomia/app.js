// ====================================================================
// FORNO & CO. - MOTOR DE MENÚ DIGITAL & COMANDAS PARA WHATSAPP
// ====================================================================

const REST_CONFIG = {
  name: "FORNO & CO.",
  whatsapp: "5491154188294",
  bank_alias: "forno.delivery.mp",
  discount_percent: 10,
  delivery_fee: 2500
};

const DEFAULT_DISHES = [
  {
    id: "dish-1",
    name: "Pizza Margherita D.O.P.",
    category: "Pizzas",
    description: "Salsa de tomate San Marzano italiano, mozzarella fior di latte, albahaca fresca y aceite de oliva virgen extra. Masa fermentada 48 horas.",
    price: 16500,
    image: "assets/pizza_margherita.jpg",
    badge: "Horno de Leña",
    available: true
  },
  {
    id: "dish-2",
    name: "Doble Smash Bacon Burger",
    category: "Burgers",
    description: "Doble medallón smash de 100g de carne de pastoreo, cuádruple queso cheddar fundido, panceta crocante y salsa especial en pan brioche tostado.",
    price: 14800,
    image: "assets/burger_smash.jpg",
    badge: "Bestseller",
    available: true
  },
  {
    id: "dish-3",
    name: "Papas Rústicas Trufadas",
    category: "Guarniciones",
    description: "Papas cortadas a mano crocantes con piel, aromatizadas con aceite de trufa blanca y lluvia abundante de queso parmesano rallado en el momento.",
    price: 7200,
    image: "assets/papas_rusticas.jpg",
    badge: "Para Compartir",
    available: true
  },
  {
    id: "dish-4",
    name: "Volcán de Chocolate & Crema",
    category: "Postres",
    description: "Bizcocho tibio de chocolate semi-amargo belga con centro líquido caliente, acompañado de bocha de helado de crema americana artesanal.",
    price: 6900,
    image: "assets/postre_volcan.jpg",
    badge: "Dulce Final",
    available: true
  }
];

let dishes = JSON.parse(localStorage.getItem("forno_dishes")) || DEFAULT_DISHES;
let cart = JSON.parse(localStorage.getItem("forno_cart")) || [];
let activeCat = "all";
let deliveryType = "home"; // 'home' o 'pickup'
let paymentType = "alias";  // 'alias' o 'mp'
let isFoodEditMode = false;

document.addEventListener("DOMContentLoaded", () => {
  renderDishes();
  updateCartUI();
  setupEvents();
});

function renderDishes() {
  const container = document.getElementById("dishes-container");
  const filtered = dishes.filter(d => activeCat === "all" || d.category === activeCat);

  container.innerHTML = filtered.map(d => {
    const aliasPrice = Math.round(d.price * (1 - REST_CONFIG.discount_percent / 100));

    return `
      <article class="dish-card">
        <div class="dish-img-wrap">
          <img src="${d.image}" alt="${d.name}" class="dish-img" loading="lazy" />
          <span class="dish-badge">${d.badge || d.category}</span>
          ${isFoodEditMode ? `
            <button type="button" class="dish-edit-pill" onclick="openEditDishModal('${d.id}')">
              ✏️ Editar
            </button>
          ` : ''}
        </div>
        <div class="dish-body">
          <h4 class="dish-title">${d.name}</h4>
          <p class="dish-desc">${d.description}</p>
          
          <div class="dish-price-row">
            <span class="dish-price">$${d.price.toLocaleString("es-AR")} ARS</span>
            <span class="dish-alias-discount">$${aliasPrice.toLocaleString("es-AR")} con Alias</span>
          </div>

          <button 
            type="button" 
            class="btn-add-dish ${!d.available ? 'out' : ''}" 
            ${!d.available ? 'disabled' : ''}
            onclick="addDishToCart('${d.id}')"
          >
            ${d.available ? '+ Agregar a Comanda' : 'Agotado por hoy'}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function addDishToCart(dishId) {
  const dish = dishes.find(d => d.id === dishId);
  if (!dish || !dish.available) return;

  const item = cart.find(i => i.id === dishId);
  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id: dish.id, name: dish.name, price: dish.price, image: dish.image, qty: 1 });
  }

  saveCart();
  updateCartUI();
  openCart();
}

function updateCartUI() {
  const counter = document.getElementById("cart-counter");
  const headerTotal = document.getElementById("cart-total-header");
  const itemsBox = document.getElementById("cart-items-box");
  const subtotalEl = document.getElementById("summary-subtotal");
  const discountRow = document.getElementById("row-discount");
  const discountEl = document.getElementById("summary-discount");
  const deliveryEl = document.getElementById("summary-delivery");
  const totalEl = document.getElementById("summary-total");

  const totalQty = cart.reduce((acc, i) => acc + i.qty, 0);
  counter.textContent = totalQty;

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  headerTotal.textContent = `$${subtotal.toLocaleString("es-AR")}`;

  if (cart.length === 0) {
    itemsBox.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: #94a3b8;">
        <p style="font-weight: 700; color: #fff;">Tu comanda está vacía</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">Selecciona pizzas, burgers o entradas del menú.</p>
      </div>
    `;
    subtotalEl.textContent = "$0 ARS";
    totalEl.textContent = "$0 ARS";
    return;
  }

  itemsBox.innerHTML = cart.map((item, idx) => `
    <div class="cart-dish-row">
      <img src="${item.image}" alt="${item.name}" class="cart-dish-img" />
      <div class="cart-dish-info">
        <h5 class="cart-dish-title">${item.name}</h5>
        <div class="cart-dish-price">$${(item.price * item.qty).toLocaleString("es-AR")} ARS</div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <button style="background: #1e293b; color: #fff; border: none; width: 22px; height: 22px; border-radius: 4px; cursor: pointer;" onclick="changeDishQty(${idx}, -1)">−</button>
        <span style="font-size: 0.82rem; font-weight: 700;">${item.qty}</span>
        <button style="background: #1e293b; color: #fff; border: none; width: 22px; height: 22px; border-radius: 4px; cursor: pointer;" onclick="changeDishQty(${idx}, 1)">+</button>
      </div>
    </div>
  `).join("");

  const discount = paymentType === "alias" ? Math.round(subtotal * (REST_CONFIG.discount_percent / 100)) : 0;
  if (discount > 0) {
    discountRow.style.display = "flex";
    discountEl.textContent = `-$${discount.toLocaleString("es-AR")} ARS`;
  } else {
    discountRow.style.display = "none";
  }

  const deliveryCost = deliveryType === "home" ? REST_CONFIG.delivery_fee : 0;
  deliveryEl.textContent = deliveryCost > 0 ? `+$${deliveryCost.toLocaleString("es-AR")} ARS` : "Gratis (Retiro)";

  const total = subtotal - discount + deliveryCost;
  subtotalEl.textContent = `$${subtotal.toLocaleString("es-AR")} ARS`;
  totalEl.textContent = `$${total.toLocaleString("es-AR")} ARS`;
}

window.changeDishQty = function(idx, delta) {
  if (!cart[idx]) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart();
  updateCartUI();
};

function saveCart() {
  localStorage.setItem("forno_cart", JSON.stringify(cart));
}

function openCart() {
  document.getElementById("cart-overlay").classList.remove("hidden");
}

function closeCart() {
  document.getElementById("cart-overlay").classList.add("hidden");
}

function setupEvents() {
  // Categorías
  const catBtns = document.querySelectorAll(".food-cat-btn");
  catBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      catBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCat = btn.getAttribute("data-cat");
      renderDishes();
    });
  });

  // Carrito Drawer
  document.getElementById("open-cart-btn").addEventListener("click", openCart);
  document.getElementById("close-cart-btn").addEventListener("click", closeCart);

  // Delivery vs Retiro
  const btnHome = document.getElementById("btn-deliv-home");
  const btnPickup = document.getElementById("btn-deliv-pickup");
  const addrGroup = document.getElementById("address-input-group");

  btnHome.addEventListener("click", () => {
    deliveryType = "home";
    btnHome.classList.add("active");
    btnPickup.classList.remove("active");
    addrGroup.style.display = "block";
    updateCartUI();
  });

  btnPickup.addEventListener("click", () => {
    deliveryType = "pickup";
    btnPickup.classList.add("active");
    btnHome.classList.remove("active");
    addrGroup.style.display = "none";
    updateCartUI();
  });

  // Alias vs Mercado Pago
  const btnAlias = document.getElementById("btn-pay-alias");
  const btnMp = document.getElementById("btn-pay-mp");

  btnAlias.addEventListener("click", () => {
    paymentType = "alias";
    btnAlias.classList.add("active");
    btnMp.classList.remove("active");
    updateCartUI();
  });

  btnMp.addEventListener("click", () => {
    paymentType = "mp";
    btnMp.classList.add("active");
    btnAlias.classList.remove("active");
    updateCartUI();
  });

  // Enviar a WhatsApp
  document.getElementById("btn-send-order-wsp").addEventListener("click", sendOrderWhatsApp);

  // Modo Edición Cocina
  const btnEditToggle = document.getElementById("btn-toggle-food-edit");
  btnEditToggle.addEventListener("click", () => {
    isFoodEditMode = !isFoodEditMode;
    btnEditToggle.classList.toggle("active", isFoodEditMode);
    document.getElementById("food-edit-label").textContent = isFoodEditMode ? "✓ Modo Edición ACTIVO" : "✏️ Activar Edición de Menú";
    renderDishes();
  });

  document.getElementById("close-food-edit").addEventListener("click", () => {
    document.getElementById("food-edit-modal").classList.add("hidden");
  });
  document.getElementById("btn-cancel-dish-edit").addEventListener("click", () => {
    document.getElementById("food-edit-modal").classList.add("hidden");
  });

  document.getElementById("form-edit-dish").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-dish-id").value;
    const name = document.getElementById("edit-dish-name").value.trim();
    const price = parseInt(document.getElementById("edit-dish-price").value, 10);
    const available = document.getElementById("edit-dish-available").value === "true";

    const dish = dishes.find(d => d.id === id);
    if (dish) {
      dish.name = name;
      dish.price = price;
      dish.available = available;
      localStorage.setItem("forno_dishes", JSON.stringify(dishes));
      renderDishes();
      updateCartUI();
      document.getElementById("food-edit-modal").classList.add("hidden");
      alert("¡Plato actualizado con éxito en el menú!");
    }
  });
}

window.openEditDishModal = function(dishId) {
  const dish = dishes.find(d => d.id === dishId);
  if (!dish) return;

  document.getElementById("edit-dish-id").value = dish.id;
  document.getElementById("edit-dish-name").value = dish.name;
  document.getElementById("edit-dish-price").value = dish.price;
  document.getElementById("edit-dish-available").value = dish.available ? "true" : "false";

  document.getElementById("food-edit-modal").classList.remove("hidden");
};

function sendOrderWhatsApp() {
  if (cart.length === 0) {
    alert("Agrega platos a tu comanda para pedir.");
    return;
  }

  const address = document.getElementById("client-address").value.trim();
  if (deliveryType === "home" && !address) {
    alert("Por favor ingresa la dirección de entrega.");
    document.getElementById("client-address").focus();
    return;
  }

  const orderNum = Math.floor(100 + Math.random() * 900);
  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const discount = paymentType === "alias" ? Math.round(subtotal * (REST_CONFIG.discount_percent / 100)) : 0;
  const delivery = deliveryType === "home" ? REST_CONFIG.delivery_fee : 0;
  const total = subtotal - discount + delivery;

  const items = cart.map(i => `• ${i.qty}x ${i.name} ($${(i.price * i.qty).toLocaleString("es-AR")})`).join("\n");
  const deliveryStr = deliveryType === "home" ? `Envío a domicilio (${address})` : `Take Away / Retiro en local`;
  const paymentStr = paymentType === "alias" ? `Transferencia (Alias: ${REST_CONFIG.bank_alias} con 10% OFF)` : `Mercado Pago (Tarjeta/Dinero)`;

  const msg = `🍕 *COMANDA #${orderNum} - ${REST_CONFIG.name}*
━━━━━━━━━━━━━━━━━━━━
${items}
━━━━━━━━━━━━━━━━━━━━
🛵 *Modalidad:* ${deliveryStr}
💳 *Pago:* ${paymentStr}
💰 *TOTAL A PAGAR:* $${total.toLocaleString("es-AR")} ARS

Hola! Acabo de hacer este pedido online. ¿Me confirman que ingresó a cocina y el tiempo de entrega?`;

  const url = `https://wa.me/${REST_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");

  cart = [];
  saveCart();
  updateCartUI();
  closeCart();
}
