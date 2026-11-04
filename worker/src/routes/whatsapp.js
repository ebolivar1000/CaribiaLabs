// ====================================================================
// RUTAS DE WHATSAPP: Enrutador de Webhooks de Meta (Cloud API)
// Valida desafíos de suscripción y despacha respuestas con el cerebro IA
// ====================================================================

import { Hono } from 'hono';
import { getDb, MOCK_TENANTS } from '../db.js';
import { processCustomerMessageWithAI } from '../ai/cognitiveBrain.js';

export const whatsappRouter = new Hono();

// 1. Verificación del Webhook por parte de Meta (GET)
whatsappRouter.get('/webhook', (c) => {
  const query = c.req.query();
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  const expectedToken = c.env?.WHATSAPP_VERIFY_TOKEN || 'caribia_labs_secret_verify_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('✅ Webhook de WhatsApp verificado exitosamente por Meta');
    return c.text(challenge, 200);
  }

  console.warn('❌ Fallo en la verificación del Webhook de WhatsApp');
  return c.text('Verificación fallida', 403);
});

// 2. Recepción de mensajes entrantes de clientes (POST)
whatsappRouter.post('/webhook', async (c) => {
  const body = await c.req.json();

  // Validar si es una notificación de mensaje de WhatsApp
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  if (!message || message.type !== 'text') {
    // Si es un estado de entrega (sent/delivered/read) o no es texto, responder 200 OK a Meta
    return c.text('EVENT_RECEIVED', 200);
  }

  const senderPhone = message.from; // Número del cliente
  const userText = message.text?.body; // Contenido del mensaje
  const businessPhoneId = value.metadata?.phone_number_id; // ID del número del negocio en Meta

  console.log(`📩 Mensaje recibido de ${senderPhone}: "${userText}"`);

  // Identificar el tenant correspondiente
  let tenant = MOCK_TENANTS['aura-studio']; // Default
  const sql = getDb(c.env);
  let catalog = [];

  if (sql) {
    try {
      const tenants = await sql`SELECT * FROM tenants WHERE is_active = true LIMIT 1`;
      if (tenants.length > 0) tenant = tenants[0];

      catalog = await sql`
        SELECT p.id, p.name, p.base_price, p.description, p.stock
        FROM products p
        WHERE p.tenant_id = ${tenant.id} AND p.is_active = true
      `;
    } catch (e) {
      console.error('Error obteniendo tenant en webhook:', e);
    }
  }

  // Procesar con el Cerebro Cognitivo de IA (Google Gemini)
  const aiResult = await processCustomerMessageWithAI({
    userMessage: userText,
    senderPhone,
    tenant,
    catalog,
    env: c.env
  });

  // Enviar respuesta por WhatsApp si hay token de Meta configurado
  const accessToken = c.env?.WHATSAPP_ACCESS_TOKEN;
  if (accessToken && businessPhoneId) {
    try {
      const sendRes = await fetch(`https://graph.facebook.com/v21.0/${businessPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: senderPhone,
          type: 'text',
          text: { preview_url: true, body: aiResult.replyText }
        })
      });

      if (!sendRes.ok) {
        console.error('Error enviando mensaje por Meta Graph API:', await sendRes.text());
      }
    } catch (e) {
      console.error('Error en fetch a Graph API:', e);
    }
  }

  // Devolver 200 OK rápido a Meta con metadata de la respuesta
  return c.json({
    status: 'success',
    sender: senderPhone,
    reply: aiResult.replyText,
    provider: aiResult.provider
  }, 200);
});

// Endpoint de prueba interactiva para simular mensajes de clientes sin necesidad de Meta Cloud API
whatsappRouter.post('/test-chat', async (c) => {
  const body = await c.req.json();
  const { message, slug = 'aura-studio', senderPhone = '5491154188294' } = body;

  let tenant = MOCK_TENANTS[slug] || MOCK_TENANTS['aura-studio'];
  const sql = getDb(c.env);
  let catalog = [];

  if (sql) {
    try {
      const tenants = await sql`SELECT * FROM tenants WHERE slug = ${slug} LIMIT 1`;
      if (tenants.length > 0) tenant = tenants[0];

      catalog = await sql`
        SELECT p.id, p.name, p.base_price, p.description, p.stock
        FROM products p
        WHERE p.tenant_id = ${tenant.id} AND p.is_active = true
      `;
    } catch (e) {
      console.error('Error en test-chat:', e);
    }
  }

  const aiResult = await processCustomerMessageWithAI({
    userMessage: message || 'Hola, ¿qué precio tienen y qué talles quedan?',
    senderPhone,
    tenant,
    catalog,
    env: c.env
  });

  return c.json({
    success: true,
    tenant: tenant.name,
    customerMessage: message,
    aiResponse: aiResult.replyText,
    provider: aiResult.provider
  });
});
