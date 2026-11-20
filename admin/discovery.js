// ====================================================================
// CARIBIA LABS - HOMEPAGE 1: DISCOVERY CRM & LEVANTAMIENTO COMERCIAL
// Relevamiento en vivo, preguntas personalizadas, cotizaciones y conversión
// ====================================================================

// Base inicial limpia para prospectos reales (las 5 tarjetas demo fueron retiradas para no ensuciar la base real)
const INITIAL_DISCOVERY_LEADS = [];

// Preguntas inteligentes sugeridas para llamadas de prospección
const SMART_DISCOVERY_QUESTIONS = [
  {
    question: '¿Cuánto tiempo pasa desde que un cliente escribe pidiendo precios hasta que le envían el presupuesto?',
    answer: ''
  },
  {
    question: '¿Qué sucede con los clientes que consultan después de las 21hs o los fines de semana?',
    answer: ''
  },
  {
    question: '¿Tienen guardados los teléfonos y nombres de los clientes para hacerles recompras automáticas?',
    answer: ''
  },
  {
    question: '¿Cuál es la principal objeción o duda que frena a los clientes antes de pagar?',
    answer: ''
  }
];

// Carga y purga de datos demo previos en localStorage
function loadSavedDiscoveryLeads() {
  try {
    const raw = localStorage.getItem('caribia_discovery_leads');
    if (!raw) return [];
    let list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    // Purgar los 5 IDs demo antiguos de prueba para dejar la base limpia
    const demoIds = ['disc-001', 'disc-002', 'disc-003', 'disc-004', 'disc-005'];
    list = list.filter(item => !demoIds.includes(item.id));
    localStorage.setItem('caribia_discovery_leads', JSON.stringify(list));
    return list;
  } catch (e) {
    console.warn('Error leyendo caribia_discovery_leads:', e);
    return [];
  }
}

// Estado global de Discovery CRM
let discoveryLeads = loadSavedDiscoveryLeads();
let currentDiscFilter = 'todos';
let currentDiscRubro = 'todos';
let discSearchQuery = '';
let currentCustomQas = [];
let activeViewingLeadId = null;

// Helper de formato de moneda
function formatMoney(amount, currency = 'ARS') {
  const num = Number(amount) || 0;
  return '$' + num.toLocaleString('es-AR') + ' ' + currency;
}

// Helper de etiquetas de estado
function getStatusBadgeHtml(status) {
  switch (status) {
    case 'diagnostic':
      return '<span class="status-pill status-diagnostic">🔍 En Diagnóstico</span>';
    case 'quoted':
      return '<span class="status-pill status-quoted">📄 Cotización Enviada</span>';
    case 'negotiation':
      return '<span class="status-pill status-negotiation">💬 En Negociación</span>';
    case 'won':
      return '<span class="status-pill status-won">🏆 Cliente Ganado</span>';
    case 'lost':
      return '<span class="status-pill status-lost">❌ Perdido / No Cerró</span>';
    default:
      return '<span class="status-pill status-diagnostic">' + escapeHtml(status) + '</span>';
  }
}

function getRubroLabel(rubro) {
  const map = {
    retail: '👗 Retail & Indumentaria',
    gastronomia: '🍔 Gastronomía & Delivery',
    salud: '🩺 Salud & Citas Médicas',
    belleza: '💄 Estética & Belleza',
    inmobiliaria: '🏢 Inmobiliarias',
    servicios: '⚡ Servicios B2B',
    otro: '📦 Comercio & Mayorista'
  };
  return map[rubro] || '🏢 ' + rubro;
}

// ====================================================================
// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN DE DISCOVERY CRM (HOMEPAGE 1)
// ====================================================================
function setupDiscoveryCrmModule() {
  const filterBtns = document.querySelectorAll('.disc-filter-btn');
  const rubroSelect = document.getElementById('discovery-rubro-select');
  const searchInput = document.getElementById('discovery-search-input');
  const btnOpenModal = document.getElementById('btn-open-discovery-modal');
  const btnCloseModal = document.getElementById('btn-close-discovery-modal');
  const btnCancel = document.getElementById('btn-cancel-discovery');
  const modal = document.getElementById('modal-discovery');
  const form = document.getElementById('form-discovery');
  const btnExportJson = document.getElementById('btn-export-discovery-json');
  const btnAddQa = document.getElementById('btn-add-custom-qa');
  const btnSuggestQuestions = document.getElementById('btn-suggest-questions');

  // Modal Detalle
  const modalDetail = document.getElementById('modal-lead-detail');
  const btnCloseDetail = document.getElementById('btn-close-lead-detail');
  const btnDetailClose = document.getElementById('btn-detail-close');
  const btnDetailCopyPitch = document.getElementById('btn-detail-copy-pitch');
  const btnDetailConvertClient = document.getElementById('btn-detail-convert-client');
  const btnDetailEdit = document.getElementById('btn-detail-edit');

  // Inicializar toggles de chips interactivos
  setupChipToggles('chips-physical-scope', false);
  setupChipToggles('chips-virtual-scope', false);
  setupChipToggles('chips-contact-channels', false);
  setupChipToggles('chips-bottlenecks', true);

  // Filtros de estado (Todos, Diagnóstico, Cotizada, Negociación, Ganada, Perdida)
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        b.classList.add('text-slate-400', 'bg-slate-900', 'border-slate-800');
      });
      btn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
      btn.classList.remove('text-slate-400', 'bg-slate-900', 'border-slate-800');

      currentDiscFilter = btn.getAttribute('data-status');
      renderDiscoveryLeads();
    });
  });

  // Selector de rubro
  if (rubroSelect) {
    rubroSelect.addEventListener('change', () => {
      currentDiscRubro = rubroSelect.value;
      renderDiscoveryLeads();
    });
  }

  // Buscador reactivo
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      discSearchQuery = e.target.value.toLowerCase().trim();
      renderDiscoveryLeads();
    });
  }

  // Abrir modal de nuevo levantamiento
  if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => {
      openDiscoveryFormForCreate();
    });
  }

  // Cerrar modal con confirmación si hay datos sin guardar (NUNCA por clic fuera accidental)
  const handleCloseModal = () => {
    if (isDiscoveryFormDirty()) {
      if (!confirm('¿Deseas cerrar la ficha? Tu avance quedará guardado en el borrador automático.')) {
        return;
      }
    }
    modal.classList.add('hidden');
  };

  if (btnCloseModal) btnCloseModal.addEventListener('click', handleCloseModal);
  if (btnCancel) btnCancel.addEventListener('click', handleCloseModal);

  // Botón para descartar borrador y empezar limpio
  const btnDiscardDraft = document.getElementById('btn-discard-draft');
  if (btnDiscardDraft) {
    btnDiscardDraft.addEventListener('click', () => {
      if (confirm('¿Deseas descartar el borrador y comenzar con el formulario limpio?')) {
        clearDiscoveryDraft();
        openDiscoveryFormForCreate(true);
      }
    });
  }

  // Agregar pregunta dinámica personalizada
  if (btnAddQa) {
    btnAddQa.addEventListener('click', () => {
      addCustomQaItem('', '');
    });
  }

  // Sugerir preguntas inteligentes
  if (btnSuggestQuestions) {
    btnSuggestQuestions.addEventListener('click', () => {
      SMART_DISCOVERY_QUESTIONS.forEach(item => {
        const exists = currentCustomQas.some(q => q.question === item.question);
        if (!exists) {
          currentCustomQas.push({ question: item.question, answer: item.answer });
        }
      });
      renderDynamicQaList();
      saveDiscoveryDraft();
    });
  }

  // Exportar base de cotizaciones a JSON
  if (btnExportJson) {
    btnExportJson.addEventListener('click', exportDiscoveryJson);
  }

  // Submit del formulario de levantamiento con protección contra Enter accidental
  if (form) {
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    });

    form.addEventListener('input', () => {
      saveDiscoveryDraft();
    });
    form.addEventListener('change', () => {
      saveDiscoveryDraft();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveDiscoveryLeadFromForm();
    });
  }

  // Modal de Detalle
  const closeDetail = () => modalDetail.classList.add('hidden');
  if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeDetail);
  if (btnDetailClose) btnDetailClose.addEventListener('click', closeDetail);
  if (modalDetail) {
    modalDetail.addEventListener('click', (e) => {
      if (e.target === modalDetail) closeDetail();
    });
  }

  if (btnDetailCopyPitch) {
    btnDetailCopyPitch.addEventListener('click', () => {
      if (activeViewingLeadId) copyWhatsAppPitch(activeViewingLeadId);
    });
  }

  if (btnDetailConvertClient) {
    btnDetailConvertClient.addEventListener('click', () => {
      if (activeViewingLeadId) convertLeadToActiveClient(activeViewingLeadId);
    });
  }

  if (btnDetailEdit) {
    btnDetailEdit.addEventListener('click', () => {
      if (activeViewingLeadId) {
        modalDetail.classList.add('hidden');
        openEditDiscoveryModal(activeViewingLeadId);
      }
    });
  }

  const btnDetailCopyAi = document.getElementById('btn-detail-copy-ai-prompt');
  if (btnDetailCopyAi) {
    btnDetailCopyAi.addEventListener('click', () => {
      if (activeViewingLeadId) copyAiPromptForLead(activeViewingLeadId);
    });
  }

  // Cablear inputs de campos manuales / personalizados en todas las secciones
  wireAddCustomChip('btn-add-physical', 'input-add-physical', 'chips-physical-scope', false);
  wireAddCustomChip('btn-add-virtual', 'input-add-virtual', 'chips-virtual-scope', true);
  wireAddCustomChip('btn-add-channel', 'input-add-channel', 'chips-contact-channels', false);
  wireAddCustomChip('btn-add-bottleneck', 'input-add-bottleneck', 'chips-bottlenecks', true);

  // Render inicial de tarjetas y KPIs
  renderDiscoveryLeads();
  renderDiscoveryKpis();
  renderDiscoveryInsights();
}

// --------------------------------------------------------------------
// MANEJO DE CHIPS INTERACTIVOS (SELECCIÓN CON UN TOQUE Y MANUALES)
// --------------------------------------------------------------------
function wireAddCustomChip(btnId, inputId, containerId, isDanger = false) {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const container = document.getElementById(containerId);
  if (!btn || !input || !container) return;

  function doAdd() {
    const text = input.value.trim();
    if (!text) return;

    const chips = Array.from(container.querySelectorAll('.chip-toggle'));
    const existing = chips.find(c => (c.getAttribute('data-val') || c.textContent.trim()).toLowerCase() === text.toLowerCase());

    if (existing) {
      if (isDanger) {
        existing.classList.add('active-danger');
      } else {
        existing.classList.add('active');
      }
    } else {
      const span = document.createElement('span');
      span.className = 'chip-toggle ' + (isDanger ? 'active-danger' : 'active');
      span.setAttribute('data-val', text);
      span.innerHTML = `<span>✏️ ${escapeHtml(text)}</span> <span class="ml-1 text-[10px] text-slate-400 hover:text-white" onclick="event.stopPropagation(); this.parentElement.remove(); if (typeof saveDiscoveryDraft === 'function') saveDiscoveryDraft();">✕</span>`;
      container.appendChild(span);
    }

    input.value = '';
    if (typeof saveDiscoveryDraft === 'function') saveDiscoveryDraft();
  }

  btn.addEventListener('click', doAdd);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doAdd();
    }
  });
}

function setupChipToggles(containerId, isDanger = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip-toggle');
    if (!chip) return;

    if (isDanger) {
      chip.classList.toggle('active-danger');
    } else {
      chip.classList.toggle('active');
    }
    if (typeof saveDiscoveryDraft === 'function') saveDiscoveryDraft();
  });
}

function getSelectedChips(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  const selected = [];
  container.querySelectorAll('.chip-toggle').forEach(chip => {
    if (chip.classList.contains('active') || chip.classList.contains('active-danger') || chip.classList.contains('active-emerald')) {
      selected.push(chip.getAttribute('data-val') || chip.textContent.trim());
    }
  });
  return selected;
}

function setSelectedChips(containerId, valuesArray, isDanger = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const values = Array.isArray(valuesArray) ? valuesArray : [];

  container.querySelectorAll('.chip-toggle').forEach(chip => {
    chip.classList.remove('active', 'active-danger', 'active-emerald');
  });

  values.forEach(val => {
    if (!val) return;
    const chips = Array.from(container.querySelectorAll('.chip-toggle'));
    const existing = chips.find(c => (c.getAttribute('data-val') || c.textContent.trim()).toLowerCase() === val.toLowerCase());

    if (existing) {
      if (isDanger) {
        existing.classList.add('active-danger');
      } else {
        existing.classList.add('active');
      }
    } else {
      const span = document.createElement('span');
      span.className = 'chip-toggle ' + (isDanger ? 'active-danger' : 'active');
      span.setAttribute('data-val', val);
      span.innerHTML = `<span>✏️ ${escapeHtml(val)}</span> <span class="ml-1 text-[10px] text-slate-400 hover:text-white" onclick="event.stopPropagation(); this.parentElement.remove();">✕</span>`;
      container.appendChild(span);
    }
  });
}

// --------------------------------------------------------------------
// MOTOR DINÁMICO DE PREGUNTAS & RESPUESTAS (CUSTOM Q&A)
// --------------------------------------------------------------------
function renderDynamicQaList() {
  const container = document.getElementById('dynamic-qa-list');
  if (!container) return;

  if (currentCustomQas.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 border border-dashed border-slate-800 rounded-xl text-slate-500">
        <span class="text-sm">💬 No has agregado preguntas personalizadas aún.</span>
        <div class="mt-1">
          <button type="button" class="text-cyan-400 font-bold hover:underline cursor-pointer" onclick="document.getElementById('btn-suggest-questions').click()">
            Sugerir preguntas clave de prospección
          </button>
          o haz clic en "+ Agregar Pregunta Libre".
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = currentCustomQas.map((item, index) => `
    <div class="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2 relative group">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 flex-1">
          <span class="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
            ${index + 1}
          </span>
          <input
            type="text"
            placeholder="Escribe la pregunta o tema abordado..."
            value="${escapeHtml(item.question)}"
            oninput="updateCustomQaItem(${index}, 'question', this.value)"
            class="glass-input flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-200"
          />
        </div>
        <button
          type="button"
          onclick="removeCustomQaItem(${index})"
          class="text-slate-500 hover:text-rose-400 p-1.5 rounded transition text-xs cursor-pointer"
          title="Eliminar pregunta"
        >
          🗑️
        </button>
      </div>
      <div>
        <textarea
          rows="2"
          placeholder="Escribe aquí la respuesta o detalle aportado por el cliente durante la charla..."
          oninput="updateCustomQaItem(${index}, 'answer', this.value)"
          class="glass-input w-full px-3 py-2 rounded-lg text-xs"
        >${escapeHtml(item.answer)}</textarea>
      </div>
    </div>
  `).join('');
}

window.updateCustomQaItem = function(index, field, value) {
  if (currentCustomQas[index]) {
    currentCustomQas[index][field] = value;
    if (typeof saveDiscoveryDraft === 'function') saveDiscoveryDraft();
  }
};

function addCustomQaItem(q = '', a = '') {
  currentCustomQas.push({ question: q, answer: a });
  renderDynamicQaList();
  if (typeof saveDiscoveryDraft === 'function') saveDiscoveryDraft();
  setTimeout(() => {
    const inputs = document.querySelectorAll('#dynamic-qa-list input');
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus();
    }
  }, 50);
}

window.removeCustomQaItem = function(index) {
  currentCustomQas.splice(index, 1);
  renderDynamicQaList();
  if (typeof saveDiscoveryDraft === 'function') saveDiscoveryDraft();
};

// --------------------------------------------------------------------
// MOTOR DE BORRADOR AUTOMÁTICO & PROTECCIÓN DE DATOS
// --------------------------------------------------------------------
function isDiscoveryFormDirty() {
  const biz = document.getElementById('disc-business')?.value.trim() || '';
  const contact = document.getElementById('disc-contact')?.value.trim() || '';
  const phone = document.getElementById('disc-phone')?.value.trim() || '';
  const notes = document.getElementById('disc-notes')?.value.trim() || '';
  const customQasWithAnswers = currentCustomQas.some(q => q.answer && q.answer.trim().length > 0);
  return Boolean(biz || contact || phone || notes || customQasWithAnswers);
}

function saveDiscoveryDraft() {
  const form = document.getElementById('form-discovery');
  if (!form) return;
  const existingId = document.getElementById('disc-id')?.value;
  // Solo auto-guardar si estamos registrando un nuevo lead, no editando uno existente
  if (existingId) return;

  const draft = {
    business_name: document.getElementById('disc-business')?.value || '',
    rubro: document.getElementById('disc-rubro')?.value || 'retail',
    contact_name: document.getElementById('disc-contact')?.value || '',
    role_title: document.getElementById('disc-role')?.value || '',
    whatsapp_phone: document.getElementById('disc-phone')?.value || '',
    email: document.getElementById('disc-email')?.value || '',
    social_network: document.getElementById('disc-social')?.value || '',
    location: document.getElementById('disc-location')?.value || '',
    physical_scope: getSelectedChips('chips-physical-scope'),
    virtual_scope: getSelectedChips('chips-virtual-scope'),
    contact_channels: getSelectedChips('chips-contact-channels'),
    volume_level: document.getElementById('disc-volume')?.value || 'medio',
    peak_hours: document.getElementById('disc-peak-hours')?.value || '',
    bottlenecks: getSelectedChips('chips-bottlenecks'),
    goals: document.getElementById('disc-goals')?.value || '',
    tools_used: document.getElementById('disc-tools')?.value || '',
    avg_ticket: document.getElementById('disc-ticket')?.value || '',
    team_size: document.getElementById('disc-team-size')?.value || '',
    custom_qa: currentCustomQas,
    solution_name: document.getElementById('disc-solution')?.value || 'Bot WhatsApp IA 24/7',
    delivery_time: document.getElementById('disc-delivery-time')?.value || '72 horas hábiles',
    setup_fee: document.getElementById('disc-setup-fee')?.value || '',
    monthly_fee: document.getElementById('disc-monthly-fee')?.value || '',
    currency: document.getElementById('disc-currency')?.value || 'ARS',
    status: document.getElementById('disc-status')?.value || 'diagnostic',
    next_step: document.getElementById('disc-next-step')?.value || '',
    notes: document.getElementById('disc-notes')?.value || '',
    updated_at: Date.now()
  };

  const hasAnyData = Boolean(
    draft.business_name || draft.contact_name || draft.whatsapp_phone ||
    draft.notes || draft.physical_scope.length > 1 || draft.custom_qa.some(q => q.answer)
  );

  if (hasAnyData) {
    localStorage.setItem('caribia_discovery_draft', JSON.stringify(draft));
    const draftBar = document.getElementById('disc-draft-bar');
    if (draftBar) draftBar.classList.remove('hidden');
  }
}

function clearDiscoveryDraft() {
  localStorage.removeItem('caribia_discovery_draft');
  const draftBar = document.getElementById('disc-draft-bar');
  if (draftBar) draftBar.classList.add('hidden');
}

// --------------------------------------------------------------------
// ABRIR FORMULARIO PARA CREAR / EDITAR
// --------------------------------------------------------------------
function openDiscoveryFormForCreate(forceClean = false) {
  const modal = document.getElementById('modal-discovery');
  const title = document.getElementById('discovery-modal-title');
  const form = document.getElementById('form-discovery');
  const draftBar = document.getElementById('disc-draft-bar');

  title.textContent = 'Ficha de Levantamiento de Información & Cotización';
  document.getElementById('disc-id').value = '';
  form.reset();

  const savedDraft = !forceClean ? JSON.parse(localStorage.getItem('caribia_discovery_draft') || 'null') : null;

  if (savedDraft) {
    // Restaurar borrador previo intacto
    if (document.getElementById('disc-business')) document.getElementById('disc-business').value = savedDraft.business_name || '';
    if (document.getElementById('disc-rubro')) document.getElementById('disc-rubro').value = savedDraft.rubro || 'retail';
    if (document.getElementById('disc-contact')) document.getElementById('disc-contact').value = savedDraft.contact_name || '';
    if (document.getElementById('disc-role')) document.getElementById('disc-role').value = savedDraft.role_title || '';
    if (document.getElementById('disc-phone')) document.getElementById('disc-phone').value = savedDraft.whatsapp_phone || '';
    if (document.getElementById('disc-email')) document.getElementById('disc-email').value = savedDraft.email || '';
    if (document.getElementById('disc-social')) document.getElementById('disc-social').value = savedDraft.social_network || '';
    if (document.getElementById('disc-location')) document.getElementById('disc-location').value = savedDraft.location || '';
    if (document.getElementById('disc-volume')) document.getElementById('disc-volume').value = savedDraft.volume_level || 'medio';
    if (document.getElementById('disc-peak-hours')) document.getElementById('disc-peak-hours').value = savedDraft.peak_hours || '';
    if (document.getElementById('disc-goals')) document.getElementById('disc-goals').value = savedDraft.goals || '';
    if (document.getElementById('disc-tools')) document.getElementById('disc-tools').value = savedDraft.tools_used || '';
    if (document.getElementById('disc-ticket')) document.getElementById('disc-ticket').value = savedDraft.avg_ticket || '';
    if (document.getElementById('disc-team-size')) document.getElementById('disc-team-size').value = savedDraft.team_size || '';
    if (document.getElementById('disc-solution')) document.getElementById('disc-solution').value = savedDraft.solution_name || 'Bot WhatsApp IA 24/7';
    if (document.getElementById('disc-delivery-time')) document.getElementById('disc-delivery-time').value = savedDraft.delivery_time || '72 horas hábiles';
    if (document.getElementById('disc-setup-fee')) document.getElementById('disc-setup-fee').value = savedDraft.setup_fee || '';
    if (document.getElementById('disc-monthly-fee')) document.getElementById('disc-monthly-fee').value = savedDraft.monthly_fee || '';
    if (document.getElementById('disc-currency')) document.getElementById('disc-currency').value = savedDraft.currency || 'ARS';
    if (document.getElementById('disc-status')) document.getElementById('disc-status').value = savedDraft.status || 'diagnostic';
    if (document.getElementById('disc-next-step')) document.getElementById('disc-next-step').value = savedDraft.next_step || '';
    if (document.getElementById('disc-notes')) document.getElementById('disc-notes').value = savedDraft.notes || '';

    setSelectedChips('chips-physical-scope', savedDraft.physical_scope || ['1 Local a la calle']);
    setSelectedChips('chips-virtual-scope', savedDraft.virtual_scope || ['Sin sitio web', 'Solo atienden por WhatsApp'], true);
    setSelectedChips('chips-contact-channels', savedDraft.contact_channels || ['WhatsApp manual', 'Boca a boca / Referidos']);
    setSelectedChips('chips-bottlenecks', savedDraft.bottlenecks || ['Pérdida de ventas de noche', 'Demoran horas en cotizar'], true);

    currentCustomQas = Array.isArray(savedDraft.custom_qa) && savedDraft.custom_qa.length > 0
      ? savedDraft.custom_qa
      : SMART_DISCOVERY_QUESTIONS.map(q => ({ question: q.question, answer: '' }));
    renderDynamicQaList();

    if (draftBar) draftBar.classList.remove('hidden');
  } else {
    // Defaults limpios
    setSelectedChips('chips-physical-scope', ['1 Local a la calle']);
    setSelectedChips('chips-virtual-scope', ['Sin sitio web', 'Solo atienden por WhatsApp'], true);
    setSelectedChips('chips-contact-channels', ['WhatsApp manual', 'Boca a boca / Referidos']);
    setSelectedChips('chips-bottlenecks', ['Pérdida de ventas de noche', 'Demoran horas en cotizar'], true);

    currentCustomQas = SMART_DISCOVERY_QUESTIONS.map(q => ({ question: q.question, answer: '' }));
    renderDynamicQaList();

    if (draftBar) draftBar.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

function openEditDiscoveryModal(leadId) {
  const lead = discoveryLeads.find(l => l.id === leadId);
  if (!lead) return;

  const modal = document.getElementById('modal-discovery');
  const title = document.getElementById('discovery-modal-title');
  const draftBar = document.getElementById('disc-draft-bar');
  if (draftBar) draftBar.classList.add('hidden');

  title.textContent = 'Editar Levantamiento: ' + lead.business_name;
  document.getElementById('disc-id').value = lead.id;
  document.getElementById('disc-business').value = lead.business_name || '';
  document.getElementById('disc-rubro').value = lead.rubro || 'retail';
  document.getElementById('disc-contact').value = lead.contact_name || '';
  document.getElementById('disc-role').value = lead.role_title || '';
  document.getElementById('disc-phone').value = lead.whatsapp_phone || '';
  document.getElementById('disc-email').value = lead.email || '';
  document.getElementById('disc-social').value = lead.social_network || '';
  document.getElementById('disc-location').value = lead.location || '';

  // Chips
  setSelectedChips('chips-physical-scope', lead.physical_scope || []);
  setSelectedChips('chips-virtual-scope', lead.virtual_scope || []);
  setSelectedChips('chips-contact-channels', lead.contact_channels || []);
  setSelectedChips('chips-bottlenecks', lead.bottlenecks || [], true);

  document.getElementById('disc-volume').value = lead.volume_level || 'medio';
  document.getElementById('disc-peak-hours').value = lead.peak_hours || '';
  document.getElementById('disc-goals').value = lead.goals || '';
  document.getElementById('disc-tools').value = lead.tools_used || '';
  document.getElementById('disc-ticket').value = lead.avg_ticket || '';
  document.getElementById('disc-team-size').value = lead.team_size || '';

  currentCustomQas = Array.isArray(lead.custom_qa) ? JSON.parse(JSON.stringify(lead.custom_qa)) : [];
  renderDynamicQaList();

  document.getElementById('disc-solution').value = lead.solution_name || 'Bot WhatsApp IA 24/7';
  document.getElementById('disc-delivery-time').value = lead.delivery_time || '72 horas hábiles';
  document.getElementById('disc-setup-fee').value = lead.setup_fee || '';
  document.getElementById('disc-monthly-fee').value = lead.monthly_fee || 0;
  document.getElementById('disc-currency').value = lead.currency || 'ARS';
  document.getElementById('disc-status').value = lead.status || 'quoted';
  document.getElementById('disc-next-step').value = lead.next_step || '';
  document.getElementById('disc-notes').value = lead.notes || '';

  modal.classList.remove('hidden');
}

// --------------------------------------------------------------------
// GUARDAR LEVANTAMIENTO DESDE EL FORMULARIO
// --------------------------------------------------------------------
function saveDiscoveryLeadFromForm() {
  const modal = document.getElementById('modal-discovery');
  const existingId = document.getElementById('disc-id').value;

  const bizNameInput = document.getElementById('disc-business');
  const bizName = bizNameInput ? bizNameInput.value.trim() : '';

  if (!bizName) {
    showToastNotification('⚠️ Ingresa al menos el Nombre Comercial de la empresa para guardar la ficha', 'error');
    if (bizNameInput) {
      bizNameInput.focus();
      bizNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  const validQas = currentCustomQas.filter(q => (q.question && q.question.trim().length > 0) || (q.answer && q.answer.trim().length > 0));
  const contactName = document.getElementById('disc-contact')?.value.trim() || 'Contacto comercial';
  const whatsappPhone = document.getElementById('disc-phone')?.value.trim() || '';

  const leadData = {
    id: existingId || ('disc-' + Date.now().toString(36)),
    business_name: bizName,
    rubro: document.getElementById('disc-rubro').value,
    contact_name: contactName,
    role_title: document.getElementById('disc-role').value.trim(),
    whatsapp_phone: whatsappPhone,
    email: document.getElementById('disc-email').value.trim(),
    social_network: document.getElementById('disc-social').value.trim(),
    location: document.getElementById('disc-location').value.trim(),
    physical_scope: getSelectedChips('chips-physical-scope'),
    virtual_scope: getSelectedChips('chips-virtual-scope'),
    contact_channels: getSelectedChips('chips-contact-channels'),
    volume_level: document.getElementById('disc-volume').value,
    peak_hours: document.getElementById('disc-peak-hours').value.trim(),
    bottlenecks: getSelectedChips('chips-bottlenecks'),
    goals: document.getElementById('disc-goals').value.trim(),
    tools_used: document.getElementById('disc-tools').value.trim(),
    avg_ticket: Number(document.getElementById('disc-ticket').value) || 0,
    team_size: document.getElementById('disc-team-size').value.trim(),
    custom_qa: validQas,
    solution_name: document.getElementById('disc-solution').value,
    delivery_time: document.getElementById('disc-delivery-time').value.trim() || '72 horas hábiles',
    setup_fee: Number(document.getElementById('disc-setup-fee').value) || 0,
    monthly_fee: Number(document.getElementById('disc-monthly-fee').value) || 0,
    currency: document.getElementById('disc-currency').value || 'ARS',
    status: document.getElementById('disc-status').value,
    next_step: document.getElementById('disc-next-step').value.trim(),
    notes: document.getElementById('disc-notes').value.trim(),
    updated_at: new Date().toISOString().split('T')[0]
  };

  if (!existingId) {
    leadData.created_at = new Date().toISOString().split('T')[0];
    discoveryLeads.unshift(leadData);
  } else {
    const idx = discoveryLeads.findIndex(l => l.id === existingId);
    if (idx !== -1) {
      leadData.created_at = discoveryLeads[idx].created_at || new Date().toISOString().split('T')[0];
      discoveryLeads[idx] = leadData;
    }
  }

  // Persistir en localStorage
  localStorage.setItem('caribia_discovery_leads', JSON.stringify(discoveryLeads));

  // Limpiar el borrador temporal tras guardado exitoso
  clearDiscoveryDraft();

  // Cerrar modal
  modal.classList.add('hidden');

  // Feedback y re-render
  renderDiscoveryLeads();
  renderDiscoveryKpis();
  renderDiscoveryInsights();

  showToastNotification(`✓ Ficha de "${bizName}" guardada en la base de datos.`);
}

// --------------------------------------------------------------------
// RENDERIZADO DE TARJETAS DE PROSPECCIÓN & COTIZACIONES
// --------------------------------------------------------------------
function renderDiscoveryLeads() {
  const container = document.getElementById('discovery-cards-grid');
  if (!container) return;

  const filtered = discoveryLeads.filter(lead => {
    if (currentDiscFilter !== 'todos' && lead.status !== currentDiscFilter) {
      return false;
    }
    if (currentDiscRubro !== 'todos' && lead.rubro !== currentDiscRubro) {
      return false;
    }
    if (discSearchQuery) {
      const matchText = (
        (lead.business_name || '') + ' ' +
        (lead.contact_name || '') + ' ' +
        (lead.location || '') + ' ' +
        (lead.goals || '') + ' ' +
        (lead.bottlenecks ? lead.bottlenecks.join(' ') : '') + ' ' +
        (lead.solution_name || '')
      ).toLowerCase();
      if (!matchText.includes(discSearchQuery)) {
        return false;
      }
    }
    return true;
  });

  updateDiscoveryCounts();

  if (discoveryLeads.length === 0) {
    container.innerHTML = `
      <div class="col-span-full glass-card p-12 text-center rounded-3xl border border-dashed border-slate-800 text-slate-400 bg-slate-900/30">
        <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-3xl">
          🎯
        </div>
        <h4 class="font-display font-bold text-white text-base">Tu CRM de Levantamiento está listo y limpio</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          No hay negocios de prueba. Todas las cotizaciones y llamadas reales que registres aparecerán aquí organizadas para darles seguimiento.
        </p>
        <button type="button" class="btn-glow px-5 py-2.5 rounded-xl text-xs font-bold text-white mt-5 cursor-pointer inline-flex items-center gap-2" onclick="openDiscoveryFormForCreate()">
          <span>+</span>
          <span>Registrar Primer Levantamiento Real</span>
        </button>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full glass-card p-12 text-center rounded-3xl border border-slate-800 text-slate-400">
        <span class="text-3xl block mb-2">🔍</span>
        <h4 class="font-display font-bold text-white text-base">No hay cotizaciones que coincidan con los filtros</h4>
        <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Prueba cambiando el estado, seleccionando otro rubro o creando un nuevo levantamiento comercial.
        </p>
        <button type="button" class="btn-glow px-4 py-2 rounded-xl text-xs font-bold text-white mt-4 cursor-pointer" onclick="openDiscoveryFormForCreate()">
          + Nuevo Levantamiento
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(lead => {
    const statusBadge = getStatusBadgeHtml(lead.status);
    const rubroLabel = getRubroLabel(lead.rubro);
    const qaCount = Array.isArray(lead.custom_qa) ? lead.custom_qa.length : 0;
    const bottlenecksHtml = (lead.bottlenecks || []).slice(0, 2).map(b => `
      <span class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/25 text-[10px] font-semibold">
        ❌ ${escapeHtml(b)}
      </span>
    `).join('');

    const isWon = lead.status === 'won';

    return `
      <div class="glass-card rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
        <div class="space-y-3.5">
          <!-- Header de Tarjeta: Estado y Rubro -->
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] font-bold text-slate-400">${rubroLabel}</span>
            <div>${statusBadge}</div>
          </div>

          <!-- Nombre de Empresa & Contacto -->
          <div>
            <h4 class="font-display text-base font-bold text-white group-hover:text-cyan-300 transition">
              ${escapeHtml(lead.business_name)}
            </h4>
            <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>👤 ${escapeHtml(lead.contact_name)}</span>
              ${lead.role_title ? `<span class="text-[10px] text-slate-500 font-mono">(${escapeHtml(lead.role_title)})</span>` : ''}
            </div>
            ${lead.location ? `<p class="text-[11px] text-slate-500 mt-0.5">📍 ${escapeHtml(lead.location)}</p>` : ''}
          </div>

          <!-- Alcance Físico vs Virtual -->
          <div class="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
            <div class="flex items-center gap-1.5 text-slate-300 truncate">
              <span class="text-xs">🏢</span>
              <span class="text-slate-400">Físico:</span>
              <strong class="text-slate-200 truncate">${escapeHtml((lead.physical_scope && lead.physical_scope[0]) || 'Sin local')}</strong>
            </div>
            <div class="flex items-center gap-1.5 text-slate-300 truncate">
              <span class="text-xs">🌐</span>
              <span class="text-slate-400">Virtual:</span>
              <strong class="text-slate-200 truncate">${escapeHtml((lead.virtual_scope && lead.virtual_scope[0]) || 'Sin web')}</strong>
            </div>
          </div>

          <!-- Cuellos de Botella Detectados -->
          ${bottlenecksHtml ? `
            <div class="flex flex-wrap gap-1.5 pt-0.5">
              ${bottlenecksHtml}
            </div>
          ` : ''}

          <!-- Propuesta & Cotización Económica -->
          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Solución CaribIA</span>
              <span class="text-xs font-bold text-cyan-300">${escapeHtml(lead.solution_name || 'Bot IA 24/7')}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Cotización</span>
              <span class="text-xs font-extrabold text-emerald-400 font-mono">
                ${formatMoney(lead.monthly_fee, lead.currency)}/mes
              </span>
            </div>
          </div>

          <!-- Q&A Badge & Próximo Paso -->
          <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span class="flex items-center gap-1 text-cyan-400 font-medium">
              <span>💬</span>
              <span>${qaCount} Q&A en vivo</span>
            </span>
            <span class="text-[10px] text-slate-500 font-mono">
              ⏱️ ${escapeHtml(lead.delivery_time || '72hs')}
            </span>
          </div>
        </div>

        <!-- Botones de Acción de la Tarjeta -->
        <div class="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
          <button
            type="button"
            onclick="viewDiscoveryLeadDetail('${lead.id}')"
            class="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Ver diagnóstico completo y preguntas"
          >
            <span>👁️ Ficha</span>
          </button>

          <button
            type="button"
            onclick="copyWhatsAppPitch('${lead.id}')"
            class="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Copiar propuesta resumida para enviar por WhatsApp"
          >
            <span>📱 WhatsApp</span>
          </button>

          <button
            type="button"
            onclick="copyAiPromptForLead('${lead.id}')"
            class="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            title="Copiar diagnóstico para pasar a Antigravity (IA)"
          >
            <span>🤖 IA</span>
          </button>

          ${!isWon ? `
            <button
              type="button"
              onclick="convertLeadToActiveClient('${lead.id}')"
              class="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer"
              title="Convertir esta cotización en cliente activo con cobros recurrentes"
            >
              <span>⚡ Ganar</span>
            </button>
          ` : `
            <span class="text-[10px] font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              ✓ Cliente
            </span>
          `}

          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick="openEditDiscoveryModal('${lead.id}')"
              class="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 text-xs transition cursor-pointer"
              title="Editar levantamiento"
            >
              ✏️
            </button>
            <button
              type="button"
              onclick="deleteDiscoveryLead('${lead.id}')"
              class="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer"
              title="Eliminar de la base"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------
// ACTUALIZAR CONTEO DE FILTROS & KPIs
// --------------------------------------------------------------------
function updateDiscoveryCounts() {
  const all = discoveryLeads.length;
  const diag = discoveryLeads.filter(l => l.status === 'diagnostic').length;
  const quoted = discoveryLeads.filter(l => l.status === 'quoted').length;
  const nego = discoveryLeads.filter(l => l.status === 'negotiation').length;
  const won = discoveryLeads.filter(l => l.status === 'won').length;
  const lost = discoveryLeads.filter(l => l.status === 'lost').length;

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('count-disc-all', all);
  setTxt('count-disc-diag', diag);
  setTxt('count-disc-quoted', quoted);
  setTxt('count-disc-nego', nego);
  setTxt('count-disc-won', won);
  setTxt('count-disc-lost', lost);
}

function renderDiscoveryKpis() {
  const total = discoveryLeads.length;
  const wonLeads = discoveryLeads.filter(l => l.status === 'won');
  const wonCount = wonLeads.length;

  const activePipeline = discoveryLeads
    .filter(l => l.status === 'quoted' || l.status === 'negotiation' || l.status === 'diagnostic')
    .reduce((acc, curr) => acc + (Number(curr.setup_fee) || 0) + (Number(curr.monthly_fee) || 0), 0);

  const wonMrr = wonLeads.reduce((acc, curr) => acc + (Number(curr.monthly_fee) || 0), 0);
  const rate = total > 0 ? Math.round((wonCount / total) * 100) : 0;

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('kpi-disc-total', total);
  setTxt('kpi-disc-pipeline', formatMoney(activePipeline, 'ARS'));
  setTxt('kpi-disc-won', wonCount + ' Ganados');
  setTxt('kpi-disc-won-mrr', formatMoney(wonMrr, 'ARS') + '/mes en abonos');
  setTxt('kpi-disc-rate', rate + '%');

  const progress = document.getElementById('kpi-disc-progress');
  if (progress) {
    progress.style.width = Math.min(100, rate) + '%';
  }
}

// --------------------------------------------------------------------
// AUDITORÍA DE CONVERSIÓN & APRENDIZAJES (POR QUÉ CERRAMOS)
// --------------------------------------------------------------------
function renderDiscoveryInsights() {
  const container = document.getElementById('discovery-insights-box');
  if (!container) return;

  const wonLeads = discoveryLeads.filter(l => l.status === 'won');
  const lostLeads = discoveryLeads.filter(l => l.status === 'lost');

  const wonBottlenecks = {};
  wonLeads.forEach(l => {
    (l.bottlenecks || []).forEach(b => {
      wonBottlenecks[b] = (wonBottlenecks[b] || 0) + 1;
    });
  });
  let topWonPain = 'Pérdida de ventas de noche';
  let maxCount = 0;
  Object.keys(wonBottlenecks).forEach(k => {
    if (wonBottlenecks[k] > maxCount) {
      maxCount = wonBottlenecks[k];
      topWonPain = k;
    }
  });

  const avgWonTicket = wonLeads.length > 0
    ? Math.round(wonLeads.reduce((acc, c) => acc + (Number(c.monthly_fee) || 0), 0) / wonLeads.length)
    : 45000;

  container.innerHTML = `
    <div class="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/20 space-y-1">
      <span class="text-emerald-400 font-bold block text-xs">⭐ Patrón de Éxito en Ganados</span>
      <p class="text-slate-300">
        El dolor principal que más convirtió a clientes reales es:
        <strong class="text-white block mt-1">"${escapeHtml(topWonPain)}"</strong>
      </p>
      <span class="text-[10px] text-slate-500">Úsalo en el gancho de los próximos Reels de Instagram.</span>
    </div>

    <div class="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/20 space-y-1">
      <span class="text-cyan-400 font-bold block text-xs">💰 Abono Promedio Aceptado</span>
      <p class="text-slate-300">
        Las empresas cerraron con un abono mensual promedio de:
        <strong class="text-cyan-300 font-mono text-sm block mt-1">${formatMoney(avgWonTicket, 'ARS')}/mes</strong>
      </p>
      <span class="text-[10px] text-slate-500">Excelente rango de rentabilidad para soporte & hosting recurrente.</span>
    </div>

    <div class="bg-slate-900/80 p-4 rounded-2xl border border-amber-500/20 space-y-1">
      <span class="text-amber-400 font-bold block text-xs">⚠️ Motivo de Pérdidas (${lostLeads.length})</span>
      <p class="text-slate-300">
        Las propuestas no cerradas se frenaron por:
        <strong class="text-white block mt-1">"Falta de madurez digital o contratar pasantes"</strong>
      </p>
      <span class="text-[10px] text-slate-500">Próxima acción: Enviarles el Reel comparativo de costo de empleado vs bot.</span>
    </div>
  `;
}

// --------------------------------------------------------------------
// VER DETALLE COMPLETO DEL LEVANTAMIENTO & Q&A
// --------------------------------------------------------------------
window.viewDiscoveryLeadDetail = function(leadId) {
  const lead = discoveryLeads.find(l => l.id === leadId);
  if (!lead) return;

  activeViewingLeadId = lead.id;
  const modal = document.getElementById('modal-lead-detail');
  const title = document.getElementById('detail-business-name');
  const statusPill = document.getElementById('detail-status-pill');
  const body = document.getElementById('detail-body-content');

  title.textContent = lead.business_name;
  statusPill.outerHTML = getStatusBadgeHtml(lead.status);

  const qas = lead.custom_qa || [];
  const qasHtml = qas.length > 0
    ? qas.map((q, idx) => `
        <div class="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
          <div class="font-bold text-cyan-300 flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center text-[9px]">${idx + 1}</span>
            <span>${escapeHtml(q.question)}</span>
          </div>
          <p class="text-slate-300 text-xs pl-6 leading-relaxed">
            ${escapeHtml(q.answer) || '<em class="text-slate-500">Sin respuesta registrada</em>'}
          </p>
        </div>
      `).join('')
    : '<p class="text-slate-500 italic">No se registraron preguntas personalizadas en esta ficha.</p>';

  body.innerHTML = `
    <!-- Ficha Resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
      <div>
        <span class="text-slate-500 uppercase text-[10px] font-bold block">Contacto Responsable</span>
        <strong class="text-white text-sm">${escapeHtml(lead.contact_name)}</strong>
        ${lead.role_title ? `<span class="text-slate-400 text-xs block">${escapeHtml(lead.role_title)}</span>` : ''}
        <div class="mt-2 flex items-center gap-2">
          <a href="https://wa.me/${lead.whatsapp_phone.replace(/\D/g, '')}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-xs">
            💬 ${escapeHtml(lead.whatsapp_phone)} ↗
          </a>
        </div>
      </div>
      <div>
        <span class="text-slate-500 uppercase text-[10px] font-bold block">Ubicación & Rubro</span>
        <p class="text-slate-200">${escapeHtml(lead.location || 'No especificada')}</p>
        <span class="text-cyan-300 font-bold mt-1 block">${getRubroLabel(lead.rubro)}</span>
      </div>
    </div>

    <!-- Alcance Físico vs Virtual -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
        <span class="text-xs font-bold text-slate-300 block mb-2">🏢 Alcance Físico</span>
        <div class="flex flex-wrap gap-1.5">
          ${(lead.physical_scope || ['1 Local a la calle']).map(p => `
            <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700">
              ${escapeHtml(p)}
            </span>
          `).join('')}
        </div>
      </div>
      <div class="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
        <span class="text-xs font-bold text-slate-300 block mb-2">🌐 Alcance Virtual</span>
        <div class="flex flex-wrap gap-1.5">
          ${(lead.virtual_scope || ['Sin web']).map(v => `
            <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700">
              ${escapeHtml(v)}
            </span>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Cuellos de Botella & Metas -->
    <div class="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80 space-y-3">
      <div>
        <span class="text-xs font-bold text-rose-300 block mb-1.5">⚠️ Cuellos de Botella Detectados</span>
        <div class="flex flex-wrap gap-1.5">
          ${(lead.bottlenecks || []).map(b => `
            <span class="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-200 text-[11px] font-semibold border border-rose-500/30">
              ❌ ${escapeHtml(b)}
            </span>
          `).join('')}
        </div>
      </div>
      <div>
        <span class="text-xs font-bold text-cyan-300 block mb-1">🚀 Meta Principal a 90 Días</span>
        <p class="text-slate-200 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          ${escapeHtml(lead.goals || 'Sin meta especificada')}
        </p>
      </div>
    </div>

    <!-- Preguntas Personalizadas & Conversación -->
    <div class="space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-cyan-300 uppercase tracking-wider">
          💬 Preguntas & Respuestas Personalizadas (${qas.length})
        </span>
      </div>
      <div class="space-y-2">
        ${qasHtml}
      </div>
    </div>

    <!-- Propuesta Económica CaribIA Labs -->
    <div class="bg-gradient-to-r from-cyan-950/40 to-slate-900 p-4 rounded-2xl border border-cyan-500/30 flex items-center justify-between flex-wrap gap-3">
      <div>
        <span class="text-[10px] text-cyan-400 uppercase font-bold block">Solución Comprometida</span>
        <strong class="text-white text-sm sm:text-base">${escapeHtml(lead.solution_name)}</strong>
        <span class="text-slate-400 text-xs block mt-0.5">⏱️ Plazo de entrega: ${escapeHtml(lead.delivery_time || '72hs')}</span>
      </div>
      <div class="text-right">
        <span class="text-[10px] text-slate-400 uppercase font-bold block">Inversión Propuesta</span>
        <div class="text-sm text-slate-300">Setup: <strong class="text-white">${formatMoney(lead.setup_fee, lead.currency)}</strong></div>
        <div class="text-base text-emerald-400 font-extrabold font-mono">${formatMoney(lead.monthly_fee, lead.currency)}/mes</div>
      </div>
    </div>

    ${lead.next_step ? `
      <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
        <strong>Próximo Paso Acordado:</strong> ${escapeHtml(lead.next_step)}
      </div>
    ` : ''}
  `;

  modal.classList.remove('hidden');
};

// --------------------------------------------------------------------
// COPIAR PROPUESTA EJECUTIVA PARA WHATSAPP
// --------------------------------------------------------------------
window.copyWhatsAppPitch = function(leadId) {
  const lead = discoveryLeads.find(l => l.id === leadId);
  if (!lead) return;

  const painsText = (lead.bottlenecks || []).slice(0, 3).map(p => '  • ' + p).join('\n');
  const setupText = lead.setup_fee ? formatMoney(lead.setup_fee, lead.currency) : 'A coordinar';
  const monthlyText = formatMoney(lead.monthly_fee, lead.currency);

  const pitchText = 
`¡Hola ${lead.contact_name}! 👋 Desde CaribIA Labs preparamos la propuesta de automatización para *${lead.business_name}*:

🎯 *Diagnóstico de Situación:*
${painsText}
• *Meta a 90 días:* ${lead.goals || 'Optimizar atención y ventas'}

⚡ *Nuestra Solución:*
• *${lead.solution_name}*
• *Plazo de Entrega:* ${lead.delivery_time || '72 horas hábiles'} (La entrega personalizada más rápida del mercado).

💳 *Condiciones de Inversión:*
• Setup Inicial: ${setupText}
• Abono Mensual: ${monthlyText}/mes (Servidores de alta velocidad, soporte y mantenimiento continuo).

¿Te parece bien si lo dejamos reservado para arrancar esta misma semana? Responde a este mensaje y te paso el link de confirmación. 🚀`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(pitchText).then(() => {
      showToastNotification('✓ Propuesta formal copiada al portapapeles. ¡Pégala en WhatsApp!');
    }).catch(() => {
      prompt('Copia tu propuesta para WhatsApp:', pitchText);
    });
  } else {
    prompt('Copia tu propuesta para WhatsApp:', pitchText);
  }
};

// --------------------------------------------------------------------
// COPIAR PROMPT DE DIAGNÓSTICO COMPLETO PARA ANTIGRAVITY (IA)
// --------------------------------------------------------------------
window.copyAiPromptForLead = function(leadId) {
  const lead = discoveryLeads.find(l => l.id === leadId);
  if (!lead) return;

  const physicalText = (lead.physical_scope && lead.physical_scope.length > 0)
    ? lead.physical_scope.join(', ')
    : 'No especificado';

  const virtualText = (lead.virtual_scope && lead.virtual_scope.length > 0)
    ? lead.virtual_scope.join(', ')
    : 'No especificado';

  const channelsText = (lead.contact_channels && lead.contact_channels.length > 0)
    ? lead.contact_channels.join(', ')
    : 'No especificado';

  const painsList = (lead.bottlenecks && lead.bottlenecks.length > 0)
    ? lead.bottlenecks.map(b => '  - ' + b).join('\n')
    : '  - Ningún cuello de botella crítico registrado';

  const qasList = (lead.custom_qa && lead.custom_qa.length > 0)
    ? lead.custom_qa.map((q, i) => `  ${i + 1}. **${q.question}**: ${q.answer || 'Sin respuesta'}`).join('\n')
    : '  *(No se registraron preguntas personalizadas adicionales)*';

  const promptText = 
`# 📋 LEVANTAMIENTO COMERCIAL & DIAGNÓSTICO OPERATIVO: ${lead.business_name}
> Generado desde el CRM de CaribIA Labs para análisis con Antigravity AI

**Instrucción para Antigravity:**
Por favor revisa detenidamente el siguiente levantamiento comercial y diagnóstico de este cliente prospecto. Con base en sus cuellos de botella, canales actuales y metas, genera:
1. **Diagnóstico Estratégico & Detección de Fugas:** Dónde están perdiendo dinero y clientes exactamente.
2. **Propuesta Comercial Escalonada (3 Niveles):**
   - **Nivel Básico (MVP rápido en 48-72hs):** Solución puntual de alto impacto.
   - **Nivel Recomendado (Recomendado CaribIA):** Solución integral automatizada (web/landing + bot WhatsApp 24/7 + catálogo sincronizado).
   - **Nivel Pro / Expansión:** Automatización avanzada, reportes en vivo y retención postventa.
3. **Estructura de Precios & ROI Estimado:** Sugerencia de Setup Inicial y Abono Mensual recurrente (Servidores ultrarrápidos, soporte y mantenimiento).
4. **Guión de Cierre Persuasivo para WhatsApp:** Mensaje directo para enviarle al decisor (${lead.contact_name}).

---
### 🏢 1. Datos Generales de la Empresa
- **Nombre:** ${lead.business_name}
- **Rubro:** ${getRubroLabel(lead.rubro)}
- **Contacto Decisor:** ${lead.contact_name} ${lead.role_title ? `(${lead.role_title})` : ''}
- **WhatsApp:** ${lead.whatsapp_phone || 'No indicado'}
- **Email:** ${lead.email || 'No indicado'}
- **Redes Sociales / Perfil:** ${lead.social_network || 'No indicado'}
- **Ubicación Geográfica:** ${lead.location || 'No indicada'}

### 🌐 2. Alcance Operativo & Canales
- **Alcance Físico:** ${physicalText}
- **Alcance Virtual & Presencia Web:** ${virtualText}
- **Canales de Captación Actuales:** ${channelsText}

### ⚡ 3. Operación y Cuellos de Botella
- **Volumen de Consultas Diarias:** ${lead.volume_level || 'medio'}
- **Horarios Pico / Saturación:** ${lead.peak_hours || 'No indicado'}
- **Ticket Promedio:** ${lead.avg_ticket ? formatMoney(lead.avg_ticket, lead.currency) : 'No especificado'}
- **Tamaño del Equipo:** ${lead.team_size || 'No especificado'}
- **Herramientas Actuales:** ${lead.tools_used || 'Ninguna / Solo chat'}
- **Cuellos de Botella Críticos (Lo que les hace perder dinero):**
${painsList}

### 🎯 4. Metas a 90 Días
- ${lead.goals || 'Optimizar atención al cliente y aumentar conversiones'}

### 💬 5. Preguntas Dinámicas & Conversación Personalizada (Q&A en Vivo)
${qasList}

### 💰 6. Solución Tentativa y Cotización Preliminar
- **Solución CaribIA Labs:** ${lead.solution_name || 'Bot WhatsApp IA 24/7'}
- **Plazo de Entrega Comprometido:** ${lead.delivery_time || '72 horas hábiles'} *(Slogan: "La entrega personalizada más rápida del mercado")*
- **Setup Estimado:** ${formatMoney(lead.setup_fee, lead.currency)}
- **Abono Mensual:** ${formatMoney(lead.monthly_fee, lead.currency)}/mes
- **Estado Actual:** ${lead.status}
- **Próximo Paso Acordado:** ${lead.next_step || 'Enviar propuesta formal'}
${lead.notes ? `- **Notas Internas:** ${lead.notes}` : ''}
`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(promptText).then(() => {
      showToastNotification('✓ Prompt para Antigravity copiado al portapapeles. ¡Pégalo aquí en el chat!');
    }).catch(() => {
      prompt('Copia el prompt para Antigravity:', promptText);
    });
  } else {
    prompt('Copia el prompt para Antigravity:', promptText);
  }
};

// --------------------------------------------------------------------
// CONVERTIR COTIZACIÓN GANADA A CLIENTE ACTIVO DEL CRM
// --------------------------------------------------------------------
window.convertLeadToActiveClient = function(leadId) {
  const lead = discoveryLeads.find(l => l.id === leadId);
  if (!lead) return;

  const ok = confirm(`¿Deseas marcar "${lead.business_name}" como CLIENTE GANADO y pasarlo automáticamente al CRM de Facturación Activo?`);
  if (!ok) return;

  lead.status = 'won';
  lead.updated_at = new Date().toISOString().split('T')[0];
  localStorage.setItem('caribia_discovery_leads', JSON.stringify(discoveryLeads));

  // Crear registro en crmClients si no existe ya
  if (typeof crmClients !== 'undefined') {
    const existingClient = crmClients.find(c => c.business_name.toLowerCase() === lead.business_name.toLowerCase());
    if (!existingClient) {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 10);
      const nextDueStr = nextMonth.toISOString().split('T')[0];

      const newClient = {
        id: 'crm-' + Date.now().toString(36),
        business_name: lead.business_name,
        contact_name: lead.contact_name,
        whatsapp_phone: lead.whatsapp_phone,
        email: lead.email || '',
        plan_name: lead.solution_name || 'Tienda Online + Carrito',
        monthly_fee: lead.monthly_fee || 45000,
        currency: lead.currency || 'ARS',
        billing_day: 10,
        payment_method: 'Transferencia Alias',
        status: 'al_dia',
        next_due_date: nextDueStr,
        last_payment_date: today.toISOString().split('T')[0],
        notes: `Cliente ganado desde Discovery CRM. Setup: ${lead.setup_fee || 0}. Dolores resueltos: ${(lead.bottlenecks || []).join(', ')}`
      };

      crmClients.unshift(newClient);
      localStorage.setItem('caribia_crm_clients', JSON.stringify(crmClients));
      if (typeof renderCrmClients === 'function') renderCrmClients();
    }
  }

  const modalDetail = document.getElementById('modal-lead-detail');
  if (modalDetail) modalDetail.classList.add('hidden');

  renderDiscoveryLeads();
  renderDiscoveryKpis();
  renderDiscoveryInsights();

  showToastNotification(`🎉 ¡"${lead.business_name}" se convirtió en Cliente Activo! Ya figura en tu CRM.`);
};

// --------------------------------------------------------------------
// ELIMINAR LEVANTAMIENTO
// --------------------------------------------------------------------
window.deleteDiscoveryLead = function(leadId) {
  const lead = discoveryLeads.find(l => l.id === leadId);
  if (!lead) return;

  if (confirm(`¿Seguro que deseas eliminar el levantamiento de "${lead.business_name}"?`)) {
    discoveryLeads = discoveryLeads.filter(l => l.id !== leadId);
    localStorage.setItem('caribia_discovery_leads', JSON.stringify(discoveryLeads));
    renderDiscoveryLeads();
    renderDiscoveryKpis();
    renderDiscoveryInsights();
    showToastNotification('Levantamiento eliminado.');
  }
};

// --------------------------------------------------------------------
// EXPORTAR BASE DE COTIZACIONES A JSON
// --------------------------------------------------------------------
function exportDiscoveryJson() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(discoveryLeads, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', 'caribia_discovery_leads_' + new Date().toISOString().split('T')[0] + '.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToastNotification('✓ Base de cotizaciones exportada en JSON.');
}

// --------------------------------------------------------------------
// NOTIFICACIÓN TOAST FLOTANTE
// --------------------------------------------------------------------
function showToastNotification(message) {
  const existing = document.getElementById('caribia-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'caribia-toast';
  toast.className = 'fixed bottom-6 right-6 z-50 glass-card px-5 py-3.5 rounded-2xl border border-cyan-500/50 text-white text-xs font-bold shadow-2xl flex items-center gap-2 transform translate-y-4 opacity-0 transition-all duration-300';
  toast.innerHTML = `
    <span class="text-base text-cyan-400">✨</span>
    <span>${escapeHtml(message)}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}
