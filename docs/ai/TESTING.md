# Estrategia de Pruebas y Validación — CaribIA Labs

## Pruebas de Frontend & UI
1. **Previsualización Local:**
   ```bash
   python -m http.server 8000
   ```
2. **Checklist de Verificación Visual:**
   - Carga fluida del Showroom en móvil y desktop.
   - Cálculo correcto de la Calculadora de Ahorro y botones de WhatsApp.
   - Verificación de contraste en modo obsidian glow.

## Pruebas de Base de Datos
- Las consultas y migraciones se prueban contra Neon DB utilizando clientes SQL estándar sobre `database/schema.sql`.
