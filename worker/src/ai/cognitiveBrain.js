// ====================================================================
// CARIBIA LABS - CEREBRO COGNITIVO DESACOPLADO (AI ROUTER)
// Motor: Google Gemini Flash / OpenAI GPT-4o-mini
// WhatsApp actúa únicamente como medio de transporte seguro (Webhook)
// ====================================================================

export async function processCustomerMessageWithAI({
  userMessage,
  senderPhone,
  tenant,
  catalog = [],
  env,
  customApiKey
}) {
  const geminiApiKey = customApiKey || env?.GEMINI_API_KEY;
  const geminiModel = env?.GEMINI_MODEL || 'gemini-2.0-flash';

  // 1. Catálogo formateado para el contexto del LLM
  const catalogContext = catalog.map(p => {
    let variantsText = '';
    if (p.variants && p.variants.length > 0) {
      variantsText = ` [Talles/Variantes: ${p.variants.map(v => `${v.size || v.color} (Stock: ${v.stock})`).join(', ')}]`;
    } else {
      variantsText = ` [Stock: ${p.stock || 'Disponible'}]`;
    }
    return `• ${p.name}: $${Number(p.base_price).toLocaleString('es-AR')} ARS${variantsText}. ${p.description || ''}`;
  }).join('\n');

  // 2. Prompt del Sistema adaptado al negocio PyME
  const systemPrompt = `
Eres la asistente virtual inteligente y vendedora de "${tenant.name}".
Tu objetivo es responder de forma rápida, cálida, empática y en español latinoamericano (usando modismos amigables de Argentina como "hola", "¿cómo estás?", "te cuento", etc.), pero SIN ningún tipo de tecnicismo.

DATOS DEL NEGOCIO:
- Rubro: ${tenant.business_type}
- Moneda: ${tenant.currency || 'ARS'}
- Teléfono oficial: ${tenant.whatsapp_phone}
- Transferencias Bancarias (Alias): ${tenant.bank_alias || 'No disponible'} (${tenant.bank_discount_percent || 0}% de descuento directo)
- Tarjetas y Cuotas: Aceptamos Mercado Pago (3 cuotas)

CATÁLOGO ACTUALIZADO EN TIEMPO REAL:
${catalogContext || 'Consulta de servicios generales y turnos'}

REGLAS DE CONDUCTA:
1. Responde preguntas frecuentes de talles, colores, precios y stock basándote ESTRICTAMENTE en el catálogo.
2. Si un talle o plato está con stock 0, avísale con amabilidad y ofrécele una alternativa disponible.
3. Si el cliente quiere comprar, pídele su nombre, dirección (si es con envío) o indícale si retira en local.
4. Resalta siempre el beneficio del ${tenant.bank_discount_percent || 0}% de descuento si abona por Transferencia con Alias.
5. Mantén tus mensajes breves (máximo 2 párrafos cortos), ideales para leerse cómodamente en WhatsApp.
6. Si el cliente pide hablar con un humano o tiene un reclamo delicado, dile que enseguida el equipo del local tomará el chat.
`.trim();

  // 3. Llamada al LLM (Google Gemini REST API nativa para Cloudflare Workers)
  if (geminiApiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nMENSAJE DEL CLIENTE (${senderPhone}):\n"${userMessage}"\n\nTU RESPUESTA PARA WHATSAPP:` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500
        }
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const data = await resp.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          return {
            replyText: replyText.trim(),
            provider: 'google-gemini-flash'
          };
        }
      }
    } catch (e) {
      console.error('Error llamando a Gemini API:', e);
    }
  }

  let aiError = null;

  // 3.5. Llamada a Cloudflare Workers AI nativo (Llama 3.2 3B Instruct en el Edge - 100% Gratuito y Nativo)
  if (env && env.AI) {
    try {
      const cfResponse = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 350,
        temperature: 0.5
      });

      if (cfResponse && cfResponse.response) {
        return {
          replyText: cfResponse.response.trim(),
          provider: 'cloudflare-workers-ai (llama-3.2-3b)'
        };
      }
    } catch (e) {
      console.error('Error llamando a Cloudflare Workers AI:', e);
      aiError = e.message;
    }
  }

  // 4. Fallback determinístico inteligente si no hay API key o hay timeout
  const lower = userMessage.toLowerCase();
  let fallbackReply = `¡Hola! Gracias por comunicarte con ${tenant.name} 😊. `;

  if (lower.includes('precio') || lower.includes('cuanto sale') || lower.includes('catálogo') || lower.includes('catalogo')) {
    fallbackReply += `Puedes ver nuestro catálogo completo con stock en tiempo real y promociones directamente en nuestra tienda online: https://${tenant.slug}.caribialabs.com\n\n¿Buscas algún producto o servicio en especial?`;
  } else if (lower.includes('envio') || lower.includes('envío') || lower.includes('donde estan') || lower.includes('local')) {
    fallbackReply += `Hacemos envíos a todo el país y también contamos con opción de retiro. Además, ¡pagando por Transferencia Bancaria (Alias) tienes un ${tenant.bank_discount_percent || 10}% de descuento directo!`;
  } else if (lower.includes('turno') || lower.includes('cita') || lower.includes('hora')) {
    fallbackReply += `Para agendar tu turno sin esperas y elegir el profesional y horario que te quede más cómodo, entra a https://${tenant.slug}.caribialabs.com o indícame qué día te gustaría venir.`;
  } else {
    fallbackReply += `¿En qué te podemos ayudar hoy? Si necesitas ver fotos, talles o hacer un pedido con entrega inmediata, puedes entrar en nuestra web oficial o escribirnos tu consulta detallada aquí.`;
  }

  return {
    replyText: fallbackReply,
    provider: aiError ? `deterministic-rules-engine (error: ${aiError})` : 'deterministic-rules-engine'
  };
}
