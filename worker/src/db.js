// ====================================================================
// CARIBIA LABS - CONECTOR DE BASE DE DATOS SERVERLESS (NEON POSTGRES)
// Soporta Row Level Security (RLS) y fallback en memoria para tests locales
// ====================================================================

import { neon } from '@neondatabase/serverless';

export function getDb(env) {
  if (env && env.DATABASE_URL) {
    return neon(env.DATABASE_URL);
  }
  return null;
}

// Datos locales de respaldo cuando DATABASE_URL aún no está configurado
export const MOCK_TENANTS = {
  'aura-studio': {
    id: 'a0000000-0000-0000-0000-000000000001',
    slug: 'aura-studio',
    name: 'AURA Studio',
    business_type: 'retail_stock',
    whatsapp_phone: '5491154188294',
    currency: 'ARS',
    bank_alias: 'aura.indumentaria.mp',
    bank_discount_percent: 15.0,
    branding: {
      primary_color: '#06b6d4',
      secondary_color: '#0b1120',
      hero_title: 'Colección Minimalista Otoño / Invierno 2026',
      hero_subtitle: 'Diseño editorial, fibras nobles y cortes contemporáneos.',
      announcement_bar: 'ENVÍO GRATIS A TODO EL PAÍS EN COMPRAS SUPERIORES A $80.000 · 3 CUOTAS SIN INTERÉS',
      free_shipping_threshold: 80000
    }
  },
  'forno-delivery': {
    id: 'a0000000-0000-0000-0000-000000000002',
    slug: 'forno-delivery',
    name: 'FORNO & CO.',
    business_type: 'menu_pedidos',
    whatsapp_phone: '5491154188294',
    currency: 'ARS',
    bank_alias: 'forno.delivery.mp',
    bank_discount_percent: 10.0,
    branding: {
      primary_color: '#f59e0b',
      secondary_color: '#080d1a',
      hero_title: 'Comida real. Sin intermediarios ni comisiones del 30%.',
      hero_subtitle: 'Pizzas napolitanas al horno de leña y Smash Burgers artesanales.',
      delivery_fee: 2500
    }
  }
};
