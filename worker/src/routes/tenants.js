// ====================================================================
// RUTAS DE TENANTS: Resolución de configuración, branding y pagos
// ====================================================================

import { Hono } from 'hono';
import { getDb, MOCK_TENANTS } from '../db.js';

export const tenantsRouter = new Hono();

// Obtener información pública de un tenant por su slug o subdominio
tenantsRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const sql = getDb(c.env);

  if (!sql) {
    // Modo local / Fallback
    const tenant = MOCK_TENANTS[slug];
    if (!tenant) {
      return c.json({ error: 'Tenant no encontrado', slug }, 404);
    }
    return c.json({ success: true, tenant });
  }

  try {
    const rows = await sql`
      SELECT id, slug, name, business_type, custom_domain, whatsapp_phone, currency,
             bank_alias, bank_discount_percent, branding
      FROM tenants
      WHERE (slug = ${slug} OR custom_domain = ${slug}) AND is_active = true
      LIMIT 1
    `;

    if (rows.length === 0) {
      return c.json({ error: 'Tenant no encontrado o inactivo', slug }, 404);
    }

    return c.json({ success: true, tenant: rows[0] });
  } catch (error) {
    console.error('Error al consultar tenant:', error);
    return c.json({ error: 'Error interno del servidor al consultar tenant' }, 500);
  }
});
