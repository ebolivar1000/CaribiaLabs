-- ====================================================================
-- CARIBIA LABS - SOFTWARE FACTORY PLATFORM
-- ESQUEMA DE BASE DE DATOS MULTI-TENANT (FASE 0)
-- Motor: PostgreSQL Serverless (Neon DB / Supabase)
-- Estrategia: Multi-Tenancy Lógico con Row-Level Security (RLS)
-- ====================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA MAESTRA DE TENANTS (CLIENTES DE CARIBIA LABS)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,             -- ej: 'garage-pimpollos', 'totalhiit'
    name VARCHAR(128) NOT NULL,                    -- ej: 'Garage Pimpollos'
    business_type VARCHAR(64) NOT NULL,            -- 'retail_stock', 'citas_salud', 'menu_pedidos', 'leadbot'
    custom_domain VARCHAR(128) UNIQUE,             -- ej: 'pimpollos.com' o NULL para subdominio
    whatsapp_phone VARCHAR(32) NOT NULL,           -- Número de WhatsApp del negocio
    currency VARCHAR(8) DEFAULT 'ARS',             -- 'ARS', 'USD', 'COP', 'CLP'
    
    -- Configuración de Pagos en Argentina
    mercadopago_public_key TEXT,
    mercadopago_access_token TEXT,
    bank_alias VARCHAR(64),                        -- ej: 'pimpollos.garage.mp'
    bank_cbu_cvu VARCHAR(32),
    bank_holder_name VARCHAR(128),
    bank_discount_percent NUMERIC(5,2) DEFAULT 0,  -- ej: 10.00% de descuento por transferencia
    
    -- Branding & Configuración
    branding JSONB DEFAULT '{
        "primary_color": "#06b6d4",
        "secondary_color": "#0f172a",
        "logo_url": null,
        "hero_title": "Bienvenido a nuestra tienda",
        "announcement_bar": "Envíos a todo el país y retiro en local"
    }'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORÍAS DE PRODUCTOS / SERVICIOS
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,
    slug VARCHAR(64) NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, slug)
);

-- 4. PRODUCTOS (CATÁLOGO RETAIL)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    base_price NUMERIC(12,2) NOT NULL,
    compare_price NUMERIC(12,2),                   -- Precio tachado anterior
    images TEXT[] DEFAULT ARRAY[]::TEXT[],         -- URLs en Cloudflare R2
    has_variants BOOLEAN DEFAULT false,
    stock INT DEFAULT 0,                           -- Stock general si no tiene variantes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. VARIANTES DE PRODUCTO (TALLES, COLORES, MODELOS)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sku VARCHAR(64),
    size VARCHAR(32),                              -- ej: 'S', 'M', 'L', 'XL', '38', '40'
    color VARCHAR(32),                             -- ej: 'Negro', 'Blanco', 'Azul'
    color_hex VARCHAR(16),                         -- ej: '#000000'
    price_override NUMERIC(12,2),                  -- Si tiene precio diferente
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PEDIDOS Y VENTAS (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_number SERIAL,
    customer_name VARCHAR(128) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,           -- WhatsApp del cliente
    customer_email VARCHAR(128),
    delivery_type VARCHAR(32) DEFAULT 'envio',     -- 'envio', 'retiro_local'
    shipping_address TEXT,
    shipping_cost NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,           -- 'mercadopago', 'transferencia', 'efectivo'
    payment_status VARCHAR(32) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'verified'
    mercadopago_payment_id VARCHAR(64),
    proof_of_transfer_url TEXT,                    -- URL de foto de comprobante en R2
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. LÍNEAS DE DETALLE DEL PEDIDO (ORDER ITEMS)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL
);

-- 8. ÍNDICES DE RENDIMIENTO PARA ESCALA SERVERLESS
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

-- 9. POLÍTICAS DE AISLAMIENTO ROW-LEVEL SECURITY (RLS)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
