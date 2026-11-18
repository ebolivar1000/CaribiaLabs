# 🔬 INGENIERÍA INVERSA & ANÁLISIS DE MODELO DE NEGOCIO: Menu4D
**Target Analizado:** [https://menu4d.com.ar/](https://menu4d.com.ar/)  
**Fecha de Análisis:** 18 de Noviembre de 2026  
**Investigado por:** CaribIA Labs — Inteligencia Comercial & Arquitectura de Software  

---

## 1. Resumen Ejecutivo & Propuesta de Valor

**Menu4D** es una plataforma argentina B2B SaaS enfocada en el sector gastronómico (restaurantes, bares, cervecerías, hamburgueserías, cafeterías, pizzerías). 

### La Fórmula de su Gancho ("El Concepto 4D"):
La empresa comercializa una narrativa evolutiva muy potente para diferenciarse de las típicas cartas QR en PDF aburridas:
* **1D (Carta Impresa):** *Solo la lees* (estática, desactualizada, costos de reimpresión).
* **2D (Carta QR Común / PDF):** *Solo la miras* (lenta, incómoda de hacer zoom en el celular).
* **3D (Plato 3D Interactivo):** *Lo giras en 360°* en la pantalla del celular.
* **4D (Menu4D):** *Lo vives sobre tu mesa*: **3D + Realidad Aumentada (Web AR) a escala real + Actualizaciones en tiempo real + Asistente IA.**

### Propuesta de Valor Cuantificada:
1. **Aumento del Ticket Promedio (+12% a +18%):** Al mostrar platos apetecibles en 3D/video y tamaño real, el cliente pide más por impulso visual.
2. **0% Comisión por Venta:** Ataque directo a PedidosYa y Rappi (que cobran 15% al 30%). El dinero entra directo a la cuenta de Mercado Pago del restaurante.
3. **Cero Fricción para el Comensal:** No requiere descargar ninguna app (corre 100% en el navegador web con Safari QuickLook y Android SceneViewer).
4. **Gestión Operativa Unificada:** Mesas con QR seguro, comanda de cocina en vivo (KDS), arqueo de turnos y métricas.

---

## 2. Arquitectura Tecnológica (Descubierta vía Bundle Analysis)

Mediante la inspección de los bundles de producción en `app.menu4d.com.ar` y la landing principal, se desglosó su stack tecnológico exacto:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MENU4D TECH STACK                             │
├───────────────────────┬────────────────────────────────────────────────┤
│ Landing Page          │ Next.js (App Router, Tailwind CSS, SSR)        │
│ Web App Clientes/POS  │ React SPA + Vite / Rolldown (`app.menu4d...`)  │
│ Motor 3D WebGL        │ Three.js (`three-*.js`)                        │
│ Realidad Aumentada    │ Google `<model-viewer>` (`model-viewer-*.js`)  │
│ Backend & Realtime    │ Google Firebase (Firestore, Auth, WebSockets)  │
│ Geolocalización       │ Google Maps Platform API (`maps-*.js`)         │
│ Pasarela de Cobros    │ Mercado Pago Checkout API (integración directa)│
│ State Management      │ Zustand / Lightweight React State              │
└───────────────────────┴────────────────────────────────────────────────┘
```

### ¿Cómo logran la Realidad Aumentada sin Apps Nativas?
El componente clave es la librería de código abierto **`<model-viewer>` de Google**.
* En dispositivos **iOS (iPhone/iPad):** Generan el archivo en formato `.usdz`. Al tocar "Ver en tu mesa", iOS abre nativamente la cámara en modo *AR Quick Look*.
* En dispositivos **Android:** Utilizan el formato `.glb` estándar a través de *Scene Viewer* de Google Play Services.
* **Resultado:** Carga instantánea en cualquier celular moderno sin necesidad de instalar nada desde el App Store o Play Store.

### ¿Cómo crean los Modelos 3D de los Platos a Bajo Costo?
Menu4D **no** modela manualmente cada hamburguesa o plato desde cero en Blender o Maya. Su secreto operativo se basa en dos pilares:
1. **Biblioteca Precargada (El 80% de las cartas son estándar):** Cuentan con un catálogo base de platos 3D genéricos ya optimizados (Hamburguesa completa, Milanesa napolitana, Pizza margherita, Bife de chorizo, Papas rústicas, Empanadas, Postre volcán). El dueño simplemente los selecciona de la biblioteca.
2. **Fotogrametría / IA Generativa 3D para Platos Insignia:** El cliente envía fotos o un video corto del plato tomado desde el celular, y mediante pipelines automatizados de Image-to-3D (como Tripo3D, Meshy o Luma) se genera una malla optimizada de menos de 3 MB.

---

## 3. Modelo de Negocio & Pricing (Estructura de Monetización)

Menu4D monetiza a través de un modelo híbrido **SaaS Recurrente (MRR) + Tarifa de Setup (Alta Única) + Venta de Add-ons**:

| Componente | Plan Inicial | Plan Pro | Plan Premium (Enterprise) |
| :--- | :--- | :--- | :--- |
| **Abono Mensual** | **$29.999 ARS/mes** *(USD 19,99)* | **$49.999 ARS/mes** *(USD 33,50)* | Personalizado |
| **Costo de Alta Única (Setup)**| **$20.000 ARS** | **$35.000 ARS** | A medida |
| **Límite de Productos** | Hasta 50 productos | Hasta 120 productos | Productos Ilimitados |
| **Generaciones 3D / mes**| 5 platos 3D/mes | 10 platos 3D/mes | Platos 3D a medida |
| **Videos de Platos** | Hasta 10 videos | Hasta 30 videos | Videos ilimitados |
| **Métricas de Negocio** | ❌ No | ✅ Sí (Vistas 3D vs pedidos) | ✅ Sí |
| **Asistente IA en la Carta**| ❌ No | ❌ No | ✅ Incluido |
| **Marca Blanca (Whitelabel)**| ❌ No (dice Menu4D) | ❌ No | ✅ Marca propia del local |
| **Venta de Platos 3D Extra**| $2.500 ARS por plato | $2.500 ARS por plato | Incluido en paquete |
| **Comisión por Venta** | **0%** | **0%** | **0%** |

---

## 4. Embudo de Adquisición & Estrategia Comercial (Go-To-Market)

```
[ Tráfico Orgánico TikTok / IG Reels (@menu4d) ]
    Demostraciones virales de platos 3D saliéndose de la pantalla
                       ↓
[ Landing Page con Calculadora de ROI ]
    Ej: "90 cubiertos x $14k ticket x +12% = +$4.536.000 ARS extra/mes"
                       ↓
[ Lead Magnet: 1 Mes Gratis para Primeros Locales ]
    Formulario simple sin tarjeta de crédito
                       ↓
[ Conversión Humana por WhatsApp (+54 9 11 2483-4754) ]
    Onboarding guiado: cargan la carta, envían los QR impresos
                       ↓
[ Retención y Cobro Recurrente (Mes 2 en adelante) ]
    Suscripción mensual por débito / transferencia
```

---

## 5. Mapeo para Futuros Proyectos de CaribIA Labs

Este modelo valida exactamente lo que venimos desarrollando en CaribIA Labs, con enormes oportunidades de superación:

### Fortalezas Detectadas en Menu4D:
* Excelente naming y narrativa comercial ("Carta 4D").
* La calculadora de facturación extra es demoledora para cerrar ventas B2B.
* Excelente uso de Web AR nativa sin descargas.

### Debilidades de Menu4D (Oportunidades para CaribIA Labs):
1. **El Asistente IA está bloqueado en el plan más caro:** En CaribIA Labs nuestros asistentes y bots son nativos y accesibles desde planes estándar.
2. **Limitado solo a Gastronomía:** La misma tecnología de Realidad Aumentada Web con `<model-viewer>` puede aplicarse a **Moda/Retail** (ver zapatillas o carteras en 3D), **Mueblerías/Deco** (ver cómo queda un sillón en tu living), y **Clínicas/Estética**.
3. **Plazos de Entrega:** Menu4D depende de procesos manuales de carga que tardan días. En CaribIA Labs contamos con el slogan y la arquitectura de *"La entrega personalizada más rápida del mercado"* en 48 a 72 horas hábiles.
4. **Integración con CRM Activo:** Menu4D no tiene un módulo de seguimiento comercial de clientes ganados vs cotizados como el que acabamos de implementar en nuestro Discovery CRM.

---

## 6. Recursos & Enlaces Clave Guardados

* **Landing Oficial:** `https://menu4d.com.ar/`
* **Aplicación Web:** `https://app.menu4d.com.ar`
* **WhatsApp Comercial de Venta:** `+54 9 11 2483-4754`
* **Redes:** Instagram `@menu4d`, TikTok `@menu4d`
* **Librería de Realidad Aumentada:** `@google/model-viewer` (WebXR, Three.js).
