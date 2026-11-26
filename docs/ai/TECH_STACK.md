# Stack Tecnológico — CaribIA Labs

## Frontend & Estilos
- **Base:** HTML5 Semántico + JavaScript ES6+ Moderno (Vanilla para carga instantánea sin hydration overhead).
- **Sistema de Diseño:** CSS3 con variables personalizadas (Obsidian `#0b0f19`, Cyan `#00f2fe`, Emerald `#10b981`), ambient glow y glassmorphism (`backdrop-filter`).
- **Librería de Movimiento:** `motion.js` + `motion.css` para micro-animaciones en viewport.

## Base de Datos & Serverless
- **Motor SQL:** PostgreSQL Serverless en **Neon DB**.
- **Edge Runtime:** Cloudflare Pages Functions / Cloudflare Workers (`worker/`).
- **Automatización:** Node.js + `puppeteer-core` 25.17 para renderizado headless y generación de creatividades.

## Despliegue
- **Producción:** Cloudflare Pages / Vercel con costo de infraestructura $0 USD en tier inicial.
- **Repositorio:** Git (`https://github.com/ebolivar1000/CaribiaLabs.git`), rama `main`.

## Comandos Oficiales
```bash
# Servidor local rápido con Python
python -m http.server 8000

# O con Node.js / npx
npx serve .
```
