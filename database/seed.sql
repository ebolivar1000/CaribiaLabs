-- ====================================================================
-- CARIBIA LABS - SEMILLERO DE DATOS (SEED)
-- Población inicial para Neon PostgreSQL Serverless
-- Tenants de prueba basados en casos reales y plantillas
-- ====================================================================

-- 1. TENANT: AURA STUDIO (RETAIL / MODA SHOPIFY STYLE)
INSERT INTO tenants (
    id, slug, name, business_type, custom_domain, whatsapp_phone, currency,
    bank_alias, bank_cbu_cvu, bank_holder_name, bank_discount_percent,
    branding
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'aura-studio',
    'AURA Studio',
    'retail_stock',
    'aurastudio.com.ar',
    '5491154188294',
    'ARS',
    'aura.indumentaria.mp',
    '0000003100045612893456',
    'Aura Studio S.R.L.',
    15.00,
    '{
        "primary_color": "#06b6d4",
        "secondary_color": "#0b1120",
        "hero_title": "Colección Minimalista Otoño / Invierno 2026",
        "hero_subtitle": "Diseño editorial, fibras nobles y cortes contemporáneos.",
        "announcement_bar": "ENVÍO GRATIS A TODO EL PAÍS EN COMPRAS SUPERIORES A $80.000 · 3 CUOTAS SIN INTERÉS",
        "free_shipping_threshold": 80000
    }'::jsonb
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Categorías de AURA Studio
INSERT INTO categories (id, tenant_id, name, slug, order_index) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Abrigos & Blasers', 'abrigos', 1),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Remeras & Tops', 'remeras', 2),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Pantalones', 'pantalones', 3),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Vestidos', 'vestidos', 4)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Productos de AURA Studio
INSERT INTO products (id, tenant_id, category_id, name, description, base_price, compare_price, images, has_variants) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 
 'Blazer Oversize Sastrería', 'Sastrería contemporánea con hombreras estructuradas y caída fluida. Tejido sastrero italiano de primera calidad.', 54000.00, 68000.00, ARRAY['assets/blazer_oversize.jpg'], true),

('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 
 'Remera Heavyweight Negra', 'Algodón peinado premium de 240g con cuello cerrado acanalado y corte boxy relajado.', 24000.00, 29000.00, ARRAY['assets/remera_oversize_negra.jpg'], true),

('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 
 'Pantalón Cargo Wide Leg', 'Bolsillos laterales con fuelles discretos, tiro alto con ajuste interno y botamanga ancha.', 46000.00, 52000.00, ARRAY['assets/pantalon_cargo.jpg'], true),

('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 
 'Vestido Midi Lino Crudo', 'Lino puro pre-lavado con escote recto, breteles finos ajustables y tajos laterales.', 49000.00, 58000.00, ARRAY['assets/vestido_lino.jpg'], true)
ON CONFLICT (id) DO NOTHING;

-- Variantes con control de Stock por talle
INSERT INTO product_variants (product_id, tenant_id, sku, size, color, stock) VALUES
-- Blazer
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BLZ-BLK-XS', 'XS', 'Negro', 2),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'BLZ-BLK-S',  'S',  'Negro', 4),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'BLZ-BLK-M',  'M',  'Negro', 5),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'BLZ-BLK-L',  'L',  'Negro', 0), -- AGOTADO
-- Remera
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'REM-BLK-S',  'S',  'Negro', 8),
('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'REM-BLK-M',  'M',  'Negro', 12),
('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'REM-BLK-L',  'L',  'Negro', 6),
('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'REM-BLK-XL', 'XL', 'Negro', 1)
ON CONFLICT (id) DO NOTHING;


-- 2. TENANT: FORNO & CO. (GASTRONOMÍA & DELIVERY)
INSERT INTO tenants (
    id, slug, name, business_type, custom_domain, whatsapp_phone, currency,
    bank_alias, bank_cbu_cvu, bank_holder_name, bank_discount_percent,
    branding
) VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'forno-delivery',
    'FORNO & CO.',
    'menu_pedidos',
    'forno.delivery.ar',
    '5491154188294',
    'ARS',
    'forno.delivery.mp',
    '0000003100089765432101',
    'Forno Gastronomía S.A.S.',
    10.00,
    '{
        "primary_color": "#f59e0b",
        "secondary_color": "#080d1a",
        "hero_title": "Comida real. Sin intermediarios ni comisiones del 30%.",
        "hero_subtitle": "Pizzas fermentadas 48hs en horno de leña y Smash Burgers artesanales.",
        "announcement_bar": "COCINA ABIERTA · ESTIMADO: 35-45 MIN · 10% OFF CON TRANSFERENCIA ALIAS",
        "delivery_fee": 2500
    }'::jsonb
) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Platos / Menú de FORNO & CO.
INSERT INTO products (id, tenant_id, name, description, base_price, images, stock, has_variants) VALUES
('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002',
 'Pizza Margherita D.O.P.', 'Salsa de tomate San Marzano italiano, mozzarella fior di latte, albahaca fresca y aceite de oliva virgen extra.', 16500.00, ARRAY['assets/pizza_margherita.jpg'], 50, false),

('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002',
 'Doble Smash Bacon Burger', 'Doble medallón smash de 100g de carne de pastoreo, cuádruple cheddar fundido y panceta crocante en pan brioche.', 14800.00, ARRAY['assets/burger_smash.jpg'], 60, false),

('c0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000002',
 'Papas Rústicas Trufadas', 'Papas crocantes cortadas a mano con piel, aromatizadas con aceite de trufa blanca y queso parmesano.', 7200.00, ARRAY['assets/papas_rusticas.jpg'], 80, false),

('c0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000002',
 'Volcán Tibio de Chocolate', 'Bizcocho húmedo de cacao amargo al 70% con corazón fundido de chocolate y frutos rojos.', 6800.00, ARRAY['assets/postre_volcan.jpg'], 30, false)
ON CONFLICT (id) DO NOTHING;
