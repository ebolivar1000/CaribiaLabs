// ====================================================================
// RUTAS DE CATÁLOGO: Productos, variantes y stock en tiempo real
// ====================================================================

import { Hono } from 'hono';
import { getDb } from '../db.js';

export const catalogRouter = new Hono();

// Obtener catálogo completo de un tenant
catalogRouter.get('/:slug/products', async (c) => {
  const slug = c.req.param('slug');
  const sql = getDb(c.env);

  if (!sql) {
    // Si no hay DB configurada, devolver estructura de muestra
    return c.json({
      success: true,
      slug,
      source: 'offline-mock',
      products: [
        {
          id: 'mock-1',
          name: 'Blazer Oversize Sastrería',
          base_price: 54000,
          compare_price: 68000,
          images: ['assets/blazer_oversize.jpg'],
          variants: [
            { size: 'XS', stock: 2 },
            { size: 'S', stock: 4 },
            { size: 'M', stock: 5 },
            { size: 'L', stock: 0 }
          ]
        }
      ]
    });
  }

  try {
    // Obtener tenant
    const tenants = await sql`SELECT id FROM tenants WHERE (slug = ${slug} OR custom_domain = ${slug}) AND is_active = true LIMIT 1`;
    if (tenants.length === 0) {
      return c.json({ error: 'Tenant no encontrado' }, 404);
    }
    const tenantId = tenants[0].id;

    // Obtener productos
    const products = await sql`
      SELECT p.id, p.name, p.description, p.base_price, p.compare_price, p.images, p.has_variants, p.stock,
             c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.tenant_id = ${tenantId} AND p.is_active = true
      ORDER BY p.created_at DESC
    `;

    // Obtener variantes
    const variants = await sql`
      SELECT id, product_id, sku, size, color, price_override, stock
      FROM product_variants
      WHERE tenant_id = ${tenantId}
    `;

    // Cruzar productos con sus variantes
    const productsWithVariants = products.map(prod => {
      const prodVariants = variants.filter(v => v.product_id === prod.id);
      return {
        ...prod,
        variants: prodVariants
      };
    });

    return c.json({
      success: true,
      tenantId,
      slug,
      count: productsWithVariants.length,
      products: productsWithVariants
    });
  } catch (error) {
    console.error('Error al listar productos:', error);
    return c.json({ error: 'Error al consultar catálogo' }, 500);
  }
});

// Actualizar stock de un producto o variante (usado por el "Modo Comerciante")
catalogRouter.patch('/:slug/stock', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json();
  const { variantId, productId, newStock } = body;

  const sql = getDb(c.env);
  if (!sql) {
    return c.json({ success: true, message: 'Stock actualizado localmente (mock)', newStock });
  }

  try {
    if (variantId) {
      await sql`
        UPDATE product_variants
        SET stock = ${newStock}
        WHERE id = ${variantId}
      `;
    } else if (productId) {
      await sql`
        UPDATE products
        SET stock = ${newStock}
        WHERE id = ${productId}
      `;
    }

    return c.json({ success: true, message: 'Stock actualizado con éxito en Neon DB', newStock });
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    return c.json({ error: 'No se pudo actualizar el stock' }, 500);
  }
});
