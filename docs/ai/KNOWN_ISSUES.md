# Problemas Conocidos y Advertencias — CaribIA Labs

## 1. Protección de Variables de Entorno
- El archivo `.env` local contiene credenciales de base de datos Neon DB y tokens de automatización. **Está estrictamente excluido de Git** en `.gitignore`. Jamás se debe commitear.

## 2. Puppeteer Core en Windows
- Los scripts en `video_generator/` requieren la ruta local del ejecutable de Chrome o Edge en Windows (`msedge.exe`). Validar la ruta antes de ejecutar en nuevos entornos.
