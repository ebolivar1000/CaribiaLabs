# Registro de Decisiones de Arquitectura (ADR) — CaribIA Labs

## D1 (2026-10-15) — Vanilla Frontend para Máxima Velocidad
- **Decisión:** Mantener el hub principal en HTML5 + CSS + Vanilla JS sin frameworks pesados (React/Next).
- **Motivo:** Tiempo de carga inferior a 0.8s en redes móviles latinoamericanas y compatibilidad total con cualquier hosting estático gratuito.

## D2 (2026-10-18) — Esquema Multi-Tenant Serverless con PostgreSQL (Neon DB)
- **Decisión:** Modelar la base de datos de los clientes mediante una arquitectura multi-tenant en Neon DB (`database/schema.sql`).
- **Motivo:** Escalado automático a cero costo cuando no hay tráfico y soporte para múltiples clientes PyME en una sola instancia.

## D3 (2026-11-25) — Estandarización de Infraestructura Dual (Antigravity + Cursor)
- **Decisión:** Implementar la memoria unificada `/docs/ai/` y directivas `.cursor/rules/`.
- **Motivo:** Permitir el desarrollo alternado entre ambos entornos sin pérdida de contexto.
