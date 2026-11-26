# Arquitectura del Sistema — CaribIA Labs

## Visión General
CaribIA Labs combina un frontend ultra-liviano de alta conversión con servicios serverless:

```mermaid
flowchart TD
    Client["Navegador / Cliente PyME"] --> Hub["Hub Central (index.html)<br>Obsidian Mesh Glow + Glassmorphism"]
    Hub --> Showroom["Showroom Interactivo (app.js)<br>Selector de Variantes + Simulador MP"]
    Hub --> Calc["Calculadora de Horas Libres<br>Diagnóstico Interactivo"]
    
    Hub --> BackendPages["Despliegue Serverless<br>Cloudflare Pages / Vercel"]
    BackendPages --> DB["Base de Datos Multi-Tenant<br>PostgreSQL Serverless (Neon DB)"]
    
    Submodules["Módulos Internos de la Fábrica"]
    Submodules --> Admin["/admin: Panel de Control de Clientes"]
    Submodules --> Factory["/factory: Generadores de Sitios y Plantillas"]
    Submodules --> VideoGen["/video_generator: Automatización Multimedia"]
    Submodules --> Worker["/worker: Endpoints Edge para Webhooks/API"]
```

## Estructura de Directorios
- `index.html`, `styles.css`, `app.js`: Hub corporativo principal de la Software Factory.
- `database/schema.sql`: Esquema PostgreSQL multi-tenant (Neon DB) con soporte para tenants, productos, órdenes y transacciones.
- `admin/`: Interfaz para administración de clientes y pedidos.
- `factory/`: Scaffolding y templates de landing pages para clientes.
- `video_generator/`: Automatización con Puppeteer Core para generación de creatividades y videos de marketing.
- `instagram/`: Templates y creatividades para captación en redes sociales.
- `assets/`: Recursos visuales de marcas reales incubadas.
