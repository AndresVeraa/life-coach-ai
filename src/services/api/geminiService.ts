import axios from 'axios';

const getApiKey = () => process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const getGeminiUrl = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${getApiKey()}`;

// --- Tool Call types ---
export interface ToolCall {
  name: string;
  args: any;
}

export interface AIResponse {
  text: string;
  toolCalls?: ToolCall[];
}

// System prompt que instruye a Gemini sobre sus capacidades
const SYSTEM_PROMPT = `
Eres un Coach de Vida IA integrado en una app de productividad para estudiantes.
Tu nombre es "Coach IA". Eres empático, breve y motivador.

TIENES PODERES PARA MODIFICAR LA APP DEL USUARIO.

Cuando el usuario te pida crear un hábito, tarea, recordatorio o agendar algo en su horario:
1. Responde con un mensaje motivador y breve confirmando la acción.
2. AL FINAL de tu respuesta, incluye un bloque JSON con la acción a ejecutar.

Formatos JSON soportados (SIEMPRE dentro de \`\`\`json ... \`\`\`):

Para Hábitos/Tareas:
\`\`\`json
{"tool":"add_habit","args":{"title":"...","category":"cuerpo"|"mente"|"carrera"|"alma","frequency":"once"|"daily","reminderTime":"HH:mm"}}
\`\`\`

Para Bloques de Horario/Clases:
\`\`\`json
{"tool":"add_schedule_block","args":{"title":"...","dayIndex":0-6,"startHour":5-23.5,"duration":0.5-4}}
\`\`\`
- dayIndex: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado

REGLAS:
- Si el usuario dice "mañana", calcula el dayIndex correcto basado en que HOY es ${new Date().toLocaleDateString('es-ES', { weekday: 'long' })} (dayIndex=${new Date().getDay()}).
- Si no especifica hora, sugiere una razonable.
- Si no especifica categoría, infiere la más lógica.
- Si es una conversación normal sin petición de acción, NO incluyas JSON alguno.
- Siempre responde en español.
- Sé conciso: máximo 2-3 oraciones antes del JSON.
`.trim();

/**
 * Envía un mensaje al Coach IA con historial de conversación y capacidad de tool-calling
 */
export const sendMessageToGemini = async (
  history: { role: 'user' | 'assistant'; text: string }[],
  userMessage: string
): Promise<AIResponse> => {
  if (!getApiKey()) {
    return { text: '❌ Falta la API Key. Añade EXPO_PUBLIC_GEMINI_API_KEY a tu archivo .env' };
  }

  try {
    // Sanitizar historial: asegurar alternancia user/model y sin textos vacíos
    const sanitized: { role: string; parts: { text: string }[] }[] = [];
    for (const msg of history) {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const text = (msg.text || '').trim();
      if (!text) continue;
      // Si el último rol es igual, fusionar texto para evitar roles consecutivos
      if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === role) {
        sanitized[sanitized.length - 1].parts[0].text += '\n' + text;
      } else {
        sanitized.push({ role, parts: [{ text }] });
      }
    }

    // Construir contenido final con system prompt + historial + mensaje actual
    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Entendido. Soy el Coach IA con poderes para gestionar hábitos y horarios. ¿En qué te ayudo?' }] },
      ...sanitized,
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    // Verificación final: si el penúltimo es 'user' y el último también, fusionar
    for (let i = contents.length - 1; i > 0; i--) {
      if (contents[i].role === contents[i - 1].role) {
        contents[i - 1].parts[0].text += '\n' + contents[i].parts[0].text;
        contents.splice(i, 1);
      }
    }

    const response = await axios.post(getGeminiUrl(), {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parsear respuesta buscando bloques JSON de tool calls
    const jsonMatch = rawText.match(/```json\s*\n?([\s\S]*?)\n?\s*```/);
    let toolCalls: ToolCall[] = [];
    let cleanText = rawText;

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed.tool && parsed.args) {
          toolCalls.push({ name: parsed.tool, args: parsed.args });
        }
        // Quitar el bloque JSON del texto visible
        cleanText = rawText.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.warn('⚠️ No se pudo parsear JSON de la IA:', e);
      }
    }

    return {
      text: cleanText || '¡Entendido!',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  } catch (error: any) {
    // Log detallado del error para debugging
    console.error('❌ Gemini Error:', error.message);
    if (error.response?.data) {
      console.error('❌ Gemini Response Body:', JSON.stringify(error.response.data, null, 2));
    }

    let errorMsg = 'Lo siento, tuve un problema de conexión.';
    if (error.response?.status === 400) {
      const detail = error.response?.data?.error?.message || '';
      errorMsg = `⚠️ Error en la solicitud: ${detail || 'Formato inválido'}`;
    } else if (error.response?.status === 401) {
      errorMsg = '❌ API Key inválida. Verifica tu EXPO_PUBLIC_GEMINI_API_KEY.';
    } else if (error.response?.status === 429) {
      errorMsg = '⏳ Límite de uso alcanzado. Intenta en un momento.';
    } else if (error.message === 'Network Error') {
      errorMsg = '📡 Sin conexión a internet.';
    }

    return { text: errorMsg };
  }
};
