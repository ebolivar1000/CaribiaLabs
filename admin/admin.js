// ====================================================================
// CARIBIA LABS - CONSOLA MAESTRA DE ADMINISTRADOR (ADMIN JS)
// Gestión Privada de la Software Factory y Aprovisionamiento
// ====================================================================

const ADMIN_PIN = 'admin2026';

// Tenants iniciales registrados en el sistema
const INITIAL_TENANTS = [
  {
    name: 'Garage Pimpollos',
    slug: 'garage-pimpollos',
    template: 'retail-stock',
    templateName: 'Ropa & Calzado (Shopify Style)',
    phone: '5491154188294',
    alias: 'pimpollos.garage.mp',
    discount: 15,
    url: '../dist/tenants/garage-pimpollos/index.html'
  },
  {
    name: 'Forno Palermo',
    slug: 'forno-palermo',
    template: 'menu-gastronomia',
    templateName: 'Menú & Delivery Gastronómico',
    phone: '5491154188294',
    alias: 'forno.palermo.mp',
    discount: 10,
    url: '../dist/tenants/forno-palermo/index.html'
  },
  {
    name: 'AURA Studio',
    slug: 'aura-studio',
    template: 'retail-stock',
    templateName: 'Moda Minimalista',
    phone: '5491154188294',
    alias: 'aura.indumentaria.mp',
    discount: 15,
    url: '../templates/retail-stock/index.html'
  },
  {
    name: 'MediConnect Salud',
    slug: 'mediconnect',
    template: 'citas-salud',
    templateName: 'Agenda Médica & Citas',
    phone: '5491154188294',
    alias: 'mediconnect.turnos.mp',
    discount: 0,
    url: '../templates/citas-salud/index.html'
  },
  {
    name: 'LUMIÈRE Studio',
    slug: 'lumiere-salon',
    template: 'insumos-belleza',
    templateName: 'Control de Insumos & Tintes',
    phone: '5491154188294',
    alias: 'lumiere.salon.mp',
    discount: 0,
    url: '../templates/insumos-belleza/index.html'
  }
];

let tenants = JSON.parse(localStorage.getItem('caribia_admin_tenants')) || INITIAL_TENANTS;

document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupSlugGenerator();
  setupProvisionForm();
  setupChatSimulator();
  renderTenants();
});

// 1. Manejo de Acceso / PIN
function setupAuth() {
  const authGate = document.getElementById('auth-gate');
  const dashboard = document.getElementById('admin-dashboard');
  const pinForm = document.getElementById('pin-form');
  const pinInput = document.getElementById('admin-pin-input');
  const pinError = document.getElementById('pin-error');
  const btnLogout = document.getElementById('btn-logout');

  // Si ya inició sesión en esta pestaña
  if (sessionStorage.getItem('caribia_admin_logged') === 'true') {
    authGate.classList.add('hidden');
    dashboard.classList.remove('hidden');
  }

  pinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = pinInput.value.trim();

    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('caribia_admin_logged', 'true');
      authGate.classList.add('hidden');
      dashboard.classList.remove('hidden');
      pinError.classList.add('hidden');
    } else {
      pinError.classList.remove('hidden');
      pinInput.value = '';
      pinInput.focus();
    }
  });

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('caribia_admin_logged');
    dashboard.classList.add('hidden');
    authGate.classList.remove('hidden');
    pinInput.value = '';
  });
}

// 2. Generador Automático de Slug al tipear el Nombre
function setupSlugGenerator() {
  const nameInput = document.getElementById('client-name');
  const slugInput = document.getElementById('client-slug');
  const slugPreview = document.getElementById('slug-preview');
  const aliasInput = document.getElementById('client-alias');

  nameInput.addEventListener('input', () => {
    const raw = nameInput.value;
    const generatedSlug = raw
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    slugInput.value = generatedSlug;
    slugPreview.textContent = `${generatedSlug || 'subdominio'}.caribialabs.com`;

    if (!aliasInput.value || aliasInput.value.endsWith('.mp')) {
      aliasInput.value = `${generatedSlug}.mp`;
    }
  });

  slugInput.addEventListener('input', () => {
    slugPreview.textContent = `${slugInput.value || 'subdominio'}.caribialabs.com`;
  });
}

// 3. Formulario de Aprovisionamiento
function setupProvisionForm() {
  const form = document.getElementById('provision-form');
  const successBox = document.getElementById('provision-success-box');
  const btnOpen = document.getElementById('btn-open-generated');
  const btnCopy = document.getElementById('btn-copy-link');
  const templateSelect = document.getElementById('client-template');
  const discountInput = document.getElementById('client-discount');

  // Ajustar descuento según plantilla sugerida
  templateSelect.addEventListener('change', () => {
    if (templateSelect.value === 'retail-stock') discountInput.value = '15';
    else if (templateSelect.value === 'menu-gastronomia') discountInput.value = '10';
    else discountInput.value = '0';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('client-name').value.trim();
    const slug = document.getElementById('client-slug').value.trim();
    const template = document.getElementById('client-template').value;
    const phone = document.getElementById('client-phone').value.trim();
    const alias = document.getElementById('client-alias').value.trim();
    const discount = Number(document.getElementById('client-discount').value) || 0;

    const templateNames = {
      'retail-stock': 'Tienda Ropa & Moda (Shopify Style)',
      'menu-gastronomia': 'Menú & Delivery Gastronómico',
      'citas-salud': 'Agenda Médica & Citas',
      'insumos-belleza': 'Control Insumos & Peluquería'
    };

    // Determinar URL de acceso
    let previewUrl = `../templates/${template}/index.html?tenant=${slug}&name=${encodeURIComponent(name)}`;
    if (slug === 'garage-pimpollos') previewUrl = '../dist/tenants/garage-pimpollos/index.html';
    if (slug === 'forno-palermo') previewUrl = '../dist/tenants/forno-palermo/index.html';

    const newTenant = {
      name,
      slug,
      template,
      templateName: templateNames[template],
      phone,
      alias,
      discount,
      url: previewUrl,
      created_at: new Date().toLocaleDateString('es-AR')
    };

    // Agregar a la lista
    tenants.unshift(newTenant);
    localStorage.setItem('caribia_admin_tenants', JSON.stringify(tenants));

    // Mostrar feedback visual
    successBox.classList.remove('hidden');
    btnOpen.href = previewUrl;
    btnCopy.onclick = () => {
      const wspLink = `¡Hola! Tu tienda ya está lista en: https://${slug}.caribialabs.com\nCualquier pedido que hagan tus clientes llegará directo a tu WhatsApp +${phone}.`;
      navigator.clipboard.writeText(wspLink);
      btnCopy.textContent = '¡Copiado al portapapeles! ✓';
      setTimeout(() => { btnCopy.textContent = 'Copiar Enlace para WhatsApp 📋'; }, 2500);
    };

    renderTenants();
    form.reset();
  });
}

// 4. Directorio de Tenants
function renderTenants() {
  const tbody = document.getElementById('tenants-table-body');
  const countDisplay = document.getElementById('metric-tenants-count');
  const badgeDisplay = document.getElementById('tenants-badge');

  if (countDisplay) countDisplay.textContent = `${tenants.length} Activos`;
  if (badgeDisplay) badgeDisplay.textContent = tenants.length;

  tbody.innerHTML = tenants.map(t => `
    <tr class="hover:bg-slate-900/40 transition">
      <td class="py-3 pr-4 font-bold text-white flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        ${t.name}
      </td>
      <td class="py-3 pr-4 text-slate-300">
        <span class="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-semibold">${t.templateName || t.template}</span>
      </td>
      <td class="py-3 pr-4 font-mono text-emerald-400">+${t.phone}</td>
      <td class="py-3 pr-4 font-mono text-cyan-400">${t.alias || 'N/A'} ${t.discount ? `(${t.discount}% OFF)` : ''}</td>
      <td class="py-3 pr-4 font-mono text-slate-400">${t.slug}.caribialabs.com</td>
      <td class="py-3 text-right">
        <a href="${t.url}" target="_blank" class="px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-[11px] border border-cyan-500/30">
          Abrir Web ↗
        </a>
      </td>
    </tr>
  `).join('');
}

// 5. Simulador de Chatbot con IA
function setupChatSimulator() {
  const form = document.getElementById('chat-simulator-form');
  const input = document.getElementById('sim-user-message');
  const box = document.getElementById('chat-messages-box');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userMsg = input.value.trim();
    if (!userMsg) return;

    // Agregar mensaje del usuario
    box.innerHTML += `
      <div class="flex justify-end gap-2">
        <div class="bg-cyan-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] font-medium">
          ${escapeHtml(userMsg)}
        </div>
      </div>
    `;
    box.scrollTop = box.scrollHeight;
    input.value = '';

    // Generar respuesta cognitiva de IA simulada (o conectada a Gemini)
    setTimeout(() => {
      const aiReply = generateCognitiveReply(userMsg);
      box.innerHTML += `
        <div class="flex gap-2">
          <div class="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[10px] text-white">IA</div>
          <div class="bg-slate-800 p-3 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
            ${aiReply}
          </div>
        </div>
      `;
      box.scrollTop = box.scrollHeight;
    }, 600);
  });
}

function generateCognitiveReply(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('talle') || lower.includes('medida')) {
    return '¡Hola! Sí, tenemos stock disponible en talles S y M del blazer y remeras. El talle L se encuentra agotado momentáneamente pero te podemos avisar apenas ingrese. ¿Qué talle sueles usar normalmente?';
  }
  if (lower.includes('precio') || lower.includes('cuanto') || lower.includes('vale')) {
    return 'El precio es de $54.000 ARS. Además, si abonas con Transferencia Bancaria (Alias) tienes un **15% de descuento directo** quedando en **$45.900 ARS**, o puedes pagarlo en **3 cuotas sin interés con Mercado Pago**.';
  }
  if (lower.includes('envio') || lower.includes('envío') || lower.includes('donde')) {
    return 'Hacemos envíos a todo el país a través de correo prioritario (en compras mayores a $80.000 el envío es **completamente gratis** 🚚) o puedes retirar en nuestro punto de entrega sin cargo.';
  }
  if (lower.includes('comprar') || lower.includes('quiero') || lower.includes('pedido')) {
    return '¡Excelente elección! Indícame por favor tu nombre completo y si prefieres entrega a domicilio o retiro en local, así te dejamos el pedido reservado.';
  }
  return '¡Hola! Gracias por consultarnos 😊. Puedes ver todos los modelos, fotos reales y precios actualizados en nuestra tienda online. ¿Buscas algo en particular hoy?';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
