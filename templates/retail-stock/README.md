# Plantilla Maestra Retail & Control de Stock (CaribIA Labs)

Esta es la primera plantilla maestra de la **Software Factory** de CaribIA Labs, diseñada para tiendas de indumentaria, calzado, tecnología y comercios minoristas en Latinoamérica (con foco en Argentina).

---

## 🌟 Características Integradas

1. **Catálogo Mobile-First PWA:** Carga ultra-rápida, fotografías WebP/AVIF y navegación fluida por categorías.
2. **Variantes Complejas de Talle y Color:** Control de existencias por cada combinación específica (ej. *Remera Negra - Talle L*).
3. **Control de Stock y Cero Sobreventa:** Si una variante llega a 0, se inhabilita de inmediato y no permite agregarse al carrito.
4. **Checkout Doble Vía (Mercado Pago & Transferencias Alias):**
   * **Mercado Pago:** Cobro online con tarjetas, cuotas y dinero en cuenta.
   * **Transferencia Bancaria:** Cálculo automático del 10% de descuento y botón de copiado de Alias.
5. **Comanda Directa a WhatsApp:** Generación de un pedido estructurado y listo para enviar al WhatsApp del negocio.
6. **Panel Móvil de Administración (`admin.html`):** Para que el dueño de la tienda pueda cargar productos y ajustar existencias en segundos desde su celular sin tocar código.

---

## ⚡ Cómo Instanciar para un Nuevo Cliente en 5 Minutos

1. Copiar la carpeta `templates/retail-stock` con el nombre del cliente (ej. `tienda-maria`).
2. Duplicar `config.sample.json` como `config.json` y completar:
   * `business_name`: Nombre de la marca.
   * `whatsapp_phone`: Teléfono de WhatsApp de recepción de pedidos.
   * `bank_alias`: Alias de Mercado Pago o cuenta bancaria.
   * `bank_discount_percent`: Descuento por transferencia (ej. `10`).
3. Cargar los productos iniciales en `app.js` o desde `admin.html`.
4. Desplegar en Cloudflare Pages como `tienda-maria.caribialabs.com`.
