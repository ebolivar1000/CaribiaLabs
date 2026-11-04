// ====================================================================
// RUTAS DE CHECKOUT & ÓRDENES: Pagos en Argentina (Mercado Pago + Alias)
// ====================================================================

import { Hono } from 'hono';
import { getDb, MOCK_TENANTS } from '../db.js';

export const checkoutRouter = new Hono();

// Crear una nueva orden / preferencia de pago
checkoutRouter.post('/:slug/create-order', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json();
  const { customer, items, deliveryType, paymentMethod } = body;

  if (!customer || !items || items.length === 0) {
    return c.json({ error: 'Faltan datos obligatorios del cliente o los items' }, 400);
  }

  // 1. Obtener tenant
  let tenant = MOCK_TENANTS[slug];
  const sql = getDb(c.env);
  if (sql) {
    const tenants = await sql`SELECT * FROM tenants WHERE slug = ${slug} LIMIT 1`;
    if (tenants.length > 0) tenant = tenants[0];
  }

  if (!tenant) {
    return c.json({ error: 'Tenant no encontrado' }, 404);
  }

  // 2. Calcular subtotal
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // 3. Envío
  let shippingCost = 0;
  if (deliveryType === 'envio') {
    const threshold = tenant.branding?.free_shipping_threshold || 80000;
    const defaultDeliveryFee = tenant.branding?.delivery_fee || 5000;
    shippingCost = subtotal >= threshold ? 0 : defaultDeliveryFee;
  }

  // 4. Descuento por Transferencia Bancaria (Alias)
  let discount = 0;
  const discountPercent = Number(tenant.bank_discount_percent) || 0;
  if (paymentMethod === 'transferencia' && discountPercent > 0) {
    discount = Math.round(subtotal * (discountPercent / 100));
  }

  const total = subtotal - discount + shippingCost;

  // 5. Generar link o datos según método de pago
  let checkoutUrl = null;
  let bankDetails = null;

  if (paymentMethod === 'mercadopago') {
    // Si hay token de Mercado Pago configurado, crear la preferencia real
    if (c.env?.MERCADOPAGO_ACCESS_TOKEN || tenant.mercadopago_access_token) {
      const token = tenant.mercadopago_access_token || c.env.MERCADOPAGO_ACCESS_TOKEN;
      try {
        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            items: items.map(it => ({
              title: it.name,
              quantity: it.quantity,
              currency_id: 'ARS',
              unit_price: it.price
            })),
            payer: {
              name: customer.name,
              phone: { number: customer.phone },
              email: customer.email || 'cliente@caribialabs.com'
            },
            back_urls: {
              success: `https://${slug}.caribialabs.com/?status=success`,
              failure: `https://${slug}.caribialabs.com/?status=failure`,
              pending: `https://${slug}.caribialabs.com/?status=pending`
            },
            auto_return: 'approved'
          })
        });

        const mpData = await mpRes.json();
        if (mpData.init_point) {
          checkoutUrl = mpData.init_point;
        }
      } catch (e) {
        console.error('Error al conectar con Mercado Pago:', e);
      }
    }

    // Fallback simulado si aún no hay credenciales productivas
    if (!checkoutUrl) {
      checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/payment/redirect/?pref_id=demo_${Date.now()}`;
    }
  } else {
    // Datos de Transferencia con Alias
    bankDetails = {
      alias: tenant.bank_alias || 'caribia.labs.mp',
      cbu_cvu: tenant.bank_cbu_cvu || '00000031000987654321',
      holder: tenant.bank_holder_name || tenant.name,
      discount_applied: discount,
      discount_percent: discountPercent,
      final_to_pay: total
    };
  }

  // 6. Texto para confirmación de WhatsApp
  const wspText = `🛍️ *NUEVO PEDIDO - ${tenant.name}*\n` +
    `👤 Cliente: ${customer.name}\n` +
    `📱 WhatsApp: ${customer.phone}\n` +
    `📍 Entrega: ${deliveryType === 'envio' ? (customer.address || 'A convenir') : 'Retiro en Local'}\n\n` +
    `📦 *Detalle del Pedido:*\n` +
    items.map(it => `• ${it.quantity}x ${it.name} ${it.size ? `(${it.size})` : ''} - $${(it.price * it.quantity).toLocaleString('es-AR')}`).join('\n') +
    `\n\n💰 Subtotal: $${subtotal.toLocaleString('es-AR')}` +
    (discount > 0 ? `\n🏷️ Descuento Transferencia (${discountPercent}%): -$${discount.toLocaleString('es-AR')}` : '') +
    (shippingCost > 0 ? `\n🚚 Envío: $${shippingCost.toLocaleString('es-AR')}` : (deliveryType === 'envio' ? '\n🚚 Envío: ¡GRATIS!' : '')) +
    `\n*TOTAL A PAGAR: $${total.toLocaleString('es-AR')} ARS*` +
    (bankDetails ? `\n\n🏦 *Datos para Transferencia (Alias):*\nAlias: *${bankDetails.alias}*\nTitular: ${bankDetails.holder}` : '') +
    (checkoutUrl ? `\n\n💳 Link de Pago Mercado Pago:\n${checkoutUrl}` : '');

  return c.json({
    success: true,
    order: {
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      subtotal,
      discount,
      shippingCost,
      total,
      paymentMethod,
      checkoutUrl,
      bankDetails,
      whatsappUrl: `https://wa.me/${tenant.whatsapp_phone}?text=${encodeURIComponent(wspText)}`
    }
  });
});
