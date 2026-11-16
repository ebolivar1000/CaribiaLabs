# ⚠️ AVISO DE MIGRACIÓN DE RUTA (DISCO C: -> DISCO D:)

**FECHA DE TRASLADO:** 13 de Noviembre de 2026

Para optimizar el espacio de almacenamiento y evitar saturación en el disco del sistema (C:), todos los proyectos de Inteligencia Artificial han sido trasladados oficialmente al disco **D:**.

### Rutas Actualizadas:
- **Nueva Ruta Oficial en Disco D:** D:\ProyectosIA\
- **Ruta Antigua en Disco C (Junction NTFS Activo):** C:\Users\Everth\ProyectosIA\

### 📢 NOTA PARA OTRAS VENTANAS DE CONTEXTO / AGENTES / SCRIPTS:
1. Se ha establecido un **Directory Junction NTFS** en C:\Users\Everth\ProyectosIA que apunta a D:\ProyectosIA. Cualquier script o agente que siga usando C:\Users\Everth\ProyectosIA\... continuará funcionando **sin errores de ruta**, pero los datos físicos residen en el Disco D:.
2. Para nuevos procesos y configuraciones, **utiliza preferentemente la ruta oficial D:\ProyectosIA**.
3. **Git / GitHub / Cloudflare:** Los repositorios Git (remotos de GitHub) y archivos de configuración de Cloudflare Wrangler (wrangler.toml, wrangler.jsonc) son 100% relativos y se encuentran operativos.
