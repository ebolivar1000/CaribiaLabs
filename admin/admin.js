// ====================================================================
// CARIBIA LABS - CONSOLA MAESTRA & CRM DE CLIENTES (ADMIN JS)
// Gestión de Fábrica de Software, CRM, Facturación y Credenciales
// ====================================================================

const API_BASE_URL = 'https://caribia-labs-api.caribialabs.workers.dev';

// Credenciales Maestras por defecto (almacenadas en localStorage)
const DEFAULT_AUTH = {
  email: 'caribialabs@gmail.com',
  password: 'admin2026'
};

// Clientes iniciales para el CRM
const INITIAL_CRM_CLIENTS = [
  {
    id: 'crm-001',
    business_name: 'Garage Pimpollos',
    contact_name: 'Martín Pimpollos',
    whatsapp_phone: '5491154188294',
    email: 'contacto@garagepimpollos.com',
    plan_name: 'Tienda Online + Carrito',
    monthly_fee: 45000,
    currency: 'ARS',
    billing_day: 5,
    payment_method: 'Transferencia Alias',
    status: 'al_dia',
    next_due_date: '2026-12-05',
    last_payment_date: '2026-11-05',
    notes: 'Abonó por Mercado Pago Alias. Muy conforme con la velocidad de despacho.'
  },
  {
    id: 'crm-002',
    business_name: 'Forno & Co. Palermo',
    contact_name: 'Federico Rossi',
    whatsapp_phone: '5491154188294',
    email: 'pedidos@fornopalermo.ar',
    plan_name: 'Menú & Delivery Gastronómico',
    monthly_fee: 55000,
    currency: 'ARS',
    billing_day: 10,
    payment_method: 'Transferencia Alias',
    status: 'al_dia',
    next_due_date: '2026-11-10',
    last_payment_date: '2026-10-10',
    notes: 'Ahorro del 30% en comisiones comparado con apps de delivery tradicionales.'
  },
  {
    id: 'crm-003',
    business_name: 'AURA Studio Indumentaria',
    contact_name: 'Camila Benítez',
    whatsapp_phone: '5491154188294',
    email: 'hola@aurastudio.com.ar',
    plan_name: 'Tienda de Ropa + Talles',
    monthly_fee: 45000,
    currency: 'ARS',
    billing_day: 8,
    payment_method: 'Mercado Pago',
    status: 'pendiente',
    next_due_date: '2026-11-08',
    last_payment_date: '2026-10-08',
    notes: 'Aviso de cobro enviado por WhatsApp. Confirmará pago mañana.'
  },
  {
    id: 'crm-004',
    business_name: 'LUMIÈRE Studio Peluquería',
    contact_name: 'Lucía Morales',
    whatsapp_phone: '5491154188294',
    email: 'administracion@lumiere.salon.ar',
    plan_name: 'Control de Inventarios & Insumos',
    monthly_fee: 35000,
    currency: 'ARS',
    billing_day: 15,
    payment_method: 'Transferencia Alias',
    status: 'al_dia',
    next_due_date: '2026-11-15',
    last_payment_date: '2026-10-15',
    notes: 'Utilizan el registro rápido en 1 clic para consumo de tintes.'
  },
  {
    id: 'crm-005',
    business_name: 'MediConnect Consultorios',
    contact_name: 'Dr. Alejandro Méndez',
    whatsapp_phone: '5491154188294',
    email: 'turnos@mediconnect.ar',
    plan_name: 'Agenda Médica + Bot WhatsApp',
    monthly_fee: 60000,
    currency: 'ARS',
    billing_day: 1,
    payment_method: 'Transferencia Alias',
    status: 'al_dia',
    next_due_date: '2026-12-01',
    last_payment_date: '2026-11-01',
    notes: 'Cero ausentismo de pacientes gracias al recordatorio automatizado 24hs antes.'
  }
];

// Sitios iniciales registrados en el sistema
const INITIAL_TENANTS = [
  {
    name: 'Garage Pimpollos',
    slug: 'garage-pimpollos',
    template: 'retail-stock',
    templateName: 'Tienda de Ropa & Calzado',
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
    templateName: 'Tienda de Ropa Minimalista',
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
    templateName: 'Control de Inventarios & Stock',
    phone: '5491154188294',
    alias: 'lumiere.salon.mp',
    discount: 0,
    url: '../templates/insumos-belleza/index.html'
  }
];

// Estado global de la aplicación
let crmClients = JSON.parse(localStorage.getItem('caribia_crm_clients')) || INITIAL_CRM_CLIENTS;
let tenants = JSON.parse(localStorage.getItem('caribia_admin_tenants')) || INITIAL_TENANTS;
let currentCrmFilter = 'todos';
let crmSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupNavigationTabs();
  setupSecurityModal();
  setupCrmModule();
  setupSlugGenerator();
  setupProvisionForm();
  setupChatSimulator();
  renderTenants();
  syncCrmWithCloudApi();
});

// ====================================================================
// 1. MANEJO DE AUTENTICACIÓN & LOGIN SEGURO (EMAIL + CONTRASEÑA)
// ====================================================================
function getStoredAuth() {
  const saved = localStorage.getItem('caribia_admin_auth');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_AUTH;
    }
  }
  return DEFAULT_AUTH;
}

function setupAuth() {
  const authGate = document.getElementById('auth-gate');
  const dashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('admin-email-input');
  const passInput = document.getElementById('admin-pass-input');
  const loginError = document.getElementById('login-error');
  const btnLogout = document.getElementById('btn-logout');

  // Si ya inició sesión en esta sesión de navegador
  if (sessionStorage.getItem('caribia_admin_logged') === 'true') {
    authGate.classList.add('hidden');
    dashboard.classList.remove('hidden');
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredEmail = emailInput.value.trim().toLowerCase();
    const enteredPass = passInput.value;
    const currentAuth = getStoredAuth();

    if (enteredEmail === currentAuth.email.toLowerCase() && enteredPass === currentAuth.password) {
      sessionStorage.setItem('caribia_admin_logged', 'true');
      authGate.classList.add('hidden');
      dashboard.classList.remove('hidden');
      loginError.classList.add('hidden');
      loginForm.reset();
    } else {
      loginError.classList.remove('hidden');
      passInput.value = '';
      passInput.focus();
    }
  });

  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('caribia_admin_logged');
    dashboard.classList.add('hidden');
    authGate.classList.remove('hidden');
    loginForm.reset();
  });
}

// ====================================================================
// 2. MODAL DE SEGURIDAD: CAMBIAR EMAIL Y CONTRASEÑA
// ====================================================================
function setupSecurityModal() {
  const btnOpen = document.getElementById('btn-open-security');
  const btnClose = document.getElementById('btn-close-security-modal');
  const modal = document.getElementById('modal-security');
  const form = document.getElementById('form-security');
  const emailInput = document.getElementById('sec-email-input');
  const currentPassInput = document.getElementById('sec-current-pass');
  const newPassInput = document.getElementById('sec-new-pass');
  const confirmPassInput = document.getElementById('sec-confirm-pass');
  const feedback = document.getElementById('sec-feedback');

  btnOpen.addEventListener('click', () => {
    const auth = getStoredAuth();
    emailInput.value = auth.email;
    currentPassInput.value = '';
    newPassInput.value = '';
    confirmPassInput.value = '';
    feedback.classList.add('hidden');
    modal.classList.remove('hidden');
  });

  btnClose.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const auth = getStoredAuth();
    const currentPass = currentPassInput.value;
    const newPass = newPassInput.value;
    const confirmPass = confirmPassInput.value;
    const newEmail = emailInput.value.trim().toLowerCase();

    // Validar contraseña actual
    if (currentPass !== auth.password) {
      showFeedback('La contraseña actual es incorrecta.', 'error');
      return;
    }

    // Validar coincidencia de nueva contraseña
    if (newPass !== confirmPass) {
      showFeedback('Las nuevas contraseñas no coinciden.', 'error');
      return;
    }

    if (newPass.length < 6) {
      showFeedback('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    // Guardar credenciales de forma persistente
    const updatedAuth = {
      email: newEmail,
      password: newPass
    };
    localStorage.setItem('caribia_admin_auth', JSON.stringify(updatedAuth));

    showFeedback('¡Credenciales actualizadas con éxito!', 'success');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 1500);
  });

  function showFeedback(text, type) {
    feedback.textContent = text;
    feedback.classList.remove('hidden', 'text-rose-400', 'text-emerald-400');
    if (type === 'error') {
      feedback.classList.add('text-rose-400');
    } else {
      feedback.classList.add('text-emerald-400');
    }
  }
}

// ====================================================================
// 3. CAMBIO DE PESTAÑAS DEL DASHBOARD (TABS)
// ====================================================================
function setupNavigationTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = {
    'tab-crm': document.getElementById('panel-crm'),
    'tab-provision': document.getElementById('panel-provision'),
    'tab-simulator': document.getElementById('panel-simulator'),
    'tab-sites': document.getElementById('panel-sites')
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');

      // Actualizar estilo botones
      tabBtns.forEach(b => {
        b.classList.remove('active', 'text-cyan-300', 'bg-cyan-500/15');
        b.classList.add('text-slate-400');
      });
      btn.classList.add('active');
      btn.classList.remove('text-slate-400');

      // Mostrar panel correspondiente
      Object.keys(panels).forEach(key => {
        if (key === target) {
          panels[key].classList.remove('hidden');
        } else {
          panels[key].classList.add('hidden');
        }
      });
    });
  });
}

// ====================================================================
// 4. MÓDULO CRM & FACTURACIÓN DE CLIENTES (ESTILO ODOO/LINEAR)
// ====================================================================
function setupCrmModule() {
  const filterBtns = document.querySelectorAll('.crm-filter-btn');
  const searchInput = document.getElementById('crm-search-input');
  const btnOpenModal = document.getElementById('btn-open-new-client-modal');
  const btnCloseModal = document.getElementById('btn-close-new-client-modal');
  const modal = document.getElementById('modal-new-client');
  const form = document.getElementById('form-new-client');

  // Filtros de estado (Todos, Al día, Pendiente, Vencido)
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        b.classList.add('text-slate-400', 'bg-slate-900', 'border-slate-800');
      });
      btn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
      btn.classList.remove('text-slate-400', 'bg-slate-900', 'border-slate-800');

      currentCrmFilter = btn.getAttribute('data-filter');
      renderCrmClients();
    });
  });

  // Búsqueda en tiempo real
  searchInput.addEventListener('input', (e) => {
    crmSearchQuery = e.target.value.trim().toLowerCase();
    renderCrmClients();
  });

  // Modal Nuevo Cliente
  btnOpenModal.addEventListener('click', () => modal.classList.remove('hidden'));
  btnCloseModal.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  // Enviar formulario de alta de cliente
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newClient = {
      id: `crm-${Date.now()}`,
      business_name: document.getElementById('new-crm-business').value.trim(),
      contact_name: document.getElementById('new-crm-contact').value.trim(),
      whatsapp_phone: document.getElementById('new-crm-phone').value.trim(),
      email: document.getElementById('new-crm-email').value.trim(),
      plan_name: document.getElementById('new-crm-plan').value,
      monthly_fee: Number(document.getElementById('new-crm-fee').value),
      currency: 'ARS',
      billing_day: Number(document.getElementById('new-crm-day').value),
      payment_method: document.getElementById('new-crm-method').value,
      status: document.getElementById('new-crm-status').value,
      next_due_date: calculateNextDueDate(Number(document.getElementById('new-crm-day').value)),
      last_payment_date: new Date().toISOString().split('T')[0],
      notes: document.getElementById('new-crm-notes').value.trim()
    };

    crmClients.unshift(newClient);
    localStorage.setItem('caribia_crm_clients', JSON.stringify(crmClients));
    renderCrmClients();
    modal.classList.add('hidden');
    form.reset();

    // Intentar sincronizar con la API en la nube
    try {
      await fetch(`${API_BASE_URL}/api/admin/crm/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
    } catch (err) {
      console.warn('API nube offline, guardado localmente:', err);
    }
  });

  renderCrmClients();
}

function calculateNextDueDate(day) {
  const now = new Date();
  let month = now.getMonth();
  let year = now.getFullYear();
  if (now.getDate() >= day) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  const formattedMonth = String(month + 1).padStart(2, '0');
  const formattedDay = String(day).padStart(2, '0');
  return `${year}-${formattedMonth}-${formattedDay}`;
}

// Renderizado de clientes y métricas del CRM
function renderCrmClients() {
  const tbody = document.getElementById('crm-table-body');
  if (!tbody) return;

  // Filtrado
  let filtered = crmClients.filter(client => {
    if (currentCrmFilter !== 'todos' && client.status !== currentCrmFilter) return false;
    if (crmSearchQuery) {
      const matchName = client.business_name.toLowerCase().includes(crmSearchQuery);
      const matchContact = (client.contact_name || '').toLowerCase().includes(crmSearchQuery);
      const matchPlan = client.plan_name.toLowerCase().includes(crmSearchQuery);
      return matchName || matchContact || matchPlan;
    }
    return true;
  });

  // Cálculo de KPIs
  const mrr = crmClients.reduce((acc, c) => acc + Number(c.monthly_fee || 0), 0);
  const totalCobrado = crmClients
    .filter(c => c.status === 'al_dia')
    .reduce((acc, c) => acc + Number(c.monthly_fee || 0), 0);
  const pendiente = crmClients
    .filter(c => c.status === 'pendiente' || c.status === 'vencido')
    .reduce((acc, c) => acc + Number(c.monthly_fee || 0), 0);

  const alDiaCount = crmClients.filter(c => c.status === 'al_dia').length;
  const pendientesCount = crmClients.filter(c => c.status === 'pendiente').length;
  const vencidosCount = crmClients.filter(c => c.status === 'vencido').length;

  // Actualizar KPIs en pantalla
  document.getElementById('kpi-mrr').textContent = `$${mrr.toLocaleString('es-AR')} ARS`;
  document.getElementById('kpi-cobrado').textContent = `$${totalCobrado.toLocaleString('es-AR')} ARS`;
  document.getElementById('kpi-pendiente').textContent = `$${pendiente.toLocaleString('es-AR')} ARS`;
  document.getElementById('kpi-total-clientes').textContent = `${crmClients.length} Activos`;
  document.getElementById('kpi-al-dia-ratio').textContent = `${alDiaCount} de ${crmClients.length} al día`;
  document.getElementById('kpi-pendientes-count').textContent = `${pendientesCount} cobro(s) pendiente(s)`;

  // Actualizar contadores de filtros
  document.getElementById('count-filter-todos').textContent = crmClients.length;
  document.getElementById('count-filter-aldia').textContent = alDiaCount;
  document.getElementById('count-filter-pendientes').textContent = pendientesCount;
  document.getElementById('count-filter-vencidos').textContent = vencidosCount;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-slate-500">
          No se encontraron clientes para el filtro seleccionado.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(client => {
    let statusBadge = '';
    if (client.status === 'al_dia') {
      statusBadge = '<span class="badge-status badge-al-dia">● Al Día</span>';
    } else if (client.status === 'pendiente') {
      statusBadge = '<span class="badge-status badge-pendiente">▲ Pendiente</span>';
    } else {
      statusBadge = '<span class="badge-status badge-vencido">✖ Vencido</span>';
    }

    // Mensaje pre-armado para WhatsApp
    const wspMessage = encodeURIComponent(
      `¡Hola ${client.contact_name || client.business_name}! Te escribimos de CaribIA Labs para acercarte el aviso del abono mensual de tu plataforma (${client.plan_name}) por $${Number(client.monthly_fee).toLocaleString('es-AR')} ARS correspondiente a este período. Puedes abonar mediante nuestro Alias: caribialabs.mp. ¡Muchas gracias!`
    );
    const wspLink = `https://wa.me/${client.whatsapp_phone}?text=${wspMessage}`;

    return `
      <tr class="hover:bg-slate-900/40 transition">
        <td class="p-4">
          <div class="font-bold text-white text-sm">${escapeHtml(client.business_name)}</div>
          <div class="text-[11px] text-slate-400">${escapeHtml(client.contact_name || 'Sin contacto')} · Tel: ${escapeHtml(client.whatsapp_phone)}</div>
        </td>
        <td class="p-4">
          <span class="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 font-medium">${escapeHtml(client.plan_name)}</span>
        </td>
        <td class="p-4 font-mono font-bold text-cyan-400">
          $${Number(client.monthly_fee).toLocaleString('es-AR')} ARS
        </td>
        <td class="p-4 text-slate-300 font-mono">
          ${client.next_due_date || 'A definir'}
        </td>
        <td class="p-4">
          ${statusBadge}
        </td>
        <td class="p-4 text-right">
          <div class="inline-flex items-center gap-1.5">
            <a
              href="${wspLink}"
              target="_blank"
              rel="noopener"
              title="Enviar recordatorio de cobro por WhatsApp"
              class="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
            >
              <span>💬</span>
              <span class="hidden sm:inline">Cobrar</span>
            </a>
            <button
              type="button"
              onclick="toggleClientPaidStatus('${client.id}')"
              title="Alternar estado Al Día / Pendiente"
              class="px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1"
            >
              <span>💳</span>
              <span class="hidden sm:inline">${client.status === 'al_dia' ? 'Marcar Pendiente' : 'Marcar Cobrado'}</span>
            </button>
            <button
              type="button"
              onclick="deleteCrmClient('${client.id}')"
              title="Eliminar cliente del CRM"
              class="px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20 text-xs transition"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Cambiar estado de cobro en 1 clic
window.toggleClientPaidStatus = function(clientId) {
  const client = crmClients.find(c => c.id === clientId);
  if (!client) return;

  if (client.status === 'al_dia') {
    client.status = 'pendiente';
  } else {
    client.status = 'al_dia';
    client.last_payment_date = new Date().toISOString().split('T')[0];
    // Calcular siguiente vencimiento sumando 1 mes
    const parts = (client.next_due_date || '').split('-');
    if (parts.length === 3) {
      let y = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10) + 1;
      if (m > 12) { m = 1; y += 1; }
      client.next_due_date = `${y}-${String(m).padStart(2, '0')}-${parts[2]}`;
    }
  }

  localStorage.setItem('caribia_crm_clients', JSON.stringify(crmClients));
  renderCrmClients();

  // Sincronizar actualización con el Worker
  fetch(`${API_BASE_URL}/api/admin/crm/clients/${clientId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: client.status })
  }).catch(() => {});
};

// Eliminar cliente del CRM
window.deleteCrmClient = function(clientId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este cliente del CRM?')) return;

  crmClients = crmClients.filter(c => c.id !== clientId);
  localStorage.setItem('caribia_crm_clients', JSON.stringify(crmClients));
  renderCrmClients();

  fetch(`${API_BASE_URL}/api/admin/crm/clients/${clientId}`, {
    method: 'DELETE'
  }).catch(() => {});
};

// Sincronizar clientes con la API de Cloudflare
async function syncCrmWithCloudApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/crm/clients`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.clients && data.clients.length > 0) {
        crmClients = data.clients;
        localStorage.setItem('caribia_crm_clients', JSON.stringify(crmClients));
        renderCrmClients();
      }
    }
  } catch (e) {
    console.log('Operando con almacenamiento local para el CRM.');
  }
}

// ====================================================================
// 5. MOTOR DE APROVISIONAMIENTO DE CLIENTES (FÁBRICA)
// ====================================================================
function setupSlugGenerator() {
  const nameInput = document.getElementById('client-name');
  const slugInput = document.getElementById('client-slug');
  const slugPreview = document.getElementById('slug-preview');

  nameInput.addEventListener('input', () => {
    const slug = nameInput.value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    slugInput.value = slug;
    slugPreview.textContent = `${slug || 'cliente'}.caribialabs.com`;
  });

  slugInput.addEventListener('input', () => {
    slugPreview.textContent = `${slugInput.value || 'cliente'}.caribialabs.com`;
  });
}

function setupProvisionForm() {
  const form = document.getElementById('provision-form');
  const successBox = document.getElementById('provision-success-box');
  const successTitle = document.getElementById('success-title');
  const btnOpenGen = document.getElementById('btn-open-generated');
  const btnCopy = document.getElementById('btn-copy-link');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('client-name').value.trim();
    const slug = document.getElementById('client-slug').value.trim();
    const template = document.getElementById('client-template').value;
    const phone = document.getElementById('client-phone').value.trim();
    const alias = document.getElementById('client-alias').value.trim() || `${slug}.mp`;
    const discount = document.getElementById('client-discount').value;

    let targetUrl = `../templates/${template}/index.html?tenant=${slug}`;
    if (slug === 'garage-pimpollos') targetUrl = '../dist/tenants/garage-pimpollos/index.html';
    if (slug === 'forno-palermo') targetUrl = '../dist/tenants/forno-palermo/index.html';

    const newTenant = {
      name,
      slug,
      template,
      templateName: document.getElementById('client-template').selectedOptions[0].text,
      phone,
      alias,
      discount: parseInt(discount, 10),
      url: targetUrl
    };

    tenants.unshift(newTenant);
    localStorage.setItem('caribia_admin_tenants', JSON.stringify(tenants));
    renderTenants();

    // También agregar al CRM si no existe
    const existsInCrm = crmClients.some(c => c.business_name.toLowerCase() === name.toLowerCase());
    if (!existsInCrm) {
      const crmEntry = {
        id: `crm-${Date.now()}`,
        business_name: name,
        contact_name: name,
        whatsapp_phone: phone,
        email: `${slug}@cliente.com`,
        plan_name: newTenant.templateName.split('(')[0].trim(),
        monthly_fee: 45000,
        currency: 'ARS',
        billing_day: 10,
        payment_method: 'Transferencia Alias',
        status: 'al_dia',
        next_due_date: calculateNextDueDate(10),
        last_payment_date: new Date().toISOString().split('T')[0],
        notes: `Aprovisionado automáticamente desde la plantilla ${template}.`
      };
      crmClients.unshift(crmEntry);
      localStorage.setItem('caribia_crm_clients', JSON.stringify(crmClients));
      renderCrmClients();
    }

    successTitle.textContent = `¡"${name}" aprovisionado con éxito en 1.2 segundos!`;
    btnOpenGen.href = targetUrl;
    successBox.classList.remove('hidden');

    btnCopy.onclick = () => {
      const fullUrl = `${window.location.origin}/${slug}`;
      navigator.clipboard.writeText(fullUrl).then(() => {
        btnCopy.textContent = '¡Enlace Copiado! ✓';
        setTimeout(() => { btnCopy.textContent = 'Copiar Enlace para WhatsApp 📋'; }, 2000);
      });
    };

    successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

function renderTenants() {
  const tbody = document.getElementById('tenants-table-body');
  const badge = document.getElementById('tenants-badge');
  if (!tbody) return;

  if (badge) badge.textContent = tenants.length;

  tbody.innerHTML = tenants.map(t => `
    <tr class="hover:bg-slate-900/50 transition">
      <td class="py-3.5 px-3 font-bold text-white">${escapeHtml(t.name)}</td>
      <td class="py-3.5 px-3 text-slate-300">${escapeHtml(t.templateName || t.template)}</td>
      <td class="py-3.5 px-3 font-mono text-emerald-400">+${escapeHtml(t.phone)}</td>
      <td class="py-3.5 px-3 font-mono text-cyan-400">${escapeHtml(t.alias || 'Sin alias')}</td>
      <td class="py-3.5 px-3 font-mono text-slate-400">${escapeHtml(t.slug)}.caribialabs.com</td>
      <td class="py-3.5 px-3 text-right">
        <a href="${t.url}" target="_blank" class="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs inline-block">
          Abrir ↗
        </a>
      </td>
    </tr>
  `).join('');
}

// ====================================================================
// 6. SIMULADOR DE CHATBOT CON IA REAL (CLOUDFLARE WORKERS AI + GEMINI)
// ====================================================================
function setupChatSimulator() {
  const form = document.getElementById('chat-simulator-form');
  const input = document.getElementById('sim-user-message');
  const chatBox = document.getElementById('chat-messages-box');
  const tenantSelect = document.getElementById('sim-tenant-select');
  const engineBadgeLabel = document.getElementById('active-engine-label');
  const engineBadge = document.getElementById('active-engine-badge');

  // Configuración de Gemini API Key
  const toggleBtn = document.getElementById('gemini-toggle-btn');
  const toggleCard = document.getElementById('toggle-gemini-card');
  const drawer = document.getElementById('gemini-config-drawer');
  const geminiInput = document.getElementById('gemini-api-key-input');
  const saveKeyBtn = document.getElementById('btn-save-gemini-key');
  const clearKeyBtn = document.getElementById('btn-clear-gemini-key');

  function updateEngineStatus() {
    const savedKey = localStorage.getItem('caribia_gemini_api_key');
    if (savedKey) {
      if (engineBadgeLabel) engineBadgeLabel.textContent = 'Google Gemini 2.0 Flash (Activo)';
      if (engineBadge) {
        engineBadge.className = 'text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5';
      }
      if (geminiInput) geminiInput.value = savedKey;
    } else {
      if (engineBadgeLabel) engineBadgeLabel.textContent = 'Cloudflare Workers AI (Llama 3.2 3B)';
      if (engineBadge) {
        engineBadge.className = 'text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5';
      }
      if (geminiInput) geminiInput.value = '';
    }
  }

  updateEngineStatus();

  // Toggle drawer
  function toggleDrawer() {
    if (drawer) drawer.classList.toggle('hidden');
  }
  if (toggleBtn) toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDrawer(); });
  if (toggleCard) toggleCard.addEventListener('click', toggleDrawer);

  // Guardar clave
  if (saveKeyBtn) {
    saveKeyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = geminiInput.value.trim();
      if (!key) {
        alert('Por favor ingresa una API Key válida de Google Gemini');
        return;
      }
      localStorage.setItem('caribia_gemini_api_key', key);
      updateEngineStatus();
      alert('✅ API Key de Google Gemini guardada. El bot ahora responderá con Gemini 2.0 Flash.');
      if (drawer) drawer.classList.add('hidden');
    });
  }

  // Borrar clave
  if (clearKeyBtn) {
    clearKeyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      localStorage.removeItem('caribia_gemini_api_key');
      updateEngineStatus();
      alert('ℹ️ API Key eliminada. El bot usará Cloudflare Workers AI (Llama 3.2 3B) gratis.');
    });
  }

  // Chips de preguntas frecuentes
  const chips = document.querySelectorAll('#quick-prompt-chips .chip-btn');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && input) {
        input.value = prompt;
        form.dispatchEvent(new Event('submit'));
      }
    });
  });

  // Envío del mensaje
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMsg = input.value.trim();
    if (!userMsg) return;

    // Agregar mensaje del usuario
    appendMessage(userMsg, 'user');
    input.value = '';

    // Estado cargando
    const typingId = appendTypingIndicator();

    try {
      const selectedSlug = tenantSelect ? tenantSelect.value : 'aura-studio';
      const customKey = localStorage.getItem('caribia_gemini_api_key') || '';

      const res = await fetch(`${API_BASE_URL}/api/whatsapp/test-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-gemini-key': customKey } : {})
        },
        body: JSON.stringify({
          message: userMsg,
          slug: selectedSlug,
          tenantSlug: selectedSlug,
          apiKey: customKey
        })
      });

      removeTypingIndicator(typingId);

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || data.aiResponse || '¡Hola! Recibí tu consulta.';
        const provider = data.provider || 'AI Engine';
        appendMessage(replyText, 'ai', provider);
      } else {
        const errData = await res.text().catch(() => '');
        appendMessage(`⚠️ El servidor respondió con un error (${res.status}). Detalle: ${errData || 'Sin detalles'}`, 'ai', 'Error');
      }
    } catch (err) {
      removeTypingIndicator(typingId);
      appendMessage(`⚠️ No se pudo conectar con el servidor de IA (${err.message}). Verifica tu conexión o el estado del Worker en Cloudflare.`, 'ai', 'Error');
    }
  });

  function formatAiText(text) {
    let clean = escapeHtml(text);
    // Negritas **texto**
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    // Saltos de línea
    clean = clean.replace(/\n/g, '<br/>');
    return clean;
  }

  function appendMessage(text, sender, provider) {
    const div = document.createElement('div');
    div.className = 'flex gap-2';

    if (sender === 'user') {
      div.classList.add('justify-end');
      div.innerHTML = `
        <div class="bg-cyan-600 p-3 rounded-2xl rounded-tr-none max-w-[85%] text-white text-xs leading-relaxed shadow-lg">
          ${escapeHtml(text)}
        </div>
      `;
    } else {
      let badgeLabel = 'IA Real';
      let badgeClass = 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';

      if (provider) {
        if (provider.includes('llama')) {
          badgeLabel = '⚡ Cloudflare Workers AI (Llama 3.2 3B)';
          badgeClass = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
        } else if (provider.includes('gemini')) {
          badgeLabel = '✨ Google Gemini 2.0 Flash';
          badgeClass = 'text-purple-400 border-purple-500/30 bg-purple-500/10';
        } else if (provider.includes('Error')) {
          badgeLabel = '⚠️ Alerta';
          badgeClass = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
        } else {
          badgeLabel = provider;
        }
      }

      div.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0 mt-1">IA</div>
        <div class="bg-slate-800/90 border border-slate-700/60 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200 text-xs leading-relaxed space-y-1.5 shadow-lg">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}">
              ${badgeLabel}
            </span>
          </div>
          <div>${formatAiText(text)}</div>
        </div>
      `;
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function appendTypingIndicator() {
    const id = `typing-${Date.now()}`;
    const div = document.createElement('div');
    div.id = id;
    div.className = 'flex gap-2';
    div.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-[10px] text-white flex-shrink-0">IA</div>
      <div class="bg-slate-800 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-slate-400 italic text-xs flex items-center gap-2">
        <span class="inline-flex gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
        </span>
        <span>Generando respuesta inteligente con el LLM...</span>
      </div>
    `;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
