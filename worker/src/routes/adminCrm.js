// ====================================================================
// CARIBIA LABS - ENRUTADOR API CRM & FACTURACIÓN (FASE 3 & ADMIN)
// Gestión de Clientes, Abonos Recurrentes y Estados de Cobro
// ====================================================================

import { Hono } from 'hono';
import { getDb } from '../db.js';

export const adminCrmRouter = new Hono();

// Datos iniciales de demostración para el CRM
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

let inMemoryClients = [...INITIAL_CRM_CLIENTS];

// 1. Obtener todos los clientes del CRM con métricas financieras calculadas
adminCrmRouter.get('/clients', async (c) => {
  const sql = getDb(c.env);

  let clients = inMemoryClients;
  if (sql) {
    try {
      const rows = await sql`SELECT * FROM crm_clients ORDER BY created_at DESC`;
      if (rows && rows.length > 0) clients = rows;
    } catch (e) {
      console.warn('Fallback a memoria para CRM:', e.message);
    }
  }

  // Cálculo de KPIs financieros
  const mrr = clients.reduce((acc, client) => acc + Number(client.monthly_fee || 0), 0);
  const totalCobrado = clients
    .filter(c => c.status === 'al_dia')
    .reduce((acc, client) => acc + Number(client.monthly_fee || 0), 0);
  const pendiente = clients
    .filter(c => c.status === 'pendiente' || c.status === 'vencido')
    .reduce((acc, client) => acc + Number(client.monthly_fee || 0), 0);

  return c.json({
    clients,
    metrics: {
      mrr,
      total_cobrado: totalCobrado,
      pendiente_cobro: pendiente,
      total_clientes: clients.length,
      al_dia_count: clients.filter(c => c.status === 'al_dia').length,
      pendientes_count: clients.filter(c => c.status === 'pendiente').length,
      vencidos_count: clients.filter(c => c.status === 'vencido').length
    }
  });
});

// 2. Crear un nuevo cliente en el CRM
adminCrmRouter.post('/clients', async (c) => {
  const body = await c.req.json();
  const sql = getDb(c.env);

  const newClient = {
    id: body.id || `crm-${Date.now()}`,
    business_name: body.business_name || 'Nuevo Negocio',
    contact_name: body.contact_name || '',
    whatsapp_phone: body.whatsapp_phone || '5491154188294',
    email: body.email || '',
    plan_name: body.plan_name || 'Desarrollo a Medida',
    monthly_fee: Number(body.monthly_fee || 35000),
    currency: body.currency || 'ARS',
    billing_day: Number(body.billing_day || 10),
    payment_method: body.payment_method || 'Transferencia Alias',
    status: body.status || 'al_dia',
    next_due_date: body.next_due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    last_payment_date: body.last_payment_date || new Date().toISOString().split('T')[0],
    notes: body.notes || 'Cliente registrado desde la consola administrativa CaribIA Labs.'
  };

  if (sql) {
    try {
      await sql`
        INSERT INTO crm_clients (id, business_name, contact_name, whatsapp_phone, email, plan_name, monthly_fee, currency, billing_day, payment_method, status, next_due_date, last_payment_date, notes)
        VALUES (${newClient.id}, ${newClient.business_name}, ${newClient.contact_name}, ${newClient.whatsapp_phone}, ${newClient.email}, ${newClient.plan_name}, ${newClient.monthly_fee}, ${newClient.currency}, ${newClient.billing_day}, ${newClient.payment_method}, ${newClient.status}, ${newClient.next_due_date}, ${newClient.last_payment_date}, ${newClient.notes})
      `;
    } catch (e) {
      console.warn('Error insertando en Neon DB, guardando en memoria:', e.message);
    }
  }

  inMemoryClients.unshift(newClient);
  return c.json({ success: true, client: newClient }, 201);
});

// 3. Actualizar estado de cobro / registrar pago
adminCrmRouter.patch('/clients/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const sql = getDb(c.env);

  const idx = inMemoryClients.findIndex(item => item.id === id);
  if (idx !== -1) {
    inMemoryClients[idx] = { ...inMemoryClients[idx], ...body, updated_at: new Date().toISOString() };
  }

  if (sql) {
    try {
      if (body.status) {
        await sql`UPDATE crm_clients SET status = ${body.status}, updated_at = NOW() WHERE id = ${id}`;
      }
    } catch (e) {
      console.warn('Error actualizando Neon DB:', e.message);
    }
  }

  return c.json({ success: true, client: inMemoryClients[idx] });
});

// 4. Eliminar cliente del CRM
adminCrmRouter.delete('/clients/:id', async (c) => {
  const id = c.req.param('id');
  const sql = getDb(c.env);

  inMemoryClients = inMemoryClients.filter(item => item.id !== id);

  if (sql) {
    try {
      await sql`DELETE FROM crm_clients WHERE id = ${id}`;
    } catch (e) {
      console.warn('Error eliminando de Neon DB:', e.message);
    }
  }

  return c.json({ success: true, message: 'Cliente eliminado del CRM' });
});
