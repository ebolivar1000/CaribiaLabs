# GUÍA DE DESPLIEGUE & OPERACIÓN: FASE 3 Y FASE 4
## CaribIA Labs Software Factory Platform ($0 OPEX)

Esta guía explica en detalle cómo poner en funcionamiento el backend serverless (**Fase 3**) y cómo operar el motor de aprovisionamiento automatizado (**Fase 4**) para entregar sitios web, tiendas y chatbots con IA a PyMEs en tiempo récord.

---

### Arquitectura Implementada

```
                        ┌────────────────────────────────────────┐
                        │      CLIENTES & COMPRADORES            │
                        └───────┬────────────────────────┬───────┘
                                │ Navegación Web         │ Chat de WhatsApp
                                ▼                        ▼
        ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
        │        Cloudflare Pages           │    │    Meta Cloud API (WhatsApp)      │
        │  • Hub Principal (index.html)     │    │  • Medio de transporte webhook    │
        │  • Tiendas Clientes (dist/tenants)│    │  • Número: +54 9 11 5418-8294     │
        └─────────────────┬─────────────────┘    └─────────────────┬─────────────────┘
                          │ Llamadas REST                          │ Webhook Inbound
                          ▼                                        ▼
    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │                     Cloudflare Worker (Hono.js Router)                          │
    │  • /api/tenants/:slug          -> Datos del inquilino y branding                │
    │  • /api/catalog/:slug/products -> Catálogo y variantes en tiempo real           │
    │  • /api/catalog/:slug/stock    -> Modo Comerciante (edición de stock en vivo)   │
    │  • /api/checkout/:slug         -> Mercado Pago & Cálculo de descuento Alias     │
    │  • /api/whatsapp/webhook       -> Enrutador de mensajes entrantes de clientes   │
    └─────────────────────┬────────────────────────────────────────┬──────────────────┘
                          │                                        │
                          ▼                                        ▼
        ┌───────────────────────────────────┐    ┌───────────────────────────────────┐
        │   PostgreSQL Serverless (Neon DB) │    │  Cerebro Cognitivo Desacoplado    │
        │  • Multi-tenant RLS por slug      │    │  • Google Gemini 2.0 Flash        │
        │  • Tenants, Products, Variants    │    │  • Cero restricciones comerciales │
        │  • Orders y Comprobantes Alias    │    │  • Español cálido argentino/Latam │
        └───────────────────────────────────┘    └───────────────────────────────────┘
```

---

### Fase 3: Despliegue de la API Serverless (Cloudflare Worker)

#### 1. Estructura de Archivos
* `worker/src/index.js`: Aplicación Hono con CORS y manejo global de errores.
* `worker/src/db.js`: Conector de base de datos Neon PostgreSQL con soporte RLS.
* `worker/src/routes/tenants.js`: Resolución de configuración de tiendas y medios de pago.
* `worker/src/routes/catalog.js`: Catálogo de productos, talles y stock.
* `worker/src/routes/checkout.js`: Creación de preferencias de Mercado Pago y datos para transferencias bancarias con Alias.
* `worker/src/routes/whatsapp.js`: Verificación de Webhook de Meta y recepción de chats.
* `worker/src/ai/cognitiveBrain.js`: Motor de razonamiento con Google Gemini para responder consultas y cerrar pedidos.

#### 2. Base de Datos en Neon PostgreSQL (Nivel Gratuito)
1. Crea una base de datos gratuita en [Neon.tech](https://neon.tech).
2. En la consola SQL de Neon, ejecuta primero:
   * `database/schema.sql` (Crea tablas, índices y extensiones UUID).
3. Luego ejecuta:
   * `database/seed.sql` (Crea los tenants de prueba: AURA Studio y FORNO & CO.).

#### 3. Variables de Entorno en Cloudflare Worker
En la carpeta `worker/`, ejecuta:
```bash
# Conexión a Neon PostgreSQL
npx wrangler secret put DATABASE_URL
# Pega tu connection string: postgresql://user:pass@ep-cool-db.us-east-2.aws.neon.tech/neondb?sslmode=require

# Llave de Google Gemini (Google AI Studio)
npx wrangler secret put GEMINI_API_KEY
# Pega tu API Key de Gemini

# Token de verificación para Meta Webhook
npx wrangler secret put WHATSAPP_VERIFY_TOKEN
# Ingresa tu token personalizado (ej: caribia_labs_secret_verify_2026)

# Access Token permanente de Meta Cloud API (cuando esté activo)
npx wrangler secret put WHATSAPP_ACCESS_TOKEN

# Access Token de Mercado Pago Argentina (opcional en testing)
npx wrangler secret put MERCADOPAGO_ACCESS_TOKEN
```

#### 4. Despliegue en Cloudflare
```bash
cd worker
npm install
npm run deploy
```
El worker quedará publicado en `https://caribia-labs-api.<tu-subdominio>.workers.dev`.

---

### Fase 4: Motor de Aprovisionamiento "Software Factory"

El motor permite generar una solución completa para una PyME en **menos de 2 segundos** con un solo comando.

#### 1. Sintaxis de Ejecución
```bash
node factory/provision.js \
  --slug=<identificador-unico> \
  --name="<Nombre del Negocio>" \
  --template=<plantilla> \
  --phone=<whatsapp-oficial> \
  --alias=<alias-de-cobro> \
  --discount=<porcentaje-descuento>
```

#### 2. Parámetros Disponibles
| Parámetro | Descripción | Opciones |
| :--- | :--- | :--- |
| `--slug` | Identificador único y subdominio | Ej: `pimpollos`, `optica-vision` |
| `--name` | Nombre comercial del cliente | Ej: `"Garage Pimpollos"` |
| `--template` | Plantilla industrial a clonar | `retail-stock`, `menu-gastronomia`, `citas-salud`, `insumos-belleza` |
| `--phone` | WhatsApp de recepción de comandas | Formato internacional: `5491154188294` |
| `--alias` | Alias bancario para transferencias | Ej: `pimpollos.garage.mp` |
| `--discount` | % de descuento por pagar con Alias | Default: `15` para retail, `10` para comida |

#### 3. Ejemplo Real 1: Tienda de Calzado & Ropa
```bash
node factory/provision.js \
  --slug=calzados-nordelta \
  --name="Calzados Nordelta" \
  --template=retail-stock \
  --phone=5491154188294 \
  --alias=nordelta.calzados.mp \
  --discount=15
```

#### 4. Ejemplo Real 2: Restaurante / Hamburguesería
```bash
node factory/provision.js \
  --slug=burger-palermo \
  --name="Smash Burger Palermo" \
  --template=menu-gastronomia \
  --phone=5491154188294 \
  --alias=burger.palermo.mp \
  --discount=10
```

#### 5. Qué Genera Automáticamente la Factory:
1. Clona todos los recursos y fotografía temática especializada a `dist/tenants/<slug>/`.
2. Inyecta el nombre del negocio, número de WhatsApp y Alias en el código frontend.
3. Genera `config.json` con la configuración del cliente.
4. Genera `provision.sql` con la sentencia `INSERT INTO tenants ...` lista para ejecutar en Neon DB.
5. El cliente ya tiene su sitio personalizado listo para subir a Cloudflare Pages o conectar a su dominio propio.
