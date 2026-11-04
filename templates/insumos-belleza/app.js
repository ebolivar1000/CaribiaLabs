// ====================================================================
// LUMIÈRE - MOTOR DE CONTROL DE INSUMOS & PELUQUERÍA
// ====================================================================

const SALON_CONFIG = {
  name: "LUMIÈRE Studio de Belleza",
  whatsapp_supplier: "5491154188294"
};

const DEFAULT_SUPPLIES = [
  {
    id: "ins-1",
    name: "Tinte L'Oréal Majirel 50ml (Tono 7.1)",
    category: "Coloración",
    cost: 8500,
    stock: 4,
    min_stock: 2
  },
  {
    id: "ins-2",
    name: "Polvo Decolorante Blond Studio 500g",
    category: "Decoloración",
    cost: 26000,
    stock: 2,
    min_stock: 2
  },
  {
    id: "ins-3",
    name: "Shampoo Post-Color Protección Ácida 1000ml",
    category: "Lavado",
    cost: 18000,
    stock: 5,
    min_stock: 2
  },
  {
    id: "ins-4",
    name: "Tratamiento Ampolla Keratina & Argán",
    category: "Nutrición",
    cost: 9200,
    stock: 1, // ALERTA CRÍTICA
    min_stock: 2
  }
];

let supplies = JSON.parse(localStorage.getItem("lumiere_supplies")) || DEFAULT_SUPPLIES;

document.addEventListener("DOMContentLoaded", () => {
  renderInventory();
  setupEvents();
});

function renderInventory() {
  const tbody = document.getElementById("inventory-tbody");
  const statTotal = document.getElementById("stat-total-items");
  const statLow = document.getElementById("stat-low-stock");

  statTotal.textContent = `${supplies.length} productos`;
  const lowCount = supplies.filter(s => s.stock <= s.min_stock).length;
  statLow.textContent = `${lowCount} ${lowCount === 1 ? 'insumo' : 'insumos'}`;

  tbody.innerHTML = supplies.map((item, idx) => {
    const isCritical = item.stock <= item.min_stock;

    return `
      <tr>
        <td>
          <span style="font-weight: 700; color: #fff; display: block;">${item.name}</span>
          <span style="font-size: 0.72rem; color: #94a3b8;">Mínimo sugerido: ${item.min_stock} un.</span>
        </td>
        <td><span style="font-size: 0.75rem; color: #c084fc; font-weight: 700;">${item.category}</span></td>
        <td>$${item.cost.toLocaleString("es-AR")}</td>
        <td>
          <span style="font-size: 1.1rem; font-weight: 800; color: ${isCritical ? '#f87171' : '#34d399'};">
            ${item.stock} unidades
          </span>
        </td>
        <td>
          <span class="${isCritical ? 'badge-status-low' : 'badge-status-ok'}">
            ${isCritical ? '⚠️ REPOSICIÓN URGENTE' : '✓ Stock Óptimo'}
          </span>
        </td>
        <td>
          <button type="button" class="btn-consume-one" onclick="quickConsume(${idx})">
            −1 Usado
          </button>
        </td>
      </tr>
    `;
  }).join("");

  // Llenar select del modal
  const select = document.getElementById("consume-item-select");
  select.innerHTML = supplies.map(s => `
    <option value="${s.id}">${s.name} (Quedan: ${s.stock})</option>
  `).join("");
}

window.quickConsume = function(idx) {
  if (supplies[idx].stock > 0) {
    supplies[idx].stock -= 1;
    saveSupplies();
    renderInventory();
  } else {
    alert("¡Este insumo ya no tiene existencias! Solicita reposición al proveedor.");
  }
};

function saveSupplies() {
  localStorage.setItem("lumiere_supplies", JSON.stringify(supplies));
}

function setupEvents() {
  const modal = document.getElementById("consume-modal");

  document.getElementById("btn-open-consume-modal").addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  document.getElementById("close-consume-modal").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document.getElementById("btn-cancel-consume").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document.getElementById("form-consume").addEventListener("submit", (e) => {
    e.preventDefault();
    const itemId = document.getElementById("consume-item-select").value;
    const amount = parseInt(document.getElementById("consume-amount").value, 10);
    const stylist = document.getElementById("consume-stylist").value;

    const item = supplies.find(s => s.id === itemId);
    if (item) {
      if (item.stock >= amount) {
        item.stock -= amount;
        saveSupplies();
        renderInventory();
        modal.classList.add("hidden");
        alert(`¡Consumo registrado exitosamente! ${amount}x ${item.name} imputado a ${stylist}.`);
      } else {
        alert(`Stock insuficiente: solo quedan ${item.stock} unidades disponibles.`);
      }
    }
  });

  // Reordenar a proveedor por WhatsApp
  document.getElementById("btn-reorder-wsp").addEventListener("click", () => {
    const criticalItems = supplies.filter(s => s.stock <= s.min_stock);

    if (criticalItems.length === 0) {
      alert("Todos los insumos se encuentran en nivel óptimo de stock.");
      return;
    }

    const orderList = criticalItems.map(i => `• ${i.name} (Quedan solo ${i.stock} unidades - Pedir reposición)`).join("\n");
    const msg = `📦 *ORDEN DE REPOSICIÓN DE INSUMOS - ${SALON_CONFIG.name}*
━━━━━━━━━━━━━━━━━━━━
Hola! Necesitamos reponer con urgencia los siguientes productos para el salón:
${orderList}
━━━━━━━━━━━━━━━━━━━━
¿Me confirmas disponibilidad y costos para coordinar el envío? Gracias!`;

    const url = `https://wa.me/${SALON_CONFIG.whatsapp_supplier}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  });
}
