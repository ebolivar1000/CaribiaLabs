// ====================================================================
// CARIBIA LABS - WORKER API SERVERLESS & ENRUTADOR PRINCIPAL
// Plataforma Multi-Inquilino de Software Factory (Fase 3)
// ====================================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { tenantsRouter } from './routes/tenants.js';
import { catalogRouter } from './routes/catalog.js';
import { checkoutRouter } from './routes/checkout.js';
import { whatsappRouter } from './routes/whatsapp.js';
import { adminCrmRouter } from './routes/adminCrm.js';

const app = new Hono();

// Middlewares globales
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug']
}));

// Health check y presentación de API
app.get('/', (c) => {
  return c.json({
    status: 'online',
    platform: 'CaribIA Labs - Multi-Tenant Serverless Factory',
    version: '2.0.0',
    region: 'Cloudflare Edge (Global / Latam)',
    database: 'Neon PostgreSQL Serverless',
    ai_engine: 'Google Gemini 2.0 Flash (Decoupled Cognitive Router)',
    endpoints: {
      tenants: 'GET /api/tenants/:slug',
      catalog: 'GET /api/catalog/:slug/products',
      stock_update: 'PATCH /api/catalog/:slug/stock',
      checkout_order: 'POST /api/checkout/:slug/create-order',
      whatsapp_webhook: 'GET & POST /api/whatsapp/webhook',
      whatsapp_simulator: 'POST /api/whatsapp/test-chat',
      crm_clients: 'GET, POST /api/admin/crm/clients',
      crm_client_action: 'PATCH, DELETE /api/admin/crm/clients/:id'
    }
  });
});

// Enrutadores modulares
app.route('/api/tenants', tenantsRouter);
app.route('/api/catalog', catalogRouter);
app.route('/api/checkout', checkoutRouter);
app.route('/api/whatsapp', whatsappRouter);
app.route('/api/admin/crm', adminCrmRouter);

// Manejo de 404
app.notFound((c) => {
  return c.json({
    error: 'Ruta no encontrada',
    status: 404,
    help: 'Visita / para ver el mapa de endpoints'
  }, 404);
});

// Manejo global de excepciones
app.onError((err, c) => {
  console.error('Error no controlado en Worker:', err);
  return c.json({
    error: 'Error interno en el servidor Edge',
    message: err.message
  }, 500);
});

export default app;
