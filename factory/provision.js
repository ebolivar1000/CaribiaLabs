#!/usr/bin/env node
// ====================================================================
// CARIBIA LABS - MOTOR DE APROVISIONAMIENTO AUTOMÁTICO (SOFTWARE FACTORY)
// Fase 4: Generación instantánea de sitios y chatbots para nuevas PyMEs
// Uso:
//   node factory/provision.js --slug=pimpollos --name="Garage Pimpollos" --template=retail-stock --phone=5491154188294 --alias=pimpollos.mp
// ====================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Parsear argumentos de línea de comandos
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.replace(/^--/, '').split('=');
      params[key] = value || true;
    }
  });
  return params;
}

// 2. Función principal de aprovisionamiento
async function provision() {
  const args = parseArgs();

  // Validación y defaults
  const slug = (args.slug || 'demo-cliente').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const name = args.name || 'Mi Tienda Online';
  const templateKey = args.template || 'retail-stock';
  const phone = (args.phone || '5491154188294').replace(/[^0-9]/g, '');
  const alias = args.alias || `${slug}.mp`;
  const discount = Number(args.discount) || (templateKey === 'retail-stock' ? 15 : 10);
  const currency = args.currency || 'ARS';

  console.log('\n======================================================');
  console.log('🚀 CARIBIA LABS - MOTOR DE SOFTWARE FACTORY (FASE 4)');
  console.log('======================================================');
  console.log(`📌 Inquilino (Slug):   ${slug}`);
  console.log(`🏢 Nombre del Negocio: ${name}`);
  console.log(`🎨 Plantilla Base:     ${templateKey}`);
  console.log(`📱 WhatsApp Oficial:   +${phone}`);
  console.log(`🏦 Alias Transferencia:${alias} (${discount}% OFF)`);
  console.log('------------------------------------------------------\n');

  // Verificar plantilla
  const templatesDefPath = path.join(__dirname, 'templates.json');
  const templatesDef = JSON.parse(fs.readFileSync(templatesDefPath, 'utf-8'));
  const templateConfig = templatesDef.templates[templateKey];

  if (!templateConfig) {
    console.error(`❌ Error: La plantilla "${templateKey}" no existe en factory/templates.json`);
    console.log('Plantillas disponibles:', Object.keys(templatesDef.templates).join(', '));
    process.exit(1);
  }

  const sourceDir = path.join(ROOT_DIR, templateConfig.source_dir);
  const targetDir = path.join(ROOT_DIR, 'dist', 'tenants', slug);

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Error: El directorio origen no existe: ${sourceDir}`);
    process.exit(1);
  }

  // Crear directorio de destino
  if (fs.existsSync(targetDir)) {
    console.log(`⚠️ Advertencia: El directorio "${targetDir}" ya existe. Sobrescribiendo archivos...`);
  } else {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copiar archivos de la plantilla recursivamente
  copyRecursive(sourceDir, targetDir);
  console.log(`✅ Archivos clonados desde: ${templateConfig.source_dir}`);

  // Personalizar index.html
  const indexPath = path.join(targetDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, 'utf-8');

    // Reemplazos de marca
    if (templateKey === 'retail-stock') {
      indexHtml = indexHtml
        .replace(/AURA Studio/g, name)
        .replace(/aurastudio\.com\.ar/g, `${slug}.caribialabs.com`)
        .replace(/aura\.indumentaria\.mp/g, alias)
        .replace(/5491154188294/g, phone);
    } else if (templateKey === 'menu-gastronomia') {
      indexHtml = indexHtml
        .replace(/FORNO & CO\./g, name)
        .replace(/forno\.delivery\.ar/g, `${slug}.caribialabs.com`)
        .replace(/forno\.delivery\.mp/g, alias)
        .replace(/5491154188294/g, phone);
    } else if (templateKey === 'citas-salud') {
      indexHtml = indexHtml
        .replace(/MediConnect/g, name)
        .replace(/5491154188294/g, phone);
    } else if (templateKey === 'insumos-belleza') {
      indexHtml = indexHtml
        .replace(/LUMIÈRE Studio/g, name)
        .replace(/5491154188294/g, phone);
    }

    fs.writeFileSync(indexPath, indexHtml, 'utf-8');
    console.log(`✅ ${path.basename(indexPath)} personalizado con marca y WhatsApp`);
  }

  // Personalizar app.js si existe
  const appJsPath = path.join(targetDir, 'app.js');
  if (fs.existsSync(appJsPath)) {
    let appJs = fs.readFileSync(appJsPath, 'utf-8');
    appJs = appJs
      .replace(/5491154188294/g, phone)
      .replace(/aura\.indumentaria\.mp/g, alias)
      .replace(/forno\.delivery\.mp/g, alias);
    fs.writeFileSync(appJsPath, appJs, 'utf-8');
    console.log(`✅ ${path.basename(appJsPath)} adaptado con números de contacto y alias`);
  }

  // Generar config.json específico para este tenant
  const tenantConfig = {
    slug,
    name,
    template: templateKey,
    phone,
    currency,
    payments: {
      bank_alias: alias,
      discount_percent: discount,
      mercadopago_enabled: true
    },
    provisioned_at: new Date().toISOString(),
    api_endpoint: `https://api.caribialabs.com/api/catalog/${slug}/products`
  };
  fs.writeFileSync(path.join(targetDir, 'config.json'), JSON.stringify(tenantConfig, null, 2), 'utf-8');
  console.log(`✅ config.json generado con éxito`);

  // Generar Script SQL de migración para Neon DB
  const sqlPath = path.join(targetDir, 'provision.sql');
  const sqlContent = `
-- ====================================================================
-- SCRIPT DE ALTA EN NEON POSTGRES PARA EL TENANT: ${name} (${slug})
-- Generado automáticamente por CaribIA Labs Software Factory
-- Fecha: ${new Date().toISOString()}
-- ====================================================================

INSERT INTO tenants (
    slug, name, business_type, custom_domain, whatsapp_phone, currency,
    bank_alias, bank_discount_percent, branding
) VALUES (
    '${slug}',
    '${name.replace(/'/g, "''")}',
    '${templateConfig.vertical}',
    '${slug}.caribialabs.com',
    '${phone}',
    '${currency}',
    '${alias}',
    ${discount},
    '{"primary_color": "#06b6d4", "hero_title": "Bienvenido a ${name.replace(/'/g, "''")}"}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    whatsapp_phone = EXCLUDED.whatsapp_phone,
    bank_alias = EXCLUDED.bank_alias;
`.trim();
  fs.writeFileSync(sqlPath, sqlContent, 'utf-8');
  console.log(`✅ Script SQL de aprovisionamiento listo en: dist/tenants/${slug}/provision.sql`);

  // Resumen final
  console.log('\n======================================================');
  console.log('🎉 ¡APROVISIONAMIENTO COMPLETADO EXITOSAMENTE!');
  console.log('======================================================');
  console.log(`📁 Carpeta de despliegue: dist/tenants/${slug}/`);
  console.log(`🌐 Subdominio asignado:   https://${slug}.caribialabs.com/`);
  console.log(`⚡ Tiempo estimado:       Menos de 2 segundos`);
  console.log('📲 Enlace directo de chat: https://wa.me/' + phone);
  console.log('======================================================\n');
}

// Función auxiliar recursiva para copiar carpetas y archivos
function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Ejecutar
provision().catch(err => {
  console.error('❌ Error durante el aprovisionamiento:', err);
  process.exit(1);
});
