# CaribIA Labs - Plataforma de Software Factory & IA para PyMEs

Plataforma integral de desarrollo de **Páginas Web, Aplicaciones y Chatbots con Inteligencia Artificial** para automatizar tareas manuales (pedidos, citas, stock, cobros) y potenciar las ventas de pequeñas y medianas empresas en Latinoamérica (foco inicial: Argentina).

> **Lema oficial:** *La entrega personalizada más rápida del mercado.*

---

## 🚀 Estructura del Proyecto

* **`index.html`**: Hub central de CaribIA Labs. Diseño futurista, moderno y sin tecnicismos complejos para clientes PyME. Incluye Showroom interactivo de catálogo con control de stock y Calculadora de Ahorro.
* **`styles.css`**: Sistema de diseño moderno con paleta obsidian, acentos cyan/esmeralda, gradientes de malla (*ambient glow*), efectos de vidrio (*glassmorphism*) y diseño 100% responsive.
* **`app.js`**: Lógica de interacción del Showroom (selector de variantes, cálculo de descuento de Alias/CBU, simulación de compra con Mercado Pago), Calculadora interactiva de horas libres y formulario de diagnóstico.
* **`assets/`**: Recursos visuales y multimedia de proyectos reales (**TotalHiit**, **Garage Pimpollos**, etc.).
* **`database/schema.sql`**: Esquema de base de datos multi-tenant para PostgreSQL Serverless (Neon DB) con soporte para tenants, productos, variantes de talles/colores, pedidos y órdenes de pago.
* **`Arquitectura_caribialabs.docx`**: Documento oficial del Plan Maestro de Arquitectura, roadmap de ejecución y modelo de monetización.

---

## 🛠️ Ejecución Local

Para previsualizar el sitio web en tu navegador:

```bash
# Con Python
python -m http.server 8000
```

Luego abre en tu navegador: [http://localhost:8000](http://localhost:8000)

---

## 🌐 Despliegue en Producción (Cloudflare Pages / Vercel)

El proyecto está listo para ser publicado con costo de infraestructura **$0 USD** en **Cloudflare Pages** o **Vercel** mediante subida directa o integración con GitHub (`ebolivar1000/CaribiaLabs`).
